import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  // Text snapshots of computed styles do not vary by OS, so one baseline serves macOS and CI.
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFileName}/{projectName}/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    // Headless Chromium no longer falls back to software WebGL on its own; maps need it.
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-touch',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 568 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: 'npm run preview -w @loidolt/theme-catalog -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
