import { describe, expect, it } from "vitest";
import type { BoneId, JointId, RigTemplate } from "./index";
import {
  HUMANOID_80_RIG_TEMPLATE,
  createRigCompatibilityKey,
  validateRigTemplate
} from "./index";

function withSouthJoints(
  update: (
    joints: Record<JointId, (typeof HUMANOID_80_RIG_TEMPLATE.directions)[number]["joints"][JointId]>
  ) => void
): RigTemplate {
  const south = HUMANOID_80_RIG_TEMPLATE.directions[0];
  if (!south) throw new Error("South rig is missing.");
  const joints = { ...south.joints };
  update(joints);
  return {
    ...HUMANOID_80_RIG_TEMPLATE,
    directions: [{ ...south, joints }, ...HUMANOID_80_RIG_TEMPLATE.directions.slice(1)]
  };
}

function expectIssue(template: RigTemplate, code: string): void {
  const result = validateRigTemplate(template);
  expect(result.valid).toBe(false);
  expect(result.issues).toEqual(
    expect.arrayContaining([expect.objectContaining({ code, path: expect.any(Array) })])
  );
}

describe("validateRigTemplate", () => {
  it("rejects a missing required joint", () => {
    const template = withSouthJoints((joints) => {
      delete (joints as Partial<typeof joints>).head;
    });
    expectIssue(template, "missingJoint");
    expect(() => createRigCompatibilityKey(template)).toThrow(/invalid rig/i);
  });

  it("rejects joint coordinates outside the frame", () => {
    const template = withSouthJoints((joints) => {
      joints.head = { id: "head", position: { x: 128, y: 34 } };
    });
    expectIssue(template, "jointOutOfFrame");
  });

  it("rejects a zero-length limb bone", () => {
    const template = withSouthJoints((joints) => {
      joints["elbow.left"] = {
        id: "elbow.left",
        position: joints["shoulder.left"].position
      };
    });
    expectIssue(template, "zeroLengthBone");
  });

  it("rejects a bone that references an unknown joint", () => {
    const [firstBone, ...remainingBones] = HUMANOID_80_RIG_TEMPLATE.bones;
    if (!firstBone) throw new Error("Bone fixture is missing.");
    const template = {
      ...HUMANOID_80_RIG_TEMPLATE,
      bones: [
        {
          ...firstBone,
          childJointId: "unknown.joint" as JointId
        },
        ...remainingBones
      ]
    };
    expectIssue(template, "missingBoneJoint");
  });

  it("rejects a missing required bone", () => {
    expectIssue(
      {
        ...HUMANOID_80_RIG_TEMPLATE,
        bones: HUMANOID_80_RIG_TEMPLATE.bones.slice(1)
      },
      "missingBone"
    );
  });

  it("rejects a cyclic bone hierarchy", () => {
    const bones = HUMANOID_80_RIG_TEMPLATE.bones.map((bone) =>
      bone.id === "root.pelvis"
        ? { ...bone, parentBoneId: "pelvis.chest" as BoneId }
        : bone
    );
    expectIssue({ ...HUMANOID_80_RIG_TEMPLATE, bones }, "cyclicBoneHierarchy");
  });

  it("rejects invalid and missing required slot bindings", () => {
    const [headBinding, ...remainingBindings] =
      HUMANOID_80_RIG_TEMPLATE.slotBindings;
    if (!headBinding) throw new Error("Slot binding fixture is missing.");
    expectIssue(
      {
        ...HUMANOID_80_RIG_TEMPLATE,
        slotBindings: [
          { ...headBinding, proximalJointId: "head" },
          ...remainingBindings
        ]
      },
      "invalidSlotBinding"
    );
    expectIssue(
      {
        ...HUMANOID_80_RIG_TEMPLATE,
        slotBindings: remainingBindings
      },
      "missingSlotBinding"
    );
  });

  it("rejects feet or toes outside the groundline zone", () => {
    const template = withSouthJoints((joints) => {
      joints["toe.left"] = {
        id: "toe.left",
        position: { x: 53, y: 104 }
      };
    });
    const result = validateRigTemplate(template);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "groundlineViolation",
          path: ["directions", 0, "joints", "toe.left", "position", "y"]
        })
      ])
    );
  });
});
