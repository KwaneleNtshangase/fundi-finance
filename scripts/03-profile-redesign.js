/**
 * SCRIPT 03 — Compact Profile Redesign
 *
 * What this does:
 *  - Replaces ProfileView with a Duolingo-style layout:
 *      • Initials avatar (green→gold gradient circle)
 *      • Display name + "Financial Learner" sub-label
 *      • Compact stat row: XP | Level | Streak | Lessons
 *      • Earned badges only (hidden if not earned); click for modal
 *  - Badge definitions included (6 badges covering XP, streak, lessons milestones)
 *  - Badge detail modal (name, description, how to earn)
 *  - All Lucide-equivalent inline SVG icons, no emojis
 *
 * Run from project root:
 *   node scripts/03-profile-redesign.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../src/app/page.tsx');
let src = fs.readFileSync(FILE, 'utf8');

// ─── Find the ProfileView function bounds ─────────────────────────────────────
const PROFILE_START = 'function ProfileView(';
const startIdx = src.indexOf(PROFILE_START);
if (startIdx === -1) {
  console.error('❌ Could not find ProfileView function. Aborting.');
  process.exit(1);
}

// Find the end of ProfileView by counting braces
let depth = 0;
let i = startIdx;
let foundFirstBrace = false;
while (i < src.length) {
  if (src[i] === '{') { depth++; foundFirstBrace = true; }
  if (src[i] === '}') { depth--; }
  if (foundFirstBrace && depth === 0) { i++; break; }
  i++;
}
const profileViewOld = src.slice(startIdx, i);

// ─── New ProfileView ──────────────────────────────────────────────────────────
const NEW_PROFILE_VIEW = `function ProfileView({
  user,
  xp,
  streak,
  completedLessons,
  hearts,
}: {
  user: any;
  xp: number;
  streak: number;
  completedLessons: string[];
  hearts: number;
}) {
  const [selectedBadge, setSelectedBadge] = React.useState<null | {
    name: string;
    desc: string;
    howToEarn: string;
    icon: React.ReactNode;
  }>(null);

  const level = Math.floor(xp / 100) + 1;
  const lessonCount = completedLessons.length;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Learner';

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // ── Badge definitions ──────────────────────────────────────────────────────
  const BADGES = [
    {
      id: 'first_lesson',
      name: 'First Step',
      desc: 'Completed your first lesson',
      howToEarn: 'Complete any lesson to earn this badge.',
      earned: lessonCount >= 1,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
        </svg>
      ),
    },
    {
      id: 'xp_100',
      name: 'Century Club',
      desc: 'Earned 100 XP',
      howToEarn: 'Accumulate 100 XP by completing lessons and quizzes.',
      earned: xp >= 100,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      id: 'streak_3',
      name: 'On Fire',
      desc: '3-day streak',
      howToEarn: 'Open Fundi Finance and complete a lesson 3 days in a row.',
      earned: streak >= 3,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      desc: '7-day streak',
      howToEarn: 'Maintain a 7-day learning streak.',
      earned: streak >= 7,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      id: 'lessons_5',
      name: 'Quick Learner',
      desc: 'Completed 5 lessons',
      howToEarn: 'Finish 5 individual lessons.',
      earned: lessonCount >= 5,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      id: 'xp_500',
      name: 'XP Legend',
      desc: 'Earned 500 XP',
      howToEarn: 'Keep learning until you accumulate 500 XP.',
      earned: xp >= 500,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
          <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
  ];

  const earnedBadges = BADGES.filter((b) => b.earned);

  return (
    <div className="profile-view">
      {/* Avatar + name */}
      <div className="profile-hero">
        <div className="profile-avatar">
          <span>{initials}</span>
        </div>
        <h2 className="profile-name">{displayName}</h2>
        <p className="profile-sub">Financial Learner · Level {level}</p>
      </div>

      {/* Stat row */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value" style={{ color: '#007A4D' }}>{xp}</span>
          <span className="profile-stat-label">XP</span>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <span className="profile-stat-value">{level}</span>
          <span className="profile-stat-label">Level</span>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <span className="profile-stat-value" style={{ color: '#FFB612' }}>{streak}</span>
          <span className="profile-stat-label">Streak</span>
        </div>
        <div className="profile-stat-divider" />
        <div className="profile-stat">
          <span className="profile-stat-value">{lessonCount}</span>
          <span className="profile-stat-label">Lessons</span>
        </div>
      </div>

      {/* Hearts row */}
      <div className="profile-hearts-row">
        <span className="profile-hearts-label">Hearts</span>
        <div className="profile-hearts-icons">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} viewBox="0 0 24 24" fill={i < hearts ? '#E03C31' : 'none'} stroke={i < hearts ? '#E03C31' : '#ccc'} strokeWidth="2" width="20" height="20">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="profile-section">
        <h3 className="profile-section-title">
          Badges
          <span className="profile-section-count">{earnedBadges.length}/{BADGES.length}</span>
        </h3>
        {earnedBadges.length === 0 ? (
          <p className="profile-empty">Complete lessons to earn your first badge!</p>
        ) : (
          <div className="profile-badges">
            {earnedBadges.map((badge) => (
              <button
                key={badge.id}
                className="badge-card"
                onClick={() => setSelectedBadge(badge)}
                title={badge.name}
              >
                <div className="badge-icon">{badge.icon}</div>
                <span className="badge-name">{badge.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Badge modal */}
      {selectedBadge && (
        <div className="modal-overlay" onClick={() => setSelectedBadge(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-badge-icon">{selectedBadge.icon}</div>
            <h3 className="modal-title">{selectedBadge.name}</h3>
            <p className="modal-desc">{selectedBadge.desc}</p>
            <p className="modal-how"><strong>How to earn:</strong> {selectedBadge.howToEarn}</p>
            <button className="btn-primary" onClick={() => setSelectedBadge(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}`;

// ─── Replace old ProfileView with new ────────────────────────────────────────
if (!src.includes('profile-avatar')) {
  src = src.replace(profileViewOld, NEW_PROFILE_VIEW);
  console.log('✅ Replaced ProfileView with compact Duolingo-style design');
} else {
  console.log('⏭  ProfileView already redesigned');
}

// ─── Pass hearts prop where ProfileView is rendered ───────────────────────────
const PROFILE_RENDER = `<ProfileView`;
if (src.includes(PROFILE_RENDER) && !src.includes('hearts={hearts}')) {
  // Add hearts prop to the ProfileView JSX call
  src = src.replace(
    `<ProfileView\n`,
    `<ProfileView\n          hearts={hearts}\n`
  );
  console.log('✅ Added hearts prop to <ProfileView> render call');
} else {
  console.log('⏭  hearts already passed to ProfileView or ProfileView JSX not found');
}

// ─── Add Profile CSS to globals.css ───────────────────────────────────────────
const CSS_FILE = path.join(__dirname, '../src/app/globals.css');
let css = fs.readFileSync(CSS_FILE, 'utf8');

const PROFILE_CSS = `
/* ── Profile View ─────────────────────────────────────────────── */
.profile-view {
  padding: 1.5rem 1rem 6rem;
  max-width: 480px;
  margin: 0 auto;
}

.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 0 1rem;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007A4D 0%, #FFB612 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 16px rgba(0,122,77,0.25);
}

.profile-avatar span {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.profile-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 0.2rem;
  color: var(--text-primary, #111);
}

.profile-sub {
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  margin: 0;
}

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: var(--card-bg, #fff);
  border-radius: 1rem;
  padding: 1rem 0.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}

.profile-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 0.2rem;
}

.profile-stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary, #111);
  line-height: 1;
}

.profile-stat-label {
  font-size: 0.7rem;
  color: var(--text-secondary, #888);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.profile-stat-divider {
  width: 1px;
  height: 32px;
  background: var(--border, #eee);
}

.profile-hearts-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--card-bg, #fff);
  border-radius: 1rem;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.profile-hearts-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary, #111);
}

.profile-hearts-icons {
  display: flex;
  gap: 0.25rem;
}

.profile-section {
  margin-top: 1.25rem;
}

.profile-section-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary, #888);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.profile-section-count {
  background: var(--border, #eee);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #888);
}

.profile-empty {
  color: var(--text-secondary, #aaa);
  font-size: 0.9rem;
  text-align: center;
  padding: 1rem 0;
}

.profile-badges {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.badge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  background: var(--card-bg, #fff);
  border: 1.5px solid var(--border, #eee);
  border-radius: 1rem;
  padding: 0.85rem 0.5rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.badge-card:hover, .badge-card:active {
  transform: scale(1.04);
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
}

.badge-icon {
  color: #007A4D;
}

.badge-name {
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  color: var(--text-primary, #111);
}

/* ── Badge Modal ──────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: var(--bg-primary, #fff);
  border-radius: 1.5rem 1.5rem 1rem 1rem;
  padding: 2rem 1.5rem 1.5rem;
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.modal-badge-icon {
  color: #007A4D;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: center;
}

.modal-badge-icon svg {
  width: 48px;
  height: 48px;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  color: var(--text-primary, #111);
}

.modal-desc {
  color: var(--text-secondary, #555);
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.modal-how {
  color: var(--text-secondary, #777);
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
  line-height: 1.5;
}
`;

if (!css.includes('.profile-avatar')) {
  css += PROFILE_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log('✅ Added Profile CSS to globals.css');
} else {
  console.log('⏭  Profile CSS already present');
}

// ─── Write page.tsx ───────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src);
console.log('\n✅ Script 03 complete — Profile redesigned.');
console.log('Run: npm run build   to verify no TS errors');
