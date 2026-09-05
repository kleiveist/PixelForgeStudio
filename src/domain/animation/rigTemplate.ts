import type { FrameProfile, Point, RigTemplateId } from "./animation.types";
import type { Direction } from "./directions";
import {
  BONE_IDS,
  JOINT_IDS,
  type BoneId,
  type JointId
} from "./rigTopology";
import {
  REQUIRED_PART_SLOT_IDS,
  type RequiredPartSlot
} from "./slots";
import { vectorLength } from "./vectors";

export const RIG_SOURCE_DIRECTION_IDS = Object.freeze([
  "south",
  "southEast",
  "east",
  "northEast",
  "north"
] as const);

export const RIG_COORDINATE_EPSILON = 1e-6;
export const RIG_GROUNDLINE_TOLERANCE = 4;

export type RigSourceDirection = (typeof RIG_SOURCE_DIRECTION_IDS)[number];
export type RigProjection = "front" | "diagonal" | "side" | "back";
export type RigNearSide = "left" | "right" | "balanced";
export type BoneRole = "structure" | "connector" | "limb";

export interface JointDefinition {
  readonly id: JointId;
  readonly position: Point;
}

export interface BoneDefinition {
  readonly id: BoneId;
  readonly parentJointId: JointId;
  readonly childJointId: JointId;
  readonly parentBoneId: BoneId | null;
  readonly role: BoneRole;
}

export interface SlotBinding {
  readonly slotId: RequiredPartSlot;
  readonly boneId: BoneId;
  readonly proximalJointId: JointId;
  readonly distalJointId?: JointId;
  readonly sourceAnchorRequirement: "singlePoint" | "twoPoint";
  /** Source-space orientation used only when a part has one anchor. */
  readonly defaultSourceOrientation?: number;
}

export interface DirectionMotionProfile {
  readonly version: 1;
  readonly projection: RigProjection;
  readonly nearSide: RigNearSide;
  /** Normalized visible travel axis. */
  readonly stepAxis: Point;
  readonly strideAmplitude: number;
  readonly thighAmplitudeRadians: number;
  readonly lowerLegAmplitudeRadians: number;
  readonly kneeLift: number;
  readonly footLift: number;
  readonly armAmplitudeRadians: number;
  readonly rootSwayAxis: Point;
  readonly rootSwayAmplitude: number;
  readonly bendSign: Readonly<Record<"left" | "right", -1 | 1>>;
}

export interface DirectionRig {
  /** Built-in templates author five source directions; runtime projections may use all eight. */
  readonly direction: Direction;
  readonly joints: Readonly<Record<JointId, JointDefinition>>;
  readonly motionProfile: DirectionMotionProfile;
}

export interface RigTemplate {
  readonly id: RigTemplateId;
  readonly directionContractVersion: 1;
  readonly anchorContractVersion: 1;
  readonly slotContractVersion: 1;
  readonly frameProfile: FrameProfile;
  readonly directions: readonly DirectionRig[];
  readonly bones: readonly BoneDefinition[];
  readonly slotBindings: readonly SlotBinding[];
}

export const RIG_VALIDATION_ISSUE_CODES = Object.freeze([
  "invalidFrameProfile",
  "missingDirection",
  "duplicateDirection",
  "missingJoint",
  "jointIdMismatch",
  "jointOutOfFrame",
  "invalidMotionProfile",
  "duplicateBone",
  "missingBone",
  "missingBoneJoint",
  "missingParentBone",
  "invalidBoneHierarchy",
  "cyclicBoneHierarchy",
  "zeroLengthBone",
  "missingSlotBinding",
  "duplicateSlotBinding",
  "invalidSlotBinding",
  "groundlineViolation"
] as const);

export type RigValidationIssueCode =
  (typeof RIG_VALIDATION_ISSUE_CODES)[number];

export interface RigValidationIssue {
  readonly code: RigValidationIssueCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export type RigValidationResult =
  | Readonly<{ valid: true; issues: readonly [] }>
  | Readonly<{ valid: false; issues: readonly RigValidationIssue[] }>;

function addIssue(
  issues: RigValidationIssue[],
  code: RigValidationIssueCode,
  path: readonly (string | number)[],
  message: string
): void {
  issues.push(Object.freeze({ code, path: Object.freeze([...path]), message }));
}

function validateFrameProfile(
  frameProfile: FrameProfile,
  issues: RigValidationIssue[]
): void {
  const { width, height } = frameProfile.frameSize;
  const { x, y } = frameProfile.footAnchor;
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    !Number.isFinite(frameProfile.characterHeight) ||
    frameProfile.characterHeight <= 0 ||
    frameProfile.characterHeight > height ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    x >= width ||
    y < 0 ||
    y >= height
  ) {
    addIssue(
      issues,
      "invalidFrameProfile",
      ["frameProfile"],
      "Frame size, character height, and foot anchor must form a finite in-frame profile."
    );
  }
}

function validateDirectionRigs(
  template: RigTemplate,
  issues: RigValidationIssue[]
): void {
  const directions = new Map<Direction, DirectionRig>();
  template.directions.forEach((directionRig, directionIndex) => {
    if (directions.has(directionRig.direction)) {
      addIssue(
        issues,
        "duplicateDirection",
        ["directions", directionIndex, "direction"],
        `Direction rig "${directionRig.direction}" occurs more than once.`
      );
    } else {
      directions.set(directionRig.direction, directionRig);
    }

    const stepLength = vectorLength(directionRig.motionProfile.stepAxis);
    const swayLength = vectorLength(directionRig.motionProfile.rootSwayAxis);
    const amplitudes = [
      directionRig.motionProfile.strideAmplitude,
      directionRig.motionProfile.thighAmplitudeRadians,
      directionRig.motionProfile.lowerLegAmplitudeRadians,
      directionRig.motionProfile.kneeLift,
      directionRig.motionProfile.footLift,
      directionRig.motionProfile.armAmplitudeRadians,
      directionRig.motionProfile.rootSwayAmplitude
    ];
    if (
      directionRig.motionProfile.version !== 1 ||
      !Number.isFinite(stepLength) ||
      Math.abs(stepLength - 1) > RIG_COORDINATE_EPSILON ||
      !Number.isFinite(swayLength) ||
      Math.abs(swayLength - 1) > RIG_COORDINATE_EPSILON ||
      amplitudes.some((value) => !Number.isFinite(value) || value < 0)
    ) {
      addIssue(
        issues,
        "invalidMotionProfile",
        ["directions", directionIndex, "motionProfile"],
        "Direction motion profile must use version 1, normalized step/sway axes, and finite non-negative amplitudes."
      );
    }

    const runtimeJoints = directionRig.joints as Partial<
      Record<JointId, JointDefinition>
    >;
    for (const jointId of JOINT_IDS) {
      const joint = runtimeJoints[jointId];
      const jointPath = ["directions", directionIndex, "joints", jointId] as const;
      if (!joint) {
        addIssue(
          issues,
          "missingJoint",
          jointPath,
          `Direction "${directionRig.direction}" is missing joint "${jointId}".`
        );
        continue;
      }
      if (joint.id !== jointId) {
        addIssue(
          issues,
          "jointIdMismatch",
          [...jointPath, "id"],
          `Joint map key "${jointId}" does not match definition "${joint.id}".`
        );
      }
      const { x, y } = joint.position;
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        x >= template.frameProfile.frameSize.width ||
        y < 0 ||
        y >= template.frameProfile.frameSize.height
      ) {
        addIssue(
          issues,
          "jointOutOfFrame",
          [...jointPath, "position"],
          `Joint "${jointId}" must be finite and inside the template frame.`
        );
      }
    }

    const root = runtimeJoints.root?.position;
    if (
      root &&
      (root.x !== template.frameProfile.footAnchor.x ||
        root.y !== template.frameProfile.footAnchor.y)
    ) {
      addIssue(
        issues,
        "groundlineViolation",
        ["directions", directionIndex, "joints", "root", "position"],
        "Root joint must match the frame foot anchor exactly."
      );
    }
    for (const jointId of [
      "ankle.left",
      "toe.left",
      "ankle.right",
      "toe.right"
    ] as const) {
      const position = runtimeJoints[jointId]?.position;
      if (
        position &&
        Math.abs(position.y - template.frameProfile.footAnchor.y) >
          RIG_GROUNDLINE_TOLERANCE
      ) {
        addIssue(
          issues,
          "groundlineViolation",
          ["directions", directionIndex, "joints", jointId, "position", "y"],
          `Joint "${jointId}" must remain within ${RIG_GROUNDLINE_TOLERANCE} px of the groundline.`
        );
      }
    }
  });

  for (const direction of RIG_SOURCE_DIRECTION_IDS) {
    if (!directions.has(direction)) {
      addIssue(
        issues,
        "missingDirection",
        ["directions"],
        `Rig template is missing source direction "${direction}".`
      );
    }
  }
}

function validateBones(
  template: RigTemplate,
  issues: RigValidationIssue[]
): void {
  const bones = new Map<BoneId, BoneDefinition>();
  template.bones.forEach((bone, boneIndex) => {
    if (bones.has(bone.id)) {
      addIssue(
        issues,
        "duplicateBone",
        ["bones", boneIndex, "id"],
        `Bone "${bone.id}" occurs more than once.`
      );
    } else {
      bones.set(bone.id, bone);
    }

    if (!JOINT_IDS.includes(bone.parentJointId)) {
      addIssue(
        issues,
        "missingBoneJoint",
        ["bones", boneIndex, "parentJointId"],
        `Bone "${bone.id}" references an unknown parent joint.`
      );
    }
    if (!JOINT_IDS.includes(bone.childJointId)) {
      addIssue(
        issues,
        "missingBoneJoint",
        ["bones", boneIndex, "childJointId"],
        `Bone "${bone.id}" references an unknown child joint.`
      );
    }
  });

  for (const boneId of BONE_IDS) {
    if (!bones.has(boneId)) {
      addIssue(
        issues,
        "missingBone",
        ["bones"],
        `Rig template is missing required bone "${boneId}".`
      );
    }
  }

  template.bones.forEach((bone, boneIndex) => {
    if (bone.parentBoneId === null) return;
    const parentBone = bones.get(bone.parentBoneId);
    if (!parentBone) {
      addIssue(
        issues,
        "missingParentBone",
        ["bones", boneIndex, "parentBoneId"],
        `Bone "${bone.id}" references missing parent bone "${bone.parentBoneId}".`
      );
      return;
    }
    if (parentBone.childJointId !== bone.parentJointId) {
      addIssue(
        issues,
        "invalidBoneHierarchy",
        ["bones", boneIndex, "parentBoneId"],
        `Parent bone "${parentBone.id}" must end at joint "${bone.parentJointId}".`
      );
    }
  });

  const completed = new Set<BoneId>();
  const reportedCycles = new Set<BoneId>();
  const visit = (boneId: BoneId, active: Set<BoneId>): void => {
    if (completed.has(boneId)) return;
    if (active.has(boneId)) {
      if (!reportedCycles.has(boneId)) {
        reportedCycles.add(boneId);
        addIssue(
          issues,
          "cyclicBoneHierarchy",
          ["bones", boneId],
          `Bone hierarchy contains a cycle at "${boneId}".`
        );
      }
      return;
    }
    const bone = bones.get(boneId);
    if (!bone) return;
    active.add(boneId);
    if (bone.parentBoneId !== null) visit(bone.parentBoneId, active);
    active.delete(boneId);
    completed.add(boneId);
  };
  for (const bone of template.bones) visit(bone.id, new Set());

  template.directions.forEach((directionRig, directionIndex) => {
    const joints = directionRig.joints as Partial<
      Record<JointId, JointDefinition>
    >;
    template.bones.forEach((bone, boneIndex) => {
      if (bone.role !== "limb") return;
      const parent = joints[bone.parentJointId]?.position;
      const child = joints[bone.childJointId]?.position;
      if (!parent || !child) return;
      if (vectorLength({ x: child.x - parent.x, y: child.y - parent.y }) <= RIG_COORDINATE_EPSILON) {
        addIssue(
          issues,
          "zeroLengthBone",
          ["directions", directionIndex, "bones", boneIndex],
          `Limb bone "${bone.id}" must have length greater than epsilon.`
        );
      }
    });
  });
}

function validateSlotBindings(
  template: RigTemplate,
  issues: RigValidationIssue[]
): void {
  const bones = new Map(template.bones.map((bone) => [bone.id, bone]));
  const bindings = new Map<RequiredPartSlot, SlotBinding>();
  template.slotBindings.forEach((binding, bindingIndex) => {
    if (bindings.has(binding.slotId)) {
      addIssue(
        issues,
        "duplicateSlotBinding",
        ["slotBindings", bindingIndex, "slotId"],
        `Required slot "${binding.slotId}" occurs more than once.`
      );
    } else {
      bindings.set(binding.slotId, binding);
    }
    const bone = bones.get(binding.boneId);
    const twoPointIsValid =
      binding.sourceAnchorRequirement === "twoPoint" &&
      binding.distalJointId === bone?.childJointId &&
      binding.defaultSourceOrientation === undefined;
    const singlePointIsValid =
      binding.sourceAnchorRequirement === "singlePoint" &&
      binding.distalJointId === undefined &&
      Number.isFinite(binding.defaultSourceOrientation);
    if (
      !bone ||
      binding.proximalJointId !== bone.parentJointId ||
      (!twoPointIsValid && !singlePointIsValid)
    ) {
      addIssue(
        issues,
        "invalidSlotBinding",
        ["slotBindings", bindingIndex],
        `Slot "${binding.slotId}" must match its bone and anchor requirement.`
      );
    }
  });

  for (const slotId of REQUIRED_PART_SLOT_IDS) {
    if (!bindings.has(slotId)) {
      addIssue(
        issues,
        "missingSlotBinding",
        ["slotBindings"],
        `Rig template is missing required slot binding "${slotId}".`
      );
    }
  }
}

export function validateRigTemplate(template: RigTemplate): RigValidationResult {
  const issues: RigValidationIssue[] = [];
  validateFrameProfile(template.frameProfile, issues);
  validateDirectionRigs(template, issues);
  validateBones(template, issues);
  validateSlotBindings(template, issues);
  return issues.length === 0
    ? Object.freeze({ valid: true, issues: Object.freeze([] as const) })
    : Object.freeze({ valid: false, issues: Object.freeze(issues) });
}

export function findDirectionRig(
  template: RigTemplate,
  direction: Direction
): DirectionRig | null {
  return (
    template.directions.find((candidate) => candidate.direction === direction) ??
    null
  );
}

export function findSlotBinding(
  template: RigTemplate,
  slotId: RequiredPartSlot
): SlotBinding | null {
  return template.slotBindings.find((binding) => binding.slotId === slotId) ?? null;
}

/**
 * Stable compatibility contract for reference-sharing between projects and kits.
 * Pose coordinates, labels and motion tuning are deliberately excluded.
 */
export function createRigCompatibilityKey(
  template: RigTemplate,
  frameProfile: FrameProfile = template.frameProfile
): string {
  const validation = validateRigTemplate(template);
  if (!validation.valid) {
    throw new TypeError(
      `Cannot create compatibility key for invalid rig: ${validation.issues[0]?.message ?? "unknown issue"}`
    );
  }

  if (
    !Number.isInteger(frameProfile.frameSize.width) ||
    frameProfile.frameSize.width <= 0 ||
    !Number.isInteger(frameProfile.frameSize.height) ||
    frameProfile.frameSize.height <= 0 ||
    !Number.isInteger(frameProfile.characterHeight) ||
    frameProfile.characterHeight <= 0 ||
    !Number.isFinite(frameProfile.footAnchor.x) ||
    !Number.isFinite(frameProfile.footAnchor.y)
  ) {
    throw new TypeError("Cannot create compatibility key for invalid frame profile.");
  }

  const frame = frameProfile;
  return [
    template.id,
    `frame-${frame.frameSize.width}x${frame.frameSize.height}`,
    `char-${frame.characterHeight}`,
    `foot-${frame.footAnchor.x}-${frame.footAnchor.y}`,
    `contracts-${template.anchorContractVersion}-${template.slotContractVersion}-${template.directionContractVersion}`
  ].join("__");
}
