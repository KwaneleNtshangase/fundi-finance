// Supabase Edge Function — Delete Account (POPIA "right to erasure")
//
// Verifies the caller's JWT, then uses the service-role key to:
//   1. Delete all user-owned rows from public tables
//   2. Delete the auth.users row via the admin API
//
// This function MUST be deployed with --no-verify-jwt=false (default) so
// that Supabase injects the caller's Authorization header. We then
// re-verify the token server-side using the service-role client.
//
// Client invokes via supabase.functions.invoke("delete-account").

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Extract caller JWT and verify identity
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }
    const jwt = authHeader.replace("Bearer ", "");

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser(jwt);

    if (userErr || !user) {
      return json({ error: "Invalid or expired session" }, 401);
    }
    const userId = user.id;

    // 2. Service-role client — can delete auth.users rows
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3. Purge user-owned rows from every table we know about.
    //    These are fire-and-forget — we do not want one table's failure to
    //    block auth deletion, which is the POPIA-critical step.
    const userTables = [
      "user_progress",
      "profiles",
      "budget_entries",
      "custom_budget_categories",
      "push_subscriptions",
      "lesson_completions",
      "streak_history",
      "weekly_challenge_completions",
      "pinned_projections",
      "user_badges",
      "feedback",
    ];

    const purgeResults: Record<string, string> = {};
    for (const table of userTables) {
      try {
        const { error } = await admin.from(table).delete().eq("user_id", userId);
        purgeResults[table] = error ? `error: ${error.message}` : "ok";
      } catch (e) {
        purgeResults[table] = `error: ${(e as Error).message}`;
      }
    }

    // 4. Delete the auth user (POPIA Section 24 right to erasure)
    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (authErr) {
      return json(
        {
          error: `Failed to delete auth user: ${authErr.message}`,
          purgeResults,
        },
        500,
      );
    }

    return json({ ok: true, userId, purgeResults });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
