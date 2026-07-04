/**
 * Shared test helpers for Fundi Finance E2E tests.
 * Credentials are set via environment variables so they never live in source.
 *
 * Usage:
 *   TEST_EMAIL=test@example.com TEST_PASSWORD=secret npx playwright test
 */
import { Page, expect } from "@playwright/test";

export const TEST_EMAIL = process.env.TEST_EMAIL ?? "e2e-test@fundiapp.co.za";
export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "FundiE2E_Test#2026";
export const BASE_URL =
  process.env.BASE_URL ?? "https://fundiapp.co.za";

/** Sign in with email/password, wait for the app shell to appear */
export async function signIn(page: Page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  // Splash animation can take 20-25s on slow CI runners — wait for the landing page or form directly.
  const signInButton = page.locator('button', { hasText: /I Already Have an Account/i }).first();
  // Try to wait for the landing screen button; if visible, click it.
  try {
    await signInButton.waitFor({ state: "visible", timeout: 15_000 });
    await signInButton.click();
  } catch (e) {
    // If button doesn't appear, maybe we're already on the signin form.
  }

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  await emailInput.fill(TEST_EMAIL);
  await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  // Click the primary sign-in/up submit button (has data-testid="auth-submit")
  await page.locator('[data-testid="auth-submit"]').click();
  // Wait for app container — means auth succeeded and app loaded
  await expect(page.locator(".app-container").first()).toBeVisible({
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
  // Wait for the course page to load (compilation in dev mode can take time)
  await page.locator(".lesson-node").first().waitFor({ state: "visible", timeout: 15_000 });
  
  // Prefer an uncompleted playable lesson
  let lesson = page.locator(".lesson-node.playable:not(.completed)").first();
  if (await lesson.count() === 0) {
    // Fall back to any playable/completed lesson
    lesson = page.locator(".lesson-node.playable, .lesson-node.completed").first();
  }
  
  await lesson.click();
  // Wait for lesson page to load
  await page.locator(".step-title, h2, .question-text").first().waitFor({ state: "visible", timeout: 15_000 });
  const title = await page.locator(".step-title, h2, .question-text").first().textContent();
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
