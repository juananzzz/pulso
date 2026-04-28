import { useState, useRef } from 'react';

export default function SparkLine({ data = [], color = 'var(--text)', height = 40, fill = false, minMax }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);

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
    if (!ref.current || !wrapRef.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let best = pts[0];
    for (const p of pts) {
      if (Math.abs(p.x - mx) < Math.abs(best.x - mx)) best = p;
    }
    const frac = best.x / W;
    const px = frac * rect.width;
    const clamped = Math.max(12, Math.min(px, rect.width - 12));
    setTip({ frac: clamped / rect.width, px: rect.left + clamped, v: best.v });
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', overflow: 'visible' }}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={svgW} height={H}
        style={{ display: 'block' }}
        onMouseMove={fill ? handleMove : undefined}
        onMouseLeave={fill ? () => setTip(null) : undefined}>
        <line x1={0} y1={H - 1} x2={W} y2={H - 1} stroke="var(--border)" strokeWidth={1} />
        <path d={area} fill={color} fillOpacity={0.12} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {tip && (
          <circle cx={tip.frac * W} cy={H - (tip.v / max) * (H - 4) - 2} r={4} fill={color} stroke="var(--card-bg)" strokeWidth={2} />
        )}
      </svg>
      {tip && (
        <div style={{
          position: 'fixed', left: tip.px, top: ref.current.getBoundingClientRect().top - 22,
          transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 4, padding: '2px 7px',
          fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--num-font)',
          color: 'var(--text)', pointerEvents: 'none',
          whiteSpace: 'nowrap', zIndex: 999,
        }}>
          {tip.v.toFixed(1)}
        </div>
      )}
    </div>
  );
}
