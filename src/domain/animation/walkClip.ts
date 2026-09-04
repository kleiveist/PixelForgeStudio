import type { Point } from "./animation.types";
import { BONE_TOPOLOGY, JOINT_IDS, type JointId } from "./rigTopology";
import type {
  DirectionMotionProfile,
  DirectionRig,
  JointDefinition
} from "./rigTemplate";
import { clamp, vectorLength } from "./vectors";

export const HUMANOID_WALK_CLIP_VERSION = 1 as const;
export const HUMANOID_WALK_CLIP_ID = "walk-humanoid-8-v1" as const;
export const HUMANOID_WALK_FRAME_COUNT = 8 as const;
export const HUMANOID_WALK_DEFAULT_FPS = 10 as const;
export const HUMANOID_WALK_LOOP = true as const;
export const WALK_ROOT_BOB_LIMIT = 1;
export const TWO_BONE_IK_EPSILON = 1e-6;

export const HUMANOID_WALK_PHASES = Object.freeze([
  Object.freeze({ id: "contactLeft", label: "Kontakt links" }),
  Object.freeze({ id: "downLeft", label: "Down links" }),
  Object.freeze({ id: "passingLeft", label: "Passing links" }),
  Object.freeze({ id: "upLeft", label: "Up links" }),
  Object.freeze({ id: "contactRight", label: "Kontakt rechts" }),
  Object.freeze({ id: "downRight", label: "Down rechts" }),
  Object.freeze({ id: "passingRight", label: "Passing rechts" }),
  Object.freeze({ id: "upRight", label: "Up rechts" })
] as const);

export type HumanoidWalkPhaseId =
  (typeof HUMANOID_WALK_PHASES)[number]["id"];
export type HumanoidSide = "left" | "right";

const LEFT_STRIDE = Object.freeze([
  -1, -0.75, 0, 0.75, 1, 0.75, 0, -0.75
] as const);
const RIGHT_STRIDE = Object.freeze([
  1, 0.75, 0, -0.75, -1, -0.75, 0, 0.75
] as const);
const ROOT_BOB_Y = Object.freeze([0, 1, 0, -1, 0, 1, 0, -1] as const);
const ROOT_SWAY_X = Object.freeze([-1, -1, 0, 1, 1, 1, 0, -1] as const);
const LEFT_KNEE_LIFT = Object.freeze([
  0, 0, 0, 0, 0, 0.35, 0.75, 1
] as const);
const RIGHT_KNEE_LIFT = Object.freeze([
  0, 0.35, 0.75, 1, 0, 0, 0, 0
] as const);
const LEFT_FOOT_LIFT = Object.freeze([
  0, 0, 0, 0, 0, 0.25, 1, 0.65
] as const);
const RIGHT_FOOT_LIFT = Object.freeze([
  0, 0.25, 1, 0.65, 0, 0, 0, 0
] as const);

export interface HumanoidWalkChannels {
  readonly leftStride: readonly number[];
  readonly rightStride: readonly number[];
  readonly rootBobY: readonly number[];
  readonly rootSwayX: readonly number[];
  readonly leftArmSwing: readonly number[];
  readonly rightArmSwing: readonly number[];
  readonly leftKneeLift: readonly number[];
  readonly rightKneeLift: readonly number[];
  readonly leftFootLift: readonly number[];
  readonly rightFootLift: readonly number[];
}

export const HUMANOID_WALK_CHANNELS: HumanoidWalkChannels = Object.freeze({
  leftStride: LEFT_STRIDE,
  rightStride: RIGHT_STRIDE,
  rootBobY: ROOT_BOB_Y,
  rootSwayX: ROOT_SWAY_X,
  leftArmSwing: Object.freeze(RIGHT_STRIDE.map((value) => value * 0.75)),
  rightArmSwing: Object.freeze(LEFT_STRIDE.map((value) => value * 0.75)),
  leftKneeLift: LEFT_KNEE_LIFT,
  rightKneeLift: RIGHT_KNEE_LIFT,
  leftFootLift: LEFT_FOOT_LIFT,
  rightFootLift: RIGHT_FOOT_LIFT
});

export interface HumanoidWalkClipTemplate {
  readonly version: typeof HUMANOID_WALK_CLIP_VERSION;
  readonly templateId: typeof HUMANOID_WALK_CLIP_ID;
  readonly action: "walk";
  readonly frameCount: typeof HUMANOID_WALK_FRAME_COUNT;
  readonly defaultFps: typeof HUMANOID_WALK_DEFAULT_FPS;
  readonly loop: typeof HUMANOID_WALK_LOOP;
  readonly phases: typeof HUMANOID_WALK_PHASES;
  readonly channels: HumanoidWalkChannels;
}

export const HUMANOID_WALK_CLIP: HumanoidWalkClipTemplate = Object.freeze({
  version: HUMANOID_WALK_CLIP_VERSION,
  templateId: HUMANOID_WALK_CLIP_ID,
  action: "walk",
  frameCount: HUMANOID_WALK_FRAME_COUNT,
  defaultFps: HUMANOID_WALK_DEFAULT_FPS,
  loop: HUMANOID_WALK_LOOP,
  phases: HUMANOID_WALK_PHASES,
  channels: HUMANOID_WALK_CHANNELS
});

export interface ResolvedHumanoidWalkFrame {
  readonly templateId: typeof HUMANOID_WALK_CLIP_ID;
  readonly frameIndex: number;
  readonly phase: (typeof HUMANOID_WALK_PHASES)[number];
  readonly channels: Readonly<{
    leftStride: number;
    rightStride: number;
    rootBobY: number;
    rootSwayX: number;
    leftArmSwing: number;
    rightArmSwing: number;
    leftKneeLift: number;
    rightKneeLift: number;
    leftFootLift: number;
    rightFootLift: number;
  }>;
}

function channelValue(channel: readonly number[], frameIndex: number): number {
  const value = channel[frameIndex];
  if (value === undefined) {
    throw new RangeError(`Walk channel has no frame ${frameIndex}.`);
  }
  return value;
}

export function resolveClipFrame(
  frameIndex: number,
  template: HumanoidWalkClipTemplate = HUMANOID_WALK_CLIP
): ResolvedHumanoidWalkFrame {
  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new RangeError("Walk frame index must be a non-negative integer.");
  }
  const resolvedIndex = template.loop
    ? frameIndex % template.frameCount
    : Math.min(frameIndex, template.frameCount - 1);
  const phase = template.phases[resolvedIndex];
  if (!phase) throw new RangeError(`Walk template has no frame ${resolvedIndex}.`);
  return Object.freeze({
    templateId: template.templateId,
    frameIndex: resolvedIndex,
    phase,
    channels: Object.freeze({
      leftStride: channelValue(template.channels.leftStride, resolvedIndex),
      rightStride: channelValue(template.channels.rightStride, resolvedIndex),
      rootBobY: channelValue(template.channels.rootBobY, resolvedIndex),
      rootSwayX: channelValue(template.channels.rootSwayX, resolvedIndex),
      leftArmSwing: channelValue(
        template.channels.leftArmSwing,
        resolvedIndex
      ),
      rightArmSwing: channelValue(
        template.channels.rightArmSwing,
        resolvedIndex
      ),
      leftKneeLift: channelValue(
        template.channels.leftKneeLift,
        resolvedIndex
      ),
      rightKneeLift: channelValue(
        template.channels.rightKneeLift,
        resolvedIndex
      ),
      leftFootLift: channelValue(
        template.channels.leftFootLift,
        resolvedIndex
      ),
      rightFootLift: channelValue(
        template.channels.rightFootLift,
        resolvedIndex
      )
    })
  });
}

export interface HumanoidWalkPose {
  readonly templateId: typeof HUMANOID_WALK_CLIP_ID;
  readonly frameIndex: number;
  readonly phase: HumanoidWalkPhaseId;
  readonly channels: ResolvedHumanoidWalkFrame["channels"];
  readonly contact: Readonly<Record<HumanoidSide, boolean>>;
  readonly rootOffset: Point;
  readonly torsoCounterOffset: Point;
  readonly headCounterOffset: Point;
}

export interface ProjectedWalkChannels {
  readonly leftStride: Point;
  readonly rightStride: Point;
  readonly leftThighRotation: number;
  readonly rightThighRotation: number;
  readonly leftLowerLegRotation: number;
  readonly rightLowerLegRotation: number;
  readonly leftArmRotation: number;
  readonly rightArmRotation: number;
  readonly leftKneeLift: number;
  readonly rightKneeLift: number;
  readonly leftFootLift: number;
  readonly rightFootLift: number;
  readonly rootSway: Point;
  readonly rootBobY: number;
}

export interface DirectionalWalkPose extends HumanoidWalkPose {
  readonly direction: DirectionRig["direction"];
  readonly projected: ProjectedWalkChannels;
}

const NORMALIZED_ARM_CHANNEL_MAX = 0.75;

export function projectWalkChannels(
  frame: Pick<ResolvedHumanoidWalkFrame, "channels">,
  profile: DirectionMotionProfile
): ProjectedWalkChannels {
  const { channels } = frame;
  const stride = (value: number): Point => Object.freeze({
    x: profile.stepAxis.x * value * profile.strideAmplitude,
    y: profile.stepAxis.y * value * profile.strideAmplitude
  });
  const armRotation = (value: number): number =>
    (value / NORMALIZED_ARM_CHANNEL_MAX) * profile.armAmplitudeRadians;
  return Object.freeze({
    leftStride: stride(channels.leftStride),
    rightStride: stride(channels.rightStride),
    leftThighRotation:
      channels.leftStride * profile.thighAmplitudeRadians,
    rightThighRotation:
      channels.rightStride * profile.thighAmplitudeRadians,
    leftLowerLegRotation:
      -channels.leftStride * profile.lowerLegAmplitudeRadians,
    rightLowerLegRotation:
      -channels.rightStride * profile.lowerLegAmplitudeRadians,
    leftArmRotation: armRotation(channels.leftArmSwing),
    rightArmRotation: armRotation(channels.rightArmSwing),
    leftKneeLift: channels.leftKneeLift * profile.kneeLift,
    rightKneeLift: channels.rightKneeLift * profile.kneeLift,
    leftFootLift: channels.leftFootLift * profile.footLift,
    rightFootLift: channels.rightFootLift * profile.footLift,
    rootSway: Object.freeze({
      x:
        profile.rootSwayAxis.x *
        channels.rootSwayX *
        profile.rootSwayAmplitude,
      y:
        profile.rootSwayAxis.y *
        channels.rootSwayX *
        profile.rootSwayAmplitude
    }),
    rootBobY: clamp(
      channels.rootBobY,
      -WALK_ROOT_BOB_LIMIT,
      WALK_ROOT_BOB_LIMIT
    )
  });
}

export function resolveDirectionalWalkPose(
  rig: DirectionRig,
  frameIndex: number
): DirectionalWalkPose {
  const base = resolveHumanoidWalkPose(frameIndex);
  const projected = projectWalkChannels(base, rig.motionProfile);
  return Object.freeze({
    ...base,
    direction: rig.direction,
    projected,
    rootOffset: Object.freeze({
      x: projected.rootSway.x,
      y: projected.rootSway.y + projected.rootBobY
    }),
    torsoCounterOffset: Object.freeze({
      x: -projected.rootSway.x * 0.5,
      y: -projected.rootSway.y * 0.5 - projected.rootBobY * 0.4
    }),
    headCounterOffset: Object.freeze({
      x: -projected.rootSway.x * 0.75,
      y: -projected.rootSway.y * 0.75 - projected.rootBobY * 0.6
    })
  });
}

export function resolveHumanoidWalkPose(frameIndex: number): HumanoidWalkPose {
  const frame = resolveClipFrame(frameIndex);
  return Object.freeze({
    templateId: frame.templateId,
    frameIndex: frame.frameIndex,
    phase: frame.phase.id,
    channels: frame.channels,
    contact: Object.freeze({
      left: frame.frameIndex === 0 || frame.frameIndex === 1,
      right: frame.frameIndex === 4 || frame.frameIndex === 5
    }),
    rootOffset: Object.freeze({
      x: frame.channels.rootSwayX,
      y: frame.channels.rootBobY
    }),
    torsoCounterOffset: Object.freeze({
      x: -frame.channels.rootSwayX * 0.5,
      y: -frame.channels.rootBobY * 0.4
    }),
    headCounterOffset: Object.freeze({
      x: -frame.channels.rootSwayX * 0.75,
      y: -frame.channels.rootBobY * 0.6
    })
  });
}

export const TWO_BONE_IK_DIAGNOSTIC_CODES = Object.freeze([
  "targetClamped",
  "invalidInput"
] as const);

export type TwoBoneIkDiagnosticCode =
  (typeof TWO_BONE_IK_DIAGNOSTIC_CODES)[number];

export interface TwoBoneIkDiagnostic {
  readonly code: TwoBoneIkDiagnosticCode;
  readonly message: string;
  readonly requestedDistance: number;
  readonly resolvedDistance: number;
}

export interface TwoBoneIkInput {
  readonly root: Point;
  readonly target: Point;
  readonly upperLength: number;
  readonly lowerLength: number;
  readonly bendSign: -1 | 1;
}

export type TwoBoneIkResult =
  | Readonly<{
      status: "ok";
      joint: Point;
      end: Point;
      clamped: boolean;
      diagnostics: readonly TwoBoneIkDiagnostic[];
    }>
  | Readonly<{
      status: "invalid";
      diagnostics: readonly TwoBoneIkDiagnostic[];
    }>;

function finitePoint(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export function solveTwoBoneIk(input: TwoBoneIkInput): TwoBoneIkResult {
  const validLengths =
    Number.isFinite(input.upperLength) &&
    Number.isFinite(input.lowerLength) &&
    input.upperLength > TWO_BONE_IK_EPSILON &&
    input.lowerLength > TWO_BONE_IK_EPSILON;
  if (!finitePoint(input.root) || !finitePoint(input.target) || !validLengths) {
    return Object.freeze({
      status: "invalid",
      diagnostics: Object.freeze([
        Object.freeze({
          code: "invalidInput" as const,
          message: "Two-bone IK requires finite points and positive segment lengths.",
          requestedDistance: 0,
          resolvedDistance: 0
        })
      ])
    });
  }

  const deltaX = input.target.x - input.root.x;
  const deltaY = input.target.y - input.root.y;
  const requestedDistance = Math.hypot(deltaX, deltaY);
  const minimumDistance =
    Math.abs(input.upperLength - input.lowerLength) + TWO_BONE_IK_EPSILON;
  const maximumDistance =
    input.upperLength + input.lowerLength - TWO_BONE_IK_EPSILON;
  const resolvedDistance = clamp(
    requestedDistance,
    minimumDistance,
    maximumDistance
  );
  const directionX =
    requestedDistance <= TWO_BONE_IK_EPSILON
      ? 0
      : deltaX / requestedDistance;
  const directionY =
    requestedDistance <= TWO_BONE_IK_EPSILON
      ? 1
      : deltaY / requestedDistance;
  const end = Object.freeze({
    x: input.root.x + directionX * resolvedDistance,
    y: input.root.y + directionY * resolvedDistance
  });
  const along =
    (input.upperLength ** 2 - input.lowerLength ** 2 + resolvedDistance ** 2) /
    (2 * resolvedDistance);
  const perpendicular = Math.sqrt(
    Math.max(0, input.upperLength ** 2 - along ** 2)
  );
  const joint = Object.freeze({
    x:
      input.root.x +
      directionX * along +
      -directionY * perpendicular * input.bendSign,
    y:
      input.root.y +
      directionY * along +
      directionX * perpendicular * input.bendSign
  });
  const clamped =
    Math.abs(requestedDistance - resolvedDistance) > TWO_BONE_IK_EPSILON;
  return Object.freeze({
    status: "ok",
    joint,
    end,
    clamped,
    diagnostics: Object.freeze(
      clamped
        ? [
            Object.freeze({
              code: "targetClamped" as const,
              message: "Unreachable IK target was clamped to the valid limb range.",
              requestedDistance,
              resolvedDistance
            })
          ]
        : []
    )
  });
}

export const WALK_POSE_ISSUE_CODES = Object.freeze([
  "unsupportedDirection",
  "nonFiniteJoint",
  "invalidBoneLength",
  "groundContactViolation"
] as const);

export type WalkPoseIssueCode = (typeof WALK_POSE_ISSUE_CODES)[number];

export interface WalkPoseIssue {
  readonly code: WalkPoseIssueCode;
  readonly message: string;
  readonly jointId?: JointId;
  readonly boneId?: string;
}

export type WalkPoseValidationResult =
  | Readonly<{ valid: true; issues: readonly [] }>
  | Readonly<{ valid: false; issues: readonly WalkPoseIssue[] }>;

function poseIssue(
  code: WalkPoseIssueCode,
  message: string,
  reference?: Readonly<{ jointId?: JointId; boneId?: string }>
): WalkPoseIssue {
  return Object.freeze({ code, message, ...reference });
}

export function validatePose(rig: DirectionRig): WalkPoseValidationResult {
  const issues: WalkPoseIssue[] = [];
  for (const jointId of JOINT_IDS) {
    const joint = rig.joints[jointId];
    if (!joint || joint.id !== jointId || !finitePoint(joint.position)) {
      issues.push(
        poseIssue(
          "nonFiniteJoint",
          `Joint ${jointId} is missing or non-finite.`,
          { jointId }
        )
      );
    }
  }
  for (const bone of BONE_TOPOLOGY) {
    const parent = rig.joints[bone.parentJointId]?.position;
    const child = rig.joints[bone.childJointId]?.position;
    if (
      !parent ||
      !child ||
      !finitePoint(parent) ||
      !finitePoint(child) ||
      vectorLength({ x: child.x - parent.x, y: child.y - parent.y }) <=
        TWO_BONE_IK_EPSILON
    ) {
      issues.push(
        poseIssue(
          "invalidBoneLength",
          `Bone ${bone.id} requires a positive finite length.`,
          { boneId: bone.id }
        )
      );
    }
  }
  return issues.length === 0
    ? Object.freeze({ valid: true, issues: Object.freeze([] as const) })
    : Object.freeze({ valid: false, issues: Object.freeze(issues) });
}

export interface AppliedHumanoidWalkPose {
  readonly status: "ok";
  readonly rig: DirectionRig;
  readonly diagnostics: readonly TwoBoneIkDiagnostic[];
}

export type ApplyHumanoidWalkPoseResult =
  | AppliedHumanoidWalkPose
  | Readonly<{ status: "invalid"; issues: readonly WalkPoseIssue[] }>;

function shifted(point: Point, x: number, y: number): Point {
  return Object.freeze({ x: point.x + x, y: point.y + y });
}

function rotateVector(point: Point, radians: number): Point {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return Object.freeze({
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine
  });
}

function applyArmSwing(
  source: DirectionRig,
  positions: Record<JointId, Point>,
  side: HumanoidSide,
  rotationRadians: number
): void {
  const shoulderId = `shoulder.${side}` as JointId;
  const shoulder = positions[shoulderId];
  const sourceShoulder = source.joints[shoulderId].position;
  for (const jointId of [
    `elbow.${side}`,
    `wrist.${side}`,
    `hand.${side}`
  ] as const) {
    const sourcePoint = source.joints[jointId].position;
    const rotated = rotateVector(
      {
        x: sourcePoint.x - sourceShoulder.x,
        y: sourcePoint.y - sourceShoulder.y
      },
      rotationRadians
    );
    positions[jointId] = Object.freeze({
      x: shoulder.x + rotated.x,
      y: shoulder.y + rotated.y
    });
  }
}

function applyLegPose(
  source: DirectionRig,
  positions: Record<JointId, Point>,
  pose: DirectionalWalkPose,
  side: HumanoidSide,
  diagnostics: TwoBoneIkDiagnostic[]
): WalkPoseIssue | null {
  const hipId = `hip.${side}` as JointId;
  const kneeId = `knee.${side}` as JointId;
  const ankleId = `ankle.${side}` as JointId;
  const toeId = `toe.${side}` as JointId;
  const sourceHip = source.joints[hipId].position;
  const sourceKnee = source.joints[kneeId].position;
  const sourceAnkle = source.joints[ankleId].position;
  const sourceToe = source.joints[toeId].position;
  const hip = positions[hipId];
  const upperLength = Math.hypot(
    sourceKnee.x - sourceHip.x,
    sourceKnee.y - sourceHip.y
  );
  const lowerLength = Math.hypot(
    sourceAnkle.x - sourceKnee.x,
    sourceAnkle.y - sourceKnee.y
  );
  const stride =
    side === "left" ? pose.projected.leftStride : pose.projected.rightStride;
  const kneeLift =
    side === "left"
      ? pose.projected.leftKneeLift
      : pose.projected.rightKneeLift;
  const footLift =
    side === "left"
      ? pose.projected.leftFootLift
      : pose.projected.rightFootLift;
  const thighRotation =
    side === "left"
      ? pose.projected.leftThighRotation
      : pose.projected.rightThighRotation;
  const lowerLegRotation =
    side === "left"
      ? pose.projected.leftLowerLegRotation
      : pose.projected.rightLowerLegRotation;
  const lift = Math.max(kneeLift, footLift);
  const footVector = {
    x: sourceToe.x - sourceAnkle.x,
    y: sourceToe.y - sourceAnkle.y
  };
  const articulatedUpper = rotateVector(
    {
      x: sourceKnee.x - sourceHip.x,
      y: sourceKnee.y - sourceHip.y
    },
    thighRotation
  );
  const articulatedLower = rotateVector(
    {
      x: sourceAnkle.x - sourceKnee.x,
      y: sourceAnkle.y - sourceKnee.y
    },
    thighRotation + lowerLegRotation
  );
  const target = {
    x: hip.x + articulatedUpper.x + articulatedLower.x + stride.x,
    y: hip.y + articulatedUpper.y + articulatedLower.y + stride.y - lift
  };
  const solved = solveTwoBoneIk({
    root: hip,
    target,
    upperLength,
    lowerLength,
    bendSign: source.motionProfile.bendSign[side]
  });
  if (solved.status === "invalid") {
    return poseIssue(
      "invalidBoneLength",
      `${side} leg cannot be solved because its segment lengths are invalid.`,
      { boneId: `${hipId}.${kneeId}` }
    );
  }
  diagnostics.push(...solved.diagnostics);
  positions[kneeId] = solved.joint;
  positions[ankleId] = solved.end;
  positions[toeId] = Object.freeze({
    x: solved.end.x + footVector.x,
    y: pose.contact[side]
      ? source.joints.root.position.y
      : solved.end.y + footVector.y
  });
  return null;
}

function freezeJoints(
  positions: Readonly<Record<JointId, Point>>
): Readonly<Record<JointId, JointDefinition>> {
  return Object.freeze(
    Object.fromEntries(
      JOINT_IDS.map((id) => [
        id,
        Object.freeze({ id, position: Object.freeze({ ...positions[id] }) })
      ])
    ) as Record<JointId, JointDefinition>
  );
}

export function applyPoseToDirectionRig(
  source: DirectionRig,
  pose: HumanoidWalkPose
): ApplyHumanoidWalkPoseResult {
  const sourceValidation = validatePose(source);
  if (!sourceValidation.valid) {
    return Object.freeze({ status: "invalid", issues: sourceValidation.issues });
  }

  const positions = Object.fromEntries(
    JOINT_IDS.map((id) => [id, source.joints[id].position])
  ) as Record<JointId, Point>;
  const directionalPose = resolveDirectionalWalkPose(source, pose.frameIndex);
  const sway = directionalPose.projected.rootSway;
  const bob = directionalPose.projected.rootBobY;

  positions.pelvis = shifted(source.joints.pelvis.position, sway.x, sway.y + bob);
  positions["hip.left"] = shifted(source.joints["hip.left"].position, sway.x, sway.y + bob);
  positions["hip.right"] = shifted(source.joints["hip.right"].position, sway.x, sway.y + bob);
  positions.chest = shifted(
    source.joints.chest.position,
    sway.x + directionalPose.torsoCounterOffset.x,
    sway.y + bob + directionalPose.torsoCounterOffset.y
  );
  const chestDelta = {
    x: positions.chest.x - source.joints.chest.position.x,
    y: positions.chest.y - source.joints.chest.position.y
  };
  positions["shoulder.left"] = shifted(
    source.joints["shoulder.left"].position,
    chestDelta.x,
    chestDelta.y
  );
  positions["shoulder.right"] = shifted(
    source.joints["shoulder.right"].position,
    chestDelta.x,
    chestDelta.y
  );
  positions.neck = shifted(
    source.joints.neck.position,
    directionalPose.torsoCounterOffset.x,
    directionalPose.torsoCounterOffset.y
  );
  positions.head = shifted(
    source.joints.head.position,
    directionalPose.headCounterOffset.x,
    directionalPose.headCounterOffset.y
  );

  applyArmSwing(
    source,
    positions,
    "left",
    directionalPose.projected.leftArmRotation
  );
  applyArmSwing(
    source,
    positions,
    "right",
    directionalPose.projected.rightArmRotation
  );
  const diagnostics: TwoBoneIkDiagnostic[] = [];
  const legIssues = [
    applyLegPose(source, positions, directionalPose, "left", diagnostics),
    applyLegPose(source, positions, directionalPose, "right", diagnostics)
  ].filter((issue): issue is WalkPoseIssue => issue !== null);
  if (legIssues.length > 0) {
    return Object.freeze({
      status: "invalid",
      issues: Object.freeze(legIssues)
    });
  }

  const rig: DirectionRig = Object.freeze({
    direction: source.direction,
    motionProfile: source.motionProfile,
    joints: freezeJoints(positions)
  });
  const validation = validatePose(rig);
  if (!validation.valid) {
    return Object.freeze({ status: "invalid", issues: validation.issues });
  }
  const contactIssues: WalkPoseIssue[] = [];
  for (const side of ["left", "right"] as const) {
    if (
      directionalPose.contact[side] &&
      Math.abs(
        rig.joints[`toe.${side}`].position.y - source.joints.root.position.y
      ) > TWO_BONE_IK_EPSILON
    ) {
      contactIssues.push(
        poseIssue(
          "groundContactViolation",
          `${side} contact foot left the projected groundline.`,
          { jointId: `toe.${side}` }
        )
      );
    }
  }
  return contactIssues.length > 0
    ? Object.freeze({
        status: "invalid",
        issues: Object.freeze(contactIssues)
      })
    : Object.freeze({
        status: "ok",
        rig,
        diagnostics: Object.freeze(diagnostics)
      });
}
