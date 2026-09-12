import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

// Deliberately synthetic data; never capture or publish a user's workspace.
const timestamp = "2026-09-02T12:00:00.000Z";
const base = {
  schemaVersion: 2,
  kind: "baseProfile",
  id: "base_release_smoke",
  name: "Harbor production — Holz",
  iconId: "world-grid",
  values: {
    pixelDensity: "modernHd", styleProfile: "both", tileSize: 32,
    characterHeight: 80, perspectiveType: "threeQuarter", cameraAngle: 60,
    cameraDirection: "southToNorth", projectionType: "orthographic",
    outlineStyle: "softSelective", paletteMode: "byProfile",
    backgroundMode: "transparent", alphaPadding: 8, nearestNeighbor: true,
    lightingDefaults: { policy: "adaptive", notes: "Keep world light stable." }
  },
  locks: {}, createdAt: timestamp, updatedAt: timestamp
};
const bundle = {
  schemaVersion: 2, formatVersion: 2, kind: "exportBundle",
  application: "PixelForge Prompt Studio", bundleId: "bundle_release_smoke",
  exportedAt: timestamp, baseProfiles: [base], categoryProfiles: [], assetProfiles: [],
  wizardDrafts: [],
  appSettings: {
    schemaVersion: 2, kind: "appSettings", theme: "dark", locale: "en",
    startView: "dashboard", activeBaseProfileId: base.id, updatedAt: timestamp
  }
};

test("round-trips a real JSON download through a clean browser workspace", async ({ page, browser, baseURL }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("./?view=settings");
  await page.getByLabel("PixelForge-V2-JSON auswählen").setInputFiles({
    name: "synthetic-workspace.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bundle))
  });
  await expect(page.getByText("Importdatei vollständig validiert", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Geprüften Workspace importieren" }).click();
  await expect(page.getByText("1 profile(s) imported. 0 identical profile(s) were preserved.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Interface language")).toHaveValue("en");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export workspace as JSON" }).click();
  const download = await downloading;
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await readFile(path!, "utf8"));
  expect(exported).toMatchObject({
    schemaVersion: 2, formatVersion: 2, application: "PixelForge Prompt Studio",
    baseProfiles: [base], categoryProfiles: [], assetProfiles: [],
    appSettings: { locale: "en", theme: "dark", activeBaseProfileId: base.id }
  });
  await page.goto("./?view=profiles");
  await expect(page.getByRole("combobox", { name: "Base profile", exact: true })).toContainText(base.name);
  const clean = await browser.newContext({ baseURL, locale: "de-DE" });
  try {
    const restored = await clean.newPage();
    await restored.goto("./?view=settings");
    await restored.getByLabel("PixelForge-V2-JSON auswählen").setInputFiles(path!);
    await restored.getByRole("button", { name: "Geprüften Workspace importieren" }).click();
    await expect(restored.getByLabel("Interface language")).toHaveValue("en");
    await restored.goto("./?view=profiles");
    await expect(restored.getByRole("combobox", { name: "Base profile", exact: true })).toContainText(base.name);
    await restored.reload();
    await expect(restored.getByRole("combobox", { name: "Base profile", exact: true })).toContainText(base.name);
  } finally {
    await clean.close();
  }
  expect(errors).toEqual([]);
});

test("rejects an invalid JSON file without enabling a destructive import", async ({ page }) => {
  await page.goto("./?view=settings");
  await page.getByLabel("PixelForge-V2-JSON auswählen").setInputFiles({
    name: "invalid.json", mimeType: "application/json", buffer: Buffer.from('{"schemaVersion":999}')
  });
  await expect(page.getByText("Importdatei ist ungültig", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Geprüften Workspace importieren" })).toHaveCount(0);
  await expect(page.getByLabel("Oberflächensprache")).toHaveValue("de");
});
