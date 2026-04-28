import { useState, useRef } from 'react';
import AreaChart from '../charts/AreaChart';
import InteractiveChart from '../charts/InteractiveChart';
import { cpuColor, tempColor } from '../utils';

const RANGES = [
  { label: '1m',  value: '1m' },
  { label: '1h',  value: '1h' },
  { label: '8h',  value: '8h' },
  { label: '24h', value: '24h' },
];

function ChartModal({ chart, chartData, chartRange, onTimeRangeChange, onClose }) {
  const titles = { usage: 'Usage', temp: 'Temperature' };
  const colors = { usage: 'var(--chart-cpu)', temp: 'var(--chart-temp)' };

  return (
    <div className="chart-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="chart-modal">
        <div className="chart-modal-header">
          <h2 className="chart-modal-title">{titles[chart]}</h2>
          <div className="range-selector">
            {RANGES.map(r => (
              <button key={r.value}
                className={`range-btn${chartRange === r.value ? ' active' : ''}`}
                onClick={() => onTimeRangeChange(r.value)}>{r.label}</button>
            ))}
          </div>
          <button className="chart-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="chart-modal-body">
          <InteractiveChart
            data={chartData || []}
            color={colors[chart]}
            yMax={100}
            title={titles[chart]}
            timeRange={chartRange}
            ranges={RANGES}
            onTimeRangeChange={onTimeRangeChange}
            onClose={onClose}
            modal
          />
        </div>
      </div>
    </div>
  );
}

export default function CPUDetail({ sysInfo, current, spark, cpuCores }) {
  const [expandedChart, setExpandedChart] = useState(null);
  const [chartRange, setChartRange] = useState('1h');
  const [chartData, setChartData] = useState(null);
  const frozenSpark = useRef(null);

  const fetchHistory = (chart, range) => {
    fetch(`/api/history?range=${range}`)
      .then(r => r.json())
      .then(data => {
        const field = chart === 'usage' ? 'cpu' : 'temp';
        setChartData(data.map(d => ({ ts: d.ts * 1000, v: d[field] })));
      })
      .catch(() => setChartData([]));
  };

  const openChart = (chart) => {
    frozenSpark.current = spark;
    setExpandedChart(chart);
    if (chartRange === '1m') {
      const src = chart === 'usage' ? spark?.cpu : spark?.temp;
      setChartData((src || []).map((v, i) => ({ ts: Date.now() - (src.length - i) * 3000, v })));
    } else {
      fetchHistory(chart, chartRange);
    }
  };

  const closeChart = () => {
    setExpandedChart(null);
    setChartData(null);
    frozenSpark.current = null;
  };

  const handleRangeChange = (range) => {
    setChartRange(range);
    if (range === '1m' && frozenSpark.current) {
      const chart = expandedChart;
      const src = chart === 'usage' ? frozenSpark.current?.cpu : frozenSpark.current?.temp;
      setChartData((src || []).map((v, i) => ({ ts: Date.now() - (src.length - i) * 3000, v })));
    } else if (expandedChart) {
      fetchHistory(expandedChart, range);
    }
  };

  return (
    <div className="detail">
      <div className="detail-title">CPU</div>
      <div className="detail-sub">
        {[sysInfo?.cpu_model, sysInfo?.cpu_threads && `${sysInfo.cpu_threads} threads`, current?.cpu_freq_ghz && `${current.cpu_freq_ghz} GHz`].filter(Boolean).join(' · ')}
      </div>
      <div className="stat-boxes">
        <div className="stat-box"><div className="stat-box-label">Usage</div><div className="stat-box-val" style={{ color: cpuColor(current?.cpu_percent) }}>{current?.cpu_percent ?? '—'}<span className="stat-box-unit">%</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Temperature</div><div className="stat-box-val" style={{ color: tempColor(current?.temp_cpu) }}>{current?.temp_cpu ?? '—'}<span className="stat-box-unit">°C</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Frequency</div><div className="stat-box-val">{current?.cpu_freq_ghz ?? '—'}<span className="stat-box-unit">GHz</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Load Avg</div><div className="stat-box-val" style={{ fontSize: '1rem', paddingTop: '6px' }}>{current?.load_1} · {current?.load_5} · {current?.load_15}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        <div className="chart-section">
          <div className="chart-label" style={{ marginBottom: 4, fontSize: '0.78rem' }}>USAGE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: cpuColor(current?.cpu_percent), lineHeight: 1 }}>{current?.cpu_percent ?? 0}<span style={{ fontSize: '0.85rem', fontWeight: 400 }}>%</span></span>
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>{current?.cpu_percent ?? 0}% used</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4, background: 'var(--border)' }}>
            <div style={{ width: `${Math.min(current?.cpu_percent ?? 0, 100)}%`, height: '100%', background: cpuColor(current?.cpu_percent), borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginBottom: 4, fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cpuColor(current?.cpu_percent), display: 'inline-block' }} />
              <span style={{ color: 'var(--text-dim)' }}>Used</span>
              <span style={{ fontWeight: 600 }}>{current?.cpu_percent ?? 0}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-dim)' }}>Free</span>
              <span style={{ fontWeight: 600 }}>{100 - (current?.cpu_percent ?? 0)}%</span>
            </div>
          </div>
          <div className="chart-wrap" style={{ padding: '6px 8px', cursor: 'pointer' }} onClick={() => openChart('usage')}>
            <AreaChart data={spark?.cpu?.map(v => ({ v }))} accessor={d => d.v} yMax={100} height={160} color="var(--chart-cpu)" />
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-label" style={{ marginBottom: 4, fontSize: '0.78rem' }}>TEMP</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: tempColor(current?.temp_cpu), lineHeight: 1 }}>{current?.temp_cpu ?? '—'}<span style={{ fontSize: '0.85rem', fontWeight: 400 }}>°C</span></span>
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>{current?.temp_cpu != null ? `${current.temp_cpu}°C` : '—'}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4, background: 'var(--border)' }}>
            <div style={{ width: `${Math.min((current?.temp_cpu ?? 0) / 100 * 100, 100)}%`, height: '100%', background: tempColor(current?.temp_cpu), borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
          {current?.temp_cpu != null && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginBottom: 4, fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tempColor(current.temp_cpu), display: 'inline-block' }} />
                <span style={{ color: 'var(--text-dim)' }}>Current</span>
                <span style={{ fontWeight: 600 }}>{current.temp_cpu}°C</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-dim)', display: 'inline-block' }} />
                <span style={{ color: 'var(--text-dim)' }}>Max</span>
                <span style={{ fontWeight: 600 }}>100°C</span>
              </div>
            </div>
          )}
          <div className="chart-wrap" style={{ padding: '6px 8px', cursor: 'pointer' }} onClick={() => openChart('temp')}>
            <AreaChart data={spark?.temp?.map(v => ({ v }))} accessor={d => d.v} yMax={100} height={160} color="var(--chart-temp)" />
          </div>
        </div>
      </div>

      {cpuCores.length > 0 && (
        <div className="cores-section">
          <div className="cores-label">Per core <span style={{ color: 'var(--text-dim)' }}>{cpuCores.length} cores</span></div>
          <div className="cores-grid">
            {cpuCores.map(c => (
              <div className="core-block" key={c.core}>
                <div className="core-num">{String(c.core).padStart(2, '0')}</div>
                <div className="core-pct" style={{ color: cpuColor(c.percent) }}>{c.percent}%</div>
                <div className="core-bar-wrap"><div className="core-bar-fill" style={{ height: `${c.percent}%`, background: cpuColor(c.percent) }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expandedChart && (
        <ChartModal
          chart={expandedChart}
          chartData={chartData}
          chartRange={chartRange}
          onTimeRangeChange={handleRangeChange}
          onClose={closeChart}
        />
      )}
    </div>
  );
}
