import { defineConfig } from '@playwright/test';
import { env } from 'node:process';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(env.CI),
  retries: env.CI ? 1 : 0,
  workers: env.CI ? 2 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4330',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'chromium-320px',
      use: { browserName: 'chromium', viewport: { width: 320, height: 740 } },
    },
    {
      name: 'webkit-desktop',
      use: { browserName: 'webkit', viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4330 --ignore-lock',
    url: 'http://127.0.0.1:4330',
    reuseExistingServer: !env.CI,
  },
});
