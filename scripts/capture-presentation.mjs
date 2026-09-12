import { chromium, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const base = process.env.PIXELFORGE_TEST_URL ?? "http://127.0.0.1:4173/";
mkdirSync(resolve(root, "docs/assets"), { recursive: true });
const browser = await chromium.launch();
try {
  const artwork = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await artwork.goto(pathToFileURL(resolve(root, "public/social-preview.svg")).href);
  await artwork.screenshot({ path: resolve(root, "public/social-preview.png") });
  await artwork.close();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark", locale: "de-DE", reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(new URL("?view=settings", base).href);
  await expect(page.getByRole("heading", { level: 1, name: "Das Studio passend konfigurieren." })).toBeVisible();
  await page.screenshot({ path: resolve(root, "docs/assets/settings-de.png"), animations: "disabled" });
  await page.getByLabel("Oberflächensprache").selectOption("en");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Pixel-art production starts with the right asset type." })).toBeVisible();
  await page.getByRole("heading", { name: "What would you like to create?" }).evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, -32));
  await page.screenshot({ path: resolve(root, "docs/assets/dashboard-en.png"), animations: "disabled" });
} finally {
  await browser.close();
}
