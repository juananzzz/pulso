import SparkLine from '../charts/SparkLine';

export function CPUCard({ data, spark, onClick }) {
  if (!data) return <div className="card wide clickable" />;
  const warn = data.cpu_percent > 85;
  return (
    <div className="card wide clickable" onClick={onClick}>
      <div className="card-header">
        <span className="card-label">CPU</span>
        <span className="card-meta">{data.cpu_freq_ghz ? `${data.cpu_freq_ghz} GHz` : ''}</span>
      </div>
      <div className="card-value-row">
        <span className="card-num" style={warn ? { color: 'var(--alert)' } : {}}>{Math.round(data.cpu_percent)}<span className="card-num-unit">%</span></span>
        <div className="sparkline-wrap"><SparkLine data={spark} color="var(--chart-cpu)" /></div>
      </div>
      <div className="card-sub"><b>LOAD</b>&nbsp; {data.load_1} &nbsp;{data.load_5} &nbsp;{data.load_15}</div>
    </div>
  );
}

export function TempCard({ data }) {
  if (!data) return <div className="card" />;
  const warn = data.temp_cpu > 78;
  return (
    <div className="card">
      <div className="card-header"><span className="card-label">Temp</span><span className="card-meta">cpu</span></div>
      <div className="card-num" style={warn ? { color: 'var(--alert)' } : {}}>{data.temp_cpu ?? '—'}<span className="card-num-unit">°C</span></div>
      {data.gpu && <div className="card-sub"><b>GPU</b>&nbsp; {data.gpu.temp}°C</div>}
    </div>
  );
}

export function MemoryCard({ data, spark, onClick }) {
  if (!data) return <div className="card wide clickable" />;
  const warn = data.ram_percent > 85;
  return (
    <div className="card wide clickable" onClick={onClick}>
      <div className="card-header">
        <span className="card-label">Memory</span>
      </div>
      <div className="card-value-row">
        <span className="card-num" style={warn ? { color: 'var(--alert)' } : {}}>{data.ram_used_gb}<span className="card-num-unit"> GB</span></span>
        <div className="sparkline-wrap"><SparkLine data={spark} color="var(--chart-ram)" /></div>
      </div>
      <div className="card-sub"><b>SWAP</b>&nbsp; {data.swap_used_gb} GB</div>
    </div>
  );
}

export function GpuCard({ data }) {
  const gpu = data?.gpu;
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-label">GPU</span>
        {gpu && <span className="card-meta">{gpu.model?.replace(/NVIDIA GeForce |GeForce /g, '')}</span>}
      </div>
      {gpu
        ? <><div className="card-num">{Math.round(gpu.percent)}<span className="card-num-unit">%</span></div>
          <div className="card-sub"><b>VRAM</b>&nbsp; {gpu.vram_used_gb} / {gpu.vram_total_gb} GB</div></>
        : <div className="card-num" style={{ color: 'var(--text-dim)', fontSize: '1.5rem' }}>N/A</div>}
    </div>
  );
}

export function DisksCard({ disks, onClick }) {
  return (
    <div className="card wide clickable" onClick={onClick}>
      <div className="card-header">
        <span className="card-label">Disks</span>
        <span className="card-meta">{disks.length} mounted</span>
      </div>
      {disks.slice(0, 5).map(d => (
        <div className="disk-row" key={d.mountpoint}>
          <span className="disk-mount">{d.mountpoint}</span>
          <div className="disk-bar-wrap"><div className={`disk-bar${d.percent > 90 ? ' warn' : ''}`} style={{ width: `${d.percent}%` }} /></div>
          <span className={`disk-pct${d.percent > 90 ? ' warn' : ''}`}>{d.percent}%</span>
        </div>
      ))}
    </div>
  );
}

export function LoadCard({ data }) {
  if (!data) return <div className="card" />;
  return (
    <div className="card">
      <div className="card-header"><span className="card-label">Load</span><span className="card-meta">1 · 5 · 15m</span></div>
      <div className="card-num" style={{ fontSize: '2.2rem' }}>{data.load_1}</div>
      <div className="card-sub"><b>AVG</b>&nbsp; {data.load_5} · {data.load_15}</div>
    </div>
  );
}

export function NetworkCard({ data, spark, onClick }) {
  if (!data) return <div className="card wide clickable" />;
  return (
    <div className="card wide clickable" onClick={onClick}>
      <div className="card-header"><span className="card-label">Network</span><span className="card-meta">{data.net_iface}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>↓ recv</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            <span className="card-num" style={{ fontSize: '2rem' }}>{data.net_recv_mbps}<span className="card-num-unit" style={{ fontSize: '0.75rem' }}>Mb/s</span></span>
            <div className="sparkline-wrap" style={{ width: 100 }}><SparkLine data={spark?.recv} height={32} color="var(--chart-net-recv)" /></div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '2px' }}>↑ sent</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            <span className="card-num" style={{ fontSize: '2rem' }}>{data.net_sent_mbps}<span className="card-num-unit" style={{ fontSize: '0.75rem' }}>Mb/s</span></span>
            <div className="sparkline-wrap" style={{ width: 100 }}><SparkLine data={spark?.sent} height={32} color="var(--chart-net-sent)" /></div>
          </div>
        </div>
      </div>
      {data.net_latency_ms != null && <div className="card-sub"><b>LATENCY</b>&nbsp; {data.net_latency_ms} ms</div>}
    </div>
  );
}

export function DockerCard({ docker, onClick }) {
  if (!docker?.available) return (
    <div className="card">
      <div className="card-header"><span className="card-label">Docker</span></div>
      <div className="card-num" style={{ color: 'var(--text-dim)', fontSize: '1.5rem' }}>N/A</div>
    </div>
  );
  const hasIssues = docker.restarting > 0 || docker.stopped > 0;
  return (
    <div className="card clickable" onClick={onClick}>
      <div className="card-header"><span className="card-label">Docker</span><span className="card-meta">{docker.total} total</span></div>
      <div className="card-num" style={hasIssues ? { color: 'var(--alert)' } : {}}>{docker.running}<span className="card-num-unit">/ {docker.total}</span></div>
      {hasIssues && (
        <div className="docker-issues">
          {docker.restarting > 0 && <span>{docker.restarting} restarting</span>}
          {docker.restarting > 0 && docker.stopped > 0 && <span> · </span>}
          {docker.stopped > 0 && <span>{docker.stopped} stopped</span>}
        </div>
      )}
    </div>
  );
}
