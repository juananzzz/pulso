import { useState, useEffect, useCallback } from 'react';
import { ALERT_COLOR_DEFAULT, BUFFER_SIZE, DEMO_DATA } from './constants';
import { relTime, computeAlerts } from './utils';
import Header from './components/Header';
import TabBar from './components/TabBar';
import SettingsPanel from './components/SettingsPanel';
import Overview from './views/Overview';
import CPUDetail from './views/CPUDetail';
import MemoryDetail from './views/MemoryDetail';
import StorageDetail from './views/StorageDetail';
import NetworkDetail from './views/NetworkDetail';
import AlertsView from './views/AlertsView';

const ls = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lss = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export default function App() {
  const [sysInfo, setSysInfo]   = useState(null);
  const [current, setCurrent]   = useState(null);
  const [disks, setDisks]       = useState([]);
  const [cpuCores, setCpuCores] = useState([]);
  const [spark, setSpark]       = useState({ cpu: [], temp: [], ram: [], ramGb: [], swap: [], swapGb: [], sent: [], recv: [] });
  const [lastRefresh, setLastRefresh] = useState(null);
  const [view, setView]         = useState('home');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [settings, setSettings] = useState({
    theme:        ls('p-theme')  || 'light',
    density:      ls('p-density') || 'regular',
    alertColor:   ls('p-alert')  || ALERT_COLOR_DEFAULT,
    animations:   ls('p-anim')   !== 'false',
    visualStyle:  ls('p-vstyle') || 'minimal',
    alertBadge:   ls('p-alert-badge') !== 'false',
    layoutMode:   ls('p-layout') || 'intermediate',
    demoScenario: 'normal',
  });

  const changeSetting = (key, val) => {
    setSettings(s => ({ ...s, [key]: val }));
    if (key === 'theme')       lss('p-theme', val);
    if (key === 'density')     lss('p-density', val);
    if (key === 'alertColor')  lss('p-alert', val);
    if (key === 'animations')  lss('p-anim', val);
    if (key === 'visualStyle') lss('p-vstyle', val);
    if (key === 'alertBadge')  lss('p-alert-badge', val);
    if (key === 'layoutMode')  lss('p-layout', val);
  };

  useEffect(() => {
    const isTech = settings.visualStyle === 'tech';
    document.documentElement.setAttribute('data-theme',   isTech ? 'dark' : settings.theme);
    document.documentElement.setAttribute('data-vstyle',  settings.visualStyle);
    document.documentElement.setAttribute('data-density', settings.density);
    document.documentElement.setAttribute('data-anim',    settings.animations ? 'true' : 'false');
    document.documentElement.style.setProperty('--alert',        settings.alertColor);
    document.documentElement.style.setProperty('--alert-bg',     settings.alertColor + '12');
    document.documentElement.style.setProperty('--alert-border', settings.alertColor + '40');
  }, [settings.theme, settings.density, settings.animations, settings.alertColor, settings.visualStyle]);

  const demo = settings.demoScenario !== 'normal' ? DEMO_DATA[settings.demoScenario] : null;
  const effCurrent = demo?.current || current;
  const effDisks   = demo?.disks   || disks;

  const pushSpark = curr => {
    setSpark(s => {
      const push = (arr, v) => v != null ? [...arr.slice(-BUFFER_SIZE + 1), v] : arr;
      const swapPct = curr.swap_total_gb > 0 ? Math.round(curr.swap_used_gb / curr.swap_total_gb * 100) : 0;
      return {
        cpu:   push(s.cpu,   curr.cpu_percent),
        temp:  push(s.temp,  curr.temp_cpu),
        ram:   push(s.ram,   curr.ram_percent),
        ramGb: push(s.ramGb, curr.ram_used_gb),
        swap:  push(s.swap,  swapPct),
        swapGb: push(s.swapGb, curr.swap_used_gb),
        sent:  push(s.sent,  curr.net_sent_mbps),
        recv:  push(s.recv,  curr.net_recv_mbps),
      };
    });
  };

  const fetchCurrent = useCallback(async () => {
    if (demo) return;
    try { const r = await fetch('/api/current'); const d = await r.json(); setCurrent(d); pushSpark(d); setLastRefresh(Date.now()); } catch {}
  }, [demo]);

  const fetchDisks = useCallback(async () => {
    if (demo?.disks) return;
    try { const r = await fetch('/api/disks'); setDisks(await r.json()); } catch {}
  }, [demo]);

  const fetchCores = useCallback(async () => {
    try { const r = await fetch('/api/cpu/cores'); setCpuCores(await r.json()); } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/system').then(r => r.json()).then(setSysInfo).catch(() => {});
    fetchCurrent(); fetchDisks(); fetchCores();
  }, []);

  useEffect(() => {
    const t1 = setInterval(fetchCurrent, 3000), t2 = setInterval(fetchCores, 3000);
    const t3 = setInterval(fetchDisks, 15000);
    return () => [t1, t2, t3].forEach(clearInterval);
  }, [fetchCurrent, fetchCores, fetchDisks]);

  const [relTimeStr, setRelTimeStr] = useState('');
  useEffect(() => {
    const t = setInterval(() => setRelTimeStr(relTime(lastRefresh)), 1000);
    return () => clearInterval(t);
  }, [lastRefresh]);

  const alerts = computeAlerts(effCurrent, effDisks);

  return (
    <>
      <Header sysInfo={sysInfo} current={effCurrent} onLogoClick={() => setView('home')} onSettingsClick={() => setSettingsOpen(true)} />
      <TabBar view={view} onNavigate={setView} alertsCount={alerts.length} alertBadge={settings.alertBadge} />

      <div className="main">
        {view === 'home' && (
          <Overview
            current={effCurrent}
            disks={effDisks}
            sysInfo={sysInfo}
            spark={spark}
            onNavigate={setView}
            layoutMode={settings.layoutMode}
          />
        )}
        {view === 'cpu'        && <CPUDetail      sysInfo={sysInfo} current={effCurrent} spark={spark} cpuCores={cpuCores} />}
        {view === 'memory'     && <MemoryDetail   current={effCurrent} spark={spark} layoutMode={settings.layoutMode} onChangeLayout={(m) => changeSetting('layoutMode', m)} />}
        {view === 'storage'    && <StorageDetail  disks={effDisks} />}
        {view === 'network'    && <NetworkDetail  current={effCurrent} spark={spark} />}
        {view === 'alerts'     && <AlertsView alerts={alerts} />}
      </div>

      <div className="footer">
        <a href="https://github.com/juananzzz/pulso" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.72rem' }}
          onMouseOver={e => e.target.style.color = 'var(--text)'}
          onMouseOut={e => e.target.style.color = 'var(--text-dim)'}>
          Pulso
        </a>
      </div>

      {settingsOpen && (
        <SettingsPanel settings={settings} onChange={changeSetting} onClose={() => setSettingsOpen(false)} hostname={sysInfo?.hostname} />
      )}
    </>
  );
}
