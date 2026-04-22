/**
 * Test Suite 1: Authentication
 * Tests sign-in, sign-out, and session persistence.
 *
 * NOTE: storageState is loaded via playwright.config.ts so most tests start
 * already authenticated. Test 1.3 (wrong password) navigates fresh without
 * the saved state so it actually hits the sign-in form.
 */
import { test, expect } from "@playwright/test";
import { signIn, goToTab, gotoHome, normaliseUrl, BASE_URL } from "./helpers";

/** Helper: click the Sign In button regardless of its exact selector */
async function clickSignIn(page: Parameters<typeof signIn>[0]) {
  const btn = page.locator("button", { hasText: /^Sign In$/i }).first();
  await btn.waitFor({ state: "visible", timeout: 10_000 });
  await btn.click();
}

test.describe("Authentication", () => {
  test("1.1 — Site loads and redirects correctly", async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    expect(normaliseUrl(url)).toContain("fundiapp.co.za");
  });

  test("1.2 — Sign-in form is visible before login", async ({ browser }) => {
    // Use a fresh context (no storageState) to see the auth form
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await gotoHome(page);
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5_000 });
    await ctx.close();
  });

  test("1.3 — Wrong password shows error", async ({ browser }) => {
    // Fresh context — no session, must hit the actual sign-in form
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await gotoHome(page);
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 20_000 });
    await page.locator('input[type="email"]').first().fill("wrong@example.com");
    await page.locator('input[type="password"]').first().fill("wrongpassword");
    await clickSignIn(page);
    await page.waitForTimeout(3000);
    // Should still be on auth screen (not logged in)
    const stillOnAuth = await page.locator('input[type="email"]').isVisible().catch(() => false);
    expect(stillOnAuth).toBe(true);
    await ctx.close();
  });

  test("1.4 — Successful sign-in loads the app", async ({ page }) => {
    // storageState already loaded — just navigate home
    await signIn(page);
    await expect(page.locator("text=Learn").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Budget").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("text=Profile").first()).toBeVisible({ timeout: 5_000 });
  });

  test("1.5 — XP or streak visible after login", async ({ page }) => {
    await signIn(page);
    const xpVisible = await page.locator("text=XP, text=xp").first().isVisible().catch(() => false);
    const streakVisible = await page.locator("text=Streak, text=streak").first().isVisible().catch(() => false);
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
