/**
 * SCRIPT 04 — Notho Character Wiring
 *
 * What this does:
 *  - Wires the 4 Notho mascot PNGs into the correct screens:
 *      cosmo-celebrating.png  → lesson complete screen
 *      cosmo-sad.png          → wrong answer feedback (briefly shown)
 *      cosmo-thinking.png     → info/explanation steps in lessons
 *      cosmo-default.png      → home screen header
 *
 * Assumes the 4 PNGs already exist in /public/characters/:
 *   cosmo-default.png
 *   cosmo-thinking.png
 *   cosmo-sad.png
 *   cosmo-celebrating.png
 *
 * Run from project root:
 *   node scripts/04-notho-character.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../src/app/page.tsx');
let src = fs.readFileSync(FILE, 'utf8');

// ─── 1. Create a reusable CosmoCharacter component inline ─────────────────────
// We add a tiny helper component before any of the view functions.
const COSMO_COMPONENT = `
// ── Notho Mascot Component ────────────────────────────────────────────────────
type CosmoExpression = 'default' | 'thinking' | 'sad' | 'celebrating';

function CosmoCharacter({
  expression = 'default',
  size = 100,
  className = '',
}: {
  expression?: CosmoExpression;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={\`/characters/cosmo-\${expression}.png\`}
      alt={\`Notho \${expression}\`}
      width={size}
      height={size}
      className={\`notho-character \${className}\`.trim()}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}
// ── End Notho Mascot ──────────────────────────────────────────────────────────
`;

// Insert before the first view function (CalculatorView or LearnView)
const INSERT_BEFORE = 'function CalculatorView(';
if (!src.includes('function CosmoCharacter(') && src.includes(INSERT_BEFORE)) {
  src = src.replace(INSERT_BEFORE, COSMO_COMPONENT + '\n' + INSERT_BEFORE);
  console.log('✅ Added CosmoCharacter component');
} else {
  console.log('⏭  CosmoCharacter already present or anchor not found');
}

// ─── 2. Lesson complete screen — cosmo-celebrating ────────────────────────────
// Find the lesson complete JSX. Typical pattern: a div with class containing 
// "complete" or "congrats" or where streak/xp completion is shown.
// We look for a heading like "Lesson Complete" and inject Notho above it.

const LESSON_COMPLETE_H = `Lesson Complete`;
const LESSON_COMPLETE_WITH_COSMO = `<CosmoCharacter expression="celebrating" size={120} className="notho-celebrate-anim" />
          Lesson Complete`;

if (!src.includes('notho-celebrate-anim') && src.includes(LESSON_COMPLETE_H)) {
  src = src.replace(LESSON_COMPLETE_H, LESSON_COMPLETE_WITH_COSMO);
  console.log('✅ Wired cosmo-celebrating to lesson complete screen');
} else {
  console.log('⏭  Notho celebrating already wired or "Lesson Complete" text not found');
}

// ─── 3. Wrong answer screen — cosmo-sad ──────────────────────────────────────
// Find the incorrect answer feedback. Typical: showIncorrect state shown.
// We look for "Incorrect" or "Wrong" text in a feedback block.
// Inject cosmo-sad above it, but only in the feedback overlay / card.

const INCORRECT_HEADER = `Incorrect!`;
const INCORRECT_WITH_COSMO = `<CosmoCharacter expression="sad" size={80} className="cosmo-sad-anim" />
            Incorrect!`;

if (!src.includes('cosmo-sad-anim') && src.includes(INCORRECT_HEADER)) {
  src = src.replace(INCORRECT_HEADER, INCORRECT_WITH_COSMO);
  console.log('✅ Wired cosmo-sad to incorrect answer feedback');
} else {
  console.log('⏭  Notho sad already wired or "Incorrect!" text not found');
}

// ─── 4. Info/explanation steps — cosmo-thinking ──────────────────────────────
// Info steps typically have type === 'info' and show explanatory content.
// We look for a pattern like step.type === 'info' rendered content.
// Insert Notho thinking above info step content.

const INFO_STEP_TEXT = `step.type === 'info'`;
// This is logic, not JSX — we look for JSX rendering of info steps instead.
// A common pattern: className containing "info-step" or rendering step.explanation.

// Try to find the info card rendering:
const INFO_CARD = `className="info-card"`;
const INFO_CARD_WITH_COSMO = `className="info-card"`;

// Alternative: look for where info steps are rendered and inject Notho
// We'll look for the question type check in JSX
const INFO_JSX_MARKER = `{step.type === 'info' && (`;
if (!src.includes('cosmo-thinking-anim') && src.includes(INFO_JSX_MARKER)) {
  // Find the render block and inject Notho at the start of the info content
  src = src.replace(
    INFO_JSX_MARKER,
    `{step.type === 'info' && (<CosmoCharacter expression="thinking" size={80} className="cosmo-thinking-anim" />)}\n      {step.type === 'info' && (`
  );
  console.log('✅ Wired cosmo-thinking to info steps');
} else {
  // Try alternate pattern: look for info-step class div
  const INFO_DIV = `<div className="info-step"`;
  const INFO_DIV_WITH_COSMO = `<div className="info-step"><CosmoCharacter expression="thinking" size={80} className="cosmo-thinking-anim" />`;
  if (!src.includes('cosmo-thinking-anim') && src.includes(INFO_DIV)) {
    src = src.replace(INFO_DIV, INFO_DIV_WITH_COSMO);
    console.log('✅ Wired cosmo-thinking to info-step div');
  } else {
    console.log('⚠️  Could not auto-wire cosmo-thinking — add manually:');
    console.log('    <CosmoCharacter expression="thinking" size={80} /> above your info step content');
  }
}

// ─── 5. Home screen header — cosmo-default ────────────────────────────────────
// Find the home/learn screen header section and inject Notho default.
// Typical: a welcome heading or the LearnView top header.

const HOME_GREETING = `Good morning`; // or "Hello" or similar greeting
const HOME_GREETING_ALT = `What would you like to learn`;

// Try the LearnView header area
const LEARN_HEADER = `className="learn-header"`;
const LEARN_HEADER_WITH_COSMO = `className="learn-header"`;

const COSMO_HOME_MARKER = `className="home-hero"`;
if (!src.includes('cosmo-default-home') && src.includes(COSMO_HOME_MARKER)) {
  src = src.replace(
    `className="home-hero"`,
    `className="home-hero"><CosmoCharacter expression="default" size={90} className="cosmo-default-home" />`
  );
  console.log('✅ Wired cosmo-default to home-hero div');
} else {
  // Try learn-header
  const LEARN_HEADER_DIV = `<div className="learn-header">`;
  if (!src.includes('cosmo-default-home') && src.includes(LEARN_HEADER_DIV)) {
    src = src.replace(
      LEARN_HEADER_DIV,
      `<div className="learn-header"><CosmoCharacter expression="default" size={80} className="cosmo-default-home" />`
    );
    console.log('✅ Wired cosmo-default to learn-header div');
  } else {
    console.log('⚠️  Could not auto-wire cosmo-default — add manually:');
    console.log('    <CosmoCharacter expression="default" size={90} /> in your home/learn screen header');
  }
}

// ─── 6. Add Notho CSS animations ──────────────────────────────────────────────
const CSS_FILE = path.join(__dirname, '../src/app/globals.css');
let css = fs.readFileSync(CSS_FILE, 'utf8');

const COSMO_CSS = `
/* ── Notho Mascot ─────────────────────────────────────────────── */
.notho-character {
  user-select: none;
  pointer-events: none;
}

@keyframes notho-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes notho-shake {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(8deg); }
  60% { transform: rotate(-5deg); }
  80% { transform: rotate(5deg); }
}

@keyframes notho-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  30% { transform: translateY(-4px) rotate(-3deg); }
  70% { transform: translateY(-2px) rotate(3deg); }
}

.notho-celebrate-anim {
  animation: notho-bounce 0.8s ease-in-out infinite;
  margin: 0 auto 0.5rem;
}

.cosmo-sad-anim {
  animation: notho-shake 0.5s ease-in-out 1;
  margin: 0 auto 0.5rem;
}

.cosmo-thinking-anim {
  animation: notho-bob 2s ease-in-out infinite;
  margin: 0 auto 0.5rem;
}

.cosmo-default-home {
  margin: 0 auto 0.75rem;
}
`;

if (!css.includes('.notho-character')) {
  css += COSMO_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log('✅ Added Notho CSS animations to globals.css');
} else {
  console.log('⏭  Notho CSS already present');
}

// ─── Write page.tsx ───────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src);
console.log('\n✅ Script 04 complete — Notho character wired.');
console.log('📋 Make sure PNGs are in /public/characters/:');
console.log('   cosmo-default.png, cosmo-thinking.png, cosmo-sad.png, cosmo-celebrating.png');
console.log('Run: npm run build   to verify no TS errors');
