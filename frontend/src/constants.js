export const ALERT_COLOR_DEFAULT = '#E63946';
export const BUFFER_SIZE = 30;

export const TABS = [
  { id: 'home',      label: 'Overview' },
  { id: 'cpu',       label: 'CPU' },
  { id: 'memory',    label: 'Memory' },
  { id: 'storage',   label: 'Disks' },
  { id: 'network',   label: 'Network' },
  { id: 'docker',    label: 'Docker' },
  { id: 'processes', label: 'Processes' },
];

export const DEMO_DATA = {
  normal: null,
  'high-load': {
    current: {
      cpu_percent: 92, cpu_freq_ghz: 3.4, load_1: 8.5, load_5: 7.2, load_15: 6.1,
      ram_used_gb: 54.2, ram_total_gb: 64, ram_percent: 84.7, ram_available_gb: 9.8,
      ram_cached_gb: 12.1, ram_buffers_gb: 1.2, swap_used_gb: 1.2, swap_total_gb: 8,
      temp_cpu: 78, net_sent_mbps: 12.3, net_recv_mbps: 8.7, net_iface: 'enp4s0',
      net_latency_ms: 4, disk_percent: 43, uptime_seconds: 1638000,
    },
  },
  'disk-full': {
    current: {
      cpu_percent: 18, cpu_freq_ghz: 2.1, load_1: 0.4, load_5: 0.5, load_15: 0.6,
      ram_used_gb: 12.3, ram_total_gb: 64, ram_percent: 19, ram_available_gb: 51.7,
      ram_cached_gb: 8.4, ram_buffers_gb: 0.6, swap_used_gb: 0.1, swap_total_gb: 8,
      temp_cpu: 42, net_sent_mbps: 0.3, net_recv_mbps: 0.1, net_iface: 'enp4s0',
      net_latency_ms: 2, disk_percent: 43, uptime_seconds: 952000,
    },
    disks: [
      { mountpoint: '/', device: '/dev/nvme0n1p1', total_gb: 930, used_gb: 402, free_gb: 528, percent: 43.3, model: 'Samsung 980 Pro 1TB', temp: 44, smart_ok: true, read_mbps: 0.1, write_mbps: 0 },
      { mountpoint: '/mnt/data', device: '/dev/sda1', total_gb: 3640, used_gb: 3140, free_gb: 500, percent: 86.2, model: 'WD Red 4TB', temp: 41, smart_ok: true, read_mbps: 0, write_mbps: 0 },
      { mountpoint: '/mnt/media', device: '/dev/sdb1', total_gb: 7280, used_gb: 7150, free_gb: 130, percent: 98.2, model: 'Seagate IronWolf 8TB', temp: 47, smart_ok: true, read_mbps: 0, write_mbps: 0 },
      { mountpoint: '/mnt/backup', device: '/dev/sdc1', total_gb: 5460, used_gb: 2730, free_gb: 2730, percent: 50.1, model: 'Toshiba N300 6TB', temp: 38, smart_ok: true, read_mbps: 0, write_mbps: 0 },
    ],
  },
};
