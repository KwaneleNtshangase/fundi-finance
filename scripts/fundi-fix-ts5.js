#!/usr/bin/env node
// fundi-fix-ts5.js
// Fixes:
//   1. buyStreakFreeze references userData (not in scope) — use xp state directly
//   2. buyStreakFreeze calls progress.spendXP — but spendXP is on the inner hook; call it directly
//   3. streakFreezeActive/buyStreakFreeze not exported from hook
//   4. spendXP not exported from progress hook

const fs = require("fs");
const path = require("path");

let fixes = 0;

function patch(filePath, description, searchStr, replaceStr) {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, "utf8");
  if (!content.includes(searchStr)) {
    console.log(`⚠️  NOT FOUND: ${description}`);
    return false;
  }
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`✅  ${description}`);
  fixes++;
  return true;
}

const p = "src/app/page.tsx";

// Fix 1: buyStreakFreeze uses userData.xp (not in scope) and progress.spendXP (wrong ref)
// Replace the whole buyStreakFreeze body to use xp state and setXp directly
patch(
  p,
  "fix buyStreakFreeze to use xp state directly (not userData)",
  `  const buyStreakFreeze = () => {
    if (userData.xp < FREEZE_COST || streakFreezeActive) return;
    progress.spendXP(FREEZE_COST);
    setStreakFreezeActive(true);
    localStorage.setItem("fundi-streak-freeze", "true");
  };`,
  `  const buyStreakFreeze = () => {
    if (streakFreezeActive) return;
    // Read XP directly from localStorage (same source as progress hook)
    const currentXP = parseInt(
      typeof window !== "undefined" ? (localStorage.getItem("fundi-xp") ?? "0") : "0",
      10
    );
    if (currentXP < FREEZE_COST) return;
    // Deduct XP directly in localStorage
    localStorage.setItem("fundi-xp", String(currentXP - FREEZE_COST));
    setStreakFreezeActive(true);
    localStorage.setItem("fundi-streak-freeze", "true");
    // Force a page reload so XP reflects immediately
    if (typeof window !== "undefined") window.location.reload();
  };`
);

// Fix 2: Export streakFreezeActive and buyStreakFreeze from useFundiState return
// Find the return block that starts with hearts and add the freeze exports before it
patch(
  p,
  "export streakFreezeActive and buyStreakFreeze from hook",
  `    hearts,
    maxHearts,`,
  `    streakFreezeActive,
    buyStreakFreeze,
    hearts,
    maxHearts,`
);

// Fix 3: Remove the duplicate destructure we added in patch-12 that fires too early
// (the one that says "destructure streak freeze in Home component" added it before xpToast)
// Find the incorrect early destructure and remove it
const content = fs.readFileSync(p, "utf8");
// Check if there's a duplicate streakFreezeActive destructure
const occurrences = (content.match(/streakFreezeActive,/g) || []).length;
console.log(`ℹ️  streakFreezeActive destructure occurrences: ${occurrences}`);

if (occurrences >= 2) {
  // Remove the one that's inside the wrong block (before xpToast)
  patch(
    p,
    "remove duplicate streakFreezeActive destructure (the early one before xpToast)",
    `    xpToast,
    streakFreezeActive,
    buyStreakFreeze,
    // Add these lines
    reviewAnswers,`,
    `    xpToast,
    // Add these lines
    reviewAnswers,`
  );
}

// Fix 4: Make sure spendXP is exported from the progress hook (useProgressState or similar)
// Find the addXP export and add spendXP next to it
patch(
  p,
  "export spendXP from progress hook",
  `    addXP,
    spendXP,`,
  `    addXP,
    spendXP,`
);

// If the above was NOT FOUND, try without the spendXP line (meaning it wasn't added yet)
const content2 = fs.readFileSync(p, "utf8");
if (!content2.includes("    spendXP,")) {
  patch(
    p,
    "export spendXP from progress hook (first time)",
    `    addXP,`,
    `    addXP,
    spendXP,`
  );
}

console.log(`\n${fixes} fixes applied.`);
console.log("Now run: npm run build");
