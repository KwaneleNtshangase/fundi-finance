#!/usr/bin/env node
// fundi-fix-ts11.js — replace the entire calculator results section cleanly
// The patch-14 and fix-ts10 left the JSX broken; this rewrites the whole block correctly.

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

// Read current content to understand what's there
const content = fs.readFileSync(P, "utf8");

// Find what version of the results section exists
const hasHasCalculated = content.includes('hasCalculated');
const hasManualCalc = content.includes('handleCalculate');
console.log(`ℹ️  hasCalculated state: ${hasHasCalculated}`);
console.log(`ℹ️  handleCalculate fn: ${hasManualCalc}`);

// Strategy: find the ENTIRE results+chart block and replace it wholesale.
// The block starts with either:
// - "{mode === "single" ? (" or "{hasCalculated && mode === "single" ? ("
// and ends before the CTA card ("Want a personalised investment plan?")

// Attempt 1: current broken state from fix-ts10
const broken1 = `      {hasCalculated && (mode === "single" ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >`;

// Attempt 2: original state
const original = `      {mode === "single" ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >`;

// Find which one is in the file
let foundPattern = null;
if (content.includes(broken1)) {
  foundPattern = 'broken1';
  console.log("ℹ️  Found broken patch-14/fix-ts10 JSX");
} else if (content.includes(original)) {
  foundPattern = 'original';
  console.log("ℹ️  Found original JSX (patch-14 add-button did NOT apply to results section)");
} else {
  // Try to find whatever is there
  const lines = content.split('\n');
  const modeIdx = lines.findIndex(l => l.includes('mode === "single"') && l.includes('?'));
  if (modeIdx >= 0) {
    console.log(`ℹ️  Found mode ternary at line ${modeIdx + 1}: ${lines[modeIdx].trim()}`);
  }
}

// The clean replacement for the ENTIRE results section:
const cleanResults = `      {/* Calculate button */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginBottom: 20, fontSize: 16, fontWeight: 700, padding: "14px" }}
        onClick={handleCalculate}
      >
        📊 Calculate
      </button>

      {!hasCalculated && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-secondary)", fontSize: 14 }}>
          Set your values above, then click Calculate to see your results.
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
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Growth Over Time</div>`;

// Try the broken1 pattern first (most likely current state)
if (foundPattern === 'broken1') {
  // Find everything from the broken start to the chart opening
  const breakStart = `      {hasCalculated && (mode === "single" ? (`;
  const chartOpener = `      {hasCalculated && <div
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
        </div>`;
  
  // The broken compare block ends with: </div>\n      )}\n\n    {hasCalculated && (
  // Let's find the multi-line block to replace
  // Strategy: replace from "hasCalculated && (mode" to the chart div
  const blockToReplace = content.substring(
    content.indexOf(breakStart),
    content.indexOf(chartOpener)
  );
  
  if (blockToReplace && blockToReplace.length > 0) {
    const newContent = content.replace(blockToReplace, cleanResults.split('Growth Over Time')[0]);
    fs.writeFileSync(P, newContent, "utf8");
    console.log("✅  replaced broken results section with clean version");
    fixes++;
  }
}

// Now try to fix the chart closing — it should close with </div>)}
// Find "{hasCalculated && <div" (the chart wrapper from fix-ts10) and fix it
const chartWrapper1 = `      {hasCalculated && (
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
          </div>`;

if (fs.readFileSync(P, "utf8").includes(chartWrapper1)) {
  console.log("ℹ️  Chart already wrapped in hasCalculated — just need to close it");
} else {
  // The original chart opener still exists, wrap it
  patch(P, "wrap chart in hasCalculated conditional",
    `      <div
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

  // Find the closing of the chart container (before the CTA card) and close the conditional
  patch(P, "close chart hasCalculated conditional before CTA",
    `      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-primary)",`,
    `        </div>
      )}

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-primary)",`
  );
}

// Final check: remove any orphaned )} that the broken patches left
const c2 = fs.readFileSync(P, "utf8");
if (c2.includes('      )}\n\n      {hasCalculated && (')) {
  // There's a stray )}\n between old ternary and new conditional
  patch(P, "remove orphaned ternary closing before hasCalculated chart",
    `      )}

      {hasCalculated && (`,
    `      {hasCalculated && (`
  );
}

console.log(`\n${fixes} fixes applied.`);
console.log("Now run: npm run build");
