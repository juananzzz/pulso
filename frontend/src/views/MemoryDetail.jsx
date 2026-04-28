import { useState, useEffect } from 'react';
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

function SimpleGauge({ pct, used, total, label, status, colorFn, unit }) {
  return (
    <div className="mem-simple-card">
      <div className="mem-simple-label">{label}</div>
      <div className="mem-simple-gauge-wrap">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="78" fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle cx="90" cy="90" r="78" fill="none" stroke={colorFn(pct)} strokeWidth="10"
            strokeDasharray={2 * Math.PI * 78} strokeDashoffset={2 * Math.PI * 78 * (1 - Math.min(pct, 100) / 100)}
            strokeLinecap="round" transform="rotate(-90 90 90)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <text x="90" y="90" textAnchor="middle" dominantBaseline="central"
            fill="var(--text)" fontSize="44" fontWeight="800" fontFamily="var(--num-font)">
            {pct}<tspan fontSize="20" fill="var(--text-mid)">%</tspan>
          </text>
        </svg>
      </div>
      <div className="mem-simple-stats">
        <div className="mem-simple-stat">
          <span className="mem-simple-stat-label">Used</span>
          <span className="mem-simple-stat-val" style={{ color: colorFn(pct) }}>{used}<span className="mem-simple-unit">{unit}</span></span>
        </div>
        <div className="mem-simple-stat">
          <span className="mem-simple-stat-label">Total</span>
          <span className="mem-simple-stat-val">{total}<span className="mem-simple-unit">{unit}</span></span>
        </div>
      </div>
      <div className="mem-simple-bar">
        <div className="mem-simple-bar-track">
          <div className="mem-simple-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: colorFn(pct) }} />
        </div>
      </div>
      <div className="mem-simple-status" style={{ color: status.color }}>
        <span className="mem-status-indicator" style={{ background: status.color, width: 8, height: 8 }} />
        {status.label}
      </div>
    </div>
  );
}

export default function MemoryDetail({ current, spark }) {
  const total = current?.ram_total_gb || 32;
  const used = current?.ram_used_gb != null ? current.ram_used_gb : +(total - (current?.ram_available_gb || 0)).toFixed(1);
  const available = current?.ram_available_gb || 0;
  const ramPct = current?.ram_percent != null ? Math.round(current.ram_percent) : total > 0 ? Math.round(used / total * 100) : 0;
  const ramStatus = memStatus(ramPct);

  const swapUsed = current?.swap_used_gb || 0;
  const swapTotal = current?.swap_total_gb || 0;
  const swapPct = swapTotal > 0 ? Math.round(swapUsed / swapTotal * 100) : 0;
  const swapStat = swapStatus(swapPct);

  const [topProcs, setTopProcs] = useState([]);
  useEffect(() => {
    fetch('/api/processes/top')
      .then(r => r.json())
      .then(d => setTopProcs((d.top_mem || []).slice(0, 5)))
      .catch(() => setTopProcs([]));
  }, []);

  return (
    <div className="detail">
      <div className="mem-primary">
        <div className="mem-primary-left">
          <div className="detail-title" style={{ marginBottom: 0 }}>Memory</div>
          <div className="detail-sub" style={{ marginBottom: 0 }}>
            {total} GB RAM &middot; {swapTotal} GB SWAP
          </div>
          <div className="mem-status-row">
            <span className="mem-status-indicator" style={{ background: ramStatus.color }} />
            <span className="mem-status-text" style={{ color: ramStatus.color }}>{ramStatus.label}</span>
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

      <div className="mem-gauges-row">
        <SimpleGauge
          pct={ramPct}
          used={used.toFixed(1)}
          total={total}
          label="RAM"
          status={ramStatus}
          colorFn={ramColor}
          unit="GB"
        />
        <SimpleGauge
          pct={swapPct}
          used={swapUsed.toFixed(1)}
          total={swapTotal || '—'}
          label="SWAP"
          status={swapStat}
          colorFn={swapColor}
          unit="GB"
        />
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
    </div>
  );
}
