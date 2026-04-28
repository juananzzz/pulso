import { useState, useEffect } from 'react';

export default function ProcessesDetail() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchProc = () => {
      fetch('/api/processes/top')
        .then(r => r.json())
        .then(setData)
        .catch(() => {});
    };
    fetchProc();
    const t = setInterval(fetchProc, 5000);
    return () => clearInterval(t);
  }, []);

  const topCpu = data?.top_cpu || [];
  const topMem = data?.top_mem || [];

  return (
    <div className="detail">
      <div className="detail-title">Processes</div>
      <div className="detail-sub">Top 5 by CPU · Top 5 by RAM</div>
      <div className="proc-grid">
        <div className="proc-section">
          <div className="proc-section-title">Top CPU</div>
          <div className="proc-header">
            <span className="proc-h-name">Name</span>
            <span className="proc-h-pid">PID</span>
            <span className="proc-h-num">CPU%</span>
            <span className="proc-h-num">RAM%</span>
          </div>
          {topCpu.map(p => (
            <div className="proc-row" key={`cpu-${p.pid}`}>
              <span className="proc-cell-name">{p.name}</span>
              <span className="proc-cell-pid">{p.pid}</span>
              <span className="proc-cell-num">{p.cpu.toFixed(1)}%</span>
              <span className="proc-cell-num">{p.mem.toFixed(1)}%</span>
            </div>
          ))}
          {topCpu.length === 0 && <div className="proc-empty">No data</div>}
        </div>
        <div className="proc-section">
          <div className="proc-section-title">Top RAM</div>
          <div className="proc-header">
            <span className="proc-h-name">Name</span>
            <span className="proc-h-pid">PID</span>
            <span className="proc-h-num">CPU%</span>
            <span className="proc-h-num">RAM%</span>
          </div>
          {topMem.map(p => (
            <div className="proc-row" key={`mem-${p.pid}`}>
              <span className="proc-cell-name">{p.name}</span>
              <span className="proc-cell-pid">{p.pid}</span>
              <span className="proc-cell-num">{p.cpu.toFixed(1)}%</span>
              <span className="proc-cell-num">{p.mem.toFixed(1)}%</span>
            </div>
          ))}
          {topMem.length === 0 && <div className="proc-empty">No data</div>}
        </div>
      </div>
    </div>
  );
}
