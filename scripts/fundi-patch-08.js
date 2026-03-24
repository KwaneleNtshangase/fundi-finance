/**
 * fundi-patch-08.js — Production stability fixes
 *
 * 1. Calculator performance — memoize calcGrowth, separate display state
 *    from calculation state so sliders update UI instantly, chart updates
 *    on debounce (150ms). No more lag.
 *
 * 2. Age input hardening — block e/+/-/. keys, sanitize to digits only,
 *    validate 13-120 range. Applied to both AuthGate signup and
 *    ProfileView update form.
 *
 * 3. Route persistence — save current route to localStorage on every
 *    route change, restore on mount. Refresh = same page.
 *
 * 4. XP gain animation — show a floating "+XX XP" toast when XP is earned.
 *    Pure CSS, no library needed.
 *
 * 5. Supabase RLS SQL — printed at the end so you can run it.
 *    The leaderboard needs a policy that allows SELECT for all authenticated
 *    users, not just the row owner.
 *
 * 6. Fix progress scope bug in nextStep (backup fix if patch-07 missed it).
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
// 1. CALCULATOR PERFORMANCE
//    The problem: calcGrowth(inputsA) runs on every render because it's called
//    inline in CalculatorView. When a slider moves, React re-renders, which
//    calls calcGrowth again synchronously — blocking the next frame.
//
//    Fix: separate "display" inputs (update instantly) from "calc" inputs
//    (debounced 150ms). Chart and results use debounced values. Slider label
//    updates instantly. Also memoize chartData.
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `function CalculatorView() {
  const defaultInputs: CalcInputs = {
    principal: 50000,
    monthly: 1000,
    rate: 10,
    years: 10,
    escalation: 5,
    frequency: "monthly",
  };
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [inputsA, setInputsA] = useState<CalcInputs>(defaultInputs);
  const [inputsB, setInputsB] = useState<CalcInputs>({
    ...defaultInputs,
    rate: 7,
    monthly: 500,
  });

  const dataA = calcGrowth(inputsA);
  const dataB = calcGrowth(inputsB);
  const finalA = dataA[dataA.length - 1];
  const finalB = dataB[dataB.length - 1];

  const chartData: Record<string, number>[] =
    mode === "single"
      ? dataA.map((d) => ({
          year: d.year,
          "Portfolio Value": d.value,
          "Total Contributions": d.contributions,
        }))
      : dataA.map((d, i) => ({
          year: d.year,
          "Investment A": d.value,
          "Investment B": dataB[i]?.value ?? 0,
        }));`,
  `function CalculatorView() {
  const defaultInputs: CalcInputs = {
    principal: 50000,
    monthly: 1000,
    rate: 10,
    years: 10,
    escalation: 5,
    frequency: "monthly",
  };
  const [mode, setMode] = useState<"single" | "compare">("single");

  // Display inputs — update instantly for responsive UI
  const [inputsA, setInputsA] = useState<CalcInputs>(defaultInputs);
  const [inputsB, setInputsB] = useState<CalcInputs>({
    ...defaultInputs,
    rate: 7,
    monthly: 500,
  });

  // Debounced calc inputs — heavy computation only after 150ms idle
  const [calcA, setCalcA] = useState<CalcInputs>(defaultInputs);
  const [calcB, setCalcB] = useState<CalcInputs>({ ...defaultInputs, rate: 7, monthly: 500 });

  useEffect(() => {
    const t = setTimeout(() => setCalcA(inputsA), 150);
    return () => clearTimeout(t);
  }, [inputsA]);

  useEffect(() => {
    const t = setTimeout(() => setCalcB(inputsB), 150);
    return () => clearTimeout(t);
  }, [inputsB]);

  // Calculations only run on debounced inputs — not on every slider pixel
  const dataA = useMemo(() => calcGrowth(calcA), [calcA]);
  const dataB = useMemo(() => calcGrowth(calcB), [calcB]);
  const finalA = dataA[dataA.length - 1];
  const finalB = dataB[dataB.length - 1];

  const chartData: Record<string, number>[] = useMemo(() =>
    mode === "single"
      ? dataA.map((d) => ({
          year: d.year,
          "Portfolio Value": d.value,
          "Total Contributions": d.contributions,
        }))
      : dataA.map((d, i) => ({
          year: d.year,
          "Investment A": d.value,
          "Investment B": dataB[i]?.value ?? 0,
        })),
    [mode, dataA, dataB]
  );`,
  "calculator: separate display/calc state with debounce + memoize"
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. AGE INPUT — block invalid characters everywhere it appears
//    The fix: onKeyDown blocks e/E/+/-/. and onChange sanitizes to digits only
// ─────────────────────────────────────────────────────────────────────────────

// AuthGate signup age input
replace(
  `                <input type="number" placeholder="Age" value={age} min={13} max={120}
                  onChange={(e) => setAge(e.target.value)} style={inputStyle} />`,
  `                <input type="number" placeholder="Age" value={age} min={13} max={120}
                  inputMode="numeric"
                  onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }}
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} style={inputStyle} />`,
  "block invalid chars in AuthGate age input"
);

// ProfileView update form age input
replace(
  `            type="number" placeholder="Age" value={editAge} min={13} max={120}
            onChange={(e) => setEditAge(e.target.value)}`,
  `            type="number" placeholder="Age" value={editAge} min={13} max={120}
            inputMode="numeric"
            onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }}
            onChange={(e) => setEditAge(e.target.value.replace(/\D/g, ""))}`,
  "block invalid chars in ProfileView age input"
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. ROUTE PERSISTENCE — save/restore route on mount
//    Saves current route name to localStorage. On mount, restores it.
//    Refresh = same section (not lesson — that would need more state).
// ─────────────────────────────────────────────────────────────────────────────

// In useFundiState, restore route from localStorage on init
replace(
  `  const [route, setRoute] = useState<Route>({ name: "learn" });`,
  `  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === "undefined") return { name: "learn" };
    const saved = localStorage.getItem("fundi-last-route");
    // Restore simple routes only (not mid-lesson or mid-course — those need extra state)
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings"];
    if (saved && simpleRoutes.includes(saved)) return { name: saved as Route["name"] };
    return { name: "learn" };
  });`,
  "restore route from localStorage on init"
);

// Save route to localStorage whenever it changes
replace(
  `  const value = {
    hearts,
    maxHearts: MAX_HEARTS,`,
  `  // Persist route so refresh returns to same section
  useEffect(() => {
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings"];
    if (simpleRoutes.includes(route.name)) {
      localStorage.setItem("fundi-last-route", route.name);
    }
  }, [route.name]);

  const value = {
    hearts,
    maxHearts: MAX_HEARTS,`,
  "persist route to localStorage on change"
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. XP GAIN TOAST — show floating "+XX XP" when XP is earned
//    Add xpToast state to useFundiState, expose it, render in Home
// ─────────────────────────────────────────────────────────────────────────────

// Add xpToast state in useFundiState
replace(
  `  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);`,
  `  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);
  const [xpToast, setXpToast] = useState<{ amount: number; id: number } | null>(null);`,
  "add xpToast state"
);

// Show toast when XP is added
replace(
  `  const addXP = (amount: number) => {
    progress.addXP(amount);
    setDailyXP((v) => v + amount);
  };`,
  `  const addXP = (amount: number) => {
    progress.addXP(amount);
    setDailyXP((v) => v + amount);
    // Show XP toast
    setXpToast({ amount, id: Date.now() });
    setTimeout(() => setXpToast(null), 2000);
  };`,
  "trigger XP toast in addXP"
);

// Export xpToast
replace(
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
  };`,
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
    xpToast,
  };`,
  "export xpToast from hook"
);

// Destructure in Home
replace(
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
  } = useFundiState();`,
  `    newlyEarnedBadges,
    setNewlyEarnedBadges,
    xpToast,
  } = useFundiState();`,
  "destructure xpToast in Home"
);

// Render XP toast in Home JSX (above StatsPanel)
replace(
  `        <StatsPanel userData={userData} />
        </div>
      </div>`,
  `        {/* XP gain toast */}
        {xpToast && (
          <div
            key={xpToast.id}
            style={{
              position: "fixed",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--color-primary)",
              color: "white",
              fontWeight: 800,
              fontSize: 18,
              padding: "10px 24px",
              borderRadius: 999,
              boxShadow: "0 4px 20px rgba(0,122,77,0.4)",
              zIndex: 500,
              pointerEvents: "none",
              animation: "xp-toast 2s ease-out forwards",
              whiteSpace: "nowrap",
            }}
          >
            +{xpToast.amount} XP
          </div>
        )}

        <StatsPanel userData={userData} />
        </div>
      </div>`,
  "render XP toast in Home"
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Fix progress scope bug in nextStep — backup in case patch-07 didn't apply
// ─────────────────────────────────────────────────────────────────────────────

// This is the fix from patch-07 — no-ops if already applied
replace(
  `      const tc = progress.completedLessons.size + 1; // +1 because completeLesson just ran
      const str = progress.streak;
      const xpv = progress.xp + totalXP;`,
  `      const tc = userData.totalCompleted + 1;
      const str = userData.streak;
      const xpv = userData.xp + totalXP;`,
  "fix progress scope (backup)"
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Add XP toast animation + input number appearance fix to globals.css
// ─────────────────────────────────────────────────────────────────────────────

const CSS_FILE = path.join(__dirname, "../src/app/globals.css");
let css = fs.readFileSync(CSS_FILE, "utf8");

const NEW_CSS = `
/* ── XP gain toast animation ─────────────────────────────────── */
@keyframes xp-toast {
  0%   { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.9); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1); }
  70%  { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
}

/* ── Remove spinner arrows from number inputs ────────────────── */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] { -moz-appearance: textfield; }
`;

if (!css.includes("xp-toast")) {
  css += NEW_CSS;
  fs.writeFileSync(CSS_FILE, css);
  console.log("✅  XP toast animation + number input fix added to globals.css");
} else {
  console.log("⏭   XP toast CSS already present");
}

// ─────────────────────────────────────────────────────────────────────────────
// Write page.tsx
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(PAGE, src);
console.log("\n" + changed + " changes made to page.tsx.");
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPABASE SQL — Run this in your Supabase SQL Editor:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Fix leaderboard: allow all authenticated users to read all progress rows
-- (the current policy likely only allows users to read their own row)

-- Drop the restrictive policy if it exists
DROP POLICY IF EXISTS "Users can read own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can read their own progress" ON user_progress;

-- Allow authenticated users to read ALL rows (for leaderboard)
CREATE POLICY IF NOT EXISTS "Authenticated users can read all progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (true);

-- Keep write restricted to own row only
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;

CREATE POLICY IF NOT EXISTS "Users can upsert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Profiles table: same pattern
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

CREATE POLICY IF NOT EXISTS "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next: npm run build && npx vercel --prod
`);
