// Doplňkové fotky pro živý demo obsah (spouští se jednorázově, výstup se commituje).
// Použití: node scripts/gen-live-images.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "seed-images");
mkdirSync(outDir, { recursive: true });

const CHERRY = "#D62828", KETCHUP = "#A31621", VANILLA = "#FFF6E9", VINYL = "#221A15",
  MUSTARD = "#F2A93B", TEAL = "#12756B", PORCELAIN = "#FFFDF6";

const SUBJECTS = [
  { file: "dish-beer", emoji: "🍺", bg: MUSTARD, label: "Hladinka" },
  { file: "dish-bread", emoji: "🥖", bg: TEAL, label: "Kvásek Květoslav" },
  { file: "dish-svickova", emoji: "🍲", bg: CHERRY, label: "Svíčková" },
  { file: "dish-eggs", emoji: "🍳", bg: VINYL, label: "Benedikt 7:30" },
  { file: "dish-forage", emoji: "🌿", bg: KETCHUP, label: "Nasbíráno dnes" },
  { file: "dish-donut", emoji: "🍩", bg: TEAL, label: "Vosí hnízda" },
];

function pageHtml({ emoji, bg, label }, w, h) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;background:${bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;font-family:sans-serif}
  .checker{position:absolute;left:0;right:0;height:64px;background:repeating-conic-gradient(${VINYL} 0% 25%, ${VANILLA} 0% 50%);background-size:64px 64px}
  .top{top:0}.bottom{bottom:0}
  .plate{width:${Math.round(w * 0.62)}px;height:${Math.round(w * 0.62)}px;border-radius:50%;background:${PORCELAIN};border:14px solid ${VINYL};box-shadow:24px 24px 0 rgba(34,26,21,.35);display:flex;align-items:center;justify-content:center}
  .emoji{font-size:${Math.round(w * 0.3)}px;line-height:1}
  .label{position:absolute;bottom:110px;left:50%;transform:translateX(-50%) rotate(-2deg);background:${VANILLA};border:6px solid ${VINYL};border-radius:999px;padding:14px 38px;font-size:44px;font-weight:800;color:${VINYL};letter-spacing:1px;white-space:nowrap}
  .spark{position:absolute;top:${Math.round(h * 0.16)}px;right:${Math.round(w * 0.14)}px;width:90px;height:90px}
  </style></head><body>
  <div class="checker top"></div>
  <div class="plate"><span class="emoji">${emoji}</span></div>
  <div class="label">${label}</div>
  <svg class="spark" viewBox="0 0 20 20"><path d="M10 1 l2 5.2 5.2 2 -5.2 2 -2 5.2 -2 -5.2 -5.2 -2 5.2 -2Z" fill="${VANILLA}"/></svg>
  <div class="checker bottom"></div>
  </body></html>`;
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();

for (const subject of SUBJECTS) {
  for (const [suffix, w, h] of [["sq", 1080, 1080], ["pt", 1080, 1350]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(pageHtml(subject, w, h));
    await page.screenshot({ path: join(outDir, `${subject.file}-${suffix}.jpg`), type: "jpeg", quality: 78 });
  }
  console.log(`✓ ${subject.file}`);
}

await browser.close();
console.log(`Hotovo → ${outDir}`);
