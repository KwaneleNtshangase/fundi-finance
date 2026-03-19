/**
 * fundi-patch-05.js — Cross-device sync, leaderboard, UI polish
 *
 * CHANGES:
 *  1.  Progress cross-device: save display_name + age to Supabase user_metadata
 *      on signup. useProgress already syncs xp/streak/completedLessons to Supabase —
 *      the issue was the profile showed a hardcoded name. Fix reads from auth metadata.
 *
 *  2.  AuthGate signup: collect first name, last name, email, age, password.
 *      Saves full_name + age to Supabase user_metadata on signup.
 *
 *  3.  ProfileView: read display name from Supabase session user_metadata.
 *      Show initials from actual name.
 *
 *  4.  LeaderboardView: fetch real user_progress data. Also fetch display names
 *      from a profiles table (created via SQL below). Falls back to "User XXXX" if
 *      no profile row. Shows "You" highlight for current user.
 *
 *  5.  Progress bar gradient: per-course colour (matches course card accent).
 *      Passed as a prop from CourseView into LessonView.
 *
 *  6.  Lesson node colours: completed = green, playable = course accent colour,
 *      locked/coming_soon = grey. Entire course map tinted with course colour.
 *
 *  7.  Trophy icon: gold (#FFB612) not red.
 *
 *  8.  Fundi mascot: stationary (remove CSS animations).
 *
 *  9.  Correct answer feedback: green background + white text (not yellow).
 *
 * 10.  Completed lesson node: green circle (not yellow).
 *
 * 11.  Badge earned modal: shown immediately after lesson complete, before
 *      returning to course map. Checks which new badges were just earned.
 *
 * Run from project root:
 *   node scripts/fundi-patch-05.js
 * Then:
 *   npm run build
 *
 * REQUIRED SQL (run once in Supabase SQL editor):
 *   CREATE TABLE IF NOT EXISTS profiles (
 *     user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *     full_name text,
 *     age integer,
 *     created_at timestamptz DEFAULT now()
 *   );
 *   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
 *   CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
 *   CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
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
// 1. AuthGate — add name/age fields, save to Supabase on signup
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function AuthGate({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);`,
  `function AuthGate({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);`,
  "add name/age/mode state to AuthGate"
);

replace(
  `  const handleSignUp = async () => {
    setError(null);
    const { error: e } = await supabase.auth.signUp({
      email,
      password,
    });
    if (e) setError(e.message);
  };`,
  `  const handleSignUp = async () => {
    setError(null);
    if (!firstName.trim()) { setError("Please enter your first name."); return; }
    if (!lastName.trim()) { setError("Please enter your last name."); return; }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      setError("Please enter a valid age (13+).");
      return;
    }
    const fullName = firstName.trim() + " " + lastName.trim();
    const { data, error: e } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, age: ageNum } },
    });
    if (e) { setError(e.message); return; }
    // Also write to profiles table for leaderboard display
    if (data.user) {
      await supabase.from("profiles").upsert({
        user_id: data.user.id,
        full_name: fullName,
        age: ageNum,
      }, { onConflict: "user_id" });
    }
  };`,
  "handle signup with name/age/Supabase metadata"
);

// Replace the sign-in form UI with a tabbed sign-in / sign-up form
replace(
  `  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]">
        <div
          style={{
            background: "white",
            padding: 32,
            borderRadius: 16,
            border: "2px solid var(--border-light)",
            maxWidth: 400,
            width: "100%",
          }}
        >
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 16 }}>
            <Wallet size={22} className="text-[var(--primary-green)]" />
            <h1 style={{ fontSize: 24, fontWeight: 800, textAlign: "center" }}>
              Fundi Finance
            </h1>
          </div>
          <p
            style={{
              textAlign: "center",
              marginBottom: 24,
              color: "var(--text-light)",
            }}
          >
            Sign in to save your learning progress
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                fontSize: 14,
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                fontSize: 14,
              }}
            />
            {error && (
              <p style={{ color: "var(--error-red)", fontSize: 13 }}>
                {error}
              </p>
            )}
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleSignIn}
            >
              Sign In
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: "100%" }}
              onClick={handleSignUp}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }`,
  `  const inputStyle = {
    padding: 12, borderRadius: 8,
    border: "1px solid var(--border-light)", fontSize: 14, width: "100%",
    boxSizing: "border-box" as const,
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]" style={{ padding: 16 }}>
        <div style={{ background: "white", padding: 28, borderRadius: 20, border: "2px solid var(--border-light)", maxWidth: 420, width: "100%" }}>
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 20 }}>
            <Wallet size={22} className="text-[var(--primary-green)]" />
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Fundi Finance</h1>
          </div>

          {/* Tab switcher */}
          <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 10, padding: 3, marginBottom: 20 }}>
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(null); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                  background: mode === m ? "white" : "transparent",
                  color: mode === m ? "var(--color-primary)" : "#888",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}>
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "signup" && (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="text" placeholder="First name" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <input type="text" placeholder="Last name" value={lastName}
                    onChange={(e) => setLastName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                </div>
                <input type="number" placeholder="Age" value={age} min={13} max={120}
                  onChange={(e) => setAge(e.target.value)} style={inputStyle} />
              </>
            )}
            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            {error && <p style={{ color: "var(--error-red)", fontSize: 13, margin: 0 }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }}
              onClick={mode === "signin" ? handleSignIn : handleSignUp}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            {mode === "signin" && (
              <p style={{ textAlign: "center", fontSize: 13, color: "#888", margin: 0 }}>
                New here?{" "}
                <button onClick={() => setMode("signup")}
                  style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  Create a free account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }`,
  "replace AuthGate UI with tabbed sign-in/sign-up form"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. ProfileView — read name from Supabase session, not hardcoded
// ─────────────────────────────────────────────────────────────────────────────

// Pass currentUser to ProfileView from Home
replace(
  `        {route.name === "profile" && (
          <ProfileView userData={userData} onSignOut={handleProfileSignOut} />
        )}`,
  `        {route.name === "profile" && (
          <ProfileView userData={userData} onSignOut={handleProfileSignOut} currentUser={null} />
        )}`,
  "pass currentUser to ProfileView (placeholder — real value via hook below)"
);

// Update ProfileView signature and name/initials logic
replace(
  `function ProfileView({
  userData,
  onSignOut,
}: {
  userData: UserData;
  onSignOut: () => void;
}) {
  const [selectedBadge, setSelectedBadge] = useState<null | {
    name: string; desc: string; icon: React.ReactNode;
  }>(null);

  // Derive initials from email
  const email = typeof window !== "undefined"
    ? (document.cookie.match(/fundi-name=([^;]+)/)?.[1] ?? "") : "";
  const initials = "KN"; // fallback; Supabase user metadata not in scope here`,
  `function ProfileView({
  userData,
  onSignOut,
  currentUser,
}: {
  userData: UserData;
  onSignOut: () => void;
  currentUser: any;
}) {
  const [selectedBadge, setSelectedBadge] = useState<null | {
    name: string; desc: string; icon: React.ReactNode;
  }>(null);
  const [profileName, setProfileName] = useState<string>("");

  // Load display name from Supabase user metadata or profiles table
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata;
      if (meta?.full_name) {
        setProfileName(meta.full_name);
      } else if (data.user?.email) {
        setProfileName(data.user.email.split("@")[0]);
      }
    });
  }, []);

  const displayName = profileName || "Learner";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "FL";`,
  "ProfileView reads name from Supabase"
);

// Fix hardcoded "Kwanele" display name
replace(
  `        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 2 }}>Kwanele</div>`,
  `        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 2 }}>{displayName.split(" ")[0]}</div>`,
  "show real first name on profile"
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. LeaderboardView — real data with display names from profiles table
// ─────────────────────────────────────────────────────────────────────────────

replace(
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
  `function LeaderboardView({ xp, currentUserId }: { xp: number; currentUserId?: string }) {
  const [leaders, setLeaders] = useState<{ id: string; name: string; xp: number; isYou: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        const myId = user?.id ?? currentUserId ?? null;

        // 2. Fetch top 20 by XP
        const { data: progressRows, error } = await supabase
          .from("user_progress")
          .select("user_id, xp")
          .order("xp", { ascending: false })
          .limit(20);

        if (error || !progressRows) { setLoading(false); return; }

        // 3. Fetch display names from profiles table
        const userIds = progressRows.map((r: any) => r.user_id);
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const nameMap: Record<string, string> = {};
        (profileRows ?? []).forEach((p: any) => {
          if (p.full_name) nameMap[p.user_id] = p.full_name.split(" ")[0]; // first name only
        });

        const rows = progressRows.map((row: any) => {
          const isYou = row.user_id === myId;
          const name = isYou
            ? "You"
            : (nameMap[row.user_id] ?? "Learner " + row.user_id.slice(0, 4).toUpperCase());
          return { id: row.user_id, name, xp: row.xp ?? 0, isYou };
        });

        // Ensure current user is in the list even if outside top 20
        const alreadyIn = rows.some((r) => r.isYou);
        if (!alreadyIn && myId) {
          const myName = user?.user_metadata?.full_name?.split(" ")[0] ?? "You";
          rows.push({ id: myId, name: "You (" + myName + ")", xp, isYou: true });
          rows.sort((a, b) => b.xp - a.xp);
        }

        setLeaders(rows);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [xp, currentUserId]);

  const MEDALS = ["🥇", "🥈", "🥉"];

  return (
    <main className="main-content main-with-stats">
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Leaderboard</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24, fontSize: 14 }}>
        All players ranked by XP
      </p>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>Loading...</div>
      ) : leaders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>
          No players yet. Be the first to earn XP!
        </div>
      ) : (
        <div className="leaderboard-table">
          {leaders.map((leader, index) => (
            <div
              key={leader.id}
              className="leaderboard-row"
              style={leader.isYou ? { background: "rgba(0,122,77,0.08)", border: "1.5px solid var(--color-primary)" } : undefined}
            >
              <div className={\`leaderboard-rank \${index < 3 ? "top" : ""}\`}>
                {index < 3 ? MEDALS[index] : index + 1}
              </div>
              <div className="leaderboard-avatar" style={{ background: leader.isYou ? "var(--color-primary)" : "#eee", color: leader.isYou ? "white" : "#555" }}>
                {leader.name[0].toUpperCase()}
              </div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">
                  {leader.name}
                  {leader.isYou && (
                    <span style={{ marginLeft: 6, fontSize: 11, background: "var(--color-primary)", color: "white", borderRadius: 999, padding: "2px 7px", fontWeight: 700 }}>You</span>
                  )}
                </div>
              </div>
              <div className="leaderboard-xp" style={{ color: leader.isYou ? "var(--color-primary)" : undefined }}>
                {leader.xp.toLocaleString()} XP
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}`,
  "rewrite LeaderboardView with real names from profiles table"
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Course colour passed through to LessonView progress bar
// ─────────────────────────────────────────────────────────────────────────────

// Add courseAccent prop to LessonView signature
replace(
  `  goBack?: () => void;
  courseId?: string;
}) {
  const step = lessonState.steps[lessonState.stepIndex];`,
  `  goBack?: () => void;
  courseId?: string;
  courseAccent?: string;
}) {
  const step = lessonState.steps[lessonState.stepIndex];`,
  "add courseAccent prop to LessonView"
);

// Use courseAccent in progress bar fill
replace(
  `          <div className="lesson-progress-bar" style={{ flex: 1, margin: 0 }}>
            <div className="lesson-progress-fill" style={{ width: \`\${progress}%\` }} />
          </div>`,
  `          <div className="lesson-progress-bar" style={{ flex: 1, margin: 0 }}>
            <div className="lesson-progress-fill" style={{
              width: \`\${progress}%\`,
              background: courseAccent
                ? \`linear-gradient(90deg, \${courseAccent}99 0%, \${courseAccent} 100%)\`
                : undefined,
            }} />
          </div>`,
  "apply course colour to lesson progress bar"
);

// Pass courseAccent from Home when rendering LessonView
// We need to derive the course colour from the courseId
replace(
  `            courseId={currentLessonState.courseId ?? undefined}
          />`,
  `            courseId={currentLessonState.courseId ?? undefined}
            courseAccent={(() => {
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
  "pass courseAccent to LessonView"
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Course map tint + lesson node colours
// ─────────────────────────────────────────────────────────────────────────────

// Pass course colour into CourseView so the whole map is tinted
replace(
  `        {route.name === "course" && currentCourse && (
          <CourseView
            course={currentCourse}
            isLessonCompleted={isLessonCompleted}
            goBack={() => setRoute({ name: "learn" })}`,
  `        {route.name === "course" && currentCourse && (
          <CourseView
            course={currentCourse}
            isLessonCompleted={isLessonCompleted}
            courseIndex={CONTENT_DATA.courses.findIndex(c => c.id === currentCourse.id)}
            goBack={() => setRoute({ name: "learn" })}`,
  "pass courseIndex to CourseView"
);

// Update CourseView signature to accept courseIndex
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
}) {`,
  `function CourseView({
  course,
  isLessonCompleted,
  goBack,
  goToLesson,
  courseIndex = 0,
}: {
  course: Course;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goBack: () => void;
  goToLesson: (lessonId: string) => void;
  courseIndex?: number;
}) {
  const colour = COURSE_COLOURS[courseIndex % COURSE_COLOURS.length];`,
  "CourseView receives courseIndex and derives colour"
);

// Tint the course map header with the course colour
replace(
  `        <div className="course-map-header">
          <div style={{ marginBottom: 16 }}>
            <CourseIcon name={course.icon} size={64} />
          </div>
          <h2 className="course-map-title">{course.title}</h2>
          <p className="course-map-description">{course.description}</p>
        </div>`,
  `        <div className="course-map-header" style={{ background: colour.bg, borderRadius: 16, padding: "20px 16px", marginBottom: 8 }}>
          <div style={{ marginBottom: 12, color: colour.accent }}>
            <CourseIcon name={course.icon} size={56} />
          </div>
          <h2 className="course-map-title" style={{ color: colour.accent }}>{course.title}</h2>
          <p className="course-map-description">{course.description}</p>
        </div>`,
  "tint course map header with course colour"
);

// Apply course accent colour to playable and completed nodes
replace(
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
  `                if (state === "completed") {
                  nodeClass += " completed";
                  icon = <CheckCircle2 size={28} className="text-current" />;
                } else if (state === "locked" || state === "coming_soon") {
                  nodeClass += " coming-soon";
                  icon = <Lock size={28} className="text-current" />;
                } else if (state === "playable") {
                  nodeClass += " playable";
                }`,
  "clean up playable node comment"
);

// Pass colour to the lesson node inline styles
replace(
  `                return (
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
                    >`,
  `                return (
                  <div key={lesson.id}>
                    <div
                      className={nodeClass}
                      onClick={handleClick}
                      style={{
                        cursor: state === "playable" || state === "completed" ? "pointer" : "default",
                        background: state === "completed" ? "#007A4D" :
                                    state === "playable" ? colour.bg : undefined,
                        borderColor: state === "completed" ? "#007A4D" :
                                     state === "playable" ? colour.accent : undefined,
                        color: state === "completed" ? "white" :
                               state === "playable" ? colour.accent : undefined,
                        borderWidth: state === "playable" ? 2.5 : undefined,
                        boxShadow: state === "playable" ? \`0 0 0 0 \${colour.accent}55\` : undefined,
                        animation: state === "playable" ? "node-pulse 2s ease-in-out infinite" : undefined,
                      }}
                    >`,
  "apply course colour to lesson nodes"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Trophy: gold not red
// ─────────────────────────────────────────────────────────────────────────────

// Both MCQ and true-false completion screens have Trophy
// Replace both instances of the accent Trophy with gold
replace(
  `                      <Trophy
                        size={48}
                        className="text-[var(--color-accent)]"
                        style={{ margin: "0 auto" }}
                      />
                    </div>
                    <FundiCharacter expression="celebrating"`,
  `                      <Trophy
                        size={48}
                        style={{ color: "#FFB612", margin: "0 auto" }}
                      />
                    </div>
                    <FundiCharacter expression="celebrating"`,
  "trophy gold colour - MCQ completion"
);

replace(
  `                      <Trophy
                        size={48}
                        className="text-[var(--color-accent)]"
                        style={{ margin: "0 auto" }}
                      />
                    </div>
                    <FundiCharacter expression="celebrating" size={100}`,
  `                      <Trophy
                        size={48}
                        style={{ color: "#FFB612", margin: "0 auto" }}
                      />
                    </div>
                    <FundiCharacter expression="celebrating" size={100}`,
  "trophy gold colour - true-false completion"
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Fundi mascot: remove animations (stationary)
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `          <FundiCharacter expression="thinking" size={80} style={{ margin: "0 auto 12px", animation: "fundi-bob 2s ease-in-out infinite" }} />`,
  `          <FundiCharacter expression="thinking" size={80} style={{ margin: "0 auto 12px" }} />`,
  "remove thinking animation from Fundi"
);

replace(
  `                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px", animation: "fundi-bounce 0.8s ease-in-out infinite" }} />`,
  `                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px" }} />`,
  "remove celebrating animation from Fundi (MCQ)"
);

replace(
  `                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px", animation: "fundi-bounce 0.8s ease-in-out infinite" }} />`,
  `                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px" }} />`,
  "remove celebrating animation from Fundi (true-false)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Badge earned celebration after lesson complete
// Inject badge check into nextStep — after completeLesson, compute newly earned
// badges, then set a state variable. LessonView shows a badge modal before
// navigating back to course.
// ─────────────────────────────────────────────────────────────────────────────

// Add newlyEarnedBadges state to useFundiState return and Home
replace(
  `  const [currentLessonState, setCurrentLessonState] = useState<{`,
  `  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);

  const [currentLessonState, setCurrentLessonState] = useState<{`,
  "add newlyEarnedBadges state"
);

// Export from hook
replace(
  `    isLessonCompleted,
    completeLesson,
    currentLessonState,
    setCurrentLessonState,
  };`,
  `    isLessonCompleted,
    completeLesson,
    currentLessonState,
    setCurrentLessonState,
    newlyEarnedBadges,
    setNewlyEarnedBadges,
  };`,
  "export newlyEarnedBadges from hook"
);

// Destructure in Home
replace(
  `    hearts,
    maxHearts,
    loseHeart,
    gainHeart,
    heartsRegenInfo,
  } = useFundiState();`,
  `    hearts,
    maxHearts,
    loseHeart,
    gainHeart,
    heartsRegenInfo,
    newlyEarnedBadges,
    setNewlyEarnedBadges,
  } = useFundiState();`,
  "destructure newlyEarnedBadges in Home"
);

// In nextStep, compute newly earned badges before navigating
replace(
  `      setRoute({ name: "course", courseId: currentLessonState.courseId! });`,
  `      // Compute newly earned badges for celebration modal
      const tc = progress.completedLessons.size + 1; // +1 because completeLesson just ran
      const str = progress.streak;
      const xpv = progress.xp + totalXP;
      const perf = parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10);
      const THRESHOLDS = [
        { id: "lesson-1-badge", test: tc >= 1, name: "First Step" },
        { id: "lesson-5-badge", test: tc >= 5, name: "Getting Going" },
        { id: "lesson-10-badge", test: tc >= 10, name: "On a Roll" },
        { id: "lesson-25-badge", test: tc >= 25, name: "Dedicated" },
        { id: "streak-3-badge", test: str >= 3, name: "3 Day Streak" },
        { id: "streak-7-badge", test: str >= 7, name: "Week Warrior" },
        { id: "xp-100-badge", test: xpv >= 100, name: "First 100" },
        { id: "xp-500-badge", test: xpv >= 500, name: "XP Builder" },
        { id: "perfect-1-badge", test: perf >= 1, name: "Flawless" },
      ];
      const earned = JSON.parse(localStorage.getItem("fundi-earned-badges") ?? "[]") as string[];
      const justEarned = THRESHOLDS.filter(b => b.test && !earned.includes(b.id)).map(b => b.id);
      if (justEarned.length > 0) {
        localStorage.setItem("fundi-earned-badges", JSON.stringify([...earned, ...justEarned]));
        setNewlyEarnedBadges(justEarned);
      } else {
        setRoute({ name: "course", courseId: currentLessonState.courseId! });
      }`,
  "compute newly earned badges in nextStep"
);

// Add badge celebration handler: when newlyEarnedBadges is set, show a modal
// in Home JSX. When dismissed, navigate back to course.
replace(
  `        {route.name === "calculator" && <CalculatorView />}

        <StatsPanel userData={userData} />`,
  `        {route.name === "calculator" && <CalculatorView />}

        {/* Badge earned celebration modal */}
        {newlyEarnedBadges.length > 0 && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div style={{
              background: "var(--color-surface)", borderRadius: 24,
              padding: "32px 24px", width: "100%", maxWidth: 360, textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>🏅</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, color: "var(--color-primary)" }}>
                Badge Earned!
              </div>
              {newlyEarnedBadges.map((id) => {
                const NAMES: Record<string, string> = {
                  "lesson-1-badge": "First Step", "lesson-5-badge": "Getting Going",
                  "lesson-10-badge": "On a Roll", "lesson-25-badge": "Dedicated",
                  "streak-3-badge": "3 Day Streak", "streak-7-badge": "Week Warrior",
                  "xp-100-badge": "First 100", "xp-500-badge": "XP Builder",
                  "perfect-1-badge": "Flawless",
                };
                return (
                  <div key={id} style={{
                    margin: "8px auto", background: "var(--color-bg)",
                    borderRadius: 12, padding: "10px 16px", fontWeight: 700,
                    color: "var(--color-text-primary)", fontSize: 15,
                    border: "1.5px solid var(--color-border)",
                  }}>
                    {NAMES[id] ?? id}
                  </div>
                );
              })}
              <p style={{ color: "var(--color-text-secondary)", margin: "16px 0", fontSize: 14, lineHeight: 1.5 }}>
                Keep learning to unlock more badges. Check them all in your profile!
              </p>
              <button className="btn btn-primary" onClick={() => {
                setNewlyEarnedBadges([]);
                setRoute({ name: "course", courseId: currentLessonState.courseId! });
              }}>Continue</button>
            </div>
          </div>
        )}

        <StatsPanel userData={userData} />`,
  "badge earned celebration modal in Home"
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. CSS fixes — correct answer green, completed node green, progress bar
// ─────────────────────────────────────────────────────────────────────────────

const CSS_FILE = path.join(__dirname, "../src/app/globals.css");
let css = fs.readFileSync(CSS_FILE, "utf8");

const NEW_CSS = `
/* ── Correct answer: green background, white text ──────────── */
.option-button.correct {
  background: #007A4D !important;
  border-color: #007A4D !important;
  color: white !important;
}

.option-button.incorrect {
  background: #E03C31 !important;
  border-color: #E03C31 !important;
  color: white !important;
}

/* ── Completed lesson node: green ────────────────────────────── */
.lesson-node.completed {
  background: #007A4D !important;
  border-color: #007A4D !important;
  color: white !important;
}

/* ── Feedback banner colours ─────────────────────────────────── */
.feedback.correct {
  background: #E8F5EE !important;
  border-color: #007A4D !important;
  color: #005C35 !important;
}

.feedback.incorrect {
  background: #FFF0EF !important;
  border-color: #E03C31 !important;
  color: #B02020 !important;
}

/* ── Lesson progress bar: default SA green ───────────────────── */
.lesson-progress-fill {
  background: linear-gradient(90deg, #005C35 0%, #007A4D 100%);
  transition: width 0.3s ease;
}
`;

if (!css.includes("option-button.correct {")) {
  css += NEW_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log("✅  answer/node/feedback colours added to globals.css");
} else {
  // Update existing rules
  css = css
    .replace(/\.option-button\.correct \{[^}]+\}/g, `.option-button.correct {
  background: #007A4D !important;
  border-color: #007A4D !important;
  color: white !important;
}`)
    .replace(/\.option-button\.incorrect \{[^}]+\}/g, `.option-button.incorrect {
  background: #E03C31 !important;
  border-color: #E03C31 !important;
  color: white !important;
}`);
  fs.writeFileSync(CSS_FILE, css);
  console.log("✅  updated answer colour CSS in globals.css");
}

// ─────────────────────────────────────────────────────────────────────────────
// Write page.tsx
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(PAGE, src);
console.log("\n" + changed + " changes made to page.tsx.");
console.log("\nDON'T FORGET — run this SQL in Supabase SQL editor:");
console.log(`
  CREATE TABLE IF NOT EXISTS profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    age integer,
    created_at timestamptz DEFAULT now()
  );
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
  CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

  -- Also add display_name to user_progress for leaderboard fallback:
  ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS display_name text;
`);
console.log("\nNext: npm run build");
