import { useState, useEffect } from 'react';
import AreaChart from '../charts/AreaChart';
import InteractiveChart from '../charts/InteractiveChart';
import { cpuColor, tempColor } from '../utils';

const RANGES = [
  { label: '1m',  value: '1m' },
  { label: '1h',  value: '1h' },
  { label: '8h',  value: '8h' },
  { label: '24h', value: '24h' },
];

export default function CPUDetail({ sysInfo, current, spark, cpuCores }) {
  const [expandedChart, setExpandedChart] = useState(null);
  const [chartRange, setChartRange] = useState('1h');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!expandedChart) return;
    if (chartRange === '1m') {
      const src = expandedChart === 'usage' ? spark?.cpu : spark?.temp;
      setChartData((src || []).map((v, i) => ({ ts: Date.now() - (src.length - i) * 3000, v })));
      return;
    }
    fetch(`/api/history?range=${chartRange}`)
      .then(r => r.json())
      .then(data => {
        const field = expandedChart === 'usage' ? 'cpu' : 'temp';
        setChartData(data.map(d => ({ ts: d.ts * 1000, v: d[field] })));
      })
      .catch(() => setChartData([]));
  }, [expandedChart, chartRange, spark]);

  const openChart = (chart) => {
    setExpandedChart(chart);
    if (chart === 'usage' && spark?.cpu) {
      setChartData(spark.cpu.map((v, i) => ({ ts: Date.now() - (spark.cpu.length - i) * 3000, v })));
    } else if (chart === 'temp' && spark?.temp) {
      setChartData(spark.temp.map((v, i) => ({ ts: Date.now() - (spark.temp.length - i) * 3000, v })));
    }
  };

  const closeChart = () => {
    setExpandedChart(null);
    setChartData(null);
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

      {expandedChart === 'usage' ? (
        <div className="chart-section">
          <div className="chart-wrap" style={{ padding: 16 }}>
            <InteractiveChart
              data={chartData || []}
              color="var(--chart-cpu)"
              yMax={100}
              title="Usage"
              timeRange={chartRange}
              ranges={RANGES}
              onTimeRangeChange={setChartRange}
              onClose={closeChart}
            />
          </div>
        </div>
      ) : (
        <div className="chart-section" style={{ cursor: 'pointer' }} onClick={() => openChart('usage')}>
          <div className="chart-label">Usage · last 60s <span className="chart-unit">%</span></div>
          <div className="chart-wrap"><AreaChart data={spark?.cpu?.map(v => ({ v }))} accessor={d => d.v} yMax={100} height={160} color="var(--chart-cpu)" /></div>
        </div>
      )}

      {top && (
        <div className="chart-section">
          <div className="chart-label">Top process <span className="chart-unit">{top.name} · PID {top.pid}</span></div>
          <div className="top-proc-box">
            <span className="top-proc-name">{top.name}</span>
            <span className="top-proc-pct" style={{ color: cpuColor(top.cpu) }}>{top.cpu}%</span>
            <span className="top-proc-pid">PID {top.pid}</span>
          </div>
        </div>
      )}

      {expandedChart === 'temp' ? (
        <div className="chart-section">
          <div className="chart-wrap" style={{ padding: 16 }}>
            <InteractiveChart
              data={chartData || []}
              color="var(--chart-temp)"
              yMax={100}
              title="Temperature"
              timeRange={chartRange}
              ranges={RANGES}
              onTimeRangeChange={setChartRange}
              onClose={closeChart}
            />
          </div>
        </div>
      ) : (
        <div className="chart-section" style={{ cursor: 'pointer' }} onClick={() => openChart('temp')}>
          <div className="chart-label">Temperature · last 60s <span className="chart-unit">°C</span></div>
          <div className="chart-wrap"><AreaChart data={spark?.temp?.map(v => ({ v }))} accessor={d => d.v} yMax={100} height={160} color="var(--chart-temp)" /></div>
        </div>
      )}

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
    </div>
  );
}
