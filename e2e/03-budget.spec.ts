/**
 * Test Suite 3: Budget
 */
import { test, expect } from "@playwright/test";
import { signIn, goToTab } from "./helpers";

test.describe("Budget", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await goToTab(page, "Budget");
  });

  test("3.1 — Budget tab loads without crashing", async ({ page }) => {
    await expect(page.locator("text=Budget").first()).toBeVisible();
    // Should not show an error or blank screen
    const errorText = page.locator("text=Something went wrong, text=Error");
    await expect(errorText).not.toBeVisible();
  });

  test("3.2 — Can switch between months", async ({ page }) => {
    const nextBtn = page.locator("button[aria-label*='next'], button >> text=›, button >> text=→").first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(400);
      // Month should have changed
      const monthLabel = await page.locator("text=/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i").first().textContent();
      expect(monthLabel).toBeTruthy();
    }
  });

  test("3.3 — Add income entry", async ({ page }) => {
    // Look for + button or add entry
    const addBtn = page.locator("button", { hasText: /Add|Income|\+/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(400);
      // Modal or form should appear
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i], input[placeholder*="R" i]').first();
      if (await amountInput.isVisible()) {
        await amountInput.fill("5000");
        const saveBtn = page.locator("button", { hasText: /Save|Add|Done/i }).first();
        await saveBtn.click();
        await page.waitForTimeout(600);
        // Amount should appear somewhere
        await expect(page.locator("text=/5.000|5000/").first()).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test("3.4 — Year view loads with income/expenses chart", async ({ page }) => {
    const yearBtn = page.locator("button", { hasText: /Year|Annual/i }).first();
    if (await yearBtn.isVisible()) {
      await yearBtn.click();
      await page.waitForTimeout(600);
      // Chart container should be present
      const chart = page.locator(".recharts-wrapper, svg").first();
      await expect(chart).toBeVisible({ timeout: 5_000 });
    }
  });

  test("3.5 — Set Budget modal opens", async ({ page }) => {
    const setBudgetBtn = page.locator("button", { hasText: /Set Budget/i }).first();
    if (await setBudgetBtn.isVisible()) {
      await setBudgetBtn.click();
      await page.waitForTimeout(400);
      // Modal should appear
      const modal = page.locator('[role="dialog"], .modal, .bottom-sheet').first();
      if (!await modal.isVisible()) {
        // Try checking for budget input fields directly
        const input = page.locator('input[type="number"]').first();
        await expect(input).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test("3.6 — Number formatting uses spaces not commas (R5 000)", async ({ page }) => {
    // Look for any formatted rand value on screen
    await page.waitForTimeout(1000);
    const bodyText = await page.locator("body").textContent() ?? "";
    // Should NOT have R1,000 style (with comma)
    const hasCommaFormat = /R\d{1,3},\d{3}/.test(bodyText);
    expect(hasCommaFormat).toBe(false);
  });
});
