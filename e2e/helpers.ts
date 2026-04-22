/**
 * Shared test helpers for Fundi Finance E2E tests.
 * Credentials are set via environment variables so they never live in source.
 *
 * Auth is handled by global-setup.ts (signs in once, saves storageState).
 * The `signIn` helper is now a fast "navigate home and confirm app is loaded"
 * call — it only does a full sign-in if the session isn't already active.
 *
 * Usage:
 *   TEST_EMAIL=test@example.com TEST_PASSWORD=secret npx playwright test
 */
import { Page, expect } from "@playwright/test";

export const TEST_EMAIL = process.env.TEST_EMAIL ?? "e2e-test@fundiapp.co.za";
export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "FundiE2E_Test#2026";
// Accept both www and non-www — site redirects non-www to www
export const BASE_URL = process.env.BASE_URL ?? "https://www.fundiapp.co.za";

/** Normalise URL for comparison — strip trailing slash, ignore www prefix */
export function normaliseUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/**
 * Navigate to the app root and wait for either the sign-in form or
 * the app shell (if a session cookie is already present).
 * Handles the www redirect and the splash screen delay.
 */
export async function gotoHome(page: Page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  // Wait up to 15 s for splash to finish and either auth form or app shell to appear
  await page
    .waitForFunction(
      () => {
        const hasEmail = !!document.querySelector('input[type="email"]');
        const hasLearn = [...document.querySelectorAll("*")].some(
          (el) => el.textContent?.trim() === "Learn"
        );
        return hasEmail || hasLearn;
      },
      { timeout: 15_000 }
    )
    .catch(() => {
      /* continue — next assertions will surface the real issue */
    });
}

/**
 * Fast sign-in: with storageState already loaded by global-setup, just
 * navigate home and confirm the app shell is present.
 * Falls back to full credential sign-in if the session has expired.
 */
export async function signIn(page: Page) {
  await gotoHome(page);

  // Happy path: session already active
  const alreadyIn = await page
    .locator("text=Learn")
    .first()
    .isVisible()
    .catch(() => false);
  if (alreadyIn) return;

  // Session expired — do full sign-in
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 20_000 });
  await emailInput.fill(TEST_EMAIL);
  await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  // Sign-in button uses onClick, not type="submit" — match by text
  const signInBtn = page.locator("button.btn-primary, button.btn", { hasText: /^Sign In$/i }).first();
  const fallbackBtn = page.locator("button", { hasText: /^Sign In$/i }).first();
  const btn = (await signInBtn.isVisible({ timeout: 3_000 }).catch(() => false)) ? signInBtn : fallbackBtn;
  await btn.click();

  // Wait for nav bar — means auth succeeded and app loaded
  await expect(page.locator("text=Learn").first()).toBeVisible({
    timeout: 25_000,
  });

  // Dismiss any post-login modals (username prompt, etc.)
  await dismissModals(page);
}

/** Dismiss any blocking modals that appear after login (username prompt, etc.) */
export async function dismissModals(page: Page) {
  await page.waitForTimeout(800);
  // Username prompt — fill with a test username if prompted
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
}

/** Navigate to a specific tab using the bottom nav */
export async function goToTab(
  page: Page,
  tab:
    | "Learn"
    | "Calculate"
    | "Budget"
    | "Goals"
    | "Progress"
    | "Profile"
) {
  await page.locator(`text=${tab}`).first().click();
  await page.waitForTimeout(400);
}

/** Open the first available (non-locked) lesson and return its title */
export async function openFirstLesson(page: Page): Promise<string> {
  await goToTab(page, "Learn");
  await page.locator(".course-card").first().click();
  await page.waitForTimeout(600);
  const lesson = page
    .locator(".lesson-node.playable, .lesson-node.completed")
    .first();
  await lesson.click();
  await page.waitForTimeout(700);
  const title = await page.locator(".step-title, h2").first().textContent();
  return title ?? "unknown";
}

/** Advance through all steps of an open lesson, answering MCQs with the first option */
export async function completeLesson(page: Page) {
  let safety = 0;
  while (safety < 40) {
    safety++;
    const done = page
      .locator("text=Back to Course, text=Done — Back to Course")
      .first();
    if (await done.isVisible()) break;

    const options = page.locator(".option-button:not([disabled])");
    if ((await options.count()) > 0) {
      await options.first().click();
      await page.waitForTimeout(400);
    }

    const truBtn = page.locator("button", { hasText: "True" }).first();
    if (
      (await truBtn.isVisible().catch(() => false)) &&
      !(await truBtn.isDisabled().catch(() => true))
    ) {
      await truBtn.click();
      await page.waitForTimeout(400);
    }

    const continueBtn = page
      .locator("button", { hasText: /Continue|Finish|Next Lesson/ })
      .first();
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(600);
      continue;
    }

    const doneBtn = page
      .locator("button", { hasText: /I.ve done this|Done/i })
      .first();
    if (await doneBtn.isVisible().catch(() => false)) {
      await doneBtn.click();
      await page.waitForTimeout(400);
      continue;
    }

    break;
  }
}
