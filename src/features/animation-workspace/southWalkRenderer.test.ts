import { describe, expect, it } from "vitest";
import {
  HUMANOID_80_RIG_TEMPLATE,
  HUMANOID_WALK_CLIP_ID,
  REQUIRED_PART_SLOT_IDS,
  findSlotBinding,
  type RequiredPartSlot,
  type RgbaImage
} from "../../domain/animation";
import {
  parseAnimationPartAsset,
  parseAnimationProject,
  type AnimationPartAsset
} from "../../schemas";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../../test/animationSchemaFixtures";
import type { DecodedPartSource } from "./neutralPoseRenderer";
import { generateSouthWalkFrames } from "./southWalkRenderer";

interface SyntheticSouthFixture {
  readonly project: ReturnType<typeof parseAnimationProject>;
  readonly assets: readonly AnimationPartAsset[];
  readonly decoded: readonly DecodedPartSource[];
}

function syntheticImage(slotIndex: number): RgbaImage {
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
  return { width, height, pixels };
}

function createSyntheticSouthFixture(): SyntheticSouthFixture {
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
  return {
    project,
    assets,
    decoded: assets.map((asset, index) => ({
      assetId: asset.assetId,
      image: syntheticImage(index)
    }))
  };
}

describe("South walk frame generation", () => {
  it("renders eight deterministic frames from a neutral synthetic humanoid", () => {
    const fixture = createSyntheticSouthFixture();
    const first = generateSouthWalkFrames(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      fixture.assets,
      fixture.decoded
    );
    const second = generateSouthWalkFrames(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      fixture.assets,
      fixture.decoded
    );

    expect(first.status).toBe("ok");
    expect(second.status).toBe("ok");
    if (first.status !== "ok" || second.status !== "ok") return;
    expect(first.frames).toHaveLength(8);
    expect(first.frames.every((frame) => frame.width === 128 && frame.height === 128)).toBe(true);
    expect(first.frames.every((frame) => frame.renderedPartIds.length === 15)).toBe(true);
    expect(first.frames[0]!.pixels).not.toEqual(first.frames[4]!.pixels);
    first.frames.forEach((frame, index) => {
      expect(frame.pixels).toEqual(second.frames[index]!.pixels);
    });
  });

  it("collects every missing or unfinished required South source", () => {
    const fixture = createSyntheticSouthFixture();
    const pendingSource = fixture.assets[0]!;
    const pending = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        assetId: pendingSource.assetId,
        blobId: pendingSource.blobId,
        label: pendingSource.label,
        slot: pendingSource.slot,
        direction: "south",
        sourceSize: pendingSource.sourceSize,
        trimRect: pendingSource.trimRect,
        anchorStatus: "anchorsPending",
        anchors: undefined
      })
    );
    const missingSlots = new Set<RequiredPartSlot>([
      "torso",
      "pelvis"
    ]);
    const assets = fixture.assets
      .filter((asset) => !missingSlots.has(asset.slot as RequiredPartSlot))
      .map((asset) => (asset.assetId === pending.assetId ? pending : asset));
    const result = generateSouthWalkFrames(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      assets,
      fixture.decoded
    );

    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") return;
    expect(result.frames).toEqual([]);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "anchorsPending", slot: "head" }),
        expect.objectContaining({ code: "missingPart", slot: "torso" }),
        expect.objectContaining({ code: "missingPart", slot: "pelvis" })
      ])
    );
  });

  it("blocks generation when the canonical clip metadata is absent", () => {
    const fixture = createSyntheticSouthFixture();
    const project = parseAnimationProject({
      ...fixture.project,
      clips: []
    });
    const result = generateSouthWalkFrames(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      fixture.assets,
      fixture.decoded
    );

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.issues[0]?.code).toBe("missingClip");
    }
  });

  it("turns invalid bone geometry and renderer failures into production errors", () => {
    const fixture = createSyntheticSouthFixture();
    const south = HUMANOID_80_RIG_TEMPLATE.directions.find(
      ({ direction }) => direction === "south"
    )!;
    const invalidTemplate = {
      ...HUMANOID_80_RIG_TEMPLATE,
      directions: [
        {
          ...south,
          joints: {
            ...south.joints,
            "knee.left": {
              id: "knee.left" as const,
              position: south.joints["hip.left"].position
            }
          }
        },
        ...HUMANOID_80_RIG_TEMPLATE.directions.filter(
          ({ direction }) => direction !== "south"
        )
      ]
    };
    const invalidRig = generateSouthWalkFrames(
      fixture.project,
      invalidTemplate,
      fixture.assets,
      fixture.decoded
    );
    expect(invalidRig.status).toBe("invalid");
    if (invalidRig.status === "invalid") {
      expect(invalidRig.issues).toContainEqual(
        expect.objectContaining({ code: "invalidBoneLength" })
      );
    }

    const head = fixture.assets[0]!;
    const outsideHead = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        assetId: head.assetId,
        blobId: head.blobId,
        label: head.label,
        slot: "head",
        direction: "south",
        sourceSize: { width: 100, height: 100 },
        trimRect: { x: 0, y: 0, width: 2, height: 2 },
        anchors: { proximal: { x: 99, y: 99 } }
      })
    );
    const outsideAssets = fixture.assets.map((asset) =>
      asset.assetId === head.assetId ? outsideHead : asset
    );
    const outsidePixels = new Uint8ClampedArray(100 * 100 * 4);
    outsidePixels.set([255, 255, 255, 255], 0);
    const outsideDecoded = fixture.decoded.map((source) =>
      source.assetId === head.assetId
        ? {
            assetId: source.assetId,
            image: { width: 100, height: 100, pixels: outsidePixels }
          }
        : source
    );
    const renderFailure = generateSouthWalkFrames(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      outsideAssets,
      outsideDecoded
    );
    expect(renderFailure.status).toBe("invalid");
    if (renderFailure.status === "invalid") {
      expect(renderFailure.issues).toContainEqual(
        expect.objectContaining({ code: "renderError" })
      );
    }
  });
});
