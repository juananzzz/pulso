import AreaChart from '../charts/AreaChart';

export default function CPUDetail({ sysInfo, current, spark, cpuCores }) {
  const top = current?.top_cpu_proc;
  return (
    <div className="detail">
      <div className="detail-title">CPU</div>
      <div className="detail-sub">
        {[sysInfo?.cpu_model, sysInfo?.cpu_threads && `${sysInfo.cpu_threads} threads`, current?.cpu_freq_ghz && `${current.cpu_freq_ghz} GHz`].filter(Boolean).join(' · ')}
      </div>
      <div className="stat-boxes">
        <div className="stat-box"><div className="stat-box-label">Usage</div><div className="stat-box-val">{current?.cpu_percent ?? '—'}<span className="stat-box-unit">%</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Temperature</div><div className="stat-box-val">{current?.temp_cpu ?? '—'}<span className="stat-box-unit">°C</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Frequency</div><div className="stat-box-val">{current?.cpu_freq_ghz ?? '—'}<span className="stat-box-unit">GHz</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Load Avg</div><div className="stat-box-val" style={{ fontSize: '1rem', paddingTop: '6px' }}>{current?.load_1} · {current?.load_5} · {current?.load_15}</div></div>
      </div>
      <div className="chart-section">
        <div className="chart-label">Usage · last 60s <span className="chart-unit">%</span></div>
        <div className="chart-wrap"><AreaChart data={spark?.cpu?.map(v => ({ v }))} accessor={d => d.v} yMax={100} height={160} color="var(--chart-cpu)" /></div>
      </div>
      {top && (
        <div className="chart-section">
          <div className="chart-label">Top process <span className="chart-unit">{top.name} · PID {top.pid}</span></div>
          <div className="top-proc-box">
            <span className="top-proc-name">{top.name}</span>
            <span className="top-proc-pct">{top.cpu}%</span>
            <span className="top-proc-pid">PID {top.pid}</span>
          </div>
        </div>
      )}
      <div className="chart-section">
        <div className="chart-label">Temperature · last 60s <span className="chart-unit">°C</span></div>
        <div className="chart-wrap"><AreaChart data={spark?.temp?.map(v => ({ v }))} accessor={d => d.v} yMax={100} height={160} color="var(--chart-temp)" /></div>
      </div>
      {cpuCores.length > 0 && (
        <div className="cores-section">
          <div className="cores-label">Per core <span style={{ color: 'var(--text-dim)' }}>{cpuCores.length} cores</span></div>
          <div className="cores-grid">
            {cpuCores.map(c => (
              <div className="core-block" key={c.core}>
                <div className="core-num">{String(c.core).padStart(2, '0')}</div>
                <div className="core-pct">{c.percent}%</div>
                <div className="core-bar-wrap"><div className="core-bar-fill" style={{ height: `${c.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
