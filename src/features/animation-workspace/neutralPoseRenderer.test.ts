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

  it("reports unavailable rigs, pending anchors and decoded size mismatches", () => {
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

    expect(unavailable.issues[0]?.code).toBe("missingDirectionRig");
    expect(pendingResult.issues[0]?.code).toBe("sourceNotReady");
    expect(mismatch.issues[0]?.code).toBe("decodedDimensionsMismatch");
  });
});
