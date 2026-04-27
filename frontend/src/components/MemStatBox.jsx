export default function MemStatBox({ label, value, total, unit, sub, color = 'var(--chart-cpu)' }) {
  const pct = total > 0 ? (value / total * 100) : 0;
  return (
    <div className="stat-box">
      <div className="stat-box-label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0 6px' }}>
        <span className="stat-box-val">{value != null ? value.toFixed(1) : '—'}</span>
        {total
          ? <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>/ {total} {unit}</span>
          : <span className="stat-box-unit"> {unit}</span>}
      </div>
      {total > 0 && (
        <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', marginBottom: '6px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
        </div>
      )}
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  );
}
