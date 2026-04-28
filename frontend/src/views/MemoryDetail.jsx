import { useState, useEffect, useMemo } from 'react';
import AreaChart from '../charts/AreaChart';
import { ramColor, swapColor } from '../utils';

const REF_LINES_70 = [
  { value: 70, label: '70%', color: 'var(--warn)' },
];
const REF_LINES_90 = [
  { value: 90, label: '90%', color: 'var(--alert)' },
];

function memStatus(pct) {
  if (pct == null) return { label: 'Sin datos', color: 'var(--text-dim)' };
  if (pct < 70) return { label: 'Memoria estable', color: 'var(--ok)' };
  if (pct < 90) return { label: 'Alta presión de memoria', color: 'var(--warn)' };
  return { label: 'Presión crítica', color: 'var(--alert)' };
}

function swapStatus(pct) {
  if (pct == null || pct === 0) return { label: 'Sin uso', color: 'var(--text-dim)' };
  if (pct < 40) return { label: 'Uso bajo', color: 'var(--ok)' };
  if (pct < 70) return { label: 'Uso moderado', color: 'var(--warn)' };
  return { label: 'Uso intensivo', color: 'var(--alert)' };
}

const MEM_TOOLTIPS = {
};

export default function MemoryDetail({ current, spark }) {
  const total = current?.ram_total_gb || 32;
  const used = current?.ram_used_gb != null ? current.ram_used_gb : +(total - (current?.ram_available_gb || 0)).toFixed(1);
  const available = current?.ram_available_gb || 0;
  const cached = current?.ram_cached_gb || 0;
  const buffers = current?.ram_buffers_gb || 0;
  const ramPct = current?.ram_percent != null ? Math.round(current.ram_percent) : total > 0 ? Math.round(used / total * 100) : 0;

  const swapUsed = current?.swap_used_gb || 0;
  const swapTotal = current?.swap_total_gb || 0;
  const swapPct = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;

  const freeMem = Math.max(0, +(total - used - cached - buffers).toFixed(1));

  const status = memStatus(ramPct);
  const swapStat = swapStatus(swapPct);

  const ramChartData = useMemo(() => (spark?.ramGb || []).map(v => ({ v })), [spark]);
  const swapChartData = useMemo(() => (spark?.swapGb || []).map(v => ({ v })), [spark]);

  const [topProcs, setTopProcs] = useState([]);
  useEffect(() => {
    fetch('/api/processes/top')
      .then(r => r.json())
      .then(d => setTopProcs((d.top_mem || []).slice(0, 5)))
      .catch(() => setTopProcs([]));
  }, []);

  const refLines = useMemo(() => {
    const pct70 = +(total * 0.7).toFixed(1);
    const pct90 = +(total * 0.9).toFixed(1);
    return [
      { value: pct70, label: `70% (${pct70} GB)`, color: 'var(--warn)' },
      { value: pct90, label: `90% (${pct90} GB)`, color: 'var(--alert)' },
    ];
  }, [total]);

  const segs = [
    { key: 'used', label: 'Used', value: used, pct: total > 0 ? used / total * 100 : 0, color: 'var(--chart-ram)' },
    { key: 'cached', label: 'Cached', value: cached, pct: total > 0 ? cached / total * 100 : 0, color: 'var(--distrib-cached)' },
    { key: 'buffers', label: 'Buffers', value: buffers, pct: total > 0 ? buffers / total * 100 : 0, color: 'var(--distrib-buffers)' },
    { key: 'free', label: 'Free', value: freeMem, pct: total > 0 ? freeMem / total * 100 : 0, color: 'var(--border)' },
  ];

  return (
    <div className="detail">
      {/* Level 1: Primary status */}
      <div className="mem-primary">
        <div className="mem-primary-left">
          <div className="detail-title" style={{ marginBottom: 0 }}>Memory</div>
          <div className="detail-sub" style={{ marginBottom: 0 }}>
            {total} GB RAM &middot; {swapTotal} GB SWAP
          </div>
          <div className="mem-status-row">
            <span className="mem-status-indicator" style={{ background: status.color }} />
            <span className="mem-status-text" style={{ color: status.color }}>{status.label}</span>
          </div>
        </div>
        <div className="mem-primary-right">
          <div className="mem-big-pct" style={{ color: ramColor(ramPct) }}>
            {ramPct}<span className="mem-big-unit">%</span>
          </div>
          <div className="mem-big-sub">{used.toFixed(1)} / {total} GB used</div>
          <div className="mem-available-label">{available.toFixed(1)} GB available</div>
        </div>
      </div>

      {/* Level 2: Memory breakdown stacked bar */}
      <div className="mem-breakdown">
        <div className="mem-breakdown-header">
          <span>Memory Distribution</span>
        </div>
        <div className="mem-stacked-bar">
          {segs.map(s => s.pct > 0.5 && (
            <div
              key={s.key}
              className="mem-stacked-seg"
              style={{ width: `${s.pct}%`, background: s.color }}
            />
          ))}
        </div>
        <div className="mem-legend">
          {segs.filter(s => s.pct > 0.5).map(s => (
            <div className="mem-legend-item" key={s.key}>
              <span className="mem-legend-dot" style={{ background: s.color }} />
              <span className="mem-legend-label">{s.label}</span>
              <span className="mem-legend-val">{s.value.toFixed(1)} GB</span>
            </div>
          ))}
        </div>
      </div>

      {/* Level 3: Details grid */}
      <div className="mem-details-grid">
        {/* RAM chart */}
        <div className="chart-section">
          <div className="chart-label">
            <span>Usage <span className="chart-unit">GB</span></span>
            <span className="chart-time-label">Últimos 90s</span>
          </div>
          <div className="chart-wrap">
            <AreaChart
              data={ramChartData}
              accessor={d => d.v}
              yMax={total}
              yMin={0}
              yUnit=" GB"
              height={200}
              color="var(--chart-ram)"
              refLines={refLines}
            />
          </div>
        </div>

        {/* SWAP section */}
        <div className="mem-swap-section">
          <div className="chart-label">
            <span>SWAP</span>
            <span className="mem-swap-status" style={{ color: swapStat.color }}>{swapStat.label}</span>
          </div>
          <div className="mem-swap-card">
            <div className="mem-swap-header">
              <div className="mem-swap-pct" style={{ color: swapColor(swapPct) }}>
                {swapPct}<span className="mem-metric-unit">%</span>
              </div>
              <div className="mem-swap-detail">
                <span>{swapUsed.toFixed(1)} / {swapTotal} GB</span>
                {swapPct > 70 && <span className="mem-swap-alert-badge">Alto</span>}
              </div>
            </div>
            <div className="mem-swap-bar-track">
              <div className="mem-swap-bar-fill" style={{ width: `${Math.min(swapPct, 100)}%`, background: swapColor(swapPct) }} />
            </div>
            <div className="mem-swap-chart">
              <AreaChart
                data={swapChartData}
                accessor={d => d.v}
                yMax={swapTotal || 8}
                yMin={0}
                yUnit=" GB"
                height={100}
                color="var(--chart-swap)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top memory processes */}
      {topProcs.length > 0 && (
        <div className="mem-procs-section">
          <div className="chart-label">Top Procesos por Memoria</div>
          <div className="mem-procs-grid">
            {topProcs.map((p, i) => (
              <div className="mem-proc-row" key={p.pid || i}>
                <span className="mem-proc-rank">{i + 1}</span>
                <span className="mem-proc-name">{p.name || '—'}</span>
                <span className="mem-proc-pid">PID {p.pid}</span>
                <span className="mem-proc-pct" style={{ color: ramColor(p.mem ?? 0) }}>{p.mem != null ? `${p.mem.toFixed(1)}%` : '—'}</span>
                <div className="mem-proc-bar-track">
                  <div className="mem-proc-bar-fill" style={{ width: `${Math.min(p.mem || 0, 100)}%`, background: ramColor(p.mem ?? 0) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
