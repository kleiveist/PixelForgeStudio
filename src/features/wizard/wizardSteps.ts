import { z } from "zod";

const ProjectNameSchema = z.string().trim().min(1, "Bitte gib einen Projektnamen ein.").max(120);

export const WizardCoreFormSchema = z.strictObject({
  projectName: ProjectNameSchema
});

export const WizardProjectStepSchema = WizardCoreFormSchema;
export const WizardCategoryStepSchema = WizardCoreFormSchema;

export type WizardCoreFormValues = z.infer<typeof WizardCoreFormSchema>;
export type WizardCoreFieldPath = keyof WizardCoreFormValues;
export type WizardCoreStepId = "project" | "category";

export interface WizardCoreStep {
  readonly id: WizardCoreStepId;
  readonly route: "wizard/project" | "wizard/category";
  readonly title: string;
  readonly description: string;
  readonly fieldPaths: readonly WizardCoreFieldPath[];
  readonly schema: typeof WizardCoreFormSchema;
}

export const WIZARD_CORE_STEPS = Object.freeze([
  Object.freeze({
    id: "project",
    route: "wizard/project",
    title: "Projekt",
    description: "Benenne den Entwurf, damit du ihn später eindeutig wiederfindest.",
    fieldPaths: Object.freeze(["projectName"] as const),
    schema: WizardProjectStepSchema
  }),
  Object.freeze({
    id: "category",
    route: "wizard/category",
    title: "Asset-Grundlage",
    description:
      "Prüfe die technische Grundlage. Kategoriefragen folgen im nächsten Ausbauschritt.",
    fieldPaths: Object.freeze([] as const),
    schema: WizardCategoryStepSchema
  })
] as const satisfies readonly WizardCoreStep[]);

export function isWizardCoreStepId(value: string): value is WizardCoreStepId {
  return value === "project" || value === "category";
}

export function getWizardCoreStep(stepId: WizardCoreStepId): WizardCoreStep {
  const step = WIZARD_CORE_STEPS.find((candidate) => candidate.id === stepId);
  if (step === undefined) {
    throw new Error(`Unknown wizard core step "${stepId}".`);
  }
  return step;
}

export function getWizardCoreStepIndex(stepId: WizardCoreStepId): number {
  return WIZARD_CORE_STEPS.findIndex((step) => step.id === stepId);
}

export function getWizardCoreFallbackStepId(
  route: string
): WizardCoreStepId {
  return route === "wizard/project" ? "project" : "category";
}
