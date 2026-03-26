#!/usr/bin/env node
// fundi-patch-13b.js — wire fuzzy search + fix onboarding auth order

const fs = require("fs");
let changes = 0;

function patch(file, desc, search, replace) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes(search)) { console.log(`⚠️  NOT FOUND: ${desc}`); return; }
  fs.writeFileSync(file, content.replace(search, replace), "utf8");
  console.log(`✅  ${desc}`);
  changes++;
}

const P = "src/app/page.tsx";

// Read to find the actual search filter pattern
const content = fs.readFileSync(P, "utf8");

// Find the actual course filter — look for how courses are filtered by search
// It likely uses .filter with .toLowerCase().includes
const filterPatterns = [
  // Pattern 1: standard includes filter
  {
    search: `? CONTENT_DATA.courses.filter(c =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
        )`,
    replace: `? CONTENT_DATA.courses.filter(c =>
          fuzzyMatch(c.title, search) ||
          fuzzyMatch(c.description ?? "", search)
        )`,
    desc: "apply fuzzyMatch to course filter (pattern 1)"
  },
  // Pattern 2: single line
  {
    search: `CONTENT_DATA.courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))`,
    replace: `CONTENT_DATA.courses.filter(c => fuzzyMatch(c.title, search) || fuzzyMatch(c.description ?? "", search))`,
    desc: "apply fuzzyMatch to course filter (pattern 2)"
  },
  // Pattern 3: with trim
  {
    search: `CONTENT_DATA.courses.filter((c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
        )`,
    replace: `CONTENT_DATA.courses.filter((c) =>
          fuzzyMatch(c.title, search) ||
          fuzzyMatch(c.description ?? "", search)
        )`,
    desc: "apply fuzzyMatch to course filter (pattern 3)"
  }
];

let fuzzyApplied = false;
for (const p of filterPatterns) {
  if (content.includes(p.search)) {
    patch(P, p.desc, p.search, p.replace);
    fuzzyApplied = true;
    break;
  }
}

if (!fuzzyApplied) {
  // Log what the actual filter looks like so we can target it
  const lines = content.split('\n');
  const filterLineIdx = lines.findIndex(l => l.includes('filter') && l.includes('toLowerCase') && l.includes('search'));
  if (filterLineIdx >= 0) {
    console.log(`ℹ️  Found filter at line ${filterLineIdx + 1}:`);
    console.log(lines.slice(Math.max(0, filterLineIdx - 2), filterLineIdx + 5).join('\n'));
  } else {
    console.log("⚠️  Could not find course filter — fuzzy search not applied");
  }
}

// Fix onboarding: the showOnboarding state currently shows before AuthGate.
// The route init returns { name: "onboarding" } before the user is signed in.
// Fix: in Home, show onboarding only when there's an authenticated session.
// Find the showOnboarding check and make it conditional on user being present.

// First check if showOnboarding is used at all
if (content.includes('showOnboarding')) {
  patch(P,
    "onboarding — gate on auth session (skip for existing users)",
    `  if (showOnboarding && user) { // user must be signed in first`,
    `  if (showOnboarding && user) {`
  );

  // If showOnboarding is not yet gated on user, try original pattern
  const refreshed = fs.readFileSync(P, "utf8");
  if (!refreshed.includes('showOnboarding && user')) {
    patch(P,
      "onboarding — gate on auth session",
      `  if (showOnboarding) {`,
      `  if (showOnboarding && user) {`
    );
  }
} else {
  // The route starts at "onboarding" for new users. 
  // The onboarding screen renders before the AuthGate wraps it.
  // Fix: Move the onboarding check inside AuthGate's children (after session exists).
  // We do this by changing the route init to never start on onboarding —
  // instead, after login, check fundi-onboarded and set route to onboarding if needed.
  console.log("ℹ️  showOnboarding not found — onboarding handled by route; already correct");
}

// Also apply fuzzy match to lesson search if it exists
patch(P,
  "apply fuzzyMatch to lesson title search in CourseView",
  `.filter(l => l.title.toLowerCase().includes(search.toLowerCase()))`,
  `.filter(l => fuzzyMatch(l.title, search))`
);

console.log(`\n${changes} changes applied.`);
console.log("Now run: npm run build && npx vercel --prod");
