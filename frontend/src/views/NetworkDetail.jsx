function netStatus(recv, sent) {
  const total = (recv || 0) + (sent || 0);
  if (total < 1) return { label: 'Low traffic', color: 'var(--ok)' };
  if (total < 20) return { label: 'Moderate traffic', color: 'var(--warn)' };
  return { label: 'High traffic', color: 'var(--alert)' };
}

export default function NetworkDetail({ current, spark: _spark }) {
  const recv = current?.net_recv_mbps;
  const sent = current?.net_sent_mbps;
  const latency = current?.net_latency_ms;
  const iface = current?.net_iface;
  const totalRecv = current?.net_recv_total_gb;
  const totalSent = current?.net_sent_total_gb;
  const status = netStatus(recv, sent);

  return (
    <div className="detail">
      {/* Level 1: Primary status */}
      <div className="net-primary">
        <div className="net-primary-left">
          <div className="detail-title" style={{ marginBottom: 0 }}>Network</div>
          <div className="detail-sub" style={{ marginBottom: 0, display: 'flex', gap: 8 }}>
            <span>{iface || '—'}</span>
            {totalRecv != null && <span style={{ color: 'var(--text-dim)' }}>· {totalRecv.toFixed(1)} GB recv</span>}
            {totalSent != null && <span style={{ color: 'var(--text-dim)' }}>· {totalSent.toFixed(1)} GB sent</span>}
          </div>
          <div className="net-status-row">
            <span className="net-status-indicator" style={{ background: status.color }} />
            <span className="net-status-text" style={{ color: status.color }}>{status.label}</span>
          </div>
        </div>
        <div className="net-primary-right">
          <div className="net-speeds">
            <div className="net-speed-card">
              <div className="net-speed-label" style={{ color: 'var(--chart-net-recv)' }}>↓ Download</div>
              <div className="net-speed-val" style={{ color: 'var(--chart-net-recv)' }}>{recv ?? '—'}<span className="net-speed-unit">Mb/s</span></div>
            </div>
            <div className="net-speed-card">
              <div className="net-speed-label" style={{ color: 'var(--chart-net-sent)' }}>↑ Upload</div>
              <div className="net-speed-val" style={{ color: 'var(--chart-net-sent)' }}>{sent ?? '—'}<span className="net-speed-unit">Mb/s</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Level 2: Secondary metrics */}
      <div className="net-secondary">
        <div className="net-metric">
          <div className="net-metric-label">Latency</div>
          <div className="net-metric-val">{latency ?? '—'}<span className="net-metric-unit">ms</span></div>
        </div>
        <div className="net-metric">
          <div className="net-metric-label">Interface</div>
          <div className="net-metric-val" style={{ fontSize: '1.2rem' }}>{iface || '—'}</div>
        </div>
        <div className="net-metric">
          <div className="net-metric-label">Total Received</div>
          <div className="net-metric-val">{totalRecv?.toFixed(1) ?? '—'}<span className="net-metric-unit">GB</span></div>
        </div>
        <div className="net-metric">
          <div className="net-metric-label">Total Sent</div>
          <div className="net-metric-val">{totalSent?.toFixed(1) ?? '—'}<span className="net-metric-unit">GB</span></div>
        </div>
      </div>

      {/* Level 3: Interface */}
      <div className="net-details-grid">
        <div className="chart-section">
          <div className="net-iface-card">
            <div className="card-title-row"><span>Interface</span></div>
            <div className="net-iface-row">
              <span className="net-iface-dot" style={{ background: 'var(--ok)' }} />
              <span className="net-iface-name">{iface || '—'}</span>
              <span className="net-iface-status" style={{ color: 'var(--ok)' }}>Active</span>
            </div>
            <div className="net-iface-speed-row">
              <span className="net-iface-speed-val" style={{ color: 'var(--chart-net-recv)' }}>
                ↓ {recv ?? '—'} <span className="net-speed-unit">Mb/s</span>
              </span>
              <span className="net-iface-speed-div" />
              <span className="net-iface-speed-val" style={{ color: 'var(--chart-net-sent)' }}>
                ↑ {sent ?? '—'} <span className="net-speed-unit">Mb/s</span>
              </span>
            </div>
            <div className="net-iface-detail">
              <div className="net-iface-detail-row">
                <span className="net-meta-label">Latency</span>
                <span className="net-meta-val">{latency ?? '—'} ms</span>
              </div>
              <div className="net-iface-detail-row">
                <span className="net-meta-label">Total DL</span>
                <span className="net-meta-val">{totalRecv?.toFixed(1) ?? '—'} GB</span>
              </div>
              <div className="net-iface-detail-row">
                <span className="net-meta-label">Total UL</span>
                <span className="net-meta-val">{totalSent?.toFixed(1) ?? '—'} GB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
