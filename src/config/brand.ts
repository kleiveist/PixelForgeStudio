export const BRAND = Object.freeze({
  productName: "PixelForge Studio",
  shortName: "PixelForge",
  versionLabel: "V3",
  tagline: "Lokale Prompt-Produktion und Pixelanimation aus einer Oberfläche",
  modules: Object.freeze({
    prompt: Object.freeze({
      productName: "PixelForge Prompt Studio",
      shortLabel: "Prompt Studio"
    }),
    animation: Object.freeze({
      productName: "PixelForge Animation Studio",
      shortLabel: "Animation Studio"
    })
  })
} as const);

// Persisted prompt bundles use this stable protocol discriminator. Visual
// branding and future animation formats must not change it.
export const PROMPT_EXPORT_APPLICATION_ID = "PixelForge Prompt Studio" as const;

// Backward-compatible public alias retained for existing consumers.
export const EXPORT_APPLICATION_ID = PROMPT_EXPORT_APPLICATION_ID;

// Stable protocol discriminator for Animation Studio V1 metadata and bundles.
export const ANIMATION_EXPORT_APPLICATION_ID =
  "PixelForge Animation Studio" as const;
