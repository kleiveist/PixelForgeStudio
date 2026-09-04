import { z } from "zod";
import { IsoDateTimeSchema, StableIdSchema } from "./common.schema";
import {
  AnimationDirectionSchema,
  AnimationJointIdSchema,
  AnimationMirrorPolicySchema,
  AnimationNameSchema,
  AnimationPartSlotSchema,
  AnimationSchemaVersionSchema,
  AnimationSizeSchema,
  AnimationSourceAnchorsSchema,
  AnimationTrimRectSchema
} from "./animationPrimitives.schema";

function addPointOutsideSourceIssue(
  point: Readonly<{ x: number; y: number }>,
  sourceSize: Readonly<{ width: number; height: number }>,
  path: readonly (string | number)[],
  context: z.RefinementCtx
): void {
  if (
    point.x < 0 ||
    point.x >= sourceSize.width ||
    point.y < 0 ||
    point.y >= sourceSize.height
  ) {
    context.addIssue({
      code: "custom",
      path: [...path],
      message: "Source anchor must be inside the original source image."
    });
  }
}

export const AnimationPartAssetSchema = z
  .strictObject({
    schemaVersion: AnimationSchemaVersionSchema,
    kind: z.literal("animationPartAsset"),
    assetId: StableIdSchema,
    blobId: StableIdSchema,
    label: AnimationNameSchema,
    slot: AnimationPartSlotSchema,
    direction: AnimationDirectionSchema,
    sourceSize: AnimationSizeSchema,
    trimRect: AnimationTrimRectSchema,
    anchors: AnimationSourceAnchorsSchema,
    mirrorPolicy: AnimationMirrorPolicySchema,
    attachmentJointId: AnimationJointIdSchema.optional(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema
  })
  .superRefine((asset, context) => {
    if (asset.trimRect.x + asset.trimRect.width > asset.sourceSize.width) {
      context.addIssue({
        code: "custom",
        path: ["trimRect", "width"],
        message: "Trim rectangle must fit inside the source width."
      });
    }

    if (asset.trimRect.y + asset.trimRect.height > asset.sourceSize.height) {
      context.addIssue({
        code: "custom",
        path: ["trimRect", "height"],
        message: "Trim rectangle must fit inside the source height."
      });
    }

    addPointOutsideSourceIssue(
      asset.anchors.proximal,
      asset.sourceSize,
      ["anchors", "proximal"],
      context
    );

    if (asset.anchors.distal) {
      addPointOutsideSourceIssue(
        asset.anchors.distal,
        asset.sourceSize,
        ["anchors", "distal"],
        context
      );
    }

    if (asset.anchors.pivot) {
      addPointOutsideSourceIssue(
        asset.anchors.pivot,
        asset.sourceSize,
        ["anchors", "pivot"],
        context
      );
    }
  })
  .readonly();

export function parseAnimationPartAsset(input: unknown): AnimationPartAsset {
  return AnimationPartAssetSchema.parse(input);
}

export type AnimationPartAsset = z.infer<typeof AnimationPartAssetSchema>;
