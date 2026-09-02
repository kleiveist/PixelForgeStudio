import { StrictMode } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BRAND } from "../config";
import { DARK_THEME_MEDIA_QUERY } from "../domain/theme";
import { parseAppSettings } from "../schemas";
import {
  V2_STORAGE_KEYS,
  createV2StorageAdapter
} from "../services";
import { MemoryStorage } from "../test/memoryStorage";
import { App } from "./App";

type MediaChangeListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initiallyDark: boolean) {
  let matches = initiallyDark;
  const listeners = new Set<MediaChangeListener>();
  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: DARK_THEME_MEDIA_QUERY,
    onchange: null,
    addListener: (listener: MediaChangeListener | null) => {
      if (listener) listeners.add(listener);
    },
    removeListener: (listener: MediaChangeListener | null) => {
      if (listener) listeners.delete(listener);
    },
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject | null
    ) => {
      if (type === "change" && typeof listener === "function") {
        listeners.add(listener as MediaChangeListener);
      }
    },
    removeEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject | null
    ) => {
      if (type === "change" && typeof listener === "function") {
        listeners.delete(listener as MediaChangeListener);
      }
    },
    dispatchEvent: () => true
  } as MediaQueryList;

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      if (query !== DARK_THEME_MEDIA_QUERY) {
        throw new Error(`Unexpected media query: ${query}`);
      }
      return mediaQueryList;
    })
  );

  return {
    activeListenerCount: () => listeners.size,
    setDark(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches, media: DARK_THEME_MEDIA_QUERY } as MediaQueryListEvent;
      for (const listener of listeners) listener(event);
    }
  };
}

function settingsJson(
  theme: "light" | "dark" | "system",
  overrides: Readonly<Record<string, unknown>> = {}
): string {
  return JSON.stringify(
    parseAppSettings({
      schemaVersion: 2,
      kind: "appSettings",
      theme,
      locale: "de",
      startView: "dashboard",
      activeBaseProfileId: null,
      updatedAt: "2026-09-02T18:00:00.000Z",
      ...overrides
    })
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  vi.unstubAllGlobals();
});

describe("PixelForge visual foundation", () => {
  it("uses the central brand and exposes an accessible system theme control", () => {
    installMatchMedia(false);
    const storage = new MemoryStorage();

    render(<App storageAdapter={createV2StorageAdapter(storage)} />);

    expect(
      screen.getByRole("heading", {
        name: /ein studio, das sich deiner arbeitsumgebung anpasst/i
      })
    ).toBeVisible();
    expect(screen.getByText(BRAND.tagline, { exact: false })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Visuelles Fundament bereit"
    );
    expect(
      screen.getByRole("group", { name: "Darstellung" })
    ).toBeVisible();
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(storage.mutations).toHaveLength(0);
  });

  it("restores a persisted explicit theme without writing during mount", () => {
    installMatchMedia(false);
    const persisted = settingsJson("dark");
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: persisted
    });

    render(<App storageAdapter={createV2StorageAdapter(storage)} />);

    expect(screen.getByRole("radio", { name: "Dunkel" })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(storage.getItem(V2_STORAGE_KEYS.settings)).toBe(persisted);
    expect(storage.mutations).toHaveLength(0);
  });

  it("restores the previous root theme when the provider unmounts", () => {
    const media = installMatchMedia(false);
    const storage = new MemoryStorage();
    document.documentElement.setAttribute("data-theme", "dark");

    const rendered = render(
      <StrictMode>
        <App storageAdapter={createV2StorageAdapter(storage)} />
      </StrictMode>
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(media.activeListenerCount()).toBe(1);
    rendered.unmount();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(media.activeListenerCount()).toBe(0);
  });

  it("switches in place, preserves settings fields, and restores the choice", async () => {
    installMatchMedia(false);
    const user = userEvent.setup();
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: settingsJson("system", {
        locale: "en",
        startView: "profiles",
        activeBaseProfileId: "base_world_32"
      })
    });
    const adapter = createV2StorageAdapter(storage);
    const now = () => "2026-09-02T20:00:00.000Z";
    const rendered = render(<App storageAdapter={adapter} now={now} />);
    const heading = screen.getByRole("heading", {
      name: /ein studio, das sich deiner arbeitsumgebung anpasst/i
    });

    await user.click(screen.getByRole("radio", { name: "Dunkel" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByText("Darstellung gespeichert.")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1 })).toBe(heading);
    expect(storage.mutations).toEqual([
      { operation: "set", key: V2_STORAGE_KEYS.settings }
    ]);
    expect(adapter.readSettings()).toEqual({
      status: "valid",
      value: {
        schemaVersion: 2,
        kind: "appSettings",
        theme: "dark",
        locale: "en",
        startView: "profiles",
        activeBaseProfileId: "base_world_32",
        updatedAt: "2026-09-02T20:00:00.000Z"
      }
    });

    rendered.unmount();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    render(<App storageAdapter={adapter} now={now} />);
    expect(screen.getByRole("radio", { name: "Dunkel" })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("follows system changes without mutating the persisted preference", () => {
    const media = installMatchMedia(false);
    const persisted = settingsJson("system");
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: persisted
    });
    const rendered = render(
      <App storageAdapter={createV2StorageAdapter(storage)} />
    );

    expect(media.activeListenerCount()).toBe(1);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    act(() => media.setDark(true));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();

    act(() => media.setDark(false));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(storage.getItem(V2_STORAGE_KEYS.settings)).toBe(persisted);
    expect(storage.mutations).toHaveLength(0);

    rendered.unmount();
    expect(media.activeListenerCount()).toBe(0);
  });

  it("ignores system changes while an explicit theme is selected", () => {
    const media = installMatchMedia(false);
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: settingsJson("light")
    });

    render(<App storageAdapter={createV2StorageAdapter(storage)} />);
    expect(media.activeListenerCount()).toBe(0);

    act(() => media.setDark(true));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(storage.mutations).toHaveLength(0);
  });

  it("resolves the current OS value when switching back to system mode", async () => {
    const media = installMatchMedia(false);
    const user = userEvent.setup();
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: settingsJson("light")
    });
    const adapter = createV2StorageAdapter(storage);

    render(
      <App
        storageAdapter={adapter}
        now={() => "2026-09-02T20:05:00.000Z"}
      />
    );
    act(() => media.setDark(true));

    await user.click(screen.getByRole("radio", { name: "System" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
    expect(media.activeListenerCount()).toBe(1);
    expect(adapter.readSettings()).toMatchObject({
      status: "valid",
      value: {
        theme: "system",
        updatedAt: "2026-09-02T20:05:00.000Z"
      }
    });
  });

  it("does not leak listeners across repeated explicit and system cycles", async () => {
    const media = installMatchMedia(false);
    const user = userEvent.setup();
    const storage = new MemoryStorage();
    const rendered = render(
      <App
        storageAdapter={createV2StorageAdapter(storage)}
        now={() => "2026-09-02T20:07:00.000Z"}
      />
    );

    expect(media.activeListenerCount()).toBe(1);
    await user.click(screen.getByRole("radio", { name: "Dunkel" }));
    expect(media.activeListenerCount()).toBe(0);
    await user.click(screen.getByRole("radio", { name: "System" }));
    expect(media.activeListenerCount()).toBe(1);
    await user.click(screen.getByRole("radio", { name: "Hell" }));
    expect(media.activeListenerCount()).toBe(0);
    await user.click(screen.getByRole("radio", { name: "System" }));
    expect(media.activeListenerCount()).toBe(1);

    rendered.unmount();
    expect(media.activeListenerCount()).toBe(0);
    act(() => media.setDark(true));
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("keeps corrupt settings untouched until an explicit valid selection", async () => {
    installMatchMedia(false);
    const user = userEvent.setup();
    const corruptValue = "{not-json";
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: corruptValue
    });
    const adapter = createV2StorageAdapter(storage);

    render(
      <App
        storageAdapter={adapter}
        now={() => "2026-09-02T20:10:00.000Z"}
      />
    );

    expect(screen.getByText(/gespeicherten einstellungen sind ungültig/i)).toBeVisible();
    expect(storage.getItem(V2_STORAGE_KEYS.settings)).toBe(corruptValue);
    expect(storage.mutations).toHaveLength(0);

    await user.click(screen.getByRole("radio", { name: "Dunkel" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(adapter.readSettings()).toMatchObject({
      status: "valid",
      value: { theme: "dark" }
    });
  });

  it("keeps theme switching available when persistence is unavailable", async () => {
    installMatchMedia(false);
    const user = userEvent.setup();

    render(<App storageAdapter={createV2StorageAdapter(null)} />);

    expect(screen.getByText(/lokales speichern ist nicht verfügbar/i)).toBeVisible();
    await user.click(screen.getByRole("radio", { name: "Dunkel" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("radio", { name: "Dunkel" })).toBeChecked();
  });

  it("falls back to light when the system preference API throws", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => {
        throw new Error("matchMedia unavailable");
      })
    );
    const storage = new MemoryStorage();

    render(<App storageAdapter={createV2StorageAdapter(storage)} />);

    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(storage.mutations).toHaveLength(0);
  });

  it("keeps a new theme active when an existing storage write fails", async () => {
    installMatchMedia(false);
    const user = userEvent.setup();
    const persisted = settingsJson("system");
    const storage = new MemoryStorage({
      [V2_STORAGE_KEYS.settings]: persisted
    });
    storage.failSetFor = V2_STORAGE_KEYS.settings;

    const rendered = render(
      <App
        storageAdapter={createV2StorageAdapter(storage)}
        now={() => "2026-09-02T20:15:00.000Z"}
      />
    );
    await user.click(screen.getByRole("radio", { name: "Dunkel" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByText(/änderungen gelten für diese sitzung/i)).toBeVisible();
    expect(storage.getItem(V2_STORAGE_KEYS.settings)).toBe(persisted);
    expect(storage.mutations).toHaveLength(0);

    rendered.unmount();
    render(
      <App
        storageAdapter={createV2StorageAdapter(storage)}
        now={() => "2026-09-02T20:16:00.000Z"}
      />
    );
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("keeps one system listener in StrictMode and writes once per user change", async () => {
    const media = installMatchMedia(false);
    const user = userEvent.setup();
    const storage = new MemoryStorage();

    render(
      <StrictMode>
        <App
          storageAdapter={createV2StorageAdapter(storage)}
          now={() => "2026-09-02T20:20:00.000Z"}
        />
      </StrictMode>
    );

    expect(media.activeListenerCount()).toBe(1);
    expect(storage.mutations).toHaveLength(0);

    const system = screen.getByRole("radio", { name: "System" });
    system.focus();
    await user.keyboard("{ArrowLeft}");

    expect(screen.getByRole("radio", { name: "Dunkel" })).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(media.activeListenerCount()).toBe(0);
    expect(storage.mutations).toEqual([
      { operation: "set", key: V2_STORAGE_KEYS.settings }
    ]);
  });
});
