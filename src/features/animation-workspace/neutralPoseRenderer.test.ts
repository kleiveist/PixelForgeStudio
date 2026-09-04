import { describe, expect, it } from "vitest";
import {
  HUMANOID_80_RIG_TEMPLATE,
  applyTransform,
  renderFrame
} from "../../domain/animation";
import {
  parseAnimationPartAsset,
  parseAnimationProject
} from "../../schemas";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../../test/animationSchemaFixtures";
import {
  placementToRasterTransform,
  prepareNeutralPoseParts
} from "./neutralPoseRenderer";

function sourceWithAnchorPixel() {
  const pixels = new Uint8ClampedArray(32 * 40 * 4);
  const offset = (30 * 32 + 16) * 4;
  pixels.set([255, 0, 0, 255], offset);
  return { width: 32, height: 40, pixels };
}

describe("neutral pose renderer preparation", () => {
  it("converts integer-centre placement into half-pixel raster coordinates", () => {
    const transform = placementToRasterTransform({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 10,
      f: 20
    });

    expect(applyTransform(transform, { x: 0.5, y: 0.5 })).toEqual({
      x: 10.5,
      y: 20.5
    });
  });

  it("crops and places a ready neutral-pose part without mutating its source", () => {
    const project = parseAnimationProject(createAnimationProjectInput({
      parts: [{ assetId: "part_head_south_001" }],
      overrides: []
    }));
    const asset = parseAnimationPartAsset(createAnimationPartAssetInput());
    const source = sourceWithAnchorPixel();
    const before = [...source.pixels];
    const prepared = prepareNeutralPoseParts(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      "south",
      [asset],
      [{ assetId: asset.assetId, image: source }]
    );
    const frame = renderFrame(project.frameProfile.frameSize, prepared.parts);
    const offset = (44 * frame.width + 64) * 4;

    expect(prepared.issues).toEqual([]);
    expect(prepared.parts).toHaveLength(1);
    expect([...frame.pixels.slice(offset, offset + 4)]).toEqual([
      255,
      0,
      0,
      255
    ]);
    expect([...source.pixels]).toEqual(before);
  });

  it("mirrors source pixels at render time for West and keeps source metadata unchanged", () => {
    const asset = parseAnimationPartAsset(createAnimationPartAssetInput({
      assetId: "part_head_east_001",
      blobId: "blob_head_east_001",
      label: "Kopf Ost",
      direction: "east",
      sourceSize: { width: 2, height: 1 },
      trimRect: { x: 0, y: 0, width: 2, height: 1 },
      anchors: { proximal: { x: 0, y: 0 } }
    }));
    const project = parseAnimationProject(createAnimationProjectInput({
      parts: [{
        assetId: asset.assetId,
        transformDelta: {
          offsetX: 3,
          offsetY: 1,
          rotationDelta: 0.2,
          scaleMultiplier: 1
        }
      }],
      overrides: []
    }));
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 0, 255, 255
    ]);
    const metadataBefore = JSON.stringify(asset);
    const prepared = prepareNeutralPoseParts(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      "west",
      [asset],
      [{ assetId: asset.assetId, image: { width: 2, height: 1, pixels } }]
    );

    expect(prepared.parts).toHaveLength(1);
    expect([...prepared.parts[0]!.source.pixels]).toEqual([
      0, 0, 255, 255,
      255, 0, 0, 255
    ]);
    expect(JSON.stringify(asset)).toBe(metadataBefore);
    expect([...pixels]).toEqual([
      255, 0, 0, 255,
      0, 0, 255, 255
    ]);
  });

  it("reports pending anchors and decoded size mismatches while projected rigs remain available", () => {
    const project = parseAnimationProject(createAnimationProjectInput({
      parts: [{ assetId: "part_head_south_001" }],
      overrides: []
    }));
    const pending = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        anchorStatus: "anchorsPending",
        anchors: undefined
      })
    );
    const unavailable = prepareNeutralPoseParts(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      "west",
      [pending],
      []
    );
    const pendingResult = prepareNeutralPoseParts(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      "south",
      [pending],
      []
    );
    const ready = parseAnimationPartAsset(createAnimationPartAssetInput());
    const mismatch = prepareNeutralPoseParts(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      "south",
      [ready],
      [{ assetId: ready.assetId, image: { width: 1, height: 1, pixels: new Uint8ClampedArray(4) } }]
    );

    expect(unavailable.parts).toEqual([]);
    expect(unavailable.issues).toEqual([]);
    expect(pendingResult.issues[0]?.code).toBe("sourceNotReady");
    expect(mismatch.issues[0]?.code).toBe("decodedDimensionsMismatch");
  });

  it("places fixed equipment at its default attachment joint", () => {
    const weapon = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        assetId: "part_weapon_left_south_001",
        blobId: "blob_weapon_left_south_001",
        label: "Linke Waffe",
        slot: "weapon.left",
        sourceSize: { width: 1, height: 1 },
        trimRect: { x: 0, y: 0, width: 1, height: 1 },
        anchors: { proximal: { x: 0, y: 0 } }
      })
    );
    const project = parseAnimationProject(
      createAnimationProjectInput({
        parts: [{ assetId: weapon.assetId }],
        overrides: []
      })
    );
    const prepared = prepareNeutralPoseParts(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      "south",
      [weapon],
      [{
        assetId: weapon.assetId,
        image: {
          width: 1,
          height: 1,
          pixels: new Uint8ClampedArray([40, 210, 90, 255])
        }
      }]
    );
    const frame = renderFrame(project.frameProfile.frameSize, prepared.parts);
    const handPixel = (86 * frame.width + 47) * 4;

    expect(prepared.issues).toEqual([]);
    expect([...frame.pixels.slice(handPixel, handPixel + 4)]).toEqual([
      40,
      210,
      90,
      255
    ]);
  });

  it("orders attached free accessories before rendering and rejects a missing attachment", () => {
    const createAccessory = (
      index: 1 | 2,
      color: readonly [number, number, number, number],
      withAttachment = true
    ) => {
      const asset = parseAnimationPartAsset(
        createAnimationPartAssetInput({
          assetId: `part_accessory_${index}_south_001`,
          blobId: `blob_accessory_${index}_south_001`,
          label: `Accessory ${index}`,
          slot: `accessory.${index}`,
          sourceSize: { width: 1, height: 1 },
          trimRect: { x: 0, y: 0, width: 1, height: 1 },
          anchors: { proximal: { x: 0, y: 0 } },
          ...(withAttachment ? { attachmentJointId: "head" } : {})
        })
      );
      return {
        asset,
        decoded: {
          assetId: asset.assetId,
          image: { width: 1, height: 1, pixels: new Uint8ClampedArray(color) }
        }
      };
    };
    const first = createAccessory(1, [255, 0, 0, 255]);
    const second = createAccessory(2, [0, 0, 255, 255]);
    const project = parseAnimationProject(
      createAnimationProjectInput({
        parts: [
          { assetId: second.asset.assetId },
          { assetId: first.asset.assetId }
        ],
        overrides: []
      })
    );
    const prepared = prepareNeutralPoseParts(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      "south",
      [second.asset, first.asset],
      [second.decoded, first.decoded]
    );
    const frame = renderFrame(project.frameProfile.frameSize, prepared.parts);
    const headPixel = (34 * frame.width + 64) * 4;

    expect(prepared.parts.map((part) => part.id)).toEqual([
      first.asset.assetId,
      second.asset.assetId
    ]);
    expect([...frame.pixels.slice(headPixel, headPixel + 4)]).toEqual([
      0,
      0,
      255,
      255
    ]);

    const missing = createAccessory(1, [255, 0, 0, 255], false);
    const missingProject = parseAnimationProject(
      createAnimationProjectInput({
        parts: [{ assetId: missing.asset.assetId }],
        overrides: []
      })
    );
    const rejected = prepareNeutralPoseParts(
      missingProject,
      HUMANOID_80_RIG_TEMPLATE,
      "south",
      [missing.asset],
      [missing.decoded]
    );
    expect(rejected.parts).toEqual([]);
    expect(rejected.issues[0]?.code).toBe("missingAttachmentJoint");
  });
});
