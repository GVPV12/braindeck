// Pruebas de humo: abren cada herramienta en Chromium y fallan si hay errores de JavaScript.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  // En local, 4 Chromium arrancando a la vez saturan un portátil y la primera carga no llega a tiempo; con 2 va fluido
  workers: process.env.CI ? undefined : 2,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173', serviceWorkers: 'block' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'laptop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 640 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'pnpm run serve', port: 4173, reuseExistingServer: !process.env.CI },
});
