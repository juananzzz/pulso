import { TABS } from '../constants';

export default function TabBar({ view, onNavigate }) {
  return (
    <div className="tab-bar">
      {TABS.map(t => (
        <button key={t.id} className={`tab-item${view === t.id ? ' active' : ''}`} onClick={() => onNavigate(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
