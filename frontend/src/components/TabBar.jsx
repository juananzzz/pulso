import { TABS } from '../constants';

export default function TabBar({ view, onNavigate, alertsCount, alertBadge }) {
  return (
    <div className="tab-bar">
      {TABS.map(t => (
        <button key={t.id} className={`tab-item${view === t.id ? ' active' : ''}`} onClick={() => onNavigate(t.id)}>
          {t.label}
          {t.id === 'alerts' && alertsCount > 0 && alertBadge && (
            <span className="tab-badge">{alertsCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}
