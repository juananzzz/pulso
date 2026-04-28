import { Cpu, MemoryStick, ArrowRightLeft, HardDrive, Network, Activity } from 'lucide-react';
import { cpuColor, diskColor, ramColor, swapColor, tempColor } from '../utils';

function fmt(gb) {
  return gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(0)} GB`;
}

function Bar({ pct, color, height = 5 }) {
  return (
    <div style={{ height, background: 'var(--border)', borderRadius: 3, margin: '8px 0', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 3,
        background: color,
        width: `${Math.min(pct || 0, 100)}%`,
        transition: 'width 0.5s',
      }} />
    </div>
  );
}

function Gauge({ pct, color, size = 100, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(pct || 0, 100) / 100) * circ;
  const fs = size * 0.28;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill="var(--text)" fontSize={fs} fontWeight={700} fontFamily="var(--num-font)">
        {pct != null ? `${Math.round(pct)}%` : '—'}
      </text>
    </svg>
  );
}

function Chip({ text, color }) {
  return <span className="ov-chip" style={{ background: color }}>{text}</span>;
}

// ── Hero summary cards ──
function HeroCard({ icon, label, value, unit, color, sub }) {
  return (
    <div className="ov-hero-card">
      <div className="ov-hero-top">
        <span className="ov-hero-icon">{icon}</span>
        <span className="ov-hero-label">{label}</span>
      </div>
      <div className="ov-hero-val" style={{ color }}>{value}<span className="ov-hero-unit">{unit}</span></div>
      {sub && <div className="ov-hero-sub">{sub}</div>}
    </div>
  );
}

// ── CPU ──
function CPUCard({ data, onClick }) {
  const pct = data?.cpu_percent != null ? Math.round(data.cpu_percent) : null;
  const freq = data?.cpu_freq_ghz;
  const temp = data?.temp_cpu;
  const load1 = data?.load_1;
  const chip = pct < 70 ? 'Normal' : pct < 90 ? 'Alto' : 'Crítico';
  const chipColor = pct < 70 ? 'var(--ok)' : pct < 90 ? 'var(--warn)' : 'var(--alert)';
  return (
    <div className="card clickable ov-main-card" onClick={onClick} style={{ position: 'relative' }}>
      <div className="ov-main-header">
        <span className="ov-micro-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={14} /> CPU
        </span>
        <Chip text={chip} color={chipColor} />
      </div>
      <div className="ov-gauge-row" style={{ flex: 1 }}>
        <Gauge pct={pct} color={cpuColor(pct)} size={100} stroke={7} />
        <div className="ov-gauge-side">
          {temp != null && (
            <div>
              <div className="ov-micro-label">TEMP</div>
              <span className="ov-side-num" style={{ color: tempColor(temp) }}>{temp}<span className="ov-side-unit">°C</span></span>
            </div>
          )}
          <div style={{ marginTop: 6 }}>
            <div className="ov-micro-label">LOAD</div>
            <span className="ov-side-num" style={{ fontSize: '1.3rem' }}>{load1?.toFixed(1) ?? '—'}</span>
          </div>
          <div style={{ marginTop: 2 }}>
            <div className="ov-micro-label">FREQ</div>
            <span className="ov-side-num" style={{ fontSize: '1rem' }}>{freq?.toFixed(2) ?? '—'}<span className="ov-side-unit">GHz</span></span>
          </div>
        </div>
      </div>
      <Bar pct={pct} color={cpuColor(pct)} />
    </div>
  );
}

// ── RAM ──
function RAMCard({ data, onClick }) {
  const total   = data?.ram_total_gb  || 0;
  const avail   = data?.ram_available_gb || 0;
  const used    = total > 0 ? +(total - avail).toFixed(1) : (data?.ram_used_gb || 0);
  const pct     = data?.ram_percent != null ? Math.round(data.ram_percent) : null;
  const pctColor = pct != null ? ramColor(pct) : 'var(--text)';
  const chip = pct < 70 ? 'Normal' : pct < 90 ? 'Alto' : 'Crítico';
  const chipColor = pct < 70 ? 'var(--ok)' : pct < 90 ? 'var(--warn)' : 'var(--alert)';
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <span className="ov-micro-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MemoryStick size={14} /> RAM
        </span>
        <Chip text={chip} color={chipColor} />
      </div>
      <div className="ov-gauge-row" style={{ flex: 1 }}>
        <Gauge pct={pct} color={pctColor} size={100} stroke={7} />
        <div className="ov-gauge-side">
          <div>
            <div className="ov-micro-label">USED</div>
            <span className="ov-side-num" style={{ color: pctColor }}>{used.toFixed(1)}<span className="ov-side-unit">GB</span></span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div className="ov-micro-label">TOTAL</div>
            <span className="ov-side-num" style={{ fontSize: '1.3rem' }}>{total}<span className="ov-side-unit">GB</span></span>
          </div>
          <div style={{ marginTop: 2 }}>
            <div className="ov-micro-label">AVAILABLE</div>
            <span className="ov-side-num" style={{ fontSize: '1rem', color: ramColor(pct) }}>{avail.toFixed(1)}<span className="ov-side-unit">GB</span></span>
          </div>
        </div>
      </div>
      <Bar pct={pct} color={pctColor} />
    </div>
  );
}

// ── SWAP ──
function SwapCard({ data, onClick }) {
  const swapUsed  = data?.swap_used_gb  || 0;
  const swapTotal = data?.swap_total_gb || 0;
  const swapPct   = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;
  const pctColor  = swapColor(swapPct);
  const chip = swapPct < 40 ? 'Normal' : swapPct < 70 ? 'Alto' : 'Crítico';
  const chipColor = swapPct < 40 ? 'var(--ok)' : swapPct < 70 ? 'var(--warn)' : 'var(--alert)';
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <span className="ov-micro-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowRightLeft size={14} /> SWAP
        </span>
        <Chip text={chip} color={chipColor} />
      </div>
      {swapTotal > 0 ? (
        <>
          <div className="ov-gauge-row" style={{ flex: 1 }}>
            <Gauge pct={swapPct} color={pctColor} size={100} stroke={7} />
            <div className="ov-gauge-side">
              <div>
                <div className="ov-micro-label">USED</div>
                <span className="ov-side-num" style={{ color: pctColor }}>{swapUsed.toFixed(1)}<span className="ov-side-unit">GB</span></span>
              </div>
              <div style={{ marginTop: 6 }}>
                <div className="ov-micro-label">TOTAL</div>
                <span className="ov-side-num" style={{ fontSize: '1.3rem' }}>{swapTotal}<span className="ov-side-unit">GB</span></span>
              </div>
            </div>
          </div>
          <Bar pct={swapPct} color={pctColor} />
        </>
      ) : (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
          No swap configured
        </div>
      )}
    </div>
  );
}

// ── Network ──
function NetworkCard({ data, spark, onClick }) {
  const recv = data?.net_recv_mbps ?? 0;
  const sent = data?.net_sent_mbps ?? 0;
  const total = recv + sent;
  const chip = total < 1 ? 'Bajo' : total < 20 ? 'Moderado' : 'Elevado';
  const chipColor = total < 1 ? 'var(--ok)' : total < 20 ? 'var(--warn)' : 'var(--alert)';
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <span className="ov-micro-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Network size={14} /> NETWORK
        </span>
        <Chip text={chip} color={chipColor} />
      </div>
      <div className="ov-net-wrapper">
        <div className="ov-net-block">
          <div className="ov-micro-label">↓ DOWNLOAD</div>
          <span className="ov-stat-big" style={{ color: 'var(--chart-net-recv)' }}>{recv.toFixed(1)}</span>
          <span className="ov-stat-unit">Mb/s</span>
        </div>
        <div className="ov-net-block">
          <div className="ov-micro-label">↑ UPLOAD</div>
          <span className="ov-stat-big" style={{ color: 'var(--chart-net-sent)' }}>{sent.toFixed(1)}</span>
          <span className="ov-stat-unit">Mb/s</span>
        </div>
      </div>
      {spark?.recv?.length > 1 && (
        <div className="ov-mini-chart">
          <svg viewBox="0 0 800 50" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {(() => {
              const max = Math.max(100, ...spark.recv);
              const pts = spark.recv.map((v, i) => ({
                x: (i / (spark.recv.length - 1)) * 800,
                y: 50 - Math.min(v, max) / max * 50,
              }));
              const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
              const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)},50 L ${pts[0].x.toFixed(1)},50 Z`;
              return (
                <>
                  <path d={area} fill="var(--chart-net-recv)" fillOpacity={0.08} />
                  <path d={d} fill="none" stroke="var(--chart-net-recv)" strokeWidth={1.5} strokeLinejoin="round" />
                </>
              );
            })()}
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Disks ──
function DisksCard({ disks, onClick }) {
  const total = disks.reduce((s, d) => s + d.total_gb, 0);
  const used = disks.reduce((s, d) => s + d.used_gb, 0);
  const diskPct = total > 0 ? Math.round(used / total * 100) : 0;
  const sorted = [...disks].sort((a, b) => b.percent - a.percent);
  const critical = disks.filter(d => d.percent >= 85).length;
  const chip = critical > 0 ? `${critical} crítico${critical > 1 ? 's' : ''}` : diskPct >= 70 ? 'Alto' : 'Normal';
  const chipColor = critical > 0 ? 'var(--alert)' : diskPct >= 70 ? 'var(--warn)' : 'var(--ok)';

  return (
    <div className="card clickable" onClick={onClick}>
      <div className="ov-main-header">
        <span className="ov-micro-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HardDrive size={14} /> DISKS
        </span>
        <Chip text={chip} color={chipColor} />
      </div>
      <div className="disk-row" style={{ marginTop: 0 }}>
        <span className="disk-mount" style={{ fontWeight: 600, color: 'var(--text)' }}>TOTAL</span>
        <div className="disk-bar-wrap" style={{ height: 6 }}>
          <div className="disk-bar" style={{ width: `${diskPct}%`, background: diskColor(diskPct) }} />
        </div>
        <span className="ov-bar-label">{fmt(used)} / {fmt(total)}</span>
      </div>
      {sorted.map(d => (
        <div className="disk-row" key={d.mountpoint}>
          <span className="disk-mount" style={{ color: d.percent >= 85 ? 'var(--alert)' : undefined }}>
            {d.mountpoint}
          </span>
          <div className="disk-bar-wrap">
            <div className="disk-bar" style={{ width: `${d.percent}%`, background: diskColor(d.percent) }} />
          </div>
          <span className="ov-bar-label">{d.percent}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Overview ──
export default function Overview({ current, disks, sysInfo, spark, onNavigate }) {
  const diskTotal = disks.reduce((s, d) => s + d.total_gb, 0);
  const diskUsed = disks.reduce((s, d) => s + d.used_gb, 0);
  const diskPct = diskTotal > 0 ? Math.round(diskUsed / diskTotal * 100) : 0;
  const ramTotal = current?.ram_total_gb || 0;
  const ramAvail = current?.ram_available_gb || 0;
  const ramUsed = ramTotal > 0 ? +(ramTotal - ramAvail).toFixed(1) : (current?.ram_used_gb || 0);
  const ramPct = current?.ram_percent != null ? Math.round(current.ram_percent) : 0;
  const netTotal = ((current?.net_recv_mbps || 0) + (current?.net_sent_mbps || 0));

  return (
    <div className="overview">
      <div className="ov-hero-row">
        <HeroCard icon={<Cpu size={16} />} label="CPU" value={current?.cpu_percent != null ? Math.round(current.cpu_percent) : '—'} unit="%" color={cpuColor(current?.cpu_percent)} sub={current?.cpu_freq_ghz ? `${current.cpu_freq_ghz} GHz` : ''} />
        <HeroCard icon={<MemoryStick size={16} />} label="RAM" value={ramPct} unit="%" color={ramColor(ramPct)} sub={`${ramUsed.toFixed(1)} / ${ramTotal} GB`} />
        <HeroCard icon={<HardDrive size={16} />} label="Storage" value={diskPct} unit="%" color={diskColor(diskPct)} sub={`${fmt(diskUsed)} / ${fmt(diskTotal)}`} />
        <HeroCard icon={<Activity size={16} />} label="Network" value={netTotal.toFixed(1)} unit="Mb/s" color={current?.net_latency_ms > 100 ? 'var(--alert)' : 'var(--chart-net-recv)'} sub={current?.net_iface || ''} />
      </div>
      <div className="ov-middle-row">
        <CPUCard data={current} onClick={() => onNavigate('cpu')} />
        <RAMCard data={current} onClick={() => onNavigate('memory')} />
        <SwapCard data={current} onClick={() => onNavigate('memory')} />
      </div>
      <div className="ov-bottom-row">
        <DisksCard disks={disks} onClick={() => onNavigate('storage')} />
        <NetworkCard data={current} spark={spark} onClick={() => onNavigate('network')} />
      </div>
    </div>
  );
}
