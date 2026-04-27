import SparkLine from '../charts/SparkLine';
import GaugeRing from '../charts/GaugeRing';

function SectionHeader({ label }) {
  return (
    <div className="section-header">{label}</div>
  );
}

function OvCard({ children, onClick, className = '' }) {
  return (
    <div className={`card${onClick ? ' clickable' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

function OvLabel({ text }) {
  return <div className="ov-card-label">{text}</div>;
}

// ── Compute section ───────────────────────────────────────────────
function CPUGaugeCard({ data, spark, onClick }) {
  const warn = (data?.cpu_percent || 0) > 85;
  return (
    <OvCard onClick={onClick}>
      <OvLabel text="CPU" />
      <div className="gauge-center">
        <GaugeRing
          value={data?.cpu_percent != null ? Math.round(data.cpu_percent) : null}
          max={100} unit="%" size={120}
          color="var(--chart-cpu)" warn={warn}
        />
        <div className="ov-gauge-sub">{data?.cpu_freq_ghz ? `${data.cpu_freq_ghz} GHz` : '—'}</div>
      </div>
    </OvCard>
  );
}

function CPUStatsCard({ data, spark, onClick }) {
  return (
    <OvCard onClick={onClick}>
      <OvLabel text="Load avg" />
      <div className="ov-stat-row">
        <span className="ov-stat-num">{data?.load_1 ?? '—'}</span>
        <span className="ov-stat-lbl">1m</span>
      </div>
      <div className="ov-stat-row" style={{ marginTop: 4 }}>
        <span className="ov-stat-num-sm">{data?.load_5 ?? '—'}</span>
        <span className="ov-stat-lbl">5m</span>
        <span className="ov-stat-num-sm" style={{ marginLeft: 12 }}>{data?.load_15 ?? '—'}</span>
        <span className="ov-stat-lbl">15m</span>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="ov-micro-label">USO · últimos 60s</div>
        <SparkLine data={spark} color="var(--chart-cpu)" height={36} />
      </div>
    </OvCard>
  );
}

function TempGaugeCard({ data }) {
  const warn = (data?.temp_cpu || 0) > 78;
  return (
    <OvCard>
      <OvLabel text="Temperatura" />
      <div className="gauge-center">
        <GaugeRing
          value={data?.temp_cpu}
          max={100} unit="°C" size={120}
          color="var(--chart-temp)" warn={warn}
        />
        {data?.gpu && <div className="ov-gauge-sub">GPU {data.gpu.temp}°C</div>}
      </div>
    </OvCard>
  );
}

function GPUCard({ data }) {
  const gpu = data?.gpu;
  if (!gpu) {
    return (
      <OvCard>
        <OvLabel text="GPU" />
        <div className="gauge-center" style={{ marginTop: 16 }}>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-dim)' }}>No detectada</div>
        </div>
      </OvCard>
    );
  }
  const warn = gpu.percent > 90;
  return (
    <OvCard>
      <OvLabel text="GPU" />
      <div className="ov-card-meta">{gpu.model?.replace(/NVIDIA GeForce |GeForce /g, '')}</div>
      <div className="gauge-center" style={{ marginTop: 6 }}>
        <GaugeRing value={Math.round(gpu.percent)} max={100} unit="%" size={110}
          color="var(--chart-cpu)" warn={warn} />
        <div className="ov-gauge-sub">VRAM {gpu.vram_used_gb} / {gpu.vram_total_gb} GB</div>
        <div className="ov-gauge-sub">{gpu.temp}°C</div>
      </div>
    </OvCard>
  );
}

// ── Memory section ────────────────────────────────────────────────
function RAMGaugeCard({ data, onClick }) {
  const warn = (data?.ram_percent || 0) > 85;
  const total = data?.ram_total_gb || 0;
  const used = data?.ram_used_gb || 0;
  return (
    <OvCard onClick={onClick}>
      <OvLabel text="RAM" />
      <div className="gauge-center">
        <GaugeRing
          value={data?.ram_percent != null ? Math.round(data.ram_percent) : null}
          max={100} unit="%" size={120}
          color="var(--chart-ram)" warn={warn}
        />
        <div className="ov-gauge-sub">{used} / {total} GB</div>
      </div>
    </OvCard>
  );
}

function RAMDetailsCard({ data, onClick }) {
  const items = [
    { label: 'Cached',     value: data?.ram_cached_gb,    color: 'var(--distrib-cached)' },
    { label: 'Buffers',    value: data?.ram_buffers_gb,   color: 'var(--distrib-buffers)' },
    { label: 'Disponible', value: data?.ram_available_gb, color: 'var(--distrib-libre)' },
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
        <div style={{ marginTop: 14 }}>
          <div className="ov-micro-label">% usado</div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, marginTop: 4 }}>
            <div style={{
              height: '100%', borderRadius: 3, background: 'var(--chart-ram)',
              width: `${Math.min(data.ram_percent || 0, 100)}%`, transition: 'width 0.5s',
            }} />
          </div>
        </div>
      )}
    </OvCard>
  );
}

function SwapCard({ data }) {
  const used = data?.swap_used_gb || 0;
  const total = data?.swap_total_gb || 0;
  const pct = total > 0 ? Math.round(used / total * 100) : 0;
  return (
    <OvCard>
      <OvLabel text="Swap" />
      <div className="gauge-center">
        <GaugeRing value={pct} max={100} unit="%" size={110} color="var(--chart-swap)" />
        <div className="ov-gauge-sub">{used.toFixed(1)} / {total} GB</div>
      </div>
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
        <span style={{ fontSize: '2.6rem', fontWeight: 700, lineHeight: 1, color: hasIssues ? 'var(--alert)' : 'var(--text)', fontFamily: 'var(--num-font)' }}>
          {docker.running}
        </span>
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

// ── Storage & Network section ─────────────────────────────────────
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <OvLabel text="Red" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{data?.net_iface || '—'}</span>
      </div>
      <div className="ov-net-row">
        <div>
          <div className="ov-micro-label">↓ DESCARGA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="ov-net-num">{data?.net_recv_mbps ?? '—'}</span>
            <span className="ov-net-unit">Mb/s</span>
          </div>
        </div>
        <SparkLine data={spark?.recv} color="var(--chart-net-recv)" height={40} />
      </div>
      <div className="ov-net-row" style={{ marginTop: 10 }}>
        <div>
          <div className="ov-micro-label">↑ SUBIDA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="ov-net-num">{data?.net_sent_mbps ?? '—'}</span>
            <span className="ov-net-unit">Mb/s</span>
          </div>
        </div>
        <SparkLine data={spark?.sent} color="var(--chart-net-sent)" height={40} />
      </div>
      {data?.net_latency_ms != null && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ov-micro-label">LATENCIA</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--num-font)' }}>
            {data.net_latency_ms}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-mid)' }}>ms</span>
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
          <CPUGaugeCard  data={current} spark={spark?.cpu} onClick={() => onNavigate('cpu')} />
          <CPUStatsCard  data={current} spark={spark?.cpu} onClick={() => onNavigate('cpu')} />
          <TempGaugeCard data={current} />
          <GPUCard       data={current} />
        </div>
      </div>

      {/* Memory */}
      <div className="overview-section">
        <SectionHeader label="Memoria" />
        <div className="overview-grid-4">
          <RAMGaugeCard   data={current} onClick={() => onNavigate('memory')} />
          <RAMDetailsCard data={current} onClick={() => onNavigate('memory')} />
          <SwapCard       data={current} />
          <DockerSummaryCard docker={docker} onClick={() => onNavigate('containers')} />
        </div>
      </div>

      {/* Storage & Network */}
      <div className="overview-section">
        <SectionHeader label="Almacenamiento y Red" />
        <div className="overview-grid-2">
          <DisksOvCard   disks={disks}    onClick={() => onNavigate('storage')} />
          <NetworkOvCard data={current} spark={spark} onClick={() => onNavigate('network')} />
        </div>
      </div>
    </div>
  );
}
