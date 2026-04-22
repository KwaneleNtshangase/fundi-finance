/**
 * Playwright Global Setup — saves auth state once so all tests reuse it.
 *
 * STRATEGY: Pre-seed localStorage via addInitScript (runs before React/Supabase
 * even initialises) so the Supabase JS client reads a valid session on its very
 * first getSession() call and the app renders the authenticated shell directly.
 *
 * Steps:
 * 1. Call Supabase REST API (Node.js fetch) to get a fresh session token.
 * 2. Use page.addInitScript() to inject the session + app flags into localStorage
 *    before any page script runs.
 * 3. Navigate to the app — React boots with session already present.
 * 4. Wait for the app shell ("Learn") to confirm auth succeeded.
 * 5. Save storageState for all tests to reuse.
 */
import { chromium, FullConfig } from "@playwright/test";
import { BASE_URL, TEST_EMAIL, TEST_PASSWORD } from "./helpers";
import * as fs from "fs";
import * as path from "path";

const AUTH_FILE = path.join(__dirname, ".auth", "user.json");
const SUPABASE_URL = "https://bcwoyhypupuezgcbwqfy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd295aHlwdXB1ZXpnY2J3cWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODkxOTMsImV4cCI6MjA4OTI2NTE5M30.cWB39zrGUl3X31FWK2bhAdLmBkRkgvwlszGdw35fVBg";
const SUPABASE_STORAGE_KEY = "sb-bcwoyhypupuezgcbwqfy-auth-token";

export default async function globalSetup(_config: FullConfig) {
  // ── Step 1: Get session from Supabase REST API ─────────────────────────────
  console.log(`\n[global-setup] Authenticating ${TEST_EMAIL} via Supabase API…`);

  const authResp = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    }
  );

  if (!authResp.ok) {
    throw new Error(
      `[global-setup] Supabase auth failed (${authResp.status}): ${await authResp.text()}`
    );
  }

  const session = (await authResp.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: { id: string; email: string };
  };
  const expiresAt = Math.floor(Date.now() / 1000) + session.expires_in;
  console.log(`[global-setup] Got session for ${session.user.email}`);

  // ── Step 2: Launch browser & pre-seed localStorage via init script ─────────
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });

  // addInitScript runs before ANY page script — Supabase JS will read our
  // localStorage values on its very first initialisation call.
  const sessionPayload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: expiresAt,
    token_type: session.token_type,
    user: session.user,
  });

  await context.addInitScript(
    ({ storageKey, sessionJson, onboarded, lastRoute }) => {
      try {
        localStorage.setItem(storageKey, sessionJson);
        localStorage.setItem("fundi-onboarded", onboarded);
        localStorage.setItem("fundi-last-route", lastRoute);
      } catch (_) {
        // localStorage may not be available in some frames — safe to ignore
      }
    },
    {
      storageKey: SUPABASE_STORAGE_KEY,
      sessionJson: sessionPayload,
      onboarded: "1",
      lastRoute: "learn",
    }
  );

  const page = await context.newPage();

  // ── Step 3: Navigate — app should boot authenticated ──────────────────────
  console.log("[global-setup] Navigating to app…");
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  // Wait for splash + React hydration (up to 30s)
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll("*")].some(
          (el) => el.textContent?.trim() === "Learn"
        ),
      { timeout: 30_000 }
    )
    .catch(() => {});

  const appLoaded = await page
    .locator("text=Learn")
    .first()
    .isVisible()
    .catch(() => false);

  if (!appLoaded) {
    // Check what's actually on screen for debugging
    const bodyText = await page.locator("body").innerText().catch(() => "?");
    const snippet = bodyText.replace(/\s+/g, " ").slice(0, 300);
    console.log(`[global-setup] App not loaded — body preview: "${snippet}"`);

    // One retry in case React needed an extra tick
    await page.reload({ waitUntil: "domcontentloaded" });
    await page
      .locator("text=Learn")
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
  }

  console.log("[global-setup] ✅ App shell confirmed.");

  // ── Step 4: Dismiss any post-login modal ──────────────────────────────────
  await page.waitForTimeout(600);
  const usernameInput = page
    .locator('input[placeholder*="username" i]')
    .first();
  if (await usernameInput.isVisible().catch(() => false)) {
    await usernameInput.fill("e2e_test_bot");
    const saveBtn = page
      .locator("button")
      .filter({ hasText: /^(Save|Continue|Done)$/ })
      .first();
    if (await saveBtn.isVisible()) await saveBtn.click();
    await page.waitForTimeout(800);
  }

  // ── Step 5: Save storage state ────────────────────────────────────────────
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  console.log(`[global-setup] Auth state saved → ${AUTH_FILE}`);

  await browser.close();
}
