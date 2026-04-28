import { useState, useEffect, useMemo } from 'react';
import AreaChart from '../charts/AreaChart';
import { diskColor, tempColor } from '../utils';

function fmt(gb) {
  return gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(0)} GB`;
}

function stoStatus(disks) {
  const maxPct = disks.reduce((m, d) => Math.max(m, d.percent), 0);
  const critical = disks.filter(d => d.percent >= 90).length;
  const warn = disks.filter(d => d.percent >= 80 && d.percent < 90).length;
  if (critical > 0) return { label: `Crítico · ${critical} disco${critical > 1 ? 's' : ''} al ${'\u2265'}90%`, color: 'var(--alert)' };
  if (warn > 0) return { label: `Advertencia · ${warn} disco${warn > 1 ? 's' : ''} al ${'\u2265'}80%`, color: 'var(--warn)' };
  return { label: 'Saludable', color: 'var(--ok)' };
}

export default function StorageDetail({ disks }) {
  const sorted = useMemo(() =>
    [...disks].sort((a, b) => b.percent - a.percent),
  [disks]);

  const total = useMemo(() => disks.reduce((s, d) => s + d.total_gb, 0), [disks]);
  const used = useMemo(() => disks.reduce((s, d) => s + d.used_gb, 0), [disks]);
  const free = useMemo(() => disks.reduce((s, d) => s + d.free_gb, 0), [disks]);
  const pct = total > 0 ? Math.round(used / total * 100) : 0;

  const readSum = useMemo(() => disks.reduce((s, d) => s + (d.read_mbps || 0), 0), [disks]);
  const writeSum = useMemo(() => disks.reduce((s, d) => s + (d.write_mbps || 0), 0), [disks]);

  const [expandedDisk, setExpandedDisk] = useState(null);
  const status = stoStatus(disks);

  const [ioSpark, setIoSpark] = useState({ read: [], write: [] });
  useEffect(() => {
    setIoSpark(prev => {
      const r = disks.reduce((s, d) => s + (d.read_mbps || 0), 0);
      const w = disks.reduce((s, d) => s + (d.write_mbps || 0), 0);
      return {
        read: [...prev.read.slice(-29), r],
        write: [...prev.write.slice(-29), w],
      };
    });
  }, [disks]);

  const hasIoData = ioSpark.read.some(v => v > 0) || ioSpark.write.some(v => v > 0);

  return (
    <div className="detail">
      {/* Level 1: General status */}
      <div className="sto-primary">
        <div className="sto-primary-left">
          <div className="detail-title" style={{ marginBottom: 0 }}>Storage</div>
          <div className="detail-sub" style={{ marginBottom: 0 }}>
            {disks.length} disco{disks.length !== 1 ? 's' : ''} · {fmt(total)} total
          </div>
          <div className="sto-status-row">
            <span className="sto-status-indicator" style={{ background: status.color, boxShadow: `0 0 6px ${status.color}` }} />
            <span className="sto-status-text" style={{ color: status.color }}>{status.label}</span>
          </div>
        </div>
        <div className="sto-primary-right">
          <div className="sto-summary-cards">
            <div className="sto-summary-card">
              <div className="sto-summary-label">Used</div>
              <div className="sto-summary-val">{fmt(used)}</div>
            </div>
            <div className="sto-summary-card">
              <div className="sto-summary-label">Free</div>
              <div className="sto-summary-val">{fmt(free)}</div>
            </div>
            <div className="sto-summary-card">
              <div className="sto-summary-label">Usage</div>
              <div className="sto-summary-val sto-summary-pct" style={{ color: diskColor(pct) }}>{pct}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Level 2: Disk breakdown */}
      <div className="sto-breakdown">
        <div className="chart-label" style={{ marginBottom: 12 }}>
          <span>Volumes</span>
          <span className="chart-unit">ordenados por uso</span>
        </div>
        <div className="sto-disk-list">
          {sorted.map(d => {
            const barColor = diskColor(d.percent);
            const isExpanded = expandedDisk === d.mountpoint;
            const isCritical = d.percent >= 85;
            const isWarn = d.percent >= 70 && d.percent < 85;
            return (
              <div
                key={d.mountpoint}
                className={`sto-disk-card${isCritical ? ' sto-critical' : ''}${isWarn ? ' sto-warn' : ''}`}
                onClick={() => setExpandedDisk(isExpanded ? null : d.mountpoint)}
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
                    <div className="sto-disk-meta-item" title={d.model}>
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
                  <div className="sto-disk-meta-item" title="Lectura / Escritura">
                    <span className="sto-meta-label">I/O</span>
                    <span className="sto-meta-val">↓ {d.read_mbps ?? 0} · ↑ {d.write_mbps ?? 0} MB/s</span>
                  </div>
                  {d.smart_ok != null && (
                    <div className="sto-disk-meta-item" title="SMART self-test">
                      <span className="sto-meta-label">SMART</span>
                      <span className="sto-meta-val" style={{ color: d.smart_ok ? 'var(--ok)' : 'var(--alert)' }}>
                        {d.smart_ok ? '✓ ok' : '✗ fail'}
                      </span>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="sto-disk-expanded">
                    <div className="sto-disk-expanded-row">
                      <span className="sto-meta-label">Capacity</span>
                      <span className="sto-meta-val">{fmt(d.total_gb)} total · {fmt(d.used_gb)} used · {fmt(d.free_gb)} free</span>
                    </div>
                    {d.temp != null && (
                      <div className="sto-disk-expanded-row">
                        <span className="sto-meta-label">Temperature</span>
                        <span className="sto-meta-val" style={{ color: tempColor(d.temp) }}>{d.temp}°C {d.temp > 55 ? '⚠ Alta' : ''}</span>
                      </div>
                    )}
                    {d.smart_ok != null && (
                      <div className="sto-disk-expanded-row">
                        <span className="sto-meta-label">SMART Status</span>
                        <span className="sto-meta-val" style={{ color: d.smart_ok ? 'var(--ok)' : 'var(--alert)' }}>
                          {d.smart_ok ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    )}
                    <div className="sto-disk-expanded-row">
                      <span className="sto-meta-label">Device</span>
                      <span className="sto-meta-val">{d.device}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Level 3: I/O Activity */}
      <div className="sto-activity">
        <div className="sto-activity-header">
          <span className="chart-label" style={{ marginBottom: 0 }}>Activity</span>
          <div className="sto-io-summary">
            <span className="sto-io-tag sto-io-read">↓ {readSum.toFixed(1)} MB/s</span>
            <span className="sto-io-tag sto-io-write">↑ {writeSum.toFixed(1)} MB/s</span>
          </div>
        </div>
        <div className="chart-wrap" style={{ marginTop: 8 }}>
          {hasIoData ? (
            <svg viewBox="0 0 800 120" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <text x={8} y={14} fontSize={8} fill="var(--text-dim)">MB/s</text>
              {ioSpark.read.length > 1 && (() => {
                const pts = ioSpark.read.map((v, i) => ({
                  x: 38 + (i / (ioSpark.read.length - 1)) * 754,
                  y: 8 + 88 - Math.min(v, 50) / 50 * 88,
                }));
                const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                return <path d={d} fill="none" stroke="var(--chart-net-recv)" strokeWidth={2} strokeLinejoin="round" />;
              })()}
              {ioSpark.write.length > 1 && (() => {
                const pts = ioSpark.write.map((v, i) => ({
                  x: 38 + (i / (ioSpark.write.length - 1)) * 754,
                  y: 8 + 88 - Math.min(v, 50) / 50 * 88,
                }));
                const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                return <path d={d} fill="none" stroke="var(--chart-net-sent)" strokeWidth={2} strokeLinejoin="round" />;
              })()}
            </svg>
          ) : (
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              Waiting for I/O data…
            </div>
          )}
        </div>
        <div className="sto-io-legend">
          <span className="sto-io-legend-item"><span className="sto-io-legend-dot" style={{ background: 'var(--chart-net-recv)' }} /> Read</span>
          <span className="sto-io-legend-item"><span className="sto-io-legend-dot" style={{ background: 'var(--chart-net-sent)' }} /> Write</span>
        </div>
      </div>
    </div>
  );
}
