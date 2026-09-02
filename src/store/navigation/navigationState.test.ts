import { describe, expect, it } from "vitest";
import {
  createNavigationState,
  navigationReducer,
  resolveInitialView
} from "./index";

describe("navigation state", () => {
  it("prioritizes a valid location route over the fallback", () => {
    expect(
      resolveInitialView({ status: "valid", view: "output" }, "profiles")
    ).toBe("output");
  });

  it("uses the validated fallback for missing and invalid routes", () => {
    expect(resolveInitialView({ status: "missing" }, "profiles")).toBe(
      "profiles"
    );
    expect(
      resolveInitialView(
        { status: "invalid", value: "elsewhere" },
        "dashboard"
      )
    ).toBe("dashboard");
  });

  it("keeps same-view actions referentially stable", () => {
    const state = createNavigationState(
      { status: "valid", view: "wizard" },
      "dashboard"
    );

    expect(
      navigationReducer(state, { type: "viewChanged", view: "wizard" })
    ).toBe(state);
    expect(
      navigationReducer(state, { type: "viewChanged", view: "review" })
    ).toEqual({ activeView: "review" });
  });
});
