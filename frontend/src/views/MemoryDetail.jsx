import { useState, useEffect } from 'react';
import AreaChart from '../charts/AreaChart';
import ProgressArc from '../charts/ProgressArc';
import MemStatBox from '../components/MemStatBox';
import { ramColor, swapColor } from '../utils';

const RANGE_SECS = { '1m': 90, '1h': 3600, '24h': 86400 };

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
    { label: 'En uso (apps)', value: used,    color: 'var(--distrib-apps)' },
    { label: 'Cached',        value: cached,  color: 'var(--distrib-cached)' },
    { label: 'Buffers',       value: buffers, color: 'var(--distrib-buffers)' },
    { label: 'Libre',         value: free,    color: 'var(--distrib-libre)' },
  ];

  return (
    <div className="detail">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
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

      <div style={{ marginBottom: 28 }}>
        <div className="chart-label" style={{ fontSize: '0.85rem', marginBottom: 8 }}>RAM</div>
        <div className="stat-boxes mem-stat-boxes" style={{ marginBottom: 'var(--gap)' }}>
          <MemStatBox label="RAM usada"  value={usedApparent} total={total} unit="GB" color={ramColor(usedPct)} pct={usedPct} />
          <MemStatBox label="Disponible" value={free}                           unit="GB" sub={total > 0 ? `${Math.round(free / total * 100)}% libre` : ''} />
          <MemStatBox label="Cached"     value={cached}                         unit="GB" sub={buffers > 0 ? `buffers ${buffers} GB` : ''} />
        </div>
        <div className="mem-body">
          <div className="chart-section" style={{ margin: 0 }}>
            <div className="chart-label">Uso de memoria <span className="chart-unit">GB</span></div>
            <div className="chart-wrap">
              <AreaChart
                data={ramChartData}
                accessor={d => d.v}
                yMax={total}
                yMin={0}
                yUnit=" GB"
                height={320}
                color="var(--chart-ram)"
                xRangeSeconds={RANGE_SECS[range]}
              />
            </div>
          </div>
          <div className="mem-distrib">
            <div className="mem-distrib-title">Distribución</div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 16px' }}>
              <ProgressArc percent={usedPct} size={180} />
            </div>
            <div className="distrib-legend">
              {distribItems.filter(d => d.value > 0).map(seg => (
                <div className="distrib-row" key={seg.label}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="distrib-dot" style={{ background: seg.color }} />
                    <span className="distrib-label">{seg.label}</span>
                  </div>
                  <span className="distrib-val">{seg.value.toFixed(2)} GB</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="chart-label" style={{ fontSize: '0.85rem', marginBottom: 8 }}>SWAP</div>
        <div className="stat-boxes mem-stat-boxes" style={{ marginBottom: 'var(--gap)' }}>
          <MemStatBox label="Swap usado" value={swapUsed} total={swapTotal} unit="GB" color={swapColor(swapPct)} swapPct={swapPct} />
          <MemStatBox label="Total"      value={swapTotal} unit="GB" sub={swapTotal > 0 ? `${swapPct}% usado` : ''} />
        </div>
        {swapTotal > 0 && (
          <div className="chart-section" style={{ margin: 0 }}>
            <div className="chart-label">Uso de SWAP <span className="chart-unit">GB</span></div>
            <div className="chart-wrap">
              <AreaChart
                data={swapChartData}
                accessor={d => d.v}
                yMax={swapTotal}
                yMin={0}
                yUnit=" GB"
                height={180}
                color="var(--chart-swap)"
                xRangeSeconds={RANGE_SECS[range]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
