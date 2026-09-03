import { describe, expect, it } from "vitest";
import {
  WIZARD_CORE_STEPS,
  WizardAnimationStepSchema,
  WizardBaseProfileStepSchema,
  WizardCategoryStepSchema,
  WizardDirectionStepSchema,
  WizardProjectStepSchema,
  WizardTileabilityStepSchema,
  getWizardCoreFallbackStepId,
  getWizardCoreStep,
  getWizardCoreStepIndex
} from "./wizardSteps";

describe("wizard core steps", () => {
  const technicalValues = {
    baseProfileId: "base_world_80",
    pixelDensity: "modernHd" as const,
    styleProfile: "both" as const,
    tileSize: 32,
    characterHeight: 80,
    perspectiveType: "threeQuarter" as const,
    cameraAngle: 60 as const,
    cameraDirection: "southToNorth" as const,
    projectionType: "orthographic" as const,
    outlineStyle: "softSelective" as const,
    paletteMode: "byProfile" as const,
    backgroundMode: "transparent" as const,
    alphaPadding: 8,
    nearestNeighbor: true,
    lightingPolicy: "adaptive" as const,
    lightingNotes: "Keep world light stable."
  };

  it("declares category-first core steps and capability-owned field paths", () => {
    expect(WIZARD_CORE_STEPS.map((step) => step.id)).toEqual([
      "project",
      "category",
      "baseProfile",
      "directions",
      "animation",
      "tileability"
    ]);
    expect(getWizardCoreStep("project").fieldPaths).toEqual(["projectName"]);
    expect(getWizardCoreStep("category").fieldPaths).toEqual(["category", "subtype"]);
    expect(getWizardCoreStep("baseProfile").fieldPaths).toEqual(
      expect.arrayContaining(["baseProfileId", "tileSize", "lightingPolicy"])
    );
    expect(getWizardCoreStep("directions").fieldPaths).toEqual(["directionCount"]);
    expect(getWizardCoreStep("animation").fieldPaths).toEqual([
      "movementType",
      "animationAction",
      "animationType"
    ]);
    expect(getWizardCoreStep("tileability").fieldPaths).toEqual([
      "seamless",
      "tileableAxes"
    ]);
    expect(getWizardCoreStepIndex("project")).toBe(0);
    expect(getWizardCoreStepIndex("category")).toBe(1);
    expect(getWizardCoreStepIndex("baseProfile")).toBe(2);
  });

  it("validates the required project name at each navigation boundary", () => {
    expect(WizardProjectStepSchema.safeParse({ projectName: "" }).success).toBe(false);
    expect(WizardCategoryStepSchema.safeParse({ projectName: "   " }).success).toBe(false);
    expect(WizardProjectStepSchema.parse({ projectName: "  Winterwald  " })).toEqual({
      projectName: "Winterwald"
    });
  });

  it("requires a category-matching subtype before capability routing", () => {
    expect(
      WizardCategoryStepSchema.safeParse({
        projectName: "Winterwald",
        category: "character"
      }).success
    ).toBe(false);
    expect(
      WizardCategoryStepSchema.safeParse({
        projectName: "Winterwald",
        category: "character",
        subtype: "wood"
      }).success
    ).toBe(false);

    const npc = {
      projectName: "Winterwald",
      category: "character" as const,
      subtype: "npc" as const,
      ...technicalValues
    };
    expect(WizardCategoryStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardBaseProfileStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardDirectionStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardAnimationStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardTileabilityStepSchema.safeParse(npc).success).toBe(false);

    const wood = {
      projectName: "Holzboden",
      category: "texture" as const,
      subtype: "wood" as const,
      ...technicalValues,
      seamless: true
    };
    expect(WizardDirectionStepSchema.safeParse(wood).success).toBe(false);
    expect(WizardAnimationStepSchema.safeParse(wood).success).toBe(false);
    expect(WizardTileabilityStepSchema.safeParse(wood).success).toBe(true);

    expect(
      WizardAnimationStepSchema.safeParse({
        projectName: "Windbaum",
        category: "nature",
        subtype: "tree",
        ...technicalValues,
        animationType: "lava"
      }).success
    ).toBe(false);
    expect(
      WizardAnimationStepSchema.safeParse({
        projectName: "Windbaum",
        category: "nature",
        subtype: "tree",
        ...technicalValues,
        animationType: "wind"
      }).success
    ).toBe(true);

    expect(
      WizardBaseProfileStepSchema.safeParse({
        projectName: "Basis fehlt",
        category: "character",
        subtype: "npc"
      }).success
    ).toBe(false);
    expect(
      WizardBaseProfileStepSchema.safeParse({
        projectName: "Figurenhöhe fehlt",
        category: "character",
        subtype: "npc",
        ...technicalValues,
        characterHeight: undefined
      }).success
    ).toBe(false);
  });

  it("derives safe fallbacks from persisted routes", () => {
    expect(getWizardCoreFallbackStepId("wizard/project")).toBe("project");
    expect(getWizardCoreFallbackStepId("wizard/category")).toBe("category");
    expect(getWizardCoreFallbackStepId("wizard/profile")).toBe("baseProfile");
    expect(getWizardCoreFallbackStepId("wizard/editor")).toBe("baseProfile");
  });
});
