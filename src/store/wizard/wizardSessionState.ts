import type {
  AssetCategory,
  AssetSubtype,
  DirectionCount
} from "../../domain/assets";
import { jsonValuesEqual } from "../../domain/json";
import type {
  CharacterAnswers,
  BaseProfileValues,
  MovingObjectAnswers,
  NatureAnswers,
  StableId,
  StaticObjectAnswers,
  TextureAnswers,
  TilesetAnswers,
  WizardDraft
} from "../../schemas";

export type WizardStartIntent =
  | Readonly<{ kind: "newAsset"; category: AssetCategory | null }>
  | Readonly<{ kind: "profile"; assetProfileId: StableId }>
  | Readonly<{ kind: "resume"; draftId: StableId }>;

export interface WizardSessionState {
  readonly startIntent: WizardStartIntent | null;
  readonly activeDraft: WizardDraft | null;
  readonly baselineDraft: WizardDraft | null;
  readonly draftPersisted: boolean;
  readonly rawCoreFormValues: WizardRawCoreFormValues | null;
  readonly sessionRevision: number;
}

export interface WizardRawCoreFormValues {
  readonly projectName: string;
  readonly category?: AssetCategory | undefined;
  readonly subtype?: AssetSubtype | undefined;
  readonly baseProfileId?: string | undefined;
  readonly pixelDensity?: BaseProfileValues["pixelDensity"] | undefined;
  readonly styleProfile?: BaseProfileValues["styleProfile"] | undefined;
  readonly tileSize?: BaseProfileValues["tileSize"] | undefined;
  readonly characterHeight?: BaseProfileValues["characterHeight"];
  readonly perspectiveType?: BaseProfileValues["perspectiveType"] | undefined;
  readonly cameraAngle?: BaseProfileValues["cameraAngle"] | undefined;
  readonly cameraDirection?: BaseProfileValues["cameraDirection"] | undefined;
  readonly projectionType?: BaseProfileValues["projectionType"] | undefined;
  readonly outlineStyle?: BaseProfileValues["outlineStyle"] | undefined;
  readonly paletteMode?: BaseProfileValues["paletteMode"] | undefined;
  readonly backgroundMode?: BaseProfileValues["backgroundMode"] | undefined;
  readonly alphaPadding?: BaseProfileValues["alphaPadding"] | undefined;
  readonly nearestNeighbor?: BaseProfileValues["nearestNeighbor"] | undefined;
  readonly lightingPolicy?: BaseProfileValues["lightingDefaults"]["policy"] | undefined;
  readonly lightingNotes?: BaseProfileValues["lightingDefaults"]["notes"] | undefined;
  readonly directionCount?: DirectionCount | undefined;
  readonly animationAction?: CharacterAnswers["animationAction"];
  readonly animationType?:
    | MovingObjectAnswers["animationType"]
    | StaticObjectAnswers["animationType"]
    | NatureAnswers["animationType"]
    | TilesetAnswers["animationType"];
  readonly movementType?: MovingObjectAnswers["movementType"];
  readonly seamless?: TextureAnswers["seamless"];
  readonly tileableAxes?: TilesetAnswers["tileableAxes"];
}

export type WizardDraftActivationMode =
  | "hydrate-transient"
  | "hydrate-persisted"
  | "edit"
  | "saved";

export type WizardSessionAction =
  | Readonly<{
      type: "startRequested";
      intent: WizardStartIntent;
    }>
  | Readonly<{
      type: "draftActivated";
      draft: WizardDraft;
      mode: WizardDraftActivationMode;
    }>
  | Readonly<{
      type: "rawCoreFormValuesCaptured";
      values: WizardRawCoreFormValues;
    }>
  | Readonly<{
      type: "profileRequestCleared";
      assetProfileId: StableId;
    }>;

export const INITIAL_WIZARD_SESSION_STATE: WizardSessionState = Object.freeze({
  startIntent: null,
  activeDraft: null,
  baselineDraft: null,
  draftPersisted: false,
  rawCoreFormValues: null,
  sessionRevision: 0
});

export function wizardDraftsStructurallyEqual(
  left: WizardDraft | null,
  right: WizardDraft | null
): boolean {
  if (left === null || right === null) return left === right;
  return jsonValuesEqual(left, right);
}

export function selectWizardSessionDirty(state: WizardSessionState): boolean {
  return (
    state.rawCoreFormValues !== null ||
    !wizardDraftsStructurallyEqual(state.activeDraft, state.baselineDraft)
  );
}

export function wizardSessionReducer(
  state: WizardSessionState,
  action: WizardSessionAction
): WizardSessionState {
  switch (action.type) {
    case "startRequested":
      return {
        startIntent: action.intent,
        activeDraft: null,
        baselineDraft: null,
        draftPersisted: false,
        rawCoreFormValues: null,
        sessionRevision: state.sessionRevision + 1
      };
    case "draftActivated":
      return {
        ...state,
        activeDraft: action.draft,
        baselineDraft:
          action.mode === "edit" ? state.baselineDraft : action.draft,
        draftPersisted:
          action.mode === "hydrate-transient"
            ? false
            : action.mode === "hydrate-persisted" || action.mode === "saved"
              ? true
              : state.draftPersisted,
        rawCoreFormValues: null
      };
    case "rawCoreFormValuesCaptured":
      return {
        ...state,
        rawCoreFormValues: Object.freeze({ ...action.values })
      };
    case "profileRequestCleared":
      return state.startIntent?.kind === "profile" &&
        state.startIntent.assetProfileId === action.assetProfileId
        ? {
            ...state,
            startIntent: null
          }
        : state;
  }
}
