import { describe, expect, it } from "vitest";
import {
  HUMANOID_80_RIG_TEMPLATE,
  type RequiredPartSlot
} from "../../domain/animation";
import {
  parseAnimationPartAsset,
  parseAnimationProject
} from "../../schemas";
import { createAnimationPartAssetInput } from "../../test/animationSchemaFixtures";
import { createSyntheticSouthWalkFixture } from "../../test/syntheticSouthWalkFixture";
import { generateSouthWalkFrames } from "./southWalkRenderer";

describe("South walk frame generation", () => {
  it("renders eight deterministic frames from a neutral synthetic humanoid", () => {
    const fixture = createSyntheticSouthWalkFixture();
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
    const fixture = createSyntheticSouthWalkFixture();
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
    const fixture = createSyntheticSouthWalkFixture();
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
    const fixture = createSyntheticSouthWalkFixture();
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
