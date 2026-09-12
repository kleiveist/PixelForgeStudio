import { describe, expect, it } from "vitest";
import {
  PROMPT_STUDIO_VIEW_IDS,
  createPromptStudioRoute,
  isPromptStudioView,
  parseStudioRouteSearch,
  serializeStudioRoute,
  studioRoutesEqual,
  type StudioRoute
} from "./index";

describe("Prompt Studio routes", () => {
  it("exposes only the five Prompt Studio views", () => {
    expect(PROMPT_STUDIO_VIEW_IDS).toEqual([
      "dashboard",
      "profiles",
      "wizard",
      "output",
      "settings"
    ]);
    expect(isPromptStudioView("wizard")).toBe(true);
    expect(isPromptStudioView("projects")).toBe(false);
  });

  it("parses canonical and legacy Prompt routes", () => {
    expect(parseStudioRouteSearch("?studio=prompt&view=profiles")).toEqual({
      status: "valid",
      route: { studio: "prompt", view: "profiles" }
    });
    expect(parseStudioRouteSearch("?view=wizard")).toEqual({
      status: "legacy",
      route: { studio: "prompt", view: "wizard" }
    });
    expect(parseStudioRouteSearch("?view=review")).toEqual({
      status: "legacy",
      route: { studio: "prompt", view: "output" }
    });
    expect(parseStudioRouteSearch("")).toEqual({ status: "missing" });
  });

  it("rejects retired roof routes, project parameters, and ambiguous input", () => {
    expect(parseStudioRouteSearch("?studio=home")).toMatchObject({
      status: "invalid",
      reason: "unknownStudio",
      value: "home"
    });
    expect(
      parseStudioRouteSearch("?studio=animation&view=projects")
    ).toMatchObject({
      status: "invalid",
      reason: "unknownStudio",
      value: "animation"
    });
    expect(
      parseStudioRouteSearch("?studio=prompt&view=wizard&project=old")
    ).toMatchObject({
      status: "invalid",
      reason: "unexpectedProject"
    });
    expect(
      parseStudioRouteSearch("?studio=prompt&view=wizard&view=output")
    ).toMatchObject({
      status: "invalid",
      reason: "duplicateParameter",
      parameter: "view"
    });
    expect(parseStudioRouteSearch("?studio=prompt&view=unknown")).toMatchObject({
      status: "invalid",
      reason: "unknownView",
      value: "unknown"
    });
  });

  it("roundtrips every canonical Prompt route", () => {
    for (const view of PROMPT_STUDIO_VIEW_IDS) {
      const route = createPromptStudioRoute(view);
      expect(parseStudioRouteSearch(serializeStudioRoute(route))).toEqual({
        status: "valid",
        route
      });
    }
  });

  it("preserves foreign parameters and discards retired controlled parameters", () => {
    expect(
      serializeStudioRoute(
        { studio: "prompt", view: "settings" },
        "?studio=animation&view=workspace&project=old&mode=compact",
        { duplicateControlledParameters: "discard" }
      )
    ).toBe("?studio=prompt&view=settings&mode=compact");
  });

  it("compares routes without serializing them", () => {
    const dashboard: StudioRoute = { studio: "prompt", view: "dashboard" };
    expect(studioRoutesEqual(dashboard, { ...dashboard })).toBe(true);
    expect(
      studioRoutesEqual(dashboard, { studio: "prompt", view: "output" })
    ).toBe(false);
  });
});
