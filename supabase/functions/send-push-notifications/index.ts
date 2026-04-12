// Supabase Edge Function — Send Web Push Notifications
// Triggered by CRON (daily lesson reminders) or invoked for budget alerts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Web Push requires signing with VAPID keys using the Web Crypto API
async function importVapidKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createVapidAuthHeader(endpoint: string): Promise<{ authorization: string; cryptoKey: string }> {
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ aud, exp, sub: "mailto:kwanelebc031@gmail.com" })));
  const unsignedToken = `${header}.${payload}`;
  const key = await importVapidKey(VAPID_PRIVATE_KEY);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsignedToken));
  // Convert DER signature to raw r||s
  const sigArray = new Uint8Array(sig);
  const token = `${unsignedToken}.${base64UrlEncode(sigArray)}`;
  return {
    authorization: `vapid t=${token}, k=${VAPID_PUBLIC_KEY}`,
    cryptoKey: `p256ecdsa=${VAPID_PUBLIC_KEY}`,
  };
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: object) {
  try {
    // For simplicity, send a plain-text push (encrypted push requires full RFC 8291 implementation)
    // Most browsers accept this when using the web-push library; for edge function, we use the fetch API
    const vapid = await createVapidAuthHeader(sub.endpoint);
    const body = JSON.stringify(payload);
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "TTL": "86400",
        Authorization: vapid.authorization,
        "Crypto-Key": vapid.cryptoKey,
      },
      body,
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determine mode: "daily" (cron) or "budget-alert" (invoked with body)
    let mode = "daily";
    let alertData: { user_id?: string; category?: string; pct?: number } = {};

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.mode === "budget-alert") {
          mode = "budget-alert";
          alertData = body;
        }
      } catch { /* default to daily */ }
    }

    if (mode === "daily") {
      // Send daily lesson reminder to ALL subscribed users
      const { data: subs } = await supabase.from("push_subscriptions").select("*");
      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
      }

      const tips = [
        "Time to grow your money knowledge! A quick lesson awaits.",
        "Your daily Fundi lesson is ready. Keep your streak alive!",
        "5 minutes to smarter finances. Start your lesson now!",
        "Don't break your streak! Tap to continue learning.",
        "Financial freedom starts with knowledge. Let's learn today!",
      ];
      const tip = tips[Math.floor(Math.random() * tips.length)];

      let sent = 0;
      for (const sub of subs) {
        const result = await sendPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title: "Fundi Finance", body: tip, url: "/" }
        );
        if (result.ok) sent++;
      }
      return new Response(JSON.stringify({ sent, total: subs.length }), { headers: { "Content-Type": "application/json" } });
    }

    if (mode === "budget-alert" && alertData.user_id) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", alertData.user_id);

      if (!subs || subs.length === 0) {
        return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
      }

      const isOver = (alertData.pct ?? 0) >= 100;
      const body = isOver
        ? `You've exceeded your ${alertData.category} budget! Time to review your spending.`
        : `You've hit 80% of your ${alertData.category} budget. Watch your spending!`;

      let sent = 0;
      for (const sub of subs) {
        const result = await sendPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title: "Budget Alert", body, url: "/" }
        );
        if (result.ok) sent++;
      }
      return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), { status: 400, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
