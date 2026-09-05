import { z } from "zod";
import {
  PART_SLOT_IDS,
  getMirroredSourceDirection
} from "../domain/animation";
import { IsoDateTimeSchema, StableIdSchema } from "./common.schema";
import {
  AnimationActionIdSchema,
  AnimationDirectionSchema,
  AnimationDirectionSourceModeSchema,
  AnimationFrameProfileSchema,
  AnimationFrameTransformDeltaSchema,
  AnimationJointIdSchema,
  AnimationMirrorPolicySchema,
  AnimationNameSchema,
  AnimationPartSlotSchema,
  AnimationProjectPartDeltaSchema,
  AnimationProjectPartLayerOffsetSchema,
  AnimationRigTemplateIdSchema,
  AnimationSchemaVersionSchema,
  MAX_ANIMATION_CLIPS_PER_PROJECT,
  MAX_ANIMATION_FPS,
  MAX_ANIMATION_FRAMES_PER_CLIP,
  MAX_ANIMATION_OVERRIDES_PER_PROJECT,
  MAX_ANIMATION_PARTS_PER_PROJECT,
  MAX_ANIMATION_COMPATIBILITY_KEY_LENGTH
} from "./animationPrimitives.schema";

export const ProjectPartAssignmentSchema = z
  .strictObject({
    assetId: StableIdSchema,
    transformDelta: AnimationProjectPartDeltaSchema.optional(),
    layerOffset: AnimationProjectPartLayerOffsetSchema.optional(),
    mirrorPolicy: AnimationMirrorPolicySchema.optional()
  })
  .readonly();

export const AnimationClipSchema = z
  .strictObject({
    clipId: StableIdSchema,
    templateId: StableIdSchema,
    action: AnimationActionIdSchema,
    frameCount: z.number().int().min(1).max(MAX_ANIMATION_FRAMES_PER_CLIP),
    fps: z.number().finite().positive().max(MAX_ANIMATION_FPS),
    loop: z.boolean()
  })
  .superRefine((clip, context) => {
    if (clip.action === "walk" && clip.frameCount !== 8) {
      context.addIssue({
        code: "custom",
        path: ["frameCount"],
        message: "Walk clips require exactly 8 frames in animation format V1."
      });
    }
  })
  .readonly();

const JointDeltaRecordSchema = z
  .partialRecord(AnimationJointIdSchema, AnimationFrameTransformDeltaSchema)
  .readonly();
const PartDeltaRecordSchema = z
  .partialRecord(AnimationPartSlotSchema, AnimationFrameTransformDeltaSchema)
  .readonly();

const LayerOrderOverrideSchema = z
  .array(AnimationPartSlotSchema)
  .max(PART_SLOT_IDS.length)
  .refine((slots) => new Set(slots).size === slots.length, {
    message: "Layer order override must not contain duplicate slots."
  })
  .readonly();

export const DirectionFrameOverrideSchema = z
  .strictObject({
    clipId: StableIdSchema,
    direction: AnimationDirectionSchema,
    frameIndex: z
      .number()
      .int()
      .min(0)
      .max(MAX_ANIMATION_FRAMES_PER_CLIP - 1),
    rootDelta: AnimationFrameTransformDeltaSchema.optional(),
    jointDeltas: JointDeltaRecordSchema.optional(),
    partDeltas: PartDeltaRecordSchema.optional(),
    layerOrderOverride: LayerOrderOverrideSchema.optional()
  })
  .superRefine((override, context) => {
    const isNeutral = (delta: {
      offsetX: number;
      offsetY: number;
      rotationDelta: number;
      scaleMultiplier: number;
    }) =>
      delta.offsetX === 0 &&
      delta.offsetY === 0 &&
      delta.rotationDelta === 0 &&
      delta.scaleMultiplier === 1;
    if (override.rootDelta && isNeutral(override.rootDelta)) {
      context.addIssue({
        code: "custom",
        path: ["rootDelta"],
        message: "Neutral root deltas must be removed instead of persisted."
      });
    }
    for (const [jointId, delta] of Object.entries(override.jointDeltas ?? {})) {
      if (delta && isNeutral(delta)) {
        context.addIssue({
          code: "custom",
          path: ["jointDeltas", jointId],
          message: "Neutral joint deltas must be removed instead of persisted."
        });
      }
    }
    for (const [slot, delta] of Object.entries(override.partDeltas ?? {})) {
      if (delta && isNeutral(delta)) {
        context.addIssue({
          code: "custom",
          path: ["partDeltas", slot],
          message: "Neutral part deltas must be removed instead of persisted."
        });
      }
    }
    const hasJointDelta =
      override.jointDeltas !== undefined &&
      Object.keys(override.jointDeltas).length > 0;
    const hasPartDelta =
      override.partDeltas !== undefined &&
      Object.keys(override.partDeltas).length > 0;
    const hasLayerOverride =
      override.layerOrderOverride !== undefined &&
      override.layerOrderOverride.length > 0;

    if (
      override.rootDelta === undefined &&
      !hasJointDelta &&
      !hasPartDelta &&
      !hasLayerOverride
    ) {
      context.addIssue({
        code: "custom",
        message: "A frame override must contain at least one explicit delta."
      });
    }
  })
  .readonly();

export const SourcePromptReferenceSchema = z
  .strictObject({
    assetProfileId: StableIdSchema,
    profileName: AnimationNameSchema.optional(),
    compatibilityKey: z
      .string()
      .trim()
      .min(1)
      .max(MAX_ANIMATION_COMPATIBILITY_KEY_LENGTH),
    requestedDirectionCount: z.union([z.literal(4), z.literal(8)]).optional(),
    directionDecision: z
      .enum([
        "alreadyEightDirections",
        "retainFourDirectionRequirement",
        "upgradeToEightDirectionMvp"
      ])
      .optional(),
    requestedActions: z
      .array(
        z
          .strictObject({
            action: z.string().trim().min(1).max(40),
            frames: z.number().int().min(1).max(MAX_ANIMATION_FRAMES_PER_CLIP)
          })
          .readonly()
      )
      .max(32)
      .optional()
      .readonly()
  })
  .readonly();

export const ProjectPartAssignmentsSchema = z
  .array(ProjectPartAssignmentSchema)
  .max(MAX_ANIMATION_PARTS_PER_PROJECT)
  .readonly();
export const AnimationClipsSchema = z
  .array(AnimationClipSchema)
  .max(MAX_ANIMATION_CLIPS_PER_PROJECT)
  .readonly();
export const DirectionFrameOverridesSchema = z
  .array(DirectionFrameOverrideSchema)
  .max(MAX_ANIMATION_OVERRIDES_PER_PROJECT)
  .readonly();

export const DirectionMirrorReviewSchema = z
  .strictObject({
    assetId: StableIdSchema,
    sourceUpdatedAt: IsoDateTimeSchema,
    targetDirection: AnimationDirectionSchema,
    confirmedAt: IsoDateTimeSchema
  })
  .superRefine((review, context) => {
    if (!getMirroredSourceDirection(review.targetDirection)) {
      context.addIssue({
        code: "custom",
        path: ["targetDirection"],
        message: "A mirror review must target southwest, west, or northwest."
      });
    }
  })
  .readonly();

export const DirectionMirrorReviewsSchema = z
  .array(DirectionMirrorReviewSchema)
  .max(MAX_ANIMATION_OVERRIDES_PER_PROJECT)
  .readonly();

const AnimationProjectObjectSchema = z.strictObject({
  schemaVersion: AnimationSchemaVersionSchema,
  kind: z.literal("animationProject"),
  projectId: StableIdSchema,
  name: AnimationNameSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  rigTemplateId: AnimationRigTemplateIdSchema,
  frameProfile: AnimationFrameProfileSchema,
  directionSourceMode: AnimationDirectionSourceModeSchema,
  directionRequirement: z.union([z.literal(4), z.literal(8)]).default(8),
  mirrorPolicy: AnimationMirrorPolicySchema.default("allow"),
  mirrorReviews: DirectionMirrorReviewsSchema.default([]),
  parts: ProjectPartAssignmentsSchema,
  clips: AnimationClipsSchema,
  overrides: DirectionFrameOverridesSchema,
  sourcePrompt: SourcePromptReferenceSchema.optional(),
  previewBlobId: StableIdSchema.optional()
});

export const AnimationProjectSchema = AnimationProjectObjectSchema.superRefine(
  (project, context) => {
    const assetIds = new Set<string>();
    project.parts.forEach((part, index) => {
      if (assetIds.has(part.assetId)) {
        context.addIssue({
          code: "custom",
          path: ["parts", index, "assetId"],
          message: `Duplicate project part asset id "${part.assetId}".`
        });
      }
      assetIds.add(part.assetId);
    });

    const clipsById = new Map(project.clips.map((clip) => [clip.clipId, clip]));
    const clipIds = new Set<string>();
    project.clips.forEach((clip, index) => {
      if (clipIds.has(clip.clipId)) {
        context.addIssue({
          code: "custom",
          path: ["clips", index, "clipId"],
          message: `Duplicate animation clip id "${clip.clipId}".`
        });
      }
      clipIds.add(clip.clipId);
    });

    const overrideTargets = new Set<string>();
    project.overrides.forEach((override, index) => {
      const clip = clipsById.get(override.clipId);
      if (!clip) {
        context.addIssue({
          code: "custom",
          path: ["overrides", index, "clipId"],
          message: `Frame override references missing clip "${override.clipId}".`
        });
      } else if (override.frameIndex >= clip.frameCount) {
        context.addIssue({
          code: "custom",
          path: ["overrides", index, "frameIndex"],
          message: `Frame index must be between 0 and ${clip.frameCount - 1}.`
        });
      }

      const target = `${override.clipId}:${override.direction}:${override.frameIndex}`;
      if (overrideTargets.has(target)) {
        context.addIssue({
          code: "custom",
          path: ["overrides", index],
          message: `Duplicate frame override target "${target}".`
        });
      }
      overrideTargets.add(target);
    });

    const mirrorReviewTargets = new Set<string>();
    project.mirrorReviews.forEach((review, index) => {
      if (!assetIds.has(review.assetId)) {
        context.addIssue({
          code: "custom",
          path: ["mirrorReviews", index, "assetId"],
          message: `Mirror review references unassigned asset "${review.assetId}".`
        });
      }
      const target = `${review.assetId}:${review.targetDirection}`;
      if (mirrorReviewTargets.has(target)) {
        context.addIssue({
          code: "custom",
          path: ["mirrorReviews", index],
          message: `Duplicate mirror review target "${target}".`
        });
      }
      mirrorReviewTargets.add(target);
    });

    const sourcePrompt = project.sourcePrompt;
    if (sourcePrompt?.directionDecision === "retainFourDirectionRequirement") {
      if (sourcePrompt.requestedDirectionCount !== 4) {
        context.addIssue({
          code: "custom",
          path: ["sourcePrompt", "requestedDirectionCount"],
          message: "Retaining four directions requires an original 4-direction request."
        });
      }
      if (project.directionRequirement !== 4) {
        context.addIssue({
          code: "custom",
          path: ["directionRequirement"],
          message: "A retained 4-direction handoff must remain marked as four directions."
        });
      }
    }
    if (
      sourcePrompt?.directionDecision === "upgradeToEightDirectionMvp" &&
      (sourcePrompt.requestedDirectionCount !== 4 || project.directionRequirement !== 8)
    ) {
      context.addIssue({
        code: "custom",
        path: ["sourcePrompt", "directionDecision"],
        message: "An eight-direction MVP upgrade must originate at four and target eight directions."
      });
    }
    if (
      sourcePrompt?.directionDecision === "alreadyEightDirections" &&
      (sourcePrompt.requestedDirectionCount !== 8 || project.directionRequirement !== 8)
    ) {
      context.addIssue({
        code: "custom",
        path: ["sourcePrompt", "directionDecision"],
        message: "An already-eight-direction handoff must remain at eight directions."
      });
    }
  }
).readonly();

export function parseAnimationProject(input: unknown): AnimationProject {
  return AnimationProjectSchema.parse(input);
}

export type ProjectPartAssignment = z.infer<
  typeof ProjectPartAssignmentSchema
>;
export type AnimationClip = z.infer<typeof AnimationClipSchema>;
export type DirectionFrameOverride = z.infer<
  typeof DirectionFrameOverrideSchema
>;
export type DirectionMirrorReview = z.infer<
  typeof DirectionMirrorReviewSchema
>;
export type SourcePromptReference = z.infer<
  typeof SourcePromptReferenceSchema
>;
export type AnimationProject = z.infer<typeof AnimationProjectSchema>;
