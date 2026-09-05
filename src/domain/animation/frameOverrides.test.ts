import { describe, expect, it } from "vitest";
import { HUMANOID_80_RIG_TEMPLATE } from "./humanoidRig80";
import {
  IDENTITY_FRAME_DELTA,
  applyFrameLayerOrder,
  diffFrameFromGeneratedBaseline,
  findFrameOverride,
  removeFrameOverride,
  resetDirectionOverrides,
  resolveEffectiveFramePose,
  upsertFrameOverride,
  type FrameOverride,
  type FrameOverrideAddress
} from "./frameOverrides";
import type { TransformDelta } from "./animation.types";

const address: FrameOverrideAddress = Object.freeze({
  clipId: "clip_walk_001",
  direction: "south" as const,
  frameIndex: 2
});
const moved: TransformDelta = Object.freeze({
  offsetX: 3,
  offsetY: -2,
  rotationDelta: 0,
  scaleMultiplier: 1
});

describe("frame overrides", () => {
  it("creates, replaces, sorts and removes sparse frame overrides", () => {
    const first = upsertFrameOverride([], { ...address, rootDelta: moved });
    const sorted = upsertFrameOverride(first, {
      ...address,
      direction: "east",
      frameIndex: 1,
      rootDelta: { ...moved, offsetX: 1 }
    });
    const replaced = upsertFrameOverride(sorted, {
      ...address,
      rootDelta: { ...moved, offsetX: 7 }
    });

    expect(sorted.map(({ direction }) => direction)).toEqual(["south", "east"]);
    expect(findFrameOverride(replaced, address)?.rootDelta?.offsetX).toBe(7);
    expect(removeFrameOverride(replaced, address)).toHaveLength(1);
    expect(
      upsertFrameOverride(replaced, { ...address, rootDelta: IDENTITY_FRAME_DELTA })
    ).toHaveLength(1);
  });

  it("resets one direction without affecting another clip or direction", () => {
    const overrides: readonly FrameOverride[] = [
      { ...address, rootDelta: moved },
      { ...address, direction: "east", rootDelta: moved },
      { ...address, clipId: "clip_run_001", rootDelta: moved }
    ];
    expect(resetDirectionOverrides(overrides, address.clipId, "south")).toEqual([
      expect.objectContaining({ direction: "east" }),
      expect.objectContaining({ clipId: "clip_run_001" })
    ]);
  });

  it("applies root, joint, part and layer deltas without mutating the baseline", () => {
    const baseline = HUMANOID_80_RIG_TEMPLATE.directions[0]!;
    const rootBefore = baseline.joints.root.position;
    const handBefore = baseline.joints["hand.left"].position;
    const result = resolveEffectiveFramePose(baseline, {
      ...address,
      rootDelta: moved,
      jointDeltas: {
        "shoulder.left": {
          offsetX: 1,
          offsetY: 0,
          rotationDelta: Math.PI / 2,
          scaleMultiplier: 1
        }
      },
      partDeltas: { head: { ...moved, offsetX: 30 } },
      layerOrderOverride: ["head", "torso"]
    });

    expect(result.rig.joints.root.position).toEqual({
      x: rootBefore.x + 3,
      y: rootBefore.y - 2
    });
    expect(result.rig.joints["hand.left"].position).not.toEqual(handBefore);
    expect(result.partDeltas.head?.offsetX).toBe(30);
    expect(result.layerOrderOverride).toEqual(["head", "torso"]);
    expect(result.warnings).toContain("Part head: Verschiebung über 24 px.");
    expect(baseline.joints.root.position).toBe(rootBefore);
  });

  it("diffs an edited pose back to minimal generated-baseline deltas", () => {
    const baseline = HUMANOID_80_RIG_TEMPLATE.directions[0]!;
    const edited = resolveEffectiveFramePose(baseline, {
      ...address,
      rootDelta: moved,
      partDeltas: { head: { ...moved, offsetY: 0 } },
      layerOrderOverride: ["head", "torso"]
    });
    const diff = diffFrameFromGeneratedBaseline(
      address,
      { rig: baseline, layerOrder: ["torso", "head"] },
      {
        rig: edited.rig,
        partTransforms: edited.partDeltas,
        ...(edited.layerOrderOverride
          ? { layerOrder: edited.layerOrderOverride }
          : {})
      }
    );

    expect(diff?.rootDelta).toMatchObject({ offsetX: 3, offsetY: -2 });
    expect(diff?.partDeltas?.head).toMatchObject({ offsetX: 3, offsetY: 0 });
    expect(diff?.layerOrderOverride).toEqual(["head", "torso"]);
  });

  it("applies a partial known-slot layer order without duplicating slots", () => {
    expect(applyFrameLayerOrder(["torso", "head", "face"], ["face", "torso"]))
      .toEqual(["face", "torso", "head"]);
  });
});
