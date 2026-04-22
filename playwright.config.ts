import { defineConfig, devices } from "@playwright/test";
import * as path from "path";

const AUTH_FILE = path.join(__dirname, "e2e", ".auth", "user.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // run sequentially so state builds correctly
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],

  // Global setup signs in once; all tests reuse the saved session.
  globalSetup: "./e2e/global-setup.ts",

  use: {
    baseURL: process.env.BASE_URL ?? "https://www.fundiapp.co.za",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    // Give Supabase calls time to respond
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Reuse the authenticated session in every test
    storageState: AUTH_FILE,
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari (iPhone 14)",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "Mobile Chrome (Pixel 7)",
      use: { ...devices["Pixel 7"] },
    },
  ],
  // Override to just run one browser during local dev:
  // npx playwright test --project="Desktop Chrome"
});
