import SparkLine from '../charts/SparkLine';

function Bar({ pct, color, warn = false, height = 5 }) {
  return (
    <div style={{ height, background: 'var(--border)', borderRadius: 3, margin: '8px 0' }}>
      <div style={{
        height: '100%', borderRadius: 3,
        background: warn ? 'var(--alert)' : color,
        width: `${Math.min(pct || 0, 100)}%`,
        transition: 'width 0.5s',
      }} />
    </div>
  );
}

function CardLabel({ text }) {
  return <div className="ov-card-label">{text}</div>;
}

function StatChip({ label, value, unit, warn = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div className="ov-micro-label">{label}</div>
      <span style={{
        fontSize: '0.92rem', fontWeight: 700,
        fontFamily: 'var(--num-font)',
        color: warn ? 'var(--alert)' : 'var(--text)',
      }}>
        {value ?? '—'}
        {unit && <span style={{ fontSize: '0.72rem', color: 'var(--text-mid)', marginLeft: 2 }}>{unit}</span>}
      </span>
    </div>
  );
}

// ── CPU ──────────────────────────────────────────────────────────
function CPUCard({ data, spark, onClick }) {
  const pct = data?.cpu_percent != null ? Math.round(data.cpu_percent) : null;
  const warn = (pct || 0) > 85;
  const tempWarn = (data?.temp_cpu || 0) > 78;

  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <CardLabel text="CPU" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {data?.temp_cpu != null && (
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: tempWarn ? 'var(--alert)' : 'var(--text-mid)' }}>
              {data.temp_cpu}°C
            </span>
          )}
          {data?.cpu_freq_ghz && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{data.cpu_freq_ghz} GHz</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span className="ov-big-num" style={{ color: warn ? 'var(--alert)' : 'var(--text)' }}>
          {pct ?? '—'}
        </span>
        <span className="ov-big-unit">%</span>
      </div>

      <Bar pct={pct} color="var(--chart-cpu)" warn={warn} />

      <div className="ov-chip-row">
        <StatChip label="LOAD 1m"  value={data?.load_1}  />
        <StatChip label="LOAD 5m"  value={data?.load_5}  />
        <StatChip label="LOAD 15m" value={data?.load_15} />
      </div>

      <div className="ov-spark-row">
        <span className="ov-micro-label">Uso · últimos 60s</span>
        <div style={{ flex: 1 }}>
          <SparkLine data={spark} color="var(--chart-cpu)" height={40} fill />
        </div>
      </div>
    </div>
  );
}

// ── RAM ──────────────────────────────────────────────────────────
function RAMCard({ data, onClick }) {
  const total   = data?.ram_total_gb  || 0;
  const avail   = data?.ram_available_gb || 0;
  const used    = total > 0 ? +(total - avail).toFixed(1) : (data?.ram_used_gb || 0);
  const pct     = data?.ram_percent != null ? Math.round(data.ram_percent) : null;
  const warn    = (pct || 0) > 85;
  const swapUsed  = data?.swap_used_gb  || 0;
  const swapTotal = data?.swap_total_gb || 0;
  const swapPct   = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;

  return (
    <div className="card clickable ov-main-card" onClick={onClick}>
      <div className="ov-main-header">
        <CardLabel text="RAM" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{total} GB total</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span className="ov-big-num" style={{ color: warn ? 'var(--alert)' : 'var(--text)' }}>
          {used.toFixed(1)}
        </span>
        <span className="ov-big-unit">GB</span>
        {pct != null && (
          <span style={{ fontSize: '1rem', color: 'var(--text-dim)', marginLeft: 2 }}>({pct}%)</span>
        )}
      </div>

      <Bar pct={pct} color="var(--chart-ram)" warn={warn} />

      <div className="ov-chip-row">
        <StatChip label="CACHED"    value={data?.ram_cached_gb?.toFixed(1)}    unit="GB" />
        <StatChip label="BUFFERS"   value={data?.ram_buffers_gb?.toFixed(1)}   unit="GB" />
        <StatChip label="DISPONIBLE" value={avail > 0 ? avail.toFixed(1) : null} unit="GB" />
      </div>

      {/* Swap inline */}
      <div className="ov-swap-row">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="ov-micro-label">SWAP</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            {swapUsed.toFixed(1)} / {swapTotal} GB
          </span>
        </div>
        <Bar pct={swapPct} color="var(--chart-swap)" height={3} />
      </div>
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
        <div className="ov-net-label-col">
          <div className="ov-micro-label">↓ DESCARGA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="ov-net-num">{data?.net_recv_mbps ?? '—'}</span>
            <span className="ov-net-unit">Mb/s</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SparkLine data={spark?.recv} color="var(--chart-net-recv)" height={42} fill />
        </div>
      </div>

      <div className="ov-net-line" style={{ marginTop: 10 }}>
        <div className="ov-net-label-col">
          <div className="ov-micro-label">↑ SUBIDA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="ov-net-num">{data?.net_sent_mbps ?? '—'}</span>
            <span className="ov-net-unit">Mb/s</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SparkLine data={spark?.sent} color="var(--chart-net-sent)" height={42} fill />
        </div>
      </div>

      {data?.net_latency_ms != null && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ov-micro-label">LATENCIA</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--num-font)' }}>
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
  return (
    <div className="card clickable" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="ov-card-label">Discos</div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{disks.length} montados</span>
      </div>
      {disks.slice(0, 6).map(d => (
        <div className="disk-row" key={d.mountpoint}>
          <span className="disk-mount">{d.mountpoint}</span>
          <div className="disk-bar-wrap">
            <div className={`disk-bar${d.percent > 90 ? ' warn' : ''}`} style={{ width: `${d.percent}%` }} />
          </div>
          <span className={`disk-pct${d.percent > 90 ? ' warn' : ''}`}>{d.percent}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Docker ───────────────────────────────────────────────────────
function DockerCard({ docker, onClick }) {
  if (!docker?.available) return (
    <div className="card">
      <div className="ov-card-label">Docker</div>
      <div style={{ marginTop: 16, color: 'var(--text-dim)', fontSize: '0.9rem' }}>No disponible</div>
    </div>
  );
  const hasIssues = docker.restarting > 0 || docker.stopped > 0;
  return (
    <div className="card clickable" onClick={onClick}>
      <div className="ov-card-label">Docker</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '10px 0 4px' }}>
        <span style={{
          fontSize: '3rem', fontWeight: 700, lineHeight: 1,
          color: hasIssues ? 'var(--alert)' : 'var(--text)', fontFamily: 'var(--num-font)',
        }}>{docker.running}</span>
        <span style={{ fontSize: '1.1rem', color: 'var(--text-mid)' }}>/ {docker.total}</span>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 12 }}>contenedores activos</div>
      {docker.containers?.slice(0, 5).map(c => (
        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: c.state === 'running' ? 'var(--ok)' : c.state === 'restarting' ? 'orange' : 'var(--text-dim)',
          }} />
          <span style={{ fontSize: '0.82rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.name}
          </span>
          {c.state !== 'running' && (
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: c.state === 'restarting' ? 'orange' : 'var(--text-dim)' }}>
              {c.state}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Overview ─────────────────────────────────────────────────
export default function Overview({ current, disks, docker, spark, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--gap) * 1.5)' }}>
      {/* Top row: CPU · RAM · Network */}
      <div className="overview-grid-3">
        <CPUCard     data={current} spark={spark?.cpu}  onClick={() => onNavigate('cpu')} />
        <RAMCard     data={current}                     onClick={() => onNavigate('memory')} />
        <NetworkCard data={current} spark={spark}       onClick={() => onNavigate('network')} />
      </div>

      {/* Bottom row: Disks · Docker */}
      <div className="overview-grid-2">
        <DisksCard disks={disks}   onClick={() => onNavigate('storage')} />
        <DockerCard docker={docker} onClick={() => onNavigate('containers')} />
      </div>
    </div>
  );
}
