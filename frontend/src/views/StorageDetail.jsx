function fmt(gb) {
  return gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(0)} GB`;
}

const diskBarColor = pct => {
  if (pct < 70) return 'var(--ok)';
  if (pct < 85) return '#eab308';
  return 'var(--alert)';
};

export default function StorageDetail({ disks }) {
  const total = disks.reduce((s, d) => s + d.total_gb, 0);
  const used = disks.reduce((s, d) => s + d.used_gb, 0);
  const free = disks.reduce((s, d) => s + d.free_gb, 0);
  const readSum = disks.reduce((s, d) => s + (d.read_mbps || 0), 0);
  const writeSum = disks.reduce((s, d) => s + (d.write_mbps || 0), 0);

  return (
    <div className="detail">
      <div className="detail-title">Storage</div>
      <div className="detail-sub">{disks.length} disks · {fmt(total)} total</div>
      <div className="stat-boxes">
        <div className="stat-box"><div className="stat-box-label">Used</div><div className="stat-box-val" style={{ fontSize: '1.3rem' }}>{fmt(used)}</div></div>
        <div className="stat-box"><div className="stat-box-label">Free</div><div className="stat-box-val" style={{ fontSize: '1.3rem' }}>{fmt(free)}</div></div>
        <div className="stat-box"><div className="stat-box-label">Read</div><div className="stat-box-val">{readSum.toFixed(1)}<span className="stat-box-unit">MB/s</span></div></div>
        <div className="stat-box"><div className="stat-box-label">Write</div><div className="stat-box-val">{writeSum.toFixed(1)}<span className="stat-box-unit">MB/s</span></div></div>
      </div>
      <div className="volumes-section">
        <div style={{ fontSize: '0.8rem', color: 'var(--text-mid)', marginBottom: '10px' }}>Volumes</div>
        {disks.map(d => {
          const barColor = diskBarColor(d.percent);
          const tempWarn = d.temp != null && d.temp > 50;
          return (
            <div className="volume-item" key={d.mountpoint}>
              <div className="vol-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: barColor, display: 'inline-block', marginRight: 10, flexShrink: 0 }} />
                  <span className="vol-mount">{d.mountpoint}</span>
                  <span className="vol-device">{d.device}</span>
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: d.percent >= 85 ? 'var(--alert)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{d.percent}%</span>
              </div>
              <div className="vol-bar-wrap"><div className="vol-bar" style={{ width: `${d.percent}%`, background: barColor }} /></div>
              <div className="vol-meta">
                {d.model && <div className="vol-meta-item"><span className="vol-meta-label">MODEL</span><span className="vol-meta-val">{d.model}</span></div>}
                <div className="vol-meta-item"><span className="vol-meta-label">USED</span><span className="vol-meta-val">{fmt(d.used_gb)} / {fmt(d.total_gb)}</span></div>
                {d.temp != null && (
                  <div className="vol-meta-item">
                    <span className="vol-meta-label">TEMP</span>
                    <span className={`vol-meta-val${tempWarn ? ' warn' : ''}`} style={tempWarn ? {} : {}}>
                      {d.temp}°C {tempWarn && <span style={{ color: 'var(--alert)', marginLeft: 4 }}>⚠</span>}
                    </span>
                  </div>
                )}
                {d.smart_ok != null && <div className="vol-meta-item"><span className="vol-meta-label">SMART</span><span className={`vol-meta-val ${d.smart_ok ? 'ok' : 'warn'}`}>{d.smart_ok ? 'ok' : 'fail'}</span></div>}
                <div className="vol-meta-item"><span className="vol-meta-label">I/O</span><span className="vol-meta-val">↓ {d.read_mbps} · ↑ {d.write_mbps} MB/s</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
