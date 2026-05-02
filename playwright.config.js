// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5500',
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: isCI
        ? { ...devices['Desktop Chrome'] }
        : { ...devices['Desktop Chrome'], channel: 'chrome' }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] }
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ],
  webServer: {
    command: 'python -m http.server 5500',
    url: 'http://127.0.0.1:5500/index.html',
    reuseExistingServer: true,
    timeout: 120_000
  }
});
