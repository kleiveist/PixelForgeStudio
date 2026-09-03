import {
  ASSET_SUBTYPES,
  resolveCapabilities,
  type AssetCapabilities,
  type AssetCategory,
  type AssetSelection,
  type AssetSubtype
} from "../../domain/assets";
import {
  parseWizardDraft,
  type BaseProfileOverrides,
  type WizardDraft
} from "../../schemas";
import type {
  WizardCoreFormValues,
  WizardCoreStepId
} from "./wizardSteps";

type SelectedWizardDraft = Extract<WizardDraft, { category: unknown }>;
type MutableWizardCoreFormValues = {
  -readonly [Key in keyof WizardCoreFormValues]: WizardCoreFormValues[Key];
};

const CONTROLLED_ANSWER_KEYS = new Set([
  "directionCount",
  "animationAction",
  "animationType",
  "movementType",
  "seamless",
  "tileableAxes"
]);

function subtypeIsKnownForCategory(
  category: AssetCategory,
  subtype: AssetSubtype
): boolean {
  const knownSubtypes: readonly string[] = ASSET_SUBTYPES[category];
  return knownSubtypes.includes(subtype);
}

export function getWizardAssetSelection(
  values: Pick<WizardCoreFormValues, "category" | "subtype">
): AssetSelection | null {
  const { category, subtype } = values;
  if (
    category === undefined ||
    subtype === undefined ||
    !subtypeIsKnownForCategory(category, subtype)
  ) {
    return null;
  }

  switch (category) {
    case "character":
      return { category, subtype: subtype as (typeof ASSET_SUBTYPES.character)[number] };
    case "movingObject":
      return { category, subtype: subtype as (typeof ASSET_SUBTYPES.movingObject)[number] };
    case "staticObject":
      return { category, subtype: subtype as (typeof ASSET_SUBTYPES.staticObject)[number] };
    case "texture":
      return { category, subtype: subtype as (typeof ASSET_SUBTYPES.texture)[number] };
    case "nature":
      return { category, subtype: subtype as (typeof ASSET_SUBTYPES.nature)[number] };
    case "building":
      return { category, subtype: subtype as (typeof ASSET_SUBTYPES.building)[number] };
    case "tileset":
      return { category, subtype: subtype as (typeof ASSET_SUBTYPES.tileset)[number] };
    case "item":
      return { category, subtype: subtype as (typeof ASSET_SUBTYPES.item)[number] };
    case "artwork":
      return { category, subtype: subtype as (typeof ASSET_SUBTYPES.artwork)[number] };
  }
}

export function resolveWizardCapabilities(
  values: Pick<WizardCoreFormValues, "category" | "subtype">
): AssetCapabilities | null {
  const selection = getWizardAssetSelection(values);
  if (!selection) return null;

  switch (selection.category) {
    case "character":
      return resolveCapabilities("character", selection.subtype);
    case "movingObject":
      return resolveCapabilities("movingObject", selection.subtype);
    case "staticObject":
      return resolveCapabilities("staticObject", selection.subtype);
    case "texture":
      return resolveCapabilities("texture", selection.subtype);
    case "nature":
      return resolveCapabilities("nature", selection.subtype);
    case "building":
      return resolveCapabilities("building", selection.subtype);
    case "tileset":
      return resolveCapabilities("tileset", selection.subtype);
    case "item":
      return resolveCapabilities("item", selection.subtype);
    case "artwork":
      return resolveCapabilities("artwork", selection.subtype);
  }
}

export function wizardStepIsApplicable(
  stepId: WizardCoreStepId,
  values: WizardCoreFormValues
): boolean {
  if (stepId === "project" || stepId === "category") return true;

  const capabilities = resolveWizardCapabilities(values);
  if (!capabilities) return false;

  switch (stepId) {
    case "directions":
      return capabilities.directional;
    case "animation":
      return capabilities.animated;
    case "tileability":
      return capabilities.tileable;
  }
}

function addDefinedValue<
  Key extends keyof MutableWizardCoreFormValues
>(
  target: MutableWizardCoreFormValues,
  key: Key,
  value: MutableWizardCoreFormValues[Key]
): void {
  if (value !== undefined) target[key] = value;
}

export function createWizardCoreFormValues(
  draft: WizardDraft,
  categoryHint: AssetCategory | null = null
): WizardCoreFormValues {
  const values: MutableWizardCoreFormValues = {
    projectName: draft.projectName
  };

  if (!("category" in draft)) {
    if (categoryHint !== null) values.category = categoryHint;
    return values;
  }

  values.category = draft.category;
  values.subtype = draft.subtype;

  switch (draft.category) {
    case "character":
      addDefinedValue(values, "directionCount", draft.answers.directionCount);
      addDefinedValue(values, "animationAction", draft.answers.animationAction);
      break;
    case "movingObject":
      addDefinedValue(values, "directionCount", draft.answers.directionCount);
      addDefinedValue(values, "animationType", draft.answers.animationType);
      addDefinedValue(values, "movementType", draft.answers.movementType);
      break;
    case "staticObject":
      addDefinedValue(values, "animationType", draft.answers.animationType);
      break;
    case "texture":
      addDefinedValue(values, "seamless", draft.answers.seamless);
      break;
    case "nature":
      addDefinedValue(values, "animationType", draft.answers.animationType);
      break;
    case "building":
      break;
    case "tileset":
      addDefinedValue(values, "animationType", draft.answers.animationType);
      addDefinedValue(values, "tileableAxes", draft.answers.tileableAxes);
      break;
    case "item":
    case "artwork":
      break;
  }

  return values;
}

function selectionsMatch(
  draft: WizardDraft,
  selection: AssetSelection
): draft is SelectedWizardDraft {
  return (
    "category" in draft &&
    draft.category === selection.category &&
    draft.subtype === selection.subtype
  );
}

function sanitizeOverrides(
  overrides: BaseProfileOverrides | undefined,
  capabilities: AssetCapabilities
): BaseProfileOverrides | undefined {
  if (overrides === undefined) return undefined;
  if (capabilities.scaledCharacter) return overrides;

  const { characterHeight: _removedCharacterHeight, ...relevantOverrides } = overrides;
  return relevantOverrides;
}

function controlledAnswers(
  draft: WizardDraft,
  values: WizardCoreFormValues,
  selection: AssetSelection,
  capabilities: AssetCapabilities
): Record<string, unknown> {
  const previousAnswers = selectionsMatch(draft, selection)
    ? (draft.answers as Readonly<Record<string, unknown>>)
    : {};
  const answers = Object.fromEntries(
    Object.entries(previousAnswers).filter(
      ([key, value]) => !CONTROLLED_ANSWER_KEYS.has(key) && value !== undefined
    )
  );

  if (capabilities.directional && values.directionCount !== undefined) {
    answers.directionCount = values.directionCount;
  }

  switch (selection.category) {
    case "character":
      if (capabilities.animated && values.animationAction !== undefined) {
        answers.animationAction = values.animationAction;
      }
      break;
    case "movingObject":
      if (capabilities.movable && values.movementType !== undefined) {
        answers.movementType = values.movementType;
      }
      if (capabilities.animated && values.animationType !== undefined) {
        answers.animationType = values.animationType;
      }
      break;
    case "staticObject":
    case "nature":
    case "tileset":
      if (capabilities.animated && values.animationType !== undefined) {
        answers.animationType = values.animationType;
      }
      break;
    case "texture":
      if (capabilities.tileable && values.seamless !== undefined) {
        answers.seamless = values.seamless;
      }
      break;
    case "building":
    case "item":
    case "artwork":
      break;
  }

  if (
    selection.category === "tileset" &&
    capabilities.tileable &&
    values.tileableAxes !== undefined
  ) {
    answers.tileableAxes = values.tileableAxes;
  }

  const framesPerDirection = answers.framesPerDirection;
  const hasAnimation =
    answers.animationAction !== undefined || answers.animationType !== undefined;
  if (
    !capabilities.directional ||
    values.directionCount === undefined ||
    (typeof framesPerDirection === "number" &&
      framesPerDirection > 1 &&
      !hasAnimation)
  ) {
    delete answers.framesPerDirection;
  }

  return answers;
}

export interface UpdateWizardDraftFromCoreFormInput {
  readonly draft: WizardDraft;
  readonly values: WizardCoreFormValues;
  readonly stepId: WizardCoreStepId;
  readonly savedAt?: string;
}

export function updateWizardDraftFromCoreForm(
  input: UpdateWizardDraftFromCoreFormInput
): WizardDraft | null {
  const selection = getWizardAssetSelection(input.values);
  if (!selection) {
    if ("category" in input.draft) return null;

    const route =
      input.stepId === "project" ? "wizard/project" : "wizard/category";
    return parseWizardDraft({
      ...input.draft,
      projectName: input.values.projectName,
      route,
      currentStep: input.stepId,
      ...(input.savedAt === undefined ? {} : { savedAt: input.savedAt })
    });
  }

  const sameSelection = selectionsMatch(input.draft, selection);
  const capabilities = resolveWizardCapabilities(input.values);
  if (!capabilities) {
    throw new RangeError("A valid wizard selection must resolve capabilities.");
  }
  const overrides = sanitizeOverrides(
    "overrides" in input.draft ? input.draft.overrides : undefined,
    capabilities
  );
  const baseProfileId =
    "baseProfileId" in input.draft ? input.draft.baseProfileId : undefined;
  const common = {
    schemaVersion: 2,
    kind: "wizardDraft",
    draftId: input.draft.draftId,
    projectName: input.values.projectName,
    route: sameSelection ? input.draft.route : "wizard/profile",
    currentStep: input.stepId,
    ...(baseProfileId === undefined ? {} : { baseProfileId }),
    ...(sameSelection && input.draft.categoryProfileId !== undefined
      ? { categoryProfileId: input.draft.categoryProfileId }
      : {}),
    ...(sameSelection && input.draft.sourceAssetProfileId !== undefined
      ? { sourceAssetProfileId: input.draft.sourceAssetProfileId }
      : {}),
    ...(overrides === undefined ? {} : { overrides }),
    validation: sameSelection
      ? input.draft.validation
      : { errors: [], warnings: [] },
    savedAt: input.savedAt ?? input.draft.savedAt,
    answers: controlledAnswers(input.draft, input.values, selection, capabilities)
  } as const;

  switch (selection.category) {
    case "character":
      return parseWizardDraft({
        ...common,
        category: "character",
        subtype: selection.subtype
      });
    case "movingObject":
      return parseWizardDraft({
        ...common,
        category: "movingObject",
        subtype: selection.subtype
      });
    case "staticObject":
      return parseWizardDraft({
        ...common,
        category: "staticObject",
        subtype: selection.subtype
      });
    case "texture":
      return parseWizardDraft({
        ...common,
        category: "texture",
        subtype: selection.subtype
      });
    case "nature":
      return parseWizardDraft({
        ...common,
        category: "nature",
        subtype: selection.subtype
      });
    case "building":
      return parseWizardDraft({
        ...common,
        category: "building",
        subtype: selection.subtype
      });
    case "tileset":
      return parseWizardDraft({
        ...common,
        category: "tileset",
        subtype: selection.subtype
      });
    case "item":
      return parseWizardDraft({
        ...common,
        category: "item",
        subtype: selection.subtype
      });
    case "artwork":
      return parseWizardDraft({
        ...common,
        category: "artwork",
        subtype: selection.subtype
      });
  }
}
