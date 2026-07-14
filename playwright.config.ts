import { defineConfig } from "@playwright/test";

// E2E proti produkčnímu buildu se seedovanou DB (docs/02 §1).
// Před spuštěním: npm run build && npm run db:seed (globalSetup seed provede sám).
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: false,
  workers: 1, // testy sdílejí seedovanou DB — sériově
  timeout: 45_000,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3111",
    locale: "cs-CZ",
    launchOptions: {
      // Předinstalovaný Chromium v CI kontejneru (bez stahování browserů)
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx next start -p 3111",
    url: "http://localhost:3111",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
