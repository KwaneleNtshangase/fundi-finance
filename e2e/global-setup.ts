/**
 * Playwright Global Setup — saves auth state once so all tests reuse it.
 * Signs in once per run, saves cookies + localStorage to e2e/.auth/user.json.
 * All test files load this state via playwright.config.ts storageState.
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

  // Navigate and wait up to 20s for splash + React to render
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page
    .waitForFunction(
      () => {
        const hasEmail = !!document.querySelector('input[type="email"]');
        const hasLearn = [...document.querySelectorAll("*")].some(
          (el) => el.textContent?.trim() === "Learn"
        );
        return hasEmail || hasLearn;
      },
      { timeout: 20_000 }
    )
    .catch(() => {});

  // If app shell is visible, we're already authenticated
  const alreadyIn = await page
    .locator("text=Learn")
    .first()
    .isVisible()
    .catch(() => false);

  if (alreadyIn) {
    console.log("[global-setup] Session already active — skipping sign-in.");
  } else {
    // Wait for email input
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });

    // If we're on the signup/onboarding screen, navigate to sign-in mode.
    // Look for a "Sign In" tab / link — its text contains "sign in" or "log in".
    const switchLinks = page.locator("button, a").filter({
      hasText: /already.have|sign\s+in|log\s+in/i,
    });
    const switchCount = await switchLinks.count().catch(() => 0);
    if (switchCount > 0) {
      // Find one that's NOT the main submit button (the submit btn says "Sign In" too)
      for (let i = 0; i < switchCount; i++) {
        const el = switchLinks.nth(i);
        const text = await el.textContent().catch(() => "");
        // Click small nav links like "Already have an account? Sign in"
        if (text && text.length < 30 && (await el.isVisible().catch(() => false))) {
          await el.click();
          await page.waitForTimeout(400);
          break;
        }
      }
    }

    // Fill credentials
    await emailInput.fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);

    // Find the main submit button — try several strategies in order
    let clicked = false;

    // Strategy 1: any button with exact text "Sign In"
    const signInExact = page.locator("button").filter({ hasText: /^Sign In$/ });
    if (!clicked && (await signInExact.count().catch(() => 0)) > 0) {
      await signInExact.first().click();
      clicked = true;
    }

    // Strategy 2: any button with text containing "Sign In" or "Log In"
    if (!clicked) {
      const signInLoose = page
        .locator("button")
        .filter({ hasText: /Sign In|Log In/i })
        .first();
      if (await signInLoose.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await signInLoose.click();
        clicked = true;
      }
    }

    // Strategy 3: click the only visible primary-style button after filling form
    if (!clicked) {
      const primaryBtn = page.locator("button.btn-primary, button.btn").first();
      await primaryBtn.click();
      clicked = true;
    }

    if (!clicked) {
      throw new Error("[global-setup] Could not find the Sign In button");
    }

    // Wait for the app shell to confirm successful login
    await page
      .locator("text=Learn")
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
    console.log("[global-setup] Sign-in successful.");
  }

  // Dismiss username modal if present
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

  // Persist auth cookies + localStorage
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  console.log(`[global-setup] Auth state saved → ${AUTH_FILE}`);

  await browser.close();
}
