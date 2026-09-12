import { describe, expect, it } from "vitest";
import {
  createNavigationState,
  navigationReducer,
  resolveInitialRoute,
  resolveInitialView,
  resolvePromptStudioView
} from "./index";

describe("navigation state", () => {
  const fallback = { studio: "prompt", view: "profiles" } as const;

  it("prioritizes canonical and legacy Prompt routes", () => {
    expect(
      resolveInitialRoute(
        {
          status: "valid",
          route: { studio: "prompt", view: "dashboard" }
        },
        fallback
      )
    ).toEqual({ studio: "prompt", view: "dashboard" });
    expect(
      resolveInitialRoute(
        {
          status: "legacy",
          route: { studio: "prompt", view: "output" }
        },
        fallback
      )
    ).toEqual({ studio: "prompt", view: "output" });
  });

  it("uses the injected fallback for missing and retired routes", () => {
    expect(resolveInitialRoute({ status: "missing" }, fallback)).toBe(fallback);
    expect(
      resolveInitialRoute(
        {
          status: "invalid",
          reason: "unknownStudio",
          parameter: "studio",
          value: "animation"
        },
        fallback
      )
    ).toBe(fallback);
  });

  it("keeps equal route actions referentially stable", () => {
    const state = createNavigationState(
      {
        status: "valid",
        route: { studio: "prompt", view: "wizard" }
      },
      fallback
    );

    expect(
      navigationReducer(state, {
        type: "routeChanged",
        route: { studio: "prompt", view: "wizard" }
      })
    ).toBe(state);
    expect(
      navigationReducer(state, {
        type: "routeChanged",
        route: { studio: "prompt", view: "output" }
      })
    ).toEqual({ activeRoute: { studio: "prompt", view: "output" } });
  });

  it("projects Prompt views through the compatibility helpers", () => {
    expect(
      resolvePromptStudioView(
        { studio: "prompt", view: "wizard" },
        "settings"
      )
    ).toBe("wizard");
    expect(
      resolveInitialView(
        { status: "valid", route: { studio: "prompt", view: "dashboard" } },
        "settings"
      )
    ).toBe("dashboard");
  });
});
