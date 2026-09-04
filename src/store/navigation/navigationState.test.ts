import { describe, expect, it } from "vitest";
import {
  createNavigationState,
  navigationReducer,
  resolveInitialRoute,
  resolveInitialView,
  resolvePromptStudioView
} from "./index";

describe("navigation state", () => {
  it("prioritizes a valid location route over the fallback", () => {
    expect(
      resolveInitialRoute(
        {
          status: "valid",
          route: { studio: "animation", view: "projects" }
        },
        { studio: "prompt", view: "profiles" }
      )
    ).toEqual({ studio: "animation", view: "projects" });
  });

  it("keeps a valid legacy Prompt route before it is canonicalized", () => {
    expect(
      resolveInitialRoute(
        {
          status: "legacy",
          route: { studio: "prompt", view: "output" }
        },
        { studio: "home" }
      )
    ).toEqual({ studio: "prompt", view: "output" });
  });

  it("uses the injected fallback for missing and invalid routes", () => {
    const fallback = { studio: "prompt", view: "profiles" } as const;
    expect(resolveInitialRoute({ status: "missing" }, fallback)).toBe(
      fallback
    );
    expect(
      resolveInitialRoute(
        {
          status: "invalid",
          reason: "unknownStudio",
          parameter: "studio",
          value: "elsewhere"
        },
        fallback
      )
    ).toBe(fallback);
  });

  it("keeps equal route actions referentially stable", () => {
    const state = createNavigationState(
      {
        status: "valid",
        route: { studio: "animation", view: "workspace" }
      },
      { studio: "home" }
    );

    expect(
      navigationReducer(state, {
        type: "routeChanged",
        route: { studio: "animation", view: "workspace" }
      })
    ).toBe(state);
    expect(
      navigationReducer(state, {
        type: "routeChanged",
        route: { studio: "prompt", view: "review" }
      })
    ).toEqual({ activeRoute: { studio: "prompt", view: "review" } });
  });

  it("projects a temporary Prompt view alias without changing the roof route", () => {
    expect(
      resolvePromptStudioView(
        { studio: "animation", view: "projects" },
        "settings"
      )
    ).toBe("settings");
    expect(
      resolvePromptStudioView(
        { studio: "prompt", view: "wizard" },
        "settings"
      )
    ).toBe("wizard");
    expect(
      resolveInitialView(
        { status: "valid", route: { studio: "home" } },
        "dashboard"
      )
    ).toBe("dashboard");
  });
});
