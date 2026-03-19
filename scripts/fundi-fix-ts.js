/**
 * fundi-fix-ts.js — Fix courseAccent/courseId missing from LessonView destructuring
 */
const fs = require("fs");
const path = require("path");

const PAGE = path.join(__dirname, "../src/app/page.tsx");
let src = fs.readFileSync(PAGE, "utf8");

// The exact destructuring as it exists in the file
const OLD = `function LessonView({
  lessonState,
  completeLessonFlow,
  nextStep,
  answerQuestion,
  answerTrueFalse,
  correctCount,
  hearts = 5,
  maxHearts = 5,
  heartsRegenInfo,
  goBack,
}: {`;

const NEW = `function LessonView({
  lessonState,
  completeLessonFlow,
  nextStep,
  answerQuestion,
  answerTrueFalse,
  correctCount,
  hearts = 5,
  maxHearts = 5,
  heartsRegenInfo,
  goBack,
  courseId,
  courseAccent,
}: {`;

if (!src.includes(OLD)) {
  console.error("❌ Marker not found — exact text mismatch");
  process.exit(1);
}

src = src.replace(OLD, NEW);
fs.writeFileSync(PAGE, src);
console.log("✅ courseId and courseAccent added to LessonView destructuring");
console.log("Now run: npm run build");
