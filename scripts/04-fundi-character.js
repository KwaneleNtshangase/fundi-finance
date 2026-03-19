/**
 * SCRIPT 04 — Fundi Character Wiring
 *
 * What this does:
 *  - Wires the 4 Fundi mascot PNGs into the correct screens:
 *      fundi-celebrating.png  → lesson complete screen
 *      fundi-sad.png          → wrong answer feedback (briefly shown)
 *      fundi-thinking.png     → info/explanation steps in lessons
 *      fundi-default.png      → home screen header
 *
 * Assumes the 4 PNGs already exist in /public/characters/:
 *   fundi-default.png
 *   fundi-thinking.png
 *   fundi-sad.png
 *   fundi-celebrating.png
 *
 * Run from project root:
 *   node scripts/04-fundi-character.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../src/app/page.tsx');
let src = fs.readFileSync(FILE, 'utf8');

// ─── 1. Create a reusable FundiCharacter component inline ─────────────────────
// We add a tiny helper component before any of the view functions.
const FUNDI_COMPONENT = `
// ── Fundi Mascot Component ────────────────────────────────────────────────────
type FundiExpression = 'default' | 'thinking' | 'sad' | 'celebrating';

function FundiCharacter({
  expression = 'default',
  size = 100,
  className = '',
}: {
  expression?: FundiExpression;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={\`/characters/fundi-\${expression}.png\`}
      alt={\`Fundi \${expression}\`}
      width={size}
      height={size}
      className={\`fundi-character \${className}\`.trim()}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}
// ── End Fundi Mascot ──────────────────────────────────────────────────────────
`;

// Insert before the first view function (CalculatorView or LearnView)
const INSERT_BEFORE = 'function CalculatorView(';
if (!src.includes('function FundiCharacter(') && src.includes(INSERT_BEFORE)) {
  src = src.replace(INSERT_BEFORE, FUNDI_COMPONENT + '\n' + INSERT_BEFORE);
  console.log('✅ Added FundiCharacter component');
} else {
  console.log('⏭  FundiCharacter already present or anchor not found');
}

// ─── 2. Lesson complete screen — fundi-celebrating ────────────────────────────
// Find the lesson complete JSX. Typical pattern: a div with class containing 
// "complete" or "congrats" or where streak/xp completion is shown.
// We look for a heading like "Lesson Complete" and inject Fundi above it.

const LESSON_COMPLETE_H = `Lesson Complete`;
const LESSON_COMPLETE_WITH_FUNDI = `<FundiCharacter expression="celebrating" size={120} className="fundi-celebrate-anim" />
          Lesson Complete`;

if (!src.includes('fundi-celebrate-anim') && src.includes(LESSON_COMPLETE_H)) {
  src = src.replace(LESSON_COMPLETE_H, LESSON_COMPLETE_WITH_FUNDI);
  console.log('✅ Wired fundi-celebrating to lesson complete screen');
} else {
  console.log('⏭  Fundi celebrating already wired or "Lesson Complete" text not found');
}

// ─── 3. Wrong answer screen — fundi-sad ──────────────────────────────────────
// Find the incorrect answer feedback. Typical: showIncorrect state shown.
// We look for "Incorrect" or "Wrong" text in a feedback block.
// Inject fundi-sad above it, but only in the feedback overlay / card.

const INCORRECT_HEADER = `Incorrect!`;
const INCORRECT_WITH_FUNDI = `<FundiCharacter expression="sad" size={80} className="fundi-sad-anim" />
            Incorrect!`;

if (!src.includes('fundi-sad-anim') && src.includes(INCORRECT_HEADER)) {
  src = src.replace(INCORRECT_HEADER, INCORRECT_WITH_FUNDI);
  console.log('✅ Wired fundi-sad to incorrect answer feedback');
} else {
  console.log('⏭  Fundi sad already wired or "Incorrect!" text not found');
}

// ─── 4. Info/explanation steps — fundi-thinking ──────────────────────────────
// Info steps typically have type === 'info' and show explanatory content.
// We look for a pattern like step.type === 'info' rendered content.
// Insert Fundi thinking above info step content.

const INFO_STEP_TEXT = `step.type === 'info'`;
// This is logic, not JSX — we look for JSX rendering of info steps instead.
// A common pattern: className containing "info-step" or rendering step.explanation.

// Try to find the info card rendering:
const INFO_CARD = `className="info-card"`;
const INFO_CARD_WITH_FUNDI = `className="info-card"`;

// Alternative: look for where info steps are rendered and inject Fundi
// We'll look for the question type check in JSX
const INFO_JSX_MARKER = `{step.type === 'info' && (`;
if (!src.includes('fundi-thinking-anim') && src.includes(INFO_JSX_MARKER)) {
  // Find the render block and inject Fundi at the start of the info content
  src = src.replace(
    INFO_JSX_MARKER,
    `{step.type === 'info' && (<FundiCharacter expression="thinking" size={80} className="fundi-thinking-anim" />)}\n      {step.type === 'info' && (`
  );
  console.log('✅ Wired fundi-thinking to info steps');
} else {
  // Try alternate pattern: look for info-step class div
  const INFO_DIV = `<div className="info-step"`;
  const INFO_DIV_WITH_FUNDI = `<div className="info-step"><FundiCharacter expression="thinking" size={80} className="fundi-thinking-anim" />`;
  if (!src.includes('fundi-thinking-anim') && src.includes(INFO_DIV)) {
    src = src.replace(INFO_DIV, INFO_DIV_WITH_FUNDI);
    console.log('✅ Wired fundi-thinking to info-step div');
  } else {
    console.log('⚠️  Could not auto-wire fundi-thinking — add manually:');
    console.log('    <FundiCharacter expression="thinking" size={80} /> above your info step content');
  }
}

// ─── 5. Home screen header — fundi-default ────────────────────────────────────
// Find the home/learn screen header section and inject Fundi default.
// Typical: a welcome heading or the LearnView top header.

const HOME_GREETING = `Good morning`; // or "Hello" or similar greeting
const HOME_GREETING_ALT = `What would you like to learn`;

// Try the LearnView header area
const LEARN_HEADER = `className="learn-header"`;
const LEARN_HEADER_WITH_FUNDI = `className="learn-header"`;

const FUNDI_HOME_MARKER = `className="home-hero"`;
if (!src.includes('fundi-default-home') && src.includes(FUNDI_HOME_MARKER)) {
  src = src.replace(
    `className="home-hero"`,
    `className="home-hero"><FundiCharacter expression="default" size={90} className="fundi-default-home" />`
  );
  console.log('✅ Wired fundi-default to home-hero div');
} else {
  // Try learn-header
  const LEARN_HEADER_DIV = `<div className="learn-header">`;
  if (!src.includes('fundi-default-home') && src.includes(LEARN_HEADER_DIV)) {
    src = src.replace(
      LEARN_HEADER_DIV,
      `<div className="learn-header"><FundiCharacter expression="default" size={80} className="fundi-default-home" />`
    );
    console.log('✅ Wired fundi-default to learn-header div');
  } else {
    console.log('⚠️  Could not auto-wire fundi-default — add manually:');
    console.log('    <FundiCharacter expression="default" size={90} /> in your home/learn screen header');
  }
}

// ─── 6. Add Fundi CSS animations ──────────────────────────────────────────────
const CSS_FILE = path.join(__dirname, '../src/app/globals.css');
let css = fs.readFileSync(CSS_FILE, 'utf8');

const FUNDI_CSS = `
/* ── Fundi Mascot ─────────────────────────────────────────────── */
.fundi-character {
  user-select: none;
  pointer-events: none;
}

@keyframes fundi-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes fundi-shake {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(8deg); }
  60% { transform: rotate(-5deg); }
  80% { transform: rotate(5deg); }
}

@keyframes fundi-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  30% { transform: translateY(-4px) rotate(-3deg); }
  70% { transform: translateY(-2px) rotate(3deg); }
}

.fundi-celebrate-anim {
  animation: fundi-bounce 0.8s ease-in-out infinite;
  margin: 0 auto 0.5rem;
}

.fundi-sad-anim {
  animation: fundi-shake 0.5s ease-in-out 1;
  margin: 0 auto 0.5rem;
}

.fundi-thinking-anim {
  animation: fundi-bob 2s ease-in-out infinite;
  margin: 0 auto 0.5rem;
}

.fundi-default-home {
  margin: 0 auto 0.75rem;
}
`;

if (!css.includes('.fundi-character')) {
  css += FUNDI_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log('✅ Added Fundi CSS animations to globals.css');
} else {
  console.log('⏭  Fundi CSS already present');
}

// ─── Write page.tsx ───────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src);
console.log('\n✅ Script 04 complete — Fundi character wired.');
console.log('📋 Make sure PNGs are in /public/characters/:');
console.log('   fundi-default.png, fundi-thinking.png, fundi-sad.png, fundi-celebrating.png');
console.log('Run: npm run build   to verify no TS errors');
