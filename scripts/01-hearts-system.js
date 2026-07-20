/**
 * SCRIPT 01 — Hearts System
 * 
 * What this does:
 *  - Adds `hearts` (0–5) and `lastHeartLostAt` to useFundiState
 *  - Adds `loseHeart()`, `gainHeart()`, `heartsRegenInfo()` helpers
 *  - Wires loseHeart() into wrong-answer handler inside LessonView
 *  - Wires gainHeart() on perfect lesson complete
 *  - Blocks lesson progress when hearts === 0 (shows regen countdown)
 *  - Persists hearts + lastHeartLostAt to Supabase user_progress
 *
 * Run from project root:
 *   node scripts/01-hearts-system.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../src/app/page.tsx');

let src = fs.readFileSync(FILE, 'utf8');

// ─── 1. Add hearts fields to the state type / initial state ───────────────────
// Find the useFundiState hook and add hearts to useState initialisation.
// We look for the XP state line and add hearts right after.

const XP_STATE = `const [xp, setXp] = useState(0);`;
const XP_STATE_WITH_HEARTS = `const [xp, setXp] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [lastHeartLostAt, setLastHeartLostAt] = useState<number | null>(null);`;

if (!src.includes('const [hearts, setHearts]')) {
  src = src.replace(XP_STATE, XP_STATE_WITH_HEARTS);
  console.log('✅ Added hearts + lastHeartLostAt state');
} else {
  console.log('⏭  hearts state already present');
}

// ─── 2. Load hearts from Supabase when user_progress is fetched ───────────────
// Find the block where xp is loaded from Supabase progress data and add hearts loading.

const LOAD_XP = `setXp(progress.xp || 0);`;
const LOAD_XP_WITH_HEARTS = `setXp(progress.xp || 0);
        setHearts(progress.hearts ?? 5);
        setLastHeartLostAt(progress.last_heart_lost_at ?? null);`;

if (!src.includes('setHearts(progress.hearts')) {
  src = src.replace(LOAD_XP, LOAD_XP_WITH_HEARTS);
  console.log('✅ Added hearts loading from Supabase');
} else {
  console.log('⏭  hearts loading already present');
}

// ─── 3. Save hearts to Supabase when progress is saved ────────────────────────
// Find the upsert call and add hearts fields.

const UPSERT_XP = `xp: currentXp,`;
const UPSERT_XP_WITH_HEARTS = `xp: currentXp,
          hearts,
          last_heart_lost_at: lastHeartLostAt,`;

if (!src.includes('last_heart_lost_at: lastHeartLostAt')) {
  src = src.replace(UPSERT_XP, UPSERT_XP_WITH_HEARTS);
  console.log('✅ Added hearts to Supabase upsert');
} else {
  console.log('⏭  hearts upsert already present');
}

// ─── 4. Add heart helper functions inside useFundiState ──────────────────────
// Insert helpers just before the return statement of useFundiState.

const HEARTS_HELPERS = `
  // ── Hearts helpers ────────────────────────────────────────────────────────
  const MAX_HEARTS = 5;
  const HEART_REGEN_MS = 60 * 60 * 1000; // 1 hour

  const loseHeart = () => {
    if (hearts <= 0) return;
    const newHearts = hearts - 1;
    setHearts(newHearts);
    setLastHeartLostAt(Date.now());
  };

  const gainHeart = () => {
    setHearts((h) => Math.min(h + 1, MAX_HEARTS));
  };

  // Returns { nextHeartIn: string, minutesLeft: number } or null if hearts full
  const heartsRegenInfo = (): { nextHeartIn: string; minutesLeft: number } | null => {
    if (hearts >= MAX_HEARTS || !lastHeartLostAt) return null;
    const elapsed = Date.now() - lastHeartLostAt;
    const remaining = HEART_REGEN_MS - (elapsed % HEART_REGEN_MS);
    const minutes = Math.ceil(remaining / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const nextHeartIn = h > 0 ? \`\${h}h \${m}m\` : \`\${m}m\`;
    return { nextHeartIn, minutesLeft: minutes };
  };

  // Tick: regen hearts automatically every minute
  React.useEffect(() => {
    if (hearts >= MAX_HEARTS || !lastHeartLostAt) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastHeartLostAt;
      const heartsToAdd = Math.floor(elapsed / HEART_REGEN_MS);
      if (heartsToAdd > 0) {
        setHearts((h) => Math.min(h + heartsToAdd, MAX_HEARTS));
        setLastHeartLostAt((prev) => prev ? prev + heartsToAdd * HEART_REGEN_MS : null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [hearts, lastHeartLostAt]);
  // ── End hearts helpers ───────────────────────────────────────────────────
`;

// Insert before the return of useFundiState — find the hook's return
const HOOK_RETURN_MARKER = `  return {
    user,
    session,`;

if (!src.includes('loseHeart')) {
  src = src.replace(HOOK_RETURN_MARKER, HEARTS_HELPERS + '\n' + HOOK_RETURN_MARKER);
  console.log('✅ Added loseHeart / gainHeart / heartsRegenInfo helpers');
} else {
  console.log('⏭  heart helpers already present');
}

// ─── 5. Export hearts from useFundiState return ───────────────────────────────
const RETURN_USER = `    user,
    session,`;
const RETURN_USER_WITH_HEARTS = `    user,
    session,
    hearts,
    lastHeartLostAt,
    loseHeart,
    gainHeart,
    heartsRegenInfo,`;

if (!src.includes('loseHeart,') && src.includes(RETURN_USER)) {
  src = src.replace(RETURN_USER, RETURN_USER_WITH_HEARTS);
  console.log('✅ Exported hearts helpers from hook return');
} else {
  console.log('⏭  hearts already in hook return or marker not found');
}

// ─── 6. Destructure hearts in Home component ─────────────────────────────────
// Find where useFundiState() is destructured in the Home component.

const DESTRUCT_USER = `const {
    user,
    session,`;
const DESTRUCT_WITH_HEARTS = `const {
    user,
    session,
    hearts,
    lastHeartLostAt,
    loseHeart,
    gainHeart,
    heartsRegenInfo,`;

if (!src.includes('loseHeart,\n') && src.includes(DESTRUCT_USER)) {
  // Only replace the FIRST occurrence (Home component)
  const idx = src.indexOf(DESTRUCT_USER);
  src = src.slice(0, idx) + DESTRUCT_WITH_HEARTS + src.slice(idx + DESTRUCT_USER.length);
  console.log('✅ Destructured hearts in Home component');
} else {
  console.log('⏭  hearts already destructured or marker not found');
}

// ─── 7. Wire loseHeart() into wrong answer handler ───────────────────────────
// The wrong answer typically calls playSound('incorrect') and setShowIncorrect(true).
// We add loseHeart() right after playSound('incorrect').

const WRONG_SOUND = `playSound('incorrect');`;
const WRONG_SOUND_WITH_HEART = `playSound('incorrect');
        loseHeart();`;

// Only replace inside lesson context — check if 'incorrect' sound appears more than once,
// and replace all (they're all wrong-answer handlers).
if (!src.includes('loseHeart()') && src.includes(WRONG_SOUND)) {
  // Replace only first occurrence to avoid double-losing in nested calls
  src = src.replace(WRONG_SOUND, WRONG_SOUND_WITH_HEART);
  console.log('✅ Wired loseHeart() into wrong answer handler');
} else {
  console.log('⏭  loseHeart already wired or playSound incorrect not found');
}

// ─── 8. Wire gainHeart() on perfect lesson complete ───────────────────────────
// Perfect lesson: score === questions.length when lesson completes.
// Find the lesson complete handler where streak/xp update and add gainHeart.

const PERFECT_MARKER = `setStreak((s) => s + 1);`;
const PERFECT_WITH_HEART = `setStreak((s) => s + 1);
        // Reward a heart for perfect lesson
        if (typeof gainHeart === 'function') gainHeart();`;

if (!src.includes('Reward a heart for perfect') && src.includes(PERFECT_MARKER)) {
  src = src.replace(PERFECT_MARKER, PERFECT_WITH_HEART);
  console.log('✅ Wired gainHeart() on lesson complete');
} else {
  console.log('⏭  gainHeart on perfect already wired or marker not found');
}

// ─── 9. Block lesson start when hearts === 0 ─────────────────────────────────
// In LessonView, at the top of the component (or wherever the lesson renders),
// we add a guard. We look for where LessonView renders its main content and
// prepend a "No hearts" wall.

const LESSON_VIEW_START = `function LessonView(`;
const lessonViewIdx = src.indexOf(LESSON_VIEW_START);
if (lessonViewIdx === -1) {
  console.log('⚠️  LessonView not found — hearts block gate skipped');
} else {
  // Find the opening return inside LessonView
  // Insert the hearts gate JSX block just before the main return.
  // We look for a distinctive pattern inside LessonView's return.
  const LESSON_RETURN_MARKER = `  if (completed) {`;
  if (!src.includes('hearts === 0') && src.includes(LESSON_RETURN_MARKER)) {
    const heartGate = `
  // ── Hearts gate ───────────────────────────────────────────────────────────
  if (hearts === 0) {
    const regen = heartsRegenInfo ? heartsRegenInfo() : null;
    return (
      <div className="hearts-gate">
        <div className="hearts-gate-inner">
          <div className="hearts-gate-icons">
            {[1,2,3,4,5].map((i) => (
              <svg key={i} viewBox="0 0 24 24" fill="none" stroke="#E03C31" strokeWidth="2" width="32" height="32">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ))}
          </div>
          <h2 className="hearts-gate-title">No hearts left!</h2>
          <p className="hearts-gate-desc">
            {regen
              ? \`Your next heart arrives in \${regen.nextHeartIn}. Hearts refill 1 per hour.\`
              : 'Hearts refill 1 per hour. Come back soon!'}
          </p>
          <button className="btn-primary" onClick={onBack}>Back to lessons</button>
        </div>
      </div>
    );
  }
  // ── End hearts gate ───────────────────────────────────────────────────────
`;
    src = src.replace(LESSON_RETURN_MARKER, heartGate + '\n' + LESSON_RETURN_MARKER);
    console.log('✅ Added hearts gate in LessonView');
  } else {
    console.log('⏭  hearts gate already present or marker not found');
  }
}

// ─── 10. Add LessonView props for hearts ─────────────────────────────────────
// LessonView receives hearts, heartsRegenInfo, loseHeart as props.
// Find the LessonView prop destructuring and add hearts.

const LESSON_PROPS = `function LessonView({`;
const lessonPropsIdx = src.indexOf(LESSON_PROPS);
if (lessonPropsIdx !== -1) {
  // Find the closing }) of the props destructuring
  const propsEnd = src.indexOf('}:', lessonPropsIdx);
  if (propsEnd !== -1) {
    const propsSlice = src.slice(lessonPropsIdx, propsEnd);
    if (!propsSlice.includes('hearts')) {
      // Add hearts props before the closing }: of the destructure
      src = src.slice(0, propsEnd) + ',\n  hearts,\n  heartsRegenInfo,\n  loseHeart' + src.slice(propsEnd);
      console.log('✅ Added hearts props to LessonView signature');
    } else {
      console.log('⏭  hearts already in LessonView props');
    }
  }
}

// ─── 11. Pass hearts props when LessonView is rendered ───────────────────────
const LESSONVIEW_RENDER = `<LessonView`;
// Find the JSX render call for LessonView and add hearts props
// We look for a distinctive prop like onBack or lesson=
const LESSON_RENDER_ONBACK = `onBack={() =>`;
if (src.includes(LESSONVIEW_RENDER) && !src.includes('hearts={hearts}')) {
  // Add hearts props after the <LessonView opening
  src = src.replace(
    `<LessonView\n`,
    `<LessonView\n          hearts={hearts}\n          heartsRegenInfo={heartsRegenInfo}\n          loseHeart={loseHeart}\n`
  );
  console.log('✅ Passed hearts props to <LessonView>');
} else {
  console.log('⏭  hearts props already passed to LessonView or not found');
}

// ─── 12. Add CSS for hearts gate ─────────────────────────────────────────────
const CSS_FILE = path.join(__dirname, '../src/app/globals.css');
let css = fs.readFileSync(CSS_FILE, 'utf8');

const HEARTS_CSS = `
/* ── Hearts Gate ─────────────────────────────────────────────── */
.hearts-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}
.hearts-gate-inner {
  background: var(--card-bg, #fff);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  text-align: center;
  max-width: 360px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.10);
}
.hearts-gate-icons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.25rem;
  opacity: 0.25;
}
.hearts-gate-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-primary, #111);
}
.hearts-gate-desc {
  color: var(--text-secondary, #555);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}
`;

if (!css.includes('.hearts-gate')) {
  css += HEARTS_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log('✅ Added hearts gate CSS to globals.css');
} else {
  console.log('⏭  hearts gate CSS already present');
}

// ─── Write final file ─────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src);
console.log('\n✅ Script 01 complete — Hearts system added.');
console.log('📋 Next: Add `hearts` and `last_heart_lost_at` columns to Supabase user_progress table:');
console.log('   ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS hearts integer DEFAULT 5;');
console.log('   ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_heart_lost_at bigint;');
console.log('\nRun: npm run build   (to verify no TS errors)');
