import { describe, expect, it } from "vitest";
import {
  APP_VIEW_IDS,
  PROMPT_STUDIO_VIEW_IDS,
  createAppViewSearch,
  isAppView,
  parseAppViewSearch
} from "./index";

describe("app view routes", () => {
  it("defines the six stable top-level views", () => {
    expect(APP_VIEW_IDS).toEqual([
      "dashboard",
      "profiles",
      "wizard",
      "review",
      "output",
      "settings"
    ]);
    expect(APP_VIEW_IDS).toBe(PROMPT_STUDIO_VIEW_IDS);
    expect(APP_VIEW_IDS.every(isAppView)).toBe(true);
    expect(isAppView("Dashboard")).toBe(false);
    expect(isAppView(null)).toBe(false);
  });

  it.each(APP_VIEW_IDS)("roundtrips the %s view", (view) => {
    expect(parseAppViewSearch(createAppViewSearch(view))).toEqual({
      status: "valid",
      view
    });
  });

  it("distinguishes missing and invalid view parameters", () => {
    expect(parseAppViewSearch("?project=forest")).toEqual({
      status: "missing"
    });
    expect(parseAppViewSearch("?view=unknown")).toEqual({
      status: "invalid",
      value: "unknown"
    });
    expect(parseAppViewSearch("?view=")).toEqual({
      status: "invalid",
      value: ""
    });
    expect(parseAppViewSearch("?view=wizard&view=output")).toEqual({
      status: "invalid",
      value: "wizard"
    });
  });

  it("preserves unrelated query parameters while canonicalizing the view", () => {
    expect(
      createAppViewSearch(
        "review",
        "?project=winter-forest&view=dashboard&view=wizard&mode=compact"
      )
    ).toBe("?project=winter-forest&view=review&mode=compact");
  });
});
