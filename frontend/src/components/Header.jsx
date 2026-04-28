import { formatUptime } from '../utils';

export default function Header({ sysInfo, current, onLogoClick, onSettingsClick }) {
  const subTitle = sysInfo
    ? [sysInfo.hostname, sysInfo.os, sysInfo.kernel ? `Linux ${sysInfo.kernel}` : null].filter(Boolean).join(' · ')
    : '—';

  return (
    <div className="header">
      <div className="header-left" onClick={onLogoClick}>
        <div className="logo"><img src="/pulso-icon.png" alt="" style={{ height: 22, width: 'auto', verticalAlign: 'middle' }} /> Pulso</div>
        <div className="header-sub">{subTitle}</div>
      </div>
      <div className="header-right">
        {current && (
          <div className="uptime-badge">
            <span className="uptime-dot" />
            up {formatUptime(current.uptime_seconds)}
          </div>
        )}
        <button className="settings-btn" onClick={onSettingsClick} title="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
