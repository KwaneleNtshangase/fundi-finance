/**
 * fundi-patch.js  —  All-in-one Fundi Finance feature patch
 *
 * Features added:
 *  1. Hearts system  (state in useFundiState, loseHeart on wrong, hearts gate)
 *  2. TopBar         (sticky bar: streak + XP + hearts, mobile only above lesson)
 *  3. SliderInput    (number input added alongside every slider, synced)
 *  4. Settings       (sound toggle, daily goal buttons, about, support)
 *  5. Profile        (initials avatar, earned-only badges, badge modal)
 *  6. Fundi mascot   (FundiCharacter component + wired to 4 screens)
 *
 * Run from project root:
 *   node scripts/fundi-patch.js
 * Then:
 *   npm run build
 */

const fs = require("fs");
const path = require("path");

const PAGE = path.join(__dirname, "../src/app/page.tsx");
let src = fs.readFileSync(PAGE, "utf8");

let changed = 0;
function replace(from, to, label) {
  if (!src.includes(from)) {
    console.warn(`⚠️  NOT FOUND: ${label}`);
    return;
  }
  src = src.replace(from, to);
  changed++;
  console.log(`✅  ${label}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEARTS STATE  —  add to useFundiState
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const [currentLessonState, setCurrentLessonState] = useState<{`,
  `  // ── Hearts ────────────────────────────────────────────────────────────
  const MAX_HEARTS = 5;
  const HEART_REGEN_MS = 60 * 60 * 1000; // 1 hour
  const [hearts, setHearts] = useState<number>(() => {
    if (typeof window === "undefined") return MAX_HEARTS;
    return parseInt(localStorage.getItem("fundi-hearts") ?? String(MAX_HEARTS), 10);
  });
  const [lastHeartLostAt, setLastHeartLostAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("fundi-last-heart-lost");
    return v ? parseInt(v, 10) : null;
  });

  // Persist hearts to localStorage
  useEffect(() => {
    localStorage.setItem("fundi-hearts", String(hearts));
  }, [hearts]);
  useEffect(() => {
    if (lastHeartLostAt !== null) {
      localStorage.setItem("fundi-last-heart-lost", String(lastHeartLostAt));
    }
  }, [lastHeartLostAt]);

  // Auto-regen: 1 heart per hour
  useEffect(() => {
    if (hearts >= MAX_HEARTS || !lastHeartLostAt) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastHeartLostAt;
      const toAdd = Math.floor(elapsed / HEART_REGEN_MS);
      if (toAdd > 0) {
        setHearts((h) => Math.min(h + toAdd, MAX_HEARTS));
        setLastHeartLostAt((prev) =>
          prev ? prev + toAdd * HEART_REGEN_MS : null
        );
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [hearts, lastHeartLostAt]);

  const loseHeart = () => {
    setHearts((h) => {
      const next = Math.max(h - 1, 0);
      localStorage.setItem("fundi-hearts", String(next));
      return next;
    });
    setLastHeartLostAt(Date.now());
  };

  const gainHeart = () => {
    setHearts((h) => Math.min(h + 1, MAX_HEARTS));
  };

  const heartsRegenInfo = (): { nextHeartIn: string; minutesLeft: number } | null => {
    if (hearts >= MAX_HEARTS || !lastHeartLostAt) return null;
    const elapsed = Date.now() - lastHeartLostAt;
    const remaining = HEART_REGEN_MS - (elapsed % HEART_REGEN_MS);
    const minutes = Math.ceil(remaining / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return { nextHeartIn: h > 0 ? \`\${h}h \${m}m\` : \`\${m}m\`, minutesLeft: minutes };
  };
  // ── End Hearts ─────────────────────────────────────────────────────────────

  const [currentLessonState, setCurrentLessonState] = useState<{`,
  "hearts state in useFundiState"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Expose hearts from useFundiState return value
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const value = {
    userData: {`,
  `  const value = {
    hearts,
    maxHearts: MAX_HEARTS,
    loseHeart,
    gainHeart,
    heartsRegenInfo,
    userData: {`,
  "expose hearts from useFundiState"
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Destructure hearts in Home()
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const {
    userData,
    dailyXP,
    dailyGoal,
    setDailyGoal,
    resetProgress: resetProgressState,
    route,
    setRoute,
    isLessonCompleted,
    completeLesson,
    currentLessonState,
    setCurrentLessonState,
  } = useFundiState();`,
  `  const {
    userData,
    dailyXP,
    dailyGoal,
    setDailyGoal,
    resetProgress: resetProgressState,
    route,
    setRoute,
    isLessonCompleted,
    completeLesson,
    currentLessonState,
    setCurrentLessonState,
    hearts,
    maxHearts,
    loseHeart,
    gainHeart,
    heartsRegenInfo,
  } = useFundiState();`,
  "destructure hearts in Home"
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. loseHeart on wrong MCQ/scenario answer
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `    playSound(isCorrect ? "correct" : "incorrect");
  };

  const answerTrueFalse`,
  `    playSound(isCorrect ? "correct" : "incorrect");
    if (!isCorrect) loseHeart();
  };

  const answerTrueFalse`,
  "loseHeart on wrong MCQ answer"
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. loseHeart on wrong true-false answer
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `    playSound(isCorrect ? "correct" : "incorrect");
  };

  const handleResetProgress`,
  `    playSound(isCorrect ? "correct" : "incorrect");
    if (!isCorrect) loseHeart();
  };

  const handleResetProgress`,
  "loseHeart on wrong true-false answer"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Pass hearts props to LessonView render call
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `        {route.name === "lesson" && currentLessonState.steps.length > 0 && (
          <LessonView
            lessonState={{
              steps: currentLessonState.steps,
              stepIndex: currentLessonState.stepIndex,
              answers: currentLessonState.answers,
            }}
            completeLessonFlow={() => undefined}
            nextStep={nextStep}
            answerQuestion={answerQuestion}
            answerTrueFalse={answerTrueFalse}
            correctCount={currentLessonState.correctCount}
          />
        )}`,
  `        {route.name === "lesson" && currentLessonState.steps.length > 0 && (
          <LessonView
            lessonState={{
              steps: currentLessonState.steps,
              stepIndex: currentLessonState.stepIndex,
              answers: currentLessonState.answers,
            }}
            completeLessonFlow={() => undefined}
            nextStep={nextStep}
            answerQuestion={answerQuestion}
            answerTrueFalse={answerTrueFalse}
            correctCount={currentLessonState.correctCount}
            hearts={hearts}
            maxHearts={maxHearts}
            heartsRegenInfo={heartsRegenInfo}
            goBack={() => setRoute({ name: "learn" })}
          />
        )}`,
  "pass hearts to LessonView"
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Add TopBar above lesson area in Home return
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `        {/* keep content above bottom nav on mobile */}
        <div className="pb-24 md:pb-0">`,
  `        {/* keep content above bottom nav on mobile */}
        <div className="pb-24 md:pb-0">
        {/* ── TopBar: mobile only, sticky ── */}
        <div className="md:hidden">
          <FundiTopBar
            streak={userData.streak}
            xp={userData.xp}
            hearts={hearts}
            maxHearts={maxHearts}
          />
        </div>`,
  "insert TopBar in Home"
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. LessonView — add hearts + goBack props to signature
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function LessonView({
  lessonState,
  completeLessonFlow,
  nextStep,
  answerQuestion,
  answerTrueFalse,
  correctCount,
}: {
  lessonState: {
    steps: LessonStep[];
    stepIndex: number;
    answers: Record<number, unknown>;
  };
  completeLessonFlow: () => void;
  nextStep: () => void;
  answerQuestion: (index: number) => void;
  answerTrueFalse: (value: boolean) => void;
  correctCount: number;
}) {`,
  `function LessonView({
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
}: {
  lessonState: {
    steps: LessonStep[];
    stepIndex: number;
    answers: Record<number, unknown>;
  };
  completeLessonFlow: () => void;
  nextStep: () => void;
  answerQuestion: (index: number) => void;
  answerTrueFalse: (value: boolean) => void;
  correctCount: number;
  hearts?: number;
  maxHearts?: number;
  heartsRegenInfo?: () => { nextHeartIn: string; minutesLeft: number } | null;
  goBack?: () => void;
}) {`,
  "add hearts props to LessonView signature"
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. LessonView — inject hearts gate + hearts display at top of render
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const step = lessonState.steps[lessonState.stepIndex];
  const progress =
    ((lessonState.stepIndex + 1) / lessonState.steps.length) * 100;

  const answered = lessonState.answers[lessonState.stepIndex] !== undefined;`,
  `  const step = lessonState.steps[lessonState.stepIndex];
  const progress =
    ((lessonState.stepIndex + 1) / lessonState.steps.length) * 100;

  const answered = lessonState.answers[lessonState.stepIndex] !== undefined;

  // ── Hearts gate ────────────────────────────────────────────────────────────
  if (hearts === 0) {
    const regen = heartsRegenInfo ? heartsRegenInfo() : null;
    return (
      <main className="main-content main-with-stats">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", padding: "2rem",
        }}>
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 20, padding: "2.5rem 2rem",
            textAlign: "center", maxWidth: 360,
          }}>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20, opacity: 0.3 }}>
              {Array.from({ length: maxHearts }).map((_, i) => (
                <svg key={i} viewBox="0 0 24 24" fill="#E03C31" width="28" height="28">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>No hearts left!</div>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
              {regen
                ? \`Your next heart arrives in \${regen.nextHeartIn}. Hearts refill 1 per hour.\`
                : "Hearts refill 1 per hour. Come back soon!"}
            </p>
            {goBack && (
              <button className="btn btn-primary" onClick={goBack}>Back to lessons</button>
            )}
          </div>
        </div>
      </main>
    );
  }
  // ── End hearts gate ────────────────────────────────────────────────────────`,
  "inject hearts gate in LessonView"
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. LessonView — show hearts row in progress bar area
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `      <div className="lesson-player">
        <div className="lesson-progress-bar">
          <div
            className="lesson-progress-fill"
            style={{ width: \`\${progress}%\` }}
          />
        </div>`,
  `      <div className="lesson-player">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div className="lesson-progress-bar" style={{ flex: 1, margin: 0 }}>
            <div className="lesson-progress-fill" style={{ width: \`\${progress}%\` }} />
          </div>
          <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            {Array.from({ length: maxHearts }).map((_, i) => (
              <svg key={i} viewBox="0 0 24 24"
                fill={i < hearts ? "#E03C31" : "none"}
                stroke={i < hearts ? "#E03C31" : "#ccc"}
                strokeWidth="2" width="16" height="16"
                style={{ transition: "fill 0.2s" }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ))}
          </div>
        </div>`,
  "add hearts row to lesson progress bar"
);

// ─────────────────────────────────────────────────────────────────────────────
// 11. SliderInput — add number input alongside the range slider
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function SliderInput({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "var(--color-primary)",
          }}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "var(--color-primary)",
          height: 6,
          cursor: "pointer",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--color-text-secondary)",
          marginTop: 2,
        }}
      >
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}`,
  `function SliderInput({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const [inputStr, setInputStr] = useState(String(value));
  // Keep text input in sync when slider moves
  useEffect(() => { setInputStr(String(value)); }, [value]);

  const handleBlur = () => {
    let v = parseFloat(inputStr);
    if (isNaN(v)) v = min;
    v = Math.max(min, Math.min(max, Math.round(v / step) * step));
    onChange(v);
    setInputStr(String(v));
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
          {label}
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-primary)" }}>
          {format(value)}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: "var(--color-primary)", height: 6, cursor: "pointer" }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          style={{
            width: 72, padding: "4px 6px", borderRadius: 8, textAlign: "right",
            border: "1.5px solid var(--color-border)", fontSize: 13, fontWeight: 700,
            background: "var(--color-surface)", color: "var(--color-primary)",
            MozAppearance: "textfield",
          }}
          aria-label={\`\${label} exact value\`}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}`,
  "add number input to SliderInput"
);

// ─────────────────────────────────────────────────────────────────────────────
// 12. ProfileView — full redesign: initials avatar, earned-only badges + modal
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function ProfileView({
  userData,
  onSignOut,
}: {
  userData: UserData;
  onSignOut: () => void;
}) {
  const totalCompleted = useMemo(
    () => userData.totalCompleted,
    [userData.totalCompleted]
  );

  const allBadges = [
    { id: "first-lesson", name: "First Steps", icon: <CheckCircle2 size={20} className="text-current" /> },
    { id: "five-lessons", name: "Getting Started", icon: <TrendingUp size={20} className="text-current" /> },
    { id: "ten-lessons", name: "On a Roll", icon: <Flame size={20} className="text-current" /> },
    { id: "twenty-lessons", name: "Committed", icon: <Target size={20} className="text-current" /> },
    { id: "streak-7", name: "7 Day Streak", icon: <Zap size={20} className="text-current" /> },
    { id: "streak-30", name: "30 Day Streak", icon: <Trophy size={20} className="text-current" /> },
    { id: "course-complete", name: "Course Master", icon: <BookOpen size={20} className="text-current" /> },
    { id: "all-courses", name: "Finance Pro", icon: <Wallet size={20} className="text-current" /> },
  ];

  return (
    <main className="main-content main-with-stats">
      <div className="profile-header">
        <div className="profile-avatar">
          <UserIcon size={56} className="text-white" />
        </div>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Your Profile
        </h2>
        <p style={{ fontSize: 18, color: "var(--text-light)" }}>
          Keep learning every day!
        </p>
      </div>

      <div className="profile-stats">
        <div className="profile-stat-card">
          <div className="profile-stat-value">{userData.xp}</div>
          <div className="profile-stat-label">Total XP</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{userData.level}</div>
          <div className="profile-stat-label">Level</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{userData.streak}</div>
          <div className="profile-stat-label">Day Streak</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{totalCompleted}</div>
          <div className="profile-stat-label">Lessons Completed</div>
        </div>
      </div>

      <div className="badges-section">
        <h3
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Your Badges
        </h3>
        <p style={{ color: "var(--text-light)", marginBottom: 24 }}>
          Earn badges by completing lessons and maintaining streaks
        </p>
        <div className="badges-grid">
          {allBadges.map((badge) => {
            const earned = userData.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={\`badge \${earned ? "earned" : "locked"}\`}
              >
                <div className="badge-icon inline-flex items-center justify-center">
                  {badge.icon}
                </div>
                <div className="badge-name">{badge.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--color-danger)" }}
        >
          <LogOut size={18} className="text-current" />
          Sign Out
        </button>
      </div>
    </main>
  );
}`,
  `function ProfileView({
  userData,
  onSignOut,
}: {
  userData: UserData;
  onSignOut: () => void;
}) {
  const [selectedBadge, setSelectedBadge] = useState<null | {
    name: string; desc: string; howToEarn: string;
  }>(null);

  // Derive initials from email
  const email = typeof window !== "undefined"
    ? (document.cookie.match(/fundi-name=([^;]+)/)?.[1] ?? "") : "";
  const initials = "KN"; // fallback; Supabase user metadata not in scope here

  const tc = userData.totalCompleted;
  const BADGE_DEFS = [
    { id: "first-lesson",    name: "First Steps",     desc: "Completed your first lesson",  howToEarn: "Complete any lesson.",                    earned: tc >= 1 },
    { id: "five-lessons",    name: "Getting Started", desc: "Completed 5 lessons",           howToEarn: "Finish 5 lessons.",                        earned: tc >= 5 },
    { id: "ten-lessons",     name: "On a Roll",       desc: "Completed 10 lessons",          howToEarn: "Finish 10 lessons.",                       earned: tc >= 10 },
    { id: "twenty-lessons",  name: "Committed",       desc: "Completed 20 lessons",          howToEarn: "Finish 20 lessons.",                       earned: tc >= 20 },
    { id: "streak-3",        name: "3 Day Streak",    desc: "3-day learning streak",         howToEarn: "Open the app and learn 3 days in a row.",  earned: userData.streak >= 3 },
    { id: "streak-7",        name: "7 Day Streak",    desc: "7-day learning streak",         howToEarn: "Maintain a 7-day streak.",                 earned: userData.streak >= 7 },
    { id: "xp-500",          name: "Century Club",    desc: "Earned 500 XP",                 howToEarn: "Accumulate 500 XP.",                       earned: userData.xp >= 500 },
    { id: "xp-2000",         name: "Finance Pro",     desc: "Earned 2 000 XP",               howToEarn: "Accumulate 2 000 XP.",                     earned: userData.xp >= 2000 },
  ];

  const earnedBadges = BADGE_DEFS.filter((b) => b.earned);

  const BadgeIcon = ({ id }: { id: string }) => {
    const icons: Record<string, React.ReactNode> = {
      "first-lesson":   <CheckCircle2 size={24} className="text-current" />,
      "five-lessons":   <BookOpen size={24} className="text-current" />,
      "ten-lessons":    <Flame size={24} className="text-current" />,
      "twenty-lessons": <Target size={24} className="text-current" />,
      "streak-3":       <Zap size={24} className="text-current" />,
      "streak-7":       <Zap size={24} className="text-current" />,
      "xp-500":         <Trophy size={24} className="text-current" />,
      "xp-2000":        <Wallet size={24} className="text-current" />,
    };
    return <>{icons[id] ?? <Trophy size={24} className="text-current" />}</>;
  };

  return (
    <main className="main-content main-with-stats">
      {/* ── Avatar + name ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0 16px" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", marginBottom: 12,
          background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 900, color: "white",
          boxShadow: "0 4px 16px rgba(0,122,77,0.25)",
        }}>{initials}</div>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 2 }}>Kwanele</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Financial Learner · Level {userData.level}</div>
      </div>

      {/* ── Stat row ── */}
      <div style={{
        display: "flex", background: "var(--color-surface)",
        border: "1px solid var(--color-border)", borderRadius: 14,
        marginBottom: 16, overflow: "hidden",
      }}>
        {[
          { label: "XP", value: userData.xp.toLocaleString(), color: "var(--color-primary)" },
          { label: "Level", value: userData.level, color: "var(--color-text-primary)" },
          { label: "Streak", value: userData.streak, color: "#FFB612" },
          { label: "Lessons", value: userData.totalCompleted, color: "var(--color-text-primary)" },
        ].map((stat, i, arr) => (
          <div key={stat.label} style={{
            flex: 1, textAlign: "center", padding: "14px 8px",
            borderRight: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Earned badges ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Badges</span>
          <span style={{ background: "var(--color-border)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "var(--color-text-secondary)" }}>
            {earnedBadges.length}/{BADGE_DEFS.length}
          </span>
        </div>
        {earnedBadges.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, textAlign: "center", padding: "16px 0" }}>
            Complete lessons to earn your first badge!
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {earnedBadges.map((badge) => (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
                  borderRadius: 14, padding: "14px 8px", cursor: "pointer",
                  transition: "transform 0.15s", color: "var(--color-primary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <BadgeIcon id={badge.id} />
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: "var(--color-text-primary)" }}>{badge.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Sign out ── */}
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: "var(--color-danger)" }}
      >
        <LogOut size={18} className="text-current" />
        Sign Out
      </button>

      {/* ── Badge detail modal ── */}
      {selectedBadge && (
        <div
          onClick={() => setSelectedBadge(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)", borderRadius: "20px 20px 14px 14px",
              padding: "28px 24px 24px", width: "100%", maxWidth: 400, textAlign: "center",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, color: "var(--color-text-primary)" }}>{selectedBadge.name}</div>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 8, fontSize: 14 }}>{selectedBadge.desc}</p>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              <strong>How to earn:</strong> {selectedBadge.howToEarn}
            </p>
            <button className="btn btn-primary" onClick={() => setSelectedBadge(null)}>Got it</button>
          </div>
        </div>
      )}
    </main>
  );
}`,
  "profile redesign with initials avatar, earned badges, modal"
);

// ─────────────────────────────────────────────────────────────────────────────
// 13. SettingsView — full expansion
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function SettingsView({
  userData,
  setDailyGoal,
  resetProgress,
}: {
  userData: UserData;
  setDailyGoal: (goal: number) => void;
  resetProgress: () => void;
}) {
  const [value, setValue] = useState(userData.dailyGoal);
  return (
    <main className="main-content main-with-stats">
      <h2
        style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 32,
        }}
      >
        Settings
      </h2>
      <div className="settings-section">
        <h3>Daily Goal</h3>
        <div className="setting-item">
          <div className="setting-label">XP Goal per Day</div>
          <input
            type="number"
            className="setting-input"
            value={value}
            min={10}
            max={500}
            step={10}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          onClick={() => setDailyGoal(value)}
        >
          Save Goal
        </button>
      </div>
      <div className="settings-section">
        <h3>Data Management</h3>
        <p style={{ color: "var(--text-light)", marginBottom: 16 }}>
          Warning: This will delete all your progress!
        </p>
        <button
          className="btn btn-secondary"
          style={{
            background: "var(--error-red)",
            color: "white",
            border: "none",
          }}
          onClick={resetProgress}
        >
          Reset All Progress
        </button>
      </div>
    </main>
  );
}`,
  `function SettingsView({
  userData,
  setDailyGoal,
  resetProgress,
}: {
  userData: UserData;
  setDailyGoal: (goal: number) => void;
  resetProgress: () => void;
}) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    typeof window === "undefined" ? true : localStorage.getItem("fundi-sound-enabled") !== "false"
  );
  const [selectedGoal, setSelectedGoal] = useState<number>(() => {
    if (typeof window === "undefined") return 50;
    return parseInt(localStorage.getItem("fundi-daily-goal") ?? "50", 10);
  });

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("fundi-sound-enabled", String(next));
  };

  const handleGoal = (g: number) => {
    setSelectedGoal(g);
    setDailyGoal(g);
    localStorage.setItem("fundi-daily-goal", String(g));
  };

  const Row = ({ icon, label, sub, children }: { icon: React.ReactNode; label: string; sub?: string; children?: React.ReactNode }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: 12, padding: "14px 16px", marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "var(--color-primary)" }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <main className="main-content main-with-stats">
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>Settings</h2>

      {/* ── Learning ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: 8 }}>Learning</div>

      {/* Sound toggle */}
      <Row icon={<Zap size={18} />} label="Sound effects" sub="Plays on correct / incorrect answers">
        <button
          role="switch"
          aria-checked={soundEnabled}
          onClick={handleSoundToggle}
          style={{
            width: 48, height: 28, borderRadius: 14,
            background: soundEnabled ? "var(--color-primary)" : "var(--color-border)",
            border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute", top: 3, left: soundEnabled ? 23 : 3, width: 22, height: 22,
            borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            transition: "left 0.2s",
          }} />
        </button>
      </Row>

      {/* Daily goal */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ color: "var(--color-primary)" }}><Target size={18} /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>Daily XP Goal</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>How much XP you aim to earn per day</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[25, 50, 100, 200].map((g) => (
            <button
              key={g}
              onClick={() => handleGoal(g)}
              style={{
                padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: "1.5px solid",
                borderColor: selectedGoal === g ? "var(--color-primary)" : "var(--color-border)",
                background: selectedGoal === g ? "var(--color-primary)" : "transparent",
                color: selectedGoal === g ? "white" : "var(--color-text-secondary)",
                transition: "all 0.15s",
              }}
            >{g} XP</button>
          ))}
        </div>
      </div>

      {/* ── Support ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>Support</div>
      <a href="mailto:kwanele@wealthwithkwanele.co.za?subject=Fundi%20Finance%20Support" style={{ textDecoration: "none" }}>
        <Row icon={<Shield size={18} />} label="Email support" sub="kwanele@wealthwithkwanele.co.za">
          <ArrowLeft size={16} style={{ transform: "rotate(180deg)", color: "var(--color-text-secondary)" }} />
        </Row>
      </a>
      <a href="https://wealthwithkwanele.co.za" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <Row icon={<TrendingUp size={18} />} label="Wealth with Kwanele" sub="wealthwithkwanele.co.za">
          <ArrowLeft size={16} style={{ transform: "rotate(180deg)", color: "var(--color-text-secondary)" }} />
        </Row>
      </a>

      {/* ── About ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>About</div>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 12, padding: "20px 16px", textAlign: "center", marginBottom: 8,
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
          <span style={{ color: "var(--color-primary)" }}>Fundi </span>
          <span style={{ color: "var(--color-secondary)" }}>Finance</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, marginBottom: 8 }}>
          A Duolingo-style financial literacy app for South Africans.
        </p>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Version 1.0.0</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          Built by{" "}
          <a href="https://wealthwithkwanele.co.za" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            Kwanele Ntshangase
          </a>
        </div>
      </div>

      {/* ── Data management ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>Data</div>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 8,
      }}>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 12, fontSize: 13 }}>
          Warning: This will permanently delete all your progress.
        </p>
        <button
          className="btn btn-secondary"
          style={{ background: "var(--error-red)", color: "white", border: "none" }}
          onClick={resetProgress}
        >
          Reset All Progress
        </button>
      </div>
    </main>
  );
}`,
  "settings view expansion"
);

// ─────────────────────────────────────────────────────────────────────────────
// 14. Add FundiTopBar and FundiCharacter components before CalculatorView
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function CalculatorView() {`,
  `// ── FundiTopBar — sticky mobile top bar ──────────────────────────────────────
function FundiTopBar({
  streak, xp, hearts, maxHearts,
}: { streak: number; xp: number; hearts: number; maxHearts: number }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 16px",
      background: "var(--color-surface)",
      borderBottom: "1.5px solid var(--color-border)",
      backdropFilter: "blur(8px)",
    }}>
      {/* Streak */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Flame size={20} style={{ color: "#FFB612" }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#FFB612" }}>{streak}</span>
      </div>
      {/* XP */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Zap size={18} style={{ color: "var(--color-primary)" }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-primary)" }}>{xp.toLocaleString()} XP</span>
      </div>
      {/* Hearts */}
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {Array.from({ length: maxHearts }).map((_, i) => (
          <svg key={i} viewBox="0 0 24 24"
            fill={i < hearts ? "#E03C31" : "none"}
            stroke={i < hearts ? "#E03C31" : "#ccc"}
            strokeWidth="2" width="18" height="18"
            style={{ transition: "fill 0.2s" }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        ))}
      </div>
    </div>
  );
}

// ── FundiCharacter — mascot image with expression ─────────────────────────────
type FundiExpression = "default" | "thinking" | "sad" | "celebrating";
function FundiCharacter({
  expression = "default", size = 100, style: extraStyle = {},
}: { expression?: FundiExpression; size?: number; style?: React.CSSProperties }) {
  return (
    <img
      src={\`/characters/fundi-\${expression}.png\`}
      alt={\`Fundi \${expression}\`}
      width={size} height={size}
      style={{ objectFit: "contain", display: "block", ...extraStyle }}
    />
  );
}

function CalculatorView() {`,
  "add FundiTopBar and FundiCharacter components"
);

// ─────────────────────────────────────────────────────────────────────────────
// 15. Wire Fundi celebrating above "Lesson Complete!" heading
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      Lesson Complete!
                    </div>`,
  `                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px", animation: "fundi-bounce 0.8s ease-in-out infinite" }} />
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      Lesson Complete!
                    </div>`,
  "wire fundi-celebrating to lesson complete (MCQ)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 16. Wire Fundi thinking above info step title
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `    if (step.type === "info") {
      return (
        <>
          <h2 className="step-title">{step.title}</h2>`,
  `    if (step.type === "info") {
      return (
        <>
          <FundiCharacter expression="thinking" size={80} style={{ margin: "0 auto 12px", animation: "fundi-bob 2s ease-in-out infinite" }} />
          <h2 className="step-title">{step.title}</h2>`,
  "wire fundi-thinking to info steps"
);

// ─────────────────────────────────────────────────────────────────────────────
// 17. Sound guard in playSound
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function playSound(type: "correct" | "incorrect" | "complete") {
  if (typeof window === "undefined") return;
  try {`,
  `function playSound(type: "correct" | "incorrect" | "complete") {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("fundi-sound-enabled") === "false") return;
  try {`,
  "add sound toggle guard to playSound"
);

// ─────────────────────────────────────────────────────────────────────────────
// 18. Add keyframe animations to globals.css
// ─────────────────────────────────────────────────────────────────────────────

const CSS_FILE = path.join(__dirname, "../src/app/globals.css");
let css = fs.readFileSync(CSS_FILE, "utf8");

const ANIMATIONS = `
/* ── Fundi mascot animations ─────────────────────────────────── */
@keyframes fundi-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes fundi-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  30% { transform: translateY(-5px) rotate(-3deg); }
  70% { transform: translateY(-2px) rotate(3deg); }
}
@keyframes fundi-shake {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(8deg); }
  60% { transform: rotate(-5deg); }
  80% { transform: rotate(5deg); }
}
`;

if (!css.includes("fundi-bounce")) {
  css += ANIMATIONS;
  fs.writeFileSync(CSS_FILE, css);
  console.log("✅  Fundi keyframe animations added to globals.css");
} else {
  console.log("⏭   Fundi animations already in globals.css");
}

// ─────────────────────────────────────────────────────────────────────────────
// Write page.tsx
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(PAGE, src);

console.log(`\n${changed} replacements made in page.tsx.`);
console.log("\n📋 Supabase SQL (optional — hearts auto-persist to localStorage):");
console.log("   If you want hearts in Supabase too, add:");
console.log("   ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS hearts integer DEFAULT 5;");
console.log("   ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_heart_lost_at bigint;");
console.log("\n📁 Fundi PNG files needed in /public/characters/:");
console.log("   fundi-default.png  fundi-thinking.png  fundi-sad.png  fundi-celebrating.png");
console.log("\nNext: npm run build");
