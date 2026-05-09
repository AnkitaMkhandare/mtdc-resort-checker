// @ts-check
const { defineConfig } = require('@playwright/test');
const config = require('./src/config/config.json');

module.exports = defineConfig({
  testDir: './src/tests',
  timeout: config.timeout || 30000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'html-report' }],
    ['json', { outputFile: 'reports/results.json' }]
  ],
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});