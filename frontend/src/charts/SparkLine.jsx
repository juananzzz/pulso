export default function SparkLine({ data = [], color = 'var(--text)', height = 40 }) {
  const W = 130, H = height;
  if (data.length < 2) return <svg width={W} height={H} />;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(H - (v / max) * (H - 2) - 1).toFixed(1)}`);
  const line = `M ${pts.join(' L ')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block' }}>
      <path d={`${line} L ${W},${H} L 0,${H} Z`} fill={color} fillOpacity={0.13} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
