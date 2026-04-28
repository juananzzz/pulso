import { Cpu, MemoryStick, ArrowRightLeft, HardDrive, Network, Activity } from 'lucide-react';
import { cpuColor, diskColor, ramColor, swapColor, tempColor } from '../utils';

function fmt(gb) {
  return gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(0)} GB`;
}

function Bar({ pct, color, height = 5, big }) {
  return (
    <div style={{ height: big ? 12 : height, background: 'var(--border)', borderRadius: big ? 6 : 3, margin: big ? '12px 0' : '8px 0', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: big ? 6 : 3,
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

function Chip({ text, color, big }) {
  return <span className="ov-chip" style={{ background: color, fontSize: big ? '0.82rem' : undefined, padding: big ? '3px 10px' : undefined }}>{text}</span>;
}

function HeroCard({ icon, label, value, unit, color, sub, big }) {
  return (
    <div className={`ov-hero-card${big ? ' ov-hero-card-big' : ''}`}>
      <div className="ov-hero-top">
        <span className="ov-hero-icon">{icon}</span>
        <span className="ov-hero-label">{label}</span>
      </div>
      <div className="ov-hero-val" style={{ color, fontSize: big ? '2.2rem' : undefined }}>{value}<span className="ov-hero-unit">{unit}</span></div>
      {sub && <div className="ov-hero-sub">{sub}</div>}
    </div>
  );
}

/* ── Simple mode ── */
function SimpleView({ current, disks, sysInfo, onNavigate }) {
  const cpuPct = current?.cpu_percent != null ? Math.round(current.cpu_percent) : null;
  const ramTotal = current?.ram_total_gb || 0;
  const ramAvail = current?.ram_available_gb || 0;
  const ramUsed = ramTotal > 0 ? +(ramTotal - ramAvail).toFixed(1) : (current?.ram_used_gb || 0);
  const ramPct = current?.ram_percent != null ? Math.round(current.ram_percent) : 0;
  const diskTotal = disks.reduce((s, d) => s + d.total_gb, 0);
  const diskUsed = disks.reduce((s, d) => s + d.used_gb, 0);
  const diskPct = diskTotal > 0 ? Math.round(diskUsed / diskTotal * 100) : 0;
  const netTotal = ((current?.net_recv_mbps || 0) + (current?.net_sent_mbps || 0));
  const cpuChip = cpuPct < 70 ? 'Stable' : cpuPct < 90 ? 'High' : 'Critical';
  const cpuChipCol = cpuPct < 70 ? 'var(--ok)' : cpuPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const ramChip = ramPct < 70 ? 'Stable' : ramPct < 90 ? 'High' : 'Critical';
  const ramChipCol = ramPct < 70 ? 'var(--ok)' : ramPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const diskChip = diskPct < 70 ? 'Stable' : diskPct < 85 ? 'High' : 'Critical';
  const diskChipCol = diskPct < 70 ? 'var(--ok)' : diskPct < 85 ? 'var(--warn)' : 'var(--alert)';
  const netChip = netTotal < 1 ? 'Low' : netTotal < 20 ? 'Moderate' : 'High';
  const netChipCol = netTotal < 1 ? 'var(--ok)' : netTotal < 20 ? 'var(--warn)' : 'var(--alert)';
  return (
    <div className="ov-simple">
      <div className="ov-simple-hero">
        <div className="ov-simple-card" onClick={() => onNavigate('cpu')}>
          <div className="ov-simple-card-header"><Cpu size={20} /> CPU</div>
          <div className="ov-simple-card-main" style={{ color: cpuColor(cpuPct) }}>
            {cpuPct ?? '—'}<span className="ov-simple-unit">%</span>
          </div>
          <Bar pct={cpuPct} color={cpuColor(cpuPct)} height={12} big />
          <div className="ov-simple-card-footer"><Chip text={cpuChip} color={cpuChipCol} big /></div>
        </div>
        <div className="ov-simple-card" onClick={() => onNavigate('memory')}>
          <div className="ov-simple-card-header"><MemoryStick size={20} /> RAM</div>
          <div className="ov-simple-card-main" style={{ color: ramColor(ramPct) }}>
            {ramPct}<span className="ov-simple-unit">%</span>
          </div>
          <Bar pct={ramPct} color={ramColor(ramPct)} height={12} big />
          <div className="ov-simple-card-footer">{ramUsed.toFixed(1)} / {ramTotal} GB &middot; <Chip text={ramChip} color={ramChipCol} big /></div>
        </div>
        <div className="ov-simple-card" onClick={() => onNavigate('storage')}>
          <div className="ov-simple-card-header"><HardDrive size={20} /> Storage</div>
          <div className="ov-simple-card-main" style={{ color: diskColor(diskPct) }}>
            {diskPct}<span className="ov-simple-unit">%</span>
          </div>
          <Bar pct={diskPct} color={diskColor(diskPct)} height={12} big />
          <div className="ov-simple-card-footer">{fmt(diskUsed)} / {fmt(diskTotal)} &middot; <Chip text={diskChip} color={diskChipCol} big /></div>
        </div>
        <div className="ov-simple-card">
          <div className="ov-simple-card-header"><Activity size={20} /> Network</div>
          <div className="ov-simple-card-main" style={{ color: netChipCol }}>
            {netTotal.toFixed(1)}<span className="ov-simple-unit">Mb/s</span>
          </div>
          <div className="ov-simple-net-detail">
            <span>↓ {current?.net_recv_mbps?.toFixed(1) ?? '—'} Mb/s</span>
            <span>↑ {current?.net_sent_mbps?.toFixed(1) ?? '—'} Mb/s</span>
          </div>
          <div className="ov-simple-card-footer"><Chip text={netChip} color={netChipCol} big /></div>
        </div>
      </div>
    </div>
  );
}

/* ── Intermediate mode ── */
function IntermediateView({ current, disks, sysInfo, spark, onNavigate }) {
  const cpuPct = current?.cpu_percent != null ? Math.round(current.cpu_percent) : null;
  const freq = current?.cpu_freq_ghz;
  const temp = current?.temp_cpu;
  const load1 = current?.load_1;
  const ramTotal = current?.ram_total_gb || 0;
  const ramAvail = current?.ram_available_gb || 0;
  const ramUsed = ramTotal > 0 ? +(ramTotal - ramAvail).toFixed(1) : (current?.ram_used_gb || 0);
  const ramPct = current?.ram_percent != null ? Math.round(current.ram_percent) : 0;
  const swapUsed = current?.swap_used_gb || 0;
  const swapTotal = current?.swap_total_gb || 0;
  const swapPct = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;
  const diskTotal = disks.reduce((s, d) => s + d.total_gb, 0);
  const diskUsed = disks.reduce((s, d) => s + d.used_gb, 0);
  const diskPct = diskTotal > 0 ? Math.round(diskUsed / diskTotal * 100) : 0;
  const netTotal = ((current?.net_recv_mbps || 0) + (current?.net_sent_mbps || 0));
  const criticalDisks = disks.filter(d => d.percent >= 85).length;

  const cpuChip = cpuPct < 70 ? 'Normal' : cpuPct < 90 ? 'High' : 'Critical';
  const cpuChipCol = cpuPct < 70 ? 'var(--ok)' : cpuPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const ramChip = ramPct < 70 ? 'Normal' : ramPct < 90 ? 'High' : 'Critical';
  const ramChipCol = ramPct < 70 ? 'var(--ok)' : ramPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const swapChip = swapPct < 40 ? 'Normal' : swapPct < 70 ? 'High' : 'Critical';
  const swapChipCol = swapPct < 40 ? 'var(--ok)' : swapPct < 70 ? 'var(--warn)' : 'var(--alert)';
  const diskChip = criticalDisks > 0 ? `${criticalDisks} critical` : diskPct >= 70 ? 'High' : 'Normal';
  const diskChipCol = criticalDisks > 0 ? 'var(--alert)' : diskPct >= 70 ? 'var(--warn)' : 'var(--ok)';
  const netChip = netTotal < 1 ? 'Low' : netTotal < 20 ? 'Moderate' : 'High';
  const netChipCol = netTotal < 1 ? 'var(--ok)' : netTotal < 20 ? 'var(--warn)' : 'var(--alert)';

  return (
    <>
      <div className="ov-hero-row">
        <HeroCard icon={<Cpu size={16} />} label="CPU" value={cpuPct ?? '—'} unit="%" color={cpuColor(cpuPct)} sub={freq ? `${freq} GHz` : ''} />
        <HeroCard icon={<MemoryStick size={16} />} label="RAM" value={ramPct} unit="%" color={ramColor(ramPct)} sub={`${ramUsed.toFixed(1)} / ${ramTotal} GB`} />
        <HeroCard icon={<HardDrive size={16} />} label="Storage" value={diskPct} unit="%" color={diskColor(diskPct)} sub={`${fmt(diskUsed)} / ${fmt(diskTotal)}`} />
        <HeroCard icon={<Network size={16} />} label="Network" value={netTotal.toFixed(1)} unit="Mb/s" color={current?.net_latency_ms > 100 ? 'var(--alert)' : 'var(--chart-net-recv)'} sub={current?.net_iface || ''} />
      </div>
      <div className="ov-middle-row">
        <div className="card clickable ov-main-card" onClick={() => onNavigate('cpu')}>
          <div className="ov-main-header">
            <span className="ov-micro-label"><Cpu size={14} /> CPU</span>
            <Chip text={cpuChip} color={cpuChipCol} />
          </div>
          <div className="ov-gauge-row">
            <Gauge pct={cpuPct} color={cpuColor(cpuPct)} size={100} stroke={7} />
            <div className="ov-gauge-side">
              <div><div className="ov-micro-label">LOAD</div><span className="ov-side-num">{load1?.toFixed(1) ?? '—'}</span></div>
              <div style={{ marginTop: 6 }}><div className="ov-micro-label">FREQ</div><span className="ov-side-num">{freq?.toFixed(2) ?? '—'}<span className="ov-side-unit">GHz</span></span></div>
            </div>
          </div>
          <Bar pct={cpuPct} color={cpuColor(cpuPct)} />
        </div>
        <div className="card clickable ov-main-card" onClick={() => onNavigate('memory')}>
          <div className="ov-main-header">
            <span className="ov-micro-label"><MemoryStick size={14} /> RAM</span>
            <Chip text={ramChip} color={ramChipCol} />
          </div>
          <div className="ov-gauge-row">
            <Gauge pct={ramPct} color={ramColor(ramPct)} size={100} stroke={7} />
            <div className="ov-gauge-side">
              <div><div className="ov-micro-label">USED</div><span className="ov-side-num" style={{ color: ramColor(ramPct) }}>{ramUsed.toFixed(1)}<span className="ov-side-unit">GB</span></span></div>
              <div style={{ marginTop: 6 }}><div className="ov-micro-label">TOTAL</div><span className="ov-side-num">{ramTotal}<span className="ov-side-unit">GB</span></span></div>
              <div style={{ marginTop: 2 }}><div className="ov-micro-label">AVAILABLE</div><span className="ov-side-num" style={{ fontSize: '1rem' }}>{ramAvail.toFixed(1)}<span className="ov-side-unit">GB</span></span></div>
            </div>
          </div>
          <Bar pct={ramPct} color={ramColor(ramPct)} />
        </div>
        <div className="card clickable ov-main-card" onClick={() => onNavigate('memory')}>
          <div className="ov-main-header">
            <span className="ov-micro-label"><ArrowRightLeft size={14} /> SWAP</span>
            <Chip text={swapChip} color={swapChipCol} />
          </div>
          {swapTotal > 0 ? (
            <>
              <div className="ov-gauge-row">
                <Gauge pct={swapPct} color={swapColor(swapPct)} size={100} stroke={7} />
                <div className="ov-gauge-side">
                  <div><div className="ov-micro-label">USED</div><span className="ov-side-num" style={{ color: swapColor(swapPct) }}>{swapUsed.toFixed(1)}<span className="ov-side-unit">GB</span></span></div>
                  <div style={{ marginTop: 6 }}><div className="ov-micro-label">TOTAL</div><span className="ov-side-num">{swapTotal}<span className="ov-side-unit">GB</span></span></div>
                </div>
              </div>
              <Bar pct={swapPct} color={swapColor(swapPct)} />
            </>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>No swap configured</div>
          )}
        </div>
      </div>
      <div className="ov-bottom-row">
        <div className="card clickable" onClick={() => onNavigate('storage')}>
          <div className="ov-main-header">
            <span className="ov-micro-label"><HardDrive size={14} /> DISKS</span>
            <Chip text={diskChip} color={diskChipCol} />
          </div>
          <div className="disk-row" style={{ marginTop: 0 }}>
            <span className="disk-mount" style={{ fontWeight: 600, color: 'var(--text)' }}>TOTAL</span>
            <div className="disk-bar-wrap" style={{ height: 6 }}><div className="disk-bar" style={{ width: `${diskPct}%`, background: diskColor(diskPct) }} /></div>
            <span className="ov-bar-label">{fmt(diskUsed)} / {fmt(diskTotal)}</span>
          </div>
          {disks.sort((a, b) => b.percent - a.percent).map(d => (
            <div className="disk-row" key={d.mountpoint}>
              <span className="disk-mount" style={{ color: d.percent >= 85 ? 'var(--alert)' : undefined }}>{d.mountpoint}</span>
              <div className="disk-bar-wrap"><div className="disk-bar" style={{ width: `${d.percent}%`, background: diskColor(d.percent) }} /></div>
              <span className="ov-bar-label">{d.percent}%</span>
            </div>
          ))}
        </div>
        <div className="card clickable ov-main-card" onClick={() => onNavigate('network')}>
          <div className="ov-main-header">
            <span className="ov-micro-label"><Network size={14} /> NETWORK</span>
            <Chip text={netChip} color={netChipCol} />
          </div>
          <div className="ov-net-wrapper">
            <div className="ov-net-block">
              <div className="ov-micro-label">↓ DOWNLOAD</div>
              <span className="ov-stat-big" style={{ color: 'var(--chart-net-recv)' }}>{current?.net_recv_mbps?.toFixed(1) ?? '—'}</span>
              <span className="ov-stat-unit">Mb/s</span>
            </div>
            <div className="ov-net-block">
              <div className="ov-micro-label">↑ UPLOAD</div>
              <span className="ov-stat-big" style={{ color: 'var(--chart-net-sent)' }}>{current?.net_sent_mbps?.toFixed(1) ?? '—'}</span>
              <span className="ov-stat-unit">Mb/s</span>
            </div>
          </div>
          {spark?.recv?.length > 1 && (
            <div className="ov-mini-chart">
              <svg viewBox="0 0 800 50" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {(() => {
                  const max = Math.max(100, ...spark.recv);
                  const pts = spark.recv.map((v, i) => ({ x: (i / (spark.recv.length - 1)) * 800, y: 50 - Math.min(v, max) / max * 50 }));
                  const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                  const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)},50 L ${pts[0].x.toFixed(1)},50 Z`;
                  return (<><path d={area} fill="var(--chart-net-recv)" fillOpacity={0.08} /><path d={d} fill="none" stroke="var(--chart-net-recv)" strokeWidth={1.5} strokeLinejoin="round" /></>);
                })()}
              </svg>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Detailed mode ── */
function DetailedView({ current, disks, sysInfo, spark, onNavigate }) {
  const cpuPct = current?.cpu_percent != null ? Math.round(current.cpu_percent) : null;
  const freq = current?.cpu_freq_ghz;
  const temp = current?.temp_cpu;
  const load1 = current?.load_1;
  const load5 = current?.load_5;
  const load15 = current?.load_15;
  const ramTotal = current?.ram_total_gb || 0;
  const ramAvail = current?.ram_available_gb || 0;
  const ramUsed = ramTotal > 0 ? +(ramTotal - ramAvail).toFixed(1) : (current?.ram_used_gb || 0);
  const ramPct = current?.ram_percent != null ? Math.round(current.ram_percent) : 0;
  const ramCached = current?.ram_cached_gb || 0;
  const ramBuf = current?.ram_buffers_gb || 0;
  const swapUsed = current?.swap_used_gb || 0;
  const swapTotal = current?.swap_total_gb || 0;
  const swapPct = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;
  const diskTotal = disks.reduce((s, d) => s + d.total_gb, 0);
  const diskUsed = disks.reduce((s, d) => s + d.used_gb, 0);
  const diskPct = diskTotal > 0 ? Math.round(diskUsed / diskTotal * 100) : 0;
  const netTotal = ((current?.net_recv_mbps || 0) + (current?.net_sent_mbps || 0));
  const criticalDisks = disks.filter(d => d.percent >= 85).length;

  const cpuChip = cpuPct < 70 ? 'Normal' : cpuPct < 90 ? 'High' : 'Critical';
  const cpuChipCol = cpuPct < 70 ? 'var(--ok)' : cpuPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const ramChip = ramPct < 70 ? 'Normal' : ramPct < 90 ? 'High' : 'Critical';
  const ramChipCol = ramPct < 70 ? 'var(--ok)' : ramPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const swapChip = swapPct < 40 ? 'Normal' : swapPct < 70 ? 'High' : 'Critical';
  const swapChipCol = swapPct < 40 ? 'var(--ok)' : swapPct < 70 ? 'var(--warn)' : 'var(--alert)';
  const diskChip = criticalDisks > 0 ? `${criticalDisks} critical` : diskPct >= 70 ? 'High' : 'Normal';
  const diskChipCol = criticalDisks > 0 ? 'var(--alert)' : diskPct >= 70 ? 'var(--warn)' : 'var(--ok)';
  const netChip = netTotal < 1 ? 'Low' : netTotal < 20 ? 'Moderate' : 'High';
  const netChipCol = netTotal < 1 ? 'var(--ok)' : netTotal < 20 ? 'var(--warn)' : 'var(--alert)';

  return (
    <>
      <div className="ov-hero-row">
        <HeroCard icon={<Cpu size={16} />} label="CPU" value={cpuPct ?? '—'} unit="%" color={cpuColor(cpuPct)} sub={`${freq ? `${freq} GHz` : ''} · ${temp ? `${temp}°C` : ''}`} />
        <HeroCard icon={<MemoryStick size={16} />} label="RAM" value={ramPct} unit="%" color={ramColor(ramPct)} sub={`${ramUsed.toFixed(1)} / ${ramTotal} GB · ${ramAvail.toFixed(1)} GB free`} />
        <HeroCard icon={<HardDrive size={16} />} label="Storage" value={diskPct} unit="%" color={diskColor(diskPct)} sub={`${fmt(diskUsed)} / ${fmt(diskTotal)} · ${disks.length} disks`} />
        <HeroCard icon={<Network size={16} />} label="Network" value={netTotal.toFixed(1)} unit="Mb/s" color={current?.net_latency_ms > 100 ? 'var(--alert)' : 'var(--chart-net-recv)'} sub={`${current?.net_iface || ''} · ${current?.net_latency_ms ? `${current.net_latency_ms} ms` : ''}`} />
      </div>
      <div className="ov-middle-row">
        <div className="card clickable ov-main-card" onClick={() => onNavigate('cpu')}>
          <div className="ov-main-header"><span className="ov-micro-label"><Cpu size={14} /> CPU</span><Chip text={cpuChip} color={cpuChipCol} /></div>
          <div className="ov-gauge-row">
            <Gauge pct={cpuPct} color={cpuColor(cpuPct)} size={100} stroke={7} />
            <div className="ov-gauge-side">
              <div><div className="ov-micro-label">TEMP</div><span className="ov-side-num" style={{ color: tempColor(temp) }}>{temp ?? '—'}<span className="ov-side-unit">°C</span></span></div>
              <div style={{ marginTop: 6 }}><div className="ov-micro-label">FREQ</div><span className="ov-side-num">{freq?.toFixed(2) ?? '—'}<span className="ov-side-unit">GHz</span></span></div>
              <div style={{ marginTop: 6 }}><div className="ov-micro-label">LOAD</div><span className="ov-side-num" style={{ fontSize: '1.1rem' }}>{load1?.toFixed(1) ?? '—'}<span className="ov-side-unit"> / {load5?.toFixed(1) ?? '—'} / {load15?.toFixed(1) ?? '—'}</span></span></div>
            </div>
          </div>
          <Bar pct={cpuPct} color={cpuColor(cpuPct)} />
        </div>
        <div className="card clickable ov-main-card" onClick={() => onNavigate('memory')}>
          <div className="ov-main-header"><span className="ov-micro-label"><MemoryStick size={14} /> RAM</span><Chip text={ramChip} color={ramChipCol} /></div>
          <div className="ov-gauge-row">
            <Gauge pct={ramPct} color={ramColor(ramPct)} size={100} stroke={7} />
            <div className="ov-gauge-side">
              <div><div className="ov-micro-label">USED</div><span className="ov-side-num" style={{ color: ramColor(ramPct) }}>{ramUsed.toFixed(1)}<span className="ov-side-unit">GB</span></span></div>
              <div style={{ marginTop: 4 }}><div className="ov-micro-label">CACHED</div><span className="ov-side-num">{ramCached.toFixed(1)}<span className="ov-side-unit">GB</span></span></div>
              <div style={{ marginTop: 4 }}><div className="ov-micro-label">BUFFERS</div><span className="ov-side-num">{ramBuf.toFixed(1)}<span className="ov-side-unit">GB</span></span></div>
              <div style={{ marginTop: 4 }}><div className="ov-micro-label">AVAILABLE</div><span className="ov-side-num">{ramAvail.toFixed(1)}<span className="ov-side-unit">GB</span></span></div>
            </div>
          </div>
          <Bar pct={ramPct} color={ramColor(ramPct)} />
        </div>
        <div className="card clickable ov-main-card" onClick={() => onNavigate('memory')}>
          <div className="ov-main-header"><span className="ov-micro-label"><ArrowRightLeft size={14} /> SWAP</span><Chip text={swapChip} color={swapChipCol} /></div>
          {swapTotal > 0 ? (
            <>
              <div className="ov-gauge-row">
                <Gauge pct={swapPct} color={swapColor(swapPct)} size={100} stroke={7} />
                <div className="ov-gauge-side">
                  <div><div className="ov-micro-label">USED</div><span className="ov-side-num" style={{ color: swapColor(swapPct) }}>{swapUsed.toFixed(1)}<span className="ov-side-unit">GB</span></span></div>
                  <div style={{ marginTop: 6 }}><div className="ov-micro-label">TOTAL</div><span className="ov-side-num">{swapTotal}<span className="ov-side-unit">GB</span></span></div>
                  <div style={{ marginTop: 6 }}><div className="ov-micro-label">USAGE</div><span className="ov-side-num">{swapPct}<span className="ov-side-unit">%</span></span></div>
                </div>
              </div>
              <Bar pct={swapPct} color={swapColor(swapPct)} />
            </>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>No swap configured</div>
          )}
        </div>
      </div>
      <div className="ov-bottom-row">
        <div className="card clickable" onClick={() => onNavigate('storage')}>
          <div className="ov-main-header"><span className="ov-micro-label"><HardDrive size={14} /> DISKS</span><Chip text={diskChip} color={diskChipCol} /></div>
          <div className="disk-row" style={{ marginTop: 0 }}>
            <span className="disk-mount" style={{ fontWeight: 600, color: 'var(--text)' }}>TOTAL</span>
            <div className="disk-bar-wrap" style={{ height: 6 }}><div className="disk-bar" style={{ width: `${diskPct}%`, background: diskColor(diskPct) }} /></div>
            <span className="ov-bar-label">{fmt(diskUsed)} / {fmt(diskTotal)}</span>
          </div>
          {disks.sort((a, b) => b.percent - a.percent).map(d => (
            <div className="disk-row" key={d.mountpoint}>
              <span className="disk-mount" style={{ color: d.percent >= 85 ? 'var(--alert)' : undefined }}>{d.mountpoint}</span>
              <div className="disk-bar-wrap"><div className="disk-bar" style={{ width: `${d.percent}%`, background: diskColor(d.percent) }} /></div>
              <div className="ov-bar-detail"><span className="ov-bar-label">{d.percent}%</span>{d.model && <span className="ov-bar-model">{d.model}</span>}</div>
            </div>
          ))}
        </div>
        <div className="card clickable ov-main-card" onClick={() => onNavigate('network')}>
          <div className="ov-main-header"><span className="ov-micro-label"><Network size={14} /> NETWORK</span><Chip text={netChip} color={netChipCol} /></div>
          <div className="ov-net-wrapper">
            <div className="ov-net-block">
              <div className="ov-micro-label">↓ DOWNLOAD</div>
              <span className="ov-stat-big" style={{ color: 'var(--chart-net-recv)' }}>{current?.net_recv_mbps?.toFixed(1) ?? '—'}</span>
              <span className="ov-stat-unit">Mb/s</span>
            </div>
            <div className="ov-net-block">
              <div className="ov-micro-label">↑ UPLOAD</div>
              <span className="ov-stat-big" style={{ color: 'var(--chart-net-sent)' }}>{current?.net_sent_mbps?.toFixed(1) ?? '—'}</span>
              <span className="ov-stat-unit">Mb/s</span>
            </div>
          </div>
          <div className="ov-net-meta">
            <span>Latency: {current?.net_latency_ms ?? '—'} ms</span>
            <span>Iface: {current?.net_iface || '—'}</span>
            <span>Total DL: {current?.net_recv_total_gb?.toFixed(1) ?? '—'} GB</span>
            <span>Total UL: {current?.net_sent_total_gb?.toFixed(1) ?? '—'} GB</span>
          </div>
          {spark?.recv?.length > 1 && (
            <div className="ov-mini-chart">
              <svg viewBox="0 0 800 50" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {(() => {
                  const max = Math.max(100, ...spark.recv);
                  const pts = spark.recv.map((v, i) => ({ x: (i / (spark.recv.length - 1)) * 800, y: 50 - Math.min(v, max) / max * 50 }));
                  const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                  const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)},50 L ${pts[0].x.toFixed(1)},50 Z`;
                  return (<><path d={area} fill="var(--chart-net-recv)" fillOpacity={0.08} /><path d={d} fill="none" stroke="var(--chart-net-recv)" strokeWidth={1.5} strokeLinejoin="round" /></>);
                })()}
              </svg>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Main Overview ── */
export default function Overview({ current, disks, sysInfo, spark, onNavigate, layoutMode }) {
  return (
    <div className="overview">
      {layoutMode === 'simple' && <SimpleView current={current} disks={disks} sysInfo={sysInfo} onNavigate={onNavigate} />}
      {layoutMode === 'intermediate' && <IntermediateView current={current} disks={disks} sysInfo={sysInfo} spark={spark} onNavigate={onNavigate} />}
      {layoutMode === 'detailed' && <DetailedView current={current} disks={disks} sysInfo={sysInfo} spark={spark} onNavigate={onNavigate} />}
    </div>
  );
}
