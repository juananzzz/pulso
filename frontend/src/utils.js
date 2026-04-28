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

export const cpuColor = pct => pct < 70 ? 'var(--ok)' : pct < 90 ? 'var(--warn)' : 'var(--alert)';
export const diskColor = pct => pct < 70 ? 'var(--ok)' : pct < 90 ? 'var(--warn)' : 'var(--alert)';
export const ramColor = pct => pct < 70 ? 'var(--ok)' : pct < 90 ? 'var(--warn)' : 'var(--alert)';
export const swapColor = pct => pct < 40 ? 'var(--ok)' : pct < 70 ? 'var(--warn)' : 'var(--alert)';
export const tempColor = t => t < 45 ? 'var(--ok)' : t < 55 ? 'var(--warn)' : 'var(--alert)';

export function computeAlerts(current, disks) {
  const alerts = [];
  if (!current) return alerts;
  disks.forEach(d => {
    if (d.percent > 90) alerts.push({ text: `${d.mountpoint} almost full`, tag: `${d.percent}%` });
    else if (d.percent > 80) alerts.push({ text: `${d.mountpoint} high usage`, tag: `${d.percent}%` });
  });
  if (current.cpu_percent > 85) alerts.push({ text: 'CPU high', tag: `${current.cpu_percent}%` });
  else if (current.cpu_percent > 70) alerts.push({ text: 'CPU elevated', tag: `${current.cpu_percent}%` });
  if (current.temp_cpu > 78) alerts.push({ text: 'CPU temp', tag: `${current.temp_cpu}°C` });
  if (current.ram_percent > 85) alerts.push({ text: 'RAM high', tag: `${current.ram_percent}%` });
  else if (current.ram_percent > 70) alerts.push({ text: 'RAM elevated', tag: `${current.ram_percent}%` });
  const swapPct = current.swap_total_gb > 0 ? (current.swap_used_gb / current.swap_total_gb * 100) : 0;
  if (swapPct > 70) alerts.push({ text: 'Swap high', tag: `${Math.round(swapPct)}%` });
  else if (swapPct > 40) alerts.push({ text: 'Swap elevated', tag: `${Math.round(swapPct)}%` });
  return alerts;
}
