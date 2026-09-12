import { useI18n } from "../../i18n";
import { useWatch, type UseFormReturn } from "react-hook-form";
import {
  CHARACTER_ANIMATION_ACTION_IDS,
  DEFAULT_CHARACTER_ANIMATION_FRAMES,
  type CharacterAnimationActionId
} from "../../domain/characters";
import type { WizardCoreFormValues } from "../wizard/wizardSteps";
import styles from "./CharacterEditor.module.css";

type CharacterForm = UseFormReturn<WizardCoreFormValues>;

const ACTION_LABELS: Readonly<Record<CharacterAnimationActionId, string>> = {
  idle: "Idle",
  walk: "Walk",
  run: "Run",
  attack: "Attack",
  use: "Use",
  talk: "Talk",
  interact: "Interact",
  hurt: "Hurt",
  special: "Spezialaktion"
};

function numberOrUndefined(value: unknown): number | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function frameError(
  form: CharacterForm,
  action: CharacterAnimationActionId
): string | null {
  const error = form.formState.errors.characterAnimationFrames?.[action];
  return typeof error?.message === "string" ? error.message : null;
}

export interface CharacterAnimationEditorProps {
  readonly form: CharacterForm;
  readonly notifyProgrammaticChange: () => void;
}

export function CharacterAnimationEditor({
  form,
  notifyProgrammaticChange
}: CharacterAnimationEditorProps) {
  const { t, tx } = useI18n();
  const animationFrames = useWatch({
    control: form.control,
    name: "characterAnimationFrames"
  });
  const directionCount = useWatch({
    control: form.control,
    name: "directionCount"
  });

  const toggleAction = (
    action: CharacterAnimationActionId,
    enabled: boolean
  ): void => {
    const current = form.getValues("characterAnimationFrames") ?? {};
    const next = { ...current };
    if (enabled) {
      next[action] =
        current[action] ?? DEFAULT_CHARACTER_ANIMATION_FRAMES[action];
    } else {
      delete next[action];
    }
    form.setValue(
      "characterAnimationFrames",
      Object.keys(next).length === 0 ? undefined : next,
      { shouldDirty: true, shouldTouch: true, shouldValidate: true }
    );
    notifyProgrammaticChange();
  };

  return (
    <div className={styles.animationEditor}>
      <div className={styles.logicNote} role="note">
        <strong>{t("Animation und Richtungsset bleiben getrennt.")}</strong>
        <span>
          {directionCount === undefined
            ? t(
                "Frames werden je Aktion festgelegt; ein Richtungsset ist nicht ausgewählt."
              )
            : t(
                "Jede Aktion verwendet ihre Frames in allen {0} gewählten Richtungen.",
                directionCount
              )}
        </span>
      </div>

      <fieldset className={styles.group}>
        <legend>{t("Aktionen und Frames")}</legend>
        <p className={styles.groupIntro}>
          {t(
            "Aktiviere nur benötigte Aktionen. Jede aktive Aktion erhält ein bis acht Frames; Walk startet mit dem Produktionsstandard von fünf."
          )}
        </p>
        <div className={styles.actionGrid}>
          {CHARACTER_ANIMATION_ACTION_IDS.map((action) => {
            const label = ACTION_LABELS[action];
            const enabled = Object.prototype.hasOwnProperty.call(
              animationFrames ?? {},
              action
            );
            const inputId = `character-animation-${action}`;
            const frameId = `${inputId}-frames`;
            const helpId = `${frameId}-help`;
            const errorId = `${frameId}-error`;
            const error = frameError(form, action);

            return (
              <div
                key={action}
                className={styles.actionCard}
                data-enabled={enabled ? "true" : "false"}
              >
                <label className={styles.actionToggle} htmlFor={inputId}>
                  <input
                    id={inputId}
                    type="checkbox"
                    aria-label={t("{0} aktivieren", tx(label))}
                    checked={enabled}
                    onChange={(event) =>
                      toggleAction(action, event.currentTarget.checked)
                    }
                  />
                  <span>
                    <strong>{tx(label)}</strong>
                    <small>
                      {enabled ? t("Aktiv") : t("Nicht ausgewählt")}
                    </small>
                  </span>
                </label>

                {enabled ? (
                  <div className={styles.frameField}>
                    <label htmlFor={frameId}>
                      {t("Frames für")} {tx(label)}
                    </label>
                    <input
                      id={frameId}
                      type="number"
                      min={1}
                      max={8}
                      step={1}
                      inputMode="numeric"
                      aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
                      aria-invalid={error ? "true" : "false"}
                      {...form.register(`characterAnimationFrames.${action}`, {
                        setValueAs: numberOrUndefined
                      })}
                    />
                    <p id={helpId} className={styles.help}>
                      {t("1 bis 8 Frames")}
                    </p>
                    {error ? (
                      <p id={errorId} className={styles.error}>
                        {tx(error)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </fieldset>

      <section
        className={styles.productionRules}
        aria-labelledby="character-animation-rules-title"
      >
        <h3 id="character-animation-rules-title">
          {t("Verbindliche Konsistenzregeln")}
        </h3>
        <ul>
          <li>
            {t(
              "Die Kamera und die Weltlichtseite bleiben in allen Frames fest."
            )}
          </li>
          <li>
            {t(
              "Richtungsansichten werden logisch neu gezeichnet und nicht blind gespiegelt."
            )}
          </li>
          <li>
            {t("Der Fußanker bleibt in jedem Frame an derselben Koordinate.")}
          </li>
          <li>
            {t(
              "Die Körperhöhe darf zwischen Richtungen höchstens ±1 px abweichen."
            )}
          </li>
        </ul>
      </section>
    </div>
  );
}
