import { describe, expect, it } from "vitest";
import {
  WIZARD_CORE_STEPS,
  WizardCategoryStepSchema,
  WizardProjectStepSchema,
  getWizardCoreFallbackStepId,
  getWizardCoreStep,
  getWizardCoreStepIndex
} from "./wizardSteps";

describe("wizard core steps", () => {
  it("declares only the reusable project and asset-foundation steps", () => {
    expect(WIZARD_CORE_STEPS.map((step) => step.id)).toEqual(["project", "category"]);
    expect(getWizardCoreStep("project").fieldPaths).toEqual(["projectName"]);
    expect(getWizardCoreStep("category").fieldPaths).toEqual([]);
    expect(getWizardCoreStepIndex("project")).toBe(0);
    expect(getWizardCoreStepIndex("category")).toBe(1);

    const serialized = JSON.stringify(WIZARD_CORE_STEPS);
    expect(serialized).not.toMatch(/subtype|capabilit|direction|animation/i);
  });

  it("validates the required project name at each navigation boundary", () => {
    expect(WizardProjectStepSchema.safeParse({ projectName: "" }).success).toBe(false);
    expect(WizardCategoryStepSchema.safeParse({ projectName: "   " }).success).toBe(false);
    expect(WizardProjectStepSchema.parse({ projectName: "  Winterwald  " })).toEqual({
      projectName: "Winterwald"
    });
  });

  it("derives safe fallbacks from persisted routes", () => {
    expect(getWizardCoreFallbackStepId("wizard/project")).toBe("project");
    expect(getWizardCoreFallbackStepId("wizard/category")).toBe("category");
    expect(getWizardCoreFallbackStepId("wizard/profile")).toBe("category");
    expect(getWizardCoreFallbackStepId("wizard/editor")).toBe("category");
  });
});
