/**
 * fundi-patch-04.js — Final system audit fixes
 *
 * BUGS FIXED (confirmed by full code trace):
 *
 * 1. LessonView goBack sends user to "learn" (home) instead of back to
 *    their course map — user loses their place every time they exit a lesson.
 *    Fix: pass courseId through and navigate back to { name: "course", courseId }
 *
 * 2. startLesson() in useFundiState still has the old comingSoon gate.
 *    It's dead code (never called from Home) but clean it up anyway.
 *
 * 3. No visual cue on "playable" lesson nodes — users can't tell which
 *    are clickable. Fix: add a pulse ring on playable (not completed) nodes.
 *
 * 4. Lesson completion screen: true-false last step shows no FundiCharacter.
 *    MCQ path has it, true-false path doesn't. Fix: add celebrating Fundi
 *    to the true-false completion block too.
 *
 * 5. Defensive console logging for lesson load/complete/unlock as requested.
 *
 * Run from project root:
 *   node scripts/fundi-patch-04.js
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
// FIX 1 — LessonView goBack: navigate back to course, not learn
// We pass courseId to LessonView so it can return to the right course map.
// ─────────────────────────────────────────────────────────────────────────────

// Step 1a: Add courseId prop to LessonView signature
replace(
  `  goBack?: () => void;
}) {
  const step = lessonState.steps[lessonState.stepIndex];`,
  `  goBack?: () => void;
  courseId?: string;
}) {
  const step = lessonState.steps[lessonState.stepIndex];`,
  "add courseId prop to LessonView signature"
);

// Step 1b: Pass courseId when rendering LessonView in Home
replace(
  `            goBack={() => setRoute({ name: "learn" })}
          />
        )}

        {route.name === "profile"`,
  `            goBack={() =>
              currentLessonState.courseId
                ? setRoute({ name: "course", courseId: currentLessonState.courseId })
                : setRoute({ name: "learn" })
            }
            courseId={currentLessonState.courseId ?? undefined}
          />
        )}

        {route.name === "profile"`,
  "LessonView goBack navigates to course map not home"
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 — startLesson dead code: remove comingSoon gate
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `    if (!found || found.comingSoon || !found.steps) return;
    setCurrentLessonState({
      courseId,
      lessonId,
      stepIndex: 0,
      steps: found.steps,`,
  `    if (!found || !found.steps || found.steps.length === 0) return;
    setCurrentLessonState({
      courseId,
      lessonId,
      stepIndex: 0,
      steps: found.steps,`,
  "fix startLesson comingSoon gate (dead code cleanup)"
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3 — Playable lesson nodes: add pulse ring so users know they're clickable
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `                if (state === "completed") {
                  nodeClass += " completed";
                  icon = <CheckCircle2 size={28} className="text-current" />;
                } else if (state === "locked" || state === "coming_soon") {
                  nodeClass += " coming-soon";
                  icon = <Lock size={28} className="text-current" />;
                }
                // "playable" keeps default (active) styling`,
  `                if (state === "completed") {
                  nodeClass += " completed";
                  icon = <CheckCircle2 size={28} className="text-current" />;
                } else if (state === "locked" || state === "coming_soon") {
                  nodeClass += " coming-soon";
                  icon = <Lock size={28} className="text-current" />;
                } else if (state === "playable") {
                  nodeClass += " playable";
                  // keep BookOpen icon, add pulse class via CSS
                }`,
  "mark playable lesson nodes with CSS class"
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4 — True-false completion screen: add FundiCharacter celebrating
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `                    <div
                      style={{
                        fontSize: 48,
                        marginBottom: 8,
                      }}
                    >
                      <Trophy
                        size={48}
                        className="text-[var(--color-accent)]"
                        style={{ margin: "0 auto" }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      Lesson Complete!
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                        marginBottom: 16,
                      }}
                    >
                      +{50 + correctCount * 10} XP earned
                    </div>
                    <button className="btn btn-primary" onClick={nextStep}>
                      Continue
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={nextStep}>
                    Continue
                  </button>
                )}
              </div>
            </>
          )}
        </>
      );
    }
    return null;`,
  `                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px", animation: "fundi-bounce 0.8s ease-in-out infinite" }} />
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      Lesson Complete!
                    </div>
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                        marginBottom: 16,
                      }}
                    >
                      +{50 + correctCount * 10} XP earned
                    </div>
                    <button className="btn btn-primary" onClick={nextStep}>
                      Continue
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={nextStep}>
                    Continue
                  </button>
                )}
              </div>
            </>
          )}
        </>
      );
    }
    return null;`,
  "add FundiCharacter celebrating to true-false completion screen"
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 5 — Console logging for lesson load, complete, unlock
// ─────────────────────────────────────────────────────────────────────────────

// Add logging when lesson is loaded
replace(
  `              setCurrentLessonState({
                courseId,
                lessonId,
                stepIndex: 0,
                steps: found.steps,
                answers: {},
                correctCount: 0,
              });
              setRoute({ name: "lesson", courseId, lessonId });`,
  `              console.log("[Fundi] Lesson loaded:", courseId + ":" + lessonId, "(" + found.steps.length + " steps)");
              setCurrentLessonState({
                courseId,
                lessonId,
                stepIndex: 0,
                steps: found.steps,
                answers: {},
                correctCount: 0,
              });
              setRoute({ name: "lesson", courseId, lessonId });`,
  "add lesson load log"
);

// Add logging when lesson completes
replace(
  `        completeLesson(
          currentLessonState.courseId,
          currentLessonState.lessonId,
          totalXP
        );
      }
      playSound("complete");`,
  `        console.log("[Fundi] Lesson complete:", currentLessonState.courseId + ":" + currentLessonState.lessonId, "+" + totalXP + "XP");
        completeLesson(
          currentLessonState.courseId,
          currentLessonState.lessonId,
          totalXP
        );
      }
      playSound("complete");`,
  "add lesson complete log"
);

// Add logging when unlock state is computed in CourseView
replace(
  `  function getLessonState(
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
  }`,
  `  function getLessonState(
    unitLessons: Course["units"][0]["lessons"],
    lessonIndex: number
  ): LessonState {
    const lesson = unitLessons[lessonIndex];
    const hasContent = Array.isArray(lesson.steps) && lesson.steps.length > 0;

    if (isLessonCompleted(course.id, lesson.id)) return "completed";
    if (!hasContent) return "coming_soon";
    if (lessonIndex === 0) return "playable";
    const prevDone = isLessonCompleted(course.id, unitLessons[lessonIndex - 1].id);
    const state = prevDone ? "playable" : "locked";
    if (prevDone) {
      console.log("[Fundi] Unlock:", course.id + ":" + lesson.id, "unlocked because", unitLessons[lessonIndex - 1].id, "is complete");
    }
    return state;
  }`,
  "add unlock trigger log"
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 6 — Add playable node CSS (pulse ring) to globals.css
// ─────────────────────────────────────────────────────────────────────────────

const CSS_FILE = path.join(__dirname, "../src/app/globals.css");
let css = fs.readFileSync(CSS_FILE, "utf8");

const PLAYABLE_CSS = `
/* ── Playable lesson node — pulse ring to show it's clickable ── */
.lesson-node.playable {
  position: relative;
  border: 2.5px solid var(--color-primary, #007A4D);
  animation: node-pulse 2s ease-in-out infinite;
}

@keyframes node-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 122, 77, 0.35); }
  50% { box-shadow: 0 0 0 8px rgba(0, 122, 77, 0); }
}
`;

if (!css.includes("lesson-node.playable")) {
  css += PLAYABLE_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log("✅  playable node pulse CSS added to globals.css");
} else {
  console.log("⏭   playable node CSS already present");
}

// ─────────────────────────────────────────────────────────────────────────────
// Write page.tsx
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(PAGE, src);
console.log("\n" + changed + " changes made to page.tsx.");
console.log("\nSummary:");
console.log("  1. LessonView goBack now returns to course map (not home screen)");
console.log("  2. startLesson dead code cleaned up");
console.log("  3. Playable lesson nodes have a green pulse ring");
console.log("  4. True-false completion shows FundiCharacter celebrating");
console.log("  5. Console logging: lesson load, completion, unlock triggers");
console.log("\nNext: npm run build");
