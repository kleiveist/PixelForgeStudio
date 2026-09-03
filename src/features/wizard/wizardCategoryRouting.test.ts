import { describe, expect, it } from "vitest";
import { createCompatibilityKey } from "../../domain/profiles";
import {
  ProfileLibrarySchema,
  StableIdSchema,
  parseAssetProfile,
  parseBaseProfile,
  parseCategoryProfile,
  parseWizardDraft,
  type ProfileLibrary,
  type WizardDraft
} from "../../schemas";
import { createProfileLibraryFixture } from "../../test/profileLibraryFixtures";
import { createWizardDraftFromAssetProfile } from "./wizardLifecycle";
import {
  WizardBaseProfileProjectionError,
  applyWizardBaseProfileToFormValues,
  createWizardCoreFormValues,
  getWizardAssetSelection,
  resolveWizardCapabilities,
  updateWizardDraftFromCoreForm,
  wizardStepIsApplicable
} from "./wizardCategoryRouting";

const TIMESTAMP = "2026-09-04T10:00:00.000Z";

function context(library: ProfileLibrary | null = createProfileLibraryFixture()) {
  return { library } as const;
}

function baseProfileValues(
  library: ProfileLibrary,
  baseProfileId = "base_world_80"
) {
  const base = library.baseProfiles.find(
    (profile) => profile.id === baseProfileId
  );
  if (!base) throw new Error("Expected a Base-profile fixture.");
  return {
    base,
    values: applyWizardBaseProfileToFormValues({ projectName: "" }, base)
  };
}

function blankDraft(): WizardDraft {
  return parseWizardDraft({
    schemaVersion: 2,
    kind: "wizardDraft",
    draftId: "draft_routing_test",
    projectName: "Routing-Test",
    route: "wizard/category",
    currentStep: "category",
    validation: { errors: [], warnings: [] },
    savedAt: TIMESTAMP
  });
}

function smithDraft(): Extract<WizardDraft, { category: unknown }> {
  const library = createProfileLibraryFixture();
  const source = library.assetProfiles.find(
    (profile) => profile.id === "asset_smith_80"
  );
  const base = library.baseProfiles.find(
    (profile) => profile.id === source?.baseProfileId
  );
  const category = library.categoryProfiles.find(
    (profile) => profile.id === source?.categoryProfileId
  );
  if (!source || !base || !category) {
    throw new Error("Expected a complete smith fixture.");
  }

  const result = createWizardDraftFromAssetProfile({
    draftId: StableIdSchema.parse("draft_routing_smith"),
    savedAt: TIMESTAMP,
    assetProfile: source,
    baseProfile: base,
    categoryProfile: category
  });
  if (result.status !== "created" || !("category" in result.draft)) {
    throw new Error("Expected a selected smith Draft.");
  }
  return result.draft;
}

describe("wizard category routing", () => {
  it("accepts only category-matching selections before resolving capabilities", () => {
    expect(
      getWizardAssetSelection({ category: "character", subtype: "npc" })
    ).toEqual({ category: "character", subtype: "npc" });
    expect(
      getWizardAssetSelection({ category: "texture", subtype: "npc" })
    ).toBeNull();
    expect(getWizardAssetSelection({ category: "texture" })).toBeNull();
    expect(resolveWizardCapabilities({ category: "texture", subtype: "npc" })).toBeNull();
  });

  it("routes NPC, wood, and wind-tree questions from capabilities only", () => {
    const library = createProfileLibraryFixture();
    const { values: technicalValues } = baseProfileValues(library);
    const npc = {
      ...technicalValues,
      projectName: "NPC",
      category: "character" as const,
      subtype: "npc" as const
    };
    expect(wizardStepIsApplicable("baseProfile", npc, library)).toBe(true);
    expect(wizardStepIsApplicable("directions", npc, library)).toBe(true);
    expect(wizardStepIsApplicable("animation", npc, library)).toBe(true);
    expect(wizardStepIsApplicable("tileability", npc, library)).toBe(false);

    const wood = {
      ...technicalValues,
      projectName: "Holz",
      category: "texture" as const,
      subtype: "wood" as const
    };
    expect(wizardStepIsApplicable("directions", wood, library)).toBe(false);
    expect(wizardStepIsApplicable("animation", wood, library)).toBe(false);
    expect(wizardStepIsApplicable("tileability", wood, library)).toBe(true);

    const tree = {
      ...technicalValues,
      projectName: "Windbaum",
      category: "nature" as const,
      subtype: "tree" as const
    };
    expect(wizardStepIsApplicable("directions", tree, library)).toBe(false);
    expect(wizardStepIsApplicable("animation", tree, library)).toBe(true);
    expect(wizardStepIsApplicable("tileability", tree, library)).toBe(false);

    expect(
      wizardStepIsApplicable("directions", {
        ...technicalValues,
        projectName: "Möbel",
        category: "staticObject",
        subtype: "furniture"
      }, library)
    ).toBe(false);
    expect(
      wizardStepIsApplicable("directions", {
        ...technicalValues,
        projectName: "Stadttor",
        category: "building",
        subtype: "gate"
      }, library)
    ).toBe(false);
    expect(
      wizardStepIsApplicable("animation", {
        ...technicalValues,
        projectName: "Stadttor",
        category: "building",
        subtype: "gate"
      }, library)
    ).toBe(true);

    expect(
      wizardStepIsApplicable("directions", {
        projectName: "Noch ohne Basis",
        category: "character",
        subtype: "npc"
      }, library)
    ).toBe(false);
  });

  it("projects a loaded profile without losing hidden category answers", () => {
    const library = createProfileLibraryFixture();
    const draft = smithDraft();
    const values = createWizardCoreFormValues(draft, null, library);

    expect(values).toMatchObject({
      projectName: draft.projectName,
      category: "character",
      subtype: "npc",
      directionCount: 8,
      animationAction: "walk"
    });

    const updated = updateWizardDraftFromCoreForm({
      draft,
      values,
      stepId: "directions",
      context: context(library)
    });
    expect(updated).toMatchObject({
      sourceAssetProfileId: draft.sourceAssetProfileId,
      categoryProfileId: draft.categoryProfileId,
      answers: draft.answers
    });
    expect(updated).not.toHaveProperty("overrides");
  });

  it("rebuilds answers and provenance when the main category changes", () => {
    const library = createProfileLibraryFixture();
    const parsedDraft = parseWizardDraft({
      ...smithDraft(),
      overrides: { tileSize: 48, characterHeight: 96 }
    });
    if (!("category" in parsedDraft)) {
      throw new Error("Expected a selected Draft after adding overrides.");
    }
    const draft = parsedDraft;
    const currentValues = createWizardCoreFormValues(parsedDraft, null, library);
    const changed = updateWizardDraftFromCoreForm({
      draft,
      values: {
        ...currentValues,
        projectName: "Eichenboden",
        category: "texture",
        subtype: "wood",
        seamless: true
      },
      stepId: "tileability",
      savedAt: "2026-09-04T10:05:00.000Z",
      context: context(library)
    });

    expect(changed).toMatchObject({
      route: "wizard/editor",
      currentStep: "tileability",
      category: "texture",
      subtype: "wood",
      answers: { seamless: true },
      baseProfileId: draft.baseProfileId,
      overrides: { tileSize: 48 },
      validation: { errors: [], warnings: [] }
    });
    expect(changed).not.toHaveProperty("sourceAssetProfileId");
    expect(changed).not.toHaveProperty("categoryProfileId");
    expect(changed).not.toHaveProperty("answers.directionCount");
    expect(changed).not.toHaveProperty("answers.framesPerDirection");
    expect(changed).not.toHaveProperty("answers.animationAction");
    expect(changed).not.toHaveProperty("overrides.characterHeight");
  });

  it("defers Draft projection while a selected classification is incomplete", () => {
    const draft = smithDraft();

    expect(
      updateWizardDraftFromCoreForm({
        draft,
        values: {
          projectName: "Eichenboden",
          category: "texture"
        },
        stepId: "category",
        context: context()
      })
    ).toBeNull();
  });

  it("stores wind animation without inventing a direction count", () => {
    const updated = updateWizardDraftFromCoreForm({
      draft: blankDraft(),
      values: {
        projectName: "Windbaum",
        category: "nature",
        subtype: "tree",
        animationType: "wind"
      },
      stepId: "baseProfile",
      context: context()
    });

    expect(updated).toMatchObject({
      route: "wizard/profile",
      category: "nature",
      subtype: "tree",
      answers: { animationType: "wind" }
    });
    expect(updated).not.toHaveProperty("answers.directionCount");
    expect(updated).not.toHaveProperty("baseProfileId");
  });

  it("hydrates all effective technical fields and normalizes unlocked overrides", () => {
    const library = createProfileLibraryFixture();
    const draft = smithDraft();
    const values = createWizardCoreFormValues(draft, null, library);

    expect(values).toMatchObject({
      baseProfileId: "base_world_80",
      pixelDensity: "modernHd",
      tileSize: 32,
      characterHeight: 80,
      cameraAngle: 60,
      nearestNeighbor: true,
      lightingPolicy: "adaptive",
      lightingNotes: "Keep world light stable."
    });

    const updated = updateWizardDraftFromCoreForm({
      draft,
      values: { ...values, tileSize: 48 },
      stepId: "baseProfile",
      context: context(library)
    });
    expect(updated).toMatchObject({
      route: "wizard/profile",
      baseProfileId: "base_world_80",
      overrides: { tileSize: 48 }
    });
    expect(updated).not.toHaveProperty("overrides.pixelDensity");
  });

  it("keeps an explicit Asset override that returns a Category value to its Base value", () => {
    const sourceLibrary = createProfileLibraryFixture();
    const categoryProfile = sourceLibrary.categoryProfiles.find(
      (profile) => profile.id === "category_npc_80"
    );
    const baseProfile = sourceLibrary.baseProfiles.find(
      (profile) => profile.id === "base_world_80"
    );
    const assetProfile = sourceLibrary.assetProfiles.find(
      (profile) => profile.id === "asset_smith_80"
    );
    if (!categoryProfile || !baseProfile || !assetProfile) {
      throw new Error("Expected the complete NPC profile chain.");
    }
    const inheritedCategoryProfile = parseCategoryProfile({
      ...categoryProfile,
      overrides: { ...categoryProfile.overrides, tileSize: 48 }
    });
    const library = ProfileLibrarySchema.parse({
      baseProfiles: [baseProfile],
      categoryProfiles: [inheritedCategoryProfile],
      assetProfiles: [
        parseAssetProfile({
          ...assetProfile,
          compatibilityKey: createCompatibilityKey(
            { ...baseProfile.values, tileSize: 48 },
            { category: "character", subtype: "npc" }
          )
        })
      ]
    });
    const draft = smithDraft();
    const inheritedValues = createWizardCoreFormValues(draft, null, library);
    expect(inheritedValues.tileSize).toBe(48);

    const updated = updateWizardDraftFromCoreForm({
      draft,
      values: { ...inheritedValues, tileSize: 32 },
      stepId: "baseProfile",
      context: context(library)
    });

    expect(updated).toMatchObject({ overrides: { tileSize: 32 } });
  });

  it("drops hidden world-geometry overrides for free compositions", () => {
    const library = createProfileLibraryFixture();
    const draft = parseWizardDraft({
      schemaVersion: 2,
      kind: "wizardDraft",
      draftId: "draft_free_composition",
      projectName: "Freies Key Art",
      route: "wizard/profile",
      currentStep: "baseProfile",
      baseProfileId: "base_world_80",
      category: "artwork",
      subtype: "promoArtwork",
      overrides: {
        tileSize: 64,
        perspectiveType: "isometric",
        cameraAngle: 45,
        cameraDirection: "swToNe",
        projectionType: "mildPerspective"
      },
      answers: {},
      validation: { errors: [], warnings: [] },
      savedAt: TIMESTAMP
    });
    const values = createWizardCoreFormValues(draft, null, library);

    const updated = updateWizardDraftFromCoreForm({
      draft,
      values,
      stepId: "baseProfile",
      context: context(library)
    });

    expect(updated).not.toHaveProperty("overrides.tileSize");
    expect(updated).not.toHaveProperty("overrides.perspectiveType");
    expect(updated).not.toHaveProperty("overrides.cameraAngle");
    expect(updated).not.toHaveProperty("overrides.cameraDirection");
    expect(updated).not.toHaveProperty("overrides.projectionType");
  });

  it("allows an unlocked character height to complete a Base family that does not define one", () => {
    const sourceLibrary = createProfileLibraryFixture();
    const sourceBase = sourceLibrary.baseProfiles.find(
      (profile) => profile.id === "base_unused"
    );
    if (!sourceBase) throw new Error("Expected the unused Base profile.");
    const {
      characterHeight: omittedCharacterHeight,
      ...valuesWithoutCharacterHeight
    } = sourceBase.values;
    void omittedCharacterHeight;
    const base = parseBaseProfile({
      ...sourceBase,
      values: valuesWithoutCharacterHeight
    });
    const library = ProfileLibrarySchema.parse({
      ...sourceLibrary,
      baseProfiles: sourceLibrary.baseProfiles.map((profile) =>
        profile.id === base.id ? base : profile
      )
    });
    const draft = parseWizardDraft({
      ...blankDraft(),
      route: "wizard/profile",
      currentStep: "baseProfile",
      category: "character",
      subtype: "npc",
      answers: {}
    });
    const values = {
      ...applyWizardBaseProfileToFormValues(
        createWizardCoreFormValues(draft, null, library),
        base
      ),
      characterHeight: 80
    };

    expect(wizardStepIsApplicable("directions", values, library)).toBe(true);
    const updated = updateWizardDraftFromCoreForm({
      draft,
      values,
      stepId: "baseProfile",
      context: context(library)
    });

    expect(updated).toMatchObject({
      baseProfileId: base.id,
      overrides: { characterHeight: 80 }
    });
  });

  it("fails closed for locked, missing, and unavailable Base profiles", () => {
    const sourceLibrary = createProfileLibraryFixture();
    const draft = smithDraft();
    const sourceBase = sourceLibrary.baseProfiles.find(
      (profile) => profile.id === draft.baseProfileId
    );
    if (!sourceBase) throw new Error("Expected the smith Base profile.");
    const lockedBase = parseBaseProfile({
      ...sourceBase,
      locks: { ...sourceBase.locks, tileSize: true }
    });
    const library = ProfileLibrarySchema.parse({
      ...sourceLibrary,
      baseProfiles: sourceLibrary.baseProfiles.map((profile) =>
        profile.id === lockedBase.id ? lockedBase : profile
      )
    });
    const values = createWizardCoreFormValues(draft, null, library);

    expect(() =>
      updateWizardDraftFromCoreForm({
        draft,
        values: { ...values, tileSize: 48 },
        stepId: "baseProfile",
        context: context(library)
      })
    ).toThrow(WizardBaseProfileProjectionError);
    expect(() =>
      updateWizardDraftFromCoreForm({
        draft,
        values: { ...values, baseProfileId: "base_missing" },
        stepId: "baseProfile",
        context: context(library)
      })
    ).toThrow(/missingBaseProfile/);
    expect(() =>
      updateWizardDraftFromCoreForm({
        draft,
        values,
        stepId: "baseProfile",
        context: context(null)
      })
    ).toThrow(/profileLibraryUnavailable/);
  });

  it("adopts a switched Base while clearing parent links and overrides only", () => {
    const library = createProfileLibraryFixture();
    const draft = parseWizardDraft({
      ...smithDraft(),
      overrides: { tileSize: 48 }
    });
    if (!("category" in draft)) throw new Error("Expected a selected Draft.");
    const nextBase = baseProfileValues(library, "base_world_96").base;
    const values = applyWizardBaseProfileToFormValues(
      createWizardCoreFormValues(draft, null, library),
      nextBase
    );

    const changed = updateWizardDraftFromCoreForm({
      draft,
      values,
      stepId: "baseProfile",
      context: context(library)
    });

    expect(changed).toMatchObject({
      route: "wizard/profile",
      baseProfileId: "base_world_96",
      answers: draft.answers
    });
    expect(changed).not.toHaveProperty("categoryProfileId");
    expect(changed).not.toHaveProperty("sourceAssetProfileId");
    expect(changed).not.toHaveProperty("overrides");
  });
});
