export default function GaugeRing({ value, max, unit, size = 130, color = 'var(--distrib-arc)', warn = false }) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - size * 0.11;
  const sw = size * 0.085;
  const circ = 2 * Math.PI * r;
  const pct = value != null ? Math.min(value / max, 0.999) : 0;
  const arc = pct * circ;
  const clr = warn ? 'var(--alert)' : color;
  const display = value != null
    ? (Number.isInteger(value) ? String(value) : value.toFixed(1))
    : '—';

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={clr} strokeWidth={sw}
        strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
      <text x={cx} y={cy + size * 0.05} textAnchor="middle"
        fontSize={size * 0.21} fontWeight={700} fill="var(--text)">{display}</text>
      <text x={cx} y={cy + size * 0.23} textAnchor="middle"
        fontSize={size * 0.11} fill="var(--text-mid)">{unit}</text>
    </svg>
  );
}
