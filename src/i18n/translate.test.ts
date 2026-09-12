import { describe, expect, it, vi } from "vitest";
import { messages } from "./messages";
import {
  formatDate,
  translate,
  translateText,
  type MessageKey
} from "./translate";
import { parseAppSettings } from "../schemas";

describe("localization contract", () => {
  it("translates explicit UI keys and preserves interpolated user text", () => {
    expect(translate("en", "Einstellungen")).toBe("Settings");
    expect(translate("de", "Einstellungen")).toBe("Einstellungen");
    expect(translate("en", "Profil „{0}“ löschen", "Holz ${secret} <b>")).toBe(
      "Delete profile “Holz ${secret} <b>”"
    );
    expect(translateText("en", "Profil „Holz“ löschen")).toBe(
      "Delete profile “Holz”"
    );
  });

  it("provides deterministic fallback for unknown dynamic diagnostics", () => {
    expect(translateText("en", "A new diagnostic: 42")).toBe(
      "A new diagnostic: 42"
    );
    expect(translateText("en", "Die Sprache wurde lokal gespeichert.")).toBe(
      "Language saved locally."
    );
    expect(
      translateText(
        "en",
        "Workspace mit 3 Profil(en) wurde als JSON bereitgestellt."
      )
    ).toBe("Workspace with 3 profile(s) prepared as JSON.");
  });

  it("makes missing static keys visible in development", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(translate("en", "missing.test.key" as MessageKey)).toBe(
      "missing.test.key"
    );
    expect(warning).toHaveBeenCalledWith(
      "Missing translation: missing.test.key"
    );
    warning.mockRestore();
  });

  it("has reviewed translations and no newly invented interpolation slots", () => {
    expect(Object.keys(messages).length).toBeGreaterThan(2400);
    for (const [source, target] of Object.entries(messages)) {
      for (const token of target.match(/\{\d+\}/g) ?? [])
        expect(source, source).toContain(token);
    }
  });

  it("formats dates in the selected locale and tolerates invalid timestamps", () => {
    expect(formatDate("en", "2026-09-12T12:30:00Z")).toMatch(/12 Sept 2026/);
    expect(formatDate("de", "2026-09-12T12:30:00Z")).toContain("12.09.2026");
    expect(formatDate("en", "invalid")).toBe("invalid");
  });

  it("defaults older settings to German without changing the V2 contract", () => {
    const settings = parseAppSettings({
      schemaVersion: 2,
      kind: "appSettings",
      theme: "system",
      startView: "dashboard",
      activeBaseProfileId: null,
      updatedAt: "2026-09-12T12:30:00Z"
    });
    expect(settings.locale).toBe("de");
    expect(parseAppSettings({ ...settings, locale: "en" }).schemaVersion).toBe(
      2
    );
    expect(() => parseAppSettings({ ...settings, locale: "xx" })).toThrow();
  });
});
