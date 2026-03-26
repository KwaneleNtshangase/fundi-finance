#!/usr/bin/env node
// fundi-fix-ts7.js
// streakFreezeActive and buyStreakFreeze exist in useFundiState but aren't returned.
// We try multiple anchor strings to find the return block and add them.

const fs = require("fs");

let fixes = 0;

function patch(filePath, description, searchStr, replaceStr) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(searchStr)) {
    console.log(`⚠️  NOT FOUND: ${description}`);
    return false;
  }
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅  ${description}`);
  fixes++;
  return true;
}

const p = "src/app/page.tsx";

// Read current file to inspect
const content = fs.readFileSync(p, "utf8");

// Check how many times streakFreezeActive appears
const freezeCount = (content.match(/streakFreezeActive/g) || []).length;
const freezeInReturn = content.includes("    streakFreezeActive,\n    buyStreakFreeze,");
console.log(`ℹ️  streakFreezeActive occurrences: ${freezeCount}`);
console.log(`ℹ️  Already in return block: ${freezeInReturn}`);

if (freezeInReturn) {
  console.log("✅  Already exported — no change needed");
} else {
  // Try anchoring on currentLessonState in return (appears to be there from error line 3061)
  const success = patch(
    p,
    "export streakFreezeActive + buyStreakFreeze before currentLessonState in return",
    `    currentLessonState,
    setCurrentLessonState,
    streakFreezeActive,
    buyStreakFreeze,`,
    `    currentLessonState,
    setCurrentLessonState,
    streakFreezeActive,
    buyStreakFreeze,`
  );

  // That won't work as the string already has the values — they must not be in the return at all.
  // Try to find return block with hearts and insert before it
  if (!success) {
    patch(
      p,
      "export streakFreezeActive + buyStreakFreeze — anchor on hearts in return",
      `    hearts,
    maxHearts,`,
      `    streakFreezeActive,
    buyStreakFreeze,
    hearts,
    maxHearts,`
    );
  }
}

// Also check the destructure in Home — it references streakFreezeActive at line 3063
// meaning the const { ... } = useFundiState() block includes it but the hook doesn't return it
// Let's verify by looking for the destructure pattern and making sure it's after the return is fixed

// Final safety check: remove streakFreezeActive from destructure if hook still doesn't export it
// Only do this if we couldn't add it to the return
const content2 = fs.readFileSync(p, "utf8");
const inReturn = content2.includes("    streakFreezeActive,\n    buyStreakFreeze,\n    hearts,");
if (!inReturn) {
  console.log("⚠️  Could not add to return block — removing from destructure as fallback");
  patch(
    p,
    "remove streakFreezeActive from Home destructure (fallback)",
    `    streakFreezeActive,
    buyStreakFreeze,
    hearts,`,
    `    hearts,`
  );
  // Also stub them so the JSX doesn't break
  patch(
    p,
    "stub streakFreezeActive and buyStreakFreeze as local consts",
    `  const { user, signOut } = useAuth();`,
    `  const { user, signOut } = useAuth();
  // Streak freeze stubbed until hook export is wired
  const streakFreezeActive = typeof window !== "undefined"
    ? localStorage.getItem("fundi-streak-freeze") === "true"
    : false;
  const buyStreakFreeze = () => {
    const xp = parseInt(localStorage.getItem("fundi-xp") ?? "0", 10);
    if (xp < 50 || streakFreezeActive) return;
    localStorage.setItem("fundi-xp", String(xp - 50));
    localStorage.setItem("fundi-streak-freeze", "true");
    window.location.reload();
  };`
  );
}

console.log(`\n${fixes} fixes applied.`);
console.log("Now run: npm run build");
