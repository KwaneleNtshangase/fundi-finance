#!/usr/bin/env node
// fundi-fix-ts10.js — fix JSX syntax error from patch-14 calculator changes
// Error: line 1031 "Expected '</', got 'ident'" — unclosed conditional JSX

const fs = require("fs");
let fixes = 0;

function patch(file, desc, search, replace) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes(search)) { console.log(`⚠️  NOT FOUND: ${desc}`); return false; }
  fs.writeFileSync(file, content.replace(search, replace), "utf8");
  console.log(`✅  ${desc}`);
  fixes++;
  return true;
}

const P = "src/app/page.tsx";

// Fix 1: The {hasCalculated && <div opened the chart div without closing the conditional.
// We added: {hasCalculated && <div ... > but never closed with } 
// Find the chart closing div and add the closing brace
patch(P, "fix unclosed hasCalculated conditional — close chart section",
  `      {hasCalculated && <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
          Growth Over Time
        </div>`,
  `      {hasCalculated && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
            Growth Over Time
          </div>`
);

// Fix 2: Find the closing </div> of the chart container and close the conditional
// The chart container ends before the "Talk to a Finance Professional" CTA
patch(P, "close hasCalculated conditional after chart ResponsiveContainer",
  `      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-primary)",
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
          marginBottom: 32,
        }}
      >`,
  `        </div>
      )}

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-primary)",
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
          marginBottom: 32,
        }}
      >`
);

// Fix 3: Also fix the hasCalculated single/compare conditional — it opened a ternary
// incorrectly. The original was: {mode === "single" ? (...) : (...)}
// After our patch it became: {hasCalculated && mode === "single" ? (...) but the else branch
// for compare was left dangling. Find and fix the compare table to also be gated.
patch(P, "fix hasCalculated conditional for compare table",
  `      {hasCalculated && mode === "single" ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >`,
  `      {hasCalculated && (mode === "single" ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >`
);

// Close the ternary after the compare table
patch(P, "close hasCalculated + mode ternary after compare table",
  `        </div>
      )}

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-primary)",`,
  `        </div>
      ))}

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-primary)",`
);

// Fix 4: Also need to add ExitConfirmModal render and exit ✕ button
// These were NOT FOUND in patch-14, let's try different anchors
patch(P, "render ExitConfirmModal in LessonView main return",
  `  return (
    <main className="main-content" id="mainContent">
      <div className="lesson-container">`,
  `  return (
    <main className="main-content" id="mainContent">
      <ExitConfirmModal />
      <div className="lesson-container">`
);

// Add ✕ exit button to the lesson header — try finding the lesson header bar
patch(P, "add ✕ exit button to lesson progress bar area",
  `          {/* Progress bar */}
          <div className="lesson-progress-bar">`,
  `          {/* Exit button */}
          {goBack && (
            <button
              onClick={() => setShowExitConfirm(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 16, padding: "4px 8px", fontWeight: 700, flexShrink: 0, lineHeight: 1 }}
              aria-label="Exit lesson"
            >✕</button>
          )}
          {/* Progress bar */}
          <div className="lesson-progress-bar">`
);

console.log(`\n${fixes} fixes applied.`);
console.log("Now run: npm run build");
