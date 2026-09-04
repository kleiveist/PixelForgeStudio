import {
  HUMANOID_80_RIG_TEMPLATE,
  HUMANOID_WALK_CLIP_ID,
  REQUIRED_PART_SLOT_IDS,
  findSlotBinding,
  type RgbaImage
} from "../domain/animation";
import {
  parseAnimationPartAsset,
  parseAnimationProject,
  type AnimationPartAsset,
  type AnimationProject
} from "../schemas";
import type { DecodedPartSource } from "../features/animation-workspace";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "./animationSchemaFixtures";

export interface SyntheticSouthWalkFixture {
  readonly project: AnimationProject;
  readonly assets: readonly AnimationPartAsset[];
  readonly decoded: readonly DecodedPartSource[];
}

export function createSyntheticWalkPartImage(slotIndex: number): RgbaImage {
  const width = 5;
  const height = 5;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    pixels[offset] = (slotIndex * 37 + 40) % 256;
    pixels[offset + 1] = (slotIndex * 61 + 80) % 256;
    pixels[offset + 2] = (slotIndex * 83 + 120) % 256;
    pixels[offset + 3] = 255;
  }
  return Object.freeze({ width, height, pixels });
}

export function createSyntheticSouthWalkFixture(): SyntheticSouthWalkFixture {
  const assets = REQUIRED_PART_SLOT_IDS.map((slot, slotIndex) => {
    const binding = findSlotBinding(HUMANOID_80_RIG_TEMPLATE, slot);
    if (!binding) throw new Error(`Missing fixture binding for ${slot}.`);
    return parseAnimationPartAsset(
      createAnimationPartAssetInput({
        assetId: `part_walk_south_${slotIndex}`,
        blobId: `blob_walk_south_${slotIndex}`,
        label: `Synthetic ${slot}`,
        slot,
        direction: "south",
        sourceSize: { width: 5, height: 5 },
        trimRect: { x: 0, y: 0, width: 5, height: 5 },
        anchors: {
          proximal: { x: 2, y: 0 },
          ...(binding.sourceAnchorRequirement === "twoPoint"
            ? { distal: { x: 2, y: 4 } }
            : {})
        }
      })
    );
  });
  const project = parseAnimationProject(
    createAnimationProjectInput({
      directionSourceMode: "singleDirectionPrototype",
      parts: assets.map(({ assetId }) => ({ assetId })),
      clips: [
        {
          clipId: "clip_walk_south_001",
          templateId: HUMANOID_WALK_CLIP_ID,
          action: "walk",
          frameCount: 8,
          fps: 10,
          loop: true
        }
      ],
      overrides: []
    })
  );
  return Object.freeze({
    project,
    assets: Object.freeze(assets),
    decoded: Object.freeze(
      assets.map((asset, index) =>
        Object.freeze({
          assetId: asset.assetId,
          image: createSyntheticWalkPartImage(index)
        })
      )
    )
  });
}
