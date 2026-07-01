import { defineConfig, devices } from "@playwright/test";
import path from "path";

const testDataDir = path.join(__dirname, "data", "e2e");

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_SECRET: "e2e-test-auth-secret",
      NEXTAUTH_URL: "http://localhost:3000",
      DATABASE_URL: `file:${path.join(testDataDir, "app.db")}`,
      UPLOAD_DIR: path.join(testDataDir, "uploads"),
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
