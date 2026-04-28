export default function MemStatBox({ label, value, total, unit, sub, color = 'var(--chart-cpu)', pct: pctProp, swapPct }) {
  const pct = pctProp != null ? pctProp : (total > 0 ? (value / total * 100) : 0);
  const isSwap = swapPct != null;
  const severity = isSwap ? (swapPct >= 75 ? 'swap-alert' : swapPct >= 50 ? 'swap-mid' : '') : '';
  return (
    <div className={`stat-box${severity ? ' ' + severity : ''}`}>
      <div className="stat-box-label">{label}{severity && <span className="swap-badge">{Math.round(swapPct)}%</span>}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0 6px' }}>
        <span className="stat-box-val" style={{ color: isSwap ? color : (pctProp != null ? color : undefined) }}>{value != null ? value.toFixed(1) : '—'}</span>
        {total
          ? <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>/ {total} {unit}</span>
          : <span className="stat-box-unit"> {unit}</span>}
      </div>
      {total > 0 && (
        <div style={{ height: severity ? '6px' : '3px', background: 'var(--border)', borderRadius: '2px', marginBottom: '6px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
        </div>
      )}
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  );
}
