#!/usr/bin/env node
// fundi-fix-ts9.js
// Fix: consumeStreakFreeze still references removed setStreakFreezeActive
// Also: stub streakFreezeActive + buyStreakFreeze in Home (anchor was not found last time)

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

// Fix 1: Remove consumeStreakFreeze which references the now-deleted setStreakFreezeActive
patch(
  p,
  "remove orphaned consumeStreakFreeze from useFundiState",
  `  const consumeStreakFreeze = () => {
    setStreakFreezeActive(false);
    localStorage.removeItem("fundi-streak-freeze");
  };`,
  `  // consumeStreakFreeze removed — handled via localStorage directly`
);

// Fix 2: Stub streakFreezeActive and buyStreakFreeze in Home
// Try multiple possible anchors for the Home component body
const content = fs.readFileSync(p, "utf8");

// Find useAuth call as anchor
const anchors = [
  `  const { user, signOut } = useAuth();`,
  `  const { user } = useAuth();`,
  `  const {user, signOut} = useAuth();`,
];

let stubbed = false;
for (const anchor of anchors) {
  if (content.includes(anchor) && !content.includes("streakFreezeActive: boolean")) {
    const success = patch(
      p,
      `stub streakFreezeActive + buyStreakFreeze in Home (anchor: ${anchor.trim().slice(0, 40)})`,
      anchor,
      `${anchor}
  // Streak freeze — stored in localStorage, managed locally
  const streakFreezeActive: boolean =
    typeof window !== "undefined" && localStorage.getItem("fundi-streak-freeze") === "true";
  const buyStreakFreeze = () => {
    if (typeof window === "undefined" || streakFreezeActive) return;
    const currentXP = parseInt(localStorage.getItem("fundi-xp") ?? "0", 10);
    if (currentXP < 50) return;
    localStorage.setItem("fundi-xp", String(currentXP - 50));
    localStorage.setItem("fundi-streak-freeze", "true");
    window.location.reload();
  };`
    );
    if (success) { stubbed = true; break; }
  }
}

if (!stubbed) {
  // If already stubbed or anchor not found, check if it already exists
  const c = fs.readFileSync(p, "utf8");
  if (c.includes("streakFreezeActive: boolean")) {
    console.log("✅  streakFreezeActive stub already present in Home");
  } else {
    console.log("⚠️  Could not find anchor for Home stub — will try function Home pattern");
    patch(
      p,
      "stub streakFreezeActive + buyStreakFreeze after function Home declaration",
      `function Home() {`,
      `function Home() {
  // Streak freeze — stored in localStorage, managed locally
  const streakFreezeActive: boolean =
    typeof window !== "undefined" && localStorage.getItem("fundi-streak-freeze") === "true";
  const buyStreakFreeze = () => {
    if (typeof window === "undefined" || streakFreezeActive) return;
    const currentXP = parseInt(localStorage.getItem("fundi-xp") ?? "0", 10);
    if (currentXP < 50) return;
    localStorage.setItem("fundi-xp", String(currentXP - 50));
    localStorage.setItem("fundi-streak-freeze", "true");
    window.location.reload();
  };`
    );
  }
}

// Fix 3: Also remove the comment placeholder left by fix-ts8 if it's causing issues
patch(
  p,
  "clean up streakFreezeActive comment placeholder in hook",
  `  // Streak freeze is handled as a local const in Home (see below useFundiState call)`,
  ``
);

console.log(`\n${fixes} fixes applied.`);
console.log("Now run: npm run build");
