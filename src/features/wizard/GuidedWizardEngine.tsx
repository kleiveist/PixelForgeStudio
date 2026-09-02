import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType
} from "react";
import {
  useForm,
  useWatch,
  type DefaultValues,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type Resolver,
  type UseFormReturn
} from "react-hook-form";
import type { z } from "zod";
import { jsonValuesEqual } from "../../domain/json";
import type { WizardDraft } from "../../schemas";
import type { StorageMutationResult, V2StorageAdapter } from "../../services";
import styles from "./WizardView.module.css";

const AUTOSAVE_DELAY_MS = 300;

export type GuidedWizardDraftStorage = Pick<V2StorageAdapter, "writeDraft">;

type SaveStatus =
  | Readonly<{ kind: "idle" | "dirty" | "saving" | "saved" }>
  | Readonly<{ kind: "failed"; message: string }>;

const SAVE_STATUS_MESSAGES: Readonly<
  Record<Exclude<SaveStatus["kind"], "failed">, string>
> = {
  idle: "Dieser Start wurde noch nicht lokal gesichert.",
  dirty: "Ungesicherte Änderungen.",
  saving: "Entwurf wird lokal gesichert …",
  saved: "Entwurf wurde lokal gesichert."
};

export interface GuidedWizardStepComponentProps<
  Values extends FieldValues,
  Context
> {
  readonly context: Context;
  readonly draft: WizardDraft;
  readonly form: UseFormReturn<Values>;
}

export interface GuidedWizardSummaryComponentProps<
  Values extends FieldValues,
  Context
> {
  readonly context: Context;
  readonly draft: WizardDraft;
  readonly values: Values;
}

export interface GuidedWizardStepDefinition<
  Values extends FieldValues,
  StepId extends string,
  Context
> {
  readonly id: StepId;
  readonly title: string;
  readonly description: string;
  readonly fieldPaths: readonly FieldPath<Values>[];
  readonly schema: z.ZodType<Values, Values>;
  readonly Component: ComponentType<
    GuidedWizardStepComponentProps<Values, Context>
  >;
}

export interface GuidedWizardDraftUpdate<
  Values extends FieldValues,
  StepId extends string
> {
  readonly draft: WizardDraft;
  readonly values: Values;
  readonly stepId: StepId;
  readonly savedAt?: string;
}

export interface GuidedWizardFlowDefinition<
  Values extends FieldValues,
  StepId extends string,
  Context
> {
  readonly steps: readonly [
    GuidedWizardStepDefinition<Values, StepId, Context>,
    ...GuidedWizardStepDefinition<Values, StepId, Context>[]
  ];
  readonly updateDraft: (
    input: GuidedWizardDraftUpdate<Values, StepId>
  ) => WizardDraft;
  readonly Summary: ComponentType<
    GuidedWizardSummaryComponentProps<Values, Context>
  >;
}

export interface GuidedWizardEngineProps<
  Values extends FieldValues,
  StepId extends string,
  Context
> {
  readonly baselineDraft: WizardDraft;
  readonly baselineValues: Values;
  readonly context: Context;
  readonly draft: WizardDraft;
  readonly draftPersisted: boolean;
  readonly flow: GuidedWizardFlowDefinition<Values, StepId, Context>;
  readonly initialDirty?: boolean;
  readonly initialStepId: StepId;
  readonly initialValues: Values;
  readonly now: () => string;
  readonly onDraftEdited: (draft: WizardDraft) => void;
  readonly onDraftSaved: (draft: WizardDraft) => void;
  readonly onValuesChanged?: (values: Values) => void;
  readonly storageAdapter: GuidedWizardDraftStorage;
}

function saveFailureMessage(result: StorageMutationResult): string {
  return result.status === "invalid"
    ? "Der Entwurf ist nicht gültig und wurde nicht überschrieben."
    : "Der lokale Speicher ist nicht verfügbar. Deine Eingaben bleiben in dieser Sitzung erhalten.";
}

function candidateFailureMessage(): string {
  return "Der Entwurf konnte nicht mit gültigen Daten gesichert werden. Deine Eingaben bleiben in dieser Sitzung erhalten.";
}

function SaveStatusMessage({ status }: Readonly<{ status: SaveStatus }>) {
  const message =
    status.kind === "failed"
      ? status.message
      : SAVE_STATUS_MESSAGES[status.kind];

  return (
    <p
      className={styles.saveStatus}
      data-status={status.kind}
      role={status.kind === "failed" ? "alert" : "status"}
    >
      <span aria-hidden="true">
        {status.kind === "saved"
          ? "✓"
          : status.kind === "failed"
            ? "!"
            : status.kind === "saving"
              ? "↻"
              : "•"}
      </span>
      {message}
    </p>
  );
}

function stepIndex<
  Values extends FieldValues,
  StepId extends string,
  Context
>(
  flow: GuidedWizardFlowDefinition<Values, StepId, Context>,
  stepId: StepId
): number {
  const index = flow.steps.findIndex((step) => step.id === stepId);
  if (index < 0) {
    throw new Error(`Unknown guided wizard step "${stepId}".`);
  }
  return index;
}

function stepAt<
  Values extends FieldValues,
  StepId extends string,
  Context
>(
  flow: GuidedWizardFlowDefinition<Values, StepId, Context>,
  index: number
): GuidedWizardStepDefinition<Values, StepId, Context> | undefined {
  return flow.steps[index];
}

function valueAtPath(value: unknown, path: string): unknown {
  const segments = path.replaceAll("[", ".").replaceAll("]", "").split(".");
  let cursor = value;

  for (const segment of segments) {
    if (
      cursor === null ||
      typeof cursor !== "object" ||
      !(segment in cursor)
    ) {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return cursor;
}

function firstInvalidField<
  Values extends FieldValues,
  StepId extends string,
  Context
>(
  flow: GuidedWizardFlowDefinition<Values, StepId, Context>,
  errors: FieldErrors<Values>
): Readonly<{ fieldPath: FieldPath<Values>; stepId: StepId }> | null {
  for (const step of flow.steps) {
    for (const fieldPath of step.fieldPaths) {
      if (valueAtPath(errors, fieldPath) !== undefined) {
        return { fieldPath, stepId: step.id };
      }
    }
  }
  return null;
}

export function GuidedWizardEngine<
  Values extends FieldValues,
  StepId extends string,
  Context
>({
  baselineDraft,
  baselineValues,
  context,
  draft: initialDraft,
  draftPersisted: initialDraftPersisted,
  flow,
  initialDirty,
  initialStepId,
  initialValues,
  now,
  onDraftEdited,
  onDraftSaved,
  onValuesChanged,
  storageAdapter
}: GuidedWizardEngineProps<Values, StepId, Context>) {
  const initialStepIndex = stepIndex(flow, initialStepId);
  const initialStep = stepAt(flow, initialStepIndex);
  if (!initialStep) {
    throw new Error("A guided wizard requires at least one configured step.");
  }

  const [currentStepId, setCurrentStepId] = useState(initialStep.id);
  const [draft, setDraft] = useState(initialDraft);
  const draftInitiallyDirty = !jsonValuesEqual(initialDraft, baselineDraft);
  const valuesInitiallyDirty = !jsonValuesEqual(initialValues, baselineValues);
  const initiallyDirty =
    initialDirty ?? (draftInitiallyDirty || valuesInitiallyDirty);
  const [isDirty, setIsDirty] = useState(initiallyDirty);
  const [isPersisted, setIsPersisted] = useState(initialDraftPersisted);
  const [activeStepConfirmed, setActiveStepConfirmed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() =>
    initiallyDirty
      ? { kind: "dirty" }
      : initialDraftPersisted
        ? { kind: "saved" }
        : { kind: "idle" }
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const draftRef = useRef(initialDraft);
  const baselineRef = useRef(baselineDraft);
  const baselineValuesRef = useRef(baselineValues);
  const currentStepRef = useRef(currentStepId);
  const isPersistedRef = useRef(initialDraftPersisted);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(currentStepId);
  const focusFieldAfterStepChangeRef = useRef<FieldPath<Values> | null>(null);
  const activeStepIndex = stepIndex(flow, currentStepId);
  const activeStep = stepAt(flow, activeStepIndex);
  if (!activeStep) {
    throw new Error(`Missing active guided wizard step "${currentStepId}".`);
  }
  const activeStepRef = useRef(activeStep);
  currentStepRef.current = currentStepId;
  activeStepRef.current = activeStep;

  const resolver = useCallback<Resolver<Values>>(
    (values, resolverContext, options) =>
      zodResolver(activeStepRef.current.schema)(
        values,
        resolverContext,
        options
      ),
    []
  );
  const form = useForm<Values>({
    defaultValues: initialValues as DefaultValues<Values>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver
  });
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    setFocus,
    watch
  } = form;
  const watchedValues = useWatch({ control }) as Values;

  const cancelAutosave = useCallback(() => {
    if (autosaveTimerRef.current === null) return;
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
  }, []);

  const applyEditedDraft = useCallback(
    (candidate: WizardDraft) => {
      draftRef.current = candidate;
      setDraft(candidate);
      onDraftEdited(candidate);
      const dirty = !jsonValuesEqual(candidate, baselineRef.current);
      setIsDirty(dirty);
      setSaveStatus(
        dirty
          ? { kind: "dirty" }
          : isPersistedRef.current
            ? { kind: "saved" }
            : { kind: "idle" }
      );
      return dirty;
    },
    [onDraftEdited]
  );

  const persistValues = useCallback(
    (values: Values, stepId: StepId) => {
      cancelAutosave();
      setSaveStatus({ kind: "saving" });

      let candidate: WizardDraft;
      try {
        candidate = flow.updateDraft({
          draft: draftRef.current,
          values,
          stepId,
          savedAt: now()
        });
      } catch {
        setIsDirty(true);
        setSaveStatus({ kind: "failed", message: candidateFailureMessage() });
        return false;
      }

      const result = storageAdapter.writeDraft(candidate);
      if (result.status !== "ok") {
        setIsDirty(!jsonValuesEqual(draftRef.current, baselineRef.current));
        setSaveStatus({ kind: "failed", message: saveFailureMessage(result) });
        return false;
      }

      draftRef.current = candidate;
      setDraft(candidate);
      baselineRef.current = candidate;
      baselineValuesRef.current = values;
      isPersistedRef.current = true;
      setIsPersisted(true);
      setIsDirty(false);
      setSaveStatus({ kind: "saved" });
      onDraftSaved(candidate);
      reset(values);
      return true;
    },
    [cancelAutosave, flow, now, onDraftSaved, reset, storageAdapter]
  );

  useEffect(() => {
    const subscription = watch((_formValues, event) => {
      if (event.type !== "change" || event.name === undefined) return;
      cancelAutosave();
      setSubmitError(null);
      setActiveStepConfirmed(false);

      const values = getValues();
      onValuesChanged?.(values);

      const stepResult = activeStepRef.current.schema.safeParse(values);
      if (!stepResult.success) {
        const dirty =
          !jsonValuesEqual(draftRef.current, baselineRef.current) ||
          !jsonValuesEqual(values, baselineValuesRef.current);
        setIsDirty(dirty);
        setSaveStatus(
          dirty
            ? { kind: "dirty" }
            : isPersistedRef.current
              ? { kind: "saved" }
              : { kind: "idle" }
        );
        return;
      }

      let candidate: WizardDraft | null = null;
      try {
        candidate = flow.updateDraft({
          draft: draftRef.current,
          values: stepResult.data,
          stepId: currentStepRef.current
        });
      } catch {
        const dirty =
          !jsonValuesEqual(draftRef.current, baselineRef.current) ||
          !jsonValuesEqual(values, baselineValuesRef.current);
        setIsDirty(dirty);
        setSaveStatus(
          dirty
            ? { kind: "dirty" }
            : isPersistedRef.current
              ? { kind: "saved" }
              : { kind: "idle" }
        );
      }

      const dirty = candidate ? applyEditedDraft(candidate) : true;
      if (!dirty) return;

      autosaveTimerRef.current = setTimeout(() => {
        autosaveTimerRef.current = null;
        persistValues(stepResult.data, currentStepRef.current);
      }, AUTOSAVE_DELAY_MS);
    });

    return () => {
      subscription.unsubscribe();
      cancelAutosave();
    };
  }, [
    applyEditedDraft,
    cancelAutosave,
    flow,
    getValues,
    onValuesChanged,
    persistValues,
    watch
  ]);

  useEffect(() => {
    if (previousStepRef.current === currentStepId) return;
    previousStepRef.current = currentStepId;
    stepHeadingRef.current?.focus();
    const fieldToFocus = focusFieldAfterStepChangeRef.current;
    if (fieldToFocus) {
      focusFieldAfterStepChangeRef.current = null;
      setFocus(fieldToFocus);
    }
  }, [currentStepId, setFocus]);

  const transitionTo = useCallback(
    (values: Values, targetStep: StepId) => {
      cancelAutosave();
      let candidate: WizardDraft;
      try {
        candidate = flow.updateDraft({
          draft: draftRef.current,
          values,
          stepId: targetStep
        });
      } catch {
        setIsDirty(true);
        setSaveStatus({ kind: "failed", message: candidateFailureMessage() });
        return;
      }
      applyEditedDraft(candidate);
      currentStepRef.current = targetStep;
      setCurrentStepId(targetStep);
      setActiveStepConfirmed(false);
      setSubmitError(null);
      persistValues(values, targetStep);
    },
    [applyEditedDraft, cancelAutosave, flow, persistValues]
  );

  const submitValid = useCallback(
    (values: Values) => {
      const currentIndex = stepIndex(flow, currentStepRef.current);
      const nextStep = stepAt(flow, currentIndex + 1);
      if (nextStep) {
        transitionTo(values, nextStep.id);
        return;
      }
      const alreadyPersistedAndClean =
        isPersistedRef.current &&
        jsonValuesEqual(draftRef.current, baselineRef.current) &&
        jsonValuesEqual(values, baselineValuesRef.current);
      if (alreadyPersistedAndClean) {
        setActiveStepConfirmed(true);
        setSubmitError(null);
        return;
      }
      if (persistValues(values, currentStepRef.current)) {
        setActiveStepConfirmed(true);
      }
      setSubmitError(null);
    },
    [flow, persistValues, transitionTo]
  );

  const submitInvalid = useCallback(
    (fieldErrors: FieldErrors<Values>) => {
      cancelAutosave();
      setActiveStepConfirmed(false);
      setSubmitError("Bitte korrigiere das markierte Pflichtfeld.");
      const invalidField = firstInvalidField(flow, fieldErrors);
      if (!invalidField) return;
      if (currentStepRef.current !== invalidField.stepId) {
        focusFieldAfterStepChangeRef.current = invalidField.fieldPath;
        currentStepRef.current = invalidField.stepId;
        setCurrentStepId(invalidField.stepId);
        return;
      }
      setFocus(invalidField.fieldPath);
    },
    [cancelAutosave, flow, setFocus]
  );

  const goBack = useCallback(() => {
    const currentIndex = stepIndex(flow, currentStepRef.current);
    const previousStep = stepAt(flow, currentIndex - 1);
    if (!previousStep) return;

    const values = getValues();
    cancelAutosave();

    try {
      const candidate = flow.updateDraft({
        draft: draftRef.current,
        values,
        stepId: previousStep.id
      });
      applyEditedDraft(candidate);
      currentStepRef.current = previousStep.id;
      setCurrentStepId(previousStep.id);
      setActiveStepConfirmed(false);
      setSubmitError(null);

      const result = previousStep.schema.safeParse(values);
      if (result.success) persistValues(result.data, previousStep.id);
    } catch {
      setIsDirty(true);
      setSaveStatus({ kind: "dirty" });
      currentStepRef.current = previousStep.id;
      setCurrentStepId(previousStep.id);
      setActiveStepConfirmed(false);
    }
  }, [applyEditedDraft, cancelAutosave, flow, getValues, persistValues]);

  const currentIndex = stepIndex(flow, currentStepId);
  const progressValue = currentIndex + 1;
  const isLastStep = currentIndex === flow.steps.length - 1;
  const ActiveStepComponent = activeStep.Component;
  const Summary = flow.Summary;

  return (
    <>
      <div className={styles.progressPanel}>
        <div className={styles.progressHeader}>
          <span>
            Schritt {progressValue} von {flow.steps.length}
          </span>
          <span>{Math.round((progressValue / flow.steps.length) * 100)} %</span>
        </div>
        <progress
          aria-label="Wizard-Fortschritt"
          max={flow.steps.length}
          value={progressValue}
        />
        <nav aria-label="Wizard-Fortschritt">
          <ol className={styles.stepList}>
            {flow.steps.map((step, index) => (
              <li
                key={step.id}
                className={
                  index < currentIndex
                    ? styles.completedStep
                    : index === currentIndex
                      ? styles.currentStep
                      : styles.upcomingStep
                }
                {...(index === currentIndex
                  ? { "aria-current": "step" as const }
                  : {})}
              >
                <span>{index + 1}</span>
                {step.title}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className={styles.workspace}>
        <form
          className={styles.formPanel}
          noValidate
          aria-labelledby="wizard-step-title"
          onSubmit={handleSubmit(submitValid, submitInvalid)}
        >
          <div className={styles.stepHeading}>
            <p className={styles.eyebrow}>Geführter Abfragekatalog</p>
            <h2 id="wizard-step-title" ref={stepHeadingRef} tabIndex={-1}>
              {activeStep.title}
            </h2>
            <p>{activeStep.description}</p>
          </div>

          {submitError ? (
            <div className={styles.errorSummary} role="alert">
              <strong>Eingabe noch unvollständig</strong>
              <span>{submitError}</span>
            </div>
          ) : null}

          <div className={styles.stepBody}>
            <ActiveStepComponent context={context} draft={draft} form={form} />
          </div>

          <div className={styles.formFooter}>
            <SaveStatusMessage status={saveStatus} />
            <div className={styles.actions}>
              {currentIndex > 0 ? (
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={goBack}
                >
                  ← Zurück
                </button>
              ) : null}
              <button
                className={styles.primaryButton}
                type="submit"
                disabled={
                  isLastStep &&
                  isPersisted &&
                  !isDirty &&
                  activeStepConfirmed
                }
              >
                {isLastStep
                  ? isPersisted && !isDirty && activeStepConfirmed
                    ? "Entwurf gesichert"
                    : isPersisted && !isDirty
                      ? "Schritt prüfen"
                      : "Entwurf sichern"
                  : "Weiter →"}
              </button>
            </div>
          </div>
        </form>

        <Summary context={context} draft={draft} values={watchedValues} />
      </div>
    </>
  );
}
