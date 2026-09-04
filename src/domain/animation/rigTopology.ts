import type { RequiredPartSlot } from "./slots";

export const JOINT_IDS = Object.freeze([
  "root",
  "pelvis",
  "chest",
  "neck",
  "head",
  "shoulder.left",
  "elbow.left",
  "wrist.left",
  "hand.left",
  "shoulder.right",
  "elbow.right",
  "wrist.right",
  "hand.right",
  "hip.left",
  "knee.left",
  "ankle.left",
  "toe.left",
  "hip.right",
  "knee.right",
  "ankle.right",
  "toe.right"
] as const);

export const BONE_IDS = Object.freeze([
  "root.pelvis",
  "pelvis.chest",
  "chest.neck",
  "neck.head",
  "chest.shoulder.left",
  "shoulder.left.elbow.left",
  "elbow.left.wrist.left",
  "wrist.left.hand.left",
  "chest.shoulder.right",
  "shoulder.right.elbow.right",
  "elbow.right.wrist.right",
  "wrist.right.hand.right",
  "pelvis.hip.left",
  "hip.left.knee.left",
  "knee.left.ankle.left",
  "ankle.left.toe.left",
  "pelvis.hip.right",
  "hip.right.knee.right",
  "knee.right.ankle.right",
  "ankle.right.toe.right"
] as const);

export type JointId = (typeof JOINT_IDS)[number];
export type BoneId = (typeof BONE_IDS)[number];

export interface BoneTopologyDefinition {
  readonly id: BoneId;
  readonly parentJointId: JointId;
  readonly childJointId: JointId;
}

export type SourceAnchorRequirement = "singlePoint" | "twoPoint";

export interface RequiredSlotJointBinding {
  readonly slotId: RequiredPartSlot;
  readonly boneId: BoneId;
  readonly parentJointId: JointId;
  readonly childJointId: JointId;
  readonly sourceAnchorRequirement: SourceAnchorRequirement;
}

type JointPair = Readonly<{
  parentJointId: JointId;
  childJointId: JointId;
}>;

export const BONE_TOPOLOGY_BY_ID = Object.freeze({
  "root.pelvis": Object.freeze({
    parentJointId: "root",
    childJointId: "pelvis"
  }),
  "pelvis.chest": Object.freeze({
    parentJointId: "pelvis",
    childJointId: "chest"
  }),
  "chest.neck": Object.freeze({
    parentJointId: "chest",
    childJointId: "neck"
  }),
  "neck.head": Object.freeze({
    parentJointId: "neck",
    childJointId: "head"
  }),
  "chest.shoulder.left": Object.freeze({
    parentJointId: "chest",
    childJointId: "shoulder.left"
  }),
  "shoulder.left.elbow.left": Object.freeze({
    parentJointId: "shoulder.left",
    childJointId: "elbow.left"
  }),
  "elbow.left.wrist.left": Object.freeze({
    parentJointId: "elbow.left",
    childJointId: "wrist.left"
  }),
  "wrist.left.hand.left": Object.freeze({
    parentJointId: "wrist.left",
    childJointId: "hand.left"
  }),
  "chest.shoulder.right": Object.freeze({
    parentJointId: "chest",
    childJointId: "shoulder.right"
  }),
  "shoulder.right.elbow.right": Object.freeze({
    parentJointId: "shoulder.right",
    childJointId: "elbow.right"
  }),
  "elbow.right.wrist.right": Object.freeze({
    parentJointId: "elbow.right",
    childJointId: "wrist.right"
  }),
  "wrist.right.hand.right": Object.freeze({
    parentJointId: "wrist.right",
    childJointId: "hand.right"
  }),
  "pelvis.hip.left": Object.freeze({
    parentJointId: "pelvis",
    childJointId: "hip.left"
  }),
  "hip.left.knee.left": Object.freeze({
    parentJointId: "hip.left",
    childJointId: "knee.left"
  }),
  "knee.left.ankle.left": Object.freeze({
    parentJointId: "knee.left",
    childJointId: "ankle.left"
  }),
  "ankle.left.toe.left": Object.freeze({
    parentJointId: "ankle.left",
    childJointId: "toe.left"
  }),
  "pelvis.hip.right": Object.freeze({
    parentJointId: "pelvis",
    childJointId: "hip.right"
  }),
  "hip.right.knee.right": Object.freeze({
    parentJointId: "hip.right",
    childJointId: "knee.right"
  }),
  "knee.right.ankle.right": Object.freeze({
    parentJointId: "knee.right",
    childJointId: "ankle.right"
  }),
  "ankle.right.toe.right": Object.freeze({
    parentJointId: "ankle.right",
    childJointId: "toe.right"
  })
} satisfies Readonly<Record<BoneId, JointPair>>);

export const BONE_TOPOLOGY: readonly BoneTopologyDefinition[] = Object.freeze(
  BONE_IDS.map((id) => Object.freeze({ id, ...BONE_TOPOLOGY_BY_ID[id] }))
);

function bindRequiredSlot(
  slotId: RequiredPartSlot,
  boneId: BoneId,
  sourceAnchorRequirement: SourceAnchorRequirement
): RequiredSlotJointBinding {
  return Object.freeze({
    slotId,
    boneId,
    ...BONE_TOPOLOGY_BY_ID[boneId],
    sourceAnchorRequirement
  });
}

export const REQUIRED_SLOT_JOINT_BINDINGS: readonly RequiredSlotJointBinding[] =
  Object.freeze([
    bindRequiredSlot("head", "neck.head", "singlePoint"),
    bindRequiredSlot("torso", "pelvis.chest", "singlePoint"),
    bindRequiredSlot("pelvis", "root.pelvis", "singlePoint"),
    bindRequiredSlot(
      "arm.left.upper",
      "shoulder.left.elbow.left",
      "twoPoint"
    ),
    bindRequiredSlot(
      "arm.left.lower",
      "elbow.left.wrist.left",
      "twoPoint"
    ),
    bindRequiredSlot("hand.left", "wrist.left.hand.left", "twoPoint"),
    bindRequiredSlot(
      "arm.right.upper",
      "shoulder.right.elbow.right",
      "twoPoint"
    ),
    bindRequiredSlot(
      "arm.right.lower",
      "elbow.right.wrist.right",
      "twoPoint"
    ),
    bindRequiredSlot("hand.right", "wrist.right.hand.right", "twoPoint"),
    bindRequiredSlot(
      "leg.left.upper",
      "hip.left.knee.left",
      "twoPoint"
    ),
    bindRequiredSlot(
      "leg.left.lower",
      "knee.left.ankle.left",
      "twoPoint"
    ),
    bindRequiredSlot("foot.left", "ankle.left.toe.left", "twoPoint"),
    bindRequiredSlot(
      "leg.right.upper",
      "hip.right.knee.right",
      "twoPoint"
    ),
    bindRequiredSlot(
      "leg.right.lower",
      "knee.right.ankle.right",
      "twoPoint"
    ),
    bindRequiredSlot("foot.right", "ankle.right.toe.right", "twoPoint")
  ]);

const jointIds = new Set<string>(JOINT_IDS);
const boneIds = new Set<string>(BONE_IDS);

export function isJointId(value: unknown): value is JointId {
  return typeof value === "string" && jointIds.has(value);
}

export function isBoneId(value: unknown): value is BoneId {
  return typeof value === "string" && boneIds.has(value);
}
