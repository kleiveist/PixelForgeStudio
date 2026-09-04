import { z } from "zod";
import {
  DIRECTION_SOURCE_MODES,
  HUMANOID_80_FRAME_PROFILE,
  HUMANOID_80_RIG_TEMPLATE_ID
} from "../../domain/animation";
import {
  AnimationNameSchema,
  MAX_ANIMATION_FPS,
  NonNegativePixelCoordinateSchema,
  PositivePixelDimensionSchema
} from "../../schemas";
import type { CreateAnimationProjectDefinition } from "../../store/animation";

export const AnimationProjectCreationSchema = z
  .strictObject({
    name: AnimationNameSchema,
    rigTemplateId: z.literal(HUMANOID_80_RIG_TEMPLATE_ID),
    frameWidth: PositivePixelDimensionSchema,
    frameHeight: PositivePixelDimensionSchema,
    characterHeight: PositivePixelDimensionSchema,
    footAnchorX: NonNegativePixelCoordinateSchema,
    footAnchorY: NonNegativePixelCoordinateSchema,
    directionSourceMode: z.enum(DIRECTION_SOURCE_MODES),
    walkEnabled: z.boolean(),
    walkFrameCount: z.number().int().min(8).max(8),
    walkFps: z.number().finite().positive().max(MAX_ANIMATION_FPS)
  })
  .superRefine((values, context) => {
    if (values.characterHeight > values.frameHeight) {
      context.addIssue({
        code: "custom",
        path: ["characterHeight"],
        message: "Die Figurenhöhe muss in die Framehöhe passen."
      });
    }
    if (values.footAnchorX >= values.frameWidth) {
      context.addIssue({
        code: "custom",
        path: ["footAnchorX"],
        message: "Der Fußanker X muss innerhalb des Frames liegen."
      });
    }
    if (values.footAnchorY >= values.frameHeight) {
      context.addIssue({
        code: "custom",
        path: ["footAnchorY"],
        message: "Der Fußanker Y muss innerhalb des Frames liegen."
      });
    }
  });

export const RenameAnimationProjectSchema = z.strictObject({
  name: AnimationNameSchema
});

export type AnimationProjectCreationValues = z.infer<
  typeof AnimationProjectCreationSchema
>;
export type RenameAnimationProjectValues = z.infer<
  typeof RenameAnimationProjectSchema
>;

export const DEFAULT_ANIMATION_PROJECT_CREATION_VALUES: AnimationProjectCreationValues =
  Object.freeze({
    name: "",
    rigTemplateId: HUMANOID_80_RIG_TEMPLATE_ID,
    frameWidth: HUMANOID_80_FRAME_PROFILE.frameSize.width,
    frameHeight: HUMANOID_80_FRAME_PROFILE.frameSize.height,
    characterHeight: HUMANOID_80_FRAME_PROFILE.characterHeight,
    footAnchorX: HUMANOID_80_FRAME_PROFILE.footAnchor.x,
    footAnchorY: HUMANOID_80_FRAME_PROFILE.footAnchor.y,
    directionSourceMode: "fiveAuthoredPlusMirror",
    walkEnabled: true,
    walkFrameCount: 8,
    walkFps: 10
  });

export function toCreateAnimationProjectDefinition(
  values: AnimationProjectCreationValues
): CreateAnimationProjectDefinition {
  return Object.freeze({
    name: values.name,
    frameProfile: Object.freeze({
      frameSize: Object.freeze({
        width: values.frameWidth,
        height: values.frameHeight
      }),
      characterHeight: values.characterHeight,
      footAnchor: Object.freeze({
        x: values.footAnchorX,
        y: values.footAnchorY
      })
    }),
    directionSourceMode: values.directionSourceMode,
    walk: Object.freeze({
      enabled: values.walkEnabled,
      frameCount: values.walkFrameCount,
      fps: values.walkFps
    })
  });
}
