// Renders app/icon.svg to the PNG app icons in public/icons (run after changing the logo):
//   node scripts/render-icons.mjs
import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const svg = await readFile(new URL("../app/icon.svg", import.meta.url), "utf-8");
const outDir = new URL("../public/icons/", import.meta.url);
await mkdir(outDir, { recursive: true });

// Maskable icons get a full-bleed background; the platform applies its own mask.
const fullBleed = svg.replace('rx="112"', 'rx="0"');

const icons = [
  { file: "icon-192.png", size: 192, source: svg },
  { file: "icon-512.png", size: 512, source: svg },
  { file: "maskable-512.png", size: 512, source: fullBleed },
  { file: "apple-touch-icon.png", size: 180, source: fullBleed },
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const { file, size, source } of icons) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`,
    );
    await page.locator("svg").screenshot({ path: fileURLToPath(new URL(file, outDir)), omitBackground: true });
    console.log(`Rendered ${file}`);
  }
} finally {
  await browser.close();
}
