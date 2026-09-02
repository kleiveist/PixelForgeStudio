import type { AssetCategory } from "../../domain/assets";
import type { ProfileLibrary } from "../../schemas";
import {
  type GuidedWizardFlowDefinition,
  type GuidedWizardStepComponentProps,
  type GuidedWizardSummaryComponentProps
} from "./GuidedWizardEngine";
import { WizardTechnicalSummary } from "./WizardTechnicalSummary";
import { updateWizardDraft } from "./wizardLifecycle";
import {
  WIZARD_CORE_STEPS,
  type WizardCoreFormValues,
  type WizardCoreStepId
} from "./wizardSteps";
import styles from "./WizardView.module.css";

export interface WizardCoreFlowContext {
  readonly categoryHint: AssetCategory | null;
  readonly library: ProfileLibrary | null;
}

type CoreStepProps = GuidedWizardStepComponentProps<
  WizardCoreFormValues,
  WizardCoreFlowContext
>;

function ProjectStep({ form }: CoreStepProps) {
  const errorMessage = form.formState.errors.projectName?.message;
  const error = typeof errorMessage === "string" ? errorMessage : undefined;
  const describedBy = error
    ? "wizard-project-name-help wizard-project-name-error"
    : "wizard-project-name-help";

  return (
    <div className={styles.fieldGroup}>
      <label htmlFor="wizard-project-name">
        Projektname <span className={styles.required}>Pflichtfeld</span>
      </label>
      <input
        id="wizard-project-name"
        type="text"
        autoComplete="off"
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : "false"}
        maxLength={120}
        {...form.register("projectName")}
      />
      <p id="wizard-project-name-help" className={styles.fieldHelp}>
        Der Name ordnet Autosave und spätere Prompt-Pakete eindeutig zu.
      </p>
      {error ? (
        <p id="wizard-project-name-error" className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CategoryStep({ context, draft }: CoreStepProps) {
  const category =
    "category" in draft ? draft.category : context.categoryHint;

  return (
    <div className={styles.foundationCard} role="note">
      <span className={styles.foundationMarker} aria-hidden="true">
        ◫
      </span>
      <div>
        <strong>
          {category
            ? "Asset-Kategorie als Startkontext übernommen"
            : "Asset-Kategorie ist als nächster Schritt vorbereitet"}
        </strong>
        <p>
          {"category" in draft
            ? "Kategorie, Untertyp und Profilwerte bleiben vollständig im Entwurf erhalten. Der passende Spezialeditor wird in der nächsten getrennten Phase angebunden."
            : category
              ? "Die Dashboard-Auswahl bleibt für diese Sitzung sichtbar. Ihre verbindliche Untertyp- und Capability-Logik folgt in der nächsten Wizard-Phase."
              : "Die Engine steht; die neun dynamischen Kategoriepfade und ihre Spezialfragen folgen bewusst getrennt in Prompt 12."}
        </p>
      </div>
    </div>
  );
}

function CoreSummary({
  context,
  draft,
  values
}: GuidedWizardSummaryComponentProps<
  WizardCoreFormValues,
  WizardCoreFlowContext
>) {
  return (
    <WizardTechnicalSummary
      categoryHint={context.categoryHint}
      draft={draft}
      library={context.library}
      projectName={values.projectName}
    />
  );
}

/**
 * Product-specific Prompt-11 flow. The generic engine owns navigation and
 * persistence; Prompt 12 extends this external registry with category steps.
 */
export const WIZARD_CORE_FLOW = Object.freeze({
  steps: Object.freeze([
    Object.freeze({ ...WIZARD_CORE_STEPS[0], Component: ProjectStep }),
    Object.freeze({ ...WIZARD_CORE_STEPS[1], Component: CategoryStep })
  ]),
  updateDraft: ({ draft, values, stepId, savedAt }) =>
    updateWizardDraft({
      draft,
      projectName: values.projectName,
      currentStep: stepId,
      ...(savedAt === undefined ? {} : { savedAt })
    }),
  Summary: CoreSummary
} satisfies GuidedWizardFlowDefinition<
  WizardCoreFormValues,
  WizardCoreStepId,
  WizardCoreFlowContext
>);
