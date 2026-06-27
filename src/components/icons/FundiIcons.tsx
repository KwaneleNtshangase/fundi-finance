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
