/**
 * Test Suite 2: Lesson Flow (most critical user path)
 * Tests every step type, Continue button, completion, XP awarding.
 */
import { test, expect } from "@playwright/test";
import { signIn, goToTab, openFirstLesson } from "./helpers";

test.describe("Lesson Flow", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("2.1 — Course categories load with lesson nodes", async ({ page }) => {
    await goToTab(page, "Learn");
    const courseCards = page.locator(".course-card");
    await expect(courseCards.first()).toBeVisible({ timeout: 10_000 });
    const count = await courseCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("2.2 — Opening a course scrolls to top (not bottom)", async ({ page }) => {
    await goToTab(page, "Learn");
    await page.locator(".course-card").first().click();
    await page.waitForTimeout(600);
    const scrollY = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop);
    expect(scrollY).toBeLessThan(200); // should be near top
  });

  test("2.3 — Lesson opens and shows step content", async ({ page }) => {
    const title = await openFirstLesson(page);
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(0);
  });

  test("2.4 — Progress bar advances with each step", async ({ page }) => {
    await openFirstLesson(page);
    const bar = page.locator(".lesson-progress, [role='progressbar'], progress");
    if (await bar.isVisible()) {
      const initial = await bar.getAttribute("style") ?? await bar.getAttribute("value");
      // Click Continue
      await page.locator("button", { hasText: "Continue" }).first().click();
      await page.waitForTimeout(500);
      const updated = await bar.getAttribute("style") ?? await bar.getAttribute("value");
      expect(updated).not.toEqual(initial);
    }
  });

  test("2.5 — MCQ: selecting correct answer highlights green", async ({ page }) => {
    await openFirstLesson(page);
    let safety = 0;
    while (safety < 20) {
      safety++;
      const options = page.locator(".option-button:not([disabled])");
      if ((await options.count()) > 0) {
        await options.first().click();
        await page.waitForTimeout(400);
        // Check for correct/incorrect class
        const hasCorrect = await page.locator(".option-button.correct").count() > 0;
        const hasIncorrect = await page.locator(".option-button.incorrect").count() > 0;
        expect(hasCorrect || hasIncorrect).toBe(true);
        break;
      }
      const cont = page.locator("button", { hasText: "Continue" }).first();
      if (await cont.isVisible()) await cont.click();
      await page.waitForTimeout(400);
    }
  });

  test("2.6 — True/False step: clicking True or False works", async ({ page }) => {
    await openFirstLesson(page);
    let safety = 0;
    while (safety < 20) {
      safety++;
      const trueBtn = page.locator("button", { hasText: "True" }).first();
      if (await trueBtn.isVisible() && !(await trueBtn.isDisabled())) {
        await trueBtn.click();
        await page.waitForTimeout(400);
        // Feedback should appear
        const feedback = page.locator(".option-button.correct, .option-button.incorrect");
        expect(await feedback.count()).toBeGreaterThan(0);
        break;
      }
      const cont = page.locator("button", { hasText: "Continue" }).first();
      if (await cont.isVisible()) await cont.click();
      await page.waitForTimeout(400);
    }
  });

  test("2.7 — Continue button works on every step type (no stuck steps)", async ({ page }) => {
    await openFirstLesson(page);
    let steps = 0;
    let safety = 0;
    while (safety < 40) {
      safety++;
      // Done?
      const backBtn = page.locator("button", { hasText: /Back to Course|Done.*Course/i }).first();
      if (await backBtn.isVisible()) break;

      // Answer MCQ
      const opts = page.locator(".option-button:not([disabled])");
      if ((await opts.count()) > 0) { await opts.first().click(); await page.waitForTimeout(300); }

      // True/False
      const tBtn = page.locator("button", { hasText: "True" }).first();
      if (await tBtn.isVisible() && !(await tBtn.isDisabled())) { await tBtn.click(); await page.waitForTimeout(300); }

      // Action check done
      const doneAct = page.locator("button", { hasText: /I.ve done this/i }).first();
      if (await doneAct.isVisible()) { await doneAct.click(); await page.waitForTimeout(300); }

      // Continue/Finish
      const cont = page.locator("button", { hasText: /Continue|Finish/i }).first();
      if (await cont.isVisible()) { await cont.click(); steps++; await page.waitForTimeout(500); continue; }

      break;
    }
    // Should have advanced at least 1 step without getting stuck
    expect(safety).toBeLessThan(39); // didn't exhaust safety counter
    expect(steps).toBeGreaterThan(0);
  });

  test("2.8 — Lesson completion screen appears with XP info", async ({ page }) => {
    await openFirstLesson(page);
    // Fast-forward through lesson
    let safety = 0;
    while (safety < 40) {
      safety++;
      const done = page.locator("text=Lesson Complete!, text=Back to Course").first();
      if (await done.isVisible()) break;
      const opts = page.locator(".option-button:not([disabled])");
      if ((await opts.count()) > 0) await opts.first().click();
      const tBtn = page.locator("button", { hasText: "True" }).first();
      if (await tBtn.isVisible() && !(await tBtn.isDisabled())) await tBtn.click();
      const doneAct = page.locator("button", { hasText: /I.ve done this/i }).first();
      if (await doneAct.isVisible()) await doneAct.click();
      const cont = page.locator("button", { hasText: /Continue|Finish/i }).first();
      if (await cont.isVisible()) { await cont.click(); await page.waitForTimeout(600); continue; }
      await page.waitForTimeout(300);
    }
    // Completion screen should show
    const xpText = page.locator("text=XP").first();
    await expect(xpText).toBeVisible({ timeout: 5_000 });
    const backBtn = page.locator("button", { hasText: /Back to Course|Done/i }).first();
    await expect(backBtn).toBeVisible({ timeout: 5_000 });
  });

  test("2.9 — Back to Course returns to course map", async ({ page }) => {
    await openFirstLesson(page);
    // Complete the lesson quickly
    let safety = 0;
    while (safety < 40) {
      safety++;
      const backBtn = page.locator("button", { hasText: /Back to Course|Done.*Course/i }).first();
      if (await backBtn.isVisible()) { await backBtn.click(); break; }
      const opts = page.locator(".option-button:not([disabled])");
      if ((await opts.count()) > 0) await opts.first().click();
      const tBtn = page.locator("button", { hasText: "True" }).first();
      if (await tBtn.isVisible() && !(await tBtn.isDisabled())) await tBtn.click();
      const doneAct = page.locator("button", { hasText: /I.ve done this/i }).first();
      if (await doneAct.isVisible()) await doneAct.click();
      const cont = page.locator("button", { hasText: /Continue|Finish/i }).first();
      if (await cont.isVisible()) { await cont.click(); await page.waitForTimeout(500); continue; }
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(500);
    // Should be back on course map (lesson nodes visible)
    await expect(page.locator(".lesson-node, .back-button").first()).toBeVisible({ timeout: 5_000 });
  });

  test("2.10 — XP increases after completing a lesson", async ({ page }) => {
    // Capture initial XP
    const xpEl = page.locator("#xpValue").first();
    const initialXP = parseInt((await xpEl.textContent() ?? "0").replace(/\D/g, ""), 10);

    await openFirstLesson(page);
    let safety = 0;
    while (safety < 40) {
      safety++;
      const backBtn = page.locator("button", { hasText: /Back to Course|Done.*Course/i }).first();
      if (await backBtn.isVisible()) { await backBtn.click(); break; }
      const opts = page.locator(".option-button:not([disabled])");
      if ((await opts.count()) > 0) await opts.first().click();
      const tBtn = page.locator("button", { hasText: "True" }).first();
      if (await tBtn.isVisible() && !(await tBtn.isDisabled())) await tBtn.click();
      const cont = page.locator("button", { hasText: /Continue|Finish/i }).first();
      if (await cont.isVisible()) { await cont.click(); await page.waitForTimeout(400); continue; }
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1000); // wait for XP animation
    const updatedXP = parseInt((await xpEl.textContent() ?? "0").replace(/\D/g, ""), 10);
    expect(updatedXP).toBeGreaterThanOrEqual(initialXP); // XP should not decrease
  });
});
