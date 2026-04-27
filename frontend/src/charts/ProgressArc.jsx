export default function ProgressArc({ percent, size = 140 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 16, sw = 13;
  const circ = 2 * Math.PI * r;
  const arc = Math.min(percent, 99.9) / 100 * circ;
  const clr = percent > 85 ? 'var(--alert)' : percent > 70 ? '#f59e0b' : 'var(--distrib-arc)';
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={clr} strokeWidth={sw}
        strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
      <text x={cx} y={cy + size * 0.05} textAnchor="middle" fontSize={size * 0.15} fontWeight={700} fill="var(--text)">{percent}%</text>
      <text x={cx} y={cy + size * 0.2} textAnchor="middle" fontSize={size * 0.062} letterSpacing="1.5" fill="var(--text-dim)">USADA</text>
    </svg>
  );
}
