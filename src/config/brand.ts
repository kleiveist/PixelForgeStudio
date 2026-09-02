export const BRAND = Object.freeze({
  productName: "PixelForge Prompt Studio",
  shortName: "PixelForge",
  versionLabel: "V2",
  tagline: "Geführte Prompt-Produktion für konsistente Pixelart-Assets"
} as const);

// Persisted export bundles use this stable protocol discriminator. It must not
// change as part of a future visual rebrand.
export const EXPORT_APPLICATION_ID = "PixelForge Prompt Studio" as const;
