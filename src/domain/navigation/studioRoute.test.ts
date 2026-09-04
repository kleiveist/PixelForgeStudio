import { describe, expect, it } from "vitest";
import { StableIdSchema } from "../../schemas";
import {
  ANIMATION_STUDIO_VIEW_IDS,
  PROJECT_QUERY_PARAMETER,
  PROMPT_STUDIO_VIEW_IDS,
  STUDIO_IDS,
  STUDIO_QUERY_PARAMETER,
  VIEW_QUERY_PARAMETER,
  createPromptStudioRoute,
  isAnimationStudioView,
  isPromptStudioView,
  isStudioId,
  parseStudioRouteSearch,
  promptStudioViewOf,
  serializeStudioRoute,
  studioRoutesEqual,
  type StudioRoute
} from "./index";

describe("studio route domain", () => {
  it("defines the roof studios and their separate readonly view catalogs", () => {
    expect(STUDIO_IDS).toEqual(["home", "prompt", "animation"]);
    expect(PROMPT_STUDIO_VIEW_IDS).toEqual([
      "dashboard",
      "profiles",
      "wizard",
      "output",
      "settings"
    ]);
    expect(ANIMATION_STUDIO_VIEW_IDS).toEqual([
      "projects",
      "workspace",
      "library",
      "rigs"
    ]);
    expect(STUDIO_IDS.every(isStudioId)).toBe(true);
    expect(PROMPT_STUDIO_VIEW_IDS.every(isPromptStudioView)).toBe(true);
    expect(ANIMATION_STUDIO_VIEW_IDS.every(isAnimationStudioView)).toBe(true);
    expect(isStudioId("elsewhere")).toBe(false);
    expect(isPromptStudioView("projects")).toBe(false);
    expect(isAnimationStudioView("dashboard")).toBe(false);
  });

  it.each(PROMPT_STUDIO_VIEW_IDS)(
    "recognizes the legacy ?view=%s route for canonicalization",
    (view) => {
      expect(parseStudioRouteSearch(`?view=${view}`)).toEqual({
        status: "legacy",
        route: { studio: "prompt", view }
      });
    }
  );

  it.each(["?view=review", "?studio=prompt&view=review"])(
    "canonicalizes the removed review route to output: %s",
    (search) => {
      expect(parseStudioRouteSearch(search)).toEqual({
        status: "legacy",
        route: { studio: "prompt", view: "output" }
      });
    }
  );

  it("distinguishes a missing route from a valid home route", () => {
    expect(parseStudioRouteSearch("")).toEqual({ status: "missing" });
    expect(parseStudioRouteSearch("?mode=compact")).toEqual({
      status: "missing"
    });
    expect(parseStudioRouteSearch("?studio=home")).toEqual({
      status: "valid",
      route: { studio: "home" }
    });
  });

  it.each(PROMPT_STUDIO_VIEW_IDS)(
    "parses the canonical Prompt Studio %s route",
    (view) => {
      expect(
        parseStudioRouteSearch(`?studio=prompt&view=${view}`)
      ).toEqual({
        status: "valid",
        route: { studio: "prompt", view }
      });
    }
  );

  it.each(ANIMATION_STUDIO_VIEW_IDS)(
    "parses the canonical Animation Studio %s route",
    (view) => {
      expect(
        parseStudioRouteSearch(`?studio=animation&view=${view}`)
      ).toEqual({
        status: "valid",
        route: { studio: "animation", view }
      });
    }
  );

  it("accepts only a validated StableId on the animation workspace", () => {
    const projectId = StableIdSchema.parse("project_winter-forest_01");

    expect(
      parseStudioRouteSearch(
        `?studio=animation&view=workspace&project=${projectId}`
      )
    ).toEqual({
      status: "valid",
      route: { studio: "animation", view: "workspace", projectId }
    });
    expect(
      parseStudioRouteSearch(
        "?studio=animation&view=workspace&project=../raw-file.png"
      )
    ).toEqual({
      status: "invalid",
      reason: "invalidProjectId",
      parameter: PROJECT_QUERY_PARAMETER,
      value: "../raw-file.png"
    });
  });

  it.each([
    "?project=project_01",
    "?view=dashboard&project=project_01",
    "?studio=home&project=project_01",
    "?studio=prompt&view=dashboard&project=project_01",
    "?studio=animation&view=projects&project=project_01"
  ])("rejects a project parameter outside an animation workspace: %s", (search) => {
    expect(parseStudioRouteSearch(search)).toMatchObject({
      status: "invalid",
      reason: "unexpectedProject",
      parameter: PROJECT_QUERY_PARAMETER
    });
  });

  it.each([
    [
      "?studio=prompt&studio=animation&view=dashboard",
      STUDIO_QUERY_PARAMETER,
      ["prompt", "animation"]
    ],
    [
      "?studio=prompt&view=dashboard&view=wizard",
      VIEW_QUERY_PARAMETER,
      ["dashboard", "wizard"]
    ],
    [
      "?studio=animation&view=workspace&project=one&project=two",
      PROJECT_QUERY_PARAMETER,
      ["one", "two"]
    ]
  ] as const)("rejects duplicate controlled parameters in %s", (search, parameter, values) => {
    expect(parseStudioRouteSearch(search)).toEqual({
      status: "invalid",
      reason: "duplicateParameter",
      parameter,
      values
    });
  });

  it("returns structured errors for unknown, incomplete, and ambiguous routes", () => {
    expect(parseStudioRouteSearch("?studio=unknown&view=dashboard")).toEqual({
      status: "invalid",
      reason: "unknownStudio",
      parameter: STUDIO_QUERY_PARAMETER,
      value: "unknown"
    });
    expect(parseStudioRouteSearch("?studio=prompt")).toEqual({
      status: "invalid",
      reason: "missingView",
      parameter: VIEW_QUERY_PARAMETER
    });
    expect(parseStudioRouteSearch("?studio=prompt&view=projects")).toEqual({
      status: "invalid",
      reason: "unknownView",
      parameter: VIEW_QUERY_PARAMETER,
      value: "projects"
    });
    expect(parseStudioRouteSearch("?studio=animation&view=dashboard")).toEqual({
      status: "invalid",
      reason: "unknownView",
      parameter: VIEW_QUERY_PARAMETER,
      value: "dashboard"
    });
    expect(parseStudioRouteSearch("?studio=home&view=dashboard")).toEqual({
      status: "invalid",
      reason: "unexpectedView",
      parameter: VIEW_QUERY_PARAMETER,
      value: "dashboard"
    });
  });

  it("roundtrips every canonical route", () => {
    const routes: readonly StudioRoute[] = [
      { studio: "home" },
      ...PROMPT_STUDIO_VIEW_IDS.map(createPromptStudioRoute),
      ...ANIMATION_STUDIO_VIEW_IDS.map((view) => ({
        studio: "animation" as const,
        view
      })),
      {
        studio: "animation",
        view: "workspace",
        projectId: StableIdSchema.parse("project_01")
      }
    ];

    for (const route of routes) {
      expect(parseStudioRouteSearch(serializeStudioRoute(route))).toEqual({
        status: "valid",
        route
      });
    }
  });

  it("preserves foreign parameters while replacing controlled parameters canonically", () => {
    expect(
      serializeStudioRoute(
        { studio: "prompt", view: "output" },
        "?studio=animation&view=workspace&project=old_project&mode=compact&tag=a&tag=b"
      )
    ).toBe("?studio=prompt&view=output&mode=compact&tag=a&tag=b");
    expect(
      parseStudioRouteSearch(
        "?studio=prompt&view=output&mode=compact&tag=a&tag=b"
      )
    ).toEqual({
      status: "valid",
      route: { studio: "prompt", view: "output" }
    });
  });

  it.each([STUDIO_QUERY_PARAMETER, VIEW_QUERY_PARAMETER, PROJECT_QUERY_PARAMETER])(
    "does not silently serialize duplicate %s parameters",
    (parameter) => {
      expect(() =>
        serializeStudioRoute(
          { studio: "prompt", view: "dashboard" },
          `?${parameter}=one&${parameter}=two`
        )
      ).toThrowError(`duplicate "${parameter}" parameters`);
    }
  );

  it("compares routes and projects without serializing them", () => {
    const dashboard = createPromptStudioRoute("dashboard");
    expect(studioRoutesEqual(dashboard, { ...dashboard })).toBe(true);
    expect(
      studioRoutesEqual(dashboard, createPromptStudioRoute("wizard"))
    ).toBe(false);
    expect(
      studioRoutesEqual(
        {
          studio: "animation",
          view: "workspace",
          projectId: StableIdSchema.parse("project_one")
        },
        {
          studio: "animation",
          view: "workspace",
          projectId: StableIdSchema.parse("project_two")
        }
      )
    ).toBe(false);
    expect(promptStudioViewOf(dashboard)).toBe("dashboard");
    expect(promptStudioViewOf({ studio: "home" })).toBeNull();
  });
});
