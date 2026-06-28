import type { CSSProperties } from "react";

/**
 * Fundi house-style icon set.
 *
 * One consistent visual language so the app stops looking like the default
 * Lucide/Feather set everyone uses:
 *   - 24x24 grid, rounded geometry, 2px rounded strokes
 *   - currentColor everywhere (so they inherit nav active/inactive colour)
 *   - a single filled "accent" per icon for warmth/signature
 *
 * Keep new icons in this file so the style stays coherent as we expand.
 */

export type FundiIconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

function Icon({
  size = 24,
  className,
  style,
  children,
}: FundiIconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ── Learn — open book with page detail + growth spark ─────────────────── */
export function FundiLearn(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M12 7C10 5.8 7.4 5.3 5 5.6c-.6.07-1 .57-1 1.15v9.4c0 .62.5 1.1 1.12 1.04 2.3-.26 4.7.3 6.88 1.71" />
      <path d="M12 7c2-1.2 4.6-1.7 7-1.4.6.07 1 .57 1 1.15v9.4c0 .62-.5 1.1-1.12 1.04-2.3-.26-4.7.3-6.88 1.71" />
      <path d="M12 7v11.15" />
      <path d="M6.6 9.3h3.1" opacity="0.5" />
      <path d="M6.6 11.7h2.6" opacity="0.5" />
      <path d="M14.3 9.3h3.1" opacity="0.5" />
      <path d="M14.8 11.7h2.6" opacity="0.5" />
      <path d="M20.1 3l.6 1.25 1.25.6-1.25.6-.6 1.25-.6-1.25L18.25 4.85l1.25-.6z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Calculate — calculator ────────────────────────────────────────────── */
export function FundiCalculate(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <rect x="5" y="2.6" width="14" height="18.8" rx="3.2" />
      <rect x="8" y="5.6" width="8" height="3.2" rx="1.2" fill="currentColor" opacity="0.28" stroke="none" />
      <circle cx="9" cy="13.2" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.2" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="1.05" fill="currentColor" stroke="none" />
      <rect x="14.4" y="12.3" width="2.6" height="5.6" rx="1.3" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Budget — wallet with note tucked in + clasp ───────────────────────── */
export function FundiBudget(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <rect x="3.5" y="8" width="17" height="11" rx="2.6" />
      <path d="M7 8V5.7c0-.6.55-1.05 1.15-.93l8.4 1.7c.5.1.85.55.85 1.06V8" />
      <rect x="14" y="11.3" width="6.5" height="4.4" rx="2.2" fill="currentColor" opacity="0.28" stroke="none" />
      <circle cx="17.3" cy="13.5" r="1.05" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Goals — arrow striking the bullseye (echoes the logo arrow) ────────── */
export function FundiGoals(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <circle cx="10.5" cy="13.5" r="6.8" />
      <circle cx="10.5" cy="13.5" r="3.2" opacity="0.5" />
      <circle cx="10.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M10.5 13.5 20 4" />
      <path d="M15.5 4H20v4.5" />
    </Icon>
  );
}

/* ── Progress — ascending bars + rising arrow (the logo's chart) ────────── */
export function FundiProgress(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <rect x="3.2" y="14" width="3.4" height="6" rx="1.2" fill="currentColor" opacity="0.3" stroke="none" />
      <rect x="10.3" y="11" width="3.4" height="9" rx="1.2" fill="currentColor" opacity="0.3" stroke="none" />
      <rect x="17.4" y="8" width="3.4" height="12" rx="1.2" fill="currentColor" opacity="0.3" stroke="none" />
      <path d="M4 12.5l5-3.8 3 2.2 7.2-6" />
      <path d="M15.4 4.9h4v4" />
    </Icon>
  );
}

/* ── Profile — person ──────────────────────────────────────────────────── */
export function FundiProfile(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="8.4" r="3.7" />
      <path d="M5.5 19.5c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2" />
    </Icon>
  );
}

/* ── Leaderboard — podium + spark ──────────────────────────────────────── */
export function FundiLeaderboard(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <rect x="3.5" y="12.5" width="4.7" height="7.5" rx="1.5" />
      <rect x="9.65" y="8.7" width="4.7" height="11.3" rx="1.5" />
      <rect x="15.8" y="14.5" width="4.7" height="5.5" rx="1.5" />
      <path d="M12 3.2l.85 1.7 1.7.85-1.7.85L12 9.15l-.85-1.7-1.7-.85 1.7-.85z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ═══ Gamification ═════════════════════════════════════════════════════════
   The "seen everywhere" set: streak, XP, hearts, freeze, level.
   Same house language so the top bar / stats feel custom, not stock.
   ════════════════════════════════════════════════════════════════════════ */

/* ── Streak — flame with an inner spark ────────────────────────────────── */
export function FundiStreak(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M12 2.5c.7 2.3 2.2 3.3 3.5 4.9 1.2 1.5 1.8 3 1.8 4.8a5.3 5.3 0 1 1-10.6 0c0-1.3.4-2.5 1.2-3.6.3.8.9 1.4 1.7 1.6-.5-1.9.2-3.8 2.4-7.7z" />
      <path d="M12 12.2c1.3 0 2.3 1 2.3 2.3S13.3 16.8 12 16.8s-2.3-1-2.3-2.3c0-.8.4-1.4 1-1.8.1.6.5 1 1 1.1-.3-.6-.1-1.1.3-1.6z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── XP — bold filled lightning bolt ───────────────────────────────────── */
export function FundiXP(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M13.1 2.2 4.7 12.9c-.5.6-.06 1.5.72 1.5H10l-1 6.8c-.13.85.95 1.25 1.4.55L19.3 11.1c.5-.62.05-1.5-.72-1.5H14l1-6.85c.13-.85-.95-1.25-1.4-.55z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Hearts — rounded heart (supports filled state for the row) ─────────── */
export function FundiHeart({ filled = true, ...p }: FundiIconProps & { filled?: boolean }) {
  return (
    <Icon {...p}>
      <path
        d="M12 20.5 4.4 13a4.7 4.7 0 0 1 6.6-6.7l1 .98 1-.98A4.7 4.7 0 0 1 19.6 13z"
        fill={filled ? "currentColor" : "none"}
      />
    </Icon>
  );
}

/* ── Freeze — shield with a snowflake ──────────────────────────────────── */
export function FundiFreeze(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M12 2.6 5.2 5.1c-.5.2-.8.6-.8 1.1v5c0 4.2 2.9 7.5 7.1 8.6.3.1.6.1.9 0 4.2-1.1 7.1-4.4 7.1-8.6v-5c0-.5-.3-.9-.8-1.1L12 2.6z" />
      <path d="M12 8v6.4M9.2 9.7l5.6 3.2M14.8 9.7l-5.6 3.2" />
      <circle cx="12" cy="11.3" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Level — medal with a star ─────────────────────────────────────────── */
export function FundiLevel(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.7 14.2 7.4 21l4.6-2.5L16.6 21l-1.3-6.8" />
      <path d="M12 6l.95 1.93 2.13.31-1.54 1.5.36 2.12L12 10.9l-1.9 1.06.36-2.12-1.54-1.5 2.13-.31z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ═══ Course / category tiles ══════════════════════════════════════════════
   Bespoke versions of the Learn-screen category icons.
   ════════════════════════════════════════════════════════════════════════ */

/* ── Shield — protection / emergency fund (shield + check) ──────────────── */
export function FundiShield(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M12 2.6 5.2 5.1c-.5.2-.8.6-.8 1.1v5c0 4.2 2.9 7.5 7.1 8.6.3.1.6.1.9 0 4.2-1.1 7.1-4.4 7.1-8.6v-5c0-.5-.3-.9-.8-1.1L12 2.6z" />
      <path d="M9 11.6l2.1 2.1 4-4.3" />
    </Icon>
  );
}

/* ── Credit card ───────────────────────────────────────────────────────── */
export function FundiCredit(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <rect x="2.5" y="5" width="19" height="14" rx="3" />
      <rect x="2.5" y="8.4" width="19" height="2.7" fill="currentColor" stroke="none" />
      <rect x="5.5" y="14.2" width="5" height="2.1" rx="1.05" fill="currentColor" opacity="0.35" stroke="none" />
    </Icon>
  );
}

/* ── Building — banks / institutions ───────────────────────────────────── */
export function FundiBuilding(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M4 9.6 12 4.5l8 5.1" />
      <path d="M4 9.9h16" />
      <path d="M6 10.2v7.3M10 10.2v7.3M14 10.2v7.3M18 10.2v7.3" />
      <path d="M3.4 20.4h17.2" />
      <circle cx="12" cy="7.3" r="0.95" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Briefcase — business / career ─────────────────────────────────────── */
export function FundiBriefcase(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="7.5" width="18" height="12" rx="2.6" />
      <path d="M8.5 7.5V6c0-.9.7-1.6 1.6-1.6h3.8c.9 0 1.6.7 1.6 1.6v1.5" />
      <rect x="3" y="11.4" width="18" height="2" fill="currentColor" opacity="0.3" stroke="none" />
      <rect x="10.4" y="11" width="3.2" height="3" rx="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Umbrella — insurance / cover ──────────────────────────────────────── */
export function FundiUmbrella(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M3.6 11a8.4 8.4 0 0 1 16.8 0c-1.35-.95-2.45-.95-3.4 0-.95-.9-2.45-.9-3.4 0-.95-.9-2.45-.9-3.4 0-.95-.95-2.05-.95-3.2 0z" />
      <path d="M12 11v7.4a2.2 2.2 0 0 0 4.4 0" />
      <circle cx="12" cy="3.4" r="0.95" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Flag — goals / milestones ─────────────────────────────────────────── */
export function FundiFlag(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M6 21V3.6" />
      <path d="M6 4.6h10.4c.85 0 1.3.95.72 1.6L15.7 8l1.42 1.8c.58.65.13 1.6-.72 1.6H6z" fill="currentColor" opacity="0.22" stroke="currentColor" />
    </Icon>
  );
}

/* ── Home — saving for a home ──────────────────────────────────────────── */
export function FundiHome(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M4 10.6 12 4l8 6.6" />
      <path d="M5.6 9.7V19a1 1 0 0 0 1 1H17.4a1 1 0 0 0 1-1V9.7" />
      <rect x="10" y="13.6" width="4" height="6.4" rx="0.6" fill="currentColor" opacity="0.3" stroke="none" />
    </Icon>
  );
}

/* ── Document — tax / paperwork ────────────────────────────────────────── */
export function FundiDoc(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M6 2.6h7.2L19 8.2v11.2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4.6a2 2 0 0 1 2-2z" />
      <path d="M13 2.8V8.4h5.4" />
      <path d="M8.6 12.6h6.8M8.6 15.6h6.8M8.6 18.4h4" opacity="0.55" />
    </Icon>
  );
}

/* ── Alert — emergencies / scams ───────────────────────────────────────── */
export function FundiAlert(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M6 18v-5.6a6 6 0 0 1 12 0V18" />
      <path d="M4.4 18.2h15.2" />
      <path d="M12 4.2V2.5M19.2 6.6l1.1-1.1M4.8 6.6 3.7 5.5" />
      <circle cx="12" cy="12.6" r="2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Brain — money psychology ──────────────────────────────────────────── */
export function FundiBrain(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M9.6 4.4a3 3 0 0 0-3 3 3 3 0 0 0-1.1 5.8v.8a3 3 0 0 0 4.1 2.8" />
      <path d="M14.4 4.4a3 3 0 0 1 3 3 3 3 0 0 1 1.1 5.8v.8a3 3 0 0 1-4.1 2.8" />
      <path d="M12 4.9v14.2" opacity="0.5" />
      <circle cx="9.1" cy="9.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.9" cy="9.6" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Trophy — wins / completion / leaderboard ──────────────────────────── */
export function FundiTrophy(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M6.5 4h11v4.5a5.5 5.5 0 0 1-11 0z" />
      <path d="M6.5 5.5H4.2c0 2.2 1 3.6 2.8 4M17.5 5.5h2.3c0 2.2-1 3.6-2.8 4" />
      <path d="M9.5 14.2 9 18h6l-.5-3.8" />
      <path d="M7.5 20.5h9" />
      <path d="M12 7.2l.7 1.4 1.5.22-1.1 1.06.26 1.52L12 10.7l-1.36.72.26-1.52-1.1-1.06 1.5-.22z" fill="currentColor" stroke="none" />
    </Icon>
  );
}
