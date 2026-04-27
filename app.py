import json
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

app = FastAPI()
DB_PATH = "metrics.db"
INTERVAL = 10

_lock = threading.Lock()
_net_prev = None
_disk_io_prev = None
_net_rates: Dict[str, float] = {"sent": 0.0, "recv": 0.0}
_disk_rates: Dict[str, Dict[str, float]] = {}
_latency_ms: Optional[float] = None


def init_db():
    with sqlite3.connect(DB_PATH) as c:
        c.execute(
            "CREATE TABLE IF NOT EXISTS metrics ("
            "ts INTEGER PRIMARY KEY, cpu REAL, ram REAL, temp REAL,"
            "net_sent REAL, net_recv REAL, disk REAL, load1 REAL)"
        )


def cpu_temp() -> Optional[float]:
    try:
        temps = psutil.sensors_temperatures()
        for key in ("coretemp", "k10temp", "zenpower", "cpu_thermal", "acpitz"):
            if temps.get(key):
                return round(max(t.current for t in temps[key]), 1)
    except Exception:
        pass
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
    except Exception:
        pass
    return None


def collect():
    global _net_prev, _disk_io_prev, _net_rates, _disk_rates

    cpu = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory()
    temp = cpu_temp()

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
    except Exception:
        pass

    load1 = os.getloadavg()[0] if hasattr(os, "getloadavg") else 0.0
    disk_pct = psutil.disk_usage("/").percent

    with _lock:
        nr = _net_rates.copy()

    with sqlite3.connect(DB_PATH) as c:
        c.execute(
            "INSERT OR REPLACE INTO metrics VALUES (?,?,?,?,?,?,?,?)",
            (int(time.time()), round(cpu, 1), round(ram.percent, 1), temp,
             nr["sent"], nr["recv"], disk_pct, round(load1, 2)),
        )


def collector():
    global _latency_ms
    ping_tick = 0
    while True:
        try:
            collect()
        except Exception:
            pass
        ping_tick += 1
        if ping_tick >= 6:
            ping_tick = 0
            lat = ping_latency()
            with _lock:
                _latency_ms = lat
        time.sleep(INTERVAL)


@app.on_event("startup")
async def startup():
    init_db()
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
    except Exception:
        pass
    cpu_model = platform.processor()
    try:
        with open("/proc/cpuinfo") as f:
            for line in f:
                if "model name" in line:
                    cpu_model = line.split(":", 1)[1].strip()
                    break
    except Exception:
        pass
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
    cpu = psutil.cpu_percent(interval=0.2)
    freq = psutil.cpu_freq()
    try:
        load1, load5, load15 = os.getloadavg()
    except Exception:
        load1 = load5 = load15 = 0.0
    ram = psutil.virtual_memory()
    swap = psutil.swap_memory()
    temp = cpu_temp()
    with _lock:
        nr = _net_rates.copy()
        lat = _latency_ms

    iface = "eth0"
    try:
        for name, st in sorted(psutil.net_if_stats().items()):
            if st.isup and name not in ("lo",) and not name.startswith(("docker", "veth", "br-", "virbr")):
                iface = name
                break
    except Exception:
        pass

    return {
        "cpu_percent": round(cpu, 1),
        "cpu_freq_ghz": round(freq.current / 1000, 2) if freq else None,
        "load_1": round(load1, 2),
        "load_5": round(load5, 2),
        "load_15": round(load15, 2),
        "ram_used_gb": round(ram.used / 1e9, 1),
        "ram_total_gb": int(round(ram.total / 1e9)),
        "ram_percent": round(ram.percent, 1),
        "ram_available_gb": round(ram.available / 1e9, 1),
        "ram_cached_gb": round(getattr(ram, "cached", 0) / 1e9, 1),
        "ram_buffers_gb": round(getattr(ram, "buffers", 0) / 1e9, 1),
        "swap_used_gb": round(swap.used / 1e9, 1),
        "swap_total_gb": int(round(swap.total / 1e9)),
        "temp_cpu": temp,
        "net_sent_mbps": nr["sent"],
        "net_recv_mbps": nr["recv"],
        "net_iface": iface,
        "net_latency_ms": lat,
        "disk_percent": round(psutil.disk_usage("/").percent, 1),
        "uptime_seconds": int(time.time() - psutil.boot_time()),
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
        except Exception:
            pass
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
        except Exception:
            pass
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
    ranges = {"5m": 300, "15m": 900, "1h": 3600, "6h": 21600, "24h": 86400}
    since = int(time.time()) - ranges.get(range, 3600)
    with sqlite3.connect(DB_PATH) as c:
        rows = c.execute(
            "SELECT ts,cpu,ram,temp,net_sent,net_recv,disk,load1 "
            "FROM metrics WHERE ts>? ORDER BY ts",
            (since,),
        ).fetchall()
    return [
        {"ts": r[0], "cpu": r[1], "ram": r[2], "temp": r[3],
         "net_sent": r[4], "net_recv": r[5], "disk": r[6], "load": r[7]}
        for r in rows
    ]


app.mount("/", StaticFiles(directory="static", html=True), name="static")
