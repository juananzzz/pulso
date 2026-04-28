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

  const top = current?.top_cpu_proc;

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

      <div className="chart-section" style={{ cursor: 'pointer', marginBottom: 8 }} onClick={() => openChart('usage')}>
        <div className="chart-label" style={{ marginBottom: 4, fontSize: '0.78rem' }}>Usage <span className="chart-unit">%</span></div>
        <div className="chart-wrap" style={{ padding: '6px 8px' }}><AreaChart data={spark?.cpu?.map(v => ({ v }))} accessor={d => d.v} yMax={100} height={90} color="var(--chart-cpu)" /></div>
      </div>

      {top && (
        <div className="chart-section" style={{ marginBottom: 8 }}>
          <div className="chart-label" style={{ marginBottom: 4, fontSize: '0.78rem' }}>Top process <span className="chart-unit">{top.name} · PID {top.pid}</span></div>
          <div className="top-proc-box" style={{ padding: '10px 14px' }}>
            <span className="top-proc-name">{top.name}</span>
            <span className="top-proc-pct" style={{ color: cpuColor(top.cpu) }}>{top.cpu}%</span>
            <span className="top-proc-pid">PID {top.pid}</span>
          </div>
        </div>
      )}

      <div className="chart-section" style={{ cursor: 'pointer', marginBottom: 8 }} onClick={() => openChart('temp')}>
        <div className="chart-label" style={{ marginBottom: 4, fontSize: '0.78rem' }}>Temperature <span className="chart-unit">°C</span></div>
        <div className="chart-wrap" style={{ padding: '6px 8px' }}><AreaChart data={spark?.temp?.map(v => ({ v }))} accessor={d => d.v} yMax={100} height={90} color="var(--chart-temp)" /></div>
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
