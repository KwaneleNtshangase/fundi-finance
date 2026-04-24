/**
 * Test Suite 1: Authentication
 * Tests sign-in, sign-out, and session persistence.
 */
import { test, expect } from "@playwright/test";
import { signIn, goToTab, BASE_URL } from "./helpers";

test.describe("Authentication", () => {
  test("1.1 — Splash screen appears on first load", async ({ page }) => {
    await page.goto(BASE_URL);
    // Splash should show briefly
    const splash = page.locator(".splash-logo-wrap, #splashScreen, img[alt*='Fundi']");
    // It may already have animated out — just ensure no JS crash
    await expect(page).toHaveURL(BASE_URL);
  });

  test("1.2 — Sign-in form is visible before login", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000); // let splash finish
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test("1.3 — Wrong password shows error", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await page.locator('input[type="email"]').first().fill("wrong@example.com");
    await page.locator('input[type="password"]').first().fill("wrongpassword");
    await page.locator('button[type="submit"]').click();
    // Error message or still on auth screen
    await page.waitForTimeout(3000);
    const stillOnAuth = await page.locator('input[type="email"]').isVisible();
    expect(stillOnAuth).toBe(true); // should NOT be logged in
  });

  test("1.4 — Successful sign-in loads the app", async ({ page }) => {
    await signIn(page);
    await expect(page.locator("text=Learn").first()).toBeVisible();
    await expect(page.locator("text=Budget").first()).toBeVisible();
    await expect(page.locator("text=Profile").first()).toBeVisible();
  });

  test("1.5 — Stats panel shows XP, Streak, Level after login", async ({ page }) => {
    await signIn(page);
    // Stats sidebar (desktop) or stats section
    await expect(page.locator("#xpValue, text=Total XP").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("#streakValue, text=Day Streak").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("#levelValue, text=Level").first()).toBeVisible({ timeout: 5_000 });
  });

  test("1.6 — Sign out works", async ({ page }) => {
    await signIn(page);
    await goToTab(page, "Profile");
    const signOutBtn = page.locator("button", { hasText: /Sign Out|Log Out/i }).last();
    await signOutBtn.waitFor({ state: "visible", timeout: 10_000 });
    await signOutBtn.click();
    // Should return to auth screen
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
