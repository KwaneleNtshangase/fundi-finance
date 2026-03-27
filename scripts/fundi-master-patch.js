/**
 * fundi-master-patch.js
 * ---------------------
 * Consolidated documentation of incremental patches (1–14+) applied to Fundi Finance.
 * This file does not run in production; it exists so developers can read one place for
 * the intent and history of changes that were previously scattered across many patch files.
 *
 * Patch themes (high level):
 * 1–2:   Calculator / investment UI, debounced inputs, growth charts (Recharts).
 * 3–4:   Auth (Supabase), profiles, leaderboard sync, hearts/streak UX.
 * 5–6:   Navigation, routing, mobile bottom bar, lesson flow and XP.
 * 7–8:   Dark mode tokens, globals.css fixes, leaderboard card contrast.
 * 9–10:  Analytics (PostHog), tracking helpers, env-based keys.
 * 11–12: Desktop shell: sidebar, stats panel, bottom nav visibility on large screens.
 * 13–14: Loading splash, logo pulse, weekly XP reset, cross-device sync notes.
 *
 * Later single-file consolidations (page.tsx / globals.css):
 * - Lesson exit confirmation modal; hearts only in FundiTopBar (not duplicated in LessonView).
 * - formatZAR / currency display using space thousands separators (en-ZA + comma replacement).
 * - Lucide icons instead of emoji across onboarding, learn, auth, modals, leaderboard.
 * - Book recommendations moved from Learn to Profile; financial guides external link.
 * - Course map “Next course” navigation; Profile CTA for finance professional (mailto).
 * - Auth loading: minimum splash duration + larger logo; sign-in header uses fundi-logo.png.
 * - Stats panel + sidebar dark mode use CSS variables (not raw white).
 * - Bottom navigation always visible (removed md:hidden), higher z-index.
 * - content.ts: prose punctuation normalized (em/en dash sequences with spaces → commas).
 *
 * When adding new behaviour, append a short dated note below:
 */

// eslint-disable-next-line no-console
console.info(
  "[fundi-master-patch] Documentation module loaded. See file header for patch history."
);
