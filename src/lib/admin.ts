import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin identity helpers for internal routes.
 *
 * Authority order (both conditions are OR'd in requireAdmin):
 *   1. DB flag   - profiles.is_admin = true (authoritative; survives env changes)
 *   2. Env list  - ADMIN_EMAILS env var (secondary; useful for bootstrap / CI)
 *
 * The old hardcoded FALLBACK_ADMIN_EMAILS list has been removed so the system
 * fails closed: if neither the DB flag nor ADMIN_EMAILS is set, no one is admin.
 */

/**
 * Returns the list of admin emails from the ADMIN_EMAILS env var.
 * Returns an empty array if the env var is not set - fails closed.
 */
export function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS ?? "";
  return env.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/**
 * Returns true if the given email is in the ADMIN_EMAILS env var list.
 * Secondary check - only consulted when ADMIN_EMAILS is explicitly configured.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = getAdminEmails();
  // Fail closed: if the env var is not set the list is empty, so this returns false.
  return list.length > 0 && list.includes(email.toLowerCase());
}

/**
 * Authoritative admin check via the DB flag.
 *
 * Queries profiles.is_admin using the passed service-role client
 * (which bypasses RLS), so the result is trustworthy regardless of
 * the caller's own RLS policies.
 *
 * Returns false on any error (network, missing row, etc.) - fails closed.
 *
 * @param adminClient  A Supabase client created with the service-role key.
 * @param userId       The auth.users.id of the user to check.
 */
export async function isAdminUser(
  adminClient: SupabaseClient,
  userId: string,
): Promise<boolean> {
  try {
    const { data, error } = await adminClient
      .from("profiles")
      .select("is_admin")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return false;
    return (data as { is_admin: boolean }).is_admin === true;
  } catch {
    return false;
  }
}
