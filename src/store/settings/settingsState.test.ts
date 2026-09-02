import { describe, expect, it } from "vitest";
import { parseAppSettings } from "../../schemas";
import {
  createDefaultAppSettings,
  selectResolvedTheme,
  settingsReducer,
  withThemePreference,
  type SettingsState
} from "./settingsState";

describe("settings state", () => {
  it("creates the canonical local-first defaults", () => {
    expect(createDefaultAppSettings("2026-09-02T20:00:00.000Z")).toEqual({
      schemaVersion: 2,
      kind: "appSettings",
      theme: "system",
      locale: "de",
      startView: "dashboard",
      activeBaseProfileId: null,
      updatedAt: "2026-09-02T20:00:00.000Z"
    });
  });

  it("changes only theme metadata and resolves system state without persistence data", () => {
    const settings = parseAppSettings({
      ...createDefaultAppSettings("2026-09-02T20:00:00.000Z"),
      locale: "en",
      activeBaseProfileId: "base_world_32"
    });
    const themedSettings = withThemePreference(
      settings,
      "dark",
      "2026-09-02T20:10:00.000Z"
    );
    const state: SettingsState = {
      settings: themedSettings,
      systemTheme: "light",
      persistence: { status: "saved" }
    };

    expect(themedSettings).toMatchObject({
      theme: "dark",
      locale: "en",
      activeBaseProfileId: "base_world_32",
      updatedAt: "2026-09-02T20:10:00.000Z"
    });
    expect(selectResolvedTheme(state)).toBe("dark");
    expect(
      settingsReducer(state, { type: "systemThemeChanged", systemTheme: "dark" })
        .settings
    ).toBe(themedSettings);
  });
});
