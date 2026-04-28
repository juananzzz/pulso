import { useMemo } from 'react';

function netStatus(recv, sent) {
  const total = (recv || 0) + (sent || 0);
  if (total < 1) return { label: 'Low traffic', color: 'var(--ok)' };
  if (total < 20) return { label: 'Moderate traffic', color: 'var(--warn)' };
  return { label: 'High traffic', color: 'var(--alert)' };
}

export default function NetworkDetail({ current, spark }) {
  const recv = current?.net_recv_mbps;
  const sent = current?.net_sent_mbps;
  const latency = current?.net_latency_ms;
  const iface = current?.net_iface;
  const totalRecv = current?.net_recv_total_gb;
  const totalSent = current?.net_sent_total_gb;
  const status = netStatus(recv, sent);

  const maxVal = useMemo(() => {
    const m = Math.max(100, ...(spark?.recv || []), ...(spark?.sent || []));
    return Math.ceil(m / 10) * 10 || 100;
  }, [spark]);

  const recvData = useMemo(() => (spark?.recv || []).map(v => ({ v })), [spark]);
  const sentData = useMemo(() => (spark?.sent || []).map(v => ({ v })), [spark]);

  const peakRecv = useMemo(() => {
    if (!spark?.recv) return [];
    return spark.recv.reduce((acc, v, i) => {
      if (v >= maxVal * 0.9) acc.push(i);
      return acc;
    }, []);
  }, [spark, maxVal]);

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

      {/* Level 3: Details */}
      <div className="net-details-grid">
        {/* Dual throughput chart */}
        <div className="chart-section">
          <div className="chart-label">
            <span>Throughput <span className="chart-unit">Mb/s</span></span>
            <span className="chart-time-label">Last 90s</span>
          </div>
          <div className="chart-wrap">
            <svg viewBox="0 0 800 200" style={{ width: '100%', height: '100%', display: 'block' }}>
              {[0, 0.25, 0.5, 0.75, 1].map(r => {
                const y = 8 + 164 - r * 164;
                const label = Math.round(maxVal * r);
                return (
                  <g key={r}>
                    <line x1={38} y1={y} x2={792} y2={y} stroke="var(--border)" strokeWidth={1} />
                    <text x={34} y={y + 4} textAnchor="end" fontSize={8} fill="var(--text-dim)">{label}</text>
                  </g>
                );
              })}
              {(() => {
                const y90 = 8 + 164 - 0.9 * 164;
                return (
                  <g>
                    <line x1={38} y1={y90} x2={792} y2={y90} stroke="var(--alert)" strokeWidth={1} strokeDasharray="4 3" opacity={0.35} />
                    <rect x={758} y={y90 - 9} width={34} height={9} rx={3} fill="var(--alert)" opacity={0.8} />
                    <text x={792} y={y90 - 2} textAnchor="end" fontSize={7} fill="#fff" fontWeight={600}>{Math.round(maxVal * 0.9)}</text>
                  </g>
                );
              })()}
              {recvData.length > 1 && (() => {
                const pts = recvData.map((d, i) => ({
                  x: 38 + (i / (recvData.length - 1)) * 754,
                  y: 8 + 164 - Math.min(d.v, maxVal) / maxVal * 164,
                }));
                const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                const area = `${d} L ${pts[pts.length - 1].x.toFixed(1)},${8 + 164} L ${pts[0].x.toFixed(1)},${8 + 164} Z`;
                return (
                  <>
                    <path d={area} fill="var(--chart-net-recv)" fillOpacity={0.1} />
                    <path d={d} fill="none" stroke="var(--chart-net-recv)" strokeWidth={2} strokeLinejoin="round" />
                  </>
                );
              })()}
              {sentData.length > 1 && (() => {
                const pts = sentData.map((d, i) => ({
                  x: 38 + (i / (sentData.length - 1)) * 754,
                  y: 8 + 164 - Math.min(d.v, maxVal) / maxVal * 164,
                }));
                const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                return (
                  <path d={d} fill="none" stroke="var(--chart-net-sent)" strokeWidth={2} strokeLinejoin="round" />
                );
              })()}
              {peakRecv.map(i => {
                if (i < 0 || i >= recvData.length) return null;
                const x = 38 + (i / (recvData.length - 1)) * 754;
                const y = 8 + 164 - Math.min(recvData[i].v, maxVal) / maxVal * 164;
                return <circle key={i} cx={x} cy={y} r={3.5} fill="var(--chart-net-recv)" stroke="var(--card-bg)" strokeWidth={1.5} />;
              })}
              <text x={38} y={192} fontSize={8} fill="var(--text-dim)">now</text>
              <text x={38 + 754} y={192} textAnchor="end" fontSize={8} fill="var(--text-dim)">-90s</text>
            </svg>
            <div className="net-legend">
              <span className="net-legend-item"><span className="net-legend-line" style={{ background: 'var(--chart-net-recv)' }} /> Download</span>
              <span className="net-legend-item"><span className="net-legend-line" style={{ background: 'var(--chart-net-sent)' }} /> Upload</span>
            </div>
          </div>
        </div>

        {/* Interface card */}
        <div className="chart-section">
          <div className="chart-label"><span>Interface</span></div>
          <div className="net-iface-card">
            <div className="net-iface-row">
              <span className="net-iface-dot" style={{ background: 'var(--ok)' }} />
              <span className="net-iface-name">{iface || '—'}</span>
              <span className="net-iface-status" style={{ color: 'var(--ok)' }}>Active</span>
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
