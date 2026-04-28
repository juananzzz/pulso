export default function AreaChart({
  data = [], height = 180, yMax = 100, yMin = 0,
  yUnit = '', color = 'var(--text)', accessor = d => d,
}) {
  const W = 800, H = height;
  const PL = 38, PR = 8, PT = 8, PB = 24;
  const cW = W - PL - PR, cH = H - PT - PB;

  if (data.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
      Collecting data…
    </div>
  );

  const range = yMax - yMin;
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + range * i / 4);
  const pts = data.map((d, i) => ({
    x: PL + (i / (data.length - 1)) * cW,
    y: PT + cH - (Math.max(yMin, Math.min(accessor(d), yMax)) - yMin) / range * cH,
  }));
  const line = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)},${PT + cH} L ${pts[0].x.toFixed(1)},${PT + cH} Z`;
  const n = data.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {ticks.map(t => {
        const y = PT + cH - (t - yMin) / range * cH;
        const label = range < 5 ? t.toFixed(1) : Math.round(t);
        return (
          <g key={t}>
            <line x1={PL} y1={y} x2={PL + cW} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={PL - 4} y={y + 4} textAnchor="end" fontSize={8} fill="var(--text-dim)">{label}{yUnit}</text>
          </g>
        );
      })}
      <path d={area} fill={color} fillOpacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
