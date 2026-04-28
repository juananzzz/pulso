import { Cpu, MemoryStick, ArrowRightLeft, HardDrive, Network, Activity, Thermometer, Clock } from 'lucide-react';
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

function Chip({ text, color, big }) {
  return <span className="ov-chip" style={{ background: color, fontSize: big ? '0.82rem' : undefined, padding: big ? '3px 10px' : undefined }}>{text}</span>;
}

/* ── Simple: big cards, big numbers, minimal ── */
function SimpleView({ current, disks, onNavigate }) {
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

  return (
    <div className="ov-simple-hero ov-simple-hero-2">
      <div className="ov-simple-card" onClick={() => onNavigate('cpu')}>
        <div className="ov-simple-card-header"><Cpu size={20} /> CPU <Chip text={cpuChip} color={cpuChipCol} big /></div>
        <div className="ov-simple-card-main" style={{ color: cpuColor(cpuPct) }}>{cpuPct ?? '—'}<span className="ov-simple-unit">%</span></div>
        <Bar pct={cpuPct} color={cpuColor(cpuPct)} height={12} />
      </div>
      <div className="ov-simple-card" onClick={() => onNavigate('memory')}>
        <div className="ov-simple-card-header"><MemoryStick size={20} /> RAM <Chip text={ramPct < 70 ? 'Stable' : ramPct < 90 ? 'High' : 'Critical'} color={ramPct < 70 ? 'var(--ok)' : ramPct < 90 ? 'var(--warn)' : 'var(--alert)'} big /></div>
        <div className="ov-simple-card-main" style={{ color: ramColor(ramPct) }}>{ramPct}<span className="ov-simple-unit">%</span></div>
        <Bar pct={ramPct} color={ramColor(ramPct)} height={12} />
        <div className="ov-simple-card-footer">{ramUsed.toFixed(1)} / {ramTotal} GB</div>
      </div>
      <div className="ov-simple-card" onClick={() => onNavigate('storage')}>
        <div className="ov-simple-card-header"><HardDrive size={20} /> Storage <Chip text={diskPct < 70 ? 'Stable' : diskPct < 85 ? 'High' : 'Critical'} color={diskPct < 70 ? 'var(--ok)' : diskPct < 85 ? 'var(--warn)' : 'var(--alert)'} big /></div>
        <div className="ov-simple-card-main" style={{ color: diskColor(diskPct) }}>{diskPct}<span className="ov-simple-unit">%</span></div>
        <Bar pct={diskPct} color={diskColor(diskPct)} height={12} />
        <div className="ov-simple-card-footer">{fmt(diskUsed)} / {fmt(diskTotal)}</div>
      </div>
      <div className="ov-simple-card">
        <div className="ov-simple-card-header"><Activity size={20} /> Network <Chip text={netTotal < 1 ? 'Low' : netTotal < 20 ? 'Moderate' : 'High'} color={netTotal < 1 ? 'var(--ok)' : netTotal < 20 ? 'var(--warn)' : 'var(--alert)'} big /></div>
        <div className="ov-simple-card-main" style={{ color: netTotal < 1 ? 'var(--ok)' : netTotal < 20 ? 'var(--warn)' : 'var(--alert)' }}>{netTotal.toFixed(1)}<span className="ov-simple-unit">Mb/s</span></div>
        <div className="ov-simple-net-detail"><span>↓ {current?.net_recv_mbps?.toFixed(1) ?? '—'}</span><span>↑ {current?.net_sent_mbps?.toFixed(1) ?? '—'}</span></div>
      </div>
    </div>
  );
}

/* ── Intermediate: simple cards with rich side metrics ── */
function IntermediateView({ current, disks, spark, onNavigate }) {
  const cpuPct = current?.cpu_percent != null ? Math.round(current.cpu_percent) : null;
  const freq = current?.cpu_freq_ghz;
  const temp = current?.temp_cpu;
  const load1 = current?.load_1;
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

  const cpuChip = cpuPct < 70 ? 'Stable' : cpuPct < 90 ? 'High' : 'Critical';
  const cpuChipCol = cpuPct < 70 ? 'var(--ok)' : cpuPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const ramChip = ramPct < 70 ? 'Stable' : ramPct < 90 ? 'High' : 'Critical';
  const ramChipCol = ramPct < 70 ? 'var(--ok)' : ramPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const diskChip = criticalDisks > 0 ? `${criticalDisks} critical` : diskPct >= 70 ? 'High' : 'Stable';
  const diskChipCol = criticalDisks > 0 ? 'var(--alert)' : diskPct >= 70 ? 'var(--warn)' : 'var(--ok)';
  const netChip = netTotal < 1 ? 'Low' : netTotal < 20 ? 'Moderate' : 'High';
  const netChipCol = netTotal < 1 ? 'var(--ok)' : netTotal < 20 ? 'var(--warn)' : 'var(--alert)';

  return (
    <div className="ov-simple-hero ov-simple-hero-2">
      {/* CPU */}
      <div className="ov-simple-card ov-simple-card-wide" onClick={() => onNavigate('cpu')}>
        <div className="ov-simple-card-header"><Cpu size={20} /> CPU <Chip text={cpuChip} color={cpuChipCol} big /></div>
        <div className="ov-simple-mid-row">
          <div>
            <div className="ov-simple-card-main" style={{ color: cpuColor(cpuPct) }}>{cpuPct ?? '—'}<span className="ov-simple-unit">%</span></div>
            <Bar pct={cpuPct} color={cpuColor(cpuPct)} height={10} />
          </div>
          <div className="ov-simple-meta-col">
            {temp != null && <div className="ov-simple-meta"><Thermometer size={12} /> {temp}°C</div>}
            <div className="ov-simple-meta"><Clock size={12} /> {freq?.toFixed(2) ?? '—'} GHz</div>
            <div className="ov-simple-meta"><Activity size={12} /> Load {load1?.toFixed(1) ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* RAM + SWAP */}
      <div className="ov-simple-card ov-simple-card-wide" onClick={() => onNavigate('memory')}>
        <div className="ov-simple-card-header"><MemoryStick size={20} /> Memory <Chip text={ramChip} color={ramChipCol} big /></div>
        <div className="ov-simple-mid-row">
          <div>
            <div className="ov-simple-card-main" style={{ color: ramColor(ramPct) }}>{ramPct}<span className="ov-simple-unit">%</span></div>
            <Bar pct={ramPct} color={ramColor(ramPct)} height={10} />
            <div className="ov-simple-meta-col" style={{ marginTop: 4 }}>
              <div className="ov-simple-meta">Used {ramUsed.toFixed(1)} GB</div>
              <div className="ov-simple-meta">Cached {ramCached.toFixed(1)} GB</div>
              <div className="ov-simple-meta">Buf {ramBuf.toFixed(1)} GB</div>
              <div className="ov-simple-meta">Avail {ramAvail.toFixed(1)} GB</div>
            </div>
          </div>
          <div>
            <div className="ov-simple-card-main" style={{ color: swapColor(swapPct) }}>{swapPct}<span className="ov-simple-unit">%</span></div>
            <Bar pct={swapPct} color={swapColor(swapPct)} height={10} />
            <div className="ov-simple-meta-col" style={{ marginTop: 4 }}>
              <div className="ov-simple-meta">Used {swapUsed.toFixed(1)} GB</div>
              <div className="ov-simple-meta">Total {swapTotal} GB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="ov-simple-card ov-simple-card-wide" onClick={() => onNavigate('storage')}>
        <div className="ov-simple-card-header"><HardDrive size={20} /> Storage <Chip text={diskChip} color={diskChipCol} big /></div>
        <div className="ov-simple-card-main" style={{ color: diskColor(diskPct) }}>{diskPct}<span className="ov-simple-unit">%</span></div>
        <Bar pct={diskPct} color={diskColor(diskPct)} height={10} />
        <div className="ov-simple-meta" style={{ marginBottom: 8 }}>{fmt(diskUsed)} / {fmt(diskTotal)}</div>
        {disks.sort((a, b) => b.percent - a.percent).slice(0, 4).map(d => (
          <div key={d.mountpoint} className="ov-storage-disk-row">
            <div className="ov-storage-disk-label">
              <span style={{ color: d.percent >= 85 ? 'var(--alert)' : undefined }}>{d.mountpoint}</span>
              <span className="ov-storage-disk-pct" style={{ color: diskColor(d.percent) }}>{d.percent}%</span>
            </div>
            <div className="ov-storage-disk-bar">
              <div className="ov-storage-disk-fill" style={{ width: `${Math.min(d.percent, 100)}%`, background: diskColor(d.percent) }} />
            </div>
          </div>
        ))}
      </div>

      {/* Network */}
      <div className="ov-simple-card ov-simple-card-wide">
        <div className="ov-simple-card-header"><Network size={20} /> Network <Chip text={netChip} color={netChipCol} big /></div>
        <div className="ov-simple-mid-row">
          <div>
            <div className="ov-simple-card-main" style={{ color: netChipCol }}>{netTotal.toFixed(1)}<span className="ov-simple-unit">Mb/s</span></div>
            <div className="ov-simple-net-detail"><span>↓ {current?.net_recv_mbps?.toFixed(1) ?? '—'}</span><span>↑ {current?.net_sent_mbps?.toFixed(1) ?? '—'}</span></div>
          </div>
          <div className="ov-simple-meta-col">
            <div className="ov-simple-meta">Latency {current?.net_latency_ms ?? '—'} ms</div>
            <div className="ov-simple-meta">{current?.net_iface || '—'}</div>
            <div className="ov-simple-meta">DL {current?.net_recv_total_gb?.toFixed(1) ?? '—'} GB</div>
            <div className="ov-simple-meta">UL {current?.net_sent_total_gb?.toFixed(1) ?? '—'} GB</div>
          </div>
        </div>
        {spark?.recv?.length > 1 && (
          <div className="ov-mini-chart">
            <svg viewBox="0 0 800 40" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {(() => {
                const max = Math.max(100, ...spark.recv);
                const pts = spark.recv.map((v, i) => ({ x: (i / (spark.recv.length - 1)) * 800, y: 40 - Math.min(v, max) / max * 40 }));
                const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)},40 L ${pts[0].x.toFixed(1)},40 Z`;
                return (<><path d={area} fill="var(--chart-net-recv)" fillOpacity={0.08} /><path d={d} fill="none" stroke="var(--chart-net-recv)" strokeWidth={1.5} strokeLinejoin="round" /></>);
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Detailed: full dashboard with all metrics ── */
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

  const cpuChip = cpuPct < 70 ? 'Stable' : cpuPct < 90 ? 'High' : 'Critical';
  const cpuChipCol = cpuPct < 70 ? 'var(--ok)' : cpuPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const ramChip = ramPct < 70 ? 'Stable' : ramPct < 90 ? 'High' : 'Critical';
  const ramChipCol = ramPct < 70 ? 'var(--ok)' : ramPct < 90 ? 'var(--warn)' : 'var(--alert)';
  const swapChip = swapPct < 40 ? 'Low' : swapPct < 70 ? 'Moderate' : 'Intensive';
  const swapChipCol = swapPct < 40 ? 'var(--ok)' : swapPct < 70 ? 'var(--warn)' : 'var(--alert)';
  const diskChip = criticalDisks > 0 ? `${criticalDisks} critical` : diskPct >= 70 ? 'High' : 'Stable';
  const diskChipCol = criticalDisks > 0 ? 'var(--alert)' : diskPct >= 70 ? 'var(--warn)' : 'var(--ok)';
  const netChip = netTotal < 1 ? 'Low' : netTotal < 20 ? 'Moderate' : 'High';
  const netChipCol = netTotal < 1 ? 'var(--ok)' : netTotal < 20 ? 'var(--warn)' : 'var(--alert)';

  const swapCh = spark?.swapGb?.length > 1 && (
    <svg viewBox="0 0 800 30" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {(() => {
        const max = Math.max(1, ...spark.swapGb);
        const pts = spark.swapGb.map((v, i) => ({ x: (i / (spark.swapGb.length - 1)) * 800, y: 30 - Math.min(v, max) / max * 30 }));
        const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
        const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)},30 L ${pts[0].x.toFixed(1)},30 Z`;
        return (<><path d={area} fill="var(--chart-swap)" fillOpacity={0.1} /><path d={d} fill="none" stroke="var(--chart-swap)" strokeWidth={1.5} strokeLinejoin="round" /></>);
      })()}
    </svg>
  );

  return (
    <div className="overview">
      {/* Hero row */}
      <div className="ov-hero-row">
        <div className="ov-hero-card">
          <div className="ov-hero-top"><Cpu size={16} /><span className="ov-hero-label">CPU</span></div>
          <div className="ov-hero-val" style={{ color: cpuColor(cpuPct) }}>{cpuPct ?? '—'}<span className="ov-hero-unit">%</span></div>
          <div className="ov-hero-sub">{freq?.toFixed(2) ?? '—'} GHz · {temp ?? '—'}°C</div>
        </div>
        <div className="ov-hero-card">
          <div className="ov-hero-top"><MemoryStick size={16} /><span className="ov-hero-label">RAM</span></div>
          <div className="ov-hero-val" style={{ color: ramColor(ramPct) }}>{ramPct}<span className="ov-hero-unit">%</span></div>
          <div className="ov-hero-sub">{ramUsed.toFixed(1)} / {ramTotal} GB · {ramAvail.toFixed(1)} GB free</div>
        </div>
        <div className="ov-hero-card">
          <div className="ov-hero-top"><HardDrive size={16} /><span className="ov-hero-label">Storage</span></div>
          <div className="ov-hero-val" style={{ color: diskColor(diskPct) }}>{diskPct}<span className="ov-hero-unit">%</span></div>
          <div className="ov-hero-sub">{fmt(diskUsed)} / {fmt(diskTotal)} · {disks.length} disks</div>
        </div>
        <div className="ov-hero-card">
          <div className="ov-hero-top"><Network size={16} /><span className="ov-hero-label">Network</span></div>
          <div className="ov-hero-val" style={{ color: netChipCol }}>{netTotal.toFixed(1)}<span className="ov-hero-unit">Mb/s</span></div>
          <div className="ov-hero-sub">{current?.net_iface || '—'} · {current?.net_latency_ms ?? '—'} ms</div>
        </div>
      </div>

      {/* Main 3-col row: CPU | RAM | SWAP */}
      <div className="ov-middle-row">
        {/* CPU */}
        <div className="card clickable" onClick={() => onNavigate('cpu')}>
          <div className="ov-main-header"><span className="ov-micro-label"><Cpu size={14} /> CPU</span><Chip text={cpuChip} color={cpuChipCol} /></div>
          <div className="ov-detailed-row">
            <div className="ov-detailed-gauge">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="43" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle cx="50" cy="50" r="43" fill="none" stroke={cpuColor(cpuPct)} strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 43} strokeDashoffset={2 * Math.PI * 43 * (1 - (cpuPct || 0) / 100)}
                  strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.5s' }} />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize="24" fontWeight="700" fontFamily="var(--num-font)">{cpuPct ?? '—'}</text>
              </svg>
            </div>
            <div className="ov-detailed-metrics">
              <div className="ov-detailed-metric"><span className="ov-micro-label">Temp</span><span style={{ color: tempColor(temp) }}>{temp ?? '—'}°C</span></div>
              <div className="ov-detailed-metric"><span className="ov-micro-label">Freq</span><span>{freq?.toFixed(2) ?? '—'} GHz</span></div>
              <div className="ov-detailed-metric"><span className="ov-micro-label">Load</span><span>{load1?.toFixed(1) ?? '—'} / {load5?.toFixed(1) ?? '—'} / {load15?.toFixed(1) ?? '—'}</span></div>
              <div className="ov-detailed-metric"><span className="ov-micro-label">Threads</span><span>{sysInfo?.cpu_threads || '—'}</span></div>
            </div>
          </div>
          <Bar pct={cpuPct} color={cpuColor(cpuPct)} height={4} />
        </div>

        {/* RAM */}
        <div className="card clickable" onClick={() => onNavigate('memory')}>
          <div className="ov-main-header"><span className="ov-micro-label"><MemoryStick size={14} /> RAM</span><Chip text={ramChip} color={ramChipCol} /></div>
          <div className="ov-detailed-row">
            <div className="ov-detailed-gauge">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="43" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle cx="50" cy="50" r="43" fill="none" stroke={ramColor(ramPct)} strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 43} strokeDashoffset={2 * Math.PI * 43 * (1 - ramPct / 100)}
                  strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.5s' }} />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize="24" fontWeight="700" fontFamily="var(--num-font)">{ramPct}</text>
              </svg>
            </div>
            <div className="ov-detailed-metrics">
              <div className="ov-detailed-metric"><span className="ov-micro-label">Used</span><span style={{ color: ramColor(ramPct) }}>{ramUsed.toFixed(1)} GB</span></div>
              <div className="ov-detailed-metric"><span className="ov-micro-label">Cached</span><span>{ramCached.toFixed(1)} GB</span></div>
              <div className="ov-detailed-metric"><span className="ov-micro-label">Buffers</span><span>{ramBuf.toFixed(1)} GB</span></div>
              <div className="ov-detailed-metric"><span className="ov-micro-label">Available</span><span>{ramAvail.toFixed(1)} GB</span></div>
              <div className="ov-detailed-metric"><span className="ov-micro-label">Total</span><span>{ramTotal} GB</span></div>
            </div>
          </div>
          <Bar pct={ramPct} color={ramColor(ramPct)} height={4} />
        </div>

        {/* SWAP */}
        <div className="card clickable" onClick={() => onNavigate('memory')}>
          <div className="ov-main-header"><span className="ov-micro-label"><ArrowRightLeft size={14} /> SWAP</span><Chip text={swapChip} color={swapChipCol} /></div>
          {swapTotal > 0 ? (
            <div className="ov-detailed-row">
              <div className="ov-detailed-gauge">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="43" fill="none" stroke="var(--border)" strokeWidth="6" />
                  <circle cx="50" cy="50" r="43" fill="none" stroke={swapColor(swapPct)} strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 43} strokeDashoffset={2 * Math.PI * 43 * (1 - Math.min(swapPct, 100) / 100)}
                    strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.5s' }} />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize="24" fontWeight="700" fontFamily="var(--num-font)">{swapPct}</text>
                </svg>
              </div>
              <div className="ov-detailed-metrics">
                <div className="ov-detailed-metric"><span className="ov-micro-label">Used</span><span style={{ color: swapColor(swapPct) }}>{swapUsed.toFixed(1)} GB</span></div>
                <div className="ov-detailed-metric"><span className="ov-micro-label">Total</span><span>{swapTotal} GB</span></div>
                <div className="ov-detailed-metric"><span className="ov-micro-label">Usage</span><span>{swapPct}%</span></div>
                {swapCh && <div style={{ gridColumn: '1 / -1', marginTop: 2 }}>{swapCh}</div>}
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>No swap</div>
          )}
          <Bar pct={swapPct} color={swapColor(swapPct)} height={4} />
        </div>
      </div>

      {/* Bottom row: Storage + Network */}
      <div className="ov-bottom-row">
        {/* Storage */}
        <div className="card clickable" onClick={() => onNavigate('storage')}>
          <div className="ov-main-header"><span className="ov-micro-label"><HardDrive size={14} /> DISKS</span><Chip text={diskChip} color={diskChipCol} /></div>
          <div className="disk-row" style={{ marginTop: 0 }}>
            <span className="disk-mount" style={{ fontWeight: 600, color: 'var(--text)' }}>TOTAL</span>
            <div className="disk-bar-wrap" style={{ height: 8 }}><div className="disk-bar" style={{ width: `${diskPct}%`, background: diskColor(diskPct) }} /></div>
            <span className="ov-bar-label">{fmt(diskUsed)} / {fmt(diskTotal)}</span>
          </div>
          {disks.sort((a, b) => b.percent - a.percent).map(d => (
            <div className="disk-row" key={d.mountpoint}>
              <span className="disk-mount" style={{ color: d.percent >= 85 ? 'var(--alert)' : undefined }}>{d.mountpoint}</span>
              <div className="disk-bar-wrap"><div className="disk-bar" style={{ width: `${d.percent}%`, background: diskColor(d.percent) }} /></div>
              <div className="ov-bar-detail">
                <span className="ov-bar-label">{d.percent}%</span>
                {d.model && <span className="ov-bar-model">{d.model}</span>}
                {d.temp != null && <span className="ov-bar-model">{d.temp}°C</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Network */}
        <div className="card clickable" onClick={() => onNavigate('network')}>
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
            <span>DL total: {current?.net_recv_total_gb?.toFixed(1) ?? '—'} GB</span>
            <span>UL total: {current?.net_sent_total_gb?.toFixed(1) ?? '—'} GB</span>
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
    </div>
  );
}

/* ── Main ── */
export default function Overview({ current, disks, sysInfo, spark, onNavigate, layoutMode }) {
  return (
    <div className="overview">
      {layoutMode === 'simple' && <SimpleView current={current} disks={disks} onNavigate={onNavigate} />}
      {layoutMode === 'intermediate' && <IntermediateView current={current} disks={disks} spark={spark} onNavigate={onNavigate} />}
      {layoutMode === 'detailed' && <DetailedView current={current} disks={disks} sysInfo={sysInfo} spark={spark} onNavigate={onNavigate} />}
    </div>
  );
}
