import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:    './e2e',
  timeout:    30_000,
  retries:    process.env.CI ? 2 : 0,
  workers:    process.env.CI ? 1 : 2,
  reporter:   process.env.CI ? 'github' : 'list',
  fullyParallel: false,

  use: {
    baseURL:       process.env.BASE_URL ?? 'http://localhost:3000',
    trace:         'on-first-retry',
    screenshot:    'on-first-failure',
    video:         'on-first-retry',
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'iphone-14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'ipad',
      use: { ...devices['iPad Pro 11'] },
    },
  ],

  webServer: process.env.CI ? {
    command: 'npm run build && npm start',
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: false,
  } : undefined,
});
