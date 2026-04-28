import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import AreaChart from '../charts/AreaChart';
import InteractiveChart from '../charts/InteractiveChart';
import { cpuColor, tempColor } from '../utils';

const RANGES = [
  { label: '1m',  value: '1m' },
  { label: '1h',  value: '1h' },
  { label: '8h',  value: '8h' },
  { label: '24h', value: '24h' },
];

function cpuStatus(pct) {
  if (pct == null) return { label: 'Sin datos', color: 'var(--text-dim)' };
  if (pct < 70) return { label: 'Uso normal', color: 'var(--ok)' };
  if (pct < 90) return { label: 'Carga moderada', color: 'var(--warn)' };
  return { label: 'Carga crítica', color: 'var(--alert)' };
}

const REF_LINES = [
  { value: 70, label: '70%', color: 'var(--warn)' },
  { value: 90, label: '90%', color: 'var(--alert)' },
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
  const [topProcs, setTopProcs] = useState([]);
  const frozenSpark = useRef(null);

  const pct = current?.cpu_percent;
  const status = cpuStatus(pct);
  const temp = current?.temp_cpu;
  const freq = current?.cpu_freq_ghz;
  const load1 = current?.load_1;
  const load5 = current?.load_5;
  const load15 = current?.load_15;

  useEffect(() => {
    fetch('/api/processes/top')
      .then(r => r.json())
      .then(d => setTopProcs(d.top_cpu || []))
      .catch(() => setTopProcs([]));
  }, []);

  const sortedCores = useMemo(() =>
    [...cpuCores].sort((a, b) => b.percent - a.percent),
  [cpuCores]);

  const peakIndices = useMemo(() => {
    if (!spark?.cpu) return [];
    return spark.cpu.reduce((acc, v, i) => {
      if (v >= 90) acc.push(i);
      return acc;
    }, []);
  }, [spark]);

  const fetchHistory = useCallback((chart, range) => {
    fetch(`/api/history?range=${range}`)
      .then(r => r.json())
      .then(data => {
        const field = chart === 'usage' ? 'cpu' : 'temp';
        setChartData(data.map(d => ({ ts: d.ts * 1000, v: d[field] })));
      })
      .catch(() => setChartData([]));
  }, []);

  const openChart = useCallback((chart) => {
    frozenSpark.current = spark;
    setExpandedChart(chart);
    if (chartRange === '1m') {
      const src = chart === 'usage' ? spark?.cpu : spark?.temp;
      setChartData((src || []).map((v, i) => ({ ts: Date.now() - (src.length - i) * 3000, v })));
    } else {
      fetchHistory(chart, chartRange);
    }
  }, [chartRange, spark, fetchHistory]);

  const closeChart = useCallback(() => {
    setExpandedChart(null);
    setChartData(null);
    frozenSpark.current = null;
  }, []);

  const handleRangeChange = useCallback((range) => {
    setChartRange(range);
    if (range === '1m' && frozenSpark.current) {
      const chart = expandedChart;
      const src = chart === 'usage' ? frozenSpark.current?.cpu : frozenSpark.current?.temp;
      setChartData((src || []).map((v, i) => ({ ts: Date.now() - (src.length - i) * 3000, v })));
    } else if (expandedChart) {
      fetchHistory(expandedChart, range);
    }
  }, [expandedChart, fetchHistory]);

  return (
    <div className="detail">
      {/* Level 1: Primary status */}
      <div className="cpu-primary">
        <div className="cpu-primary-left">
          <div className="detail-title" style={{ marginBottom: 0 }}>CPU</div>
          <div className="detail-sub" style={{ marginBottom: 0 }}>
            {[sysInfo?.cpu_model, sysInfo?.cpu_threads && `${sysInfo.cpu_threads} threads`].filter(Boolean).join(' · ')}
          </div>
          <div className="cpu-status-row">
            <span className="cpu-status-indicator" style={{ background: status.color }} />
            <span className="cpu-status-text" style={{ color: status.color }}>{status.label}</span>
          </div>
        </div>
        <div className="cpu-primary-right">
          <div className="cpu-big-pct" style={{ color: cpuColor(pct) }}>
            {pct ?? '—'}<span className="cpu-big-unit">%</span>
          </div>
        </div>
      </div>

      {/* Level 2: Secondary metrics */}
      <div className="cpu-secondary">
        <div className="cpu-metric">
          <div className="cpu-metric-label">
            Temperature
            <span className="cpu-metric-dot" style={{ background: tempColor(temp) }} />
          </div>
          <div className="cpu-metric-val" style={{ color: tempColor(temp) }}>
            {temp ?? '—'}<span className="cpu-metric-unit">°C</span>
          </div>
        </div>
        <div className="cpu-metric">
          <div className="cpu-metric-label">Frequency</div>
          <div className="cpu-metric-val">
            {freq != null ? freq.toFixed(2) : '—'}<span className="cpu-metric-unit">GHz</span>
          </div>
        </div>
        <div className="cpu-metric" title="1·5·15 min average">
          <div className="cpu-metric-label">Load Average</div>
          <div className="cpu-load-val">
            <span>{load1 ?? '—'}</span>
            <span className="cpu-load-sub">{load5 ?? '—'}</span>
            <span className="cpu-load-sub">{load15 ?? '—'}</span>
          </div>
        </div>
        <div className="cpu-metric">
          <div className="cpu-metric-label">Cores</div>
          <div className="cpu-metric-val">{cpuCores.length || sysInfo?.cpu_threads || '—'}</div>
        </div>
      </div>

      {/* Level 3: Charts + per-core + processes */}
      <div className="cpu-details-grid">
        {/* CPU Usage chart */}
        <div className="chart-section">
          <div className="chart-label">
            <span>Usage <span className="chart-unit">%</span></span>
            <span className="chart-time-label">Últimos 90s</span>
          </div>
          <div className="chart-wrap" style={{ cursor: 'pointer' }} onClick={() => openChart('usage')}>
            <AreaChart
              data={spark?.cpu?.map(v => ({ v }))}
              accessor={d => d.v}
              yMax={100}
              height={200}
              color="var(--chart-cpu)"
              refLines={REF_LINES}
              highlightIndices={peakIndices}
              endLabel={`${pct ?? 0}%`}
            />
          </div>
        </div>

        {/* Per-core horizontal bars */}
        {sortedCores.length > 0 && (
          <div className="cores-section">
            <div className="chart-label">
              <span>Per Core</span>
              <span className="chart-unit">{sortedCores.length} cores</span>
            </div>
            <div className="cores-hbars">
              {sortedCores.map(c => (
                <div className="core-hbar" key={c.core}>
                  <div className="core-hbar-label">
                    <span className="core-hbar-num">Core {String(c.core).padStart(2, '0')}</span>
                    <span className="core-hbar-pct" style={{ color: cpuColor(c.percent) }}>{c.percent}%</span>
                  </div>
                  <div className="core-hbar-track">
                    <div
                      className="core-hbar-fill"
                      style={{ width: `${Math.min(c.percent, 100)}%`, background: cpuColor(c.percent) }}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Top CPU processes */}
      {topProcs.length > 0 && (
        <div className="cpu-procs-section">
          <div className="chart-label">Top Procesos</div>
          <div className="cpu-procs-grid">
            {topProcs.map((p, i) => (
              <div className="cpu-proc-row" key={p.pid || i}>
                <span className="cpu-proc-rank">{i + 1}</span>
                <span className="cpu-proc-name">{p.name || '—'}</span>
                <span className="cpu-proc-pid">PID {p.pid}</span>
                <span className="cpu-proc-pct" style={{ color: cpuColor(p.cpu_percent) }}>{p.cpu_percent}%</span>
                <div className="cpu-proc-bar-track">
                  <div className="cpu-proc-bar-fill" style={{ width: `${Math.min(p.cpu_percent, 100)}%`, background: cpuColor(p.cpu_percent) }} />
                </div>
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
