/**
 * Fundi Finance — Lightweight Health Check
 * =========================================
 * Runs without user credentials. Checks:
 *  1. The site loads (HTTP 200, no crash overlay)
 *  2. No console errors at load time
 *  3. Key UI elements are visible (tabs, logo, sign-in form)
 *  4. Response time < 8 seconds
 *
 * Usage: node scripts/health-check.js
 * Env:   BASE_URL   (default: https://fundiapp.co.za)
 */

const { chromium } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL ?? "https://fundiapp.co.za";
const TIMEOUT = 30_000;

const checks = [];
let browser, page;

function pass(name) {
  checks.push({ name, status: "✅ PASS" });
  console.log(`  ✅  ${name}`);
}
function fail(name, detail = "") {
  checks.push({ name, status: "❌ FAIL", detail });
  console.error(`  ❌  ${name}${detail ? `: ${detail}` : ""}`);
}

async function run() {
  console.log(`\n🔍  Fundi Finance Health Check`);
  console.log(`    Target: ${BASE_URL}`);
  console.log(`    ${new Date().toISOString()}\n`);

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "HealthCheckBot/1.0 (+FundiFinance)",
  });
  page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // ── 1. Page loads within time limit ────────────────────────────────────────
  const t0 = Date.now();
  try {
    const response = await page.goto(BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT,
    });
    const elapsed = Date.now() - t0;
    if (!response || response.status() >= 400) {
      fail("HTTP response OK", `Got status ${response?.status()}`);
    } else {
      pass(`HTTP 200 in ${elapsed}ms`);
    }
    if (elapsed > 8000) {
      fail("Page load < 8s", `Took ${elapsed}ms`);
    } else {
      pass(`Page load time acceptable (${elapsed}ms)`);
    }
  } catch (e) {
    fail("Page loads at all", e.message);
    return summarize();
  }

  // Wait for React to render
  await page.waitForTimeout(2500);

  // ── 2. No crash overlay / blank screen ────────────────────────────────────
  const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
  if (bodyText.trim().length < 20) {
    fail("Page renders content (not blank)", `Body text: "${bodyText.slice(0, 60)}"`);
  } else {
    pass("Page renders content");
  }

  const errorOverlay = await page.locator("text=Application error").count();
  if (errorOverlay > 0) {
    fail("No Next.js error overlay");
  } else {
    pass("No Next.js crash overlay");
  }

  // ── 3. Auth screen visible ─────────────────────────────────────────────────
  const emailInput = await page.locator('input[type="email"]').count();
  const passwordInput = await page.locator('input[type="password"]').count();
  if (emailInput > 0 && passwordInput > 0) {
    pass("Sign-in form visible (email + password)");
  } else {
    fail("Sign-in form visible", "Could not find email/password inputs");
  }

  // ── 4. Branding present ────────────────────────────────────────────────────
  const hasFundi = await page.locator("text=Fundi").count();
  if (hasFundi > 0) {
    pass("'Fundi' branding present");
  } else {
    fail("Branding check", "Could not find 'Fundi' text on page");
  }

  // ── 5. JS console errors ───────────────────────────────────────────────────
  // Filter out known non-critical noise
  const realErrors = consoleErrors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("404") &&
      !e.includes("net::ERR_BLOCKED") &&
      !e.includes("net::ERR_ABORTED") &&
      !e.includes("posthog") &&
      !e.includes("PostHog") &&
      !e.includes("WebSocket") &&
      !e.includes("supabase.co/realtime") &&
      !e.includes("Failed to load resource") &&
      !e.includes("Content Security Policy") &&
      !e.includes("sw.js") &&
      !e.includes("service-worker") &&
      !e.includes("push") &&
      !e.includes("Notification")
  );
  if (realErrors.length === 0) {
    pass("No JavaScript console errors");
  } else {
    fail("No JS console errors", realErrors.slice(0, 3).join(" | "));
  }

  // ── 6. Screenshot ─────────────────────────────────────────────────────────
  await page.screenshot({ path: "health-check-screenshot.png", fullPage: false });
  pass("Screenshot captured (health-check-screenshot.png)");

  return summarize();
}

function summarize() {
  const failed = checks.filter((c) => c.status.startsWith("❌"));
  console.log(`\n── Summary ─────────────────────────────────────────`);
  console.log(`   Total checks : ${checks.length}`);
  console.log(`   Passed       : ${checks.length - failed.length}`);
  console.log(`   Failed       : ${failed.length}`);
  if (failed.length > 0) {
    console.log(`\n   Failed checks:`);
    failed.forEach((c) => console.log(`     • ${c.name}: ${c.detail ?? ""}`));
    console.log("");
    return false;
  }
  console.log(`\n   🎉 All checks passed!\n`);
  return true;
}

run()
  .catch((e) => {
    console.error("Unexpected error:", e);
    process.exit(1);
  })
  .then((ok) => {
    browser?.close();
    process.exit(ok ? 0 : 1);
  });
