import { StrictMode } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppView, NavigationRoute } from "../domain/navigation";
import { parseAppSettings } from "../schemas";
import {
  V2_STORAGE_KEYS,
  createBrowserNavigationAdapter,
  createV2StorageAdapter
} from "../services";
import { MemoryNavigation } from "../test/memoryNavigation";
import { MemoryStorage } from "../test/memoryStorage";
import { App } from "./App";

const updatedAt = "2026-09-11T12:00:00.000Z";

function settingsJson(
  startView: AppView,
  legacyStartStudio: "home" | "prompt" | "animation" = "prompt"
): string {
  return JSON.stringify(
    parseAppSettings({
      schemaVersion: 2,
      kind: "appSettings",
      theme: "light",
      locale: "de",
      startStudio: legacyStartStudio,
      startView,
      animationStartView: "projects",
      activeBaseProfileId: null,
      updatedAt
    })
  );
}

function renderStudio(
  navigation: MemoryNavigation,
  startView: AppView = "dashboard",
  strict = false,
  legacyStartStudio: "home" | "prompt" | "animation" = "prompt"
) {
  const storage = new MemoryStorage({
    [V2_STORAGE_KEYS.settings]: settingsJson(startView, legacyStartStudio)
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

describe("Prompt-only application shell", () => {
  it("renders only five Prompt destinations and canonicalizes a missing route", () => {
    const navigation = new MemoryNavigation();
    renderStudio(navigation);

    expect(within(primaryNavigation()).getAllByRole("link")).toHaveLength(5);
    expect(currentPrimaryLink()).toHaveAccessibleName("Dashboard");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("link", {
        name: "PixelForge Prompt Studio – Dashboard"
      })
    ).toHaveAttribute("href", "?studio=prompt&view=dashboard");
    expect(
      within(screen.getByRole("contentinfo")).getByText(
        "PixelForge Prompt Studio"
      )
    ).toBeVisible();
    expect(screen.queryByText("Animation Studio")).not.toBeInTheDocument();
    expect(navigation.replacedRoutes).toEqual([
      { studio: "prompt", view: "dashboard" }
    ]);
  });

  it("uses the Prompt start view even when old settings selected Animation", () => {
    const navigation = new MemoryNavigation();
    const { storage } = renderStudio(
      navigation,
      "profiles",
      false,
      "animation"
    );

    expect(currentPrimaryLink()).toHaveAccessibleName("Profile");
    expect(
      screen.getByRole("heading", {
        name: "Produktionsprofile sicher organisieren."
      })
    ).toBeVisible();
    expect(navigation.replacedRoutes).toEqual([
      { studio: "prompt", view: "profiles" }
    ]);
    expect(storage.mutations).toEqual([]);
  });

  it("prioritizes a valid Prompt URL over the stored start view", () => {
    const navigation = new MemoryNavigation({
      status: "valid",
      view: "wizard"
    });
    renderStudio(navigation, "profiles");

    expect(
      screen.getByRole("heading", { name: "Neue Assets geführt aufsetzen." })
    ).toBeVisible();
    expect(currentPrimaryLink()).toHaveAccessibleName("Wizard");
    expect(navigation.replacedRoutes).toEqual([]);
  });

  it("navigates by keyboard, focuses main, and avoids duplicate pushes", async () => {
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
    expect(screen.getByRole("main")).toHaveFocus();
    expect(document.title).toBe("Ausgabe · PixelForge Prompt Studio");
    expect(navigation.pushedViews).toEqual(["output"]);
    expect(storage.mutations).toEqual([]);

    await user.click(outputLink);
    expect(navigation.pushedViews).toEqual(["output"]);
  });

  it("carries a dashboard category into the visible Wizard", async () => {
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
    expect(currentPrimaryLink()).toHaveAccessibleName("Wizard");
    expect(navigation.pushedViews).toEqual(["wizard"]);
    expect(storage.mutations).toEqual([]);
  });

  it("repairs a retired Animation URL to the configured Prompt start view", () => {
    window.history.replaceState(
      { source: "retired" },
      "",
      "/studio/?studio=animation&view=projects&project=old&mode=compact"
    );
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: settingsJson("settings", "animation")
    });
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
    expect(window.history.state).toEqual({ source: "retired" });
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(storage.mutations).toEqual([]);
  });

  it("repairs invalid routes and keeps corrupt settings untouched", () => {
    const corruptSettings = '{"startView":"somewhere"}';
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: corruptSettings
    });
    const invalidRoute: NavigationRoute = {
      status: "invalid",
      value: "unknown"
    };
    const navigation = new MemoryNavigation(invalidRoute);

    render(
      <App
        navigationAdapter={navigation}
        storageAdapter={createV2StorageAdapter(storage)}
      />
    );

    expect(currentPrimaryLink()).toHaveAccessibleName("Dashboard");
    expect(navigation.replacedRoutes).toEqual([
      { studio: "prompt", view: "dashboard" }
    ]);
    expect(storage.getItem(V2_STORAGE_KEYS.settings)).toBe(corruptSettings);
    expect(storage.mutations).toEqual([]);
  });

  it("uses client-side brand navigation and preserves the skip target", async () => {
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
    await user.click(skipLink);
    expect(main).toHaveFocus();

    await user.click(
      screen.getByRole("link", {
        name: "PixelForge Prompt Studio – Dashboard"
      })
    );
    expect(currentPrimaryLink()).toHaveAccessibleName("Dashboard");
    expect(main).toHaveAttribute("aria-labelledby", "dashboard-view-title");
    expect(main).toHaveFocus();
    expect(navigation.pushedRoutes).toEqual([
      { studio: "prompt", view: "dashboard" }
    ]);
  });

  it("canonicalizes legacy Wizard and review routes", () => {
    window.history.replaceState(null, "", "/studio/?view=review");
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: settingsJson("dashboard")
    });

    const first = render(
      <App
        navigationAdapter={createBrowserNavigationAdapter(window)}
        storageAdapter={createV2StorageAdapter(storage)}
      />
    );
    expect(currentPrimaryLink()).toHaveAccessibleName("Ausgabe");
    expect(window.location.search).toBe("?studio=prompt&view=output");
    first.unmount();

    window.history.replaceState(null, "", "/studio/?view=wizard");
    render(
      <App
        navigationAdapter={createBrowserNavigationAdapter(window)}
        storageAdapter={createV2StorageAdapter(storage)}
      />
    );
    expect(currentPrimaryLink()).toHaveAccessibleName("Wizard");
    expect(window.location.search).toBe("?studio=prompt&view=wizard");
  });

  it("keeps one traversal subscription in StrictMode and cleans it up", async () => {
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
});
