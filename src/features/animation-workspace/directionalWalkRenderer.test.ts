import { describe, expect, it } from "vitest";
import {
  DIRECTION_IDS,
  HUMANOID_80_RIG_TEMPLATE,
  HUMANOID_WALK_FRAME_COUNT,
  REQUIRED_PART_SLOT_IDS,
  findAlphaBounds,
  type Direction
} from "../../domain/animation";
import {
  parseAnimationPartAsset,
  parseAnimationProject
} from "../../schemas";
import { createAnimationPartAssetInput } from "../../test/animationSchemaFixtures";
import {
  SYNTHETIC_AUTHORED_DIRECTIONS,
  createSyntheticEightDirectionWalkFixture,
  createSyntheticWalkPartImage
} from "../../test/syntheticSouthWalkFixture";
import {
  generateDirectionalFrames,
  generateEightDirectionWalkSet
} from "./directionalWalkRenderer";

describe("eight-direction walk generation", () => {
  it("renders exactly 64 deterministic frames in canonical direction order", () => {
    const fixture = createSyntheticEightDirectionWalkFixture();
    const first = generateEightDirectionWalkSet(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      fixture.assets,
      fixture.decoded
    );
    const repeated = generateDirectionalFrames(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      "west",
      fixture.assets,
      fixture.decoded
    );

    expect(first.status).toBe("ok");
    expect(repeated.status).toBe("ok");
    if (first.status !== "ok" || repeated.status !== "ok") return;
    expect(first.directions.map(({ direction }) => direction)).toEqual(
      DIRECTION_IDS
    );
    expect(first.directions.every(({ frames }) => frames.length === 8)).toBe(
      true
    );
    expect(first.frames).toHaveLength(
      DIRECTION_IDS.length * HUMANOID_WALK_FRAME_COUNT
    );
    expect(
      first.frames.every(
        (entry) =>
          entry.footAnchor.x === fixture.project.frameProfile.footAnchor.x &&
          entry.footAnchor.y === fixture.project.frameProfile.footAnchor.y &&
          entry.frame.width === fixture.project.frameProfile.frameSize.width &&
          entry.frame.height === fixture.project.frameProfile.frameSize.height &&
          entry.frame.renderedPartIds.length === REQUIRED_PART_SLOT_IDS.length
      )
    ).toBe(true);
    first.frames.forEach((entry, index) => {
      expect(entry.direction).toBe(
        DIRECTION_IDS[Math.floor(index / HUMANOID_WALK_FRAME_COUNT)]
      );
      expect(entry.frameIndex).toBe(index % HUMANOID_WALK_FRAME_COUNT);
    });
    const west = first.directions.find(({ direction }) => direction === "west")!;
    west.frames.forEach((entry, index) => {
      expect(entry.frame.pixels).toEqual(repeated.frames[index]!.frame.pixels);
    });
    for (let frameIndex = 0; frameIndex < HUMANOID_WALK_FRAME_COUNT; frameIndex += 1) {
      const heights = first.frames
        .filter((entry) => entry.frameIndex === frameIndex)
        .map((entry) =>
          findAlphaBounds(
            {
              width: entry.frame.width,
              height: entry.frame.height,
              pixels: entry.frame.pixels
            },
            1
          )?.height ?? 0
        );
      const exceedsTolerance = heights.some(
        (height) => Math.abs(height - heights[0]!) > 1
      );
      expect(
        first.diagnostics.some(
          (entry) =>
            entry.code === "heightVariance" &&
            entry.frameIndex === frameIndex
        )
      ).toBe(exceedsTolerance);
    }
    expect(
      first.diagnostics.filter(({ code }) => code === "emptySilhouette")
    ).toEqual([]);
  }, 20_000);

  it("fails closed without returning partial frames for missing parts or blobs", () => {
    const fixture = createSyntheticEightDirectionWalkFixture();
    const missingAsset = fixture.assets.find(
      (asset) => asset.direction === "north" && asset.slot === "head"
    )!;
    const missingPart = generateEightDirectionWalkSet(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      fixture.assets.filter((asset) => asset.assetId !== missingAsset.assetId),
      fixture.decoded
    );
    expect(missingPart.status).toBe("invalid");
    if (missingPart.status === "invalid") {
      expect(missingPart.frames).toEqual([]);
      expect(missingPart.directions).toEqual([]);
      expect(missingPart.issues).toContainEqual(
        expect.objectContaining({
          code: "missingPart",
          direction: "north"
        })
      );
    }

    const missingBlob = generateEightDirectionWalkSet(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      fixture.assets,
      fixture.decoded.slice(1)
    );
    expect(missingBlob.status).toBe("invalid");
    if (missingBlob.status === "invalid") {
      expect(missingBlob.frames).toEqual([]);
      expect(missingBlob.issues).toContainEqual(
        expect.objectContaining({ code: "missingDecodedSource" })
      );
    }

    const missingEastRig = generateEightDirectionWalkSet(
      fixture.project,
      {
        ...HUMANOID_80_RIG_TEMPLATE,
        directions: HUMANOID_80_RIG_TEMPLATE.directions.filter(
          ({ direction }) => direction !== "east"
        )
      },
      fixture.assets,
      fixture.decoded
    );
    expect(missingEastRig.status).toBe("invalid");
    if (missingEastRig.status === "invalid") {
      expect(missingEastRig.frames).toEqual([]);
      expect(missingEastRig.issues).toContainEqual(
        expect.objectContaining({
          code: "missingDirectionRig",
          direction: "east"
        })
      );
    }
  });

  it("renders baseline plus the addressed delta and leaves other export frames unchanged", () => {
    const fixture = createSyntheticEightDirectionWalkFixture();
    const baseline = generateDirectionalFrames(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      "south",
      fixture.assets,
      fixture.decoded
    );
    const correctedProject = parseAnimationProject({
      ...fixture.project,
      overrides: [
        {
          clipId: fixture.project.clips[0]!.clipId,
          direction: "south",
          frameIndex: 0,
          partDeltas: {
            head: {
              offsetX: 2,
              offsetY: 0,
              rotationDelta: 0,
              scaleMultiplier: 1
            }
          }
        }
      ]
    });
    const corrected = generateDirectionalFrames(
      correctedProject,
      HUMANOID_80_RIG_TEMPLATE,
      "south",
      fixture.assets,
      fixture.decoded
    );

    expect(baseline.status).toBe("ok");
    expect(corrected.status).toBe("ok");
    if (baseline.status !== "ok" || corrected.status !== "ok") return;
    expect(corrected.frames[0]!.frame.pixels).not.toEqual(
      baseline.frames[0]!.frame.pixels
    );
    expect(corrected.frames[1]!.frame.pixels).toEqual(
      baseline.frames[1]!.frame.pixels
    );
    expect(fixture.project.overrides).toEqual([]);
  });

  it("accepts eight explicitly authored direction sources", () => {
    const fixture = createSyntheticEightDirectionWalkFixture();
    const sourceByTarget = {
      northWest: "northEast",
      west: "east",
      southWest: "southEast"
    } as const satisfies Readonly<Record<string, Direction>>;
    const westernAssets = Object.entries(sourceByTarget).flatMap(
      ([targetDirection, sourceDirection], targetIndex) =>
        fixture.assets
          .filter((asset) => asset.direction === sourceDirection)
          .map((asset, slotIndex) =>
            parseAnimationPartAsset({
              ...asset,
              assetId: `part_authored_west_${targetIndex}_${slotIndex}`,
              blobId: `blob_authored_west_${targetIndex}_${slotIndex}`,
              direction: targetDirection
            })
          )
    );
    const allAssets = [...fixture.assets, ...westernAssets];
    const project = parseAnimationProject({
      ...fixture.project,
      directionSourceMode: "eightAuthored",
      parts: allAssets.map(({ assetId }) => ({ assetId }))
    });
    const result = generateEightDirectionWalkSet(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      allAssets,
      [
        ...fixture.decoded,
        ...westernAssets.map((asset, index) => ({
          assetId: asset.assetId,
          image: createSyntheticWalkPartImage(200 + index)
        }))
      ]
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.frames).toHaveLength(64);
      expect(result.directions.map(({ direction }) => direction)).toEqual(
        DIRECTION_IDS
      );
    }
  });

  it("blocks an unconfirmed asymmetric mirror review", () => {
    const fixture = createSyntheticEightDirectionWalkFixture();
    const optionalAssets = SYNTHETIC_AUTHORED_DIRECTIONS.map(
      (direction, directionIndex) =>
        parseAnimationPartAsset(
          createAnimationPartAssetInput({
            assetId: `part_weapon_${directionIndex}`,
            blobId: `blob_weapon_${directionIndex}`,
            label: `Synthetic weapon ${direction}`,
            slot: "weapon.right",
            direction,
            sourceSize: { width: 5, height: 5 },
            trimRect: { x: 0, y: 0, width: 5, height: 5 },
            anchors: { proximal: { x: 2, y: 2 } },
            attachmentJointId: "hand.right"
          })
        )
    );
    const reviews = optionalAssets.flatMap((asset) => {
      const targetBySource: Partial<Record<Direction, Direction>> = {
        southEast: "southWest",
        northEast: "northWest"
      };
      const targetDirection = targetBySource[asset.direction];
      return targetDirection
        ? [
            {
              assetId: asset.assetId,
              sourceUpdatedAt: asset.updatedAt,
              targetDirection,
              confirmedAt: asset.updatedAt
            }
          ]
        : [];
    });
    const project = parseAnimationProject({
      ...fixture.project,
      parts: [
        ...fixture.project.parts,
        ...optionalAssets.map(({ assetId }) => ({ assetId }))
      ],
      mirrorReviews: reviews
    });
    const result = generateEightDirectionWalkSet(
      project,
      HUMANOID_80_RIG_TEMPLATE,
      [...fixture.assets, ...optionalAssets],
      [
        ...fixture.decoded,
        ...optionalAssets.map((asset, index) => ({
          assetId: asset.assetId,
          image: createSyntheticWalkPartImage(100 + index)
        }))
      ]
    );

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.frames).toEqual([]);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: "coverageBlocked",
          direction: "west"
        })
      );
    }
  });

  it("reports clipping with its direction and frame context", () => {
    const fixture = createSyntheticEightDirectionWalkFixture();
    const source = fixture.assets.find(
      (asset) => asset.direction === "south" && asset.slot === "head"
    )!;
    const large = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        ...source,
        sourceSize: { width: 100, height: 100 },
        trimRect: { x: 0, y: 0, width: 100, height: 100 },
        anchors: { proximal: { x: 50, y: 50 } }
      })
    );
    const pixels = new Uint8ClampedArray(100 * 100 * 4);
    for (let offset = 3; offset < pixels.length; offset += 4) pixels[offset] = 255;
    const result = generateEightDirectionWalkSet(
      fixture.project,
      HUMANOID_80_RIG_TEMPLATE,
      fixture.assets.map((asset) =>
        asset.assetId === source.assetId ? large : asset
      ),
      fixture.decoded.map((decoded) =>
        decoded.assetId === source.assetId
          ? {
              assetId: decoded.assetId,
              image: { width: 100, height: 100, pixels }
            }
          : decoded
      )
    );

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ code: "clipping", direction: "south" })
      );
    }
  });
});
