import { describe, expect, it, vi } from "vitest";
import { createCompatibilityKey } from "../../domain/profiles";
import { resolveCapabilities } from "../../domain/assets";
import {
  ProfileLibrarySchema,
  parseAssetProfile,
  parseBaseProfile,
  parseWizardDraft,
  type AssetProfile,
  type BaseProfile,
  type ProfileLibrary,
  type WizardDraft
} from "../../schemas";
import type { StorageReadResult } from "../../services";
import {
  createDashboardData,
  readDashboardData,
  type DashboardStorage
} from "./dashboardData";

const defaultTimestamp = "2026-09-02T12:00:00.000Z";

const baseValues = {
  pixelDensity: "modernHd",
  styleProfile: "both",
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
    notes: "Keep world light stable."
  }
} as const;

interface BaseProfileFixtureOptions {
  readonly id?: string;
  readonly name?: string;
  readonly updatedAt?: string;
}

function createBaseProfile(
  options: BaseProfileFixtureOptions = {}
): BaseProfile {
  const updatedAt = options.updatedAt ?? defaultTimestamp;

  return parseBaseProfile({
    schemaVersion: 2,
    kind: "baseProfile",
    id: options.id ?? "base_world_32_80",
    name: options.name ?? "Weltassets 32 px / Figuren 80 px",
    iconId: "world-grid",
    values: baseValues,
    locks: {},
    createdAt: defaultTimestamp,
    updatedAt
  });
}

interface AssetFixtureOptions {
  readonly id: string;
  readonly name?: string;
  readonly favorite?: boolean;
  readonly updatedAt: string;
  readonly badgeIconIds?: readonly string[];
  readonly tags?: readonly string[];
}

function commonAssetFields(
  baseProfile: BaseProfile,
  options: AssetFixtureOptions
) {
  return {
    schemaVersion: 2,
    kind: "assetProfile",
    id: options.id,
    name: options.name ?? options.id,
    baseProfileId: baseProfile.id,
    badgeIconIds: options.badgeIconIds ?? [],
    overrides: {},
    tags: options.tags ?? [],
    favorite: options.favorite ?? false,
    createdAt: defaultTimestamp,
    updatedAt: options.updatedAt
  } as const;
}

function createCharacterProfile(
  baseProfile: BaseProfile,
  options: AssetFixtureOptions
): AssetProfile {
  const selection = { category: "character", subtype: "npc" } as const;

  return parseAssetProfile({
    ...commonAssetFields(baseProfile, options),
    compatibilityKey: createCompatibilityKey(baseProfile.values, selection),
    category: selection.category,
    subtype: selection.subtype,
    iconId: "character-npc",
    capabilities: resolveCapabilities(selection.category, selection.subtype),
    answers: {
      role: "blacksmith",
      directionCount: 8,
      animationAction: "walk",
      framesPerDirection: 5
    }
  });
}

function createTextureProfile(
  baseProfile: BaseProfile,
  options: AssetFixtureOptions
): AssetProfile {
  const selection = { category: "texture", subtype: "wood" } as const;

  return parseAssetProfile({
    ...commonAssetFields(baseProfile, options),
    compatibilityKey: createCompatibilityKey(baseProfile.values, selection),
    category: selection.category,
    subtype: selection.subtype,
    iconId: "texture-wood",
    capabilities: resolveCapabilities(selection.category, selection.subtype),
    answers: { seamless: true, structure: "fine" }
  });
}

function createArtworkProfile(
  baseProfile: BaseProfile,
  options: AssetFixtureOptions
): AssetProfile {
  const selection = { category: "artwork", subtype: "scene" } as const;

  return parseAssetProfile({
    ...commonAssetFields(baseProfile, options),
    compatibilityKey: createCompatibilityKey(baseProfile.values, selection),
    category: selection.category,
    subtype: selection.subtype,
    iconId: "artwork-scene",
    capabilities: resolveCapabilities(selection.category, selection.subtype),
    answers: { composition: "scene", background: "complete" }
  });
}

function createMovingProfile(
  baseProfile: BaseProfile,
  options: AssetFixtureOptions
): AssetProfile {
  const selection = {
    category: "movingObject",
    subtype: "floatingObject"
  } as const;

  return parseAssetProfile({
    ...commonAssetFields(baseProfile, options),
    compatibilityKey: createCompatibilityKey(baseProfile.values, selection),
    category: selection.category,
    subtype: selection.subtype,
    iconId: "moving-floating",
    capabilities: resolveCapabilities(selection.category, selection.subtype),
    answers: { movementType: "hover", animationType: "pulse" }
  });
}

function createNatureProfile(
  baseProfile: BaseProfile,
  options: AssetFixtureOptions,
  animationType?: "wind"
): AssetProfile {
  const selection = { category: "nature", subtype: "tree" } as const;

  return parseAssetProfile({
    ...commonAssetFields(baseProfile, options),
    compatibilityKey: createCompatibilityKey(baseProfile.values, selection),
    category: selection.category,
    subtype: selection.subtype,
    iconId: "nature-tree",
    capabilities: resolveCapabilities(selection.category, selection.subtype),
    answers: {
      climate: "temperate",
      ...(animationType ? { animationType } : {})
    }
  });
}

function createLibrary(
  baseProfiles: readonly BaseProfile[],
  assetProfiles: readonly AssetProfile[]
): ProfileLibrary {
  return ProfileLibrarySchema.parse({
    baseProfiles,
    categoryProfiles: [],
    assetProfiles
  });
}

function validProfiles(
  library: ProfileLibrary
): StorageReadResult<ProfileLibrary> {
  return { status: "valid", value: library };
}

const emptyDraftResult: StorageReadResult<WizardDraft> = { status: "empty" };

describe("dashboard data", () => {
  it("sorts recent and favorite profiles deterministically and applies dashboard limits", () => {
    const activeBase = createBaseProfile({
      id: "base_active",
      name: "Aktive Familie",
      updatedAt: "2026-08-01T10:00:00.000Z"
    });
    const newestBase = createBaseProfile({
      id: "base_newest",
      updatedAt: "2026-09-05T10:00:00.000Z"
    });
    const secondBase = createBaseProfile({
      id: "base_second",
      updatedAt: "2026-09-04T10:00:00.000Z"
    });
    const thirdBase = createBaseProfile({
      id: "base_third",
      updatedAt: "2026-09-03T10:00:00.000Z"
    });
    const oldestBase = createBaseProfile({
      id: "base_oldest",
      updatedAt: "2026-07-01T10:00:00.000Z"
    });
    const profiles = [
      createCharacterProfile(activeBase, {
        id: "asset_oldest",
        updatedAt: "2026-09-01T09:00:00.000Z",
        favorite: true
      }),
      createCharacterProfile(activeBase, {
        id: "asset_tie_b",
        updatedAt: "2026-09-02T09:00:00.000Z",
        favorite: true
      }),
      createCharacterProfile(activeBase, {
        id: "asset_tie_a",
        updatedAt: "2026-09-02T09:00:00.000Z",
        favorite: true
      }),
      createCharacterProfile(activeBase, {
        id: "asset_second",
        updatedAt: "2026-09-03T09:00:00.000Z"
      }),
      createCharacterProfile(activeBase, {
        id: "asset_newest",
        updatedAt: "2026-09-04T09:00:00.000Z",
        favorite: true
      })
    ];
    const library = createLibrary(
      [activeBase, newestBase, secondBase, thirdBase, oldestBase],
      profiles
    );

    const result = createDashboardData(
      validProfiles(library),
      emptyDraftResult,
      activeBase.id
    );

    expect(result.collectionStatus).toBe("ready");
    expect(result.recentProfiles.map(({ id }) => id)).toEqual([
      "asset_newest",
      "asset_second",
      "asset_tie_a"
    ]);
    expect(result.favoriteProfiles.map(({ id }) => id)).toEqual([
      "asset_newest",
      "asset_tie_a",
      "asset_tie_b"
    ]);
    expect(result.baseProfiles.map(({ id }) => id)).toEqual([
      "base_active",
      "base_newest",
      "base_second"
    ]);
    expect(result.baseProfiles[0]).toMatchObject({
      name: "Aktive Familie",
      active: true
    });
  });

  it("derives only relevant profile facts and canonical material badges", () => {
    const baseProfile = createBaseProfile();
    const character = createCharacterProfile(baseProfile, {
      id: "asset_character",
      name: "Dorfschmied",
      updatedAt: "2026-09-04T09:00:00.000Z",
      favorite: true,
      badgeIconIds: [
        "material-leather",
        "material-wood",
        "material-leather",
        "unsupported-badge"
      ],
      tags: ["Dorf", "Handwerk", "Leder", "Metall", "nicht-sichtbar"]
    });
    const texture = createTextureProfile(baseProfile, {
      id: "asset_texture",
      name: "Eichenplanken",
      updatedAt: "2026-09-03T09:00:00.000Z",
      badgeIconIds: ["material-wood", "material-metal"]
    });
    const artwork = createArtworkProfile(baseProfile, {
      id: "asset_artwork",
      name: "Dorf bei Nacht",
      updatedAt: "2026-09-02T09:00:00.000Z",
      badgeIconIds: ["material-fabric"]
    });
    const result = createDashboardData(
      validProfiles(
        createLibrary([baseProfile], [character, texture, artwork])
      ),
      emptyDraftResult,
      null
    );
    const characterSummary = result.recentProfiles.find(
      ({ id }) => id === character.id
    );
    const textureSummary = result.recentProfiles.find(
      ({ id }) => id === texture.id
    );
    const artworkSummary = result.recentProfiles.find(
      ({ id }) => id === artwork.id
    );

    expect(characterSummary).toMatchObject({
      categoryLabel: "Charakter / Figur",
      subtypeLabel: "NPC",
      baseProfileName: "Weltassets 32 px / Figuren 80 px",
      favorite: true,
      facts: [
        "Modern-HD",
        "32 px Tile",
        "3/4-RPG",
        "80 px Figur",
        "Transparent",
        "8 Richtungen",
        "Walk · 5 Frames",
        "Stil A + B"
      ],
      tags: ["Dorf", "Handwerk", "Leder", "Metall"],
      materials: ["wood", "leather"]
    });
    expect(textureSummary).toMatchObject({
      categoryLabel: "Textur / Material",
      subtypeLabel: "Holz",
      facts: ["Modern-HD", "32 px Tile", "3/4-RPG", "Stil A + B"],
      materials: ["wood", "metal"]
    });
    expect(artworkSummary).toMatchObject({
      categoryLabel: "Artwork / Konzeptbild",
      subtypeLabel: "Szene",
      facts: ["Modern-HD", "Vollständiger Hintergrund", "Stil A + B"],
      materials: ["cloth"]
    });
    expect(artworkSummary?.facts.join(" ")).not.toMatch(
      /Tile|Figur|Richtung|3\/4/
    );
  });

  it("reports empty profile and draft namespaces without manufacturing data", () => {
    const baseProfile = createBaseProfile();
    const result = createDashboardData(
      validProfiles(createLibrary([baseProfile], [])),
      { status: "empty" },
      null
    );

    expect(result).toMatchObject({
      collectionStatus: "empty",
      recentProfiles: [],
      favoriteProfiles: [],
      skippedProfileCount: 0,
      draftStatus: "empty",
      draft: null
    });
    expect(result.baseProfiles).toHaveLength(1);
  });

  it("shows configured movement and animation instead of capability potential", () => {
    const baseProfile = createBaseProfile();
    const stillTree = createNatureProfile(
      baseProfile,
      {
        id: "asset_tree_still",
        updatedAt: "2026-09-04T09:00:00.000Z"
      }
    );
    const windyTree = createNatureProfile(
      baseProfile,
      {
        id: "asset_tree_wind",
        updatedAt: "2026-09-03T09:00:00.000Z"
      },
      "wind"
    );
    const floatingObject = createMovingProfile(baseProfile, {
      id: "asset_floating",
      updatedAt: "2026-09-02T09:00:00.000Z"
    });
    const result = createDashboardData(
      validProfiles(
        createLibrary(
          [baseProfile],
          [stillTree, windyTree, floatingObject]
        )
      ),
      emptyDraftResult,
      null
    );
    const facts = Object.fromEntries(
      result.recentProfiles.map((profile) => [profile.id, profile.facts])
    );

    expect(facts.asset_tree_still).not.toContain("Animation: Wind");
    expect(facts.asset_tree_still).not.toContain("Animierbar");
    expect(facts.asset_tree_wind).toContain("Animation: Wind");
    expect(facts.asset_floating).toContain("Bewegung: Schweben");
    expect(facts.asset_floating).toContain("Animation: Pulsieren");
    expect(facts.asset_floating).not.toContain("Richtungsfähig");
  });

  it("keeps invalid storage results visible and produces no unsafe partial cards", () => {
    const invalidProfiles: StorageReadResult<ProfileLibrary> = {
      status: "invalid",
      key: "pixelforge:v2:profile-library",
      reason: "schemaValidation",
      message: "Invalid profile graph.",
      issues: [{ path: "assetProfiles.0", message: "Missing reference." }]
    };
    const invalidDraft: StorageReadResult<WizardDraft> = {
      status: "invalid",
      key: "pixelforge:v2:draft",
      reason: "invalidJson",
      message: "Invalid draft JSON.",
      issues: []
    };

    expect(createDashboardData(invalidProfiles, invalidDraft, null)).toEqual({
      collectionStatus: "invalid",
      recentProfiles: [],
      favoriteProfiles: [],
      baseProfiles: [],
      skippedProfileCount: 0,
      draftStatus: "invalid",
      draft: null
    });
  });

  it("degrades unavailable profile and draft storage independently", () => {
    const unavailableProfiles: StorageReadResult<ProfileLibrary> = {
      status: "unavailable",
      key: "pixelforge:v2:profile-library",
      message: "Storage is unavailable."
    };
    const unavailableDraft: StorageReadResult<WizardDraft> = {
      status: "unavailable",
      key: "pixelforge:v2:draft",
      message: "Storage is unavailable."
    };

    expect(
      createDashboardData(unavailableProfiles, unavailableDraft, null)
    ).toEqual({
      collectionStatus: "unavailable",
      recentProfiles: [],
      favoriteProfiles: [],
      baseProfiles: [],
      skippedProfileCount: 0,
      draftStatus: "unavailable",
      draft: null
    });
  });

  it("reads the validated dashboard snapshot through the narrow storage port", () => {
    const baseProfile = createBaseProfile();
    const library = createLibrary(
      [baseProfile],
      [
        createTextureProfile(baseProfile, {
          id: "asset_storage_texture",
          updatedAt: defaultTimestamp
        })
      ]
    );
    const draft = parseWizardDraft({
      schemaVersion: 2,
      kind: "wizardDraft",
      draftId: "draft_dashboard",
      projectName: "",
      route: "wizard/project",
      currentStep: "project",
      validation: { errors: [], warnings: [] },
      savedAt: defaultTimestamp
    });
    const readProfileLibrary = vi.fn(() => validProfiles(library));
    const readDraft = vi.fn(
      (): StorageReadResult<WizardDraft> => ({ status: "valid", value: draft })
    );
    const storage: DashboardStorage = { readProfileLibrary, readDraft };

    const result = readDashboardData(storage, baseProfile.id);

    expect(readProfileLibrary).toHaveBeenCalledOnce();
    expect(readDraft).toHaveBeenCalledOnce();
    expect(result.collectionStatus).toBe("ready");
    expect(result.draftStatus).toBe("ready");
    expect(result.draft).toBe(draft);
    expect(result.baseProfiles[0]?.active).toBe(true);
  });
});
