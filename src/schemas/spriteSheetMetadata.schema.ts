import { z } from "zod";
import { DIRECTION_IDS } from "../domain/animation";
import { StableIdSchema } from "./common.schema";
import {
  AnimationActionIdSchema,
  AnimationApplicationSchema,
  AnimationDirectionSchema,
  AnimationFormatVersionSchema,
  AnimationNameSchema,
  AnimationPointSchema
} from "./animationPrimitives.schema";

const SheetDimensionSchema = z.number().int().positive().max(65_535);

export const SpriteSheetFrameRegionSchema = z
  .strictObject({
    index: z.number().int().min(0).max(255),
    x: z.number().int().nonnegative().max(65_535),
    y: z.number().int().nonnegative().max(65_535),
    width: SheetDimensionSchema,
    height: SheetDimensionSchema
  })
  .readonly();

export const SpriteSheetAnimationSchema = z
  .strictObject({
    name: z.string().regex(/^walk_[A-Za-z]+$/),
    direction: AnimationDirectionSchema,
    frames: z.array(SpriteSheetFrameRegionSchema).min(1).max(256).readonly()
  })
  .readonly();

const SpriteSheetMetadataObjectSchema = z.strictObject({
  application: AnimationApplicationSchema,
  formatVersion: AnimationFormatVersionSchema,
  kind: z.literal("spriteSheetMetadata"),
  projectId: StableIdSchema,
  projectName: AnimationNameSchema,
  clipId: StableIdSchema,
  action: AnimationActionIdSchema,
  fps: z.number().finite().positive().max(240),
  loop: z.boolean(),
  frameWidth: SheetDimensionSchema,
  frameHeight: SheetDimensionSchema,
  sheetWidth: SheetDimensionSchema,
  sheetHeight: SheetDimensionSchema,
  columns: z.number().int().positive().max(256),
  rows: z.number().int().positive().max(DIRECTION_IDS.length),
  margin: z.number().int().nonnegative().max(2048),
  spacing: z.number().int().nonnegative().max(2048),
  footAnchor: AnimationPointSchema,
  directions: z.array(AnimationDirectionSchema).length(DIRECTION_IDS.length).readonly(),
  animations: z
    .array(SpriteSheetAnimationSchema)
    .length(DIRECTION_IDS.length)
    .readonly()
});

export const SpriteSheetMetadataSchema = SpriteSheetMetadataObjectSchema
  .superRefine((metadata, context) => {
    if (metadata.columns !== 8 || metadata.rows !== DIRECTION_IDS.length) {
      context.addIssue({
        code: "custom",
        path: ["columns"],
        message: "Walk metadata V1 requires an 8x8 direction/frame layout."
      });
    }
    if (
      metadata.sheetWidth !==
        metadata.margin * 2 + metadata.columns * metadata.frameWidth +
          (metadata.columns - 1) * metadata.spacing ||
      metadata.sheetHeight !==
        metadata.margin * 2 + metadata.rows * metadata.frameHeight +
          (metadata.rows - 1) * metadata.spacing
    ) {
      context.addIssue({
        code: "custom",
        path: ["sheetWidth"],
        message: "Sheet dimensions do not match frame geometry."
      });
    }
    DIRECTION_IDS.forEach((direction, row) => {
      if (metadata.directions[row] !== direction) {
        context.addIssue({
          code: "custom",
          path: ["directions", row],
          message: `Direction row ${row} must be ${direction}.`
        });
      }
      const animation = metadata.animations[row];
      if (!animation || animation.direction !== direction) {
        context.addIssue({
          code: "custom",
          path: ["animations", row, "direction"],
          message: `Animation row ${row} must target ${direction}.`
        });
        return;
      }
      if (animation.name !== `walk_${direction}` || animation.frames.length !== 8) {
        context.addIssue({
          code: "custom",
          path: ["animations", row],
          message: `Animation ${direction} must contain walk_${direction} and eight frames.`
        });
      }
      animation.frames.forEach((frame, column) => {
        const expectedX =
          metadata.margin + column * (metadata.frameWidth + metadata.spacing);
        const expectedY =
          metadata.margin + row * (metadata.frameHeight + metadata.spacing);
        if (
          frame.index !== column ||
          frame.x !== expectedX ||
          frame.y !== expectedY ||
          frame.width !== metadata.frameWidth ||
          frame.height !== metadata.frameHeight
        ) {
          context.addIssue({
            code: "custom",
            path: ["animations", row, "frames", column],
            message: "Frame region does not match its canonical sheet cell."
          });
        }
      });
    });
  })
  .readonly();

export function parseSpriteSheetMetadata(input: unknown): SpriteSheetMetadata {
  return SpriteSheetMetadataSchema.parse(input);
}

export type SpriteSheetFrameRegion = z.infer<typeof SpriteSheetFrameRegionSchema>;
export type SpriteSheetAnimation = z.infer<typeof SpriteSheetAnimationSchema>;
export type SpriteSheetMetadata = z.infer<typeof SpriteSheetMetadataSchema>;
