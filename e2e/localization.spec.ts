import { expect, test } from "@playwright/test";

test("persists language and localizes every primary route in both browsers", async ({
  page
}) => {
  await page.goto("/?view=settings");
  await page.getByLabel("Oberflächensprache").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.getByLabel("Interface language")).toHaveValue("en");
  for (const [view, heading] of [
    ["dashboard", "Pixel-art production starts with the right asset type."],
    ["profiles", "Organize production profiles safely."],
    ["wizard", "Set up new assets step by step."],
    ["output", "Export production-ready prompt packages."],
    ["settings", "Configure your studio."]
  ]) {
    await page.goto(`/?view=${view}`);
    await expect(
      page.getByRole("heading", { level: 1, name: heading })
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Main navigation" })
    ).toBeVisible();
    await expect(page.getByRole("group", { name: "Appearance" })).toBeVisible();
  }
  await page.getByLabel("Interface language").selectOption("de");
  await expect(
    page.getByRole("heading", { name: "Das Studio passend konfigurieren." })
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
});

test("validates the wizard in English while keeping user-entered names intact", async ({
  page
}) => {
  await page.goto("/?view=settings");
  await page.getByLabel("Oberflächensprache").selectOption("en");
  await page.getByRole("link", { name: "Wizard", exact: true }).click();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(
    page.getByText("Please enter a project name.", { exact: true }).first()
  ).toBeVisible();
  await page.getByRole("textbox", { name: /Project name/ }).fill("Holz");
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(
    page.getByText("What kind of image or asset would you like to create?")
  ).toBeVisible();
  await expect(page.getByText("Holz", { exact: true })).toBeVisible();
});
