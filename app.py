import json
import logging
import os
import platform
import sqlite3
import subprocess
import threading
import time
from typing import Dict, Optional

import psutil
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("pulso")

app = FastAPI()
DB_PATH = os.environ.get("PULSO_DB", "metrics.db")
INTERVAL = int(os.environ.get("PULSO_INTERVAL", "10"))
PORT = int(os.environ.get("PULSO_PORT", "7331"))
RETENTION_SECONDS = int(os.environ.get("PULSO_RETENTION", "86400"))  # 24h

_lock = threading.Lock()
_net_prev = None
_disk_io_prev = None
_net_rates: Dict[str, float] = {"sent": 0.0, "recv": 0.0}
_disk_rates: Dict[str, Dict[str, float]] = {}
_latency_ms: Optional[float] = None
_cpu_percent: float = 0.0
_cpu_freq: Optional[float] = None
_load_avg: tuple = (0.0, 0.0, 0.0)
_ram: Optional[psutil._pslinux.svirtualmem] = None
_swap: Optional[psutil._pslinux.sswap] = None
_disk_pct: float = 0.0
_temp: Optional[float] = None
_boot_time: float = 0.0
_last_cleanup = 0


def init_db():
    with sqlite3.connect(DB_PATH) as c:
        c.execute(
            "CREATE TABLE IF NOT EXISTS metrics ("
            "ts INTEGER PRIMARY KEY, cpu REAL, ram REAL, temp REAL,"
            "net_sent REAL, net_recv REAL, disk REAL, load1 REAL, swap REAL)"
        )
        try:
            c.execute("ALTER TABLE metrics ADD COLUMN swap REAL")
        except Exception:
            pass


def cpu_temp() -> Optional[float]:
    try:
        temps = psutil.sensors_temperatures()
        for key in ("coretemp", "k10temp", "zenpower", "cpu_thermal", "acpitz"):
            if temps.get(key):
                return round(max(t.current for t in temps[key]), 1)
    except Exception as e:
        log.warning("cpu_temp failed: %s", e)
    return None


def ping_latency() -> Optional[float]:
    try:
        r = subprocess.run(
            ["ip", "route", "show", "default"],
            capture_output=True, text=True, timeout=2,
        )
        gw = r.stdout.split()[2] if r.returncode == 0 and len(r.stdout.split()) > 2 else "8.8.8.8"
        r = subprocess.run(
            ["ping", "-c", "1", "-W", "1", gw],
            capture_output=True, text=True, timeout=3,
        )
        if r.returncode == 0:
            for tok in r.stdout.split():
                if tok.startswith("time="):
                    return round(float(tok[5:]))
    except Exception as e:
        log.warning("ping_latency failed: %s", e)
    return None


def cleanup_db():
    try:
        cutoff = int(time.time()) - RETENTION_SECONDS
        with sqlite3.connect(DB_PATH) as c:
            c.execute("DELETE FROM metrics WHERE ts < ?", (cutoff,))
            c.execute("PRAGMA optimize")
        log.info("DB cleanup: removed rows older than %ds", RETENTION_SECONDS)
    except Exception as e:
        log.warning("DB cleanup failed: %s", e)


def collect():
    global _net_prev, _disk_io_prev, _net_rates, _disk_rates
    global _cpu_percent, _cpu_freq, _load_avg, _ram, _swap, _disk_pct, _temp, _boot_time, _last_cleanup

    cpu = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory()
    temp = cpu_temp()
    freq = psutil.cpu_freq()
    try:
        load1, load5, load15 = os.getloadavg()
    except Exception:
        load1 = load5 = load15 = 0.0

    net = psutil.net_io_counters()
    if _net_prev is not None:
        sent = max(0.0, (net.bytes_sent - _net_prev.bytes_sent) / INTERVAL / 125_000)
        recv = max(0.0, (net.bytes_recv - _net_prev.bytes_recv) / INTERVAL / 125_000)
        with _lock:
            _net_rates = {"sent": round(sent, 1), "recv": round(recv, 1)}
    _net_prev = net

    try:
        io = psutil.disk_io_counters(perdisk=True)
        if _disk_io_prev is not None:
            rates: Dict[str, Dict[str, float]] = {}
            for dev, curr in io.items():
                if dev in _disk_io_prev:
                    prev = _disk_io_prev[dev]
                    rates[dev] = {
                        "read": round(max(0.0, (curr.read_bytes - prev.read_bytes) / INTERVAL / 1e6), 1),
                        "write": round(max(0.0, (curr.write_bytes - prev.write_bytes) / INTERVAL / 1e6), 1),
                    }
            with _lock:
                _disk_rates = rates
        _disk_io_prev = io
    except Exception as e:
        log.warning("disk I/O collection failed: %s", e)

    disk_pct = psutil.disk_usage("/").percent
    swap = psutil.swap_memory()

    with _lock:
        nr = _net_rates.copy()
        _cpu_percent = round(cpu, 1)
        _cpu_freq = round(freq.current / 1000, 2) if freq else None
        _load_avg = (round(load1, 2), round(load5, 2), round(load15, 2))
        _ram = ram
        _swap = swap
        _disk_pct = disk_pct
        _temp = temp
        _boot_time = psutil.boot_time()

    swap_used_gb = round(swap.used / 1e9, 1)
    with sqlite3.connect(DB_PATH) as c:
        c.execute(
            "INSERT OR REPLACE INTO metrics VALUES (?,?,?,?,?,?,?,?,?)",
            (int(time.time()), round(cpu, 1), round(ram.percent, 1), temp,
             nr["sent"], nr["recv"], disk_pct, round(load1, 2), swap_used_gb),
        )


def collector():
    global _latency_ms, _last_cleanup
    ping_tick = 0
    while True:
        try:
            collect()
        except Exception as e:
            log.warning("collect failed: %s", e)
        ping_tick += 1
        if ping_tick >= 6:
            ping_tick = 0
            lat = ping_latency()
            with _lock:
                _latency_ms = lat
        now = int(time.time())
        if now - _last_cleanup >= 3600:
            _last_cleanup = now
            cleanup_db()
        time.sleep(INTERVAL)


@app.on_event("startup")
async def startup():
    init_db()
    cleanup_db()
    threading.Thread(target=collector, daemon=True).start()


@app.get("/api/system")
def api_system():
    hostname = platform.node()
    kernel = platform.release()
    os_name = platform.system()
    try:
        with open("/etc/os-release") as f:
            d: Dict[str, str] = {}
            for line in f:
                if "=" in line:
                    k, v = line.strip().split("=", 1)
                    d[k] = v.strip('"')
        os_name = f"{d.get('NAME', '')} {d.get('VERSION_ID', '')}".strip()
    except Exception as e:
        log.warning("/api/system os-release read failed: %s", e)
    cpu_model = platform.processor()
    try:
        with open("/proc/cpuinfo") as f:
            for line in f:
                if "model name" in line:
                    cpu_model = line.split(":", 1)[1].strip()
                    break
    except Exception as e:
        log.warning("/api/system cpuinfo read failed: %s", e)
    return {
        "hostname": hostname,
        "os": os_name,
        "kernel": kernel,
        "cpu_model": cpu_model,
        "cpu_cores": psutil.cpu_count(logical=False) or 1,
        "cpu_threads": psutil.cpu_count(logical=True) or 1,
    }


@app.get("/api/current")
def api_current():
    with _lock:
        cpu = _cpu_percent
        freq = _cpu_freq
        load1, load5, load15 = _load_avg
        ram = _ram
        swap = _swap
        temp = _temp
        nr = _net_rates.copy()
        lat = _latency_ms
        disk_pct = _disk_pct
        boot_time = _boot_time

    top_proc = None
    try:
        procs = []
        for p in psutil.process_iter(['pid', 'name']):
            try:
                pp = psutil.Process(p.pid)
                p_cpu = pp.cpu_percent(interval=0)
                procs.append({'pid': p.pid, 'name': p.info['name'], 'cpu': round(p_cpu, 1)})
            except Exception:
                pass
        if procs:
            procs.sort(key=lambda x: x['cpu'], reverse=True)
            top_proc = procs[0]
    except Exception as e:
        log.warning("/api/current process scan failed: %s", e)

    iface = "eth0"
    try:
        for name, st in sorted(psutil.net_if_stats().items()):
            if st.isup and name not in ("lo",) and not name.startswith(("docker", "veth", "br-", "virbr")):
                iface = name
                break
    except Exception as e:
        log.warning("/api/current iface detection failed: %s", e)

    net_io = psutil.net_io_counters()
    return {
        "cpu_percent": cpu,
        "cpu_freq_ghz": freq,
        "load_1": load1,
        "load_5": load5,
        "load_15": load15,
        "ram_used_gb": round(ram.used / 1e9, 1) if ram else 0,
        "ram_total_gb": int(round(ram.total / 1e9)) if ram else 0,
        "ram_percent": round(ram.percent, 1) if ram else 0,
        "ram_available_gb": round(ram.available / 1e9, 1) if ram else 0,
        "ram_cached_gb": round(getattr(ram, "cached", 0) / 1e9, 1) if ram else 0,
        "ram_buffers_gb": round(getattr(ram, "buffers", 0) / 1e9, 1) if ram else 0,
        "swap_used_gb": round(swap.used / 1e9, 1) if swap else 0,
        "swap_total_gb": int(round(swap.total / 1e9)) if swap else 0,
        "temp_cpu": temp,
        "net_sent_mbps": nr["sent"],
        "net_recv_mbps": nr["recv"],
        "net_iface": iface,
        "net_latency_ms": lat,
        "net_sent_total_gb": round(net_io.bytes_sent / 1e9, 2),
        "net_recv_total_gb": round(net_io.bytes_recv / 1e9, 2),
        "top_cpu_proc": top_proc,
        "disk_percent": disk_pct,
        "uptime_seconds": int(time.time() - boot_time) if boot_time else 0,
    }


@app.get("/api/disks")
def api_disks():
    with _lock:
        dr = _disk_rates.copy()
    seen: set = set()
    result = []
    for p in psutil.disk_partitions():
        if not p.mountpoint or p.fstype in (
            "squashfs", "tmpfs", "devtmpfs", "overlay", "", "iso9660"
        ):
            continue
        if p.device in seen:
            continue
        seen.add(p.device)
        try:
            u = psutil.disk_usage(p.mountpoint)
        except Exception:
            continue
        dev_name = p.device.split("/")[-1]
        base = dev_name.rstrip("0123456789")
        if base.endswith("p"):
            base = base[:-1]
        io = dr.get(dev_name) or dr.get(base) or {"read": 0.0, "write": 0.0}
        model = None
        try:
            r = subprocess.run(
                ["lsblk", "-nd", "-o", "MODEL", p.device],
                capture_output=True, text=True, timeout=2,
            )
            if r.returncode == 0:
                model = r.stdout.strip() or None
        except Exception as e:
            log.warning("lsblk failed for %s: %s", p.device, e)
        smart_ok = None
        disk_temp = None
        try:
            r = subprocess.run(
                ["smartctl", "-A", "-j", p.device],
                capture_output=True, text=True, timeout=5,
            )
            if r.returncode in (0, 4):
                data = json.loads(r.stdout)
                smart_ok = data.get("smart_status", {}).get("passed")
                disk_temp = data.get("temperature", {}).get("current")
                if disk_temp is None:
                    for attr in data.get("ata_smart_attributes", {}).get("table", []):
                        if "Temperature" in attr.get("name", ""):
                            disk_temp = attr.get("value")
                            break
        except Exception as e:
            log.warning("smartctl failed for %s: %s", p.device, e)
        result.append({
            "mountpoint": p.mountpoint,
            "device": p.device,
            "total_gb": round(u.total / 1e9, 2),
            "used_gb": round(u.used / 1e9, 2),
            "free_gb": round(u.free / 1e9, 2),
            "percent": round(u.percent, 1),
            "model": model,
            "temp": disk_temp,
            "smart_ok": smart_ok,
            "read_mbps": io["read"],
            "write_mbps": io["write"],
        })
    return result


@app.get("/api/cpu/cores")
def api_cpu_cores():
    percents = psutil.cpu_percent(percpu=True, interval=0.2)
    freqs = psutil.cpu_freq(percpu=True) or []
    return [
        {
            "core": i,
            "percent": round(p, 1),
            "freq_ghz": round(freqs[i].current / 1000, 2) if i < len(freqs) else None,
        }
        for i, p in enumerate(percents)
    ]


@app.get("/api/history")
def api_history(range: str = Query("1h")):
    ranges = {"1m": 60, "5m": 300, "15m": 900, "1h": 3600, "8h": 28800, "24h": 86400}
    since = int(time.time()) - ranges.get(range, 3600)
    with sqlite3.connect(DB_PATH) as c:
        rows = c.execute(
            "SELECT ts,cpu,ram,temp,net_sent,net_recv,disk,load1,swap "
            "FROM metrics WHERE ts>? ORDER BY ts",
            (since,),
        ).fetchall()
    return [
        {"ts": r[0], "cpu": r[1], "ram": r[2], "temp": r[3],
         "net_sent": r[4], "net_recv": r[5], "disk": r[6], "load": r[7],
         "swap": r[8] if len(r) > 8 and r[8] is not None else None}
        for r in rows
    ]


@app.get("/api/processes/top")
def api_processes_top():
    n = psutil.cpu_count()
    procs = []
    for p in psutil.process_iter(['pid', 'name']):
        try:
            pp = psutil.Process(p.pid)
            cpu = pp.cpu_percent(interval=0) / n
            mem = pp.memory_percent()
            procs.append({'pid': p.pid, 'name': p.info['name'], 'cpu': round(cpu, 1), 'mem': round(mem, 1)})
        except Exception:
            pass
    procs.sort(key=lambda x: x['cpu'], reverse=True)
    top_cpu = procs[:5]
    procs.sort(key=lambda x: x['mem'], reverse=True)
    top_mem = procs[:5]
    return {"top_cpu": top_cpu, "top_mem": top_mem}


@app.get("/api/docker")
def api_docker():
    try:
        r = subprocess.run(
            ["docker", "ps", "-a", "--format", "{{json .}}"],
            capture_output=True, text=True, timeout=5,
        )
        if r.returncode != 0:
            return {"available": False, "containers": []}
        containers = {}
        for line in r.stdout.strip().split("\n"):
            if not line.strip():
                continue
            d = json.loads(line)
            cid = d.get("ID", "")[:12]
            status = d.get("Status", "")
            is_up = status.lower().startswith("up")
            containers[cid] = {
                "name": d.get("Names", "").lstrip("/"),
                "state": "running" if is_up else "stopped",
                "cpu": 0, "mem": 0,
            }
        if any(c["state"] == "running" for c in containers.values()):
            r2 = subprocess.run(
                ["docker", "stats", "--no-stream", "--format", "{{json .}}"],
                capture_output=True, text=True, timeout=5,
            )
            if r2.returncode == 0:
                for line in r2.stdout.strip().split("\n"):
                    if not line.strip():
                        continue
                    d = json.loads(line)
                    cid = d.get("ID", "")
                    if cid in containers:
                        try: containers[cid]["cpu"] = float(d.get("CPUPerc", "0").rstrip("%"))
                        except ValueError: pass
                        try: containers[cid]["mem"] = float(d.get("MemPerc", "0").rstrip("%"))
                        except ValueError: pass
        return {"available": True, "containers": list(containers.values())}
    except Exception as e:
        log.warning("/api/docker failed: %s", e)
        return {"available": False, "containers": []}


app.mount("/", StaticFiles(directory="static", html=True), name="static")
