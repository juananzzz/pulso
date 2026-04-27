export default function AlertsStrip({ alerts }) {
  if (!alerts.length) return null;
  return (
    <div className="alerts-strip">
      <span className="alerts-count">{alerts.length}</span>
      <span className="alerts-label">Alerts active</span>
      <div className="alerts-items">
        {alerts.map((a, i) => (
          <div className="alert-item" key={i}>
            <span>{a.text}</span><span className="alert-tag">{a.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
