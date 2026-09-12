import { describe, expect, it } from "vitest";
import { BRAND } from "../config";
import { PROMPT_STUDIO_VIEW_IDS } from "../domain/navigation";
import {
  studioRouteContextLabel,
  studioRouteHeadingId,
  studioRouteTitle
} from "./studioViewConfig";

describe("Prompt Studio view metadata", () => {
  it("provides a title and heading target for every Prompt view", () => {
    for (const view of PROMPT_STUDIO_VIEW_IDS) {
      const route = { studio: "prompt", view } as const;
      expect(studioRouteTitle(route)).toContain(BRAND.productName);
      expect(studioRouteHeadingId(route)).toBe(`${view}-view-title`);
      expect(studioRouteContextLabel(route)).toBe(BRAND.productName);
    }
  });
});
