import { useState, useRef } from 'react';

export default function SparkLine({ data = [], color = 'var(--text)', height = 40, fill = false, minMax }) {
  const ref = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const W = fill ? Math.max(300, data.length * 8) : 130;
  const H = height;
  const svgW = fill ? '100%' : W;

  if (data.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
      waiting for data…
    </div>
  );

  const max = Math.max(...data, minMax || 1);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (v / max) * (H - 4) - 2,
    v,
  }));
  const line = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const area = `${line} L ${W},${H} L 0,${H} Z`;

  const handleMove = e => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let closest = pts[0];
    for (const p of pts) {
      if (Math.abs(p.x - mx) < Math.abs(closest.x - mx)) closest = p;
    }
    setTooltip({ x: (closest.x / W) * 100, y: closest.y, v: closest.v });
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={svgW} height={H}
        style={{ display: 'block' }}
        onMouseMove={fill ? handleMove : undefined}
        onMouseLeave={fill ? () => setTooltip(null) : undefined}>
        <line x1={0} y1={H - 1} x2={W} y2={H - 1} stroke="var(--border)" strokeWidth={1} />
        <path d={area} fill={color} fillOpacity={0.18} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {tooltip && (
          <circle cx={(tooltip.x / 100) * W} cy={tooltip.y} r={4} fill={color} stroke="var(--card-bg)" strokeWidth={2} />
        )}
      </svg>
      {tooltip && (
        <div style={{
          position: 'absolute', left: `${tooltip.x}%`, top: -6,
          transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 4, padding: '2px 6px',
          fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--num-font)',
          color: 'var(--text)', pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          {tooltip.v.toFixed(1)}
        </div>
      )}
    </div>
  );
}
