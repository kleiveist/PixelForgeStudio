import { z } from "zod";
import { IsoDateTimeSchema, StableIdSchema } from "./common.schema";
import {
  AnimationDescriptionSchema,
  AnimationDirectionSourceModeSchema,
  AnimationMirrorPolicySchema,
  AnimationNameSchema,
  AnimationRigTemplateIdSchema,
  AnimationSchemaVersionSchema,
  MAX_ANIMATION_PARTS_PER_PROJECT,
  RigCompatibilityKeySchema
} from "./animationPrimitives.schema";

export const CharacterKitSchema = z
  .strictObject({
    schemaVersion: AnimationSchemaVersionSchema,
    kind: z.literal("characterKit"),
    kitId: StableIdSchema,
    name: AnimationNameSchema,
    description: AnimationDescriptionSchema,
    rigTemplateId: AnimationRigTemplateIdSchema,
    rigCompatibilityKey: RigCompatibilityKeySchema,
    directionSourceMode: AnimationDirectionSourceModeSchema,
    mirrorPolicy: AnimationMirrorPolicySchema.default("allow"),
    partAssetIds: z
      .array(StableIdSchema)
      .max(MAX_ANIMATION_PARTS_PER_PROJECT)
      .readonly(),
    previewBlobId: StableIdSchema.optional(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema
  })
  .superRefine((kit, context) => {
    const partAssetIds = new Set<string>();
    kit.partAssetIds.forEach((assetId, index) => {
      if (partAssetIds.has(assetId)) {
        context.addIssue({
          code: "custom",
          path: ["partAssetIds", index],
          message: `Duplicate Character Kit part asset id "${assetId}".`
        });
      }
      partAssetIds.add(assetId);
    });
  })
  .readonly();

export function parseCharacterKit(input: unknown): CharacterKit {
  return CharacterKitSchema.parse(input);
}

export type CharacterKit = z.infer<typeof CharacterKitSchema>;
