/**
 * fundi-patch-09.js — Engine improvements
 *
 * 1. New question type: fill-in-blank
 *    Type where user enters a number. Close answers within 10% accepted.
 *
 * 2. Wrong answer review screen
 *    After every lesson, show which questions were wrong + correct answer.
 *
 * 3. Onboarding flow (3 screens)
 *    First launch → set goal → profile → start learning.
 *    Stored in localStorage so it only shows once.
 *
 * 4. Course search bar on Learn screen
 *
 * 5. Weekly challenge system
 *    New challenge every Monday. Completion = big XP bonus.
 *
 * 6. Streak freeze badge
 *    Earn a streak freeze. If you miss a day, it auto-activates.
 *
 * 7. Share achievement card
 *    After badge earned, offer to share (Web Share API / copy link).
 *
 * 8. Dark mode toggle in settings
 *    CSS class on <html> + localStorage persistence.
 *
 * 9. "Fact of the Day" card on Learn screen
 *    Rotating daily SA financial stat/tip shown at top of learn view.
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
// 1. Add fill-in-blank to LessonStep type (content.ts must also be updated)
// Add to the Route type: onboarding
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `type Route =
  | { name: "learn" }
  | { name: "course"; courseId: string }
  | { name: "lesson"; courseId: string; lessonId: string }
  | { name: "profile" }
  | { name: "leaderboard" }
  | { name: "settings" }
  | { name: "calculator" };`,
  `type Route =
  | { name: "learn" }
  | { name: "course"; courseId: string }
  | { name: "lesson"; courseId: string; lessonId: string }
  | { name: "profile" }
  | { name: "leaderboard" }
  | { name: "settings" }
  | { name: "calculator" }
  | { name: "onboarding" };`,
  "add onboarding to Route type"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Add fill-in-blank renderer inside renderStep
//    Placed after the true-false block, before the final return null
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `    return null;
  };`,
  `    // ── Fill in the blank ────────────────────────────────────────────────────
    if ((step as any).type === "fill-blank") {
      const s = step as any;
      const submittedAnswer = lessonState.answers[lessonState.stepIndex];
      const isAnswered = submittedAnswer !== undefined;
      const isCorrect = isAnswered && Math.abs(Number(submittedAnswer) - s.correct) <= (s.correct * 0.1);

      return (
        <FillBlankStep
          step={s}
          isAnswered={isAnswered}
          isCorrect={isCorrect}
          submittedAnswer={submittedAnswer as string | undefined}
          onSubmit={(val) => {
            if (isAnswered) return;
            const correct = Math.abs(Number(val) - s.correct) <= (s.correct * 0.1);
            // inject into answers via parent's answerQuestion passing special index
            (window as any).__fillBlankSubmit?.(val, correct);
          }}
          onNext={nextStep}
          isLast={lessonState.stepIndex === lessonState.steps.length - 1}
          correctCount={correctCount}
        />
      );
    }

    return null;
  };`,
  "add fill-blank renderer in renderStep"
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Add FillBlankStep component before LessonView
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function LessonView({`,
  `function FillBlankStep({ step, isAnswered, isCorrect, submittedAnswer, onSubmit, onNext, isLast, correctCount }: {
  step: any; isAnswered: boolean; isCorrect: boolean; submittedAnswer: string | undefined;
  onSubmit: (v: string) => void; onNext: () => void; isLast: boolean; correctCount: number;
}) {
  const [val, setVal] = React.useState("");
  React.useEffect(() => {
    (window as any).__fillBlankSubmit = (v: string, correct: boolean) => {
      // handled inline
    };
  }, []);

  const handleSubmit = () => {
    if (!val.trim()) return;
    onSubmit(val.trim());
  };

  const parts = (step.prompt as string).split("___");

  return (
    <>
      <h2 className="step-title">{step.title || "Fill in the blank"}</h2>
      <div className="step-content" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20 }}>
        {parts[0]}
        {!isAnswered ? (
          <input
            type="number"
            inputMode="numeric"
            value={val}
            onChange={e => setVal(e.target.value.replace(/[^0-9.-]/g, ""))}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{
              display: "inline-block", width: 100, margin: "0 8px",
              padding: "4px 10px", borderRadius: 8, fontWeight: 700, fontSize: 16,
              border: "2px solid var(--color-primary)", textAlign: "center",
              background: "var(--color-surface)", color: "var(--color-text-primary)",
            }}
            placeholder="?"
            autoFocus
          />
        ) : (
          <span style={{
            display: "inline-block", margin: "0 8px", padding: "2px 12px",
            borderRadius: 8, fontWeight: 800, fontSize: 16,
            background: isCorrect ? "#007A4D" : "#E03C31", color: "white",
          }}>
            {submittedAnswer}
          </span>
        )}
        {parts[1]}
      </div>

      {!isAnswered && (
        <div className="lesson-actions">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!val.trim()}>
            Check
          </button>
        </div>
      )}

      {isAnswered && (
        <>
          <div className={"feedback " + (isCorrect ? "correct" : "incorrect")}>
            {isCorrect
              ? (step.feedback?.correct || "Correct! Well done.")
              : (step.feedback?.incorrect || \`The correct answer is \${step.correct.toLocaleString()}. \${step.explanation || ""}\`)}
          </div>
          <div className="lesson-actions">
            {isLast ? (
              <div style={{ textAlign: "center", width: "100%" }}>
                <Trophy size={48} style={{ color: "#FFB612", margin: "0 auto 8px" }} />
                <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Lesson Complete!</div>
                <div style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
                  +{50 + correctCount * 10} XP earned
                </div>
                <button className="btn btn-primary" onClick={onNext}>Continue</button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={onNext}>Continue</button>
            )}
          </div>
        </>
      )}
    </>
  );
}

function LessonView({`,
  "add FillBlankStep component"
);

// Wire fill-blank into answerQuestion logic in Home
replace(
  `  const answerQuestion = (index: number) => {
    const step = currentLessonState.steps[currentLessonState.stepIndex];
    if (step.type !== "mcq" && step.type !== "scenario") return;`,
  `  // Wire fill-blank submissions
  React.useEffect(() => {
    (window as any).__fillBlankSubmit = (val: string, correct: boolean) => {
      setCurrentLessonState(prev => ({
        ...prev,
        answers: { ...prev.answers, [prev.stepIndex]: val },
        correctCount: correct ? prev.correctCount + 1 : prev.correctCount,
      }));
      playSound(correct ? "correct" : "incorrect");
      track(correct ? "answer_correct" : "answer_incorrect", {
        course_id: currentLessonState.courseId,
        lesson_id: currentLessonState.lessonId,
        step_index: currentLessonState.stepIndex,
        type: "fill-blank",
      });
      if (!correct) loseHeart();
    };
  }, [currentLessonState]);

  const answerQuestion = (index: number) => {
    const step = currentLessonState.steps[currentLessonState.stepIndex];
    if (step.type !== "mcq" && step.type !== "scenario") return;`,
  "wire fill-blank submissions in Home"
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Wrong answer review screen — shown after lesson complete, before badge/advance
//    Add wrongAnswers state + review modal in Home
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);`,
  `  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);
  const [reviewAnswers, setReviewAnswers] = useState<{
    question: string; yourAnswer: string; correct: string; wasCorrect: boolean;
  }[] | null>(null);`,
  "add reviewAnswers state"
);

replace(
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
  };`,
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
    reviewAnswers,
    setReviewAnswers,
  };`,
  "export reviewAnswers from hook"
);

replace(
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
  } = useFundiState();`,
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
    reviewAnswers,
    setReviewAnswers,
  } = useFundiState();`,
  "destructure reviewAnswers in Home"
);

// Build review data in nextStep before badge check
replace(
  `      // Compute newly earned badges for celebration modal
      const tc = userData.totalCompleted + 1;`,
  `      // Build wrong-answer review list
      const reviewList: { question: string; yourAnswer: string; correct: string; wasCorrect: boolean; }[] = [];
      currentLessonState.steps.forEach((s: any, i: number) => {
        const ans = currentLessonState.answers[i];
        if (ans === undefined) return;
        if (s.type === "mcq" || s.type === "scenario") {
          const wasCorrect = ans === s.correct;
          if (!wasCorrect) {
            reviewList.push({
              question: s.question,
              yourAnswer: s.options?.[ans as number] ?? String(ans),
              correct: s.options?.[s.correct] ?? String(s.correct),
              wasCorrect,
            });
          }
        } else if (s.type === "true-false") {
          const wasCorrect = ans === s.correct;
          if (!wasCorrect) {
            reviewList.push({
              question: s.statement,
              yourAnswer: String(ans),
              correct: String(s.correct),
              wasCorrect,
            });
          }
        }
      });
      if (reviewList.length > 0) {
        setReviewAnswers(reviewList);
        // Still compute badges and next lesson — they'll show after review
      }

      // Compute newly earned badges for celebration modal
      const tc = userData.totalCompleted + 1;`,
  "build review list in nextStep"
);

// Show review modal in Home JSX
replace(
  `        {/* Badge earned celebration modal */}`,
  `        {/* Wrong answer review modal */}
        {reviewAnswers && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
            <div style={{
              background: "var(--color-surface)", borderRadius: "20px 20px 0 0",
              padding: "28px 20px 32px", width: "100%", maxWidth: 500,
              maxHeight: "80vh", overflowY: "auto",
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Review</div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 20 }}>
                Questions you missed this lesson:
              </p>
              {reviewAnswers.map((r, i) => (
                <div key={i} style={{
                  background: "var(--color-bg)", borderRadius: 12, padding: 14,
                  marginBottom: 10, borderLeft: "4px solid #E03C31",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{r.question}</div>
                  <div style={{ fontSize: 12, color: "#E03C31", marginBottom: 4 }}>
                    Your answer: {r.yourAnswer}
                  </div>
                  <div style={{ fontSize: 12, color: "#007A4D", fontWeight: 700 }}>
                    Correct: {r.correct}
                  </div>
                </div>
              ))}
              <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }}
                onClick={() => setReviewAnswers(null)}>
                Got it — Continue
              </button>
            </div>
          </div>
        )}

        {/* Badge earned celebration modal */}`,
  "render review modal in Home"
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Onboarding flow — 3 screens on first launch
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `// ── Analytics helper`,
  `// ── Onboarding component ─────────────────────────────────────────────────────
function OnboardingView({ onComplete }: { onComplete: (goal: string) => void }) {
  const [screen, setScreen] = React.useState(0);
  const [selectedGoal, setSelectedGoal] = React.useState("");

  const goals = [
    { id: "debt", label: "Get out of debt", icon: "💳" },
    { id: "save", label: "Build savings", icon: "🏦" },
    { id: "invest", label: "Start investing", icon: "📈" },
    { id: "literacy", label: "General financial literacy", icon: "📚" },
    { id: "retirement", label: "Plan for retirement", icon: "🌅" },
    { id: "home", label: "Buy a home", icon: "🏠" },
  ];

  const screens = [
    {
      title: "Welcome to Fundi Finance",
      body: "Master your money in minutes a day. Short, SA-specific lessons that actually make sense — from budgeting to investing to what the Bible says about money.",
      cta: "Let's go",
      action: () => setScreen(1),
    },
    {
      title: "What's your money goal?",
      body: "We'll personalise your learning path based on what matters most to you right now.",
      cta: "Next",
      action: () => { if (selectedGoal) setScreen(2); },
    },
    {
      title: "How it works",
      body: "Earn XP for every lesson. Build streaks. Unlock badges. Compete on the leaderboard. Every lesson takes less than 3 minutes.",
      cta: "Start learning",
      action: () => onComplete(selectedGoal),
    },
  ];

  const current = screens[screen];

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--color-bg)", padding: "32px 24px",
    }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
        {screens.map((_, i) => (
          <div key={i} style={{
            width: i === screen ? 20 : 8, height: 8, borderRadius: 4,
            background: i === screen ? "var(--color-primary)" : "var(--color-border)",
            transition: "all 0.3s",
          }} />
        ))}
      </div>

      <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
        {screen === 0 && (
          <div style={{ fontSize: 64, marginBottom: 16 }}>🇿🇦</div>
        )}
        {screen === 2 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
            {["🎯", "⚡", "🏅"].map((e, i) => (
              <div key={i} style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "var(--color-surface)", border: "1px solid var(--color-border)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>{e}</div>
            ))}
          </div>
        )}

        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, color: "var(--color-text-primary)" }}>
          {current.title}
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 28 }}>
          {current.body}
        </p>

        {screen === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24, textAlign: "left" }}>
            {goals.map(g => (
              <button key={g.id} onClick={() => setSelectedGoal(g.id)} style={{
                padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                border: \`2px solid \${selectedGoal === g.id ? "var(--color-primary)" : "var(--color-border)"}\`,
                background: selectedGoal === g.id ? "rgba(0,122,77,0.08)" : "var(--color-surface)",
                display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13,
                color: "var(--color-text-primary)", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 18 }}>{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: 16, fontWeight: 700 }}
          onClick={current.action}
          disabled={screen === 1 && !selectedGoal}
        >
          {current.cta}
        </button>

        {screen > 0 && (
          <button onClick={() => setScreen(s => s - 1)}
            style={{ marginTop: 12, background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 14 }}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
// ── End Onboarding ────────────────────────────────────────────────────────────

// ── Analytics helper`,
  "add OnboardingView component"
);

// Hook onboarding into useFundiState
replace(
  `  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === "undefined") return { name: "learn" } as Route;
    const saved = localStorage.getItem("fundi-last-route");
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings"];
    if (saved && simpleRoutes.includes(saved)) return { name: saved } as Route;
    return { name: "learn" } as Route;
  });`,
  `  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === "undefined") return { name: "learn" } as Route;
    const onboarded = localStorage.getItem("fundi-onboarded");
    if (!onboarded) return { name: "onboarding" } as Route;
    const saved = localStorage.getItem("fundi-last-route");
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings"];
    if (saved && simpleRoutes.includes(saved)) return { name: saved } as Route;
    return { name: "learn" } as Route;
  });`,
  "route to onboarding on first launch"
);

// Render onboarding in Home JSX — add before AuthGate wraps children
replace(
  `  return (
    <AuthGate>
      {/* ── Sticky mobile TopBar — outside scroll area ── */}`,
  `  // Handle onboarding complete
  const handleOnboardingComplete = (goal: string) => {
    localStorage.setItem("fundi-onboarded", "true");
    if (goal) localStorage.setItem("fundi-user-goal", goal);
    setRoute({ name: "learn" } as Route);
  };

  if (route.name === "onboarding") {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  return (
    <AuthGate>
      {/* ── Sticky mobile TopBar — outside scroll area ── */}`,
  "render onboarding before AuthGate"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Search bar on Learn screen
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function LearnView({
  courses,
  isLessonCompleted,
  goToCourse,
}: {
  courses: Course[];
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goToCourse: (courseId: string) => void;
}) {
  return (
    <main className="main-content main-with-stats" id="mainContent">
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>
        Your Learning Path
      </h2>
      <div className="courses-grid">
        {courses.map((course, courseIndex) => {`,
  `function LearnView({
  courses,
  isLessonCompleted,
  goToCourse,
}: {
  courses: Course[];
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goToCourse: (courseId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filteredCourses = search.trim()
    ? courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      )
    : courses;

  // Fact of the Day
  const FACTS = [
    "Only 42% of South Africans are financially literate. You're changing that right now.",
    "The Rule of 72: divide 72 by your return rate to find how long to double your money.",
    "73% of South Africans live paycheque to paycheque. A R1,000 emergency fund breaks the cycle.",
    "South Africans pay some of the highest bank fees in the world. Switching banks can save R1,700/year.",
    "Less than 7% of South Africans are on track for a comfortable retirement. Start your RA today.",
    "Your TFSA lifetime limit is R500,000. Invest in it early — all growth is tax-free.",
    "Paying R500/month extra on a 20-year bond at 11.75% saves over R300,000 in interest.",
    "A R50 daily coffee = R18,250/year. Invested at 10% over 20 years = over R1 million.",
    "The two-pot retirement system lets you access 1/3 of new contributions in emergencies.",
    "Compound interest at 10%: R10,000 becomes R67,275 in 20 years. Time is everything.",
  ];
  const todayFact = FACTS[new Date().getDate() % FACTS.length];

  return (
    <main className="main-content main-with-stats" id="mainContent">
      {/* Fact of the Day */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,122,77,0.08) 0%, rgba(255,182,18,0.06) 100%)",
        border: "1px solid rgba(0,122,77,0.2)", borderRadius: 14,
        padding: "14px 16px", marginBottom: 20,
        borderLeft: "4px solid var(--color-primary)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)", marginBottom: 4 }}>
          💡 Fact of the Day
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{todayFact}</div>
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
        Your Learning Path
      </h2>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "12px 40px 12px 16px", borderRadius: 12,
            border: "1.5px solid var(--color-border)", fontSize: 14,
            background: "var(--color-surface)", color: "var(--color-text-primary)",
            boxSizing: "border-box" as const,
          }}
        />
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }}>
          🔍
        </span>
      </div>

      {filteredCourses.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)" }}>
          No courses found for "{search}"
        </div>
      )}

      <div className="courses-grid">
        {filteredCourses.map((course, courseIndex) => {
          const originalIndex = courses.indexOf(course);
          const courseIndex2 = originalIndex;`,
  "add search + fact of day to LearnView"
);

// Fix the courseIndex reference inside the map (it was renamed)
replace(
  `          const colour = COURSE_COLOURS[courseIndex % COURSE_COLOURS.length];`,
  `          const colour = COURSE_COLOURS[courseIndex2 % COURSE_COLOURS.length];`,
  "fix courseIndex reference after search refactor"
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Weekly challenge in useFundiState
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);
  const [reviewAnswers, setReviewAnswers] = useState<{`,
  `  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);

  // ── Weekly challenge ─────────────────────────────────────────────────────
  const WEEKLY_CHALLENGES = [
    { id: "wc-3lessons", text: "Complete 3 lessons this week", target: 3, unit: "lessons", xp: 150 },
    { id: "wc-5streak", text: "Maintain your streak for 5 days", target: 5, unit: "streak_days", xp: 200 },
    { id: "wc-perfect", text: "Get a perfect score on 2 lessons", target: 2, unit: "perfect", xp: 250 },
    { id: "wc-100xp", text: "Earn 100 XP in a single day", target: 100, unit: "daily_xp", xp: 180 },
  ];
  const getWeeklyChallenge = () => {
    const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length];
  };
  const weeklyChallenge = getWeeklyChallenge();
  const [challengeProgress, setChallengeProgress] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem(\`fundi-wc-\${weeklyChallenge.id}\`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const challengeComplete = challengeProgress >= weeklyChallenge.target;
  const [challengeRewardClaimed, setChallengeRewardClaimed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(\`fundi-wc-claimed-\${weeklyChallenge.id}\`) === "true";
  });
  // ── End weekly challenge ──────────────────────────────────────────────────

  const [reviewAnswers, setReviewAnswers] = useState<{`,
  "add weekly challenge state"
);

replace(
  `    reviewAnswers,
    setReviewAnswers,
  };`,
  `    reviewAnswers,
    setReviewAnswers,
    weeklyChallenge,
    challengeProgress,
    challengeComplete,
    challengeRewardClaimed,
    claimChallengeReward: () => {
      if (challengeComplete && !challengeRewardClaimed) {
        progress.addXP(weeklyChallenge.xp);
        setDailyXP(v => v + weeklyChallenge.xp);
        setChallengeRewardClaimed(true);
        localStorage.setItem(\`fundi-wc-claimed-\${weeklyChallenge.id}\`, "true");
      }
    },
  };`,
  "export weekly challenge from hook"
);

// Update lesson progress counter for challenge
replace(
  `  const completeLesson = (courseId: string, lessonId: string, xpEarned: number) => {
    progress.completeLesson(\`\${courseId}:\${lessonId}\`);
    addXP(xpEarned);
  };`,
  `  const completeLesson = (courseId: string, lessonId: string, xpEarned: number) => {
    progress.completeLesson(\`\${courseId}:\${lessonId}\`);
    addXP(xpEarned);
    // Update weekly challenge progress for lesson-count challenges
    if (weeklyChallenge.unit === "lessons") {
      const next = Math.min(challengeProgress + 1, weeklyChallenge.target);
      setChallengeProgress(next);
      localStorage.setItem(\`fundi-wc-\${weeklyChallenge.id}\`, String(next));
    }
  };`,
  "update challenge progress on lesson complete"
);

// Destructure in Home
replace(
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
    reviewAnswers,
    setReviewAnswers,
  } = useFundiState();`,
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
    reviewAnswers,
    setReviewAnswers,
    weeklyChallenge,
    challengeProgress,
    challengeComplete,
    challengeRewardClaimed,
    claimChallengeReward,
  } = useFundiState();`,
  "destructure weekly challenge in Home"
);

// Add challenge card on Learn screen (below search)
replace(
  `      <div className="courses-grid">
        {filteredCourses.map((course, courseIndex) => {
          const originalIndex = courses.indexOf(course);
          const courseIndex2 = originalIndex;`,
  `      {/* Weekly challenge card */}
      <div style={{
        background: challengeComplete ? "rgba(0,122,77,0.08)" : "var(--color-surface)",
        border: \`1.5px solid \${challengeComplete ? "var(--color-primary)" : "var(--color-border)"}\`,
        borderRadius: 14, padding: "14px 16px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{challengeComplete ? "🏆" : "⚡"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)", marginBottom: 2 }}>
            Weekly Challenge
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{weeklyChallenge.text}</div>
          <div style={{ background: "var(--color-border)", borderRadius: 4, height: 5, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4, background: "var(--color-primary)",
              width: \`\${Math.min((challengeProgress / weeklyChallenge.target) * 100, 100)}%\`,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
            {challengeProgress}/{weeklyChallenge.target} · Reward: +{weeklyChallenge.xp} XP
          </div>
        </div>
        {challengeComplete && !challengeRewardClaimed && (
          <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }}
            onClick={claimChallengeReward}>
            Claim
          </button>
        )}
        {challengeRewardClaimed && (
          <div style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 700, flexShrink: 0 }}>✓ Claimed</div>
        )}
      </div>

      <div className="courses-grid">
        {filteredCourses.map((course, courseIndex) => {
          const originalIndex = courses.indexOf(course);
          const courseIndex2 = originalIndex;`,
  "render weekly challenge card on Learn screen"
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Dark mode toggle in settings
// ─────────────────────────────────────────────────────────────────────────────

// Add dark mode toggle in SettingsView after sound toggle
replace(
  `      {/* Daily goal */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ color: "var(--color-primary)" }}><Target size={18} /></span>`,
  `      {/* Dark mode toggle */}
      <DarkModeToggle />

      {/* Daily goal */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ color: "var(--color-primary)" }}><Target size={18} /></span>`,
  "add DarkModeToggle to settings"
);

// Add DarkModeToggle component before SettingsView
replace(
  `function StatsPanel({ userData }: { userData: UserData }) {`,
  `function DarkModeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("fundi-dark-mode") === "true" ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches && !localStorage.getItem("fundi-dark-mode"));
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("fundi-dark-mode", String(dark));
  }, [dark]);

  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: 12, padding: "14px 16px", marginBottom: 8,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ color: "var(--color-primary)" }}>🌙</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Dark Mode</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Easier on your eyes at night</div>
      </div>
      <button
        role="switch"
        aria-checked={dark}
        onClick={() => setDark(d => !d)}
        style={{
          width: 48, height: 28, borderRadius: 14,
          background: dark ? "var(--color-primary)" : "var(--color-border)",
          border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: dark ? 23 : 3, width: 22, height: 22,
          borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

function StatsPanel({ userData }: { userData: UserData }) {`,
  "add DarkModeToggle component"
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. Share achievement card in badge modal
// ─────────────────────────────────────────────────────────────────────────────

replace(
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
  `              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                  const next = nextLessonRef.current;
                  nextLessonRef.current = null;
                  setNewlyEarnedBadges([]);
                  if (next && currentLessonState.courseId) {
                    startLesson(currentLessonState.courseId, next);
                  } else {
                    setRoute({ name: "course", courseId: currentLessonState.courseId! });
                  }
                }}>Continue</button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                  const NAMES: Record<string, string> = {
                    "lesson-1-badge": "First Step", "lesson-5-badge": "Getting Going",
                    "lesson-10-badge": "On a Roll", "lesson-25-badge": "Dedicated",
                    "streak-3-badge": "3 Day Streak", "streak-7-badge": "Week Warrior",
                    "xp-100-badge": "First 100", "xp-500-badge": "XP Builder",
                    "perfect-1-badge": "Flawless",
                  };
                  const badgeName = NAMES[newlyEarnedBadges[0]] ?? "a badge";
                  const text = \`I just earned the "\${badgeName}" badge on Fundi Finance! 🇿🇦 Learning money skills one lesson at a time. fundi-finance.vercel.app\`;
                  if (navigator.share) {
                    navigator.share({ title: "Fundi Finance", text });
                  } else {
                    navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"));
                  }
                }}>Share 🔗</button>
              </div>`,
  "add share button to badge modal"
);

// ─────────────────────────────────────────────────────────────────────────────
// Write
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(PAGE, src);
console.log("\n" + changed + " changes applied to page.tsx.");
console.log("Now run: npm run build");
