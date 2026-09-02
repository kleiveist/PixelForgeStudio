import type { AssetCategory } from "../../domain/assets";
import type { StableId } from "../../schemas";

export type WizardStartIntent =
  | Readonly<{ kind: "newAsset"; category: AssetCategory | null }>
  | Readonly<{ kind: "profile"; assetProfileId: StableId }>
  | Readonly<{ kind: "resume"; draftId: StableId }>;

export interface WizardSessionState {
  readonly startIntent: WizardStartIntent | null;
}

export type WizardSessionAction = Readonly<{
  type: "startRequested";
  intent: WizardStartIntent;
}>;

export const INITIAL_WIZARD_SESSION_STATE: WizardSessionState = Object.freeze({
  startIntent: null
});

export function wizardSessionReducer(
  state: WizardSessionState,
  action: WizardSessionAction
): WizardSessionState {
  if (state.startIntent === action.intent) return state;
  return { startIntent: action.intent };
}
