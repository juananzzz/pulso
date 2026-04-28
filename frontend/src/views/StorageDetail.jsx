import { useMemo } from 'react';
import { diskColor, tempColor } from '../utils';

function fmt(gb) {
  return gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(0)} GB`;
}

function stoStatus(disks) {
  const maxPct = disks.reduce((m, d) => Math.max(m, d.percent), 0);
  const critical = disks.filter(d => d.percent >= 90).length;
  const warn = disks.filter(d => d.percent >= 80 && d.percent < 90).length;
  if (critical > 0) return { label: `Critical · ${critical} disk${critical > 1 ? 's' : ''} at ${'\u2265'}90%`, color: 'var(--alert)' };
  if (warn > 0) return { label: `Warning · ${warn} disk${warn > 1 ? 's' : ''} at ${'\u2265'}80%`, color: 'var(--warn)' };
  return { label: 'Healthy', color: 'var(--ok)' };
}

export default function StorageDetail({ disks }) {
  const sorted = useMemo(() =>
    [...disks].sort((a, b) => b.percent - a.percent),
  [disks]);

  const total = useMemo(() => disks.reduce((s, d) => s + d.total_gb, 0), [disks]);
  const used = useMemo(() => disks.reduce((s, d) => s + d.used_gb, 0), [disks]);
  const free = useMemo(() => disks.reduce((s, d) => s + d.free_gb, 0), [disks]);
  const pct = total > 0 ? Math.round(used / total * 100) : 0;

  const status = stoStatus(disks);

  return (
    <div className="detail">
      {/* Level 1: General status */}
      <div className="sto-primary">
        <div className="sto-primary-left">
          <div className="detail-title" style={{ marginBottom: 0 }}>Storage</div>
          <div className="detail-sub" style={{ marginBottom: 0 }}>
            {disks.length} disk{disks.length !== 1 ? 's' : ''} · {fmt(total)} total
          </div>
          <div className="sto-status-row">
            <span className="sto-status-indicator" style={{ background: status.color, boxShadow: `0 0 6px ${status.color}` }} />
            <span className="sto-status-text" style={{ color: status.color }}>{status.label}</span>
          </div>
        </div>
      </div>

      {/* Level 2: Disk breakdown */}
      <div className="sto-breakdown">
        <div className="chart-label" style={{ marginBottom: 12 }}>
          <span>Volumes</span>
          <span className="chart-unit">sorted by usage</span>
        </div>
        <div className="sto-disk-list">
          {sorted.map(d => {
            const barColor = diskColor(d.percent);
            const isCritical = d.percent >= 85;
            const isWarn = d.percent >= 70 && d.percent < 85;
            return (
              <div
                key={d.mountpoint}
                className={`sto-disk-card${isCritical ? ' sto-critical' : ''}${isWarn ? ' sto-warn' : ''}`}
              >
                <div className="sto-disk-header">
                  <div className="sto-disk-info">
                    <span className="sto-disk-dot" style={{ background: barColor }} />
                    <span className="sto-disk-mount">{d.mountpoint}</span>
                    <span className="sto-disk-device">{d.device}</span>
                    {d.model && <span className="sto-disk-model">{d.model}</span>}
                  </div>
                  <div className="sto-disk-pct" style={{ color: barColor }}>{d.percent}%</div>
                </div>

                <div className="sto-disk-bar-track">
                  <div className="sto-disk-bar-fill" style={{ width: `${Math.min(d.percent, 100)}%`, background: barColor }} />
                </div>
                <div className="sto-disk-bar-label">{fmt(d.used_gb)} / {fmt(d.total_gb)}</div>

                <div className="sto-disk-meta">
                  {d.model && (
                    <div className="sto-disk-meta-item">
                      <span className="sto-meta-label">MODEL</span>
                      <span className="sto-meta-val">{d.model.length > 24 ? d.model.slice(0, 24) + '…' : d.model}</span>
                    </div>
                  )}
                  <div className="sto-disk-meta-item">
                    <span className="sto-meta-label">TEMP</span>
                    <span className="sto-meta-val" style={{ color: d.temp != null ? tempColor(d.temp) : 'var(--text-dim)' }}>
                      {d.temp != null ? `${d.temp}°C` : '—'}
                    </span>
                  </div>
                  <div className="sto-disk-meta-item">
                    <span className="sto-meta-label">I/O</span>
                    <span className="sto-meta-val">↓ {d.read_mbps ?? 0} · ↑ {d.write_mbps ?? 0} MB/s</span>
                  </div>
                  {d.smart_ok != null && (
                    <div className="sto-disk-meta-item">
                      <span className="sto-meta-label">SMART</span>
                      <span className="sto-meta-val" style={{ color: d.smart_ok ? 'var(--ok)' : 'var(--alert)' }}>
                        {d.smart_ok ? '✓ ok' : '✗ fail'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
