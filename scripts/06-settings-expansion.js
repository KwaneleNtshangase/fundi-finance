/**
 * SCRIPT 06 — Settings Page Expansion
 *
 * What this does:
 *  - Replaces SettingsView with expanded version:
 *      • Sound toggle (saves to localStorage, read by playSound)
 *      • Daily goal selector: 25 / 50 / 100 / 200 XP (saves to localStorage)
 *      • Support email links
 *      • About section: app name, version v1.0.0, link to wealthwithkwanele.co.za
 *  - Updates playSound to respect the sound-enabled localStorage setting
 *
 * Run from project root:
 *   node scripts/06-settings-expansion.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../src/app/page.tsx');
let src = fs.readFileSync(FILE, 'utf8');

// ─── 1. Make playSound respect localStorage sound toggle ─────────────────────
// Find the playSound function and add a guard at the top.

const PLAY_SOUND_FUNC = `function playSound(`;
const playSoundIdx = src.indexOf(PLAY_SOUND_FUNC);
if (playSoundIdx === -1) {
  console.log('⚠️  playSound function not found — sound toggle guard skipped');
} else {
  // Find the opening brace of playSound
  const braceIdx = src.indexOf('{', playSoundIdx);
  if (braceIdx !== -1) {
    const SOUND_GUARD = `
  // Respect user sound preference
  if (typeof window !== 'undefined' && localStorage.getItem('fundi-sound-enabled') === 'false') return;
`;
    const afterBrace = src.slice(braceIdx + 1);
    if (!afterBrace.startsWith('\n  // Respect user sound preference')) {
      src = src.slice(0, braceIdx + 1) + SOUND_GUARD + src.slice(braceIdx + 1);
      console.log('✅ Added sound toggle guard to playSound');
    } else {
      console.log('⏭  sound guard already in playSound');
    }
  }
}

// ─── 2. Find and replace SettingsView ────────────────────────────────────────
const SETTINGS_START = 'function SettingsView(';
const settingsIdx = src.indexOf(SETTINGS_START);
if (settingsIdx === -1) {
  console.error('❌ SettingsView not found. Aborting.');
  process.exit(1);
}

// Find end of SettingsView by brace counting
let depth = 0;
let i = settingsIdx;
let foundFirst = false;
while (i < src.length) {
  if (src[i] === '{') { depth++; foundFirst = true; }
  if (src[i] === '}') depth--;
  if (foundFirst && depth === 0) { i++; break; }
  i++;
}
const settingsViewOld = src.slice(settingsIdx, i);

// ─── 3. New SettingsView ──────────────────────────────────────────────────────
const NEW_SETTINGS_VIEW = `function SettingsView({ onSignOut }: { onSignOut?: () => void }) {
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('fundi-sound-enabled') !== 'false';
  });

  const [dailyGoal, setDailyGoal] = React.useState<number>(() => {
    if (typeof window === 'undefined') return 50;
    return parseInt(localStorage.getItem('fundi-daily-goal') || '50', 10);
  });

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('fundi-sound-enabled', String(next));
  };

  const handleGoalSelect = (goal: number) => {
    setDailyGoal(goal);
    localStorage.setItem('fundi-daily-goal', String(goal));
  };

  const GOALS = [25, 50, 100, 200];

  return (
    <div className="settings-view">
      <h1 className="settings-title">Settings</h1>

      {/* ── Learning ─────────────────────────────────────────────── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Learning</h2>

        {/* Sound toggle */}
        <div className="settings-row">
          <div className="settings-row-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="settings-icon">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <div>
              <span className="settings-row-label">Sound effects</span>
              <span className="settings-row-sub">Plays on correct / incorrect answers</span>
            </div>
          </div>
          <button
            className={\`settings-toggle \${soundEnabled ? 'settings-toggle--on' : ''}\`}
            onClick={handleSoundToggle}
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Toggle sound effects"
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>

        {/* Daily goal */}
        <div className="settings-row settings-row--col">
          <div className="settings-row-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="settings-icon">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <span className="settings-row-label">Daily XP Goal</span>
              <span className="settings-row-sub">How much XP you aim to earn per day</span>
            </div>
          </div>
          <div className="settings-goals">
            {GOALS.map((g) => (
              <button
                key={g}
                className={\`settings-goal-btn \${dailyGoal === g ? 'settings-goal-btn--active' : ''}\`}
                onClick={() => handleGoalSelect(g)}
              >
                {g} XP
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Support ──────────────────────────────────────────────── */}
      <section className="settings-section">
        <h2 className="settings-section-title">Support</h2>

        <a
          href="mailto:kwanele@wealthwithkwanele.co.za?subject=Fundi%20Finance%20Support"
          className="settings-row settings-row--link"
        >
          <div className="settings-row-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="settings-icon">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <div>
              <span className="settings-row-label">Email support</span>
              <span className="settings-row-sub">kwanele@wealthwithkwanele.co.za</span>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="settings-chevron">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        <a
          href="https://wealthwithkwanele.co.za"
          target="_blank"
          rel="noopener noreferrer"
          className="settings-row settings-row--link"
        >
          <div className="settings-row-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" className="settings-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <div>
              <span className="settings-row-label">Wealth with Kwanele</span>
              <span className="settings-row-sub">wealthwithkwanele.co.za</span>
            </div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="settings-chevron">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </section>

      {/* ── About ────────────────────────────────────────────────── */}
      <section className="settings-section">
        <h2 className="settings-section-title">About</h2>

        <div className="settings-about-card">
          <div className="settings-about-logo">
            <span>Fundi</span>
            <span className="settings-about-logo-accent">Finance</span>
          </div>
          <p className="settings-about-desc">
            A Duolingo-style financial literacy app built for South Africans. Learn budgeting,
            saving, investing, and more — one lesson at a time.
          </p>
          <p className="settings-about-version">Version 1.0.0</p>
          <p className="settings-about-credit">
            Built by{' '}
            <a href="https://wealthwithkwanele.co.za" target="_blank" rel="noopener noreferrer">
              Kwanele Ntshangase
            </a>
          </p>
        </div>
      </section>

      {/* ── Account ──────────────────────────────────────────────── */}
      {onSignOut && (
        <section className="settings-section">
          <h2 className="settings-section-title">Account</h2>
          <button className="settings-signout-btn" onClick={onSignOut}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </section>
      )}
    </div>
  );
}`;

// Replace old SettingsView
if (!src.includes('settings-goals')) {
  src = src.replace(settingsViewOld, NEW_SETTINGS_VIEW);
  console.log('✅ Replaced SettingsView with expanded version');
} else {
  console.log('⏭  SettingsView already expanded');
}

// ─── 4. Add Settings CSS ──────────────────────────────────────────────────────
const CSS_FILE = path.join(__dirname, '../src/app/globals.css');
let css = fs.readFileSync(CSS_FILE, 'utf8');

const SETTINGS_CSS = `
/* ── Settings View ────────────────────────────────────────────── */
.settings-view {
  padding: 1rem 1rem 6rem;
  max-width: 480px;
  margin: 0 auto;
}

.settings-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 1.25rem;
  color: var(--text-primary, #111);
}

.settings-section {
  margin-bottom: 1.5rem;
}

.settings-section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary, #999);
  margin-bottom: 0.5rem;
  padding: 0 0.25rem;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--card-bg, #fff);
  border-radius: 1rem;
  padding: 0.9rem 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  text-decoration: none;
  color: inherit;
}

.settings-row--col {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.settings-row--link {
  cursor: pointer;
  transition: background 0.15s;
}

.settings-row--link:hover {
  background: var(--hover-bg, #f5f5f5);
}

.settings-row-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-icon {
  color: #007A4D;
  flex-shrink: 0;
}

.settings-row-label {
  display: block;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary, #111);
}

.settings-row-sub {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary, #888);
  margin-top: 0.1rem;
}

.settings-chevron {
  color: var(--text-secondary, #bbb);
  flex-shrink: 0;
}

/* Toggle switch */
.settings-toggle {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: var(--border, #ddd);
  border: none;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.settings-toggle--on {
  background: #007A4D;
}

.settings-toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.settings-toggle--on .settings-toggle-knob {
  transform: translateX(20px);
}

/* Daily goal buttons */
.settings-goals {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.settings-goal-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1.5px solid var(--border, #ddd);
  background: transparent;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary, #555);
  cursor: pointer;
  transition: all 0.15s;
}

.settings-goal-btn--active {
  background: #007A4D;
  border-color: #007A4D;
  color: #fff;
}

/* About card */
.settings-about-card {
  background: var(--card-bg, #fff);
  border-radius: 1rem;
  padding: 1.25rem 1.25rem 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  text-align: center;
}

.settings-about-logo {
  font-size: 1.5rem;
  font-weight: 900;
  color: #007A4D;
  margin-bottom: 0.75rem;
}

.settings-about-logo-accent {
  color: #FFB612;
  margin-left: 0.25rem;
}

.settings-about-desc {
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  line-height: 1.55;
  margin-bottom: 0.75rem;
}

.settings-about-version {
  font-size: 0.75rem;
  color: var(--text-secondary, #aaa);
  margin-bottom: 0.25rem;
}

.settings-about-credit {
  font-size: 0.75rem;
  color: var(--text-secondary, #aaa);
}

.settings-about-credit a {
  color: #007A4D;
  text-decoration: none;
  font-weight: 600;
}

/* Sign out */
.settings-signout-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.9rem 1rem;
  background: var(--card-bg, #fff);
  border: 1.5px solid #E03C31;
  border-radius: 1rem;
  color: #E03C31;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.settings-signout-btn:hover {
  background: #fff5f5;
}
`;

if (!css.includes('.settings-goals')) {
  css += SETTINGS_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log('✅ Added Settings CSS to globals.css');
} else {
  console.log('⏭  Settings CSS already present');
}

// ─── Write page.tsx ───────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src);
console.log('\n✅ Script 06 complete — Settings page expanded.');
console.log('Run: npm run build   to verify no TS errors');
