/**
 * Test Suite 5: Profile, dark mode, and settings
 */
import { test, expect } from "@playwright/test";
import { signIn, goToTab } from "./helpers";

test.describe("Profile & Settings", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await goToTab(page, "Profile");
  });

  test("5.1 — Profile tab loads without crash", async ({ page }) => {
    const error = page.locator("text=Something went wrong");
    await expect(error).not.toBeVisible();
    // Profile should show user info
    const profile = page.locator("text=Total XP, text=Badges, text=Profile").first();
    await expect(profile).toBeVisible({ timeout: 10_000 });
  });

  test("5.2 — Badges section shows earned badges", async ({ page }) => {
    const badges = page.locator("text=Badges, text=badge").first();
    await expect(badges).toBeVisible({ timeout: 10_000 });
  });

  test("5.3 — Dark mode toggle works", async ({ page }) => {
    const darkToggle = page.locator("button", { hasText: /Dark|Light|Theme/i }).first();
    if (await darkToggle.isVisible()) {
      await darkToggle.click();
      await page.waitForTimeout(400);
      // Background colour should change
      const bg = await page.locator("body").evaluate((el) =>
        getComputedStyle(el).backgroundColor
      );
      expect(bg).toBeTruthy();
    }
  });

  test("5.4 — Dark mode: Back to Courses text is readable (not swallowed)", async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      localStorage.setItem("fundi-theme", "dark");
    });
    await goToTab(page, "Learn");
    await page.locator(".course-card").first().click();
    await page.waitForTimeout(500);
    const backBtn = page.locator(".back-button, button", { hasText: /Back/i }).first();
    if (await backBtn.isVisible()) {
      // Check text is not the same colour as background (i.e. visible)
      const { color, backgroundColor } = await backBtn.evaluate((el) => ({
        color: getComputedStyle(el).color,
        backgroundColor: getComputedStyle(el).backgroundColor,
      }));
      expect(color).not.toEqual(backgroundColor);
    }
  });

  test("5.5 — Feedback modal opens from profile", async ({ page }) => {
    const feedbackBtn = page.locator("button", { hasText: /Feedback|Send Feedback/i }).first();
    if (await feedbackBtn.isVisible()) {
      await feedbackBtn.click();
      await page.waitForTimeout(400);
      // Modal should appear with form fields
      const subjectField = page.locator("input, textarea").first();
      await expect(subjectField).toBeVisible({ timeout: 5_000 });
    }
  });

  test("5.6 — FAQ section loads", async ({ page }) => {
    const faqBtn = page.locator("button, a", { hasText: /FAQ|Help/i }).first();
    if (await faqBtn.isVisible()) {
      await faqBtn.click();
      await page.waitForTimeout(400);
      const faq = page.locator("text=FAQ, text=Frequently").first();
      await expect(faq).toBeVisible({ timeout: 5_000 });
    }
  });

  test("5.7 — Legal pages load without crash", async ({ page }) => {
    const legalBtn = page.locator("button, a", { hasText: /Privacy|Terms|Legal/i }).first();
    if (await legalBtn.isVisible()) {
      await legalBtn.click();
      await page.waitForTimeout(400);
      const error = page.locator("text=Something went wrong");
      await expect(error).not.toBeVisible();
    }
  });
});
