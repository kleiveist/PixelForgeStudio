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

const CharacterKitCoverageCountSchema = z.number().int().min(0).max(512);

export const CharacterKitCoverageSchema = z
  .strictObject({
    requiredCellCount: CharacterKitCoverageCountSchema,
    resolvedRequiredCellCount: CharacterKitCoverageCountSchema,
    authoredRequiredCellCount: CharacterKitCoverageCountSchema,
    mirroredRequiredCellCount: CharacterKitCoverageCountSchema,
    anchorsIncompleteCount: CharacterKitCoverageCountSchema,
    mirrorReviewCount: CharacterKitCoverageCountSchema,
    mirrorForbiddenCount: CharacterKitCoverageCountSchema,
    productionReady: z.boolean()
  })
  .superRefine((coverage, context) => {
    if (coverage.resolvedRequiredCellCount > coverage.requiredCellCount) {
      context.addIssue({
        code: "custom",
        path: ["resolvedRequiredCellCount"],
        message: "Resolved required cells cannot exceed all required cells."
      });
    }
    if (
      coverage.authoredRequiredCellCount + coverage.mirroredRequiredCellCount !==
      coverage.resolvedRequiredCellCount
    ) {
      context.addIssue({
        code: "custom",
        path: ["resolvedRequiredCellCount"],
        message: "Resolved coverage must equal authored plus mirrored coverage."
      });
    }
    if (
      coverage.productionReady &&
      (coverage.resolvedRequiredCellCount !== coverage.requiredCellCount ||
        coverage.anchorsIncompleteCount > 0 ||
        coverage.mirrorReviewCount > 0 ||
        coverage.mirrorForbiddenCount > 0)
    ) {
      context.addIssue({
        code: "custom",
        path: ["productionReady"],
        message: "Production-ready coverage cannot contain unresolved blockers."
      });
    }
  })
  .readonly();

export const EMPTY_CHARACTER_KIT_COVERAGE = Object.freeze({
  requiredCellCount: 0,
  resolvedRequiredCellCount: 0,
  authoredRequiredCellCount: 0,
  mirroredRequiredCellCount: 0,
  anchorsIncompleteCount: 0,
  mirrorReviewCount: 0,
  mirrorForbiddenCount: 0,
  productionReady: false
});

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
    coverage: CharacterKitCoverageSchema.default(EMPTY_CHARACTER_KIT_COVERAGE),
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
export type CharacterKitCoverage = z.infer<typeof CharacterKitCoverageSchema>;
