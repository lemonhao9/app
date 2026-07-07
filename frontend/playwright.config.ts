import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './test/e2e',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'npm run preview',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
    },
    projects: [
        {name: 'chromium', use: { ...devices['Desktop Chrome'] }},
        {name: 'firefox', use: { ...devices['Desktop Firefox'] }},
        {name: 'webkit', use: {...devices['Desktop Safari']}}
    ]
});
