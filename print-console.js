const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  await page.goto('http://localhost:3000/onboarding'); // Let's log in
  await page.click('button:has-text("Start Your Journey")');
  await page.click('button:has-text("Continue")');
  await page.click('button:has-text("Sign in as test@example.com")');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:3000/budget');
  await page.waitForTimeout(3000);
  await browser.close();
})();
