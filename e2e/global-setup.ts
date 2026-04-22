/**
 * Playwright Global Setup — saves auth state once so all tests reuse it.
 *
 * STRATEGY: Bypass the browser UI entirely.
 * 1. Call the Supabase REST auth API via Node.js fetch to get a valid session.
 * 2. Navigate to the app and inject the session + required localStorage keys
 *    directly via page.evaluate() — before React reads them.
 * 3. Reload so the app boots with a live authenticated session.
 * 4. Confirm the app shell ("Learn") is visible, then save storageState.
 *
 * This avoids every fragile UI interaction (button text, splash timing, mode
 * switches) and is guaranteed to work as long as the Supabase credentials are
 * valid.
 */
import { chromium, FullConfig } from "@playwright/test";
import { BASE_URL, TEST_EMAIL, TEST_PASSWORD } from "./helpers";
import * as fs from "fs";
import * as path from "path";

const AUTH_FILE = path.join(__dirname, ".auth", "user.json");
const SUPABASE_URL = "https://bcwoyhypupuezgcbwqfy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd295aHlwdXB1ZXpnY2J3cWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODkxOTMsImV4cCI6MjA4OTI2NTE5M30.cWB39zrGUl3X31FWK2bhAdLmBkRkgvwlszGdw35fVBg";
// Supabase JS stores the session under this key (project ref extracted from URL)
const SUPABASE_STORAGE_KEY = "sb-bcwoyhypupuezgcbwqfy-auth-token";

export default async function globalSetup(_config: FullConfig) {
  // ── Step 1: Get a session token from Supabase via REST ─────────────────────
  console.log(`\n[global-setup] Authenticating ${TEST_EMAIL} via Supabase API…`);
  const authResp = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    }
  );

  if (!authResp.ok) {
    const body = await authResp.text();
    throw new Error(
      `[global-setup] Supabase auth failed (${authResp.status}): ${body}`
    );
  }

  const session = (await authResp.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: { id: string; email: string };
  };
  console.log(
    `[global-setup] Got token for ${session.user.email} (${session.user.id})`
  );

  // ── Step 2: Launch browser and inject session ──────────────────────────────
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  // Navigate first so we're on the right origin before writing localStorage
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  // Inject the Supabase session + app state flags
  const expiresAt = Math.floor(Date.now() / 1000) + session.expires_in;
  await page.evaluate(
    ({ key, sess, expiresAt }) => {
      // Supabase JS v2 session format
      const sessionPayload = {
        access_token: sess.access_token,
        refresh_token: sess.refresh_token,
        expires_in: sess.expires_in,
        expires_at: expiresAt,
        token_type: sess.token_type,
        user: sess.user,
      };
      localStorage.setItem(key, JSON.stringify(sessionPayload));

      // Tell the app this user has completed onboarding (skips OnboardingView)
      localStorage.setItem("fundi-onboarded", "1");
      localStorage.setItem("fundi-last-route", "learn");
    },
    { key: SUPABASE_STORAGE_KEY, sess: session, expiresAt }
  );

  // ── Step 3: Reload so React boots with the injected session ────────────────
  await page.reload({ waitUntil: "domcontentloaded" });

  // Wait up to 30s for the app shell to appear
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
    // Fallback: maybe the session injection timing is off — try a second reload
    console.log(
      "[global-setup] App shell not visible after first reload — retrying…"
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page
      .locator("text=Learn")
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
  }

  console.log("[global-setup] App shell confirmed — session active.");

  // ── Step 4: Dismiss username modal if present ─────────────────────────────
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

  // ── Step 5: Persist the full storage state ────────────────────────────────
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  console.log(`[global-setup] Auth state saved → ${AUTH_FILE}`);

  await browser.close();
}
