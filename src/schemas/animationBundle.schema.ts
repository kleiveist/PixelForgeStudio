import { z } from "zod";
import { IsoDateTimeSchema, StableIdSchema } from "./common.schema";
import {
  AnimationApplicationSchema,
  AnimationFormatVersionSchema,
  MAX_ANIMATION_BUNDLE_FILES,
  MAX_ANIMATION_PARTS_PER_PROJECT
} from "./animationPrimitives.schema";
import {
  AnimationPartAssetSchema,
  type AnimationPartAsset
} from "./animationPartAsset.schema";
import {
  AnimationProjectSchema
} from "./animationProject.schema";

export const AnimationProjectBundleManifestSchema = z
  .strictObject({
    application: AnimationApplicationSchema,
    formatVersion: AnimationFormatVersionSchema,
    kind: z.literal("animationProjectBundle"),
    exportedAt: IsoDateTimeSchema,
    projectFile: z.literal("project.json")
  })
  .readonly();

const AnimationProjectBundleObjectSchema = z.strictObject({
  manifest: AnimationProjectBundleManifestSchema,
  project: AnimationProjectSchema,
  partAssets: z
    .array(AnimationPartAssetSchema)
    .max(MAX_ANIMATION_PARTS_PER_PROJECT)
    .readonly(),
  blobIds: z
    .array(StableIdSchema)
    .max(MAX_ANIMATION_BUNDLE_FILES - 2)
    .readonly()
});

export const AnimationProjectBundleSchema =
  AnimationProjectBundleObjectSchema.superRefine((bundle, context) => {
    const partAssetsById = new Map<
      AnimationPartAsset["assetId"],
      AnimationPartAsset
    >();
    bundle.partAssets.forEach((asset, index) => {
      if (partAssetsById.has(asset.assetId)) {
        context.addIssue({
          code: "custom",
          path: ["partAssets", index, "assetId"],
          message: `Duplicate bundle part asset id "${asset.assetId}".`
        });
      }
      partAssetsById.set(asset.assetId, asset);
    });

    const blobIds = new Set<string>();
    bundle.blobIds.forEach((blobId, index) => {
      if (blobIds.has(blobId)) {
        context.addIssue({
          code: "custom",
          path: ["blobIds", index],
          message: `Duplicate bundle blob id "${blobId}".`
        });
      }
      blobIds.add(blobId);
    });

    bundle.project.parts.forEach((part, index) => {
      if (!partAssetsById.has(part.assetId)) {
        context.addIssue({
          code: "custom",
          path: ["project", "parts", index, "assetId"],
          message: `Bundle is missing part asset "${part.assetId}".`
        });
      }
    });

    bundle.partAssets.forEach((asset, index) => {
      if (!blobIds.has(asset.blobId)) {
        context.addIssue({
          code: "custom",
          path: ["partAssets", index, "blobId"],
          message: `Bundle is missing image blob "${asset.blobId}".`
        });
      }
    });

    if (
      bundle.project.previewBlobId !== undefined &&
      !blobIds.has(bundle.project.previewBlobId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["project", "previewBlobId"],
        message: `Bundle is missing preview blob "${bundle.project.previewBlobId}".`
      });
    }

    const representedFileCount =
      2 + bundle.partAssets.length + bundle.blobIds.length;
    if (representedFileCount > MAX_ANIMATION_BUNDLE_FILES) {
      context.addIssue({
        code: "custom",
        path: [],
        message: `Bundle graph exceeds ${MAX_ANIMATION_BUNDLE_FILES} represented files.`
      });
    }
  }).readonly();

export function parseAnimationProjectBundleManifest(
  input: unknown
): AnimationProjectBundleManifest {
  return AnimationProjectBundleManifestSchema.parse(input);
}

export function parseAnimationProjectBundle(
  input: unknown
): AnimationProjectBundle {
  return AnimationProjectBundleSchema.parse(input);
}

export type AnimationProjectBundleManifest = z.infer<
  typeof AnimationProjectBundleManifestSchema
>;
export type AnimationProjectBundle = z.infer<
  typeof AnimationProjectBundleSchema
>;
