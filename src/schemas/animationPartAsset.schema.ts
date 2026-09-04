import { z } from "zod";
import {
  HUMANOID_80_RIG_TEMPLATE,
  findSlotBinding,
  isRequiredPartSlot,
  validateSourceAnchors
} from "../domain/animation";
import { IsoDateTimeSchema, StableIdSchema } from "./common.schema";
import {
  AnimationDirectionSchema,
  AnimationAnchorStatusSchema,
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
    anchorStatus: AnimationAnchorStatusSchema.default("ready"),
    anchors: AnimationSourceAnchorsSchema.optional(),
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

    if (asset.anchorStatus === "ready" && !asset.anchors) {
      context.addIssue({
        code: "custom",
        path: ["anchors"],
        message: "Ready part assets require source anchors."
      });
    }
    if (asset.anchorStatus === "anchorsPending" && asset.anchors) {
      context.addIssue({
        code: "custom",
        path: ["anchors"],
        message: "Anchor-pending part assets must not contain guessed anchors."
      });
    }
    if (asset.anchorStatus === "invalidAnchors" && !asset.anchors) {
      context.addIssue({
        code: "custom",
        path: ["anchors"],
        message: "Invalid-anchor drafts require saved source coordinates."
      });
    }

    if (
      asset.anchorStatus === "ready" &&
      asset.anchors &&
      isRequiredPartSlot(asset.slot)
    ) {
      const binding = findSlotBinding(HUMANOID_80_RIG_TEMPLATE, asset.slot);
      if (binding) {
        const validation = validateSourceAnchors(
          binding,
          asset.anchors,
          asset.sourceSize
        );
        if (!validation.valid) {
          for (const issue of validation.issues) {
            context.addIssue({
              code: "custom",
              path: ["anchors", ...issue.path],
              message: issue.message
            });
          }
        }
      }
    }

    if (!asset.anchors) return;

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
