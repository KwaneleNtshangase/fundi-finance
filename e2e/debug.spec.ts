import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test('dump DOM', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  await signIn(page);

  const html = await page.locator('.app-container').first().evaluate(el => el.outerHTML);
  console.log("DOM DUMP: ", html);
});
