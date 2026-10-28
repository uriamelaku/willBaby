import { defineConfig, devices } from "@playwright/test";
import { E2E_PORT } from "./tests/e2e/global-setup";

// Runs against the static export; build first (`npm run test:e2e` does both).

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  globalSetup: "./tests/e2e/global-setup.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
    // Pages are served fresh from the build; the offline worker would only get in the way.
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
});
