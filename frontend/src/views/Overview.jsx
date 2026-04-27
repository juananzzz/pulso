import SparkLine from '../charts/SparkLine';
import GaugeRing from '../charts/GaugeRing';

function SectionHeader({ label }) {
  return <div className="section-header">{label}</div>;
}

function OvCard({ children, onClick, style, className = '' }) {
  return (
    <div className={`card${onClick ? ' clickable' : ''} ${className}`} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

function OvLabel({ text }) {
  return <div className="ov-card-label">{text}</div>;
}

function Bar({ pct, color, warn = false, height = 4 }) {
  return (
    <div style={{ height, background: 'var(--border)', borderRadius: 3, margin: '6px 0' }}>
      <div style={{
        height: '100%', borderRadius: 3,
        background: warn ? 'var(--alert)' : color,
        width: `${Math.min(pct || 0, 100)}%`,
        transition: 'width 0.5s',
      }} />
    </div>
  );
}

// ── Compute section ───────────────────────────────────────────────
function CPUCompactCard({ data, spark, onClick }) {
  const pct = data?.cpu_percent != null ? Math.round(data.cpu_percent) : null;
  const warn = (pct || 0) > 85;
  return (
    <OvCard onClick={onClick} style={{ gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <OvLabel text="CPU" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          {data?.cpu_freq_ghz ? `${data.cpu_freq_ghz} GHz` : '—'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: '3rem', fontWeight: 700, lineHeight: 1,
          fontFamily: 'var(--num-font)', color: warn ? 'var(--alert)' : 'var(--text)',
        }}>{pct ?? '—'}</span>
        <span style={{ fontSize: '1.3rem', color: 'var(--text-mid)' }}>%</span>
      </div>

      <Bar pct={pct} color="var(--chart-cpu)" warn={warn} height={5} />

      <div style={{ display: 'flex', gap: 20, margin: '8px 0 10px', flexWrap: 'wrap' }}>
        <div>
          <div className="ov-micro-label">LOAD 1m · 5m · 15m</div>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--num-font)' }}>
            {data?.load_1 ?? '—'} · {data?.load_5 ?? '—'} · {data?.load_15 ?? '—'}
          </span>
        </div>
        {data?.temp_cpu != null && (
          <div>
            <div className="ov-micro-label">TEMPERATURA</div>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: data.temp_cpu > 78 ? 'var(--alert)' : 'var(--text)' }}>
              {data.temp_cpu}°C
            </span>
          </div>
        )}
      </div>

      <div className="ov-micro-label" style={{ marginBottom: 4 }}>USO · últimos 60s</div>
      <SparkLine data={spark} color="var(--chart-cpu)" height={38} fill />
    </OvCard>
  );
}

function TempGaugeCard({ data }) {
  const warn = (data?.temp_cpu || 0) > 78;
  return (
    <OvCard>
      <OvLabel text="Temperatura" />
      <div className="gauge-center">
        <GaugeRing value={data?.temp_cpu} max={100} unit="°C" size={120}
          color="var(--chart-temp)" warn={warn} />
        {data?.gpu && <div className="ov-gauge-sub">GPU {data.gpu.temp}°C</div>}
      </div>
    </OvCard>
  );
}

function GPUCard({ data }) {
  const gpu = data?.gpu;
  if (!gpu) return (
    <OvCard>
      <OvLabel text="GPU" />
      <div className="gauge-center" style={{ marginTop: 16 }}>
        <div style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>No detectada</div>
      </div>
    </OvCard>
  );
  return (
    <OvCard>
      <OvLabel text="GPU" />
      <div className="ov-card-meta">{gpu.model?.replace(/NVIDIA GeForce |GeForce /g, '')}</div>
      <div className="gauge-center" style={{ marginTop: 6 }}>
        <GaugeRing value={Math.round(gpu.percent)} max={100} unit="%" size={110}
          color="var(--chart-cpu)" warn={gpu.percent > 90} />
        <div className="ov-gauge-sub">VRAM {gpu.vram_used_gb} / {gpu.vram_total_gb} GB</div>
        <div className="ov-gauge-sub">{gpu.temp}°C</div>
      </div>
    </OvCard>
  );
}

// ── Memory section ────────────────────────────────────────────────
function RAMCompactCard({ data, onClick }) {
  const total = data?.ram_total_gb || 0;
  const available = data?.ram_available_gb || 0;
  const usedApparent = total > 0 ? +(total - available).toFixed(1) : (data?.ram_used_gb || 0);
  const pct = data?.ram_percent != null ? Math.round(data.ram_percent) : null;
  const warn = (pct || 0) > 85;

  const inlineStats = [
    { label: 'CACHED',    value: data?.ram_cached_gb,    unit: 'GB' },
    { label: 'BUFFERS',   value: data?.ram_buffers_gb,   unit: 'GB' },
    { label: 'DISPONIBLE',value: available || null,       unit: 'GB' },
  ];

  return (
    <OvCard onClick={onClick} style={{ gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <OvLabel text="RAM" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{total} GB total</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: '3rem', fontWeight: 700, lineHeight: 1,
          fontFamily: 'var(--num-font)', color: warn ? 'var(--alert)' : 'var(--text)',
        }}>{usedApparent.toFixed(1)}</span>
        <span style={{ fontSize: '1.3rem', color: 'var(--text-mid)' }}>GB</span>
        {pct != null && (
          <span style={{ fontSize: '0.95rem', color: 'var(--text-dim)', marginLeft: 4 }}>({pct}%)</span>
        )}
      </div>

      <Bar pct={pct} color="var(--chart-ram)" warn={warn} height={5} />

      <div style={{ display: 'flex', gap: 20, marginTop: 6, flexWrap: 'wrap' }}>
        {inlineStats.map(s => (
          <div key={s.label}>
            <div className="ov-micro-label">{s.label}</div>
            <span style={{ fontSize: '0.92rem', fontWeight: 600, fontFamily: 'var(--num-font)' }}>
              {s.value != null ? s.value.toFixed(1) : '—'}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-mid)', marginLeft: 2 }}>{s.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </OvCard>
  );
}

function RAMDistribCard({ data, onClick }) {
  const items = [
    { label: 'En uso (apps)', value: data?.ram_used_gb,       color: 'var(--distrib-apps)' },
    { label: 'Cached',        value: data?.ram_cached_gb,     color: 'var(--distrib-cached)' },
    { label: 'Buffers',       value: data?.ram_buffers_gb,    color: 'var(--distrib-buffers)' },
    { label: 'Libre',         value: data?.ram_available_gb,  color: 'var(--distrib-libre)' },
  ];
  return (
    <OvCard onClick={onClick}>
      <OvLabel text="Distribución RAM" />
      <div style={{ marginTop: 8 }}>
        {items.map(it => (
          <div key={it.label} className="ov-distrib-row">
            <span className="ov-distrib-dot" style={{ background: it.color }} />
            <span className="ov-distrib-label">{it.label}</span>
            <span className="ov-distrib-val">{it.value != null ? it.value.toFixed(1) : '—'} GB</span>
          </div>
        ))}
      </div>
      {data && (
        <div style={{ marginTop: 10 }}>
          <Bar pct={data.ram_percent} color="var(--chart-ram)" height={4} />
        </div>
      )}
    </OvCard>
  );
}

function SwapDetailsCard({ data }) {
  const used = data?.swap_used_gb || 0;
  const total = data?.swap_total_gb || 0;
  const pct = total > 0 ? Math.round(used / total * 100) : 0;
  const free = +(total - used).toFixed(1);

  return (
    <OvCard>
      <OvLabel text="Swap" />

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <span style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1, fontFamily: 'var(--num-font)' }}>
          {used.toFixed(1)}
        </span>
        <span style={{ fontSize: '1.1rem', color: 'var(--text-mid)' }}>/ {total} GB</span>
      </div>

      <Bar pct={pct} color="var(--chart-swap)" height={4} />

      <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 12 }}>{pct}% usado</div>

      <div className="ov-distrib-row">
        <span className="ov-distrib-dot" style={{ background: 'var(--chart-swap)' }} />
        <span className="ov-distrib-label">En uso</span>
        <span className="ov-distrib-val">{used.toFixed(1)} GB</span>
      </div>
      <div className="ov-distrib-row">
        <span className="ov-distrib-dot" style={{ background: 'var(--border-strong)' }} />
        <span className="ov-distrib-label">Libre</span>
        <span className="ov-distrib-val">{free} GB</span>
      </div>
      <div className="ov-distrib-row">
        <span className="ov-distrib-dot" style={{ background: 'var(--text-dim)' }} />
        <span className="ov-distrib-label">Total</span>
        <span className="ov-distrib-val">{total} GB</span>
      </div>
    </OvCard>
  );
}

// ── Storage + Network + Docker section ────────────────────────────
function DisksOvCard({ disks, onClick }) {
  return (
    <OvCard onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <OvLabel text="Discos" />
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
    </OvCard>
  );
}

function NetworkOvCard({ data, spark, onClick }) {
  return (
    <OvCard onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <OvLabel text="Red" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{data?.net_iface || '—'}</span>
      </div>

      {/* Download row */}
      <div style={{ marginBottom: 10 }}>
        <div className="ov-micro-label">↓ DESCARGA</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <div style={{ flexShrink: 0, minWidth: 90, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="ov-net-num">{data?.net_recv_mbps ?? '—'}</span>
            <span className="ov-net-unit">Mb/s</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SparkLine data={spark?.recv} color="var(--chart-net-recv)" height={38} fill />
          </div>
        </div>
      </div>

      {/* Upload row */}
      <div style={{ marginBottom: 10 }}>
        <div className="ov-micro-label">↑ SUBIDA</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <div style={{ flexShrink: 0, minWidth: 90, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="ov-net-num">{data?.net_sent_mbps ?? '—'}</span>
            <span className="ov-net-unit">Mb/s</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SparkLine data={spark?.sent} color="var(--chart-net-sent)" height={38} fill />
          </div>
        </div>
      </div>

      {data?.net_latency_ms != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span className="ov-micro-label">LATENCIA</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--num-font)' }}>{data.net_latency_ms}</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-mid)' }}>ms</span>
        </div>
      )}
    </OvCard>
  );
}

function DockerSummaryCard({ docker, onClick }) {
  if (!docker?.available) return (
    <OvCard>
      <OvLabel text="Docker" />
      <div style={{ marginTop: 16, color: 'var(--text-dim)', fontSize: '0.9rem' }}>No disponible</div>
    </OvCard>
  );
  const hasIssues = docker.restarting > 0 || docker.stopped > 0;
  return (
    <OvCard onClick={onClick}>
      <OvLabel text="Docker" />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
        <span style={{
          fontSize: '2.6rem', fontWeight: 700, lineHeight: 1,
          color: hasIssues ? 'var(--alert)' : 'var(--text)', fontFamily: 'var(--num-font)',
        }}>{docker.running}</span>
        <span style={{ fontSize: '1rem', color: 'var(--text-mid)' }}>/ {docker.total}</span>
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>contenedores activos</div>
      {hasIssues && (
        <div style={{ marginTop: 10 }}>
          {docker.restarting > 0 && (
            <div className="ov-issue-badge" style={{ color: '#f59e0b', borderColor: '#f59e0b44' }}>
              {docker.restarting} restarting
            </div>
          )}
          {docker.stopped > 0 && (
            <div className="ov-issue-badge" style={{ color: 'var(--text-dim)', borderColor: 'var(--border-strong)', marginTop: 4 }}>
              {docker.stopped} stopped
            </div>
          )}
        </div>
      )}
    </OvCard>
  );
}

// ── Main Overview ─────────────────────────────────────────────────
export default function Overview({ current, disks, docker, spark, onNavigate }) {
  return (
    <div>
      {/* Compute */}
      <div className="overview-section">
        <SectionHeader label="Cómputo" />
        <div className="overview-grid-4">
          <CPUCompactCard data={current} spark={spark?.cpu} onClick={() => onNavigate('cpu')} />
          <TempGaugeCard  data={current} />
          <GPUCard        data={current} />
        </div>
      </div>

      {/* Memory */}
      <div className="overview-section">
        <SectionHeader label="Memoria" />
        <div className="overview-grid-4">
          <RAMCompactCard  data={current} onClick={() => onNavigate('memory')} />
          <RAMDistribCard  data={current} onClick={() => onNavigate('memory')} />
          <SwapDetailsCard data={current} />
        </div>
      </div>

      {/* Storage, Network & Docker */}
      <div className="overview-section">
        <SectionHeader label="Almacenamiento, Red y Contenedores" />
        <div className="overview-grid-3">
          <DisksOvCard      disks={disks}   onClick={() => onNavigate('storage')} />
          <NetworkOvCard    data={current} spark={spark} onClick={() => onNavigate('network')} />
          <DockerSummaryCard docker={docker} onClick={() => onNavigate('containers')} />
        </div>
      </div>
    </div>
  );
}
