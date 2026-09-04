import { describe, expect, it } from "vitest";
import {
  ANCHOR_CONTRACT_VERSION,
  ANIMATION_ACTION_IDS,
  BONE_IDS,
  BONE_TOPOLOGY,
  BONE_TOPOLOGY_BY_ID,
  DIRECTION_CONTRACT_VERSION,
  HUMANOID_80_FRAME_PROFILE,
  HUMANOID_80_RIG_TEMPLATE_ID,
  JOINT_IDS,
  MIRROR_POLICIES,
  OPTIONAL_PART_SLOT_IDS,
  PART_SLOT_DEFINITIONS,
  PART_SLOT_GROUP_IDS,
  PART_SLOT_GROUPS,
  PART_SLOT_IDS,
  REQUIRED_PART_SLOT_IDS,
  REQUIRED_SLOT_CONTRACT_VERSION,
  REQUIRED_SLOT_JOINT_BINDINGS,
  RIG_TEMPLATE_IDS,
  isBoneId,
  isJointId,
  isPartSlot,
  isRequiredPartSlot
} from "./index";

function hasUniqueValues(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

describe("production humanoid slot catalog", () => {
  it("contains every required and optional slot once in specification order", () => {
    expect(REQUIRED_PART_SLOT_IDS).toEqual([
      "head",
      "torso",
      "pelvis",
      "arm.left.upper",
      "arm.left.lower",
      "hand.left",
      "arm.right.upper",
      "arm.right.lower",
      "hand.right",
      "leg.left.upper",
      "leg.left.lower",
      "foot.left",
      "leg.right.upper",
      "leg.right.lower",
      "foot.right"
    ]);
    expect(OPTIONAL_PART_SLOT_IDS).toEqual([
      "hair.back",
      "hair.front",
      "face",
      "headwear",
      "armor.torso",
      "armor.shoulder.left",
      "armor.shoulder.right",
      "glove.left",
      "glove.right",
      "boot.left",
      "boot.right",
      "cape.back",
      "cape.front",
      "back.item",
      "waist.item.left",
      "waist.item.right",
      "weapon.left",
      "weapon.right",
      "shield.left",
      "shield.right",
      "accessory.1",
      "accessory.2",
      "accessory.3",
      "accessory.4"
    ]);
    expect(PART_SLOT_IDS).toHaveLength(39);
    expect(hasUniqueValues(PART_SLOT_IDS)).toBe(true);
    expect(PART_SLOT_IDS.every(isPartSlot)).toBe(true);
    expect(isPartSlot("arm.visual.left")).toBe(false);
  });

  it("keeps labels, groups, and required status in the domain catalog", () => {
    expect(PART_SLOT_DEFINITIONS.map(({ id }) => id)).toEqual(PART_SLOT_IDS);
    expect(PART_SLOT_DEFINITIONS.every(({ label }) => label.length > 0)).toBe(
      true
    );
    expect(PART_SLOT_DEFINITIONS.every(({ groupId }) =>
      PART_SLOT_GROUP_IDS.includes(groupId)
    )).toBe(true);
    expect(PART_SLOT_GROUPS.map(({ id }) => id)).toEqual(PART_SLOT_GROUP_IDS);
    expect(PART_SLOT_GROUPS.every(({ label }) => label.length > 0)).toBe(true);

    expect(
      PART_SLOT_DEFINITIONS.filter(({ required }) => required).map(({ id }) => id)
    ).toEqual(REQUIRED_PART_SLOT_IDS);
    expect(REQUIRED_PART_SLOT_IDS.every(isRequiredPartSlot)).toBe(true);
    expect(OPTIONAL_PART_SLOT_IDS.some(isRequiredPartSlot)).toBe(false);
  });
});

describe("production humanoid joint and bone topology", () => {
  it("uses complete, unique, stable joint and bone identifiers", () => {
    expect(JOINT_IDS).toHaveLength(21);
    expect(BONE_IDS).toHaveLength(20);
    expect(hasUniqueValues(JOINT_IDS)).toBe(true);
    expect(hasUniqueValues(BONE_IDS)).toBe(true);
    expect(JOINT_IDS.every(isJointId)).toBe(true);
    expect(BONE_IDS.every(isBoneId)).toBe(true);
    expect(isJointId("shoulder.visual.left")).toBe(false);
    expect(isBoneId("leftArm")).toBe(false);
  });

  it("connects every bone to two catalogued joints", () => {
    expect(BONE_TOPOLOGY.map(({ id }) => id)).toEqual(BONE_IDS);

    for (const bone of BONE_TOPOLOGY) {
      expect(isJointId(bone.parentJointId)).toBe(true);
      expect(isJointId(bone.childJointId)).toBe(true);
      expect(bone.parentJointId).not.toBe(bone.childJointId);
      expect(BONE_TOPOLOGY_BY_ID[bone.id]).toEqual({
        parentJointId: bone.parentJointId,
        childJointId: bone.childJointId
      });
    }
  });

  it("binds every required body part exactly once to its bone contract", () => {
    expect(REQUIRED_SLOT_JOINT_BINDINGS.map(({ slotId }) => slotId)).toEqual(
      REQUIRED_PART_SLOT_IDS
    );
    expect(
      hasUniqueValues(
        REQUIRED_SLOT_JOINT_BINDINGS.map(({ slotId }) => slotId)
      )
    ).toBe(true);

    for (const binding of REQUIRED_SLOT_JOINT_BINDINGS) {
      const bone = BONE_TOPOLOGY_BY_ID[binding.boneId];
      expect(isRequiredPartSlot(binding.slotId)).toBe(true);
      expect(isBoneId(binding.boneId)).toBe(true);
      expect(binding.parentJointId).toBe(bone.parentJointId);
      expect(binding.childJointId).toBe(bone.childJointId);
    }

    expect(
      REQUIRED_SLOT_JOINT_BINDINGS.filter(
        ({ sourceAnchorRequirement }) =>
          sourceAnchorRequirement === "singlePoint"
      ).map(({ slotId }) => slotId)
    ).toEqual(["head", "torso", "pelvis"]);
  });
});

describe("animation production defaults", () => {
  it("defines the versioned humanoid-80 production frame", () => {
    expect(HUMANOID_80_RIG_TEMPLATE_ID).toBe("humanoid-80-v1");
    expect(RIG_TEMPLATE_IDS).toEqual(["humanoid-80-v1"]);
    expect(HUMANOID_80_FRAME_PROFILE).toEqual({
      frameSize: { width: 128, height: 128 },
      characterHeight: 80,
      footAnchor: { x: 64, y: 112 }
    });
    expect(Object.isFrozen(HUMANOID_80_FRAME_PROFILE)).toBe(true);
    expect(Object.isFrozen(HUMANOID_80_FRAME_PROFILE.frameSize)).toBe(true);
    expect(Object.isFrozen(HUMANOID_80_FRAME_PROFILE.footAnchor)).toBe(true);
    expect(ANCHOR_CONTRACT_VERSION).toBe(1);
    expect(REQUIRED_SLOT_CONTRACT_VERSION).toBe(1);
    expect(DIRECTION_CONTRACT_VERSION).toBe(1);
  });

  it("starts with walk and the explicit mirror policies", () => {
    expect(ANIMATION_ACTION_IDS).toEqual(["walk"]);
    expect(MIRROR_POLICIES).toEqual(["inherit", "allow", "forbid"]);
  });
});
