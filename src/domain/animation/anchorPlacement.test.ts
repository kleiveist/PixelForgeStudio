import { describe, expect, it } from "vitest";
import {
  HUMANOID_80_SLOT_BINDINGS,
  applyTransform,
  applyTransformDelta,
  resolveBonePlacement,
  resolveEffectiveAnchor,
  snapSourcePoint,
  validateSourceAnchors,
  type BonePlacement
} from "./index";

const armBinding = HUMANOID_80_SLOT_BINDINGS.find(
  ({ slotId }) => slotId === "arm.left.upper"
)!;
const headBinding = HUMANOID_80_SLOT_BINDINGS.find(
  ({ slotId }) => slotId === "head"
)!;

function placement(
  targetChild: Readonly<{ x: number; y: number }>,
  distal = { x: 20, y: 10 }
) {
  return resolveBonePlacement({
    binding: armBinding,
    trimRect: { x: 4, y: 2, width: 20, height: 20 },
    sourceSize: { width: 32, height: 32 },
    anchors: { proximal: { x: 10, y: 10 }, distal },
    targetParent: { x: 50, y: 40 },
    targetChild
  });
}

describe("source anchors and automatic bone placement", () => {
  it("resolves an original source anchor relative to trim exactly once", () => {
    expect(
      resolveEffectiveAnchor(
        { x: 7, y: 11, width: 20, height: 30 },
        { x: 13, y: 19 }
      )
    ).toEqual({ x: 6, y: 8 });
  });

  it("maps proximal to parent and distal to child with translation and scale", () => {
    const result = placement({ x: 70, y: 40 });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.placement.scale).toBe(2);
    expect(result.placement.rotation).toBe(0);
    expect(applyTransform(result.placement.transform, { x: 6, y: 8 })).toEqual({
      x: 50,
      y: 40
    });
    expect(applyTransform(result.placement.transform, { x: 16, y: 8 })).toEqual({
      x: 70,
      y: 40
    });
  });

  it("handles 90-degree and 180-degree rotations deterministically", () => {
    const quarter = placement({ x: 50, y: 60 });
    const half = placement({ x: 30, y: 40 });
    expect(quarter.status === "ok" ? quarter.placement.rotation : null).toBeCloseTo(
      Math.PI / 2
    );
    expect(half.status === "ok" ? Math.abs(half.placement.rotation) : null).toBeCloseTo(
      Math.PI
    );
  });

  it("returns a structured error for missing or near-zero distal anchors", () => {
    expect(validateSourceAnchors(armBinding, { proximal: { x: 4, y: 4 } })).toMatchObject({
      valid: false,
      issues: [{ code: "missingDistal" }]
    });
    expect(placement({ x: 70, y: 40 }, { x: 10.0001, y: 10 })).toMatchObject({
      status: "invalidAnchors",
      issues: [{ code: "nearZeroSourceVector" }]
    });
  });

  it("keeps extreme uniform scale intact and exposes a warning", () => {
    const result = placement({ x: 100, y: 40 }, { x: 11, y: 10 });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.placement.scale).toBe(50);
    expect(result.placement.warnings).toMatchObject([{ code: "extremeScale", scale: 50 }]);
  });

  it("uses a single proximal anchor and versioned default orientation", () => {
    const result = resolveBonePlacement({
      binding: headBinding,
      trimRect: { x: 2, y: 3, width: 20, height: 20 },
      anchors: { proximal: { x: 12, y: 13 } },
      targetParent: { x: 64, y: 44 },
      targetChild: { x: 64, y: 34 }
    });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.placement.scale).toBe(1);
    expect(result.placement.rotation).toBe(0);
    expect(applyTransform(result.placement.transform, { x: 10, y: 10 })).toEqual({
      x: 64,
      y: 44
    });
  });

  it("applies deltas without mutating the automatic base placement", () => {
    const result = placement({ x: 70, y: 40 });
    if (result.status !== "ok") throw new Error("Expected placement.");
    const before = structuredClone(result.placement) as BonePlacement;
    const adjusted = applyTransformDelta(result.placement, {
      offsetX: 3,
      offsetY: -2,
      rotationDelta: 0.25,
      scaleMultiplier: 1.1
    });
    expect(result.placement).toEqual(before);
    expect(adjusted.basePlacement).toBe(result.placement);
    expect(adjusted.translation).toEqual({ x: 53, y: 38 });
    expect(adjusted.scale).toBeCloseTo(2.2);
  });

  it("snaps pointer coordinates to whole in-frame source pixels", () => {
    expect(snapSourcePoint({ x: 4.49, y: 8.5 }, { width: 10, height: 10 })).toEqual({
      x: 4,
      y: 9
    });
    expect(snapSourcePoint({ x: -4, y: 20 }, { width: 10, height: 10 })).toEqual({
      x: 0,
      y: 9
    });
  });
});
