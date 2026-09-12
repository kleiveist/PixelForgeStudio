export const BRAND = Object.freeze({
  productName: "PixelForge Prompt Studio",
  shortName: "PixelForge",
  versionLabel: "V2",
  tagline: "Lokale Prompt-Produktion für konsistente Pixelart-Assets",
  modules: Object.freeze({
    prompt: Object.freeze({
      productName: "PixelForge Prompt Studio",
      shortLabel: "Prompt Studio"
    })
  })
} as const);

// Persisted prompt bundles use this stable protocol discriminator. Visual
// branding and future animation formats must not change it.
export const PROMPT_EXPORT_APPLICATION_ID = "PixelForge Prompt Studio" as const;

// Backward-compatible public alias retained for existing consumers.
export const EXPORT_APPLICATION_ID = PROMPT_EXPORT_APPLICATION_ID;
