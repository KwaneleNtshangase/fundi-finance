/**
 * Shared test helpers for Fundi Finance E2E tests.
 * Credentials are set via environment variables so they never live in source.
 *
 * Usage:
 *   TEST_EMAIL=test@example.com TEST_PASSWORD=secret npx playwright test
 */
import { Page, expect } from "@playwright/test";

export const TEST_EMAIL = process.env.TEST_EMAIL ?? "e2e-test@fundi.test";
export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "FundiTest123!";
export const BASE_URL =
  process.env.BASE_URL ?? "https://fundiapp.co.za";

/** Sign in with email/password, wait for the app shell to appear */
export async function signIn(page: Page) {
  await page.goto(BASE_URL);
  // Dismiss splash if present
  await page.waitForTimeout(1500);
  // Look for sign-in form
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 10_000 });
  await emailInput.fill(TEST_EMAIL);
  await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  // Wait for nav bar (Learn tab) — means auth succeeded and app loaded
  await expect(page.locator("text=Learn").first()).toBeVisible({
    timeout: 20_000,
  });
}

/** Navigate to a specific tab using the bottom nav */
export async function goToTab(page: Page, tab: "Learn" | "Calculate" | "Budget" | "Progress" | "Profile") {
  await page.locator(`text=${tab}`).first().click();
  await page.waitForTimeout(300);
}

/** Open the first available (non-locked) lesson and return its title */
export async function openFirstLesson(page: Page): Promise<string> {
  await goToTab(page, "Learn");
  // Click first course card
  await page.locator(".course-card").first().click();
  await page.waitForTimeout(500);
  // Click first playable lesson node
  const lesson = page.locator(".lesson-node.playable, .lesson-node.completed").first();
  await lesson.click();
  await page.waitForTimeout(600);
  const title = await page.locator(".step-title, h2").first().textContent();
  return title ?? "unknown";
}

/** Advance through all steps of an open lesson, answering MCQs with the first option */
export async function completeLesson(page: Page) {
  let safety = 0;
  while (safety < 40) {
    safety++;
    // Check if we're on a completion screen
    const done = page.locator("text=Back to Course, text=Done — Back to Course").first();
    if (await done.isVisible()) break;

    // MCQ — click first option
    const options = page.locator(".option-button:not([disabled])");
    if ((await options.count()) > 0) {
      await options.first().click();
      await page.waitForTimeout(400);
    }

    // True/False
    const truBtn = page.locator("button", { hasText: "True" }).first();
    if (await truBtn.isVisible() && !(await truBtn.isDisabled())) {
      await truBtn.click();
      await page.waitForTimeout(400);
    }

    // Continue / Finish / Next
    const continueBtn = page
      .locator("button", { hasText: /Continue|Finish|Next Lesson/ })
      .first();
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(600);
      continue;
    }

    // action-check: click "I've done this"
    const doneBtn = page.locator("button", { hasText: /I.ve done this|Done/i }).first();
    if (await doneBtn.isVisible()) {
      await doneBtn.click();
      await page.waitForTimeout(400);
      continue;
    }

    // If nothing found, break to avoid infinite loop
    break;
  }
}
