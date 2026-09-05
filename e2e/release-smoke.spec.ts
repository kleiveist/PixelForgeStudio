import { expect, test, type Page } from "@playwright/test";

const releaseViews = [
  ["/?studio=home", "PixelForge Studio"],
  ["/?studio=prompt&view=dashboard", "Pixelart-Produktion beginnt mit der richtigen Asset-Art."],
  ["/?studio=prompt&view=profiles", "Produktionsprofile sicher organisieren."],
  ["/?studio=prompt&view=wizard", "Neue Assets geführt aufsetzen."],
  ["/?studio=prompt&view=output", "Prompt-Pakete produktionsbereit ausgeben."],
  ["/?studio=prompt&view=settings", "Das Studio passend konfigurieren."],
  ["/?studio=animation&view=projects", "Animationsprojekte organisieren."],
  ["/?studio=animation&view=workspace", "Kein Animationsprojekt geöffnet."],
  ["/?studio=animation&view=library", "Figuren und Ausrüstung wiederverwenden."],
  ["/?studio=animation&view=rigs", "Produktionsreife Rig-Vorlagen."]
] as const;

async function expectNoHorizontalPageOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

test("routes every release view with one labelled main heading", async ({ page }) => {
  for (const [route, heading] of releaseViews) {
    await page.goto(route);
    await expect(page.getByRole("banner")).toContainText("V3");
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("main")).toHaveAttribute("aria-labelledby", /.+/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toContainText("Local-first");
  }
});

test("canonicalizes every legacy Prompt route including review", async ({ page }) => {
  const routes = ["dashboard", "profiles", "wizard", "output", "settings"];
  for (const view of routes) {
    await page.goto(`/?view=${view}`);
    await expect(page).toHaveURL(new RegExp(`\\?studio=prompt&view=${view}$`));
  }

  await page.goto("/?view=review");
  await expect(page).toHaveURL(/\?studio=prompt&view=output$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Prompt-Pakete produktionsbereit ausgeben." })
  ).toBeVisible();
});

test("supports skip navigation, module switching and modal focus by keyboard", async ({ page }) => {
  await page.goto("/?studio=home");
  const skipLink = page.getByRole("link", { name: "Zum Inhalt springen" });
  await page.keyboard.press("Tab");
  if (!(await skipLink.evaluate((element) => element === document.activeElement))) {
    await page.keyboard.press("Tab");
  }
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  const animationLink = page.getByRole("link", { name: "Animation Studio", exact: true });
  await animationLink.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page).toHaveURL(/studio=animation&view=projects/);

  const createTrigger = page.getByRole("button", { name: "Neues Projekt" });
  await createTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Neues Animationsprojekt" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Projektname" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Neues Animationsprojekt" })).toBeHidden();
  await expect(createTrigger).toBeFocused();
});

test("reflows header actions at desktop, medium and a 200-percent proxy width", async ({ page }) => {
  for (const width of [1440, 900, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?studio=home");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Studio auswählen" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Darstellung" })).toBeVisible();
    await expectNoHorizontalPageOverflow(page);
  }
});

test("exposes every small-workspace pane as a roving keyboard tab", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/?studio=animation&view=projects");
  await page.getByRole("button", { name: "Neues Projekt" }).click();
  await page.getByRole("textbox", { name: "Projektname" }).fill("Release Matrix");
  await page.getByRole("button", { name: "Projekt anlegen" }).click();

  const workspace = page.locator('[data-workspace-layout="small"]');
  await expect(workspace).toBeVisible();
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(4);
  await expect(tabs.first()).toHaveAttribute("tabindex", "-1");
  const activeTab = page.getByRole("tab", { selected: true });
  await expect(activeTab).toHaveText("Viewport");
  await activeTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Eigenschaften" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(page.getByRole("heading", { level: 2, name: "Eigenschaften" })).toBeFocused();
  await expectNoHorizontalPageOverflow(page);
});

test("applies the reduced-motion contract in the browser", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?studio=home");
  const promptLink = page.getByRole("link", { name: "Prompt Studio", exact: true });
  await expect(promptLink).toBeVisible();
  const motion = {
    scrollBehavior: await page.locator("html").evaluate(
      (element) => getComputedStyle(element).scrollBehavior
    ),
    transitionDuration: await promptLink.evaluate(
      (element) => getComputedStyle(element).transitionDuration
    )
  };
  expect(motion).toEqual({ scrollBehavior: "auto", transitionDuration: "0s" });
});
