#!/usr/bin/env node
// fundi-fix-ts4.js
// Fixes TS error from patch-12: goal buttons still use string setState
// Error: Argument of type 'string' is not assignable to 'SetStateAction<string[]>'
// Line 176: onClick={() => setSelectedGoal(g.id)}
// Line 178: selectedGoal === g.id (x2)

const fs = require("fs");
const path = require("path");

let fixes = 0;

function patch(filePath, description, searchStr, replaceStr) {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, "utf8");
  if (!content.includes(searchStr)) {
    console.log(`⚠️  NOT FOUND: ${description}`);
    return;
  }
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`✅  ${description}`);
  fixes++;
}

const p = "src/app/page.tsx";

// Fix 1: onClick still sets string, needs to toggle array
patch(
  p,
  "fix goal button onClick to toggle array",
  `onClick={() => setSelectedGoal(g.id)}`,
  `onClick={() => setSelectedGoal(prev =>
                prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id]
              )}`
);

// Fix 2: border condition still checks string equality
patch(
  p,
  "fix goal button border to check array includes",
  `border: \`2px solid \${selectedGoal === g.id ? "var(--color-primary)" : "var(--color-border)"}\`,`,
  `border: \`2px solid \${selectedGoal.includes(g.id) ? "var(--color-primary)" : "var(--color-border)"}\`,`
);

// Fix 3: background condition still checks string equality
patch(
  p,
  "fix goal button background to check array includes",
  `background: selectedGoal === g.id ? "rgba(0,122,77,0.08)" : "var(--color-surface)",`,
  `background: selectedGoal.includes(g.id) ? "rgba(0,122,77,0.08)" : "var(--color-surface)",`
);

// Fix 4: Continue button disabled check — was !selectedGoal (string), now needs array length
patch(
  p,
  "fix Continue button disabled to use array length",
  `disabled={!selectedGoal}`,
  `disabled={selectedGoal.length === 0}`
);

// Fix 5: onComplete call — join array to string for storage
// Only patch if not already joined (patch-12 may have done this)
const content = fs.readFileSync(p, "utf8");
if (content.includes("onComplete(selectedGoal)") && !content.includes("onComplete(selectedGoal.join")) {
  patch(
    p,
    "fix onComplete to join selected goals array",
    `onComplete(selectedGoal)`,
    `onComplete(selectedGoal.join(", "))`
  );
}

console.log(`\n${fixes} fixes applied.`);
console.log("Now run: npm run build");
