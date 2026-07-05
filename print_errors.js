const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  await page.goto('http://localhost:3000/');
  try {
    const signInButton = page.locator('button', { hasText: /I Already Have an Account/i }).first();
    await signInButton.waitFor({ state: "visible", timeout: 5000 });
    await signInButton.click();
  } catch (e) {}
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 5000 });
  await emailInput.fill("e2e-test@fundiapp.co.za");
  await page.locator('input[type="password"]').first().fill("FundiE2E_Test#2026");
  await page.locator('[data-testid="auth-submit"]').click();
  await page.waitForTimeout(5000);
  await browser.close();
})();
