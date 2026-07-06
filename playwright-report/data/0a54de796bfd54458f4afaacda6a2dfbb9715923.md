# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-progress-gamification.spec.ts >> Progress & Gamification >> 4.4 — Hearts are visible in stats panel (desktop)
- Location: e2e/04-progress-gamification.spec.ts:39:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.app-container').first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('.app-container').first()
    - waiting for" https://www.fundiapp.co.za/learn" navigation to finish...
    - navigated to "https://www.fundiapp.co.za/learn"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "Fundi Finance" [ref=e5]
      - paragraph [ref=e6]: Your financial journey starts here
      - paragraph [ref=e7]: Learn how money works, build real habits, and take control of your finances.
    - generic [ref=e8]:
      - button "Get Started" [ref=e9] [cursor=pointer]
      - button "I Already Have an Account" [ref=e10] [cursor=pointer]
```

# Test source

```ts
  1   | /**
  2   |  * Shared test helpers for Fundi Finance E2E tests.
  3   |  * Credentials are set via environment variables so they never live in source.
  4   |  *
  5   |  * Usage:
  6   |  *   TEST_EMAIL=test@example.com TEST_PASSWORD=secret npx playwright test
  7   |  */
  8   | import { Page, expect } from "@playwright/test";
  9   | 
  10  | export const TEST_EMAIL = process.env.TEST_EMAIL ?? "e2e-test@fundiapp.co.za";
  11  | export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "FundiE2E_Test#2026";
  12  | export const BASE_URL =
  13  |   process.env.BASE_URL ?? "https://fundiapp.co.za";
  14  | 
  15  | /** Sign in with email/password, wait for the app shell to appear */
  16  | export async function signIn(page: Page) {
  17  |   await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  18  |   // Splash animation can take 20-25s on slow CI runners — wait for the landing page or form directly.
  19  |   const signInButton = page.locator('button', { hasText: /I Already Have an Account/i }).first();
  20  |   // Try to wait for the landing screen button; if visible, click it.
  21  |   try {
  22  |     await signInButton.waitFor({ state: "visible", timeout: 15_000 });
  23  |     await signInButton.click();
  24  |   } catch (e) {
  25  |     // If button doesn't appear, maybe we're already on the signin form.
  26  |   }
  27  | 
  28  |   const emailInput = page.locator('input[type="email"]').first();
  29  |   await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  30  |   await emailInput.fill(TEST_EMAIL);
  31  |   await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  32  |   // Click the primary sign-in/up submit button (has data-testid="auth-submit")
  33  |   await page.locator('[data-testid="auth-submit"]').click();
  34  |   // Wait for app container — means auth succeeded and app loaded
> 35  |   await expect(page.locator(".app-container").first()).toBeVisible({
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  36  |     timeout: 20_000,
  37  |   });
  38  | }
  39  | 
  40  | /** Navigate to a specific tab using the bottom nav */
  41  | export async function goToTab(page: Page, tab: "Learn" | "Calculate" | "Budget" | "Progress" | "Profile" | "Goals") {
  42  |   await page.locator(`text=${tab}`).first().click();
  43  |   await page.waitForTimeout(300);
  44  | }
  45  | 
  46  | /** Open the first available (non-locked) lesson and return its title */
  47  | export async function openFirstLesson(page: Page): Promise<string> {
  48  |   await goToTab(page, "Learn");
  49  |   // Click first course card
  50  |   await page.locator(".course-card").first().click();
  51  |   // Wait for the course page to load (compilation in dev mode can take time)
  52  |   await page.locator(".lesson-node").first().waitFor({ state: "visible", timeout: 15_000 });
  53  |   
  54  |   // Prefer an uncompleted playable lesson
  55  |   let lesson = page.locator(".lesson-node.playable:not(.completed)").first();
  56  |   if (await lesson.count() === 0) {
  57  |     // Fall back to any playable/completed lesson
  58  |     lesson = page.locator(".lesson-node.playable, .lesson-node.completed").first();
  59  |   }
  60  |   
  61  |   await lesson.click();
  62  |   // Wait for lesson page to load
  63  |   await page.locator(".step-title, .question-text").first().waitFor({ state: "visible", timeout: 15_000 });
  64  |   const title = await page.locator(".step-title, .question-text").first().textContent();
  65  |   return title ?? "unknown";
  66  | }
  67  | 
  68  | /** Advance through all steps of an open lesson, answering MCQs with the first option */
  69  | export async function completeLesson(page: Page) {
  70  |   let safety = 0;
  71  |   while (safety < 40) {
  72  |     safety++;
  73  |     // Check if we're on a completion screen
  74  |     const done = page.locator("text=Back to Course, text=Lesson Complete!, text=Perfect Lesson!, text=XP Earned").first();
  75  |     if (await done.isVisible()) break;
  76  | 
  77  |     // MCQ — click first option
  78  |     const options = page.locator(".option-button:not([disabled])");
  79  |     if ((await options.count()) > 0) {
  80  |       await options.first().click();
  81  |       await page.waitForTimeout(400);
  82  |     }
  83  | 
  84  |     // True/False
  85  |     const truBtn = page.locator("button", { hasText: "True" }).first();
  86  |     if (await truBtn.isVisible() && !(await truBtn.isDisabled())) {
  87  |       await truBtn.click();
  88  |       await page.waitForTimeout(400);
  89  |     }
  90  | 
  91  |     // Continue / Finish / Next / Calculate
  92  |     const continueBtn = page
  93  |     .locator("main button", { hasText: /Continue|Finish|Next Lesson|Calculate/i })
  94  |     .first();
  95  |     if (await continueBtn.isVisible()) {
  96  |       await continueBtn.click();
  97  |       await page.waitForTimeout(600);
  98  |       continue;
  99  |     }
  100 | 
  101 |     // action-check: click "I've done this"
  102 |     const doneBtn = page.locator("button", { hasText: /I.ve done this|Done/i }).first();
  103 |     if (await doneBtn.isVisible()) {
  104 |       await doneBtn.click();
  105 |       await page.waitForTimeout(400);
  106 |       continue;
  107 |     }
  108 | 
  109 |     // Fill blank
  110 |     const fillInput = page.locator('input[type="text"]').first();
  111 |     if (await fillInput.isVisible()) {
  112 |       await fillInput.fill("0");
  113 |       await page.locator("button", { hasText: "Check" }).first().click();
  114 |       await page.waitForTimeout(400);
  115 |       continue;
  116 |     }
  117 | 
  118 |     // If nothing found, break to avoid infinite loop
  119 |     break;
  120 |   }
  121 | }
  122 | 
```