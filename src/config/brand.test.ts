import { describe, expect, it } from "vitest";
import {
  BRAND,
  EXPORT_APPLICATION_ID,
  PROMPT_EXPORT_APPLICATION_ID
} from "./index";

describe("PixelForge Prompt Studio brand contract", () => {
  it("defines the Prompt-only product centrally", () => {
    expect(BRAND.productName).toBe("PixelForge Prompt Studio");
    expect(BRAND.shortName).toBe("PixelForge");
    expect(BRAND.versionLabel).toBe("V2");
    expect(BRAND.modules).toEqual({
      prompt: {
        productName: "PixelForge Prompt Studio",
        shortLabel: "Prompt Studio"
      }
    });
  });

  it("keeps the prompt protocol identifier stable", () => {
    expect(PROMPT_EXPORT_APPLICATION_ID).toBe("PixelForge Prompt Studio");
    expect(EXPORT_APPLICATION_ID).toBe(PROMPT_EXPORT_APPLICATION_ID);
  });
});
