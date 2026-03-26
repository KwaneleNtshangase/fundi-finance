#!/usr/bin/env node
// fundi-fix-ts12.js — surgical fix for broken calculator JSX
// Reads the actual file content around the error and fixes precisely

const fs = require("fs");

const P = "src/app/page.tsx";
let content = fs.readFileSync(P, "utf8");
let fixes = 0;

// The error at line 947 shows:
// 945: </table>
// 946: </div>
// 947: )} ← this }) is closing a conditional that was INSIDE JSX without a return expression
// 
// The real file shows line 51 has {hasCalculated && ( ← this is the CalculatorView's JSX
// meaning the whole calculator results section is corrupted.
//
// Strategy: find ALL broken fragments and replace the ENTIRE calculator output section
// with one clean version.

// Find the Calculate button (added by patch-14) — this is our start anchor
// Find the CTA card (unchanged) — this is our end anchor

const startAnchor = `      {/* Calculate button */}`;
const endAnchor = `      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-primary)",
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
          marginBottom: 32,
        }}
      >`;

if (!content.includes(startAnchor)) {
  console.log("⚠️  Calculate button anchor not found — trying alternative");
  // Try to find the CTA card and work backwards
}

if (!content.includes(endAnchor)) {
  console.log("⚠️  CTA anchor not found — aborting, need manual fix");
  process.exit(1);
}

// Find start and end positions
const startIdx = content.indexOf(startAnchor);
const endIdx = content.indexOf(endAnchor);

if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
  console.log(`⚠️  Anchors out of order: start=${startIdx}, end=${endIdx}`);
  process.exit(1);
}

console.log(`ℹ️  Replacing calculator results section (chars ${startIdx}–${endIdx})`);

// The clean replacement — everything between the button and the CTA card
const cleanSection = `      {/* Calculate button */}
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
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Growth Over Time</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="year" tickFormatter={(v) => \`Yr \${v}\`} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
              <YAxis tickFormatter={(v) => \`R\${(v / 1000).toFixed(0)}k\`} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} width={50} />
              <Tooltip formatter={(v: number) => formatZAR(v)} labelFormatter={(l) => \`Year \${l}\`} contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              {mode === "single" ? (
                <>
                  <Line type="monotone" dataKey="Portfolio Value" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Total Contributions" stroke="var(--color-secondary, #FFB612)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="Investment A" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Investment B" stroke="var(--color-secondary, #FFB612)" strokeWidth={2.5} dot={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

`;

// Perform the replacement
const newContent = content.slice(0, startIdx) + cleanSection + content.slice(endIdx);
fs.writeFileSync(P, newContent, "utf8");
console.log("✅  Replaced entire calculator results section with clean JSX");
fixes++;

console.log(`\n${fixes} fixes applied.`);
console.log("Now run: npm run build");
