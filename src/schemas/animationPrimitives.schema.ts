import { z } from "zod";
import { ANIMATION_EXPORT_APPLICATION_ID } from "../config";
import {
  ANIMATION_ACTION_IDS,
  DIRECTION_IDS,
  DIRECTION_SOURCE_MODES,
  JOINT_IDS,
  MAX_PROJECT_LAYER_OFFSET,
  MIN_PROJECT_LAYER_OFFSET,
  MIRROR_POLICIES,
  PART_SLOT_IDS,
  RIG_TEMPLATE_IDS
} from "../domain/animation";

export const ANIMATION_SCHEMA_VERSION = 1 as const;
export const ANIMATION_FORMAT_VERSION = 1 as const;

export const MAX_ANIMATION_SOURCE_FILE_BYTES = 16 * 1024 * 1024;
export const MAX_ANIMATION_SOURCE_DIMENSION = 2048;
export const MAX_ANIMATION_PARTS_PER_PROJECT = 512;
export const MAX_ANIMATION_CLIPS_PER_PROJECT = 16;
export const MAX_ANIMATION_FRAMES_PER_CLIP = 256;
export const MAX_ANIMATION_FPS = 240;
export const MAX_ANIMATION_OVERRIDES_PER_PROJECT = 10_000;
export const MAX_ANIMATION_BUNDLE_FILES = 2048;
export const MAX_ANIMATION_UNPACKED_BUNDLE_BYTES = 256 * 1024 * 1024;
export const MAX_ANIMATION_NAME_LENGTH = 120;
export const MAX_ANIMATION_DESCRIPTION_LENGTH = 2000;
export const MAX_ANIMATION_COMPATIBILITY_KEY_LENGTH = 500;

export const AnimationSchemaVersionSchema = z.literal(
  ANIMATION_SCHEMA_VERSION
);
export const AnimationFormatVersionSchema = z.literal(
  ANIMATION_FORMAT_VERSION
);
export const AnimationApplicationSchema = z.literal(
  ANIMATION_EXPORT_APPLICATION_ID
);

export const AnimationNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_ANIMATION_NAME_LENGTH);
export const AnimationDescriptionSchema = z
  .string()
  .trim()
  .max(MAX_ANIMATION_DESCRIPTION_LENGTH);
export const RigCompatibilityKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_ANIMATION_COMPATIBILITY_KEY_LENGTH);

export const FinitePixelCoordinateSchema = z.number().finite();
export const NonNegativePixelCoordinateSchema = FinitePixelCoordinateSchema
  .int()
  .min(0)
  .max(MAX_ANIMATION_SOURCE_DIMENSION);
export const PositivePixelDimensionSchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_ANIMATION_SOURCE_DIMENSION);

export const AnimationDirectionSchema = z.enum(DIRECTION_IDS);
export const AnimationDirectionSourceModeSchema = z.enum(
  DIRECTION_SOURCE_MODES
);
export const AnimationPartSlotSchema = z.enum(PART_SLOT_IDS);
export const AnimationJointIdSchema = z.enum(JOINT_IDS);
export const AnimationMirrorPolicySchema = z.enum(MIRROR_POLICIES);
export const AnimationRigTemplateIdSchema = z.enum(RIG_TEMPLATE_IDS);
export const AnimationActionIdSchema = z.enum(ANIMATION_ACTION_IDS);
export const AnimationAnchorStatusSchema = z.enum([
  "anchorsPending",
  "invalidAnchors",
  "ready"
]);

export const AnimationPointSchema = z
  .strictObject({
    x: FinitePixelCoordinateSchema,
    y: FinitePixelCoordinateSchema
  })
  .readonly();

export const AnimationSizeSchema = z
  .strictObject({
    width: PositivePixelDimensionSchema,
    height: PositivePixelDimensionSchema
  })
  .readonly();

export const AnimationTrimRectSchema = z
  .strictObject({
    x: NonNegativePixelCoordinateSchema,
    y: NonNegativePixelCoordinateSchema,
    width: PositivePixelDimensionSchema,
    height: PositivePixelDimensionSchema
  })
  .readonly();

export const AnimationFrameProfileSchema = z
  .strictObject({
    frameSize: AnimationSizeSchema,
    characterHeight: PositivePixelDimensionSchema,
    footAnchor: AnimationPointSchema
  })
  .superRefine((profile, context) => {
    if (profile.characterHeight > profile.frameSize.height) {
      context.addIssue({
        code: "custom",
        path: ["characterHeight"],
        message: "Character height must fit inside the frame height."
      });
    }

    if (
      profile.footAnchor.x < 0 ||
      profile.footAnchor.x >= profile.frameSize.width
    ) {
      context.addIssue({
        code: "custom",
        path: ["footAnchor", "x"],
        message: "Foot anchor x must be inside the frame."
      });
    }

    if (
      profile.footAnchor.y < 0 ||
      profile.footAnchor.y >= profile.frameSize.height
    ) {
      context.addIssue({
        code: "custom",
        path: ["footAnchor", "y"],
        message: "Foot anchor y must be inside the frame."
      });
    }
  })
  .readonly();

export const AnimationSourceAnchorsSchema = z
  .strictObject({
    proximal: AnimationPointSchema,
    distal: AnimationPointSchema.optional(),
    pivot: AnimationPointSchema.optional()
  })
  .readonly();

export const AnimationTransformDeltaSchema = z
  .strictObject({
    offsetX: FinitePixelCoordinateSchema,
    offsetY: FinitePixelCoordinateSchema,
    rotationDelta: z.number().finite(),
    scaleMultiplier: z.number().finite().positive()
  })
  .readonly();

export const MAX_PROJECT_PART_OFFSET = 32;
export const MAX_PROJECT_PART_ROTATION_DELTA = Math.PI / 2;
export const MIN_PROJECT_PART_SCALE_MULTIPLIER = 0.5;
export const MAX_PROJECT_PART_SCALE_MULTIPLIER = 1.5;

/** Narrow project-wide correction; frame overrides deliberately keep their own contract. */
export const AnimationProjectPartDeltaSchema = z
  .strictObject({
    offsetX: FinitePixelCoordinateSchema.min(-MAX_PROJECT_PART_OFFSET).max(
      MAX_PROJECT_PART_OFFSET
    ),
    offsetY: FinitePixelCoordinateSchema.min(-MAX_PROJECT_PART_OFFSET).max(
      MAX_PROJECT_PART_OFFSET
    ),
    rotationDelta: z
      .number()
      .finite()
      .min(-MAX_PROJECT_PART_ROTATION_DELTA)
      .max(MAX_PROJECT_PART_ROTATION_DELTA),
    scaleMultiplier: z
      .number()
      .finite()
      .min(MIN_PROJECT_PART_SCALE_MULTIPLIER)
      .max(MAX_PROJECT_PART_SCALE_MULTIPLIER)
  })
  .readonly();

export const AnimationProjectPartLayerOffsetSchema = z
  .number()
  .int()
  .min(MIN_PROJECT_LAYER_OFFSET)
  .max(MAX_PROJECT_LAYER_OFFSET);

export type ValidatedAnimationPoint = z.infer<typeof AnimationPointSchema>;
export type ValidatedAnimationSize = z.infer<typeof AnimationSizeSchema>;
export type ValidatedAnimationTrimRect = z.infer<
  typeof AnimationTrimRectSchema
>;
export type ValidatedAnimationFrameProfile = z.infer<
  typeof AnimationFrameProfileSchema
>;
export type ValidatedAnimationSourceAnchors = z.infer<
  typeof AnimationSourceAnchorsSchema
>;
export type ValidatedAnimationAnchorStatus = z.infer<
  typeof AnimationAnchorStatusSchema
>;
export type ValidatedAnimationTransformDelta = z.infer<
  typeof AnimationTransformDeltaSchema
>;
export type ValidatedAnimationProjectPartDelta = z.infer<
  typeof AnimationProjectPartDeltaSchema
>;
export type ValidatedAnimationProjectPartLayerOffset = z.infer<
  typeof AnimationProjectPartLayerOffsetSchema
>;
