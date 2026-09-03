import { describe, expect, it } from "vitest";
import {
  WIZARD_CORE_STEPS,
  WizardAnimationStepSchema,
  WizardCategoryStepSchema,
  WizardDirectionStepSchema,
  WizardProjectStepSchema,
  WizardTileabilityStepSchema,
  getWizardCoreFallbackStepId,
  getWizardCoreStep,
  getWizardCoreStepIndex
} from "./wizardSteps";

describe("wizard core steps", () => {
  it("declares category-first core steps and capability-owned field paths", () => {
    expect(WIZARD_CORE_STEPS.map((step) => step.id)).toEqual([
      "project",
      "category",
      "directions",
      "animation",
      "tileability"
    ]);
    expect(getWizardCoreStep("project").fieldPaths).toEqual(["projectName"]);
    expect(getWizardCoreStep("category").fieldPaths).toEqual(["category", "subtype"]);
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
      subtype: "npc" as const
    };
    expect(WizardCategoryStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardDirectionStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardAnimationStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardTileabilityStepSchema.safeParse(npc).success).toBe(false);

    const wood = {
      projectName: "Holzboden",
      category: "texture" as const,
      subtype: "wood" as const,
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
        animationType: "lava"
      }).success
    ).toBe(false);
    expect(
      WizardAnimationStepSchema.safeParse({
        projectName: "Windbaum",
        category: "nature",
        subtype: "tree",
        animationType: "wind"
      }).success
    ).toBe(true);
  });

  it("derives safe fallbacks from persisted routes", () => {
    expect(getWizardCoreFallbackStepId("wizard/project")).toBe("project");
    expect(getWizardCoreFallbackStepId("wizard/category")).toBe("category");
    expect(getWizardCoreFallbackStepId("wizard/profile")).toBe("category");
    expect(getWizardCoreFallbackStepId("wizard/editor")).toBe("category");
  });
});
