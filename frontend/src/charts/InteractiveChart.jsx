import { useRef, useState, useCallback } from 'react';

export default function InteractiveChart({
  data = [], height = 280, yMax = 100, yMin = 0,
  color = 'var(--text)', accessor = d => d.v,
  timeRange, ranges, onTimeRangeChange,
  title, onClose, modal,
}) {
  const ref = useRef(null);
  const [hoverX, setHoverX] = useState(null);

  const W = 800, H = height;
  const PL = 40, PR = 12, PT = 8, PB = 48;
  const cW = W - PL - PR, cH = H - PT - PB;
  const range = yMax - yMin || 1;
  const n = Math.max(data.length - 1, 1);

  const ticks = Array.from({ length: 5 }, (_, i) => yMin + range * i / 4);

  const pts = data.map((d, i) => ({
    x: PL + (i / n) * cW,
    y: PT + cH - (Math.max(yMin, Math.min(accessor(d), yMax)) - yMin) / range * cH,
    val: accessor(d),
    ts: d.ts,
  }));

  const line = pts.length > 1
    ? `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';
  const area = pts.length > 1
    ? `${line} L ${pts[n].x.toFixed(1)},${PT + cH} L ${pts[0].x.toFixed(1)},${PT + cH} Z`
    : '';

  const secLabels = timeRange === '1m' ? [-60, -45, -30, -15, 0]
    : timeRange === '8h' ? [-28800, -21600, -14400, -7200, 0]
    : timeRange === '24h' ? [-86400, -64800, -43200, -21600, 0]
    : [-3600, -2700, -1800, -900, 0];
  const secFmt = timeRange === '1m' ? s => s === 0 ? 'now' : `${s}s`
    : timeRange === '8h' || timeRange === '24h' ? s => s === 0 ? 'now' : `${-s / 3600}h`
    : s => s === 0 ? 'now' : `${-s / 60}m`;

  const xLabels = secLabels.map(sec => {
    const idx = Math.round(n + sec / ((timeRange === '1m' ? 60 : timeRange === '8h' ? 28800 : timeRange === '24h' ? 86400 : 3600) / n));
    if (idx < 0 || idx > n) return null;
    return { x: PL + (idx / n) * cW, label: secFmt(sec) };
  }).filter(Boolean);

  const nearest = useCallback((clientX) => {
    if (!ref.current || pts.length === 0) return null;
    const b = ref.current.getBoundingClientRect();
    const mx = clientX - b.left;
    const svgX = mx / b.width * W;
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i].x - svgX);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return pts[best];
  }, [pts, W]);

  const handleMouseMove = useCallback(e => {
    const p = nearest(e.clientX);
    if (p) setHoverX(p.x);
  }, [nearest]);

  const handleMouseLeave = () => setHoverX(null);

  const tooltipPoint = hoverX != null
    ? pts.reduce((best, p) => Math.abs(p.x - hoverX) < Math.abs(best.x - hoverX) ? p : best, pts[0])
    : null;

  const fmtTime = ts => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString();
  };

  const tooltipX = tooltipPoint ? Math.min(Math.max(tooltipPoint.x, PL + 70), PL + cW - 70) : PL + 70;
  const tooltipY = tooltipPoint
    ? (tooltipPoint.y < PT + cH / 2 ? tooltipPoint.y + 14 : tooltipPoint.y - 28)
    : PT + cH + 22;

  return (
    <div style={{ position: 'relative' }}>
      {!modal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-dim)', fontSize: '0.88rem', padding: '4px 0',
            transition: 'color 0.2s',
          }} onMouseOver={e => e.target.style.color = 'var(--text)'}
             onMouseOut={e => e.target.style.color = 'var(--text-dim)'}>
            ← {title}
          </button>
          <div className="range-selector">
            {ranges.map(r => (
              <button key={r.value} className={`range-btn${timeRange === r.value ? ' active' : ''}`}
                onClick={() => onTimeRangeChange(r.value)}>{r.label}</button>
            ))}
          </div>
        </div>
      )}

      <div ref={ref} style={{ position: 'relative' }}
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {ticks.map(t => {
            const y = PT + cH - (t - yMin) / range * cH;
            const label = range < 5 ? t.toFixed(1) : Math.round(t);
            return (
              <g key={t}>
                <line x1={PL} y1={y} x2={PL + cW} y2={y} stroke="var(--border)" strokeWidth={1} />
                <text x={PL - 4} y={y + 4} textAnchor="end" fontSize={8} fill="var(--text-dim)">{label}</text>
              </g>
            );
          })}
          {xLabels.map(({ x, label }) => (
            <text key={label} x={x} y={PT + cH + 16} textAnchor="middle" fontSize={10} fill="var(--text-dim)">{label}</text>
          ))}
          {tooltipPoint && (
            <line x1={tooltipPoint.x} y1={PT} x2={tooltipPoint.x} y2={PT + cH}
              stroke="var(--text)" strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
          )}
          {area && <path d={area} fill={color} fillOpacity={0.12} />}
          {line && <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />}

          {tooltipPoint && (
            <g>
              <rect x={tooltipX - 70} y={tooltipY - 8} width={140} height={20} rx={4}
                fill="var(--card-bg)" stroke="var(--border)" strokeWidth={1} />
              <text x={tooltipX - 60} y={tooltipY + 4} fontSize={11} fill="var(--text-dim)">V: </text>
              <text x={tooltipX - 42} y={tooltipY + 4} fontSize={11} fontWeight={700} fill="var(--text)">{tooltipPoint.val?.toFixed(1)}</text>
              <text x={tooltipX + 5} y={tooltipY + 4} fontSize={11} fill="var(--text-dim)">T: </text>
              <text x={tooltipX + 20} y={tooltipY + 4} fontSize={11} fontWeight={600} fill="var(--text)">{fmtTime(tooltipPoint.ts)}</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
