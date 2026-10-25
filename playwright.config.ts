import { defineConfig, devices } from '@playwright/test'
import { E2E_API_URL, E2E_FRONT_PORT, E2E_FRONT_URL } from './e2e/support/stack'

const isCI = Boolean(process.env.CI)

// Pruebas E2E por rol (skills testing-playwright y playwright-best-practices). La suite de flujos corre contra el
// stack aislado de docker-compose.e2e.yml, que e2e/support/global-setup.ts levanta y destruye (ver E2E_STACK).
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/support/global-setup.ts',
  // Los flujos comparten una única base de datos: se ejecutan en serie para que el estado sea predecible.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: E2E_FRONT_URL,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'smoke', testMatch: /smoke\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    {
      name: 'flujos',
      testIgnore: /smoke\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    // Front dedicado a la suite (5174) apuntando a la API aislada (8001); no interfiere con `pnpm dev` (5173).
    command: `pnpm exec vite --port ${E2E_FRONT_PORT} --strictPort`,
    url: E2E_FRONT_URL,
    env: { VITE_API_BASE_URL: E2E_API_URL, VITE_DEMO_PASSWORD: '' },
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
