/**
 * fundi-patch-11.js — Wire up new courses + dark mode CSS
 *
 * 1. Add new course IDs to ACCENTS map in LessonView courseAccent prop
 * 2. Add dark mode CSS variables to globals.css
 * 3. Pass weeklyChallenge props to LearnView
 * 4. Fix courseIndex2 courseIndex inconsistency from patch-09
 */

const fs = require("fs");
const path = require("path");

const PAGE = path.join(__dirname, "../src/app/page.tsx");
let src = fs.readFileSync(PAGE, "utf8");

let changed = 0;
function rep(from, to, label) {
  if (!src.includes(from)) { console.warn("⚠️  NOT FOUND: " + label); return; }
  src = src.replace(from, to); changed++;
  console.log("✅  " + label);
}

// 1. Add new courses to ACCENTS map
rep(
  `              const ACCENTS: Record<string, string> = {
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
              };`,
  `              const ACCENTS: Record<string, string> = {
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
                "retirement": "#00BFA5",
                "rand-economy": "#FFB612",
                "crypto-basics": "#7C4DFF",
                "business-finance": "#3B7DD8",
              };`,
  "add new courses to ACCENTS map"
);

// 2. Pass weekly challenge props to LearnView (and add them to LearnView signature)
rep(
  `        {route.name === "learn" && (
          <LearnView
            courses={CONTENT_DATA.courses}
            isLessonCompleted={isLessonCompleted}
            goToCourse={(courseId) => {
              track("course_opened", { course_id: courseId });
              setRoute({ name: "course", courseId });
            }}
          />
        )}`,
  `        {route.name === "learn" && (
          <LearnView
            courses={CONTENT_DATA.courses}
            isLessonCompleted={isLessonCompleted}
            goToCourse={(courseId) => {
              track("course_opened", { course_id: courseId });
              setRoute({ name: "course", courseId });
            }}
            weeklyChallenge={weeklyChallenge}
            challengeProgress={challengeProgress}
            challengeComplete={challengeComplete}
            challengeRewardClaimed={challengeRewardClaimed}
            claimChallengeReward={claimChallengeReward}
          />
        )}`,
  "pass weekly challenge props to LearnView"
);

// 3. Add weekly challenge props to LearnView signature
rep(
  `function LearnView({
  courses,
  isLessonCompleted,
  goToCourse,
}: {
  courses: Course[];
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goToCourse: (courseId: string) => void;
}) {
  const [search, setSearch] = useState("");`,
  `function LearnView({
  courses,
  isLessonCompleted,
  goToCourse,
  weeklyChallenge,
  challengeProgress,
  challengeComplete,
  challengeRewardClaimed,
  claimChallengeReward,
}: {
  courses: Course[];
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goToCourse: (courseId: string) => void;
  weeklyChallenge?: { text: string; target: number; xp: number; id: string; unit: string };
  challengeProgress?: number;
  challengeComplete?: boolean;
  challengeRewardClaimed?: boolean;
  claimChallengeReward?: () => void;
}) {
  const [search, setSearch] = useState("");`,
  "add weekly challenge to LearnView signature"
);

// 4. Fix the courseIndex2 rendering reference in the course card map
// The issue is that after adding filteredCourses, we have courseIndex as the
// filteredCourses array index but need the original index for colour
rep(
  `          const colour = COURSE_COLOURS[courseIndex2 % COURSE_COLOURS.length];`,
  `          const colour = COURSE_COLOURS[(originalIndex ?? courseIndex2) % COURSE_COLOURS.length];`,
  "fix colour index to use original course position"
);

// 5. Fix the closing bracket of filteredCourses.map — it's using courseIndex2
// which was the old variable name, needs to refer to the outer scope
// The courses-grid closing needs the extra variable
rep(
  `        {filteredCourses.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)" }}>
          No courses found for "{search}"
        </div>
      )}`,
  `        {filteredCourses.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)" }}>
          No courses found for &quot;{search}&quot;
        </div>
      )}`,
  "fix JSX quote escaping in search empty state"
);

// 6. Dark mode CSS variables
const CSS_FILE = path.join(__dirname, "../src/app/globals.css");
let css = fs.readFileSync(CSS_FILE, "utf8");

const DARK_MODE_CSS = `
/* ── Dark mode via .dark class on <html> ─────────────────────────────────── */
html.dark {
  --color-bg: #0D1117;
  --color-surface: #161B22;
  --color-border: #30363D;
  --color-text-primary: #E6EDF3;
  --color-text-secondary: #8B949E;
  --color-primary: #3FB68B;
  --color-secondary: #FFB612;
  --bg-gray: #0D1117;
  --border-light: #30363D;
  --text-light: #8B949E;
}

html.dark body {
  background: #0D1117;
  color: #E6EDF3;
}

html.dark .course-card {
  background: #161B22 !important;
}

html.dark input,
html.dark textarea {
  background: #161B22;
  color: #E6EDF3;
  border-color: #30363D;
}

html.dark .option-button {
  background: #161B22;
  color: #E6EDF3;
  border-color: #30363D;
}

html.dark .option-button:hover:not(:disabled) {
  background: #1F2937;
}
`;

if (!css.includes("html.dark")) {
  css += DARK_MODE_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log("✅  dark mode CSS added to globals.css");
} else {
  console.log("⏭   dark mode CSS already present");
}

fs.writeFileSync(PAGE, src);
console.log(`\n${changed} changes to page.tsx`);
console.log("Now run: npm run build");
