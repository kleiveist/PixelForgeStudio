import { StrictMode } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APP_VIEW_IDS,
  type AppView,
  type NavigationRoute
} from "../domain/navigation";
import { parseAppSettings } from "../schemas";
import {
  V2_STORAGE_KEYS,
  createBrowserNavigationAdapter,
  createV2StorageAdapter
} from "../services";
import { MemoryNavigation } from "../test/memoryNavigation";
import { MemoryStorage } from "../test/memoryStorage";
import { App } from "./App";
import { APP_VIEW_DEFINITIONS } from "./appViewConfig";

const updatedAt = "2026-09-02T21:00:00.000Z";

function settingsJson(startView: AppView): string {
  return JSON.stringify(
    parseAppSettings({
      schemaVersion: 2,
      kind: "appSettings",
      theme: "light",
      locale: "de",
      startView,
      activeBaseProfileId: null,
      updatedAt
    })
  );
}

function renderStudio(
  navigation: MemoryNavigation,
  startView: AppView = "dashboard",
  strict = false
) {
  const storage = new MemoryStorage({
    [V2_STORAGE_KEYS.settings]: settingsJson(startView)
  });
  const app = (
    <App
      navigationAdapter={navigation}
      storageAdapter={createV2StorageAdapter(storage)}
    />
  );
  const rendered = render(strict ? <StrictMode>{app}</StrictMode> : app);
  return { ...rendered, storage };
}

function primaryNavigation() {
  return screen.getByRole("navigation", { name: "Hauptnavigation" });
}

function currentPrimaryLink(): HTMLElement {
  const currentLinks = within(primaryNavigation())
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page");
  expect(currentLinks).toHaveLength(1);
  return currentLinks[0] as HTMLElement;
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

describe("application shell navigation", () => {
  it("renders six semantic destinations and canonicalizes a missing route", () => {
    const navigation = new MemoryNavigation();
    renderStudio(navigation);

    expect(within(primaryNavigation()).getAllByRole("link")).toHaveLength(6);
    expect(currentPrimaryLink()).toHaveAccessibleName("Dashboard");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Prompt Studio")).toBeVisible();
    expect(screen.getByText("PixelForge Studio")).toBeVisible();
    expect(screen.getByRole("main")).toHaveAttribute(
      "aria-labelledby",
      "dashboard-view-title"
    );
    expect(navigation.replacedViews).toEqual(["dashboard"]);
    expect(navigation.pushedViews).toEqual([]);
  });

  it.each(APP_VIEW_IDS)(
    "renders the %s view as the single labelled main view",
    (view) => {
      const navigation = new MemoryNavigation({ status: "valid", view });
      renderStudio(navigation);

      const heading = screen.getByRole("heading", {
        level: 1,
        name: APP_VIEW_DEFINITIONS[view].title
      });
      expect(screen.getAllByRole("heading", { level: 1 })).toEqual([heading]);
      expect(screen.getByRole("main")).toHaveAttribute(
        "aria-labelledby",
        `${view}-view-title`
      );
      expect(currentPrimaryLink()).toHaveAccessibleName(
        APP_VIEW_DEFINITIONS[view].label
      );
      expect(document.title).toBe(
        `${APP_VIEW_DEFINITIONS[view].label} · Prompt Studio · PixelForge`
      );
    }
  );

  it("uses the stored start view when the URL has no view", () => {
    const navigation = new MemoryNavigation();
    const { storage } = renderStudio(navigation, "profiles");

    expect(
      screen.getByRole("heading", {
        name: "Produktionsprofile sicher organisieren."
      })
    ).toBeVisible();
    expect(currentPrimaryLink()).toHaveAccessibleName("Profile");
    expect(navigation.replacedViews).toEqual(["profiles"]);
    expect(storage.mutations).toEqual([]);
  });

  it("prioritizes a valid URL route over the stored start view", () => {
    const navigation = new MemoryNavigation({
      status: "valid",
      view: "wizard"
    });
    renderStudio(navigation, "profiles");

    expect(
      screen.getByRole("heading", { name: "Neue Assets geführt aufsetzen." })
    ).toBeVisible();
    expect(currentPrimaryLink()).toHaveAccessibleName("Wizard");
    expect(navigation.replacedViews).toEqual([]);
  });

  it("navigates by keyboard, updates the active view, and avoids duplicate pushes", async () => {
    const user = userEvent.setup();
    const navigation = new MemoryNavigation({
      status: "valid",
      view: "dashboard"
    });
    const { storage } = renderStudio(navigation);
    const outputLink = within(primaryNavigation()).getByRole("link", {
      name: "Ausgabe"
    });

    outputLink.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("heading", {
        name: "Prompt-Pakete produktionsbereit ausgeben."
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: "Pixelart-Produktion beginnt mit der richtigen Asset-Art."
      })
    ).not.toBeInTheDocument();
    expect(currentPrimaryLink()).toBe(outputLink);
    expect(screen.getByRole("main")).toHaveFocus();
    expect(document.title).toBe("Ausgabe · Prompt Studio · PixelForge");
    expect(navigation.pushedViews).toEqual(["output"]);
    expect(storage.mutations).toEqual([]);

    await user.click(outputLink);
    expect(navigation.pushedViews).toEqual(["output"]);
  });

  it("routes both global actions through the same navigation state", async () => {
    const user = userEvent.setup();
    const navigation = new MemoryNavigation({
      status: "valid",
      view: "dashboard"
    });
    renderStudio(navigation);

    await user.click(screen.getByRole("link", { name: "Neues Asset" }));
    expect(currentPrimaryLink()).toHaveAccessibleName("Wizard");

    await user.click(screen.getByRole("link", { name: "Profile öffnen" }));
    expect(currentPrimaryLink()).toHaveAccessibleName("Profile");
    expect(navigation.pushedViews).toEqual(["wizard", "profiles"]);
  });

  it("moves focus to main when a new session replaces the open Wizard", async () => {
    const user = userEvent.setup();
    const navigation = new MemoryNavigation({
      status: "valid",
      view: "wizard"
    });
    renderStudio(navigation);

    const newAssetLink = screen.getByRole("link", { name: "Neues Asset" });
    newAssetLink.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("main")).toHaveFocus();
    expect(
      screen.getByRole("heading", { level: 2, name: "Projekt" })
    ).toBeVisible();
    expect(navigation.pushedViews).toEqual([]);
  });

  it("carries a dashboard category into the visible Wizard handoff", async () => {
    const user = userEvent.setup();
    const navigation = new MemoryNavigation({
      status: "valid",
      view: "dashboard"
    });
    const { storage } = renderStudio(navigation);

    await user.click(
      screen.getByRole("button", {
        name: "Textur / Material als neues Asset erstellen"
      })
    );

    expect(screen.getByText("Neues Asset · Textur / Material")).toBeVisible();
    expect(
      screen.getByRole("complementary", {
        name: "Technische Zusammenfassung"
      })
    ).toHaveTextContent("Textur / Material");
    expect(navigation.pushedViews).toEqual(["wizard"]);
    expect(storage.mutations).toEqual([]);
  });

  it("follows back and forward notifications without adding history entries", () => {
    const navigation = new MemoryNavigation({
      status: "valid",
      view: "dashboard"
    });
    renderStudio(navigation);

    act(() => {
      navigation.emitRoute({ status: "valid", view: "review" });
    });
    expect(currentPrimaryLink()).toHaveAccessibleName("Prüfung");
    expect(screen.getByRole("main")).toHaveFocus();

    act(() => {
      navigation.emitRoute({ status: "valid", view: "output" });
    });
    expect(currentPrimaryLink()).toHaveAccessibleName("Ausgabe");
    expect(navigation.pushedViews).toEqual([]);
    expect(navigation.replacedViews).toEqual([]);
  });

  it("repairs an invalid history route with the configured fallback", () => {
    const invalidRoute: NavigationRoute = {
      status: "invalid",
      value: "unknown"
    };
    const navigation = new MemoryNavigation(invalidRoute);
    renderStudio(navigation, "settings");

    expect(currentPrimaryLink()).toHaveAccessibleName("Einstellungen");
    expect(navigation.replacedViews).toEqual(["settings"]);
    expect(navigation.pushedViews).toEqual([]);
  });

  it("repairs duplicate browser route parameters with the injected fallback", () => {
    window.history.replaceState(
      { source: "invalid" },
      "",
      "/studio/?studio=prompt&studio=animation&view=dashboard&mode=compact"
    );
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: settingsJson("settings")
    });
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");

    render(
      <App
        navigationAdapter={createBrowserNavigationAdapter(window)}
        storageAdapter={createV2StorageAdapter(storage)}
      />
    );

    expect(currentPrimaryLink()).toHaveAccessibleName("Einstellungen");
    expect(window.location.search).toBe(
      "?studio=prompt&view=settings&mode=compact"
    );
    expect(window.history.state).toEqual({ source: "invalid" });
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(pushState).not.toHaveBeenCalled();
  });

  it("falls back to Dashboard when persisted settings are corrupt", () => {
    const corruptSettings = '{"startView":"somewhere"}';
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: corruptSettings
    });
    const navigation = new MemoryNavigation();

    render(
      <App
        navigationAdapter={navigation}
        storageAdapter={createV2StorageAdapter(storage)}
      />
    );

    expect(currentPrimaryLink()).toHaveAccessibleName("Dashboard");
    expect(navigation.replacedViews).toEqual(["dashboard"]);
    expect(storage.getItem(V2_STORAGE_KEYS.settings)).toBe(corruptSettings);
    expect(storage.mutations).toEqual([]);
  });

  it("uses client-side brand navigation and keeps fragments available to the skip link", async () => {
    const user = userEvent.setup();
    const navigation = new MemoryNavigation({
      status: "valid",
      view: "output"
    });
    renderStudio(navigation);

    const skipLink = screen.getByRole("link", {
      name: "Zum Inhalt springen"
    });
    const main = screen.getByRole("main");
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
    await user.click(skipLink);
    expect(main).toHaveFocus();
    expect(window.location.hash).toBe("#main-content");
    expect(navigation.readRoute()).toEqual({
      status: "valid",
      route: { studio: "prompt", view: "output" }
    });
    expect(navigation.pushedViews).toEqual([]);
    expect(navigation.replacedViews).toEqual([]);

    await user.click(screen.getByRole("link", { name: /startseite/i }));
    expect(currentPrimaryLink()).toHaveAccessibleName("Dashboard");
    expect(navigation.pushedViews).toEqual(["dashboard"]);
  });

  it("keeps one traversal subscription in StrictMode and removes it on unmount", async () => {
    const user = userEvent.setup();
    const previousTitle = document.title;
    const navigation = new MemoryNavigation({
      status: "valid",
      view: "dashboard"
    });
    const rendered = renderStudio(navigation, "dashboard", true);

    expect(navigation.activeListenerCount()).toBe(1);
    await user.click(
      within(primaryNavigation()).getByRole("link", { name: "Wizard" })
    );
    expect(navigation.pushedViews).toEqual(["wizard"]);

    rendered.unmount();
    expect(navigation.activeListenerCount()).toBe(0);
    expect(document.title).toBe(previousTitle);
    act(() => {
      navigation.emitRoute({ status: "valid", view: "output" });
    });
    expect(navigation.pushedViews).toEqual(["wizard"]);
  });

  it("canonicalizes a legacy route and tracks browser traversal without extra pushes", async () => {
    window.history.replaceState(
      { source: "legacy" },
      "",
      "/studio/?view=dashboard&mode=compact"
    );
    const user = userEvent.setup();
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: settingsJson("dashboard")
    });
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");

    render(
      <App
        navigationAdapter={createBrowserNavigationAdapter(window)}
        storageAdapter={createV2StorageAdapter(storage)}
      />
    );

    expect(window.location.search).toBe(
      "?studio=prompt&view=dashboard&mode=compact"
    );
    expect(window.history.state).toEqual({ source: "legacy" });
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(pushState).not.toHaveBeenCalled();

    await user.click(
      within(primaryNavigation()).getByRole("link", { name: "Profile" })
    );
    await user.click(
      within(primaryNavigation()).getByRole("link", { name: "Wizard" })
    );
    expect(window.location.search).toBe(
      "?studio=prompt&view=wizard&mode=compact"
    );
    expect(pushState).toHaveBeenCalledTimes(2);

    act(() => window.history.back());
    await waitFor(() =>
      expect(currentPrimaryLink()).toHaveAccessibleName("Profile")
    );
    expect(window.location.search).toBe(
      "?studio=prompt&view=profiles&mode=compact"
    );

    act(() => window.history.back());
    await waitFor(() =>
      expect(currentPrimaryLink()).toHaveAccessibleName("Dashboard")
    );
    expect(window.location.search).toBe(
      "?studio=prompt&view=dashboard&mode=compact"
    );

    act(() => window.history.forward());
    await waitFor(() =>
      expect(currentPrimaryLink()).toHaveAccessibleName("Profile")
    );
    expect(window.location.search).toBe(
      "?studio=prompt&view=profiles&mode=compact"
    );
    expect(pushState).toHaveBeenCalledTimes(2);
    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  it("keeps the active browser route and view instance on same-view navigation", async () => {
    window.history.replaceState(
      null,
      "",
      "/studio/?studio=prompt&view=dashboard"
    );
    const user = userEvent.setup();
    const navigation = createBrowserNavigationAdapter(window);
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: settingsJson("dashboard")
    });
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(
      <App
        navigationAdapter={navigation}
        storageAdapter={createV2StorageAdapter(storage)}
      />
    );
    const heading = screen.getByRole("heading", {
      name: "Pixelart-Produktion beginnt mit der richtigen Asset-Art."
    });

    await user.click(
      within(primaryNavigation()).getByRole("link", { name: "Dashboard" })
    );

    expect(window.location.search).toBe("?studio=prompt&view=dashboard");
    expect(screen.getByRole("heading", { level: 1 })).toBe(heading);
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
