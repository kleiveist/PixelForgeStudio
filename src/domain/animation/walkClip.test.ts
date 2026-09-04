import { describe, expect, it } from "vitest";
import { HUMANOID_80_RIG_TEMPLATE } from "./humanoidRig80";
import { JOINT_IDS } from "./rigTopology";
import {
  HUMANOID_WALK_CHANNELS,
  HUMANOID_WALK_CLIP,
  HUMANOID_WALK_CLIP_ID,
  HUMANOID_WALK_DEFAULT_FPS,
  HUMANOID_WALK_FRAME_COUNT,
  HUMANOID_WALK_PHASES,
  WALK_ROOT_BOB_LIMIT,
  applyPoseToDirectionRig,
  resolveClipFrame,
  resolveHumanoidWalkPose,
  solveTwoBoneIk,
  validatePose
} from "./walkClip";

const SOUTH_RIG = HUMANOID_80_RIG_TEMPLATE.directions.find(
  ({ direction }) => direction === "south"
)!;

function expectFinitePoint(point: Readonly<{ x: number; y: number }>) {
  expect(Number.isFinite(point.x)).toBe(true);
  expect(Number.isFinite(point.y)).toBe(true);
}

describe("walk-humanoid-8-v1", () => {
  it("defines the immutable eight-frame, 10 FPS looping clip contract", () => {
    expect(HUMANOID_WALK_CLIP).toMatchObject({
      version: 1,
      templateId: HUMANOID_WALK_CLIP_ID,
      action: "walk",
      frameCount: HUMANOID_WALK_FRAME_COUNT,
      defaultFps: HUMANOID_WALK_DEFAULT_FPS,
      loop: true
    });
    expect(HUMANOID_WALK_PHASES.map(({ label }) => label)).toEqual([
      "Kontakt links",
      "Down links",
      "Passing links",
      "Up links",
      "Kontakt rechts",
      "Down rechts",
      "Passing rechts",
      "Up rechts"
    ]);
    expect(Object.isFrozen(HUMANOID_WALK_CLIP)).toBe(true);
    expect(Object.isFrozen(HUMANOID_WALK_CHANNELS.leftStride)).toBe(true);
  });

  it("keeps all normalized channels explicit and both sides in counterphase", () => {
    expect(HUMANOID_WALK_CHANNELS.leftStride).toEqual([
      -1, -0.75, 0, 0.75, 1, 0.75, 0, -0.75
    ]);
    expect(HUMANOID_WALK_CHANNELS.rightStride).toEqual([
      1, 0.75, 0, -0.75, -1, -0.75, 0, 0.75
    ]);
    expect(HUMANOID_WALK_CHANNELS.rootBobY).toEqual([0, 1, 0, -1, 0, 1, 0, -1]);
    expect(HUMANOID_WALK_CHANNELS.rootSwayX).toEqual([-1, -1, 0, 1, 1, 1, 0, -1]);
    for (const channel of Object.values(HUMANOID_WALK_CHANNELS) as readonly (readonly number[])[]) {
      expect(channel).toHaveLength(HUMANOID_WALK_FRAME_COUNT);
      expect(channel.every((value) => Number.isFinite(value) && Math.abs(value) <= 1)).toBe(true);
    }
    for (let index = 0; index < HUMANOID_WALK_FRAME_COUNT; index += 1) {
      expect(HUMANOID_WALK_CHANNELS.rightStride[index]).toBe(
        HUMANOID_WALK_CHANNELS.leftStride[(index + 4) % 8]
      );
      expect(HUMANOID_WALK_CHANNELS.leftArmSwing[index]).toBe(
        HUMANOID_WALK_CHANNELS.rightStride[index]! * 0.75
      );
      expect(HUMANOID_WALK_CHANNELS.rightArmSwing[index]).toBe(
        HUMANOID_WALK_CHANNELS.leftStride[index]! * 0.75
      );
    }
    expect(
      Math.max(...HUMANOID_WALK_CHANNELS.rootBobY.map(Math.abs))
    ).toBe(WALK_ROOT_BOB_LIMIT);
  });

  it("resolves every frame explicitly and wraps the loop to its start", () => {
    expect(
      Array.from({ length: 8 }, (_, frameIndex) =>
        resolveClipFrame(frameIndex).phase.id
      )
    ).toEqual(HUMANOID_WALK_PHASES.map(({ id }) => id));
    expect(resolveClipFrame(8)).toEqual(resolveClipFrame(0));
    expect(() => resolveClipFrame(-1)).toThrow(/non-negative integer/);
  });

  it("applies finite South poses, opposite limbs and deterministic foot contact", () => {
    const results = Array.from({ length: 8 }, (_, frameIndex) => {
      const pose = resolveHumanoidWalkPose(frameIndex);
      const result = applyPoseToDirectionRig(SOUTH_RIG, pose);
      expect(result.status).toBe("ok");
      if (result.status !== "ok") throw new Error("Expected a valid walk pose.");
      for (const jointId of JOINT_IDS) {
        expectFinitePoint(result.rig.joints[jointId].position);
      }
      for (const side of ["left", "right"] as const) {
        if (pose.contact[side]) {
          expect(result.rig.joints[`toe.${side}`].position.y).toBe(
            SOUTH_RIG.joints.root.position.y
          );
        }
      }
      expect(validatePose(result.rig)).toEqual({ valid: true, issues: [] });
      return result.rig;
    });

    expect(results[0]!.joints["ankle.left"].position.x).toBeLessThan(
      results[4]!.joints["ankle.left"].position.x
    );
    expect(results[0]!.joints["hand.left"].position.x).not.toBe(
      results[4]!.joints["hand.left"].position.x
    );
  });

  it("keeps frame zero and four in counterphase within the humanoid height tolerance", () => {
    const frameZero = applyPoseToDirectionRig(
      SOUTH_RIG,
      resolveHumanoidWalkPose(0)
    );
    const frameFour = applyPoseToDirectionRig(
      SOUTH_RIG,
      resolveHumanoidWalkPose(4)
    );
    expect(frameZero.status).toBe("ok");
    expect(frameFour.status).toBe("ok");
    if (frameZero.status !== "ok" || frameFour.status !== "ok") return;
    expect(frameZero.rig.joints.pelvis.position.x).toBeLessThan(
      SOUTH_RIG.joints.pelvis.position.x
    );
    expect(frameFour.rig.joints.pelvis.position.x).toBeGreaterThan(
      SOUTH_RIG.joints.pelvis.position.x
    );

    const neutralHeight =
      SOUTH_RIG.joints.root.position.y - SOUTH_RIG.joints.head.position.y;
    for (const rig of [frameZero.rig, frameFour.rig]) {
      const height = rig.joints.root.position.y - rig.joints.head.position.y;
      expect(Math.abs(height - neutralHeight)).toBeLessThanOrEqual(1);
    }
  });

  it("solves normal and clamped two-bone targets without non-finite output", () => {
    const normal = solveTwoBoneIk({
      root: { x: 0, y: 0 },
      target: { x: 6, y: 0 },
      upperLength: 5,
      lowerLength: 3,
      bendSign: 1
    });
    expect(normal.status).toBe("ok");
    if (normal.status !== "ok") return;
    expect(normal.clamped).toBe(false);
    expectFinitePoint(normal.joint);
    expectFinitePoint(normal.end);
    expect(Math.hypot(normal.joint.x, normal.joint.y)).toBeCloseTo(5);

    const unreachable = solveTwoBoneIk({
      root: { x: 0, y: 0 },
      target: { x: 100, y: 0 },
      upperLength: 5,
      lowerLength: 3,
      bendSign: -1
    });
    expect(unreachable.status).toBe("ok");
    if (unreachable.status !== "ok") return;
    expect(unreachable.clamped).toBe(true);
    expect(unreachable.diagnostics[0]?.code).toBe("targetClamped");
    expect(unreachable.end.x).toBeLessThan(8);
    expectFinitePoint(unreachable.joint);
    expectFinitePoint(unreachable.end);

    const invalid = solveTwoBoneIk({
      root: { x: 0, y: 0 },
      target: { x: 1, y: 1 },
      upperLength: 0,
      lowerLength: 3,
      bendSign: 1
    });
    expect(invalid.status).toBe("invalid");
    expect(invalid.diagnostics.every((entry) =>
      Number.isFinite(entry.requestedDistance) &&
      Number.isFinite(entry.resolvedDistance)
    )).toBe(true);
  });

  it("rejects a zero-length rig bone before pose generation", () => {
    const invalidRig = {
      ...SOUTH_RIG,
      joints: {
        ...SOUTH_RIG.joints,
        "knee.left": {
          id: "knee.left" as const,
          position: SOUTH_RIG.joints["hip.left"].position
        }
      }
    };
    const validation = validatePose(invalidRig);

    expect(validation.valid).toBe(false);
    if (validation.valid) return;
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code: "invalidBoneLength",
        boneId: "hip.left.knee.left"
      })
    );
    expect(
      applyPoseToDirectionRig(invalidRig, resolveHumanoidWalkPose(0)).status
    ).toBe("invalid");
  });
});
