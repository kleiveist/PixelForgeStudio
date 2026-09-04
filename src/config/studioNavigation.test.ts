import { describe, expect, it } from "vitest";
import { BRAND } from "./brand";
import {
  STUDIO_MODULE_DEFINITIONS,
  STUDIO_MODULE_IDS,
  routeForStudioModule,
  studioModuleIdOf
} from "./studioNavigation";

describe("studio module navigation config", () => {
  it("derives both module labels from the central brand", () => {
    expect(STUDIO_MODULE_IDS).toEqual(["prompt", "animation"]);
    expect(STUDIO_MODULE_DEFINITIONS.prompt).toMatchObject({
      productName: BRAND.modules.prompt.productName,
      shortLabel: BRAND.modules.prompt.shortLabel,
      defaultRoute: { studio: "prompt", view: "dashboard" }
    });
    expect(STUDIO_MODULE_DEFINITIONS.animation).toMatchObject({
      productName: BRAND.modules.animation.productName,
      shortLabel: BRAND.modules.animation.shortLabel,
      defaultRoute: { studio: "animation", view: "projects" }
    });
  });

  it("keeps an active module route and otherwise selects its default", () => {
    const workspace = { studio: "animation", view: "workspace" } as const;
    expect(routeForStudioModule("animation", workspace)).toBe(workspace);
    expect(routeForStudioModule("prompt", workspace)).toEqual({
      studio: "prompt",
      view: "dashboard"
    });
    expect(routeForStudioModule("animation", { studio: "home" })).toEqual({
      studio: "animation",
      view: "projects"
    });
    expect(studioModuleIdOf(workspace)).toBe("animation");
    expect(studioModuleIdOf({ studio: "home" })).toBeNull();
  });
});
