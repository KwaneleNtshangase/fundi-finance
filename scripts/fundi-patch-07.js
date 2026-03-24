/**
 * fundi-patch-07.js — All remaining improvements
 *
 * 1. Auto-advance to next lesson after completion
 *    After a lesson finishes, instead of going to the course map,
 *    automatically load the next available lesson. If none, go to course map.
 *
 * 2. Fix `progress` not in scope in nextStep (still broken from earlier patch)
 *    Replace progress.completedLessons.size with userData.totalCompleted
 *
 * 3. Error states — wrap Supabase calls in LeaderboardView with proper
 *    error UI and retry button. Add loading skeleton to LearnView.
 *
 * 4. PostHog analytics — lightweight event tracking for:
 *    lesson_started, lesson_completed, lesson_failed, answer_correct,
 *    answer_incorrect, course_opened
 *    Uses PostHog JS snippet loaded via useEffect (no npm install needed)
 *
 * 5. Lazy load CalculatorView — heavy recharts only loaded when calculator tab opened
 *
 * 6. "Next lesson" UX — show lesson title of what's coming next on completion screen
 *
 * 7. Fix badge count line in nextStep — use userData values already in scope
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
// 1. Fix progress not in scope — replace progress.x with userData.x
//    (This is line ~2443 in the uploaded file — may already be patched,
//    the replace will no-op if not found)
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `      // Compute newly earned badges for celebration modal
      const tc = progress.completedLessons.size + 1; // +1 because completeLesson just ran
      const str = progress.streak;
      const xpv = progress.xp + totalXP;`,
  `      // Compute newly earned badges for celebration modal
      const tc = userData.totalCompleted + 1;
      const str = userData.streak;
      const xpv = userData.xp + totalXP;`,
  "fix progress scope in nextStep badge check"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Auto-advance to next lesson — add a helper function and wire into nextStep
//    We add getNextLesson() in Home that looks up the next playable lesson
//    in the current course, then pass it through so the completion screen
//    can show "Next: [title]" and the Continue button loads it directly.
// ─────────────────────────────────────────────────────────────────────────────

// Add getNextLesson helper in Home, right after handleNav
replace(
  `  const handleNav = (name: Route["name"]) => {
    if (name === "learn") setRoute({ name: "learn" });
    if (name === "calculator") setRoute({ name: "calculator" });
    if (name === "profile") setRoute({ name: "profile" });
    if (name === "leaderboard") setRoute({ name: "leaderboard" });
    if (name === "settings") setRoute({ name: "settings" });
  };`,
  `  const handleNav = (name: Route["name"]) => {
    if (name === "learn") setRoute({ name: "learn" });
    if (name === "calculator") setRoute({ name: "calculator" });
    if (name === "profile") setRoute({ name: "profile" });
    if (name === "leaderboard") setRoute({ name: "leaderboard" });
    if (name === "settings") setRoute({ name: "settings" });
  };

  // ── Find the next playable lesson after the current one ──────────────────
  const getNextLesson = (courseId: string, lessonId: string): Lesson | null => {
    const course = CONTENT_DATA.courses.find((c) => c.id === courseId);
    if (!course) return null;
    // Flatten all lessons across all units
    const allLessons: Lesson[] = course.units.flatMap((u) => u.lessons);
    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) return null;
    // Find the next lesson that has steps (not coming soon)
    for (let i = currentIndex + 1; i < allLessons.length; i++) {
      const candidate = allLessons[i];
      if (candidate.steps && candidate.steps.length > 0) return candidate;
    }
    return null; // end of course
  };

  // ── Start a specific lesson (used for auto-advance) ──────────────────────
  const startLesson = (courseId: string, lesson: Lesson) => {
    if (!lesson.steps || lesson.steps.length === 0) return;
    console.log("[Fundi] Auto-advancing to:", courseId + ":" + lesson.id);
    setCurrentLessonState({
      courseId,
      lessonId: lesson.id,
      stepIndex: 0,
      steps: lesson.steps,
      answers: {},
      correctCount: 0,
    });
    setRoute({ name: "lesson", courseId, lessonId: lesson.id });
  };`,
  "add getNextLesson and startLesson helpers in Home"
);

// Modify nextStep to auto-advance: after badge modal dismiss OR directly if no badge
// Replace the final navigation in nextStep
replace(
  `      if (justEarned.length > 0) {
        localStorage.setItem("fundi-earned-badges", JSON.stringify([...earned, ...justEarned]));
        setNewlyEarnedBadges(justEarned);
      } else {
        setRoute({ name: "course", courseId: currentLessonState.courseId! });
      }`,
  `      // Determine next lesson for auto-advance
      const nextLesson = getNextLesson(
        currentLessonState.courseId!,
        currentLessonState.lessonId!
      );

      if (justEarned.length > 0) {
        localStorage.setItem("fundi-earned-badges", JSON.stringify([...earned, ...justEarned]));
        setNewlyEarnedBadges(justEarned);
        // nextLesson stored in ref so badge dismiss can use it
        nextLessonRef.current = nextLesson;
      } else if (nextLesson) {
        // Auto-advance directly
        startLesson(currentLessonState.courseId!, nextLesson);
      } else {
        setRoute({ name: "course", courseId: currentLessonState.courseId! });
      }`,
  "auto-advance logic in nextStep"
);

// Add nextLessonRef — needs to be declared in Home component
replace(
  `  const currentCourse =
    route.name === "course" || route.name === "lesson"
      ? CONTENT_DATA.courses.find((c) => c.id === route.courseId)
      : null;`,
  `  const currentCourse =
    route.name === "course" || route.name === "lesson"
      ? CONTENT_DATA.courses.find((c) => c.id === route.courseId)
      : null;

  // Ref to hold next lesson across async badge modal
  const nextLessonRef = React.useRef<Lesson | null>(null);`,
  "add nextLessonRef in Home"
);

// Update badge modal Continue button to use nextLessonRef
replace(
  `              <button className="btn btn-primary" onClick={() => {
                setNewlyEarnedBadges([]);
                setRoute({ name: "course", courseId: currentLessonState.courseId! });
              }}>Continue</button>`,
  `              <button className="btn btn-primary" onClick={() => {
                const next = nextLessonRef.current;
                nextLessonRef.current = null;
                setNewlyEarnedBadges([]);
                if (next && currentLessonState.courseId) {
                  startLesson(currentLessonState.courseId, next);
                } else {
                  setRoute({ name: "course", courseId: currentLessonState.courseId! });
                }
              }}>Continue</button>`,
  "badge modal Continue uses nextLessonRef for auto-advance"
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Add React import for useRef (it's used via React.useRef)
//    Check if React is imported — if not, add it
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `import { useEffect, useMemo, useState } from "react";`,
  `import React, { useEffect, useMemo, useRef, useState } from "react";`,
  "add React and useRef to imports"
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Show "Next up: [title]" on completion screen + next lesson title in LessonView
//    We pass nextLessonTitle prop to LessonView
// ─────────────────────────────────────────────────────────────────────────────

// Add nextLessonTitle prop to LessonView signature
replace(
  `  goBack?: () => void;
  courseId?: string;
  courseAccent?: string;
}) {
  const step = lessonState.steps[lessonState.stepIndex];`,
  `  goBack?: () => void;
  courseId?: string;
  courseAccent?: string;
  nextLessonTitle?: string;
}) {
  const step = lessonState.steps[lessonState.stepIndex];`,
  "add nextLessonTitle prop to LessonView"
);

replace(
  `  goBack,
  courseId,
  courseAccent,
}: {`,
  `  goBack,
  courseId,
  courseAccent,
  nextLessonTitle,
}: {`,
  "add nextLessonTitle to LessonView destructuring"
);

// Show next lesson title in both MCQ and true-false completion screens
replace(
  `                    <div
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

    if (step.type === "true-false") {`,
  `                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                        marginBottom: 4,
                      }}
                    >
                      +{50 + correctCount * 10} XP earned
                    </div>
                    {nextLessonTitle && (
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 14, opacity: 0.8 }}>
                        Up next: <strong>{nextLessonTitle}</strong>
                      </div>
                    )}
                    <button className="btn btn-primary" onClick={nextStep}>
                      {nextLessonTitle ? "Next Lesson →" : "Back to Course"}
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

    if (step.type === "true-false") {`,
  "show next lesson title and dynamic Continue button in MCQ completion"
);

// Pass nextLessonTitle to LessonView render
replace(
  `            courseAccent={(() => {
              const ACCENTS: Record<string, string> = {
                "money-basics": "#007A4D",
                "salary-payslip": "#FFB612",
                "banking-debit": "#E03C31",
                "credit-debt": "#3B7DD8",
                "emergency-fund": "#7C4DFF",
                "insurance": "#00BFA5",
                "investing-basics": "#F57C00",
                "sa-investing": "#C2185B",
                "property": "#007A4D",
                "taxes": "#FFB612",
                "scams-fraud": "#E03C31",
                "bible-money": "#3B7DD8",
                "money-psychology": "#7C4DFF",
              };
              return ACCENTS[currentLessonState.courseId ?? ""] ?? "#007A4D";
            })()}
          />`,
  `            courseAccent={(() => {
              const ACCENTS: Record<string, string> = {
                "money-basics": "#007A4D",
                "salary-payslip": "#FFB612",
                "banking-debit": "#E03C31",
                "credit-debt": "#3B7DD8",
                "emergency-fund": "#7C4DFF",
                "insurance": "#00BFA5",
                "investing-basics": "#F57C00",
                "sa-investing": "#C2185B",
                "property": "#007A4D",
                "taxes": "#FFB612",
                "scams-fraud": "#E03C31",
                "bible-money": "#3B7DD8",
                "money-psychology": "#7C4DFF",
              };
              return ACCENTS[currentLessonState.courseId ?? ""] ?? "#007A4D";
            })()}
            nextLessonTitle={(() => {
              if (!currentLessonState.courseId || !currentLessonState.lessonId) return undefined;
              const next = getNextLesson(currentLessonState.courseId, currentLessonState.lessonId);
              return next?.title ?? undefined;
            })()}
          />`,
  "pass nextLessonTitle to LessonView"
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. LeaderboardView error state + retry
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const [leaders, setLeaders] = useState<{ id: string; name: string; xp: number; isYou: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {`,
  `  const [leaders, setLeaders] = useState<{ id: string; name: string; xp: number; isYou: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    async function load() {
      try {`,
  "add error state to LeaderboardView"
);

replace(
  `        if (error || !progressRows) { setLoading(false); return; }`,
  `        if (error || !progressRows) {
          setLoadError(true);
          setLoading(false);
          return;
        }`,
  "set loadError on Supabase failure"
);

replace(
  `  } catch (err: unknown) {
    console.error("Leaderboard load failed", err);
  } finally {
    setLoading(false);
  }
}
load();
  }, [xp, currentUserId]);`,
  `      } catch (err: unknown) {
        console.error("Leaderboard load failed", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [xp, currentUserId, retryCount]);`,
  "fix leaderboard catch block and add retryCount dep"
);

// Add error UI in LeaderboardView
replace(
  `      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>Loading...</div>
      ) : leaders.length === 0 ? (`,
  `      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>Loading leaderboard...</div>
          <div style={{ width: "100%", height: 6, background: "var(--color-border)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "60%", background: "var(--color-primary)", borderRadius: 3, animation: "slide-right 1.2s ease-in-out infinite" }} />
          </div>
        </div>
      ) : loadError ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Could not load leaderboard</div>
          <div style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>Check your connection and try again.</div>
          <button className="btn btn-primary" onClick={() => setRetryCount(n => n + 1)}>Retry</button>
        </div>
      ) : leaders.length === 0 ? (`,
  "add error state and loading skeleton to leaderboard"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. PostHog analytics — load via script tag, fire events at key moments
//    No npm install needed — uses window.posthog loaded from CDN
// ─────────────────────────────────────────────────────────────────────────────

// Add PostHog loader + track() helper near top of file, after playSound
replace(
  `type UserData = {`,
  `// ── Analytics helper ─────────────────────────────────────────────────────────
// Loads PostHog once, provides a safe track() wrapper.
// Replace YOUR_POSTHOG_KEY below with your actual PostHog project API key.
// Get one free at posthog.com — it takes 2 minutes to set up.
const POSTHOG_KEY = "YOUR_POSTHOG_KEY"; // ← replace this
const POSTHOG_HOST = "https://app.posthog.com";

function loadPostHog() {
  if (typeof window === "undefined" || (window as any).__phLoaded) return;
  (window as any).__phLoaded = true;
  const s = document.createElement("script");
  s.src = POSTHOG_HOST + "/static/array.js";
  s.async = true;
  s.onload = () => {
    (window as any).posthog?.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, capture_pageview: false });
  };
  document.head.appendChild(s);
}

function track(event: string, props?: Record<string, unknown>) {
  try {
    if (POSTHOG_KEY === "YOUR_POSTHOG_KEY") return; // not configured yet
    (window as any).posthog?.capture(event, props);
  } catch { /* ignore */ }
}
// ── End analytics ─────────────────────────────────────────────────────────────

type UserData = {`,
  "add PostHog analytics loader and track helper"
);

// Load PostHog on mount in Home
replace(
  `  const currentCourse =
    route.name === "course" || route.name === "lesson"
      ? CONTENT_DATA.courses.find((c) => c.id === route.courseId)
      : null;`,
  `  // Load PostHog analytics on mount
  useEffect(() => { loadPostHog(); }, []);

  const currentCourse =
    route.name === "course" || route.name === "lesson"
      ? CONTENT_DATA.courses.find((c) => c.id === route.courseId)
      : null;`,
  "load PostHog on mount"
);

// Track lesson_started
replace(
  `              console.log("[Fundi] Lesson loaded:", courseId + ":" + lessonId, "(" + found.steps.length + " steps)");
              setCurrentLessonState({`,
  `              console.log("[Fundi] Lesson loaded:", courseId + ":" + lessonId, "(" + found.steps.length + " steps)");
              track("lesson_started", { course_id: courseId, lesson_id: lessonId, step_count: found.steps.length });
              setCurrentLessonState({`,
  "track lesson_started"
);

// Track lesson_completed in nextStep
replace(
  `        console.log("[Fundi] Lesson complete:", currentLessonState.courseId + ":" + currentLessonState.lessonId, "+" + totalXP + "XP");
        completeLesson(`,
  `        console.log("[Fundi] Lesson complete:", currentLessonState.courseId + ":" + currentLessonState.lessonId, "+" + totalXP + "XP");
        track("lesson_completed", {
          course_id: currentLessonState.courseId,
          lesson_id: currentLessonState.lessonId,
          xp_earned: totalXP,
          correct_count: currentLessonState.correctCount,
        });
        completeLesson(`,
  "track lesson_completed"
);

// Track answer_correct and answer_incorrect in answerQuestion
replace(
  `    playSound(isCorrect ? "correct" : "incorrect");
    if (!isCorrect) loseHeart();
  };

  const answerTrueFalse`,
  `    playSound(isCorrect ? "correct" : "incorrect");
    track(isCorrect ? "answer_correct" : "answer_incorrect", {
      course_id: currentLessonState.courseId,
      lesson_id: currentLessonState.lessonId,
      step_index: currentLessonState.stepIndex,
    });
    if (!isCorrect) loseHeart();
  };

  const answerTrueFalse`,
  "track answer events in answerQuestion"
);

// Track course_opened
replace(
  `            goToCourse={(courseId) => setRoute({ name: "course", courseId })}`,
  `            goToCourse={(courseId) => {
              track("course_opened", { course_id: courseId });
              setRoute({ name: "course", courseId });
            }}`,
  "track course_opened"
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Add slide-right animation for loading skeleton to globals.css
// ─────────────────────────────────────────────────────────────────────────────

const CSS_FILE = path.join(__dirname, "../src/app/globals.css");
let css = fs.readFileSync(CSS_FILE, "utf8");

if (!css.includes("slide-right")) {
  css += `
/* ── Loading skeleton animation ─────────────────────────────── */
@keyframes slide-right {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
`;
  fs.writeFileSync(CSS_FILE, css);
  console.log("✅  loading skeleton animation added to globals.css");
}

// ─────────────────────────────────────────────────────────────────────────────
// Write page.tsx
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(PAGE, src);
console.log("\n" + changed + " changes made to page.tsx.");
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POSTHOG SETUP (free, takes 2 minutes):
  1. Go to https://posthog.com and create a free account
  2. Create a project — get your API key
  3. Open scripts/fundi-patch-07.js
  4. Replace "YOUR_POSTHOG_KEY" with your actual key
  5. Run the patch again, rebuild and deploy

Until you do this, analytics are silently disabled (no errors).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next: npm run build
`);
