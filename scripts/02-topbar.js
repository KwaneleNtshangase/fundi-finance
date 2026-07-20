/**
 * SCRIPT 02 — Top Bar (Sticky, Duolingo-style)
 *
 * What this does:
 *  - Creates src/components/TopBar.tsx: streak (flame/gold), XP (zap/green),
 *    hearts (red heart icons ×5, empty when lost), sticky on all screens.
 *  - Imports and renders <TopBar> in the main layout / Home component,
 *    passing streak, xp, hearts as props.
 *  - Adds TopBar CSS to globals.css
 *
 * Run from project root:
 *   node scripts/02-topbar.js
 */

const fs = require('fs');
const path = require('path');

// ─── 1. Create TopBar component ───────────────────────────────────────────────
const TOPBAR_FILE = path.join(__dirname, '../src/components/TopBar.tsx');

const TOPBAR_CONTENT = `'use client';

import React from 'react';

interface TopBarProps {
  streak: number;
  xp: number;
  hearts: number; // 0–5
}

export default function TopBar({ streak, xp, hearts }: TopBarProps) {
  const MAX_HEARTS = 5;

  return (
    <header className="topbar">
      {/* Streak */}
      <div className="topbar-stat">
        <svg viewBox="0 0 24 24" fill="#FFB612" width="22" height="22" aria-hidden="true">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span className="topbar-value topbar-streak">{streak}</span>
      </div>

      {/* XP */}
      <div className="topbar-stat">
        <svg viewBox="0 0 24 24" fill="#007A4D" width="20" height="20" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span className="topbar-value topbar-xp">{xp} XP</span>
      </div>

      {/* Hearts */}
      <div className="topbar-stat topbar-hearts" aria-label={\`\${hearts} of \${MAX_HEARTS} hearts\`}>
        {Array.from({ length: MAX_HEARTS }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            fill={i < hearts ? '#E03C31' : 'none'}
            stroke={i < hearts ? '#E03C31' : '#ccc'}
            strokeWidth="2"
            width="18"
            height="18"
            aria-hidden="true"
            style={{ transition: 'fill 0.2s, stroke 0.2s' }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        ))}
      </div>
    </header>
  );
}
`;

fs.writeFileSync(TOPBAR_FILE, TOPBAR_CONTENT);
console.log('✅ Created src/components/TopBar.tsx');

// ─── 2. Import TopBar in page.tsx ─────────────────────────────────────────────
const PAGE_FILE = path.join(__dirname, '../src/app/page.tsx');
let src = fs.readFileSync(PAGE_FILE, 'utf8');

const FIRST_IMPORT = `'use client';`;
const TOPBAR_IMPORT = `'use client';

import TopBar from '@/components/TopBar';`;

if (!src.includes("import TopBar")) {
  src = src.replace(FIRST_IMPORT, TOPBAR_IMPORT);
  console.log('✅ Imported TopBar in page.tsx');
} else {
  console.log('⏭  TopBar already imported');
}

// ─── 3. Render <TopBar> inside the Home component's main layout ───────────────
// We look for the outermost container div in the Home return and insert TopBar
// right after the opening div (before the view switching logic).

// Target: the first <main or <div className="app- pattern in the Home return
// We'll look for a distinctive wrapper and inject after it.

const APP_WRAPPER = `<div className="app-container"`;
const APP_WRAPPER_WITH_TOPBAR = `<div className="app-container"`;

// Find where the Home return renders and insert TopBar before any view content.
// We look for the pattern where the active view is switched (the big ternary / switch).
// A safe anchor: right before the bottom nav is rendered.

const BOTTOM_NAV_IMPORT = `<MobileBottomNav`;
if (!src.includes('<TopBar') && src.includes(BOTTOM_NAV_IMPORT)) {
  // Insert TopBar right before the bottom nav
  src = src.replace(
    BOTTOM_NAV_IMPORT,
    `<TopBar streak={streak} xp={xp} hearts={hearts} />\n      ` + BOTTOM_NAV_IMPORT
  );
  console.log('✅ Inserted <TopBar> before MobileBottomNav in Home');
} else if (src.includes('<TopBar')) {
  console.log('⏭  <TopBar> already rendered');
} else {
  console.log('⚠️  MobileBottomNav anchor not found — insert <TopBar streak={streak} xp={xp} hearts={hearts} /> manually before your bottom nav');
}

// ─── 4. Add TopBar CSS to globals.css ─────────────────────────────────────────
const CSS_FILE = path.join(__dirname, '../src/app/globals.css');
let css = fs.readFileSync(CSS_FILE, 'utf8');

const TOPBAR_CSS = `
/* ── Top Bar ──────────────────────────────────────────────────── */
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  background: var(--bg-primary, #fff);
  border-bottom: 1.5px solid var(--border, #eee);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.topbar-stat {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.topbar-hearts {
  gap: 0.2rem;
}

.topbar-value {
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1;
}

.topbar-streak {
  color: #FFB612;
}

.topbar-xp {
  color: #007A4D;
}
`;

if (!css.includes('.topbar {')) {
  css += TOPBAR_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log('✅ Added TopBar CSS to globals.css');
} else {
  console.log('⏭  TopBar CSS already present');
}

// ─── Write page.tsx ───────────────────────────────────────────────────────────
fs.writeFileSync(PAGE_FILE, src);
console.log('\n✅ Script 02 complete — Top Bar added.');
console.log('Run: npm run build   to verify no TS errors');
