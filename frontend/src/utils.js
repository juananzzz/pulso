export function formatUptime(s) {
  if (!s) return '—';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function relTime(ts) {
  if (!ts) return '';
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 5) return 'refreshed just now';
  if (d < 60) return `refreshed ${d}s ago`;
  return `refreshed ${Math.floor(d / 60)}m ago`;
}

export function computeAlerts(current, disks, docker) {
  const alerts = [];
  if (!current) return alerts;
  disks.forEach(d => { if (d.percent > 92) alerts.push({ text: `${d.mountpoint} almost full`, tag: `${d.percent}%` }); });
  if (current.cpu_percent > 85) alerts.push({ text: 'CPU high', tag: `${current.cpu_percent}%` });
  if (current.temp_cpu > 78) alerts.push({ text: 'CPU temp', tag: `${current.temp_cpu}°C` });
  if (current.ram_percent > 85) alerts.push({ text: 'RAM high', tag: `${current.ram_percent}%` });
  if (docker?.available) {
    docker.containers?.forEach(c => {
      if (c.state === 'restarting') alerts.push({ text: c.name, tag: 'restarting' });
      if (c.state === 'stopped') alerts.push({ text: c.name, tag: 'stopped' });
    });
  }
  return alerts;
}
