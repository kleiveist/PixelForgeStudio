import { expect, test, type Page } from "@playwright/test";

const releaseViews = [
  ["./?studio=prompt&view=dashboard", "Pixelart-Produktion beginnt mit der richtigen Asset-Art."],
  ["./?studio=prompt&view=profiles", "Produktionsprofile sicher organisieren."],
  ["./?studio=prompt&view=wizard", "Neue Assets geführt aufsetzen."],
  ["./?studio=prompt&view=output", "Prompt-Pakete produktionsbereit ausgeben."],
  ["./?studio=prompt&view=settings", "Das Studio passend konfigurieren."]
] as const;

async function expectNoHorizontalPageOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

test("routes every Prompt Studio view with one labelled main heading", async ({ page }) => {
  for (const [route, heading] of releaseViews) {
    await page.goto(route);
    await expect(page.getByRole("banner")).toContainText("v1.0.0");
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("main")).toHaveAttribute("aria-labelledby", /.+/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toContainText("Local-first");
    await expect(page.getByText("Animation Studio", { exact: true })).toHaveCount(0);
  }
});

test("canonicalizes every legacy Prompt route including review", async ({ page }) => {
  const routes = ["dashboard", "profiles", "wizard", "output", "settings"];
  for (const view of routes) {
    await page.goto(`./?view=${view}`);
    await expect(page).toHaveURL(new RegExp(`\\?studio=prompt&view=${view}$`));
  }

  await page.goto("./?view=review");
  await expect(page).toHaveURL(/\?studio=prompt&view=output$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Prompt-Pakete produktionsbereit ausgeben." })
  ).toBeVisible();
});

test("repairs retired home and animation routes to the Prompt dashboard", async ({ page }) => {
  for (const route of [
    "./?studio=home",
    "./?studio=animation&view=projects",
    "./?studio=animation&view=workspace&project=legacy-project"
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\?studio=prompt&view=dashboard$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Pixelart-Produktion beginnt mit der richtigen Asset-Art."
      })
    ).toBeVisible();
  }
});

test("supports skip navigation and Prompt view switching by keyboard", async ({ page }) => {
  await page.goto("./?studio=prompt&view=dashboard");
  const skipLink = page.getByRole("link", { name: "Zum Inhalt springen" });
  await page.keyboard.press("Tab");
  if (!(await skipLink.evaluate((element) => element === document.activeElement))) {
    await page.keyboard.press("Tab");
  }
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  const wizardLink = page.getByRole("link", { name: "Wizard", exact: true });
  await wizardLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/studio=prompt&view=wizard/);
  await expect(page.getByRole("main")).toBeFocused();
});

test("reflows the Prompt shell at desktop, medium and a 200-percent proxy width", async ({ page }) => {
  for (const width of [1440, 900, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./?studio=prompt&view=dashboard");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Hauptnavigation" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Darstellung" })).toBeVisible();
    await expectNoHorizontalPageOverflow(page);
  }
});

test("applies the reduced-motion contract in the browser", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?studio=prompt&view=dashboard");
  const wizardLink = page.getByRole("link", { name: "Wizard", exact: true });
  await expect(wizardLink).toBeVisible();
  const motion = {
    scrollBehavior: await page.locator("html").evaluate(
      (element) => getComputedStyle(element).scrollBehavior
    ),
    transitionDuration: await wizardLink.evaluate(
      (element) => getComputedStyle(element).transitionDuration
    )
  };
  expect(motion).toEqual({ scrollBehavior: "auto", transitionDuration: "0s" });
});
