import { useState, useEffect, useMemo } from 'react';
import AreaChart from '../charts/AreaChart';
import { ramColor, swapColor } from '../utils';

function memStatus(pct) {
  if (pct == null) return { label: 'No data', color: 'var(--text-dim)' };
  if (pct < 70) return { label: 'Stable memory', color: 'var(--ok)' };
  if (pct < 90) return { label: 'High memory pressure', color: 'var(--warn)' };
  return { label: 'Critical pressure', color: 'var(--alert)' };
}

function swapStatus(pct) {
  if (pct == null || pct === 0) return { label: 'No usage', color: 'var(--text-dim)' };
  if (pct < 40) return { label: 'Low usage', color: 'var(--ok)' };
  if (pct < 70) return { label: 'Moderate usage', color: 'var(--warn)' };
  return { label: 'Intensive usage', color: 'var(--alert)' };
}

function ModeSelector({ mode, onChange }) {
  return (
    <div className="mem-mode-selector">
      {['simple', 'intermediate', 'detailed'].map(m => (
        <button
          key={m}
          className={`mem-mode-btn${mode === m ? ' active' : ''}`}
          onClick={() => onChange(m)}
        >{m.charAt(0).toUpperCase() + m.slice(1)}</button>
      ))}
    </div>
  );
}

/* ── Simple ── */
function SimpleView({ current }) {
  const total = current?.ram_total_gb || 32;
  const used = current?.ram_used_gb != null ? current.ram_used_gb : +(total - (current?.ram_available_gb || 0)).toFixed(1);
  const ramPct = current?.ram_percent != null ? Math.round(current.ram_percent) : total > 0 ? Math.round(used / total * 100) : 0;
  const status = memStatus(ramPct);
  return (
    <div className="mem-simple">
      <div className="mem-simple-gauge">
        <svg width="220" height="220" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="95" fill="none" stroke="var(--border)" strokeWidth="12" />
          <circle cx="110" cy="110" r="95" fill="none" stroke={ramColor(ramPct)} strokeWidth="12"
            strokeDasharray={2 * Math.PI * 95} strokeDashoffset={2 * Math.PI * 95 * (1 - ramPct / 100)}
            strokeLinecap="round" transform="rotate(-90 110 110)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <text x="110" y="110" textAnchor="middle" dominantBaseline="central"
            fill="var(--text)" fontSize="56" fontWeight="800" fontFamily="var(--num-font)">
            {ramPct}<tspan fontSize="24" fill="var(--text-mid)">%</tspan>
          </text>
        </svg>
      </div>
      <div className="mem-simple-stats">
        <div className="mem-simple-stat">
          <span className="mem-simple-stat-label">Used</span>
          <span className="mem-simple-stat-val" style={{ color: ramColor(ramPct) }}>{used.toFixed(1)}<span className="mem-simple-unit">GB</span></span>
        </div>
        <div className="mem-simple-stat">
          <span className="mem-simple-stat-label">Total</span>
          <span className="mem-simple-stat-val">{total}<span className="mem-simple-unit">GB</span></span>
        </div>
      </div>
      <div className="mem-simple-bar">
        <div className="mem-simple-bar-track">
          <div className="mem-simple-bar-fill" style={{ width: `${ramPct}%`, background: ramColor(ramPct) }} />
        </div>
      </div>
      <div className="mem-simple-status" style={{ color: status.color }}>
        <span className="mem-status-indicator" style={{ background: status.color, width: 10, height: 10 }} />
        {status.label} &middot; {ramPct}%
      </div>
    </div>
  );
}

/* ── Intermediate ── */
function IntermediateView({ current, spark, topProcs, ramChartData, swapChartData, used, total, cached, buffers, freeMem, ramPct, available }) {
  const swapUsed = current?.swap_used_gb || 0;
  const swapTotal = current?.swap_total_gb || 0;
  const swapPct = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;
  const swapStat = swapStatus(swapPct);
  const status = memStatus(ramPct);

  const refLines = useMemo(() => {
    const pct70 = +(total * 0.7).toFixed(1);
    const pct90 = +(total * 0.9).toFixed(1);
    return [
      { value: pct70, label: `70% (${pct70} GB)`, color: 'var(--warn)' },
      { value: pct90, label: `90% (${pct90} GB)`, color: 'var(--alert)' },
    ];
  }, [total]);

  const peakIndices = useMemo(() => {
    if (!spark?.ramGb) return [];
    const pct90 = total * 0.9;
    return spark.ramGb.reduce((acc, v, i) => {
      if (v >= pct90) acc.push(i);
      return acc;
    }, []);
  }, [spark, total]);

  const segs = [
    { key: 'used', label: 'Used', value: used, pct: total > 0 ? used / total * 100 : 0, color: 'var(--chart-ram)' },
    { key: 'cached', label: 'Cached', value: cached, pct: total > 0 ? cached / total * 100 : 0, color: 'var(--distrib-cached)' },
    { key: 'buffers', label: 'Buffers', value: buffers, pct: total > 0 ? buffers / total * 100 : 0, color: 'var(--distrib-buffers)' },
    { key: 'free', label: 'Free', value: freeMem, pct: total > 0 ? freeMem / total * 100 : 0, color: 'var(--border)' },
  ];

  return (
    <>
      <div className="mem-breakdown">
        <div className="mem-breakdown-header"><span>Memory Distribution</span></div>
        <div className="mem-stacked-bar">
          {segs.map(s => s.pct > 0.5 && (
            <div key={s.key} className="mem-stacked-seg" style={{ width: `${s.pct}%`, background: s.color }} />
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

      <div className="mem-details-grid">
        <div className="chart-section">
          <div className="chart-label">
            <span>Usage <span className="chart-unit">GB</span></span>
            <span className="chart-time-label">Last 90s</span>
          </div>
          <div className="chart-wrap">
            <AreaChart
              data={ramChartData} accessor={d => d.v}
              yMax={total} yMin={0} yUnit=" GB" height={140}
              color="var(--chart-ram)" refLines={refLines} highlightIndices={peakIndices}
            />
          </div>
        </div>

        <div className="mem-swap-compact">
          <div className="chart-label">
            <span>SWAP</span>
            <span className="mem-swap-status" style={{ color: swapStat.color }}>{swapStat.label}</span>
          </div>
          <div className="chart-wrap">
            <div className="mem-swap-compact-grid">
              <div className="mem-swap-compact-left">
                <div className="mem-swap-compact-pct" style={{ color: swapColor(swapPct) }}>
                  {swapPct}<span className="mem-metric-unit">%</span>
                </div>
                <div className="mem-swap-compact-detail">
                  <span>{swapUsed.toFixed(1)} / {swapTotal} GB</span>
                </div>
                <div className="mem-swap-compact-bar">
                  <div className="mem-swap-compact-fill" style={{ width: `${Math.min(swapPct, 100)}%`, background: swapColor(swapPct) }} />
                </div>
              </div>
              <div className="mem-swap-compact-chart">
                <AreaChart
                  data={swapChartData} accessor={d => d.v}
                  yMax={swapTotal || 8} yMin={0} yUnit=" GB" height={80}
                  color="var(--chart-swap)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {topProcs.length > 0 && (
        <div className="mem-procs-section">
          <div className="chart-label">Top Processes by Memory</div>
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
    </>
  );
}

/* ── Detailed ── */
function DetailedView({ current, spark, topProcs, ramChartData, swapChartData, used, total, cached, buffers, freeMem, ramPct, available }) {
  const swapUsed = current?.swap_used_gb || 0;
  const swapTotal = current?.swap_total_gb || 0;
  const swapPct = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;
  const swapStat = swapStatus(swapPct);
  const status = memStatus(ramPct);

  const refLines = useMemo(() => {
    const pct70 = +(total * 0.7).toFixed(1);
    const pct90 = +(total * 0.9).toFixed(1);
    return [
      { value: pct70, label: `70% (${pct70} GB)`, color: 'var(--warn)' },
      { value: pct90, label: `90% (${pct90} GB)`, color: 'var(--alert)' },
    ];
  }, [total]);

  const peakIndices = useMemo(() => {
    if (!spark?.ramGb) return [];
    const pct90 = total * 0.9;
    return spark.ramGb.reduce((acc, v, i) => {
      if (v >= pct90) acc.push(i);
      return acc;
    }, []);
  }, [spark, total]);

  const segs = [
    { key: 'used', label: 'Used', value: used, pct: total > 0 ? used / total * 100 : 0, color: 'var(--chart-ram)' },
    { key: 'cached', label: 'Cached', value: cached, pct: total > 0 ? cached / total * 100 : 0, color: 'var(--distrib-cached)' },
    { key: 'buffers', label: 'Buffers', value: buffers, pct: total > 0 ? buffers / total * 100 : 0, color: 'var(--distrib-buffers)' },
    { key: 'free', label: 'Free', value: freeMem, pct: total > 0 ? freeMem / total * 100 : 0, color: 'var(--border)' },
  ];

  return (
    <>
      <div className="mem-breakdown">
        <div className="mem-breakdown-header"><span>Memory Distribution</span></div>
        <div className="mem-stacked-bar">
          {segs.map(s => s.pct > 0.5 && (
            <div key={s.key} className="mem-stacked-seg" style={{ width: `${s.pct}%`, background: s.color }} />
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

      <div className="mem-details-grid">
        <div className="chart-section">
          <div className="chart-label">
            <span>Usage <span className="chart-unit">GB</span></span>
            <span className="chart-time-label">Last 90s</span>
          </div>
          <div className="chart-wrap">
            <AreaChart
              data={ramChartData} accessor={d => d.v}
              yMax={total} yMin={0} yUnit=" GB" height={200}
              color="var(--chart-ram)" refLines={refLines} highlightIndices={peakIndices}
            />
          </div>
        </div>

        <div className="mem-swap-compact">
          <div className="chart-label">
            <span>SWAP</span>
            <span className="mem-swap-status" style={{ color: swapStat.color }}>{swapStat.label}</span>
          </div>
          <div className="chart-wrap">
            <div className="mem-swap-compact-grid">
              <div className="mem-swap-compact-left">
                <div className="mem-swap-compact-pct" style={{ color: swapColor(swapPct) }}>
                  {swapPct}<span className="mem-metric-unit">%</span>
                </div>
                <div className="mem-swap-compact-detail">
                  <span>{swapUsed.toFixed(1)} / {swapTotal} GB</span>
                </div>
                <div className="mem-swap-compact-bar">
                  <div className="mem-swap-compact-fill" style={{ width: `${Math.min(swapPct, 100)}%`, background: swapColor(swapPct) }} />
                </div>
              </div>
              <div className="mem-swap-compact-chart">
                <AreaChart
                  data={swapChartData} accessor={d => d.v}
                  yMax={swapTotal || 8} yMin={0} yUnit=" GB" height={120}
                  color="var(--chart-swap)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {topProcs.length > 0 && (
        <div className="mem-procs-section">
          <div className="chart-label">Top Processes by Memory</div>
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

      <div className="mem-detail-meta">
        <div className="chart-label"><span>Detailed Metrics</span></div>
        <div className="mem-meta-grid">
          <div className="mem-meta-card">
            <div className="ov-micro-label">Total</div>
            <div className="mem-meta-val">{total}<span className="ov-side-unit">GB</span></div>
          </div>
          <div className="mem-meta-card">
            <div className="ov-micro-label">Used</div>
            <div className="mem-meta-val" style={{ color: ramColor(ramPct) }}>{used.toFixed(1)}<span className="ov-side-unit">GB</span></div>
          </div>
          <div className="mem-meta-card">
            <div className="ov-micro-label">Free</div>
            <div className="mem-meta-val" style={{ color: 'var(--ok)' }}>{freeMem.toFixed(1)}<span className="ov-side-unit">GB</span></div>
          </div>
          <div className="mem-meta-card">
            <div className="ov-micro-label">Cached</div>
            <div className="mem-meta-val">{cached.toFixed(1)}<span className="ov-side-unit">GB</span></div>
          </div>
          <div className="mem-meta-card">
            <div className="ov-micro-label">Buffers</div>
            <div className="mem-meta-val">{buffers.toFixed(1)}<span className="ov-side-unit">GB</span></div>
          </div>
          <div className="mem-meta-card">
            <div className="ov-micro-label">Available</div>
            <div className="mem-meta-val">{available.toFixed(1)}<span className="ov-side-unit">GB</span></div>
          </div>
          <div className="mem-meta-card">
            <div className="ov-micro-label">SWAP Used</div>
            <div className="mem-meta-val" style={{ color: swapColor(swapPct) }}>{swapUsed.toFixed(1)}<span className="ov-side-unit">GB</span></div>
          </div>
          <div className="mem-meta-card">
            <div className="ov-micro-label">SWAP Total</div>
            <div className="mem-meta-val">{swapTotal}<span className="ov-side-unit">GB</span></div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main ── */
export default function MemoryDetail({ current, spark, layoutMode = 'intermediate', onChangeLayout }) {
  const total = current?.ram_total_gb || 32;
  const used = current?.ram_used_gb != null ? current.ram_used_gb : +(total - (current?.ram_available_gb || 0)).toFixed(1);
  const available = current?.ram_available_gb || 0;
  const cached = current?.ram_cached_gb || 0;
  const buffers = current?.ram_buffers_gb || 0;
  const ramPct = current?.ram_percent != null ? Math.round(current.ram_percent) : total > 0 ? Math.round(used / total * 100) : 0;
  const freeMem = Math.max(0, +(total - used - cached - buffers).toFixed(1));
  const status = memStatus(ramPct);

  const ramChartData = useMemo(() => (spark?.ramGb || []).map(v => ({ v })), [spark]);
  const swapChartData = useMemo(() => (spark?.swapGb || []).map(v => ({ v })), [spark]);

  const [topProcs, setTopProcs] = useState([]);
  useEffect(() => {
    fetch('/api/processes/top')
      .then(r => r.json())
      .then(d => setTopProcs((d.top_mem || []).slice(0, 10)))
      .catch(() => setTopProcs([]));
  }, []);

  const viewProps = { current, spark, topProcs, ramChartData, swapChartData, used, total, cached, buffers, freeMem, ramPct, available };

  return (
    <div className="detail">
      {/* Level 1: Primary status + mode selector */}
      <div className="mem-primary">
        <div className="mem-primary-left">
          <div className="detail-title" style={{ marginBottom: 0 }}>Memory</div>
          <div className="detail-sub" style={{ marginBottom: 0 }}>
            {total} GB RAM &middot; {current?.swap_total_gb || 0} GB SWAP
          </div>
          <div className="mem-status-row">
            <span className="mem-status-indicator" style={{ background: status.color }} />
            <span className="mem-status-text" style={{ color: status.color }}>{status.label}</span>
          </div>
        </div>
        <div className="mem-primary-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <ModeSelector mode={layoutMode} onChange={onChangeLayout} />
          {layoutMode !== 'simple' && (
            <>
              <div className="mem-big-pct" style={{ color: ramColor(ramPct) }}>
                {ramPct}<span className="mem-big-unit">%</span>
              </div>
              <div className="mem-big-sub">{used.toFixed(1)} / {total} GB used</div>
              <div className="mem-available-label">{available.toFixed(1)} GB available</div>
            </>
          )}
        </div>
      </div>

      {layoutMode === 'simple' && <SimpleView current={current} />}
      {layoutMode === 'intermediate' && <IntermediateView {...viewProps} />}
      {layoutMode === 'detailed' && <DetailedView {...viewProps} />}
    </div>
  );
}
