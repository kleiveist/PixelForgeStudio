import { describe, expect, it } from "vitest";
import {
  HUMANOID_80_RIG_TEMPLATE,
  getDirectionDrawOrder
} from "./index";
import {
  getMirroredSourceDirection,
  mirrorDirectionRig,
  mirrorFramePoint,
  mirrorRgbaImage,
  mirrorSourceAnchors,
  mirrorSourceRect,
  mirrorSourceX,
  mirrorTransformDelta,
  resolveRuntimeDirectionRig
} from "./directionProjection";

describe("direction mirroring projection", () => {
  it("uses exactly the three contractual five-authored mirror pairs", () => {
    expect(getMirroredSourceDirection("southWest")).toBe("southEast");
    expect(getMirroredSourceDirection("west")).toBe("east");
    expect(getMirroredSourceDirection("northWest")).toBe("northEast");
    expect(getMirroredSourceDirection("south")).toBeNull();
  });

  it("keeps source and frame mirror axes explicit", () => {
    expect(mirrorSourceX(10, 2)).toBe(7);
    expect(mirrorSourceAnchors(10, {
      proximal: { x: 2, y: 3 },
      distal: { x: 8, y: 5 },
      pivot: { x: 4, y: 4 }
    })).toEqual({
      proximal: { x: 7, y: 3 },
      distal: { x: 1, y: 5 },
      pivot: { x: 5, y: 4 }
    });
    expect(mirrorSourceRect(10, { x: 2, y: 1, width: 4, height: 5 })).toEqual({
      x: 4,
      y: 1,
      width: 4,
      height: 5
    });
    expect(mirrorFramePoint(64, { x: 50, y: 18 })).toEqual({ x: 78, y: 18 });
  });

  it("negates rotation and X delta but keeps Y and scale", () => {
    expect(mirrorTransformDelta({
      offsetX: 3,
      offsetY: -2,
      rotationDelta: 0.25,
      scaleMultiplier: 1.1
    })).toEqual({
      offsetX: -3,
      offsetY: -2,
      rotationDelta: -0.25,
      scaleMultiplier: 1.1
    });
  });

  it("mirrors RGBA source pixels without mutating the input", () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 0, 255
    ]);
    const before = [...pixels];
    const mirrored = mirrorRgbaImage({ width: 2, height: 2, pixels });
    expect([...mirrored.pixels]).toEqual([
      0, 255, 0, 255,
      255, 0, 0, 255,
      255, 255, 0, 255,
      0, 0, 255, 255
    ]);
    expect([...pixels]).toEqual(before);
    expect(mirrored.pixels).not.toBe(pixels);
  });

  it("projects rig joints around the foot anchor and retains anatomical IDs", () => {
    const east = HUMANOID_80_RIG_TEMPLATE.directions.find(
      ({ direction }) => direction === "east"
    )!;
    const originalWrist = { ...east.joints["wrist.right"].position };
    const west = mirrorDirectionRig(east, "west", 64);

    expect(west.direction).toBe("west");
    expect(west.joints["wrist.right"].id).toBe("wrist.right");
    expect(west.joints["wrist.right"].position.x).toBe(
      128 - originalWrist.x
    );
    expect(west.motionProfile.stepAxis.x).toBe(-east.motionProfile.stepAxis.x);
    expect(west.motionProfile.rootSwayAxis.x).toBe(
      -east.motionProfile.rootSwayAxis.x
    );
    expect(west.motionProfile.rootSwayAxis.y).toBe(
      east.motionProfile.rootSwayAxis.y
    );
    expect(west.motionProfile.nearSide).toBe("left");
    expect(east.joints["wrist.right"].position).toEqual(originalWrist);
    expect(getDirectionDrawOrder(west.direction)?.nearSide).toBe("left");
  });

  it("resolves mirrored runtime rigs without adding them to authored metadata", () => {
    const count = HUMANOID_80_RIG_TEMPLATE.directions.length;
    const resolution = resolveRuntimeDirectionRig(
      HUMANOID_80_RIG_TEMPLATE,
      "northWest"
    );
    expect(resolution).toMatchObject({
      sourceDirection: "northEast",
      mirrored: true,
      rig: { direction: "northWest" }
    });
    expect(HUMANOID_80_RIG_TEMPLATE.directions).toHaveLength(count);
  });
});
