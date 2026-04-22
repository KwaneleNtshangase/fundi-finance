/**
 * Test Suite 1: Authentication
 * Tests sign-in, sign-out, and session persistence.
 */
import { test, expect } from "@playwright/test";
import { signIn, goToTab, gotoHome, normaliseUrl, BASE_URL } from "./helpers";

test.describe("Authentication", () => {
  test("1.1 — Site loads and redirects correctly", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    // Accept both www and non-www versions (site may redirect)
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    expect(normaliseUrl(url)).toContain("fundiapp.co.za");
  });

  test("1.2 — Sign-in form is visible before login", async ({ page }) => {
    await gotoHome(page);
    // Splash can take up to 8s — wait generously
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test("1.3 — Wrong password shows error", async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 20_000 });
    await page.locator('input[type="email"]').first().fill("wrong@example.com");
    await page.locator('input[type="password"]').first().fill("wrongpassword");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    // Should still be on auth screen (not logged in)
    const stillOnAuth = await page.locator('input[type="email"]').isVisible().catch(() => false);
    expect(stillOnAuth).toBe(true);
  });

  test("1.4 — Successful sign-in loads the app", async ({ page }) => {
    await signIn(page);
    await expect(page.locator("text=Learn").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Budget").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("text=Profile").first()).toBeVisible({ timeout: 5_000 });
  });

  test("1.5 — XP or streak visible after login", async ({ page }) => {
    await signIn(page);
    // Stats shown in header bar on mobile or sidebar on desktop
    const xpVisible = await page.locator("text=XP, text=xp").first().isVisible().catch(() => false);
    const streakVisible = await page.locator("text=Streak, text=streak").first().isVisible().catch(() => false);
    // At least one stat indicator should be present
    expect(xpVisible || streakVisible).toBe(true);
  });

  test("1.6 — Sign out works", async ({ page }) => {
    await signIn(page);
    await goToTab(page, "Profile");
    const signOutBtn = page.locator("button", { hasText: /Sign Out|Log Out/i }).last();
    await signOutBtn.waitFor({ state: "visible", timeout: 15_000 });
    await signOutBtn.click();
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 15_000 });
  });
});
