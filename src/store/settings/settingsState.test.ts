import { describe, expect, it } from "vitest";
import { StableIdSchema, parseAppSettings } from "../../schemas";
import {
  createDefaultAppSettings,
  resolveStudioStartRoute,
  selectResolvedTheme,
  settingsReducer,
  withActiveBaseProfile,
  withPromptStartView,
  withThemePreference,
  type SettingsState
} from "./settingsState";

describe("settings state", () => {
  it("creates schema-V2-compatible local-first defaults", () => {
    expect(createDefaultAppSettings("2026-09-02T20:00:00.000Z")).toEqual({
      schemaVersion: 2,
      kind: "appSettings",
      theme: "system",
      locale: "de",
      startStudio: "home",
      startView: "dashboard",
      animationStartView: "projects",
      activeBaseProfileId: null,
      updatedAt: "2026-09-02T20:00:00.000Z"
    });
  });

  it("always resolves the configured Prompt start view", () => {
    const defaults = createDefaultAppSettings("2026-09-02T20:00:00.000Z");
    const output = withPromptStartView(
      defaults,
      "output",
      "2026-09-02T20:02:00.000Z"
    );

    expect(resolveStudioStartRoute(defaults)).toEqual({
      studio: "prompt",
      view: "dashboard"
    });
    expect(resolveStudioStartRoute(output)).toEqual({
      studio: "prompt",
      view: "output"
    });
  });

  it("ignores retired roof start fields while keeping old settings readable", () => {
    const settings = parseAppSettings({
      ...createDefaultAppSettings("2026-09-02T20:00:00.000Z"),
      startStudio: "animation",
      animationStartView: "workspace",
      startView: "profiles"
    });

    expect(resolveStudioStartRoute(settings)).toEqual({
      studio: "prompt",
      view: "profiles"
    });
  });

  it("changes the active base profile without changing other settings", () => {
    const settings = createDefaultAppSettings("2026-09-02T20:00:00.000Z");
    const changed = withActiveBaseProfile(
      settings,
      StableIdSchema.parse("base_world_32"),
      "2026-09-02T20:01:00.000Z"
    );

    expect(changed).toEqual({
      ...settings,
      activeBaseProfileId: "base_world_32",
      updatedAt: "2026-09-02T20:01:00.000Z"
    });
    expect(
      settingsReducer(
        {
          settings,
          systemTheme: "light",
          persistence: { status: "saved" }
        },
        { type: "settingsChanged", settings: changed }
      )
    ).toMatchObject({
      settings: changed,
      persistence: { status: "ready" }
    });
  });

  it("changes only theme metadata and resolves system state", () => {
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
