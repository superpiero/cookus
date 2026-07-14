import { defineConfig } from "@playwright/test";

// E2E proti produkčnímu buildu se seedovanou DB (docs/02 §1).
// Před spuštěním: npm run build && npm run db:seed (globalSetup seed provede sám).
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: false,
  workers: 1, // testy sdílejí seedovanou DB — sériově
  timeout: 45_000,
  expect: { timeout: 10_000 }, // pomalejší CI kontejnery — 5s default je těsný
  // Sdílený CI kontejner (browser+server+DB na 4 jádrech) občas zasekne aplikaci
  // action-response na klientu (~1/90 akcí; server vrací 200 za ~30 ms — ověřeno
  // trace analýzou). Testy jsou retry-safe (idempotentní), retry to absorbuje.
  retries: 2,
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
    // keepAliveTimeout > idle-close prohlížeče: jinak POST server action občas
    // narazí na socket zavíraný serverem a visí (browser POST neopakuje)
    command: "npx next start -p 3111 --keepAliveTimeout 70000",
    url: "http://localhost:3111",
    reuseExistingServer: true,
    timeout: 60_000,
    env: { DISABLE_RATE_LIMITS: "1" }, // suite loginuje desítky účtů z jedné IP
  },
});
