import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import metadata from "../../package.json";
import {
  BRAND,
  EXPORT_APPLICATION_ID,
  PROMPT_EXPORT_APPLICATION_ID
} from "./index";

describe("PixelForge Prompt Studio brand contract", () => {
  it("defines the Prompt-only product centrally", () => {
    expect(BRAND.productName).toBe("PixelForge Prompt Studio");
    expect(BRAND.shortName).toBe("PixelForge");
    expect(BRAND.version).toBe("1.0.0");
    expect(BRAND.versionLabel).toBe("v1.0.0");
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

  it("keeps package metadata private and separate from the data protocol", () => {
    expect(metadata.private).toBe(true);
    expect(metadata.version).toBe(BRAND.version);
    expect(metadata.description).toBe("Local-first prompt studio for consistent pixel-art production.");
  });

  it.each(["favicon", "logo"])("ships an accessible self-contained %s SVG", (name) => {
    const source = readFileSync(`public/${name}.svg`, "utf8");
    const document = new DOMParser().parseFromString(source, "image/svg+xml");
    expect(document.querySelector("parsererror")).toBeNull();
    expect(document.documentElement.getAttribute("role")).toBe("img");
    expect(document.querySelector("title")?.textContent).toBe(BRAND.productName);
    expect(document.querySelector("script, foreignObject, image")).toBeNull();
    expect(source).not.toMatch(/(?:href|onload)=/);
  });
});
