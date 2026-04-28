import { useState, useEffect } from 'react';

export default function DockerDetail() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDocker = () => {
      fetch('/api/docker')
        .then(r => r.json())
        .then(setData)
        .catch(() => {});
    };
    fetchDocker();
    const t = setInterval(fetchDocker, 5000);
    return () => clearInterval(t);
  }, []);

  const containers = data?.containers || [];
  const running = containers.filter(c => c.state === 'running').length;

  return (
    <div className="detail">
      <div className="detail-title">Docker</div>
      <div className="detail-sub">
        {data?.available
          ? `${running} running · ${containers.length - running} stopped`
          : 'Docker not available'}
      </div>
      {data?.available && containers.length > 0 && (
        <div className="docker-grid">
          <div className="docker-header">
            <span className="docker-h-name">Container</span>
            <span className="docker-h-state">State</span>
            <span className="docker-h-cpu">CPU</span>
            <span className="docker-h-mem">RAM</span>
          </div>
          {containers.map(c => (
            <div className="docker-row" key={c.name}>
              <span className="docker-cell-name">{c.name}</span>
              <span className="docker-cell-state">
                <span className={`docker-dot ${c.state}`} />
                {c.state}
              </span>
              <span className="docker-cell-num">{c.cpu.toFixed(1)}%</span>
              <span className="docker-cell-num">{c.mem.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
      {data?.available && containers.length === 0 && (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: 20 }}>No containers found</div>
      )}
    </div>
  );
}
