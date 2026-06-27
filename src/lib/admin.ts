/**
 * Admin allowlist for the internal bug console. Set ADMIN_EMAILS in Vercel
 * (comma-separated) to control who can see/triage bugs. Falls back to the
 * known owner addresses so it works before the env var is configured.
 */
const FALLBACK_ADMIN_EMAILS = ["kwanelebc031@gmail.com", "mntshangase97@gmail.com"];

export function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS ?? "";
  const list = env.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.length ? list : FALLBACK_ADMIN_EMAILS;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
