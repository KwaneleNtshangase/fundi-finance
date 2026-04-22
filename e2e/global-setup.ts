/**
 * Playwright Global Setup — saves auth state once so all tests reuse it.
 * This cuts per-test sign-in overhead from ~35s to <2s.
 *
 * Runs before any test file. Saves cookies + localStorage to
 * e2e/.auth/user.json which tests load via `storageState`.
 */
import { chromium, FullConfig } from "@playwright/test";
import { BASE_URL, TEST_EMAIL, TEST_PASSWORD } from "./helpers";
import * as fs from "fs";
import * as path from "path";

const AUTH_FILE = path.join(__dirname, ".auth", "user.json");

export default async function globalSetup(_config: FullConfig) {
  // Always re-authenticate in CI for a fresh session
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 size
  });
  const page = await context.newPage();

  console.log(`\n[global-setup] Signing in as ${TEST_EMAIL}…`);

  // Navigate and wait for splash to clear
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

  // If already authenticated, skip sign-in
  const alreadyIn = await page
    .locator("text=Learn")
    .first()
    .isVisible()
    .catch(() => false);

  if (!alreadyIn) {
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: "visible", timeout: 20_000 });
    await emailInput.fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page
      .locator("text=Learn")
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
    console.log("[global-setup] Signed in successfully.");
  } else {
    console.log("[global-setup] Already authenticated.");
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
      .locator("button", { hasText: /Save|Continue|Done/i })
      .first();
    if (await saveBtn.isVisible()) await saveBtn.click();
    await page.waitForTimeout(1000);
  }

  // Save auth state
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  console.log(`[global-setup] Auth state saved to ${AUTH_FILE}`);

  await browser.close();
}
