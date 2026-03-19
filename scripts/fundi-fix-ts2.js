/**
 * fundi-fix-ts2.js — Fix: progress not in scope inside nextStep (Home component)
 * Use userData instead, which IS in scope in Home.
 */
const fs = require("fs");
const path = require("path");

const PAGE = path.join(__dirname, "../src/app/page.tsx");
let src = fs.readFileSync(PAGE, "utf8");

const OLD = `      // Compute newly earned badges for celebration modal
      const tc = progress.completedLessons.size + 1; // +1 because completeLesson just ran
      const str = progress.streak;
      const xpv = progress.xp + totalXP;`;

const NEW = `      // Compute newly earned badges for celebration modal
      const tc = userData.totalCompleted + 1; // +1 because completeLesson just ran
      const str = userData.streak;
      const xpv = userData.xp + totalXP;`;

if (!src.includes(OLD)) {
  console.error("❌ Marker not found");
  process.exit(1);
}

src = src.replace(OLD, NEW);
fs.writeFileSync(PAGE, src);
console.log("✅ Fixed: replaced progress.x with userData.x in nextStep badge check");
console.log("Now run: npm run build");
