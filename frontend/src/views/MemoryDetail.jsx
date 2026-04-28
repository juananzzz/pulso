import { useState, useEffect, useMemo } from 'react';
import AreaChart from '../charts/AreaChart';
import { ramColor, swapColor } from '../utils';

function memStatus(pct) {
  if (pct == null) return 'No data';
  if (pct < 70) return 'Stable';
  if (pct < 90) return 'Moderate pressure';
  return 'Critical pressure';
}

function swapStatus(pct) {
  if (pct == null || pct === 0) return 'No usage';
  if (pct < 40) return 'Low';
  if (pct < 70) return 'Moderate';
  return 'Intensive';
}

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

  const ramChartData = useMemo(() => (spark?.ramGb || []).map(v => ({ v })), [spark]);
  const swapChartData = useMemo(() => (spark?.swapGb || []).map(v => ({ v })), [spark]);

  const [topProcs, setTopProcs] = useState([]);
  useEffect(() => {
    fetch('/api/processes/top')
      .then(r => r.json())
      .then(d => setTopProcs((d.top_mem || []).slice(0, 5)))
      .catch(() => setTopProcs([]));
  }, []);

  const segs = [
    { key: 'used', label: 'Used', value: used, pct: total > 0 ? used / total * 100 : 0, color: 'var(--chart-ram)' },
    { key: 'cached', label: 'Cached', value: cached + buffers, pct: total > 0 ? (cached + buffers) / total * 100 : 0, color: 'var(--distrib-cached)' },
    { key: 'free', label: 'Free', value: freeMem, pct: total > 0 ? freeMem / total * 100 : 0, color: 'var(--border-strong)' },
  ];

  const status = memStatus(ramPct);

  return (
    <div className="detail">
      {/* Level 1: Primary status — single dominant focus */}
      <div className="mem-primary">
        <div className="mem-primary-left">
          <div className="detail-title" style={{ marginBottom: 0 }}>Memory</div>
          <div className="detail-sub" style={{ marginBottom: 0 }}>
            {total} GB RAM &middot; {swapTotal} GB SWAP
          </div>
          <div className="mem-status-text" style={{ color: ramColor(ramPct) }}>
            <span className="mem-status-dot" style={{ background: ramColor(ramPct) }} />
            Memory usage: {ramPct}% &mdash; {status}
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

      {/* Level 2: Simplified distribution bar — 3 segments with inline labels */}
      <div className="mem-bar-section">
        <div className="mem-bar-track">
          {segs.map(s => s.pct > 2 && (
            <div
              key={s.key}
              className="mem-bar-seg"
              style={{ width: `${s.pct}%`, background: s.color, minWidth: s.pct > 15 ? 0 : undefined }}
            >
              {s.pct > 12 && (
                <span className="mem-bar-seg-label">{s.label} {s.value.toFixed(1)} GB</span>
              )}
            </div>
          ))}
        </div>
        <div className="mem-bar-legend">
          {segs.map(s => s.pct > 2 && (
            <span key={s.key} className="mem-bar-legend-item">
              <span className="mem-bar-legend-dot" style={{ background: s.color }} />
              {s.label}: {s.value.toFixed(1)} GB
            </span>
          ))}
        </div>
      </div>

      {/* Level 3: Details grid — chart + swap */}
      <div className="mem-details-grid">
        {/* RAM usage chart — compact, no thresholds */}
        <div className="chart-section">
          <div className="chart-label">
            <span>Usage over time <span className="chart-unit">GB</span></span>
            <span className="chart-time-label">Last 90s</span>
          </div>
          <div className="chart-wrap">
            <AreaChart
              data={ramChartData}
              accessor={d => d.v}
              yMax={total}
              yMin={0}
              yUnit=" GB"
              height={140}
              color="var(--chart-ram)"
            />
          </div>
        </div>

        {/* SWAP — lower hierarchy */}
        <div className="mem-swap-col">
          <div className="chart-label">
            <span>SWAP</span>
            <span className="mem-swap-badge" style={{ color: swapColor(swapPct) }}>
              {swapStatus(swapPct)} &middot; {swapPct}%
            </span>
          </div>
          <div className="mem-swap-body">
            <div className="mem-swap-row">
              <span className="mem-swap-used" style={{ color: swapColor(swapPct) }}>{swapUsed.toFixed(1)}</span>
              <span className="mem-swap-total">/ {swapTotal} GB</span>
              {swapPct > 70 && <span className="mem-swap-badge-alert">High</span>}
            </div>
            <div className="mem-swap-bar">
              <div className="mem-swap-bar-fill" style={{ width: `${Math.min(swapPct, 100)}%`, background: swapColor(swapPct) }} />
            </div>
            {swapChartData.length > 1 && (
              <div className="mem-swap-mini">
                <AreaChart
                  data={swapChartData}
                  accessor={d => d.v}
                  yMax={swapTotal || 8}
                  yMin={0}
                  yUnit=" GB"
                  height={60}
                  color="var(--text-dim)"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level 4: Top processes — compact table */}
      {topProcs.length > 0 && (
        <div className="mem-procs-section">
          <div className="chart-label">Top Processes by Memory</div>
          <div className="mem-procs-table">
            {topProcs.map((p, i) => (
              <div className="mem-proc-row" key={p.pid || i}>
                <span className="mem-proc-rank">{i + 1}</span>
                <span className="mem-proc-name">{p.name || '—'}</span>
                <span className="mem-proc-pid">PID {p.pid}</span>
                <span className="mem-proc-val">{p.mem != null ? `${p.mem.toFixed(1)}%` : '—'}</span>
                <div className="mem-proc-bar">
                  <div className="mem-proc-bar-fill" style={{ width: `${Math.min(p.mem || 0, 100)}%`, background: ramColor(p.mem) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
