import { cpuColor, diskColor, ramColor, swapColor, tempColor } from '../utils';

function fmt(gb) {
  return gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(0)} GB`;
}

function Bar({ pct, color, height = 5 }) {
  return (
    <div style={{ height, background: 'var(--border)', borderRadius: 3, margin: '8px 0' }}>
      <div style={{
        height: '100%', borderRadius: 3,
        background: color,
        width: `${Math.min(pct || 0, 100)}%`,
        transition: 'width 0.5s',
      }} />
    </div>
  );
}

function CardLabel({ text }) {
  return <div className="ov-card-label">{text}</div>;
}

// ── CPU ──────────────────────────────────────────────────────────
function CPUCard({ data, spark, onClick }) {
  const pct = data?.cpu_percent != null ? Math.round(data.cpu_percent) : null;

  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <CardLabel text="CPU" />
        {data?.cpu_freq_ghz && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{data.cpu_freq_ghz} GHz</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 4 }}>
        <div>
          <span className="ov-big-num" style={{ color: cpuColor(pct) }}>{pct ?? '—'}</span>
          <span className="ov-big-unit">%</span>
        </div>
        {data?.temp_cpu != null && (
          <div>
            <span className="ov-big-num" style={{ color: tempColor(data.temp_cpu) }}>{data.temp_cpu}</span>
            <span className="ov-big-unit">°C</span>
          </div>
        )}
      </div>

      <Bar pct={pct} color={cpuColor(pct)} />

      <div className="ov-chip-row">
        <StatChip label="LOAD 1m"  value={data?.load_1}  />
        <StatChip label="LOAD 5m"  value={data?.load_5}  />
        <StatChip label="LOAD 15m" value={data?.load_15} />
      </div>

    </div>
  );
}

// ── RAM ──────────────────────────────────────────────────────────
function RAMCard({ data, spark, onClick }) {
  const total   = data?.ram_total_gb  || 0;
  const avail   = data?.ram_available_gb || 0;
  const used    = total > 0 ? +(total - avail).toFixed(1) : (data?.ram_used_gb || 0);
  const pct     = data?.ram_percent != null ? Math.round(data.ram_percent) : null;
  const cached  = data?.ram_cached_gb || 0;
  const buffers = data?.ram_buffers_gb || 0;
  const free    = avail;
  const apps    = Math.max(0, +(used - cached - buffers).toFixed(1));
  const swapUsed  = data?.swap_used_gb  || 0;
  const swapTotal = data?.swap_total_gb || 0;
  const swapPct   = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;
  const pctColor = pct != null ? ramColor(pct) : 'var(--text)';

  const segments = [
    { label: 'Apps', value: apps, color: 'var(--chart-ram)' },
    { label: 'Cached', value: cached, color: 'var(--distrib-cached)' },
    { label: 'Buffers', value: buffers, color: 'var(--distrib-buffers)' },
    { label: 'Free', value: free, color: 'var(--distrib-libre)' },
  ].filter(s => s.value > 0);

  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <CardLabel text="RAM" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{total} GB total</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span className="ov-big-num" style={{ color: pctColor }}>{used.toFixed(1)}</span>
        <span className="ov-big-unit">GB</span>
        {pct != null && (
          <span style={{ fontSize: '1rem', color: pctColor, marginLeft: 2, fontWeight: 600 }}>({pct}%)</span>
        )}
      </div>

      <Bar pct={pct} color={pctColor} />

      {total > 0 && (
        <div style={{ margin: '12px 0 6px', display: 'flex', height: 14, borderRadius: 4, overflow: 'hidden', background: 'var(--border)' }}>
          {segments.map(s => (
            <div key={s.label} style={{ flex: s.value / total, background: s.color, minWidth: 2 }} title={`${s.label}: ${s.value.toFixed(1)} GB`} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{s.label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--num-font)' }}>{s.value.toFixed(1)}</span>
          </div>
        ))}
      </div>

      <div className="ov-swap-row" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="ov-micro-label">SWAP</span>
          <span style={{ fontSize: '0.78rem', color: swapColor(swapPct), fontWeight: swapPct > 40 ? 600 : undefined }}>
            {swapUsed.toFixed(1)} / {swapTotal} GB
          </span>
        </div>
        <Bar pct={swapPct} color={swapColor(swapPct)} height={swapPct > 40 ? 5 : 3} />
      </div>

    </div>
  );
}

function StatChip({ label, value, unit, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div className="ov-micro-label">{label}</div>
      <span style={{
        fontSize: '1.15rem', fontWeight: 700,
        fontFamily: 'var(--num-font)',
        color: color || 'var(--text)',
      }}>
        {value ?? '—'}
        {unit && <span style={{ fontSize: '0.82rem', color: 'var(--text-mid)', marginLeft: 2 }}>{unit}</span>}
      </span>
    </div>
  );
}

// ── Network ──────────────────────────────────────────────────────
function NetworkCard({ data, spark, onClick }) {
  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <CardLabel text="Red" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{data?.net_iface || '—'}</span>
      </div>

      <div className="ov-net-line">
        <div className="ov-net-label-col" style={{ width: 'auto' }}>
          <div className="ov-micro-label">↓ DESCARGA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="ov-net-num">{data?.net_recv_mbps ?? '—'}</span>
            <span className="ov-net-unit">Mb/s</span>
          </div>
        </div>
      </div>

      <div className="ov-net-line" style={{ marginTop: 12 }}>
        <div className="ov-net-label-col" style={{ width: 'auto' }}>
          <div className="ov-micro-label">↑ SUBIDA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="ov-net-num">{data?.net_sent_mbps ?? '—'}</span>
            <span className="ov-net-unit">Mb/s</span>
          </div>
        </div>
      </div>

      {data?.net_latency_ms != null && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ov-micro-label">LATENCIA</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--num-font)' }}>
            {data.net_latency_ms}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-mid)' }}>ms</span>
        </div>
      )}
    </div>
  );
}

// ── Disks ────────────────────────────────────────────────────────
function DisksCard({ disks, onClick }) {
  const total = disks.reduce((s, d) => s + d.total_gb, 0);
  const used = disks.reduce((s, d) => s + d.used_gb, 0);
  const readSum = disks.reduce((s, d) => s + (d.read_mbps || 0), 0);
  const writeSum = disks.reduce((s, d) => s + (d.write_mbps || 0), 0);

  return (
    <div className="card clickable" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <CardLabel text="Discos" />
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', opacity: 0.7 }}>
          {disks.length} montados · {fmt(used)} / {fmt(total)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div><span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>USADO</span><br /><span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--num-font)' }}>{fmt(used)}</span></div>
                  <div><span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>↓ READS</span><br /><span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--num-font)' }}>{readSum.toFixed(1)}<span style={{ fontSize: '0.7rem', color: 'var(--text-mid)', marginLeft: 2 }}>MB/s</span></span></div>
        <div><span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>↑ WRITES</span><br /><span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--num-font)' }}>{writeSum.toFixed(1)}<span style={{ fontSize: '0.7rem', color: 'var(--text-mid)', marginLeft: 2 }}>MB/s</span></span></div>
      </div>

      {disks.map(d => (
        <div className="disk-row" key={d.mountpoint} style={{ flexWrap: 'wrap', padding: '6px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100, flexShrink: 0 }}>
            <span className="disk-mount">{d.mountpoint}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 1 }}>
              {d.temp != null && (
                <span style={{ fontSize: '0.68rem', color: tempColor(d.temp) }}>{d.temp}°C</span>
              )}
              <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>{d.device?.split('/').pop() || ''}</span>
            </div>
          </div>
          <div className="disk-bar-wrap" style={{ minWidth: 80, flex: 1 }}>
            <div className="disk-bar" style={{ width: `${d.percent}%`, background: diskColor(d.percent) }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <span className="disk-pct" style={{ color: diskColor(d.percent), width: 40, textAlign: 'right' }}>{d.percent}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--num-font)', whiteSpace: 'nowrap' }}>
              {fmt(d.used_gb)} / {fmt(d.total_gb)}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--num-font)', whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right' }}>
              ↓{d.read_mbps} ↑{d.write_mbps}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Overview ─────────────────────────────────────────────────
export default function Overview({ current, disks, spark, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--gap) * 1.5)' }}>
      <div className="overview-grid-3" style={{ alignItems: 'stretch' }}>
        <CPUCard     data={current} spark={spark?.cpu}    onClick={() => onNavigate('cpu')} />
        <RAMCard     data={current} spark={spark?.ram}    onClick={() => onNavigate('memory')} />
        <NetworkCard data={current} spark={spark}         onClick={() => onNavigate('network')} />
      </div>
      <DisksCard disks={disks} onClick={() => onNavigate('storage')} />
    </div>
  );
}
