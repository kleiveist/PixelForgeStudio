import { useI18n, translateText } from "../../i18n";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import styles from "./GuidedTextChoice.module.css";

const CUSTOM_TEXT_CHOICE = "__custom__";

export interface GuidedTextChoiceProps {
  readonly describedBy: string;
  readonly error: string | null;
  readonly errorClassName: string | undefined;
  readonly fieldClassName: string | undefined;
  readonly help: string;
  readonly helpClassName: string | undefined;
  readonly id: string;
  readonly label: string;
  readonly maxLength: number;
  readonly multiline?: boolean;
  readonly onChoose: (value: string | undefined) => void;
  readonly presets: readonly string[];
  readonly registration: UseFormRegisterReturn;
  readonly value: unknown;
}

export function GuidedTextChoice({
  describedBy,
  error,
  errorClassName,
  fieldClassName,
  help,
  helpClassName,
  id,
  label,
  maxLength,
  multiline = false,
  onChoose,
  presets,
  registration,
  value
}: GuidedTextChoiceProps) {
  const { t, tx } = useI18n();
  const currentValue = typeof value === "string" ? value : "";
  const matchedPreset = presets.find(
    (preset) =>
      preset === currentValue || translateText("en", preset) === currentValue
  );
  const matchesPreset = matchedPreset !== undefined;
  const [customRequested, setCustomRequested] = useState(
    () => currentValue !== "" && !matchesPreset
  );
  const customActive =
    customRequested || (currentValue !== "" && !matchesPreset);
  const selectedValue = customActive
    ? CUSTOM_TEXT_CHOICE
    : matchesPreset
      ? matchedPreset
      : "";

  function choose(value: string): void {
    if (value === CUSTOM_TEXT_CHOICE) {
      setCustomRequested(true);
      return;
    }

    setCustomRequested(false);
    const nextValue = value === "" ? undefined : tx(value);
    if (nextValue !== currentValue) onChoose(nextValue);
  }

  return (
    <div className={fieldClassName}>
      <label htmlFor={id}>{tx(label)}</label>
      <select
        id={id}
        value={selectedValue}
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : "false"}
        onChange={(event) => choose(event.currentTarget.value)}
      >
        <option value="">{t("Nicht festgelegt")}</option>
        {presets.map((preset) => (
          <option key={preset} value={preset}>
            {tx(preset)}
          </option>
        ))}
        <option value={CUSTOM_TEXT_CHOICE}>{t("Eigene Eingabe")}</option>
      </select>
      {customActive ? (
        <div className={styles.customInput}>
          <label htmlFor={`${id}-custom`}>
            {t("Eigene Eingabe für")} {tx(label)}
          </label>
          {multiline ? (
            <textarea
              id={`${id}-custom`}
              rows={4}
              maxLength={maxLength}
              autoComplete="off"
              aria-describedby={describedBy}
              aria-invalid={error ? "true" : "false"}
              {...registration}
            />
          ) : (
            <input
              id={`${id}-custom`}
              type="text"
              autoComplete="off"
              maxLength={maxLength}
              aria-describedby={describedBy}
              aria-invalid={error ? "true" : "false"}
              {...registration}
            />
          )}
        </div>
      ) : null}
      <p id={`${id}-help`} className={helpClassName}>
        {tx(help)}
      </p>
      {error ? (
        <p id={`${id}-error`} className={errorClassName}>
          {tx(error)}
        </p>
      ) : null}
    </div>
  );
}
