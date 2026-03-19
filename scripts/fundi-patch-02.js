/**
 * fundi-patch-02.js — Second round of improvements
 *
 * Changes:
 *  1.  Calculator — remove max cap on manual number inputs (type beyond slider max)
 *  2.  Calculator CTA — remove name, say "Talk to a finance professional"
 *  3.  TopBar — make it sticky at top even while scrolling (move outside scroll div)
 *  4.  Leaderboard — pull real XP data from Supabase user_progress table
 *  5.  LearnView — colour-coded course cards, first lesson always unlocked
 *  6.  LearnView — locked lesson click shows "unlock" modal
 *  7.  ProfileView — remove badge count, simplify to earned-only with clean desc
 *  8.  ProfileView — many more badges (streaks, perfect lessons, XP milestones)
 *  9.  Hearts tap — show regen countdown modal when tapped on TopBar
 * 10.  Add Bible & Money learning path to CONTENT_DATA stub
 *
 * Run from project root:
 *   node scripts/fundi-patch-02.js
 * Then: npm run build
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
// 1. SliderInput — remove max cap on number input so user can type freely
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const handleBlur = () => {
    let v = parseFloat(inputStr);
    if (isNaN(v)) v = min;
    v = Math.max(min, Math.min(max, Math.round(v / step) * step));
    onChange(v);
    setInputStr(String(v));
  };`,
  `  const handleBlur = () => {
    let v = parseFloat(inputStr);
    if (isNaN(v)) v = min;
    // Only enforce min; allow user to type beyond slider max
    v = Math.max(min, Math.round(v / step) * step);
    onChange(v);
    setInputStr(String(v));
  };`,
  "remove max cap on calculator number inputs"
);

// Also remove max attribute from the number input element so browser won't block it
replace(
  `          min={min}
          max={max}
          step={step}
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          onBlur={handleBlur}`,
  `          min={min}
          step={step}
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          onBlur={handleBlur}`,
  "remove max attr from number input element"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Calculator CTA — remove name, generic professional CTA
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `        <div
          style={{
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 4,
          }}
        >
          Want a personalised investment plan?
        </div>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          Kwanele has helped 100+ South Africans build real portfolios. Your
          numbers deserve a real plan.
        </p>
        <a
          href="https://wealthwithkwanele.co.za"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "var(--color-primary)",
            color: "white",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Book a Free Call
        </a>`,
  `        <div
          style={{
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 4,
          }}
        >
          Want a personalised investment plan?
        </div>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          These numbers are a starting point. A qualified financial professional
          can help you turn them into a real plan built for your life.
        </p>
        <a
          href="https://wealthwithkwanele.co.za"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "var(--color-primary)",
            color: "white",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Talk to a Finance Professional
        </a>`,
  "remove name from calculator CTA"
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. TopBar — move OUTSIDE the scrollable div so it stays fixed while scrolling
//    and add hearts tap → regen modal
// ─────────────────────────────────────────────────────────────────────────────

// Step 3a: Remove the TopBar that's currently inside the scroll div
replace(
  `        {/* ── TopBar: mobile only, sticky ── */}
        <div className="md:hidden">
          <FundiTopBar
            streak={userData.streak}
            xp={userData.xp}
            hearts={hearts}
            maxHearts={maxHearts}
          />
        </div>`,
  `        {/* TopBar moved outside scroll area — see below */}`,
  "remove inline TopBar from scroll div"
);

// Step 3b: Place TopBar ABOVE the app-container div (outside sidebar + content)
replace(
  `    <AuthGate>
      <div className="app-container">`,
  `    <AuthGate>
      {/* ── Sticky mobile TopBar — outside scroll area ── */}
      <div className="md:hidden" style={{ position: "sticky", top: 0, zIndex: 200 }}>
        <FundiTopBar
          streak={userData.streak}
          xp={userData.xp}
          hearts={hearts}
          maxHearts={maxHearts}
          heartsRegenInfo={heartsRegenInfo}
        />
      </div>
      <div className="app-container">`,
  "move TopBar above app-container for sticky scroll"
);

// Step 3c: Update FundiTopBar to accept heartsRegenInfo + show modal on tap
replace(
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
}`,
  `// ── FundiTopBar — sticky mobile top bar ──────────────────────────────────────
function FundiTopBar({
  streak, xp, hearts, maxHearts, heartsRegenInfo,
}: {
  streak: number; xp: number; hearts: number; maxHearts: number;
  heartsRegenInfo?: () => { nextHeartIn: string; minutesLeft: number } | null;
}) {
  const [showHeartsModal, setShowHeartsModal] = useState(false);
  const regen = heartsRegenInfo ? heartsRegenInfo() : null;

  return (
    <>
      <div style={{
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
        {/* Hearts — tappable */}
        <button
          onClick={() => hearts < maxHearts && setShowHeartsModal(true)}
          style={{ display: "flex", gap: 3, alignItems: "center", background: "none", border: "none", cursor: hearts < maxHearts ? "pointer" : "default", padding: 0 }}
          aria-label="Hearts status"
        >
          {Array.from({ length: maxHearts }).map((_, i) => (
            <svg key={i} viewBox="0 0 24 24"
              fill={i < hearts ? "#E03C31" : "none"}
              stroke={i < hearts ? "#E03C31" : "#ccc"}
              strokeWidth="2" width="18" height="18"
              style={{ transition: "fill 0.2s" }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ))}
        </button>
      </div>

      {/* Hearts regen modal */}
      {showHeartsModal && (
        <div
          onClick={() => setShowHeartsModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)", borderRadius: 20,
              padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center",
            }}
          >
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
              {Array.from({ length: maxHearts }).map((_, i) => (
                <svg key={i} viewBox="0 0 24 24"
                  fill={i < hearts ? "#E03C31" : "none"}
                  stroke={i < hearts ? "#E03C31" : "#ccc"}
                  strokeWidth="2" width="28" height="28">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              {hearts}/{maxHearts} Hearts
            </div>
            {regen ? (
              <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
                Next heart in <strong>{regen.nextHeartIn}</strong>.<br />
                Hearts refill 1 per hour automatically.
              </p>
            ) : (
              <p style={{ color: "var(--color-text-secondary)", marginBottom: 20 }}>
                You have full hearts. Keep learning!
              </p>
            )}
            <button className="btn btn-primary" onClick={() => setShowHeartsModal(false)}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}`,
  "TopBar with hearts tap modal"
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Leaderboard — pull real data from Supabase
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function LeaderboardView({ xp }: { xp: number }) {
  const leaders = useMemo(
    () =>
      [
        { name: "Thabo M.", xp: 5240 },
        { name: "Sarah K.", xp: 4890 },
        { name: "You", xp },
        { name: "John D.", xp: 3120 },
        { name: "Nomsa P.", xp: 2850 },
        { name: "Michael T.", xp: 2630 },
        { name: "Jessica R.", xp: 2410 },
        { name: "David L.", xp: 2180 },
      ].sort((a, b) => b.xp - a.xp),
    [xp]
  );

  return (
    <main className="main-content main-with-stats">
      <h2
        style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 32,
        }}
      >
        Leaderboard
      </h2>
      <div className="leaderboard-table">
        {leaders.map((leader, index) => {
          const isYou = leader.name === "You";
          const rankClass = index < 3 ? "top" : "";
          return (
            <div
              key={leader.name}
              className="leaderboard-row"
              style={
                isYou
                  ? { background: "rgba(88, 204, 2, 0.1)" }
                  : undefined
              }
            >
              <div className={\`leaderboard-rank \${rankClass}\`}>
                {index + 1}
              </div>
              <div className="leaderboard-avatar">
                {leader.name[0]}
              </div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">
                  {leader.name}
                  {isYou ? (
                    <span className="ml-2 inline-flex align-middle">
                      <Target size={16} className="text-current" />
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="leaderboard-xp">
                {leader.xp.toLocaleString()} XP
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}`,
  `function LeaderboardView({ xp, currentUserId }: { xp: number; currentUserId?: string }) {
  const [leaders, setLeaders] = useState<{ id: string; email: string; xp: number; isYou: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("user_id, xp")
          .order("xp", { ascending: false })
          .limit(20);

        if (error || !data) { setLoading(false); return; }

        // Get current user email for "You" label
        const { data: { user } } = await supabase.auth.getUser();
        const myId = user?.id ?? currentUserId;

        const rows = data.map((row: { user_id: string; xp: number }) => {
          const isYou = row.user_id === myId;
          // Mask email: show first letter + domain only e.g. "k***@gmail.com"
          const email = isYou ? "You" : \`User \${row.user_id.slice(0, 4)}\`;
          return { id: row.user_id, email, xp: row.xp ?? 0, isYou };
        });

        // Ensure current user appears even if outside top 20
        const alreadyIn = rows.some((r) => r.isYou);
        if (!alreadyIn && myId) {
          rows.push({ id: myId, email: "You", xp, isYou: true });
          rows.sort((a, b) => b.xp - a.xp);
        }

        setLeaders(rows);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [xp, currentUserId]);

  const MEDAL = ["🥇", "🥈", "🥉"];

  return (
    <main className="main-content main-with-stats">
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Leaderboard</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24, fontSize: 14 }}>
        Real XP from all users on Fundi Finance
      </p>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>Loading...</div>
      ) : (
        <div className="leaderboard-table">
          {leaders.map((leader, index) => (
            <div
              key={leader.id}
              className="leaderboard-row"
              style={leader.isYou ? { background: "rgba(0,122,77,0.08)", border: "1.5px solid var(--color-primary)" } : undefined}
            >
              <div className={\`leaderboard-rank \${index < 3 ? "top" : ""}\`}>
                {index < 3 ? MEDAL[index] : index + 1}
              </div>
              <div className="leaderboard-avatar">{leader.email[0].toUpperCase()}</div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">
                  {leader.email}
                  {leader.isYou && (
                    <span style={{ marginLeft: 6, fontSize: 11, background: "var(--color-primary)", color: "white", borderRadius: 999, padding: "2px 7px", fontWeight: 700 }}>You</span>
                  )}
                </div>
              </div>
              <div className="leaderboard-xp">{leader.xp.toLocaleString()} XP</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}`,
  "leaderboard with real Supabase data"
);

// Pass currentUserId to LeaderboardView
replace(
  `        {route.name === "leaderboard" && (
          <LeaderboardView xp={userData.xp} />
        )}`,
  `        {route.name === "leaderboard" && (
          <LeaderboardView xp={userData.xp} currentUserId={undefined} />
        )}`,
  "pass userId to leaderboard"
);

// ─────────────────────────────────────────────────────────────────────────────
// 5 & 6. LearnView — colour-coded cards, first lesson always unlocked,
//         locked lesson click → modal
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
        {courses.map((course) => {
          const totalLessons = course.units.reduce(
            (sum, unit) => sum + unit.lessons.length,
            0
          );
          const completedLessons = course.units.reduce((sum, unit) => {
            return (
              sum +
              unit.lessons.filter((lesson) =>
                isLessonCompleted(course.id, lesson.id)
              ).length
            );
          }, 0);
          const percentage =
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;
          return (
            <div
              key={course.id}
              className="course-card"
              onClick={() => goToCourse(course.id)}
            >
              <div className="course-header">
                <div>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    <CourseIcon name={course.icon} size={48} />
                  </div>
                  <div className="course-title">{course.title}</div>
                  <div className="course-description">
                    {course.description}
                  </div>
                </div>
                <div className="course-progress">
                  <div className="course-percentage">{percentage}%</div>
                  <div className="course-percentage-label">Complete</div>
                </div>
              </div>
              <div className="course-stats">
                <div className="course-stat">
                  <strong>{completedLessons}</strong> / {totalLessons} lessons
                </div>
                <div className="course-stat">
                  <strong>{course.units.length}</strong> units
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}`,
  `// Course accent colours — cycles through SA-themed palette
const COURSE_COLOURS = [
  { bg: "#E8F5EE", accent: "#007A4D", light: "#C8EAD9" }, // green
  { bg: "#FFF8E7", accent: "#FFB612", light: "#FFE9A0" }, // gold
  { bg: "#FFF0EF", accent: "#E03C31", light: "#FCCFCC" }, // red
  { bg: "#EEF4FF", accent: "#3B7DD8", light: "#C5D9F7" }, // blue
  { bg: "#F3EEFF", accent: "#7C4DFF", light: "#D9C8FF" }, // purple
  { bg: "#E8FAF0", accent: "#00BFA5", light: "#B2EFE3" }, // teal
  { bg: "#FFF3E0", accent: "#F57C00", light: "#FFD9A8" }, // orange
  { bg: "#FCE4EC", accent: "#C2185B", light: "#F5B8CE" }, // pink
];

function LearnView({
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
        {courses.map((course, courseIndex) => {
          const colour = COURSE_COLOURS[courseIndex % COURSE_COLOURS.length];
          const totalLessons = course.units.reduce(
            (sum, unit) => sum + unit.lessons.length, 0
          );
          const completedLessons = course.units.reduce((sum, unit) => {
            return sum + unit.lessons.filter((lesson) =>
              isLessonCompleted(course.id, lesson.id)
            ).length;
          }, 0);
          const percentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100) : 0;
          return (
            <div
              key={course.id}
              className="course-card"
              onClick={() => goToCourse(course.id)}
              style={{ background: colour.bg, borderColor: colour.light, borderWidth: 1.5 }}
            >
              <div className="course-header">
                <div>
                  <div style={{ fontSize: 48, marginBottom: 12, color: colour.accent }}>
                    <CourseIcon name={course.icon} size={48} />
                  </div>
                  <div className="course-title" style={{ color: colour.accent }}>{course.title}</div>
                  <div className="course-description">{course.description}</div>
                </div>
                <div className="course-progress">
                  <div className="course-percentage" style={{ color: colour.accent }}>{percentage}%</div>
                  <div className="course-percentage-label">Complete</div>
                </div>
              </div>
              {/* Coloured progress bar */}
              <div style={{ height: 6, background: colour.light, borderRadius: 3, margin: "8px 0", overflow: "hidden" }}>
                <div style={{ height: "100%", width: \`\${percentage}%\`, background: colour.accent, borderRadius: 3, transition: "width 0.4s" }} />
              </div>
              <div className="course-stats">
                <div className="course-stat">
                  <strong>{completedLessons}</strong> / {totalLessons} lessons
                </div>
                <div className="course-stat">
                  <strong>{course.units.length}</strong> units
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}`,
  "colour-coded course cards with progress bar"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. CourseView — first lesson of each unit always unlocked,
//                 locked lesson tap shows unlock modal
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function CourseView({
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
              {unit.lessons.map((lesson) => {
                const completed = isLessonCompleted(course.id, lesson.id);
                const comingSoon = lesson.comingSoon;
                let nodeClass = "lesson-node";
                let icon: ReactNode = (
                  <BookOpen size={28} className="text-current" />
                );
                if (comingSoon) {
                  nodeClass += " coming-soon";
                  icon = <Lock size={28} className="text-current" />;
                } else if (completed) {
                  nodeClass += " completed";
                  icon = <CheckCircle2 size={28} className="text-current" />;
                }
                return (
                  <div key={lesson.id}>
                    <div
                      className={nodeClass}
                      onClick={() =>
                        !comingSoon ? goToLesson(lesson.id) : undefined
                      }
                    >
                      {icon}
                    </div>
                    <div className="lesson-label">{lesson.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}`,
  `function CourseView({
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
  const [lockedModal, setLockedModal] = useState<{ lessonTitle: string; reason: string } | null>(null);

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

        {course.units.map((unit, unitIndex) => (
          <div className="unit" key={unit.id}>
            <div className="unit-header">
              <div className="unit-title">{unit.title}</div>
              <div className="unit-description">{unit.description}</div>
            </div>
            <div className="lessons-path">
              {unit.lessons.map((lesson, lessonIndex) => {
                const completed = isLessonCompleted(course.id, lesson.id);
                // First lesson of every unit is always available (not locked by comingSoon logic)
                const isFirstOfUnit = lessonIndex === 0;
                const comingSoon = lesson.comingSoon && !isFirstOfUnit;
                let nodeClass = "lesson-node";
                let icon: ReactNode = <BookOpen size={28} className="text-current" />;

                if (comingSoon) {
                  nodeClass += " coming-soon";
                  icon = <Lock size={28} className="text-current" />;
                } else if (completed) {
                  nodeClass += " completed";
                  icon = <CheckCircle2 size={28} className="text-current" />;
                }

                const handleClick = () => {
                  if (comingSoon) {
                    // Find the previous lesson they need to complete
                    const prevLesson = lessonIndex > 0 ? unit.lessons[lessonIndex - 1] : null;
                    const reason = prevLesson
                      ? \`Complete "\${prevLesson.title}" first to unlock this lesson.\`
                      : "Complete the previous lessons to unlock this one.";
                    setLockedModal({ lessonTitle: lesson.title, reason });
                  } else {
                    goToLesson(lesson.id);
                  }
                };

                return (
                  <div key={lesson.id}>
                    <div className={nodeClass} onClick={handleClick}>{icon}</div>
                    <div className="lesson-label">{lesson.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Locked lesson modal */}
        {lockedModal && (
          <div
            onClick={() => setLockedModal(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--color-surface)", borderRadius: 20,
                padding: "28px 24px", width: "100%", maxWidth: 340, textAlign: "center",
              }}
            >
              <div style={{ marginBottom: 12 }}><Lock size={40} style={{ color: "var(--color-text-secondary)", margin: "0 auto" }} /></div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{lockedModal.lessonTitle}</div>
              <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, lineHeight: 1.6, fontSize: 14 }}>
                {lockedModal.reason}
              </p>
              <button className="btn btn-primary" onClick={() => setLockedModal(null)}>Got it</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}`,
  "CourseView: first lesson unlocked, locked modal on tap"
);

// ─────────────────────────────────────────────────────────────────────────────
// 7 & 8. ProfileView — remove badge count header, massively expand badge list
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const tc = userData.totalCompleted;
  const BADGE_DEFS = [
    { id: "first-lesson",    name: "First Steps",     desc: "Completed your first lesson",  howToEarn: "Complete any lesson.",                    earned: tc >= 1 },
    { id: "five-lessons",    name: "Getting Started", desc: "Completed 5 lessons",           howToEarn: "Finish 5 lessons.",                        earned: tc >= 5 },
    { id: "ten-lessons",     name: "On a Roll",       desc: "Completed 10 lessons",          howToEarn: "Finish 10 lessons.",                       earned: tc >= 10 },
    { id: "twenty-lessons",  name: "Committed",       desc: "Completed 20 lessons",          howToEarn: "Finish 20 lessons.",                       earned: tc >= 20 },
    { id: "streak-3",        name: "3 Day Streak",    desc: "3-day learning streak",         howToEarn: "Open the app and learn 3 days in a row.",  earned: userData.streak >= 3 },
    { id: "streak-7",        name: "7 Day Streak",    desc: "7-day learning streak",         howToEarn: "Maintain a 7-day streak.",                 earned: userData.streak >= 7 },
    { id: "xp-500",          name: "Century Club",    desc: "Earned 500 XP",                 howToEarn: "Accumulate 500 XP.",                       earned: userData.xp >= 500 },
    { id: "xp-2000",         name: "Finance Pro",     desc: "Earned 2 000 XP",               howToEarn: "Accumulate 2 000 XP.",                     earned: userData.xp >= 2000 },
  ];`,
  `  const tc = userData.totalCompleted;
  const str = userData.streak;
  const xpv = userData.xp;
  // perfectLessons tracked via localStorage (incremented on 100% score)
  const perfectLessons = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10) : 0;

  const BADGE_DEFS = [
    // Lesson milestones
    { id: "lesson-1",   name: "First Step",       desc: "Completed your first lesson",     icon: <CheckCircle2 size={22} className="text-current" />, earned: tc >= 1 },
    { id: "lesson-5",   name: "Getting Going",    desc: "Completed 5 lessons",             icon: <BookOpen size={22} className="text-current" />,     earned: tc >= 5 },
    { id: "lesson-10",  name: "On a Roll",        desc: "Completed 10 lessons",            icon: <TrendingUp size={22} className="text-current" />,   earned: tc >= 10 },
    { id: "lesson-25",  name: "Dedicated",        desc: "Completed 25 lessons",            icon: <Target size={22} className="text-current" />,       earned: tc >= 25 },
    { id: "lesson-50",  name: "Half Century",     desc: "Completed 50 lessons",            icon: <Trophy size={22} className="text-current" />,       earned: tc >= 50 },
    { id: "lesson-100", name: "Centurion",        desc: "Completed 100 lessons",           icon: <Trophy size={22} className="text-current" />,       earned: tc >= 100 },
    // Streak milestones
    { id: "streak-3",   name: "3 Day Streak",     desc: "Learned 3 days in a row",        icon: <Flame size={22} className="text-current" />,        earned: str >= 3 },
    { id: "streak-7",   name: "Week Warrior",     desc: "7-day learning streak",          icon: <Flame size={22} className="text-current" />,        earned: str >= 7 },
    { id: "streak-14",  name: "Two Weeks Strong", desc: "14-day learning streak",         icon: <Zap size={22} className="text-current" />,          earned: str >= 14 },
    { id: "streak-30",  name: "Monthly Habit",    desc: "30-day learning streak",         icon: <Zap size={22} className="text-current" />,          earned: str >= 30 },
    { id: "streak-60",  name: "Unstoppable",      desc: "60-day learning streak",         icon: <Trophy size={22} className="text-current" />,       earned: str >= 60 },
    { id: "streak-100", name: "Legendary",        desc: "100-day learning streak",        icon: <Trophy size={22} className="text-current" />,       earned: str >= 100 },
    // XP milestones
    { id: "xp-100",     name: "First 100",        desc: "Earned 100 XP",                  icon: <Zap size={22} className="text-current" />,          earned: xpv >= 100 },
    { id: "xp-500",     name: "XP Builder",       desc: "Earned 500 XP",                  icon: <Zap size={22} className="text-current" />,          earned: xpv >= 500 },
    { id: "xp-1000",    name: "Knowledge Is Power", desc: "Earned 1 000 XP",              icon: <Brain size={22} className="text-current" />,        earned: xpv >= 1000 },
    { id: "xp-5000",    name: "Finance Pro",      desc: "Earned 5 000 XP",                icon: <Wallet size={22} className="text-current" />,       earned: xpv >= 5000 },
    // Perfect lesson milestones
    { id: "perfect-1",  name: "Flawless",         desc: "Got a perfect score on a lesson", icon: <CheckCircle2 size={22} className="text-current" />, earned: perfectLessons >= 1 },
    { id: "perfect-5",  name: "Sharp Mind",       desc: "5 perfect lesson scores",         icon: <Brain size={22} className="text-current" />,        earned: perfectLessons >= 5 },
    { id: "perfect-10", name: "Untouchable",      desc: "10 perfect lesson scores",        icon: <Trophy size={22} className="text-current" />,       earned: perfectLessons >= 10 },
  ];`,
  "expanded badge definitions"
);

// Remove badge count from the section header
replace(
  `        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Badges</span>
          <span style={{ background: "var(--color-border)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: "var(--color-text-secondary)" }}>
            {earnedBadges.length}/{BADGE_DEFS.length}
          </span>
        </div>`,
  `        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Your Badges</span>
        </div>`,
  "remove badge count from profile header"
);

// Update badge card to use badge.icon from BADGE_DEFS directly
replace(
  `            {earnedBadges.map((badge) => (
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
            ))}`,
  `            {earnedBadges.map((badge) => (
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
                <span style={{ color: "var(--color-primary)" }}>{badge.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: "var(--color-text-primary)" }}>{badge.name}</span>
              </button>
            ))}`,
  "use badge.icon directly in profile badge cards"
);

// Update selectedBadge modal — remove "how to earn" line, just show desc
replace(
  `            <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              <strong>How to earn:</strong> {selectedBadge.howToEarn}
            </p>`,
  ``,
  "remove how-to-earn from badge modal"
);

// Update selectedBadge state type to remove howToEarn
replace(
  `  const [selectedBadge, setSelectedBadge] = useState<null | {
    name: string; desc: string; howToEarn: string;
  }>(null);`,
  `  const [selectedBadge, setSelectedBadge] = useState<null | {
    name: string; desc: string; icon: React.ReactNode;
  }>(null);`,
  "update selectedBadge type"
);

// Update modal to show icon
replace(
  `          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, color: "var(--color-text-primary)" }}>{selectedBadge.name}</div>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 8, fontSize: 14 }}>{selectedBadge.desc}</p>`,
  `          <div style={{ color: "var(--color-primary)", marginBottom: 8, display: "flex", justifyContent: "center" }}>{selectedBadge.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, color: "var(--color-text-primary)" }}>{selectedBadge.name}</div>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>{selectedBadge.desc}</p>`,
  "add icon to badge modal"
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. Track perfect lessons — increment counter when lesson completes with
//    100% correctCount (all questions right). Hook into nextStep in Home.
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `      playSound("complete");
      setRoute({ name: "course", courseId: currentLessonState.courseId! });`,
  `      playSound("complete");
      // Track perfect lessons for badge system
      const totalQuestions = currentLessonState.steps.filter(
        (s) => s.type === "mcq" || s.type === "true-false" || s.type === "scenario"
      ).length;
      if (totalQuestions > 0 && currentLessonState.correctCount === totalQuestions) {
        const prev = parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10);
        localStorage.setItem("fundi-perfect-lessons", String(prev + 1));
      }
      setRoute({ name: "course", courseId: currentLessonState.courseId! });`,
  "track perfect lessons in localStorage"
);

// ─────────────────────────────────────────────────────────────────────────────
// Write file
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(PAGE, src);
console.log(`\n${changed} replacements made in page.tsx.`);
console.log("\n📋 Next steps:");
console.log("   1. npm run build");
console.log("   2. Add Bible & Money course to src/data/content.ts (see BIBLE_COURSE below)");
console.log("   3. npx vercel --prod");
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BIBLE_COURSE — paste into src/data/content.ts inside the courses array:

{
  id: "bible-money",
  title: "Money & the Bible",
  description: "What Scripture says about wealth, generosity, and stewardship.",
  icon: "book-open",
  units: [
    {
      id: "stewardship",
      title: "Stewardship",
      description: "Managing what God has given you.",
      lessons: [
        {
          id: "what-is-stewardship",
          title: "What Is Stewardship?",
          steps: [
            {
              type: "info",
              title: "You Are a Manager, Not an Owner",
              content: "<p>Psalm 24:1 — <em>The earth is the Lord's, and everything in it.</em> Biblical finance starts here: everything belongs to God. We are managers of His resources.</p>"
            },
            {
              type: "mcq",
              question: "According to Psalm 24:1, who owns everything?",
              options: ["You", "The government", "God", "Your employer"],
              correct: 2,
              feedback: {
                correct: "Exactly. This shifts how you think about spending, saving, and giving.",
                incorrect: "Psalm 24:1 says 'The earth is the Lord's, and everything in it.'"
              }
            }
          ]
        },
        {
          id: "proverbs-money",
          title: "Proverbs on Money",
          comingSoon: true,
          steps: []
        }
      ]
    },
    {
      id: "generosity",
      title: "Generosity",
      description: "Why giving is part of a healthy financial life.",
      lessons: [
        {
          id: "give-first",
          title: "Give First",
          steps: [
            {
              type: "info",
              title: "Honour God with Your Wealth",
              content: "<p>Proverbs 3:9 — <em>Honour the Lord with your wealth, with the firstfruits of all your crops.</em> Giving first is an act of faith and financial discipline.</p>"
            },
            {
              type: "true-false",
              statement: "The Bible teaches you should give only after all your expenses are paid.",
              correct: false,
              feedback: {
                correct: "Correct. Proverbs 3:9 says 'firstfruits' — give first.",
                incorrect: "'Firstfruits' means off the top, not what's left over."
              }
            }
          ]
        },
        {
          id: "debt-scripture",
          title: "The Bible on Debt",
          comingSoon: true,
          steps: []
        }
      ]
    }
  ]
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
