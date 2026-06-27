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

/* ── Learn — open book ─────────────────────────────────────────────────── */
export function FundiLearn(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M12 6.6C10.3 5.5 8.2 5 6 5.2c-.6.05-1 .55-1 1.15v9.6c0 .65.5 1.15 1.15 1.1 2-.15 4 .35 5.85 1.55" />
      <path d="M12 6.6C13.7 5.5 15.8 5 18 5.2c.6.05 1 .55 1 1.15v9.6c0 .65-.5 1.15-1.15 1.1-2-.15-4 .35-5.85 1.55" />
      <path d="M12 6.6v11.95" />
      <circle cx="20.4" cy="4.2" r="1.25" fill="currentColor" stroke="none" />
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

/* ── Budget — wallet with coin ─────────────────────────────────────────── */
export function FundiBudget(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M16 6H6.5A2.5 2.5 0 0 0 4 8.5v8A2.5 2.5 0 0 0 6.5 19h11a2.5 2.5 0 0 0 2.5-2.5V11" />
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H16a2 2 0 0 1 2 2v.5" />
      <path d="M20 11.2h-3.4a1.9 1.9 0 0 0 0 3.8H20a.6.6 0 0 0 .6-.6v-2.6a.6.6 0 0 0-.6-.6Z" fill="currentColor" opacity="0.28" stroke="none" />
      <circle cx="16.7" cy="13.1" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Goals — target / bullseye (echoes the Fundi mark) ─────────────────── */
export function FundiGoals(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.4" opacity="0.55" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* ── Progress — rising trend ───────────────────────────────────────────── */
export function FundiProgress(p: FundiIconProps) {
  return (
    <Icon {...p}>
      <path d="M4 16.5l4.8-4.8 3 3 5.2-5.4" />
      <path d="M14.4 9.3h3.4v3.4" />
      <circle cx="4" cy="16.5" r="1.15" fill="currentColor" stroke="none" />
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
