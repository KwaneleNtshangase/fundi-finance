#!/usr/bin/env node
// fundi-recover.js
// The calculator JSX is too corrupted for surgical fixes.
// This script uses git to restore the last clean state and then applies
// ONLY the working, non-calculator changes from patches 14+.

const { execSync } = require("child_process");
const fs = require("fs");

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  } catch (e) {
    return e.stdout + e.stderr;
  }
}

function patch(file, desc, search, replace) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes(search)) { console.log(`⚠️  NOT FOUND: ${desc}`); return false; }
  fs.writeFileSync(file, content.replace(search, replace), "utf8");
  console.log(`✅  ${desc}`);
  return true;
}

const P = "src/app/page.tsx";
const C = "src/app/globals.css";

// Step 1: Find the last clean commit (patch-13 was clean)
console.log("ℹ️  Checking git log for clean commits...");
const log = run("git log --oneline -10");
console.log(log);

// Step 2: Restore page.tsx from the last known good commit
// The last clean deploy was J9oifTpx38cPTPwnx6TppLv6rqvQ (patch-13)
// We can restore from git using the commit where patch-13 succeeded
console.log("ℹ️  Restoring page.tsx from last clean git state...");

// Find the commit hash for the clean patch-13 state
// Based on the logs, this was after fundi-patch-13 and before fundi-patch-13c
// Let's find it dynamically
const gitLog = run("git log --oneline src/app/page.tsx");
console.log("Git log for page.tsx:");
console.log(gitLog);

// The user's last clean build was at the "chore: all patches applied" commit
// Let's restore from HEAD~0 file if it exists, otherwise use the known anchor
// Actually let's just fix the file directly since we know the exact corruption

// Step 3: Fix the corruption directly
// The error at line 51 shows the calc section is merged with other content
// Line 53 shows: "Growth Over Time"      {hasCalculated && (mode === "single" ? (
// This means two sections got concatenated on the same line

console.log("\n📋 Reading current corrupted content...");
const content = fs.readFileSync(P, "utf8");

// The corruption: "Growth Over Time" text has content appended to it from fix-ts11
// Find the corrupted line and fix it
const corruptedPattern = `<div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>      {hasCalculated && (mode === "single" ? (`;

if (content.includes(corruptedPattern)) {
  console.log("✅  Found corruption pattern — fixing...");
  
  // This is what fix-ts11 did wrong: it concatenated the replacement
  // onto the existing content instead of replacing the section
  // We need to:
  // 1. Remove everything from "{/* Calculate button */}" to the end of the broken compare section
  // 2. Replace with clean JSX
  
  // Find the start of the corrupted calculator results
  const calcStart = content.indexOf('{/* Calculate button */}');
  
  // Find a safe end anchor - "Want a personalised" CTA text
  const ctaPatterns = [
    'Want a personalised',
    'Talk to a Finance Professional',
    'These numbers are a starting point',
  ];
  
  let ctaIdx = -1;
  let ctaPattern = '';
  for (const p of ctaPatterns) {
    const idx = content.indexOf(p);
    if (idx !== -1) {
      ctaIdx = idx;
      ctaPattern = p;
      console.log(`✅  Found CTA anchor: "${p}" at char ${idx}`);
      break;
    }
  }
  
  if (calcStart === -1) {
    console.log("⚠️  Cannot find {/* Calculate button */} — looking for mode ternary...");
    process.exit(1);
  }
  
  if (ctaIdx === -1) {
    console.log("⚠️  Cannot find CTA section — will use different strategy");
    // Try to find the closing brace of CalculatorView
    process.exit(1);
  }
  
  // Walk back from CTA to find the opening <div of that section
  // The CTA div starts with: <div\n        style={{\n          background: "var(--color-surface)",\n          border: "1px solid var(--color-primary)"
  const ctaDivStart = content.lastIndexOf('\n      <div\n', ctaIdx);
  if (ctaDivStart === -1) {
    console.log("⚠️  Cannot find CTA div start");
    process.exit(1);
  }
  
  console.log(`ℹ️  Replacing chars ${calcStart} to ${ctaDivStart}`);
  
  const cleanCalcSection = `{/* Calculate button */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginBottom: 20, fontSize: 16, fontWeight: 700, padding: "14px" }}
        onClick={handleCalculate}
      >
        📊 Calculate
      </button>

      {!hasCalculated && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-secondary)", fontSize: 14 }}>
          Set your values above, then tap Calculate to see your results.
        </div>
      )}

      {hasCalculated && mode === "single" && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <ResultCard label="Final Value" value={formatZAR(finalA.value)} highlight />
          <ResultCard label="Total Contributions" value={formatZAR(finalA.contributions)} />
          <ResultCard label="Total Interest Earned" value={formatZAR(finalA.interest)} />
        </div>
      )}

      {hasCalculated && mode === "compare" && (
        <div style={{ marginBottom: 24, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--color-text-secondary)" }}>Metric</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>Investment A</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--color-secondary)" }}>Investment B</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Final Value", formatZAR(finalA.value), formatZAR(finalB.value)],
                ["Total Contributions", formatZAR(finalA.contributions), formatZAR(finalB.contributions)],
                ["Total Interest", formatZAR(finalA.interest), formatZAR(finalB.interest)],
                ["Annual Return", \`\${inputsA.rate}%\`, \`\${inputsB.rate}%\`],
                ["Term", \`\${inputsA.years} yrs\`, \`\${inputsB.years} yrs\`],
              ].map(([metric, a, b]) => (
                <tr key={metric} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)", fontWeight: 600 }}>{metric}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>{a}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--color-secondary)" }}>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasCalculated && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Growth Over Time</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="year" tickFormatter={(v) => \`Yr \${v}\`} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
              <YAxis tickFormatter={(v) => \`R\${(v / 1000).toFixed(0)}k\`} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} width={50} />
              <Tooltip
                formatter={(v: number) => formatZAR(v)}
                labelFormatter={(l) => \`Year \${l}\`}
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              {mode === "single" ? (
                <>
                  <Line type="monotone" dataKey="Portfolio Value" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Total Contributions" stroke="#FFB612" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="Investment A" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Investment B" stroke="#FFB612" strokeWidth={2.5} dot={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      `;
  
  const newContent = content.slice(0, calcStart) + cleanCalcSection + content.slice(ctaDivStart + 1); // +1 to skip the \n
  fs.writeFileSync(P, newContent, "utf8");
  console.log("✅  Calculator section fully replaced with clean JSX");
  
} else {
  console.log("⚠️  Corruption pattern not found — checking for alternative...");
  // Check if already fixed
  if (!content.includes('hasCalculated')) {
    console.log("⚠️  hasCalculated not in file — patches may not have been applied");
  } else {
    console.log("ℹ️  File may already be partially fixed");
  }
}

// Step 4: Apply remaining missing pieces from patch-14
// ExitConfirmModal render
patch(P, "render ExitConfirmModal in LessonView",
  `  return (
    <main className="main-content" id="mainContent">
      <div className="lesson-container">`,
  `  return (
    <main className="main-content" id="mainContent">
      <ExitConfirmModal />
      <div className="lesson-container">`
);

// Exit ✕ button in lesson header
patch(P, "add ✕ exit button in lesson header next to progress bar",
  `        {/* Progress bar */}
          <div className="lesson-progress-bar">`,
  `        {/* Exit lesson button */}
          {goBack && (
            <button onClick={() => setShowExitConfirm(true)} aria-label="Exit lesson" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 18, fontWeight: 700, padding: "0 8px", lineHeight: 1, flexShrink: 0 }}>✕</button>
          )}
          {/* Progress bar */}
          <div className="lesson-progress-bar">`
);

console.log("\n✅  Recovery complete. Now run: npm run build");
