// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './test/specs',
  /* Maximum time one test can run for. */
  timeout: 180 * 1000, // 3分に延長
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 30000 // 30秒に延長
  },
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1, // ローカル環境でも1回リトライを追加
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: './test/reports/html-report' }],
    ['json', { outputFile: './test/reports/test-results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 30000, // 30秒に設定
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://chat.m5stack.com',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* ヘッドレスモードを無効化（デフォルト） */
    headless: false,
    
    /* ビューポートサイズ */
    viewport: { width: 1280, height: 720 },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-ja',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'ja-JP',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        geolocation: { longitude: 139.7671, latitude: 35.6812 }, // 東京
        permissions: ['geolocation'],
        timezoneId: 'Asia/Tokyo',
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test/reports/test-results',
});
