export default function AlertsView({ alerts }) {
  return (
    <div className="detail">
      <div className="detail-title">Alerts</div>
      <div className="detail-sub">{alerts.length} active {alerts.length === 1 ? 'alert' : 'alerts'}</div>
      {alerts.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.95rem' }}>
          No active alerts
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((a, i) => (
            <div key={i} className="chart-wrap" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--alert)', lineHeight: 1 }}>{a.tag}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{a.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
