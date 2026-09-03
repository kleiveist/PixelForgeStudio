import { describe, expect, it } from "vitest";
import {
  StableIdSchema,
  parseWizardDraft,
  type WizardDraft
} from "../../schemas";
import { createProfileLibraryFixture } from "../../test/profileLibraryFixtures";
import { createWizardDraftFromAssetProfile } from "./wizardLifecycle";
import {
  createWizardCoreFormValues,
  getWizardAssetSelection,
  resolveWizardCapabilities,
  updateWizardDraftFromCoreForm,
  wizardStepIsApplicable
} from "./wizardCategoryRouting";

const TIMESTAMP = "2026-09-04T10:00:00.000Z";

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
    const npc = {
      projectName: "NPC",
      category: "character" as const,
      subtype: "npc" as const
    };
    expect(wizardStepIsApplicable("directions", npc)).toBe(true);
    expect(wizardStepIsApplicable("animation", npc)).toBe(true);
    expect(wizardStepIsApplicable("tileability", npc)).toBe(false);

    const wood = {
      projectName: "Holz",
      category: "texture" as const,
      subtype: "wood" as const
    };
    expect(wizardStepIsApplicable("directions", wood)).toBe(false);
    expect(wizardStepIsApplicable("animation", wood)).toBe(false);
    expect(wizardStepIsApplicable("tileability", wood)).toBe(true);

    const tree = {
      projectName: "Windbaum",
      category: "nature" as const,
      subtype: "tree" as const
    };
    expect(wizardStepIsApplicable("directions", tree)).toBe(false);
    expect(wizardStepIsApplicable("animation", tree)).toBe(true);
    expect(wizardStepIsApplicable("tileability", tree)).toBe(false);

    expect(
      wizardStepIsApplicable("directions", {
        projectName: "Möbel",
        category: "staticObject",
        subtype: "furniture"
      })
    ).toBe(false);
    expect(
      wizardStepIsApplicable("directions", {
        projectName: "Stadttor",
        category: "building",
        subtype: "gate"
      })
    ).toBe(false);
    expect(
      wizardStepIsApplicable("animation", {
        projectName: "Stadttor",
        category: "building",
        subtype: "gate"
      })
    ).toBe(true);
  });

  it("projects a loaded profile without losing hidden category answers", () => {
    const draft = smithDraft();
    const values = createWizardCoreFormValues(draft);

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
      stepId: "directions"
    });
    expect(updated).toMatchObject({
      sourceAssetProfileId: draft.sourceAssetProfileId,
      categoryProfileId: draft.categoryProfileId,
      answers: draft.answers,
      overrides: draft.overrides
    });
  });

  it("rebuilds answers and provenance when the main category changes", () => {
    const parsedDraft = parseWizardDraft({
      ...smithDraft(),
      overrides: { tileSize: 48, characterHeight: 96 }
    });
    if (!("category" in parsedDraft)) {
      throw new Error("Expected a selected Draft after adding overrides.");
    }
    const draft = parsedDraft;
    const changed = updateWizardDraftFromCoreForm({
      draft,
      values: {
        projectName: "Eichenboden",
        category: "texture",
        subtype: "wood",
        seamless: true
      },
      stepId: "tileability",
      savedAt: "2026-09-04T10:05:00.000Z"
    });

    expect(changed).toMatchObject({
      route: "wizard/profile",
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
        stepId: "category"
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
      stepId: "animation"
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
});
