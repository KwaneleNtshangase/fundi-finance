/**
 * Playwright Global Setup — saves auth state once so all tests reuse it.
 * Signs in once per run, saves cookies + localStorage to e2e/.auth/user.json.
 * All test files load this state via playwright.config.ts storageState.
 *
 * KEY FIX: The app reads localStorage("fundi-onboarded") on first render to decide
 * whether to show OnboardingView vs AuthGate (sign-in). A fresh CI context has no
 * localStorage, so the app defaults to OnboardingView, which has no "Sign In" button.
 * We pre-seed localStorage BEFORE the page loads to force AuthGate (sign-in mode).
 */
import { chromium, FullConfig } from "@playwright/test";
import { BASE_URL, TEST_EMAIL, TEST_PASSWORD } from "./helpers";
import * as fs from "fs";
import * as path from "path";

const AUTH_FILE = path.join(__dirname, ".auth", "user.json");

export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  console.log(`\n[global-setup] Starting auth for ${TEST_EMAIL}`);

  // ── Step 1: Navigate and inject localStorage before React renders ──────────
  // We need fundi-onboarded set so the app shows AuthGate (sign-in) instead of
  // OnboardingView. We do this by intercepting the first load and setting it.
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  // Inject the key as early as possible so React state initialiser picks it up
  await page.evaluate(() => {
    localStorage.setItem("fundi-onboarded", "1");
    localStorage.setItem("fundi-last-route", "learn");
  });

  // Reload so React re-runs with the seeded localStorage
  await page.reload({ waitUntil: "domcontentloaded" });

  // Wait for splash + React to render (up to 25s)
  await page
    .waitForFunction(
      () => {
        const hasEmail = !!document.querySelector('input[type="email"]');
        const hasLearn = [...document.querySelectorAll("*")].some(
          (el) => el.textContent?.trim() === "Learn"
        );
        return hasEmail || hasLearn;
      },
      { timeout: 25_000 }
    )
    .catch(() => {});

  // ── Step 2: Check if already authenticated ────────────────────────────────
  const alreadyIn = await page
    .locator("text=Learn")
    .first()
    .isVisible()
    .catch(() => false);

  if (alreadyIn) {
    console.log("[global-setup] Session already active — skipping sign-in.");
  } else {
    // ── Step 3: Sign in ──────────────────────────────────────────────────────
    // At this point the app should be in AuthGate sign-in mode (default mode="signin")
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });

    // If still showing signup mode, switch to sign-in
    // (look for small nav links like "Already have an account? Sign in")
    const switchLinks = page.locator("button, a").filter({
      hasText: /already.have|sign\s+in|log\s+in/i,
    });
    const switchCount = await switchLinks.count().catch(() => 0);
    if (switchCount > 0) {
      for (let i = 0; i < switchCount; i++) {
        const el = switchLinks.nth(i);
        const text = await el.textContent().catch(() => "");
        if (text && text.length < 50 && (await el.isVisible().catch(() => false))) {
          await el.click();
          await page.waitForTimeout(400);
          break;
        }
      }
    }

    // Fill credentials
    await emailInput.fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);

    // Click the Sign In button — text-based selector only (no CSS class dependency)
    // The button is <button className="btn btn-primary" onClick={handleSignIn}>Sign In</button>
    const signInBtn = page.locator("button").filter({ hasText: /^Sign In$/ }).first();
    await signInBtn.waitFor({ state: "visible", timeout: 10_000 });
    await signInBtn.click();

    // Wait for app shell to confirm successful login
    await page
      .locator("text=Learn")
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
    console.log("[global-setup] Sign-in successful.");
  }

  // ── Step 4: Dismiss username modal if present ─────────────────────────────
  await page.waitForTimeout(800);
  const usernameInput = page
    .locator(
      'input[placeholder*="username" i], input[placeholder*="Username" i]'
    )
    .first();
  if (await usernameInput.isVisible().catch(() => false)) {
    await usernameInput.fill("e2e_test_bot");
    const saveBtn = page
      .locator("button")
      .filter({ hasText: /^(Save|Continue|Done)$/ })
      .first();
    if (await saveBtn.isVisible()) await saveBtn.click();
    await page.waitForTimeout(1000);
  }

  // ── Step 5: Persist auth state ────────────────────────────────────────────
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  console.log(`[global-setup] Auth state saved → ${AUTH_FILE}`);

  await browser.close();
}
