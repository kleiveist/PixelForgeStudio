import { isHumanoidCharacterSubtype } from "../characters";
import type {
  ProfileResolutionResult,
  ResolvedProfile
} from "../profiles";

export const ANIMATION_HANDOFF_WALK_TEMPLATE_FRAMES = 8 as const;

export type AnimationHandoffDirectionDecision =
  | "retainFourDirectionRequirement"
  | "upgradeToEightDirectionMvp";

export interface AnimationHandoffDecisions {
  readonly acceptEightFrameWalkTemplate?: boolean;
  readonly directionDecision?: AnimationHandoffDirectionDecision;
}

export interface AnimationProjectSeedAction {
  readonly action:
    | "idle"
    | "walk"
    | "run"
    | "attack"
    | "use"
    | "talk"
    | "interact"
    | "hurt"
    | "special";
  readonly frames: number;
}

export interface AnimationProjectSeed {
  readonly sourcePromptProfileId: ResolvedProfile["assetProfileId"];
  readonly displayName: string;
  readonly characterHeight: number;
  readonly baseCompatibilityKey: string;
  readonly requestedDirectionCount: 4 | 8;
  readonly directionRequirement: 4 | 8;
  readonly directionDecision:
    | "alreadyEightDirections"
    | AnimationHandoffDirectionDecision;
  readonly requestedClips: readonly AnimationProjectSeedAction[];
  readonly walkTemplate: Readonly<{
    enabled: boolean;
    templateFrames: typeof ANIMATION_HANDOFF_WALK_TEMPLATE_FRAMES;
    requestedFrames?: number;
  }>;
}

export type AnimationHandoffBlocker =
  | Readonly<{ code: "profileConflict"; conflictCount: number }>
  | Readonly<{ code: "wrongCategory"; actualCategory: string }>
  | Readonly<{ code: "nonHumanoid"; subtype: string }>
  | Readonly<{ code: "missingCharacterHeight" }>
  | Readonly<{ code: "missingDirectionCount" }>;

export type AnimationHandoffConfirmation =
  | Readonly<{
      code: "walkFrameMismatch";
      requestedFrames: number;
      templateFrames: typeof ANIMATION_HANDOFF_WALK_TEMPLATE_FRAMES;
    }>
  | Readonly<{
      code: "fourDirectionDecision";
      requestedDirections: 4;
      mvpDirections: 8;
    }>;

export type AnimationProjectSeedResult =
  | Readonly<{
      status: "blocked";
      blockers: readonly AnimationHandoffBlocker[];
    }>
  | Readonly<{
      status: "confirmationRequired";
      confirmations: readonly AnimationHandoffConfirmation[];
    }>
  | Readonly<{ status: "ready"; seed: AnimationProjectSeed }>;

function canonicalActions(
  profile: ResolvedProfile
): readonly AnimationProjectSeedAction[] {
  if (profile.categoryData.category !== "character") return Object.freeze([]);
  const answers = profile.categoryData.answers;
  if (answers.animationActions) {
    return Object.freeze(
      answers.animationActions.map(({ action, frames }) =>
        Object.freeze({ action, frames })
      )
    );
  }
  if (answers.animationAction) {
    return Object.freeze([
      Object.freeze({
        action: answers.animationAction,
        frames: answers.framesPerDirection ?? 1
      })
    ]);
  }
  return Object.freeze([]);
}

/**
 * Maps a resolved Prompt Studio profile to the deliberately narrow Animation
 * Studio handoff contract. Descriptive prompt/category fields are never read,
 * which prevents them from leaking into animation project persistence.
 */
export function createAnimationProjectSeedFromCharacterProfile(
  resolution: ProfileResolutionResult,
  decisions: AnimationHandoffDecisions = {}
): AnimationProjectSeedResult {
  if (resolution.status !== "resolved") {
    return Object.freeze({
      status: "blocked",
      blockers: Object.freeze([
        Object.freeze({
          code: "profileConflict" as const,
          conflictCount: resolution.conflicts.length
        })
      ])
    });
  }

  const profile = resolution.profile;
  if (profile.categoryData.category !== "character") {
    return Object.freeze({
      status: "blocked",
      blockers: Object.freeze([
        Object.freeze({
          code: "wrongCategory" as const,
          actualCategory: profile.categoryData.category
        })
      ])
    });
  }
  if (!isHumanoidCharacterSubtype(profile.categoryData.subtype)) {
    return Object.freeze({
      status: "blocked",
      blockers: Object.freeze([
        Object.freeze({
          code: "nonHumanoid" as const,
          subtype: profile.categoryData.subtype
        })
      ])
    });
  }

  const blockers: AnimationHandoffBlocker[] = [];
  if (profile.values.characterHeight === undefined) {
    blockers.push(Object.freeze({ code: "missingCharacterHeight" }));
  }
  const directionCount = profile.categoryData.answers.directionCount;
  if (directionCount === undefined) {
    blockers.push(Object.freeze({ code: "missingDirectionCount" }));
  }
  if (blockers.length > 0) {
    return Object.freeze({
      status: "blocked",
      blockers: Object.freeze(blockers)
    });
  }

  const actions = canonicalActions(profile);
  const walk = actions.find(({ action }) => action === "walk");
  const confirmations: AnimationHandoffConfirmation[] = [];
  if (
    walk &&
    walk.frames !== ANIMATION_HANDOFF_WALK_TEMPLATE_FRAMES &&
    decisions.acceptEightFrameWalkTemplate !== true
  ) {
    confirmations.push(
      Object.freeze({
        code: "walkFrameMismatch",
        requestedFrames: walk.frames,
        templateFrames: ANIMATION_HANDOFF_WALK_TEMPLATE_FRAMES
      })
    );
  }
  if (directionCount === 4 && decisions.directionDecision === undefined) {
    confirmations.push(
      Object.freeze({
        code: "fourDirectionDecision",
        requestedDirections: 4,
        mvpDirections: 8
      })
    );
  }
  if (confirmations.length > 0) {
    return Object.freeze({
      status: "confirmationRequired",
      confirmations: Object.freeze(confirmations)
    });
  }

  const directionDecision =
    directionCount === 8
      ? "alreadyEightDirections"
      : decisions.directionDecision!;
  const directionRequirement =
    directionDecision === "retainFourDirectionRequirement" ? 4 : 8;
  return Object.freeze({
    status: "ready",
    seed: Object.freeze({
      sourcePromptProfileId: profile.assetProfileId,
      displayName: profile.name,
      characterHeight: profile.values.characterHeight!,
      baseCompatibilityKey: profile.compatibilityKey,
      requestedDirectionCount: directionCount!,
      directionRequirement,
      directionDecision,
      requestedClips: actions,
      walkTemplate: Object.freeze({
        enabled: walk !== undefined,
        templateFrames: ANIMATION_HANDOFF_WALK_TEMPLATE_FRAMES,
        ...(walk ? { requestedFrames: walk.frames } : {})
      })
    })
  });
}
