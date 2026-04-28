import { useMemo } from 'react';
import { cpuColor, diskColor, ramColor, swapColor, tempColor } from '../utils';

function fmt(gb) {
  return gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(0)} GB`;
}

function Bar({ pct, color, height = 5 }) {
  return (
    <div style={{ height, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
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

function HeroCard({ label, value, unit, color, sub, icon }) {
  return (
    <div className="ov-hero-card">
      <div className="ov-hero-top">
        {icon && <span className="ov-hero-icon">{icon}</span>}
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
  const stat = pct < 70 ? { label: 'Normal', clr: 'var(--ok)' } : pct < 90 ? { label: 'Alto', clr: 'var(--warn)' } : { label: 'Crítico', clr: 'var(--alert)' };
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <span className="ov-micro-label">CPU</span>
        <span className="ov-chip" style={{ background: stat.clr }}>{stat.label}</span>
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
            <span className="ov-side-num-sm">{load1?.toFixed(1) ?? '—'}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <div className="ov-micro-label">FREQ</div>
            <span className="ov-side-num-sm">{freq?.toFixed(2) ?? '—'}<span className="ov-side-unit-sm">GHz</span></span>
          </div>
        </div>
      </div>
      <Bar pct={pct} color={cpuColor(pct)} />
    </div>
  );
}

// ── RAM ──
function RAMCard({ data, onClick }) {
  const total = data?.ram_total_gb || 0;
  const avail = data?.ram_available_gb || 0;
  const used = total > 0 ? +(total - avail).toFixed(1) : (data?.ram_used_gb || 0);
  const pct = data?.ram_percent != null ? Math.round(data.ram_percent) : null;
  const pctColor = pct != null ? ramColor(pct) : 'var(--text)';
  const stat = pct < 70 ? { label: 'Normal', clr: 'var(--ok)' } : pct < 90 ? { label: 'Alto', clr: 'var(--warn)' } : { label: 'Crítico', clr: 'var(--alert)' };
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <span className="ov-micro-label">RAM</span>
        <span className="ov-chip" style={{ background: stat.clr }}>{stat.label}</span>
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
            <span className="ov-side-num">{total}<span className="ov-side-unit">GB</span></span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div className="ov-micro-label">AVAILABLE</div>
            <span className="ov-side-num-sm" style={{ color: ramColor(pct) }}>{avail.toFixed(1)}<span className="ov-side-unit-sm">GB</span></span>
          </div>
        </div>
      </div>
      <Bar pct={pct} color={pctColor} />
    </div>
  );
}

// ── SWAP ──
function SwapCard({ data, onClick }) {
  const swapUsed = data?.swap_used_gb || 0;
  const swapTotal = data?.swap_total_gb || 0;
  const swapPct = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;
  const pctColor = swapColor(swapPct);
  const stat = swapPct < 40 ? { label: 'Normal', clr: 'var(--ok)' } : swapPct < 70 ? { label: 'Alto', clr: 'var(--warn)' } : { label: 'Crítico', clr: 'var(--alert)' };
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <span className="ov-micro-label">SWAP</span>
        <span className="ov-chip" style={{ background: stat.clr }}>{stat.label}</span>
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
                <span className="ov-side-num">{swapTotal}<span className="ov-side-unit">GB</span></span>
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
  const stat = total < 1 ? { label: 'Bajo', clr: 'var(--ok)' } : total < 20 ? { label: 'Moderado', clr: 'var(--warn)' } : { label: 'Elevado', clr: 'var(--alert)' };
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <span className="ov-micro-label">NETWORK</span>
        <span className="ov-chip" style={{ background: stat.clr }}>{stat.label}</span>
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
      {spark?.recv && spark.recv.length > 1 && (
        <div className="ov-mini-chart">
          <svg viewBox="0 0 800 60" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {[0, 0.5, 1].map(r => (
              <line key={r} x1={0} y1={60 - r * 60} x2={800} y2={60 - r * 60} stroke="var(--border)" strokeWidth={0.5} />
            ))}
            {(() => {
              const max = Math.max(100, ...spark.recv);
              const pts = spark.recv.map((v, i) => ({
                x: (i / (spark.recv.length - 1)) * 800,
                y: 60 - Math.min(v, max) / max * 60,
              }));
              const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
              const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)},60 L ${pts[0].x.toFixed(1)},60 Z`;
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
  const total = useMemo(() => disks.reduce((s, d) => s + d.total_gb, 0), [disks]);
  const used = useMemo(() => disks.reduce((s, d) => s + d.used_gb, 0), [disks]);
  const diskPct = total > 0 ? Math.round(used / total * 100) : 0;
  const sorted = useMemo(() => [...disks].sort((a, b) => b.percent - a.percent), [disks]);
  const critical = disks.filter(d => d.percent >= 85).length;
  const stat = critical > 0 ? { label: `${critical} crítico${critical > 1 ? 's' : ''}`, clr: 'var(--alert)' } : diskPct >= 70 ? { label: 'Alto', clr: 'var(--warn)' } : { label: 'Normal', clr: 'var(--ok)' };

  return (
    <div className="card clickable" onClick={onClick}>
      <div className="ov-main-header">
        <span className="ov-micro-label">DISKS</span>
        <span className="ov-chip" style={{ background: stat.clr }}>{stat.label}</span>
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
          <span className="disk-mount" style={{ color: d.percent >= 85 ? 'var(--alert)' : 'var(--text-dim)' }}>
            {d.mountpoint}{d.percent >= 85 ? ' ⚠' : ''}
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
export default function Overview({ current, disks, sysInfo, onNavigate }) {
  const totalDisk = useMemo(() => disks.reduce((s, d) => s + d.total_gb, 0), [disks]);
  const usedDisk = useMemo(() => disks.reduce((s, d) => s + d.used_gb, 0), [disks]);
  const diskPct = totalDisk > 0 ? Math.round(usedDisk / totalDisk * 100) : 0;
  const ramTotal = current?.ram_total_gb || 0;
  const ramAvail = current?.ram_available_gb || 0;
  const ramUsed = ramTotal > 0 ? +(ramTotal - ramAvail).toFixed(1) : (current?.ram_used_gb || 0);
  const ramPct = current?.ram_percent != null ? Math.round(current.ram_percent) : 0;

  return (
    <div className="overview">
      {/* Hero row */}
      <div className="ov-hero-row">
        <HeroCard
          label="CPU"
          value={current?.cpu_percent != null ? Math.round(current.cpu_percent) : '—'}
          unit="%"
          color={cpuColor(current?.cpu_percent)}
          sub={current?.cpu_freq_ghz ? `${current.cpu_freq_ghz} GHz` : ''}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3M1 15h3M20 15h3"/></svg>}
        />
        <HeroCard
          label="RAM"
          value={ramPct}
          unit="%"
          color={ramColor(ramPct)}
          sub={`${ramUsed.toFixed(1)} / ${ramTotal} GB`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>}
        />
        <HeroCard
          label="Storage"
          value={diskPct}
          unit="%"
          color={diskColor(diskPct)}
          sub={`${fmt(usedDisk)} / ${fmt(totalDisk)}`}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        />
        <HeroCard
          label="Network"
          value={((current?.net_recv_mbps || 0) + (current?.net_sent_mbps || 0)).toFixed(1)}
          unit="Mb/s"
          color={current?.net_latency_ms != null && current.net_latency_ms > 100 ? 'var(--alert)' : 'var(--chart-net-recv)'}
          sub={current?.net_iface || ''}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>}
        />
      </div>

      {/* Gauge cards row */}
      <div className="ov-gauges-row">
        <CPUCard data={current} onClick={() => onNavigate('cpu')} />
        <RAMCard data={current} onClick={() => onNavigate('memory')} />
        <SwapCard data={current} onClick={() => onNavigate('memory')} />
      </div>

      {/* Disks + Network row */}
      <div className="ov-bottom-row">
        <DisksCard disks={disks} onClick={() => onNavigate('storage')} />
        <NetworkCard data={current} spark={spark} onClick={() => onNavigate('network')} />
      </div>
    </div>
  );
}
