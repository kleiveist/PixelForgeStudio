import { useEffect, useRef, useState } from "react";
import { useController, useWatch } from "react-hook-form";
import {
  ASSET_SUBTYPES,
  type AssetCategory,
  type AssetSubtype
} from "../../domain/assets";
import type { CharacterSubtype } from "../../domain/characters";
import {
  getDefaultMovingObjectClass,
  type MovingObjectSubtype
} from "../../domain/moving-objects";
import {
  getDefaultTextureMaterialType,
  type TextureSubtype
} from "../../domain/textures";
import {
  getDefaultNaturePlantType,
  type NatureSubtype
} from "../../domain/nature";
import type { ProfileLibrary } from "../../schemas";
import {
  CharacterAnimationEditor,
  CharacterDetailsEditor,
  type CharacterHeightSource
} from "../character-editor";
import {
  MovingObjectAnimationEditor,
  MovingObjectDetailsEditor
} from "../moving-object-editor";
import { TextureMaterialEditor } from "../texture-editor";
import { NatureTreeEditor } from "../nature-editor";
import { CategoryIcon } from "../dashboard/CategoryIcon";
import {
  DASHBOARD_CATEGORIES,
  formatSubtypeLabel,
  getDashboardCategory
} from "../dashboard/dashboardCatalog";
import {
  type GuidedWizardFlowDefinition,
  type GuidedWizardStepComponentProps,
  type GuidedWizardSummaryComponentProps
} from "./GuidedWizardEngine";
import { BaseProfileStep } from "./BaseProfileStep";
import { WizardTechnicalSummary } from "./WizardTechnicalSummary";
import {
  resolveWizardCapabilities,
  updateWizardDraftFromCoreForm,
  wizardStepIsApplicable
} from "./wizardCategoryRouting";
import {
  WIZARD_CHARACTER_DETAIL_FIELD_PATHS,
  WIZARD_MOVING_OBJECT_DETAIL_FIELD_PATHS,
  WIZARD_NATURE_DETAIL_FIELD_PATHS,
  WIZARD_TEXTURE_DETAIL_FIELD_PATHS,
  getWizardCoreStep,
  type WizardCoreFieldPath,
  type WizardCoreFormValues,
  type WizardCoreStepId
} from "./wizardSteps";
import { resolveWizardDraftSnapshot } from "./wizardLifecycle";
import styles from "./WizardView.module.css";

export interface WizardCoreFlowContext {
  readonly categoryHint: AssetCategory | null;
  readonly library: ProfileLibrary | null;
}

type CoreStepProps = GuidedWizardStepComponentProps<
  WizardCoreFormValues,
  WizardCoreFlowContext
>;

const CAPABILITY_LABELS = {
  movable: "beweglich",
  directional: "richtungsabhängig",
  animated: "animierbar",
  tileable: "kachelbar",
  gridBound: "rastergebunden",
  transparent: "transparent",
  scaledCharacter: "Figurenmaßstab",
  footprint: "Tile-Standfläche",
  wearable: "tragbar",
  modular: "modular",
  freeComposition: "freie Komposition"
} as const;

const ANIMATION_TYPE_OPTIONS = {
  staticObject: [
    ["openClose", "Öffnen / Schließen"],
    ["glow", "Leuchten"],
    ["break", "Zerbrechen"],
    ["custom", "Individuell"]
  ],
  nature: [
    ["wind", "Windbewegung"],
    ["magic", "Magischer Loop"],
    ["custom", "Individuell"]
  ],
  tileset: [
    ["water", "Wasser"],
    ["lava", "Lava"],
    ["magic", "Magie"],
    ["custom", "Individuell"]
  ]
} as const;

const CLASSIFICATION_FIELDS = [
  "subtype",
  ...WIZARD_CHARACTER_DETAIL_FIELD_PATHS,
  ...WIZARD_MOVING_OBJECT_DETAIL_FIELD_PATHS,
  ...WIZARD_TEXTURE_DETAIL_FIELD_PATHS,
  ...WIZARD_NATURE_DETAIL_FIELD_PATHS,
  "characterAnimationFrames",
  "movingObjectAnimationFrames",
  "directionCount",
  "animationAction",
  "animationType",
  "tileableAxes"
] as const satisfies readonly WizardCoreFieldPath[];

function optionalSelectValue(value: string): string | undefined {
  return value === "" ? undefined : value;
}

function fieldError(
  form: CoreStepProps["form"],
  field: WizardCoreFieldPath
): string | undefined {
  const error = form.formState.errors[field];
  return typeof error?.message === "string" ? error.message : undefined;
}

function clearClassificationFields(
  form: CoreStepProps["form"],
  includeSubtype: boolean
): void {
  for (const field of CLASSIFICATION_FIELDS) {
    if (!includeSubtype && field === "subtype") continue;
    form.setValue(field, undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }
}

function ProjectStep({ form }: CoreStepProps) {
  const error = fieldError(form, "projectName");
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

function CategoryStep({
  draft,
  form,
  notifyProgrammaticChange
}: CoreStepProps) {
  const firstCategoryRef = useRef<HTMLInputElement>(null);
  const subtypeRef = useRef<HTMLSelectElement>(null);
  const categoryController = useController({
    control: form.control,
    name: "category"
  });
  const subtypeController = useController({
    control: form.control,
    name: "subtype"
  });
  const category = categoryController.field.value;
  const subtype = subtypeController.field.value;
  const naturePlantType = useWatch({
    control: form.control,
    name: "naturePlantType"
  });
  const [pendingCategory, setPendingCategory] = useState<AssetCategory | null>(
    null
  );
  const [pendingSubtype, setPendingSubtype] = useState<AssetSubtype | "" | null>(
    null
  );
  const categoryError = fieldError(form, "category");
  const subtypeError = fieldError(form, "subtype");
  const capabilities = resolveWizardCapabilities({ category, subtype });
  const knownNatureSubtypes: readonly string[] = ASSET_SUBTYPES.nature;
  const expectedNaturePlantType =
    category === "nature" &&
    subtype !== undefined &&
    knownNatureSubtypes.includes(subtype)
      ? getDefaultNaturePlantType(subtype as NatureSubtype)
      : null;
  const naturePlantTypeMismatch =
    expectedNaturePlantType !== null &&
    naturePlantType !== undefined &&
    naturePlantType !== expectedNaturePlantType;

  useEffect(() => {
    if (categoryError) {
      firstCategoryRef.current?.focus();
      return;
    }
    if (subtypeError) subtypeRef.current?.focus();
  }, [categoryError, subtypeError]);

  const applyCategory = (nextCategory: AssetCategory): void => {
    subtypeController.field.onChange(undefined);
    clearClassificationFields(form, false);
    categoryController.field.onChange(nextCategory);
    setPendingCategory(null);
    setPendingSubtype(null);
  };

  const requestCategory = (nextCategory: AssetCategory): void => {
    if (nextCategory === category) return;
    setPendingSubtype(null);
    if ("category" in draft && draft.category !== nextCategory) {
      setPendingCategory(nextCategory);
      return;
    }
    applyCategory(nextCategory);
  };

  const applySubtype = (nextSubtype: AssetSubtype | ""): void => {
    subtypeController.field.onChange(undefined);
    clearClassificationFields(form, false);
    if (nextSubtype !== "") {
      subtypeController.field.onChange(nextSubtype);
      const movingObjectSubtypes: readonly string[] =
        ASSET_SUBTYPES.movingObject;
      if (
        category === "movingObject" &&
        movingObjectSubtypes.includes(nextSubtype)
      ) {
        form.setValue(
          "movingObjectClass",
          getDefaultMovingObjectClass(nextSubtype as MovingObjectSubtype),
          { shouldDirty: true, shouldTouch: true, shouldValidate: true }
        );
      }
      const textureSubtypes: readonly string[] = ASSET_SUBTYPES.texture;
      if (category === "texture" && textureSubtypes.includes(nextSubtype)) {
        form.setValue(
          "textureMaterialType",
          getDefaultTextureMaterialType(nextSubtype as TextureSubtype),
          { shouldDirty: true, shouldTouch: true, shouldValidate: true }
        );
      }
      const natureSubtypes: readonly string[] = ASSET_SUBTYPES.nature;
      if (category === "nature" && natureSubtypes.includes(nextSubtype)) {
        form.setValue(
          "naturePlantType",
          getDefaultNaturePlantType(nextSubtype as NatureSubtype),
          { shouldDirty: true, shouldTouch: true, shouldValidate: true }
        );
      }
    }
    setPendingSubtype(null);
  };

  const selectSubtype = (nextSubtype: AssetSubtype | ""): void => {
    if (nextSubtype === (subtype ?? "")) return;
    setPendingCategory(null);
    const discardsExistingDetails =
      "category" in draft &&
      draft.category === category &&
      (draft.sourceAssetProfileId !== undefined ||
        draft.categoryProfileId !== undefined ||
        Object.keys(draft.answers).length > 0 ||
        draft.validation.errors.length > 0 ||
        draft.validation.warnings.length > 0);
    if (discardsExistingDetails) {
      setPendingSubtype(nextSubtype);
      return;
    }
    applySubtype(nextSubtype);
  };

  const subtypeOptions = category ? ASSET_SUBTYPES[category] : [];

  return (
    <div className={styles.categoryStep}>
      <fieldset
        className={styles.categoryFieldset}
        aria-describedby={categoryError ? "wizard-category-error" : undefined}
      >
        <legend>
          Welche Art von Bild oder Asset möchtest du erstellen?{" "}
          <span className={styles.required}>Pflichtfeld</span>
        </legend>
        <div className={styles.categoryChoiceGrid}>
          {DASHBOARD_CATEGORIES.map((definition) => (
            <label
              key={definition.id}
              className={styles.categoryChoice}
              data-selected={category === definition.id ? "true" : "false"}
            >
              <input
                type="radio"
                name={categoryController.field.name}
                value={definition.id}
                checked={category === definition.id}
                ref={(node) => {
                  if (definition.id !== DASHBOARD_CATEGORIES[0]?.id) return;
                  firstCategoryRef.current = node;
                  categoryController.field.ref(node);
                }}
                onBlur={categoryController.field.onBlur}
                onChange={() => requestCategory(definition.id)}
              />
              <CategoryIcon category={definition.id} aria-hidden="true" />
              <span>
                <strong>{definition.label}</strong>
                <small>{definition.examples}</small>
              </span>
            </label>
          ))}
        </div>
        {categoryError ? (
          <p id="wizard-category-error" className={styles.fieldError}>
            {categoryError}
          </p>
        ) : null}
      </fieldset>

      {pendingCategory ? (
        <section className={styles.changeWarning} role="alert">
          <div>
            <strong>Kategorie wirklich wechseln?</strong>
            <p>
              Untertyp, Spezialantworten und die Verknüpfung zum bisherigen
              Assetprofil werden verworfen. Allgemeine Basiswerte bleiben
              erhalten.
            </p>
          </div>
          <div className={styles.inlineActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setPendingCategory(null)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => applyCategory(pendingCategory)}
            >
              Zu {getDashboardCategory(pendingCategory).label} wechseln
            </button>
          </div>
        </section>
      ) : null}

      {category ? (
        <div className={styles.fieldGroup}>
          <label htmlFor="wizard-asset-subtype">
            Untertyp <span className={styles.required}>Pflichtfeld</span>
          </label>
          <select
            id="wizard-asset-subtype"
            name={subtypeController.field.name}
            value={subtype ?? ""}
            ref={(node) => {
              subtypeRef.current = node;
              subtypeController.field.ref(node);
            }}
            onBlur={subtypeController.field.onBlur}
            aria-describedby={
              subtypeError
                ? "wizard-subtype-help wizard-subtype-error"
                : "wizard-subtype-help"
            }
            aria-invalid={subtypeError ? "true" : "false"}
            onChange={(event) =>
              selectSubtype(event.currentTarget.value as AssetSubtype | "")
            }
          >
            <option value="">Untertyp auswählen …</option>
            {subtypeOptions.map((option) => (
              <option key={option} value={option}>
                {formatSubtypeLabel(option)}
              </option>
            ))}
          </select>
          <p id="wizard-subtype-help" className={styles.fieldHelp}>
            Erst der Untertyp aktiviert die passenden Fragen und Produktionsregeln.
          </p>
          {subtypeError ? (
            <p id="wizard-subtype-error" className={styles.fieldError}>
              {subtypeError}
            </p>
          ) : null}
          {naturePlantTypeMismatch ? (
            <div className={styles.inlineActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  form.setValue("naturePlantType", expectedNaturePlantType, {
                    shouldDirty: true,
                    shouldTouch: true
                  });
                  void form.trigger("subtype");
                  notifyProgrammaticChange();
                  subtypeRef.current?.focus();
                }}
              >
                Pflanzentyp aus Untertyp wiederherstellen
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {pendingSubtype !== null ? (
        <section className={styles.changeWarning} role="alert">
          <div>
            <strong>Untertyp wirklich wechseln?</strong>
            <p>
              Spezialantworten und die Verknüpfung zum bisherigen Assetprofil
              werden verworfen. Allgemeine Basiswerte bleiben erhalten.
            </p>
          </div>
          <div className={styles.inlineActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setPendingSubtype(null)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => applySubtype(pendingSubtype)}
            >
              {pendingSubtype === ""
                ? "Untertyp leeren"
                : `Zu ${formatSubtypeLabel(pendingSubtype)} wechseln`}
            </button>
          </div>
        </section>
      ) : null}

      {capabilities ? (
        <section
          className={styles.capabilityPreview}
          aria-labelledby="wizard-capability-preview-title"
        >
          <div>
            <p className={styles.eyebrow}>Automatisch aufgelöst</p>
            <h3 id="wizard-capability-preview-title">Aktive Asset-Logik</h3>
          </div>
          <ul>
            {Object.entries(capabilities)
              .filter(([, enabled]) => enabled)
              .map(([capability]) => (
                <li key={capability}>
                  {CAPABILITY_LABELS[capability as keyof typeof CAPABILITY_LABELS]}
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DirectionsStep({ form }: CoreStepProps) {
  const directionController = useController({
    control: form.control,
    name: "directionCount"
  });
  const directionCount = directionController.field.value;

  return (
    <div className={styles.capabilityQuestions}>
      <fieldset className={styles.optionFieldset}>
        <legend>Wie viele Richtungsansichten werden benötigt?</legend>
        <div className={styles.segmentedOptions}>
          <label
            data-selected={directionCount === undefined ? "true" : "false"}
          >
            <input
              type="radio"
              name={directionController.field.name}
              value=""
              aria-label="Keine Richtungen"
              checked={directionCount === undefined}
              ref={directionController.field.ref}
              onBlur={directionController.field.onBlur}
              onChange={() => directionController.field.onChange(undefined)}
            />
            <strong>Keine Richtungen</strong>
            <span>Einzelansicht</span>
          </label>
          {([4, 8] as const).map((count) => (
            <label
              key={count}
              data-selected={directionCount === count ? "true" : "false"}
            >
              <input
                type="radio"
                name={directionController.field.name}
                value={count}
                aria-label={`${count} Richtungen`}
                checked={directionCount === count}
                onBlur={directionController.field.onBlur}
                onChange={() =>
                  directionController.field.onChange(count)
                }
              />
              <strong>{count} Richtungen</strong>
              <span>{count === 8 ? "Produktionsstandard" : "kompaktes Set"}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={styles.logicNote}>
        Die Kamera bleibt fest. Nur das Motiv wird logisch neu ausgerichtet;
        asymmetrische Details werden nicht blind gespiegelt.
        {directionCount === 8
          ? " Die feste Reihenfolge lautet S, SW, W, NW, N, NE, E, SE."
          : ""}
      </p>
    </div>
  );
}

function CharacterDetailsStep({ context, draft, form }: CoreStepProps) {
  const category = useWatch({ control: form.control, name: "category" });
  const subtype = useWatch({ control: form.control, name: "subtype" });
  const baseProfileId = useWatch({
    control: form.control,
    name: "baseProfileId"
  });
  const characterHeight = useWatch({
    control: form.control,
    name: "characterHeight"
  });
  const selection = resolveWizardCapabilities({ category, subtype });
  const baseProfile = context.library?.baseProfiles.find(
    (profile) => profile.id === baseProfileId
  );

  if (
    category !== "character" ||
    subtype === undefined ||
    !selection?.scaledCharacter ||
    baseProfile === undefined ||
    characterHeight === undefined
  ) {
    return (
      <section className={styles.changeWarning} role="alert">
        <strong>Figurenprofil nicht verfügbar</strong>
        <p>
          Kehre zum Basisprofil zurück und wähle eine gültige
          Produktionsfamilie mit Figurenmaßstab.
        </p>
      </section>
    );
  }

  const resolution = context.library
    ? resolveWizardDraftSnapshot(draft, context.library)
    : null;
  const resolvedHeightSource =
    resolution?.status === "resolved"
      ? resolution.profile.valueSources.characterHeight
      : undefined;
  const categoryProfile =
    "categoryProfileId" in draft && draft.categoryProfileId !== undefined
      ? context.library?.categoryProfiles.find(
          (profile) => profile.id === draft.categoryProfileId
        )
      : undefined;
  const heightSource: CharacterHeightSource =
    resolvedHeightSource === "category"
      ? "Kategorieprofil"
      : resolvedHeightSource === "asset"
        ? "Lokaler Entwurf"
        : "Basisprofil";
  const heightSourceName =
    resolvedHeightSource === "category"
      ? (categoryProfile?.name ?? "Unbekanntes Kategorieprofil")
      : resolvedHeightSource === "asset"
        ? draft.projectName || "Aktueller Entwurf"
        : baseProfile.name;

  return (
    <CharacterDetailsEditor
      characterHeight={characterHeight}
      form={form}
      heightLocked={baseProfile.locks.characterHeight === true}
      heightSource={heightSource}
      heightSourceName={heightSourceName}
      subtype={subtype as CharacterSubtype}
    />
  );
}

function MovingObjectDetailsStep({ form }: CoreStepProps) {
  const category = useWatch({ control: form.control, name: "category" });
  const subtype = useWatch({ control: form.control, name: "subtype" });
  const knownMovingObjectSubtypes: readonly string[] =
    ASSET_SUBTYPES.movingObject;

  if (
    category !== "movingObject" ||
    subtype === undefined ||
    !knownMovingObjectSubtypes.includes(subtype)
  ) {
    return (
      <section className={styles.changeWarning} role="alert">
        <strong>Bewegungsobjekt nicht verfügbar</strong>
        <p>
          Kehre zur Bildart zurück und wähle einen gültigen Untertyp für ein
          bewegliches Objekt.
        </p>
      </section>
    );
  }

  return (
    <MovingObjectDetailsEditor
      form={form}
      subtype={subtype as MovingObjectSubtype}
    />
  );
}

function TextureDetailsStep({ form }: CoreStepProps) {
  const category = useWatch({ control: form.control, name: "category" });
  const subtype = useWatch({ control: form.control, name: "subtype" });
  const knownTextureSubtypes: readonly string[] = ASSET_SUBTYPES.texture;

  if (
    category !== "texture" ||
    subtype === undefined ||
    !knownTextureSubtypes.includes(subtype)
  ) {
    return (
      <section className={styles.changeWarning} role="alert">
        <strong>Texturprofil nicht verfügbar</strong>
        <p>
          Kehre zur Bildart zurück und wähle einen gültigen Material-Untertyp.
        </p>
      </section>
    );
  }

  return (
    <TextureMaterialEditor
      form={form}
      subtype={subtype as TextureSubtype}
    />
  );
}

function NatureDetailsStep({ form }: CoreStepProps) {
  const category = useWatch({ control: form.control, name: "category" });
  const subtype = useWatch({ control: form.control, name: "subtype" });
  const knownNatureSubtypes: readonly string[] = ASSET_SUBTYPES.nature;

  if (
    category !== "nature" ||
    subtype === undefined ||
    !knownNatureSubtypes.includes(subtype)
  ) {
    return (
      <section className={styles.changeWarning} role="alert">
        <strong>Naturprofil nicht verfügbar</strong>
        <p>
          Kehre zur Bildart zurück und wähle einen gültigen Pflanzen- oder
          Natur-Untertyp.
        </p>
      </section>
    );
  }

  return (
    <NatureTreeEditor
      form={form}
      subtype={subtype as NatureSubtype}
    />
  );
}

function AnimationSelect({
  form,
  options
}: Readonly<{
  form: CoreStepProps["form"];
  options: readonly (readonly [string, string])[];
}>) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor="wizard-animation-type">Animationsart</label>
      <select
        id="wizard-animation-type"
        {...form.register("animationType", { setValueAs: optionalSelectValue })}
      >
        <option value="">Noch keine Animation festlegen</option>
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AnimationStep({ form, notifyProgrammaticChange }: CoreStepProps) {
  const category = useWatch({ control: form.control, name: "category" });
  const subtype = useWatch({ control: form.control, name: "subtype" });
  const values = form.getValues();
  const capabilities = resolveWizardCapabilities(values);

  if (!category || !capabilities?.animated) return null;

  return (
    <div className={styles.capabilityQuestions}>
      <div className={styles.logicNote} role="note">
        <strong>
          {capabilities.movable
            ? "Dieses Asset kann sich bewegen."
            : "Dieses Asset bleibt am Ort und kann trotzdem animiert sein."}
        </strong>
        <span>
          {capabilities.directional
            ? "Animation und Richtungsset werden getrennt gespeichert."
            : "Dafür wird bewusst kein Richtungsset eingeblendet."}
        </span>
      </div>

      {category === "character" ? (
        <CharacterAnimationEditor
          form={form}
          notifyProgrammaticChange={notifyProgrammaticChange}
        />
      ) : null}

      {category === "movingObject" &&
      subtype !== undefined &&
      (ASSET_SUBTYPES.movingObject as readonly string[]).includes(subtype) ? (
        <MovingObjectAnimationEditor
          form={form}
          notifyProgrammaticChange={notifyProgrammaticChange}
          subtype={subtype as MovingObjectSubtype}
        />
      ) : null}

      {category === "staticObject" ? (
        <AnimationSelect form={form} options={ANIMATION_TYPE_OPTIONS.staticObject} />
      ) : null}
      {category === "nature" ? (
        <AnimationSelect form={form} options={ANIMATION_TYPE_OPTIONS.nature} />
      ) : null}
      {category === "tileset" ? (
        <AnimationSelect form={form} options={ANIMATION_TYPE_OPTIONS.tileset} />
      ) : null}
      {category === "building" ? (
        <p className={styles.logicNote}>
          Dieser Untertyp unterstützt eine Animation. Die konkreten Tor- und
          Architekturphasen werden im Gebäudeeditor festgelegt.
        </p>
      ) : null}
    </div>
  );
}

function TileabilityStep({ form }: CoreStepProps) {
  const category = useWatch({ control: form.control, name: "category" });

  return (
    <div className={styles.capabilityQuestions}>
      {category === "tileset" ? (
        <div className={styles.fieldGroup}>
          <label htmlFor="wizard-tileable-axes">Kachelbare Achsen</label>
          <select
            id="wizard-tileable-axes"
            {...form.register("tileableAxes", {
              setValueAs: optionalSelectValue
            })}
          >
            <option value="">Noch nicht festgelegt</option>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertikal</option>
            <option value="both">Horizontal und vertikal</option>
            <option value="none">Keine Wiederholung</option>
          </select>
        </div>
      ) : null}
      <p className={styles.logicNote}>
        Richtungsfragen bleiben in diesem Schritt ausgeschlossen. Kachelbarkeit
        beschreibt Oberflächenwiederholung, nicht Bewegung.
      </p>
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
      activeCategory={values.category ?? null}
      activeSubtype={values.subtype ?? null}
      selection={getSelectionSummary(values)}
      formValues={values}
    />
  );
}

function getSelectionSummary(values: WizardCoreFormValues) {
  const capabilities = resolveWizardCapabilities(values);
  if (!values.category || !values.subtype || !capabilities) return null;
  return {
    category: values.category,
    subtype: values.subtype,
    capabilities
  } as const;
}

const STEP_COMPONENTS = {
  project: ProjectStep,
  category: CategoryStep,
  baseProfile: BaseProfileStep,
  characterDetails: CharacterDetailsStep,
  movingObjectDetails: MovingObjectDetailsStep,
  textureDetails: TextureDetailsStep,
  natureDetails: NatureDetailsStep,
  directions: DirectionsStep,
  animation: AnimationStep,
  tileability: TileabilityStep
} as const;

export const WIZARD_CORE_FLOW = Object.freeze({
  steps: Object.freeze([
    Object.freeze({
      ...getWizardCoreStep("project"),
      Component: STEP_COMPONENTS.project
    }),
    Object.freeze({
      ...getWizardCoreStep("category"),
      Component: STEP_COMPONENTS.category
    }),
    Object.freeze({
      ...getWizardCoreStep("baseProfile"),
      Component: STEP_COMPONENTS.baseProfile,
      isApplicable: (
        values: WizardCoreFormValues,
        context: WizardCoreFlowContext
      ) => wizardStepIsApplicable("baseProfile", values, context.library)
    }),
    Object.freeze({
      ...getWizardCoreStep("characterDetails"),
      Component: STEP_COMPONENTS.characterDetails,
      isApplicable: (
        values: WizardCoreFormValues,
        context: WizardCoreFlowContext
      ) => wizardStepIsApplicable("characterDetails", values, context.library)
    }),
    Object.freeze({
      ...getWizardCoreStep("movingObjectDetails"),
      Component: STEP_COMPONENTS.movingObjectDetails,
      isApplicable: (
        values: WizardCoreFormValues,
        context: WizardCoreFlowContext
      ) => wizardStepIsApplicable("movingObjectDetails", values, context.library)
    }),
    Object.freeze({
      ...getWizardCoreStep("textureDetails"),
      Component: STEP_COMPONENTS.textureDetails,
      isApplicable: (
        values: WizardCoreFormValues,
        context: WizardCoreFlowContext
      ) => wizardStepIsApplicable("textureDetails", values, context.library)
    }),
    Object.freeze({
      ...getWizardCoreStep("natureDetails"),
      Component: STEP_COMPONENTS.natureDetails,
      isApplicable: (
        values: WizardCoreFormValues,
        context: WizardCoreFlowContext
      ) => wizardStepIsApplicable("natureDetails", values, context.library)
    }),
    Object.freeze({
      ...getWizardCoreStep("directions"),
      Component: STEP_COMPONENTS.directions,
      isApplicable: (
        values: WizardCoreFormValues,
        context: WizardCoreFlowContext
      ) => wizardStepIsApplicable("directions", values, context.library)
    }),
    Object.freeze({
      ...getWizardCoreStep("animation"),
      Component: STEP_COMPONENTS.animation,
      isApplicable: (
        values: WizardCoreFormValues,
        context: WizardCoreFlowContext
      ) => wizardStepIsApplicable("animation", values, context.library)
    }),
    Object.freeze({
      ...getWizardCoreStep("tileability"),
      Component: STEP_COMPONENTS.tileability,
      isApplicable: (
        values: WizardCoreFormValues,
        context: WizardCoreFlowContext
      ) => wizardStepIsApplicable("tileability", values, context.library)
    })
  ]),
  updateDraft: updateWizardDraftFromCoreForm,
  Summary: CoreSummary
} satisfies GuidedWizardFlowDefinition<
  WizardCoreFormValues,
  WizardCoreStepId,
  WizardCoreFlowContext
>);
