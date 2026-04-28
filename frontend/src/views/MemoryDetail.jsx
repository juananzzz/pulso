import { useState, useEffect } from 'react';
import AreaChart from '../charts/AreaChart';
import { ramColor, swapColor } from '../utils';

export default function MemoryDetail({ current, spark }) {
  const [range, setRange] = useState('1m');
  const [histData, setHistData] = useState([]);

  useEffect(() => {
    if (range === '1m') return;
    fetch(`/api/history?range=${range}`)
      .then(r => r.json())
      .then(setHistData)
      .catch(() => {});
  }, [range]);

  const total = current?.ram_total_gb || 32;
  const available = current?.ram_available_gb || 0;
  const cached = current?.ram_cached_gb || 0;
  const buffers = current?.ram_buffers_gb || 0;
  const used = current?.ram_used_gb || 0;
  const usedApparent = +(total - available).toFixed(1);
  const free = available;
  const usedPct = total > 0 ? Math.round(usedApparent / total * 100) : 0;

  const swapUsed = current?.swap_used_gb || 0;
  const swapTotal = current?.swap_total_gb || 0;
  const swapPct = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;

  const ramChartData = range === '1m'
    ? (spark?.ramGb || []).map(v => ({ v }))
    : histData.map(d => ({ v: d.ram != null ? +(d.ram * total / 100).toFixed(1) : 0 }));

  const swapChartData = range === '1m'
    ? (spark?.swapGb || []).map(v => ({ v }))
    : histData.map(d => ({ v: d.swap != null ? +d.swap.toFixed(1) : 0 }));

  const distribItems = [
    { label: 'En uso', value: used,    color: 'var(--distrib-apps)' },
    { label: 'Cached',  value: cached,  color: 'var(--distrib-cached)' },
    { label: 'Buffers', value: buffers, color: 'var(--distrib-buffers)' },
    { label: 'Libre',   value: free,    color: 'var(--distrib-libre)' },
  ];

  return (
    <div className="detail">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div className="detail-title">Memoria</div>
          <div className="detail-sub" style={{ margin: 0 }}>{total} GB RAM · {swapTotal} GB SWAP</div>
        </div>
        <div className="range-selector">
          {['1m', '1h', '24h'].map(r => (
            <button key={r} className={`range-btn${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="chart-label" style={{ fontSize: '0.85rem', marginBottom: 6 }}>RAM</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: ramColor(usedPct), lineHeight: 1 }}>{usedPct}<span style={{ fontSize: '0.85rem', fontWeight: 400 }}>%</span></span>
          <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)' }}>{usedApparent} / {total} GB usado</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 6, background: 'var(--border)' }}>
          {distribItems.filter(d => d.value > 0).map(seg => (
            <div key={seg.label} style={{ width: `${seg.value / total * 100}%`, background: seg.color, minWidth: seg.value > 0 ? 2 : 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginBottom: 8, fontSize: '0.78rem' }}>
          {distribItems.filter(d => d.value > 0).map(seg => (
            <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, display: 'inline-block' }} />
              <span style={{ color: 'var(--text-dim)' }}>{seg.label}</span>
              <span style={{ fontWeight: 600 }}>{seg.value.toFixed(1)} GB</span>
            </div>
          ))}
        </div>
        <div className="chart-wrap" style={{ padding: '4px 6px' }}>
          <AreaChart
            data={ramChartData}
            accessor={d => d.v}
            yMax={total}
            yMin={0}
            yUnit=" GB"
            height={110}
            color="var(--chart-ram)"
          />
        </div>
      </div>

      <div>
        <div className="chart-label" style={{ fontSize: '0.85rem', marginBottom: 6 }}>SWAP</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: swapColor(swapPct), lineHeight: 1 }}>{swapPct}<span style={{ fontSize: '0.85rem', fontWeight: 400 }}>%</span></span>
          <span style={{ fontSize: '0.92rem', color: 'var(--text-dim)' }}>{swapUsed} / {swapTotal} GB usado</span>
        </div>
        {swapTotal > 0 && (
          <div className="chart-wrap" style={{ padding: '4px 6px' }}>
            <AreaChart
              data={swapChartData}
              accessor={d => d.v}
              yMax={swapTotal}
              yMin={0}
              yUnit=" GB"
              height={80}
              color="var(--chart-swap)"
            />
          </div>
        )}
      </div>
    </div>
  );
}
