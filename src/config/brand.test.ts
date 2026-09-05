import { describe, expect, it } from "vitest";
import {
  ANIMATION_EXPORT_APPLICATION_ID,
  BRAND,
  EXPORT_APPLICATION_ID,
  PROMPT_EXPORT_APPLICATION_ID
} from "./index";

describe("PixelForge Studio brand contract", () => {
  it("defines the umbrella product and both modules centrally", () => {
    expect(BRAND.productName).toBe("PixelForge Studio");
    expect(BRAND.shortName).toBe("PixelForge");
    expect(BRAND.versionLabel).toBe("V3");
    expect(BRAND.modules).toEqual({
      prompt: {
        productName: "PixelForge Prompt Studio",
        shortLabel: "Prompt Studio"
      },
      animation: {
        productName: "PixelForge Animation Studio",
        shortLabel: "Animation Studio"
      }
    });
  });

  it("keeps the prompt protocol identifier stable and reserves a separate animation id", () => {
    expect(PROMPT_EXPORT_APPLICATION_ID).toBe("PixelForge Prompt Studio");
    expect(EXPORT_APPLICATION_ID).toBe(PROMPT_EXPORT_APPLICATION_ID);
    expect(ANIMATION_EXPORT_APPLICATION_ID).toBe(
      "PixelForge Animation Studio"
    );
    expect(ANIMATION_EXPORT_APPLICATION_ID).not.toBe(
      PROMPT_EXPORT_APPLICATION_ID
    );
  });
});
