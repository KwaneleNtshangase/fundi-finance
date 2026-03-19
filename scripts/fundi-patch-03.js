/**
 * fundi-patch-03.js — Fix the entire lesson progression system
 *
 * ROOT CAUSES (confirmed by reading all source files):
 *
 * 1. goToLesson in Home bails on `found.comingSoon` — so clicking any lesson
 *    with comingSoon:true does NOTHING, even if it has real steps and should
 *    be playable (e.g. Bible course "What Is Stewardship?" has steps but also
 *    has comingSoon on neighbouring lessons, causing confusion).
 *
 * 2. CourseView unlock logic was driven by the static `comingSoon` flag in
 *    content.ts, NOT by live progress. Completing a lesson never changed
 *    comingSoon, so nothing ever unlocked.
 *
 * 3. "Coming soon" (no steps written) was conflated with "locked by progress".
 *    The fix separates them cleanly:
 *      - NO STEPS  → truly coming soon (content not written yet)
 *      - HAS STEPS → governed by progress rules only
 *
 * 4. book-open icon missing from CourseIcon switch (used by Bible course).
 *
 * PROGRESSION RULES after fix:
 *   completed   = isLessonCompleted() is true
 *   playable    = has steps AND (first in unit OR previous lesson completed)
 *   locked      = has steps BUT prerequisite not yet done
 *   coming_soon = no steps at all
 *
 * Run from project root:
 *   node scripts/fundi-patch-03.js
 * Then: npm run build
 */

const fs = require("fs");
const path = require("path");

const PAGE = path.join(__dirname, "../src/app/page.tsx");
let src = fs.readFileSync(PAGE, "utf8");

let changed = 0;
function replace(from, to, label) {
  if (!src.includes(from)) {
    console.warn("⚠️  NOT FOUND: " + label);
    return;
  }
  src = src.replace(from, to);
  changed++;
  console.log("✅  " + label);
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 — goToLesson: remove the comingSoon gate.
// Only reject when steps are genuinely absent.
// ─────────────────────────────────────────────────────────────────────────────

replace(
  "              if (!found || found.comingSoon || !found.steps) return;",
  "              // Only block if there are genuinely no steps (content not written yet)\n              if (!found || !found.steps || found.steps.length === 0) return;",
  "fix goToLesson — remove comingSoon gate"
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 — Add book-open to CourseIcon (used by Bible & Money course)
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `    case "brain":
      return <Brain {...props} />;
    default:`,
  `    case "brain":
      return <Brain {...props} />;
    case "book-open":
      return <BookOpen {...props} />;
    default:`,
  "add book-open icon to CourseIcon"
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3 — CourseView: full rewrite with progress-driven unlock logic
// ─────────────────────────────────────────────────────────────────────────────

// Find CourseView start and end by looking for the exact function signature
// we know is in the file, then replace the whole thing.

const COURSE_VIEW_START = `function CourseView({
  course,
  isLessonCompleted,
  goBack,
  goToLesson,
}: {
  course: Course;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goBack: () => void;
  goToLesson: (lessonId: string) => void;
}) {`;

const COURSE_VIEW_END_MARKER = `\nfunction LessonView({`;

const startIdx = src.indexOf(COURSE_VIEW_START);
if (startIdx === -1) {
  console.warn("⚠️  NOT FOUND: CourseView function start");
} else {
  const endIdx = src.indexOf(COURSE_VIEW_END_MARKER, startIdx);
  if (endIdx === -1) {
    console.warn("⚠️  NOT FOUND: CourseView function end marker");
  } else {
    const oldCourseView = src.slice(startIdx, endIdx);
    const newCourseView = `function CourseView({
  course,
  isLessonCompleted,
  goBack,
  goToLesson,
}: {
  course: Course;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goBack: () => void;
  goToLesson: (lessonId: string) => void;
}) {
  const [lockedModal, setLockedModal] = useState<{
    lessonTitle: string;
    reason: string;
  } | null>(null);

  // ── Progression logic ──────────────────────────────────────────────────────
  // A lesson state is determined by LIVE PROGRESS, not the static comingSoon flag.
  //   completed   → isLessonCompleted() is true
  //   playable    → has steps AND (first in unit OR prev lesson completed)
  //   locked      → has steps BUT prerequisite not yet done
  //   coming_soon → no steps array at all (content not written yet)
  type LessonState = "completed" | "playable" | "locked" | "coming_soon";

  function getLessonState(
    unitLessons: Course["units"][0]["lessons"],
    lessonIndex: number
  ): LessonState {
    const lesson = unitLessons[lessonIndex];
    const hasContent = Array.isArray(lesson.steps) && lesson.steps.length > 0;

    if (isLessonCompleted(course.id, lesson.id)) return "completed";
    if (!hasContent) return "coming_soon";
    if (lessonIndex === 0) return "playable"; // first in unit is always open
    const prevDone = isLessonCompleted(course.id, unitLessons[lessonIndex - 1].id);
    return prevDone ? "playable" : "locked";
  }

  return (
    <main className="main-content main-with-stats">
      <div className="course-map">
        <button className="back-button" onClick={goBack}>
          <span className="inline-flex items-center gap-2">
            <ArrowLeft size={20} className="text-current" />
            Back to Courses
          </span>
        </button>

        <div className="course-map-header">
          <div style={{ marginBottom: 16 }}>
            <CourseIcon name={course.icon} size={64} />
          </div>
          <h2 className="course-map-title">{course.title}</h2>
          <p className="course-map-description">{course.description}</p>
        </div>

        {course.units.map((unit) => (
          <div className="unit" key={unit.id}>
            <div className="unit-header">
              <div className="unit-title">{unit.title}</div>
              <div className="unit-description">{unit.description}</div>
            </div>

            <div className="lessons-path">
              {unit.lessons.map((lesson, lessonIndex) => {
                const state = getLessonState(unit.lessons, lessonIndex);

                let nodeClass = "lesson-node";
                let icon: ReactNode = (
                  <BookOpen size={28} className="text-current" />
                );

                if (state === "completed") {
                  nodeClass += " completed";
                  icon = <CheckCircle2 size={28} className="text-current" />;
                } else if (state === "locked" || state === "coming_soon") {
                  nodeClass += " coming-soon";
                  icon = <Lock size={28} className="text-current" />;
                }
                // "playable" keeps default (active) styling

                const handleClick = () => {
                  if (state === "coming_soon") {
                    setLockedModal({
                      lessonTitle: lesson.title,
                      reason: "This lesson is coming soon. Check back soon!",
                    });
                  } else if (state === "locked") {
                    const prev = unit.lessons[lessonIndex - 1];
                    setLockedModal({
                      lessonTitle: lesson.title,
                      reason:
                        'Complete "' +
                        prev.title +
                        '" first to unlock this lesson.',
                    });
                  } else {
                    // "completed" or "playable" — open the lesson
                    goToLesson(lesson.id);
                  }
                };

                return (
                  <div key={lesson.id}>
                    <div
                      className={nodeClass}
                      onClick={handleClick}
                      style={{
                        cursor:
                          state === "playable" || state === "completed"
                            ? "pointer"
                            : "default",
                      }}
                    >
                      {icon}
                    </div>
                    <div className="lesson-label">
                      {lesson.title}
                      {state === "coming_soon" && (
                        <span
                          style={{
                            display: "block",
                            fontSize: 10,
                            color: "var(--color-text-secondary)",
                            marginTop: 2,
                          }}
                        >
                          Coming soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Lock / coming-soon modal */}
        {lockedModal && (
          <div
            onClick={() => setLockedModal(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--color-surface)",
                borderRadius: 20,
                padding: "28px 24px",
                width: "100%",
                maxWidth: 340,
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <Lock
                  size={40}
                  style={{
                    color: "var(--color-text-secondary)",
                    margin: "0 auto",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                {lockedModal.lessonTitle}
              </div>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  marginBottom: 20,
                  lineHeight: 1.6,
                  fontSize: 14,
                }}
              >
                {lockedModal.reason}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setLockedModal(null)}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}`;

    src = src.slice(0, startIdx) + newCourseView + src.slice(endIdx);
    changed++;
    console.log("✅  CourseView rewritten with progress-driven unlock logic");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4 — LessonView: add a back button at the top so users can always escape
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  return (
    <main className="main-content main-with-stats">
      <div className="lesson-player">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div className="lesson-progress-bar" style={{ flex: 1, margin: 0 }}>
            <div className="lesson-progress-fill" style={{ width: \`\${progress}%\` }} />
          </div>`,
  `  return (
    <main className="main-content main-with-stats">
      <div className="lesson-player">
        {/* Back button + progress bar + hearts row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          {goBack && (
            <button
              onClick={goBack}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "4px 2px", color: "var(--color-text-secondary)",
                flexShrink: 0, display: "flex", alignItems: "center",
              }}
              aria-label="Back to course"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="lesson-progress-bar" style={{ flex: 1, margin: 0 }}>
            <div className="lesson-progress-fill" style={{ width: \`\${progress}%\` }} />
          </div>`,
  "add back button to LessonView progress bar row"
);

// ─────────────────────────────────────────────────────────────────────────────
// Write file
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(PAGE, src);
console.log("\n" + changed + " changes made to page.tsx.");
console.log("\nSummary of what was fixed:");
console.log("  1. goToLesson no longer gates on comingSoon — lessons with steps always open");
console.log("  2. book-open icon added to CourseIcon (Bible & Money course now shows correctly)");
console.log("  3. CourseView now uses LIVE PROGRESS to determine unlock state, not static data");
console.log("  4. LessonView has a back arrow — users can always escape a lesson");
console.log("\nNext: npm run build");
