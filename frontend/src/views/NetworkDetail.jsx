import AreaChart from '../charts/AreaChart';

export default function NetworkDetail({ current, spark }) {
  return (
    <div className="detail">
      <div className="detail-title">Network</div>
      <div className="detail-sub">{current?.net_iface}</div>
      <div className="stat-boxes">
        <div className="stat-box"><div className="stat-box-label">Download</div><div className="stat-box-val">{current?.net_recv_mbps ?? '—'}<span className="stat-box-unit"> Mb/s</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Upload</div><div className="stat-box-val">{current?.net_sent_mbps ?? '—'}<span className="stat-box-unit"> Mb/s</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Latency</div><div className="stat-box-val">{current?.net_latency_ms ?? '—'}<span className="stat-box-unit"> ms</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Interface</div><div className="stat-box-val" style={{ fontSize: '1rem', paddingTop: '6px' }}>{current?.net_iface ?? '—'}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)', marginTop: '-12px' }}>
        <div className="stat-box"><div className="stat-box-label">Total Recv</div><div className="stat-box-val" style={{ fontSize: '1.3rem' }}>{current?.net_recv_total_gb?.toFixed(1) ?? '—'}<span className="stat-box-unit"> GB</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Total Sent</div><div className="stat-box-val" style={{ fontSize: '1.3rem' }}>{current?.net_sent_total_gb?.toFixed(1) ?? '—'}<span className="stat-box-unit"> GB</span></div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        <div className="chart-section">
          <div className="chart-label" style={{ marginBottom: 4, fontSize: '0.78rem' }}>Download <span className="chart-unit">Mb/s</span></div>
          <div className="chart-wrap" style={{ padding: '6px 8px' }}>
            <AreaChart data={spark?.recv?.map(v => ({ v }))} accessor={d => d.v} yMax={Math.max(100, ...(spark?.recv || [0]))} height={160} color="var(--chart-net-recv)" />
          </div>
        </div>
        <div className="chart-section">
          <div className="chart-label" style={{ marginBottom: 4, fontSize: '0.78rem' }}>Upload <span className="chart-unit">Mb/s</span></div>
          <div className="chart-wrap" style={{ padding: '6px 8px' }}>
            <AreaChart data={spark?.sent?.map(v => ({ v }))} accessor={d => d.v} yMax={Math.max(100, ...(spark?.sent || [0]))} height={160} color="var(--chart-net-sent)" />
          </div>
        </div>
      </div>
    </div>
  );
}
