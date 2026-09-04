import type { Point } from "./animation.types";
import type { Direction } from "./directions";
import {
  ANCHOR_CONTRACT_VERSION,
  DIRECTION_CONTRACT_VERSION,
  HUMANOID_80_FRAME_PROFILE,
  HUMANOID_80_RIG_TEMPLATE_ID,
  REQUIRED_SLOT_CONTRACT_VERSION
} from "./frameProfiles";
import { JOINT_IDS, type BoneId, type JointId } from "./rigTopology";
import type {
  BoneDefinition,
  BoneRole,
  DirectionMotionProfile,
  DirectionRig,
  RigSourceDirection,
  RigTemplate,
  SlotBinding
} from "./rigTemplate";
import { RIG_SOURCE_DIRECTION_IDS } from "./rigTemplate";
import type { RequiredPartSlot } from "./slots";

type JointCoordinates = Readonly<Record<JointId, readonly [number, number]>>;

function defineJoints(
  coordinates: JointCoordinates
): Readonly<Record<JointId, Readonly<{ id: JointId; position: Point }>>> {
  return Object.freeze(
    Object.fromEntries(
      JOINT_IDS.map((id) => [
        id,
        Object.freeze({
          id,
          position: Object.freeze({ x: coordinates[id][0], y: coordinates[id][1] })
        })
      ])
    ) as Record<JointId, Readonly<{ id: JointId; position: Point }>>
  );
}

function defineMotionProfile(
  projection: DirectionMotionProfile["projection"],
  nearSide: DirectionMotionProfile["nearSide"],
  stepAxis: Point,
  rootSwayAxis: Point,
  bendSign: DirectionMotionProfile["bendSign"]
): DirectionMotionProfile {
  const amplitudes =
    projection === "side"
      ? {
          strideAmplitude: 4,
          thighAmplitudeRadians: (18 * Math.PI) / 180,
          lowerLegAmplitudeRadians: (28 * Math.PI) / 180,
          kneeLift: 3,
          footLift: 5,
          armAmplitudeRadians: (14 * Math.PI) / 180,
          rootSwayAmplitude: 1
        }
      : projection === "diagonal"
        ? {
            strideAmplitude: 3,
            thighAmplitudeRadians: (14 * Math.PI) / 180,
            lowerLegAmplitudeRadians: (22 * Math.PI) / 180,
            kneeLift: 2.5,
            footLift: 4.5,
            armAmplitudeRadians: (11 * Math.PI) / 180,
            rootSwayAmplitude: 1
          }
        : {
            strideAmplitude: 2,
            thighAmplitudeRadians: (9 * Math.PI) / 180,
            lowerLegAmplitudeRadians: (18 * Math.PI) / 180,
            kneeLift: 2,
            footLift: 4,
            armAmplitudeRadians: (8 * Math.PI) / 180,
            rootSwayAmplitude: 1
          };
  return Object.freeze({
    version: 1,
    projection,
    nearSide,
    stepAxis: Object.freeze(stepAxis),
    rootSwayAxis: Object.freeze(rootSwayAxis),
    ...amplitudes,
    bendSign: Object.freeze(bendSign)
  });
}

function defineDirectionRig(
  direction: RigSourceDirection,
  coordinates: JointCoordinates,
  motionProfile: DirectionMotionProfile
): DirectionRig {
  return Object.freeze({
    direction,
    joints: defineJoints(coordinates),
    motionProfile
  });
}

const DIAGONAL_AXIS = Math.SQRT1_2;

export const HUMANOID_80_DIRECTION_RIGS: readonly DirectionRig[] =
  Object.freeze([
    defineDirectionRig(
      "south",
      {
        root: [64, 112],
        pelvis: [64, 78],
        chest: [64, 58],
        neck: [64, 44],
        head: [64, 34],
        "shoulder.left": [52, 52],
        "elbow.left": [49, 68],
        "wrist.left": [48, 82],
        "hand.left": [47, 86],
        "shoulder.right": [76, 52],
        "elbow.right": [79, 68],
        "wrist.right": [80, 82],
        "hand.right": [81, 86],
        "hip.left": [58, 78],
        "knee.left": [57, 95],
        "ankle.left": [56, 109],
        "toe.left": [53, 112],
        "hip.right": [70, 78],
        "knee.right": [71, 95],
        "ankle.right": [72, 109],
        "toe.right": [75, 112]
      },
      defineMotionProfile(
        "front",
        "balanced",
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { left: -1, right: 1 }
      )
    ),
    defineDirectionRig(
      "southEast",
      {
        root: [64, 112],
        pelvis: [64, 78],
        chest: [63, 58],
        neck: [63, 44],
        head: [64, 34],
        "shoulder.left": [58, 53],
        "elbow.left": [56, 68],
        "wrist.left": [56, 81],
        "hand.left": [56, 86],
        "shoulder.right": [73, 51],
        "elbow.right": [76, 66],
        "wrist.right": [79, 79],
        "hand.right": [80, 84],
        "hip.left": [61, 79],
        "knee.left": [62, 95],
        "ankle.left": [61, 109],
        "toe.left": [59, 112],
        "hip.right": [69, 77],
        "knee.right": [72, 94],
        "ankle.right": [75, 108],
        "toe.right": [78, 111]
      },
      defineMotionProfile(
        "diagonal",
        "right",
        { x: DIAGONAL_AXIS, y: DIAGONAL_AXIS },
        { x: -DIAGONAL_AXIS, y: DIAGONAL_AXIS },
        { left: -1, right: 1 }
      )
    ),
    defineDirectionRig(
      "east",
      {
        root: [64, 112],
        pelvis: [62, 78],
        chest: [61, 58],
        neck: [61, 44],
        head: [65, 34],
        "shoulder.left": [60, 53],
        "elbow.left": [58, 68],
        "wrist.left": [59, 82],
        "hand.left": [61, 86],
        "shoulder.right": [65, 51],
        "elbow.right": [68, 66],
        "wrist.right": [72, 79],
        "hand.right": [74, 83],
        "hip.left": [61, 79],
        "knee.left": [60, 95],
        "ankle.left": [60, 109],
        "toe.left": [63, 112],
        "hip.right": [64, 77],
        "knee.right": [67, 94],
        "ankle.right": [69, 108],
        "toe.right": [73, 110]
      },
      defineMotionProfile(
        "side",
        "right",
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { left: -1, right: 1 }
      )
    ),
    defineDirectionRig(
      "northEast",
      {
        root: [64, 112],
        pelvis: [64, 78],
        chest: [64, 58],
        neck: [64, 44],
        head: [63, 34],
        "shoulder.left": [56, 51],
        "elbow.left": [52, 66],
        "wrist.left": [50, 80],
        "hand.left": [49, 85],
        "shoulder.right": [72, 53],
        "elbow.right": [74, 68],
        "wrist.right": [75, 81],
        "hand.right": [76, 85],
        "hip.left": [60, 77],
        "knee.left": [58, 94],
        "ankle.left": [56, 108],
        "toe.left": [53, 111],
        "hip.right": [68, 79],
        "knee.right": [69, 95],
        "ankle.right": [70, 109],
        "toe.right": [72, 112]
      },
      defineMotionProfile(
        "diagonal",
        "left",
        { x: DIAGONAL_AXIS, y: -DIAGONAL_AXIS },
        { x: DIAGONAL_AXIS, y: DIAGONAL_AXIS },
        { left: 1, right: -1 }
      )
    ),
    defineDirectionRig(
      "north",
      {
        root: [64, 112],
        pelvis: [64, 78],
        chest: [64, 58],
        neck: [64, 44],
        head: [64, 34],
        "shoulder.left": [53, 51],
        "elbow.left": [50, 67],
        "wrist.left": [49, 81],
        "hand.left": [48, 86],
        "shoulder.right": [75, 51],
        "elbow.right": [78, 67],
        "wrist.right": [79, 81],
        "hand.right": [80, 86],
        "hip.left": [59, 78],
        "knee.left": [58, 95],
        "ankle.left": [57, 109],
        "toe.left": [54, 112],
        "hip.right": [69, 78],
        "knee.right": [70, 95],
        "ankle.right": [71, 109],
        "toe.right": [74, 112]
      },
      defineMotionProfile(
        "back",
        "balanced",
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { left: 1, right: -1 }
      )
    )
  ]);

function defineBone(
  id: BoneId,
  parentJointId: JointId,
  childJointId: JointId,
  parentBoneId: BoneId | null,
  role: BoneRole
): BoneDefinition {
  return Object.freeze({
    id,
    parentJointId,
    childJointId,
    parentBoneId,
    role
  });
}

export const HUMANOID_80_BONES: readonly BoneDefinition[] = Object.freeze([
  defineBone("root.pelvis", "root", "pelvis", null, "structure"),
  defineBone("pelvis.chest", "pelvis", "chest", "root.pelvis", "structure"),
  defineBone("chest.neck", "chest", "neck", "pelvis.chest", "structure"),
  defineBone("neck.head", "neck", "head", "chest.neck", "structure"),
  defineBone("chest.shoulder.left", "chest", "shoulder.left", "pelvis.chest", "connector"),
  defineBone("shoulder.left.elbow.left", "shoulder.left", "elbow.left", "chest.shoulder.left", "limb"),
  defineBone("elbow.left.wrist.left", "elbow.left", "wrist.left", "shoulder.left.elbow.left", "limb"),
  defineBone("wrist.left.hand.left", "wrist.left", "hand.left", "elbow.left.wrist.left", "limb"),
  defineBone("chest.shoulder.right", "chest", "shoulder.right", "pelvis.chest", "connector"),
  defineBone("shoulder.right.elbow.right", "shoulder.right", "elbow.right", "chest.shoulder.right", "limb"),
  defineBone("elbow.right.wrist.right", "elbow.right", "wrist.right", "shoulder.right.elbow.right", "limb"),
  defineBone("wrist.right.hand.right", "wrist.right", "hand.right", "elbow.right.wrist.right", "limb"),
  defineBone("pelvis.hip.left", "pelvis", "hip.left", "root.pelvis", "connector"),
  defineBone("hip.left.knee.left", "hip.left", "knee.left", "pelvis.hip.left", "limb"),
  defineBone("knee.left.ankle.left", "knee.left", "ankle.left", "hip.left.knee.left", "limb"),
  defineBone("ankle.left.toe.left", "ankle.left", "toe.left", "knee.left.ankle.left", "limb"),
  defineBone("pelvis.hip.right", "pelvis", "hip.right", "root.pelvis", "connector"),
  defineBone("hip.right.knee.right", "hip.right", "knee.right", "pelvis.hip.right", "limb"),
  defineBone("knee.right.ankle.right", "knee.right", "ankle.right", "hip.right.knee.right", "limb"),
  defineBone("ankle.right.toe.right", "ankle.right", "toe.right", "knee.right.ankle.right", "limb")
]);

function defineSlotBinding(
  slotId: RequiredPartSlot,
  boneId: BoneId,
  proximalJointId: JointId,
  distalJointId?: JointId
): SlotBinding {
  return Object.freeze(
    distalJointId
      ? {
          slotId,
          boneId,
          proximalJointId,
          distalJointId,
          sourceAnchorRequirement: "twoPoint" as const
        }
      : {
          slotId,
          boneId,
          proximalJointId,
          sourceAnchorRequirement: "singlePoint" as const,
          defaultSourceOrientation: -Math.PI / 2
        }
  );
}

export const HUMANOID_80_SLOT_BINDINGS: readonly SlotBinding[] = Object.freeze([
  defineSlotBinding("head", "neck.head", "neck"),
  defineSlotBinding("torso", "pelvis.chest", "pelvis"),
  defineSlotBinding("pelvis", "root.pelvis", "root"),
  defineSlotBinding("arm.left.upper", "shoulder.left.elbow.left", "shoulder.left", "elbow.left"),
  defineSlotBinding("arm.left.lower", "elbow.left.wrist.left", "elbow.left", "wrist.left"),
  defineSlotBinding("hand.left", "wrist.left.hand.left", "wrist.left", "hand.left"),
  defineSlotBinding("arm.right.upper", "shoulder.right.elbow.right", "shoulder.right", "elbow.right"),
  defineSlotBinding("arm.right.lower", "elbow.right.wrist.right", "elbow.right", "wrist.right"),
  defineSlotBinding("hand.right", "wrist.right.hand.right", "wrist.right", "hand.right"),
  defineSlotBinding("leg.left.upper", "hip.left.knee.left", "hip.left", "knee.left"),
  defineSlotBinding("leg.left.lower", "knee.left.ankle.left", "knee.left", "ankle.left"),
  defineSlotBinding("foot.left", "ankle.left.toe.left", "ankle.left", "toe.left"),
  defineSlotBinding("leg.right.upper", "hip.right.knee.right", "hip.right", "knee.right"),
  defineSlotBinding("leg.right.lower", "knee.right.ankle.right", "knee.right", "ankle.right"),
  defineSlotBinding("foot.right", "ankle.right.toe.right", "ankle.right", "toe.right")
]);

export const HUMANOID_80_RIG_TEMPLATE: RigTemplate = Object.freeze({
  id: HUMANOID_80_RIG_TEMPLATE_ID,
  directionContractVersion: DIRECTION_CONTRACT_VERSION,
  anchorContractVersion: ANCHOR_CONTRACT_VERSION,
  slotContractVersion: REQUIRED_SLOT_CONTRACT_VERSION,
  frameProfile: HUMANOID_80_FRAME_PROFILE,
  directions: HUMANOID_80_DIRECTION_RIGS,
  bones: HUMANOID_80_BONES,
  slotBindings: HUMANOID_80_SLOT_BINDINGS
});

export const BUILT_IN_RIG_TEMPLATES: readonly RigTemplate[] = Object.freeze([
  HUMANOID_80_RIG_TEMPLATE
]);

export function getBuiltInRigTemplate(
  rigTemplateId: string
): RigTemplate | null {
  return (
    BUILT_IN_RIG_TEMPLATES.find((template) => template.id === rigTemplateId) ??
    null
  );
}

export function isRigSourceDirection(
  direction: Direction
): direction is RigSourceDirection {
  return (RIG_SOURCE_DIRECTION_IDS as readonly Direction[]).includes(direction);
}
