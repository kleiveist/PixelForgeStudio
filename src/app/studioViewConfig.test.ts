import { describe, expect, it } from "vitest";
import { BRAND } from "../config";
import { ANIMATION_STUDIO_VIEW_IDS } from "../domain/navigation";
import {
  ANIMATION_STUDIO_VIEW_DEFINITIONS,
  studioRouteContextLabel,
  studioRouteHeadingId,
  studioRouteTitle
} from "./studioViewConfig";

describe("studio view configuration", () => {
  it("defines every Animation Studio placeholder view", () => {
    expect(Object.keys(ANIMATION_STUDIO_VIEW_DEFINITIONS)).toEqual(
      ANIMATION_STUDIO_VIEW_IDS
    );
    expect(
      ANIMATION_STUDIO_VIEW_IDS.every(
        (view) => ANIMATION_STUDIO_VIEW_DEFINITIONS[view].label.length > 0
      )
    ).toBe(true);
    expect(ANIMATION_STUDIO_VIEW_DEFINITIONS.library.label).toBe(
      "Character Kits"
    );
  });

  it("derives titles, heading ids, and context labels from typed routes", () => {
    expect(studioRouteTitle({ studio: "home" })).toBe(BRAND.productName);
    expect(
      studioRouteTitle({ studio: "prompt", view: "wizard" })
    ).toBe("Wizard · Prompt Studio · PixelForge");
    expect(
      studioRouteTitle({ studio: "animation", view: "workspace" })
    ).toBe("Workspace · Animation Studio · PixelForge");
    expect(studioRouteHeadingId({ studio: "home" })).toBe(
      "studio-home-title"
    );
    expect(
      studioRouteHeadingId({ studio: "animation", view: "rigs" })
    ).toBe("animation-rigs-view-title");
    expect(
      studioRouteContextLabel({ studio: "prompt", view: "dashboard" })
    ).toBe(BRAND.modules.prompt.productName);
  });
});
