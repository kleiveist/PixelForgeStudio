import { describe, expect, it } from "vitest";
import {
  BONE_IDS,
  HUMANOID_80_RIG_TEMPLATE,
  JOINT_IDS,
  REQUIRED_PART_SLOT_IDS,
  RIG_SOURCE_DIRECTION_IDS,
  createRigCompatibilityKey,
  findDirectionRig,
  validateRigTemplate
} from "./index";

describe("humanoid-80-v1 production template", () => {
  it("keeps the exact South reference centers and completed hand/toe joints", () => {
    const south = findDirectionRig(HUMANOID_80_RIG_TEMPLATE, "south");
    expect(south).not.toBeNull();
    expect(
      Object.fromEntries(
        JOINT_IDS.map((jointId) => [jointId, south?.joints[jointId].position])
      )
    ).toEqual({
      root: { x: 64, y: 112 },
      pelvis: { x: 64, y: 78 },
      chest: { x: 64, y: 58 },
      neck: { x: 64, y: 44 },
      head: { x: 64, y: 34 },
      "shoulder.left": { x: 52, y: 52 },
      "elbow.left": { x: 49, y: 68 },
      "wrist.left": { x: 48, y: 82 },
      "hand.left": { x: 47, y: 86 },
      "shoulder.right": { x: 76, y: 52 },
      "elbow.right": { x: 79, y: 68 },
      "wrist.right": { x: 80, y: 82 },
      "hand.right": { x: 81, y: 86 },
      "hip.left": { x: 58, y: 78 },
      "knee.left": { x: 57, y: 95 },
      "ankle.left": { x: 56, y: 109 },
      "toe.left": { x: 53, y: 112 },
      "hip.right": { x: 70, y: 78 },
      "knee.right": { x: 71, y: 95 },
      "ankle.right": { x: 72, y: 109 },
      "toe.right": { x: 75, y: 112 }
    });
  });

  it("contains five independently modelled source directions", () => {
    expect(HUMANOID_80_RIG_TEMPLATE.directions.map(({ direction }) => direction)).toEqual(
      RIG_SOURCE_DIRECTION_IDS
    );

    const coordinateSignatures = HUMANOID_80_RIG_TEMPLATE.directions.map(
      ({ joints }) =>
        JSON.stringify(
          JOINT_IDS.map((jointId) => [
            joints[jointId].position.x,
            joints[jointId].position.y
          ])
        )
    );
    expect(new Set(coordinateSignatures).size).toBe(5);
    expect(findDirectionRig(HUMANOID_80_RIG_TEMPLATE, "west")).toBeNull();
  });

  it("binds every required joint, bone, and production slot", () => {
    for (const direction of HUMANOID_80_RIG_TEMPLATE.directions) {
      expect(Object.keys(direction.joints)).toEqual(JOINT_IDS);
    }
    expect(HUMANOID_80_RIG_TEMPLATE.bones.map(({ id }) => id)).toEqual(BONE_IDS);
    expect(
      HUMANOID_80_RIG_TEMPLATE.slotBindings.map(({ slotId }) => slotId)
    ).toEqual(REQUIRED_PART_SLOT_IDS);
    expect(validateRigTemplate(HUMANOID_80_RIG_TEMPLATE)).toEqual({
      valid: true,
      issues: []
    });
  });

  it("is deeply immutable at the public production-data boundaries", () => {
    const south = HUMANOID_80_RIG_TEMPLATE.directions[0];
    expect(Object.isFrozen(HUMANOID_80_RIG_TEMPLATE)).toBe(true);
    expect(Object.isFrozen(HUMANOID_80_RIG_TEMPLATE.directions)).toBe(true);
    expect(Object.isFrozen(HUMANOID_80_RIG_TEMPLATE.bones)).toBe(true);
    expect(Object.isFrozen(HUMANOID_80_RIG_TEMPLATE.slotBindings)).toBe(true);
    expect(Object.isFrozen(south)).toBe(true);
    expect(Object.isFrozen(south?.joints)).toBe(true);
    expect(Object.isFrozen(south?.joints.head)).toBe(true);
    expect(Object.isFrozen(south?.joints.head.position)).toBe(true);
    expect(Object.isFrozen(south?.motionProfile)).toBe(true);
    expect(Object.isFrozen(south?.motionProfile.stepAxis)).toBe(true);
  });

  it("creates a stable key and changes it for contract-relevant geometry", () => {
    const key = createRigCompatibilityKey(HUMANOID_80_RIG_TEMPLATE);
    expect(key).toBe(
      "humanoid-80-v1__frame-128x128__char-80__foot-64-112__contracts-1-1-1__50ec24e4181a7082"
    );
    expect(createRigCompatibilityKey(HUMANOID_80_RIG_TEMPLATE)).toBe(key);

    const south = HUMANOID_80_RIG_TEMPLATE.directions[0];
    if (!south) throw new Error("South rig is missing.");
    const changedTemplate = {
      ...HUMANOID_80_RIG_TEMPLATE,
      directions: [
        {
          ...south,
          joints: {
            ...south.joints,
            head: {
              ...south.joints.head,
              position: { x: 65, y: 34 }
            }
          }
        },
        ...HUMANOID_80_RIG_TEMPLATE.directions.slice(1)
      ]
    };
    expect(createRigCompatibilityKey(changedTemplate)).not.toBe(key);
  });
});
