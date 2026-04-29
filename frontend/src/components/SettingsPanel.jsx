export default function SettingsPanel({ settings, onChange, onClose, hostname }) {
  const { theme, density, animations, demoScenario, visualStyle, alertBadge, layoutMode } = settings;
  return (
    <div className="settings-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-section-label">Visual Style</div>
        <div className="style-options">
          <div className={`style-opt${visualStyle === 'minimal' ? ' active' : ''}`} onClick={() => onChange('visualStyle', 'minimal')}>
            <div className="style-opt-preview" style={{ background: '#f0ede8' }}>
              {[30, 60, 45, 70, 50, 40].map((h, i) => (
                <div key={i} className="style-opt-bar" style={{ height: `${h}%`, background: '#1a1a1a', opacity: 0.7 }} />
              ))}
            </div>
            <div className="style-opt-name">Minimal</div>
            <div className="style-opt-desc">Clean &amp; editorial</div>
          </div>
          <div className={`style-opt${visualStyle === 'tech' ? ' active' : ''}`} onClick={() => onChange('visualStyle', 'tech')}>
            <div className="style-opt-preview" style={{ background: '#080b10' }}>
              {[30, 60, 45, 70, 50, 40].map((h, i) => (
                <div key={i} className="style-opt-bar" style={{ height: `${h}%`, background: ['#00d4aa', '#f59e0b', '#60a5fa', '#00d4aa', '#f59e0b', '#a78bfa'][i] }} />
              ))}
            </div>
            <div className="style-opt-name">Tech</div>
            <div className="style-opt-desc">Dark &amp; colorful</div>
          </div>
        </div>

        {visualStyle === 'minimal' && (
          <>
            <div className="settings-section-label">Appearance</div>
            <div className="settings-row">
              <span className="settings-row-label">Theme</span>
              <div className="seg-control">
                <button className={`seg-btn${theme === 'light' ? ' active' : ''}`} onClick={() => onChange('theme', 'light')}>Light</button>
                <button className={`seg-btn${theme === 'dim' ? ' active' : ''}`} onClick={() => onChange('theme', 'dim')}>Dim</button>
                <button className={`seg-btn${theme === 'dark' ? ' active' : ''}`} onClick={() => onChange('theme', 'dark')}>Dark</button>
              </div>
            </div>
          </>
        )}

        <hr className="settings-divider" />
        <div className="settings-section-label">Appearance</div>
        <div className="settings-row">
          <span className="settings-row-label">Overview Layout</span>
          <div className="seg-control">
            <button className={`seg-btn${layoutMode === 'simple' ? ' active' : ''}`} onClick={() => onChange('layoutMode', 'simple')}>Simple</button>
            <button className={`seg-btn${layoutMode === 'intermediate' ? ' active' : ''}`} onClick={() => onChange('layoutMode', 'intermediate')}>Intermediate</button>
            <button className={`seg-btn${layoutMode === 'detailed' ? ' active' : ''}`} onClick={() => onChange('layoutMode', 'detailed')}>Detailed</button>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Size</span>
          <div className="seg-control">
            <button className={`seg-btn${density === 'compact' ? ' active' : ''}`} onClick={() => onChange('density', 'compact')}>Small</button>
            <button className={`seg-btn${density === 'regular' ? ' active' : ''}`} onClick={() => onChange('density', 'regular')}>Medium</button>
            <button className={`seg-btn${density === 'comfy' ? ' active' : ''}`} onClick={() => onChange('density', 'comfy')}>Large</button>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Animations</span>
          <div className="toggle-wrap">
            <button className={`toggle${animations ? ' on' : ''}`} onClick={() => onChange('animations', !animations)} />
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Alert Badge</span>
          <div className="toggle-wrap">
            <button className={`toggle${alertBadge ? ' on' : ''}`} onClick={() => onChange('alertBadge', !alertBadge)} />
          </div>
        </div>

        <hr className="settings-divider" />
        <div className="settings-section-label">Demo State</div>
        <select className="demo-select" value={demoScenario} onChange={e => onChange('demoScenario', e.target.value)}>
          <option value="normal">Normal — everything healthy</option>
          <option value="high-load">High load</option>
          <option value="disk-full">Disk almost full</option>
          <option value="docker-issues">Docker issues</option>
        </select>

        <div className="settings-footer">Pulso · {hostname || '—'}</div>
      </div>
    </div>
  );
}
