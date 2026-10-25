import { defineConfig, devices } from '@playwright/test';

/**
 * Murti Hub Playwright Audit Configuration
 * Configured for multi-viewport responsive testing, direct SPA refresh verification,
 * and security route guard assertions.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    {
      name: 'Mobile Small (320x568)',
      use: {
        viewport: { width: 320, height: 568 },
      },
    },
    {
      name: 'Mobile Android (360x800)',
      use: {
        viewport: { width: 360, height: 800 },
      },
    },
    {
      name: 'Mobile iPhone (390x844)',
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'Tablet iPad (768x1024)',
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Desktop Standard (1366x768)',
      use: {
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'Desktop Full HD (1920x1080)',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
