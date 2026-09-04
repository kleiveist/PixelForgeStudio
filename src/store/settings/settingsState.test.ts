import { describe, expect, it } from "vitest";
import { StableIdSchema, parseAppSettings } from "../../schemas";
import {
  createDefaultAppSettings,
  resolveStudioStartRoute,
  selectResolvedTheme,
  settingsReducer,
  withActiveBaseProfile,
  withAnimationStartView,
  withPromptStartView,
  withStartStudio,
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
      startStudio: "home",
      startView: "dashboard",
      animationStartView: "projects",
      activeBaseProfileId: null,
      updatedAt: "2026-09-02T20:00:00.000Z"
    });
  });

  it("resolves every start studio with independent module views", () => {
    const defaults = createDefaultAppSettings("2026-09-02T20:00:00.000Z");
    const prompt = withPromptStartView(
      withStartStudio(defaults, "prompt", "2026-09-02T20:01:00.000Z"),
      "output",
      "2026-09-02T20:02:00.000Z"
    );
    const animation = withAnimationStartView(
      withStartStudio(prompt, "animation", "2026-09-02T20:03:00.000Z"),
      "rigs",
      "2026-09-02T20:04:00.000Z"
    );

    expect(resolveStudioStartRoute(defaults)).toEqual({ studio: "home" });
    expect(resolveStudioStartRoute(prompt)).toEqual({
      studio: "prompt",
      view: "output"
    });
    expect(resolveStudioStartRoute(animation)).toEqual({
      studio: "animation",
      view: "rigs"
    });
    expect(animation).toMatchObject({
      startStudio: "animation",
      startView: "output",
      animationStartView: "rigs",
      updatedAt: "2026-09-02T20:04:00.000Z"
    });
  });

  it("resolves an Animation Workspace start without inventing a project", () => {
    const settings = withAnimationStartView(
      withStartStudio(
        createDefaultAppSettings("2026-09-02T20:00:00.000Z"),
        "animation",
        "2026-09-02T20:01:00.000Z"
      ),
      "workspace",
      "2026-09-02T20:02:00.000Z"
    );

    expect(resolveStudioStartRoute(settings)).toEqual({
      studio: "animation",
      view: "workspace"
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
