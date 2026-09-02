import { describe, expect, it } from "vitest";
import {
  AssetCategoryDataSchema,
  AssetProfileSchema,
  parseAppSettings,
  parseAssetProfile,
  parseBaseProfile,
  parseCategoryProfile,
  parseExportBundle,
  parseWizardDraft
} from "./index";

const timestamp = "2026-09-02T12:00:00.000Z";

const baseProfileInput = {
  schemaVersion: 2,
  kind: "baseProfile",
  id: "base_world_32_80",
  name: "Weltassets 32 px / Figuren 80 px",
  iconId: "world-grid",
  values: {
    pixelDensity: "modernHd",
    tileSize: 32,
    characterHeight: 80,
    perspectiveType: "threeQuarter",
    cameraAngle: 60,
    cameraDirection: "southToNorth",
    projectionType: "orthographic",
    outlineStyle: "softSelective",
    paletteMode: "byProfile",
    backgroundMode: "transparent",
    alphaPadding: 8,
    nearestNeighbor: true,
    lightingDefaults: {
      policy: "adaptive",
      notes: "Keep the world-space light direction stable."
    }
  },
  locks: {
    pixelDensity: true,
    tileSize: true,
    characterHeight: true,
    perspectiveType: true,
    cameraAngle: true,
    projectionType: true,
    outlineStyle: true
  },
  createdAt: timestamp,
  updatedAt: timestamp
} as const;

const npcCapabilities = {
  movable: true,
  directional: true,
  animated: true,
  transparent: true,
  scaledCharacter: true
} as const;

const categoryProfileInput = {
  schemaVersion: 2,
  kind: "categoryProfile",
  id: "category_npc_80",
  name: "NPCs 80 px",
  baseProfileId: "base_world_32_80",
  category: "character",
  subtype: "npc",
  iconId: "character-npc",
  capabilities: npcCapabilities,
  overrides: {},
  defaults: {
    role: "villager",
    directionCount: 8,
    animationAction: "walk",
    framesPerDirection: 5
  },
  tags: ["npc", "80px"],
  createdAt: timestamp,
  updatedAt: timestamp
} as const;

const assetProfileInput = {
  schemaVersion: 2,
  kind: "assetProfile",
  id: "asset_npc_blacksmith_001",
  name: "Dorfschmied mit Lederschürze",
  baseProfileId: "base_world_32_80",
  categoryProfileId: "category_npc_80",
  compatibilityKey:
    "modern-hd__tile-32__char-80__three-quarter-60__orthographic__outline-soft-selective",
  category: "character",
  subtype: "npc",
  iconId: "character-npc",
  badgeIconIds: ["profession-craft", "material-leather"],
  capabilities: npcCapabilities,
  overrides: {},
  answers: {
    role: "blacksmith",
    hat: "none",
    scarf: "short",
    outerwear: "leather-apron",
    animationAction: "walk",
    directionCount: 8,
    framesPerDirection: 5
  },
  tags: ["npc", "village", "craft", "leather", "80px"],
  favorite: false,
  createdAt: timestamp,
  updatedAt: timestamp
} as const;

const appSettingsInput = {
  schemaVersion: 2,
  kind: "appSettings",
  theme: "system",
  locale: "de",
  startView: "dashboard",
  activeBaseProfileId: "base_world_32_80",
  updatedAt: timestamp
} as const;

const wizardDraftInput = {
  schemaVersion: 2,
  kind: "wizardDraft",
  draftId: "draft_blacksmith_001",
  projectName: "Dorfschmied",
  route: "wizard/editor",
  currentStep: "character-motion",
  baseProfileId: "base_world_32_80",
  categoryProfileId: "category_npc_80",
  category: "character",
  subtype: "npc",
  answers: {
    role: "blacksmith",
    animationAction: "walk",
    directionCount: 8
  },
  validation: { errors: [], warnings: [] },
  savedAt: timestamp
} as const;

describe("V2-Zod-Verträge", () => {
  it("parst alle sechs V2-Verträge aus unknown", () => {
    const unknownBaseProfile: unknown = baseProfileInput;
    const unknownCategoryProfile: unknown = categoryProfileInput;
    const unknownAssetProfile: unknown = assetProfileInput;
    const unknownSettings: unknown = appSettingsInput;
    const unknownDraft: unknown = wizardDraftInput;

    const baseProfile = parseBaseProfile(unknownBaseProfile);
    const categoryProfile = parseCategoryProfile(unknownCategoryProfile);
    const assetProfile = parseAssetProfile(unknownAssetProfile);
    const settings = parseAppSettings(unknownSettings);
    const draft = parseWizardDraft(unknownDraft);
    const bundle = parseExportBundle({
      schemaVersion: 2,
      formatVersion: 2,
      kind: "exportBundle",
      application: "PixelForge Prompt Studio",
      bundleId: "bundle_profiles_001",
      exportedAt: timestamp,
      baseProfiles: [unknownBaseProfile],
      categoryProfiles: [unknownCategoryProfile],
      assetProfiles: [unknownAssetProfile],
      appSettings: unknownSettings,
      wizardDrafts: [unknownDraft]
    });

    expect(baseProfile.values.tileSize).toBe(32);
    expect(categoryProfile.category).toBe("character");
    expect(assetProfile.category).toBe("character");
    if (assetProfile.category !== "character") {
      throw new Error("Expected the fixture to parse as a character profile.");
    }
    expect(assetProfile.answers.role).toBe("blacksmith");
    expect(settings.theme).toBe("system");
    expect(draft.currentStep).toBe("character-motion");
    expect(bundle.assetProfiles).toHaveLength(1);
  });

  it("hält stabile IDs unabhängig von umbenennbaren Anzeigenamen", () => {
    const original = parseBaseProfile(baseProfileInput);
    const renamed = parseBaseProfile({ ...baseProfileInput, name: "Umbenanntes Weltprofil" });

    expect(renamed.id).toBe(original.id);
    expect(renamed.name).not.toBe(original.name);
  });

  it("weist fehlende Pflichtfelder zurück", () => {
    const withoutName = Object.fromEntries(
      Object.entries(baseProfileInput).filter(([key]) => key !== "name")
    );
    const incompleteBundle = {
      schemaVersion: 2,
      formatVersion: 2,
      kind: "exportBundle",
      application: "PixelForge Prompt Studio",
      bundleId: "bundle_incomplete_001",
      exportedAt: timestamp
    };

    expect(() => parseBaseProfile(withoutName)).toThrow();
    expect(() => parseExportBundle(incompleteBundle)).toThrow();
  });

  it("weist unbekannte Kategorien und unpassende Untertypen zurück", () => {
    expect(() =>
      parseAssetProfile({ ...assetProfileInput, category: "vehicle", subtype: "cart" })
    ).toThrow();
    expect(() =>
      parseAssetProfile({ ...assetProfileInput, category: "texture", subtype: "npc" })
    ).toThrow();
  });

  it("weist inkompatible Schema- und Formatversionen zurück", () => {
    expect(() => parseBaseProfile({ ...baseProfileInput, schemaVersion: 1 })).toThrow();
    expect(() =>
      parseExportBundle({
        schemaVersion: 2,
        formatVersion: 1,
        kind: "exportBundle",
        application: "PixelForge Prompt Studio",
        bundleId: "bundle_old_001",
        exportedAt: timestamp,
        baseProfiles: [],
        categoryProfiles: [],
        assetProfiles: [],
        wizardDrafts: []
      })
    ).toThrow();
  });

  it("blockiert Richtungsdaten für einen nicht-directional schwebenden Kristall", () => {
    const crystalProfile = {
      ...assetProfileInput,
      id: "asset_floating_crystal_001",
      name: "Pulsierender Kristall",
      categoryProfileId: undefined,
      category: "movingObject",
      subtype: "floatingCrystal",
      iconId: "moving-crystal",
      badgeIconIds: [],
      capabilities: {
        movable: true,
        animated: true,
        transparent: true,
        footprint: true
      },
      answers: {
        movementType: "hover",
        animationType: "pulse",
        directionCount: 8
      },
      tags: ["crystal"]
    };

    expect(() => parseAssetProfile(crystalProfile)).toThrow(
      "Direction counts are only valid for directional asset subtypes."
    );
  });

  it("verhindert kategoriefremde Antworten durch die discriminated union", () => {
    expect(() =>
      AssetCategoryDataSchema.parse({
        category: "texture",
        subtype: "wood",
        answers: { seamless: true, directionCount: 8 }
      })
    ).toThrow();
  });

  it("weist manipulierte Capability-Snapshots zurück", () => {
    const result = AssetProfileSchema.safeParse({
        ...assetProfileInput,
        capabilities: { ...npcCapabilities, directional: false }
      });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("Manipulated capabilities must not parse.");
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        path: ["capabilities", "directional"],
        message: expect.stringContaining('Capability "directional" does not match')
      })
    );
  });
});
