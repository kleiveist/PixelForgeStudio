import { version } from "../../package.json";

export const BRAND = Object.freeze({
  productName: "PixelForge Prompt Studio",
  shortName: "PixelForge",
  version,
  versionLabel: `v${version}`,
  tagline: "Lokale Prompt-Produktion für konsistente Pixelart-Assets",
  modules: Object.freeze({
    prompt: Object.freeze({
      productName: "PixelForge Prompt Studio",
      shortLabel: "Prompt Studio"
    })
  })
} as const);

// Persisted prompt bundles use this stable protocol discriminator. Visual
// branding and release versions must not change it.
export const PROMPT_EXPORT_APPLICATION_ID = "PixelForge Prompt Studio" as const;

// Backward-compatible public alias retained for existing consumers.
export const EXPORT_APPLICATION_ID = PROMPT_EXPORT_APPLICATION_ID;
