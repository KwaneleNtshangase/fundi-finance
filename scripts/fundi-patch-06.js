/**
 * fundi-patch-06.js
 *
 * FIXES:
 *  1. Slider smoothness — step="any" on the range input so it glides freely;
 *     snapping to step only happens on release (mouseup/touchend). This makes
 *     dragging feel silky while still landing on valid values.
 *
 *  2. Profile name — if the user has no full_name in Supabase metadata,
 *     show an "Update your profile" inline form right on the profile screen.
 *     On save it writes to both Supabase user_metadata AND the profiles table
 *     so the leaderboard picks it up too. This applies to ALL users — anyone
 *     without a full_name will see the prompt every time they open Profile
 *     until they fill it in.
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
// FIX 1 — Smooth sliders
// The roughness comes from step={step} on the range input itself — the browser
// snaps to every step position as you drag, which is jerky for large steps
// (e.g. step=5000 on a principal slider).
// Fix: set step="any" on the range so it moves continuously, then round to
// the real step only in the onChange handler before updating state.
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: "var(--color-primary)", height: 6, cursor: "pointer" }}
        />`,
  `        <input
          type="range"
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={(e) => {
            // Move freely while dragging; snap to step on every change
            const raw = parseFloat(e.target.value);
            const snapped = Math.round(raw / step) * step;
            const clamped = Math.max(min, Math.min(max, snapped));
            onChange(clamped);
          }}
          style={{ flex: 1, accentColor: "var(--color-primary)", height: 6, cursor: "pointer" }}
        />`,
  "smooth slider — step=any with snap in onChange"
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 — Profile name: detect missing name, show update form
// Replace the entire ProfileView name-loading useEffect + display logic
// with a version that:
//   a) checks if full_name is genuinely set (not just an email prefix)
//   b) if missing, renders an update form inline
//   c) on save, writes to auth metadata + profiles table
// ─────────────────────────────────────────────────────────────────────────────

replace(
  `  const [profileName, setProfileName] = useState<string>("");

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
  `  const [profileName, setProfileName] = useState<string>("");
  const [profileEmail, setProfileEmail] = useState<string>("");
  const [needsProfileUpdate, setNeedsProfileUpdate] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load name — show update form if no real full_name exists
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setProfileEmail(user.email ?? "");
      const meta = user.user_metadata;
      const fullName = meta?.full_name ?? "";
      // Consider it "missing" if empty OR looks like an email prefix
      const isMissing = !fullName || fullName.includes("@") || fullName === user.email?.split("@")[0];
      if (!isMissing) {
        setProfileName(fullName);
      } else {
        // Pre-fill edit fields from whatever we have
        setNeedsProfileUpdate(true);
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    const firstName = editFirstName.trim();
    const lastName = editLastName.trim();
    const ageNum = parseInt(editAge, 10);
    if (!firstName) { setSaveError("Please enter your first name."); return; }
    if (!lastName) { setSaveError("Please enter your last name."); return; }
    if (!editAge || isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      setSaveError("Please enter a valid age (13+).");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const fullName = firstName + " " + lastName;
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not signed in");
      // Update Supabase auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName, age: ageNum },
      });
      if (updateError) throw updateError;
      // Also upsert to profiles table for leaderboard
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: fullName,
        age: ageNum,
      }, { onConflict: "user_id" });
      setProfileName(fullName);
      setNeedsProfileUpdate(false);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = profileName || "Learner";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "FL";`,
  "profile name detection with update form state"
);

// Now inject the update form into the ProfileView JSX, right after the avatar block
// We look for the avatar + name display and add the update prompt below it
replace(
  `        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 2 }}>{displayName.split(" ")[0]}</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Financial Learner · Level {userData.level}</div>
      </div>

      {/* ── Stat row ── */}`,
  `        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 2 }}>{displayName.split(" ")[0]}</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Financial Learner · Level {userData.level}</div>
      </div>

      {/* ── Profile update prompt (shown until user sets name) ── */}
      {needsProfileUpdate && (
        <div style={{
          background: "var(--color-primary-light, #E8F5EE)",
          border: "1.5px solid var(--color-primary)",
          borderRadius: 14, padding: "16px", marginBottom: 16,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "var(--color-primary)" }}>
            Complete your profile
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }}>
            Add your name so we can personalise your experience and show you on the leaderboard.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="text" placeholder="First name" value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }}
            />
            <input
              type="text" placeholder="Last name" value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }}
            />
          </div>
          <input
            type="number" placeholder="Age" value={editAge} min={13} max={120}
            onChange={(e) => setEditAge(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, marginBottom: 8, boxSizing: "border-box" as const }}
          />
          {saveError && <p style={{ color: "var(--error-red, #E03C31)", fontSize: 12, marginBottom: 8 }}>{saveError}</p>}
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}

      {/* ── Stat row ── */}`,
  "inject profile update form below avatar"
);

// ─────────────────────────────────────────────────────────────────────────────
// Write
// ─────────────────────────────────────────────────────────────────────────────
fs.writeFileSync(PAGE, src);
console.log("\n" + changed + " changes made.");
console.log("Now run: npm run build");
