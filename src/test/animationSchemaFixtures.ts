import type { z } from "zod";
import {
  AnimationPartAssetSchema,
  AnimationProjectBundleSchema,
  AnimationProjectSchema,
  CharacterKitSchema
} from "../schemas";

export const ANIMATION_FIXTURE_TIMESTAMP = "2026-09-04T12:00:00.000Z";

export type AnimationPartAssetInput = z.input<
  typeof AnimationPartAssetSchema
>;
export type AnimationProjectInput = z.input<typeof AnimationProjectSchema>;
export type CharacterKitInput = z.input<typeof CharacterKitSchema>;
export type AnimationProjectBundleInput = z.input<
  typeof AnimationProjectBundleSchema
>;

export function createAnimationPartAssetInput(
  overrides: Partial<AnimationPartAssetInput> = {}
): AnimationPartAssetInput {
  return {
    schemaVersion: 1,
    kind: "animationPartAsset",
    assetId: "part_head_south_001",
    blobId: "blob_head_south_001",
    label: "Kopf Süd",
    slot: "head",
    direction: "south",
    sourceSize: { width: 32, height: 40 },
    trimRect: { x: 2, y: 3, width: 28, height: 36 },
    anchors: { proximal: { x: 16, y: 30 } },
    mirrorPolicy: "inherit",
    createdAt: ANIMATION_FIXTURE_TIMESTAMP,
    updatedAt: ANIMATION_FIXTURE_TIMESTAMP,
    ...overrides
  };
}

export function createAnimationProjectInput(
  overrides: Partial<AnimationProjectInput> = {}
): AnimationProjectInput {
  return {
    schemaVersion: 1,
    kind: "animationProject",
    projectId: "project_guard_walk_001",
    name: "Waldwächter Walk",
    createdAt: ANIMATION_FIXTURE_TIMESTAMP,
    updatedAt: ANIMATION_FIXTURE_TIMESTAMP,
    rigTemplateId: "humanoid-80-v1",
    frameProfile: {
      frameSize: { width: 128, height: 128 },
      characterHeight: 80,
      footAnchor: { x: 64, y: 112 }
    },
    directionSourceMode: "fiveAuthoredPlusMirror",
    parts: [{ assetId: "part_head_south_001" }],
    clips: [
      {
        clipId: "clip_walk_001",
        templateId: "walk-8-v1",
        action: "walk",
        frameCount: 8,
        fps: 10,
        loop: true
      }
    ],
    overrides: [
      {
        clipId: "clip_walk_001",
        direction: "south",
        frameIndex: 2,
        partDeltas: {
          head: {
            offsetX: 1,
            offsetY: -1,
            rotationDelta: 0.05,
            scaleMultiplier: 1
          }
        }
      }
    ],
    sourcePrompt: {
      assetProfileId: "asset_guard_001",
      compatibilityKey: "prompt-profile-compatibility-key"
    },
    previewBlobId: "preview_guard_walk_001",
    ...overrides
  };
}

export function createCharacterKitInput(
  overrides: Partial<CharacterKitInput> = {}
): CharacterKitInput {
  return {
    schemaVersion: 1,
    kind: "characterKit",
    kitId: "kit_guard_001",
    name: "Waldwächter",
    description: "Modulares Production-Humanoid-Kit.",
    rigTemplateId: "humanoid-80-v1",
    rigCompatibilityKey: "humanoid-80-v1__frame-128x128__contracts-1-1-1",
    directionSourceMode: "fiveAuthoredPlusMirror",
    partAssetIds: ["part_head_south_001"],
    previewBlobId: "preview_guard_walk_001",
    createdAt: ANIMATION_FIXTURE_TIMESTAMP,
    updatedAt: ANIMATION_FIXTURE_TIMESTAMP,
    ...overrides
  };
}

export function createAnimationProjectBundleInput(
  overrides: Partial<AnimationProjectBundleInput> = {}
): AnimationProjectBundleInput {
  return {
    manifest: {
      application: "PixelForge Animation Studio",
      formatVersion: 1,
      kind: "animationProjectBundle",
      exportedAt: ANIMATION_FIXTURE_TIMESTAMP,
      projectFile: "project.json"
    },
    project: createAnimationProjectInput(),
    partAssets: [createAnimationPartAssetInput()],
    blobIds: ["blob_head_south_001", "preview_guard_walk_001"],
    ...overrides
  };
}
