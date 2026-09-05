import type { TransformDelta } from "./animation.types";
import { DIRECTION_IDS, type Direction } from "./directions";
import type { DirectionRig } from "./rigTemplate";
import { BONE_TOPOLOGY, JOINT_IDS, type JointId } from "./rigTopology";
import { PART_SLOT_IDS, type PartSlot } from "./slots";

export const FRAME_OVERRIDE_MAX_OFFSET = 64;
export const FRAME_OVERRIDE_MAX_ROTATION = Math.PI;
export const FRAME_OVERRIDE_MIN_SCALE = 0.25;
export const FRAME_OVERRIDE_MAX_SCALE = 4;
export const FRAME_OVERRIDE_OFFSET_WARNING = 24;
export const FRAME_OVERRIDE_ROTATION_WARNING = Math.PI / 2;
export const FRAME_OVERRIDE_MIN_SCALE_WARNING = 0.5;
export const FRAME_OVERRIDE_MAX_SCALE_WARNING = 2;

export const IDENTITY_FRAME_DELTA: TransformDelta = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  rotationDelta: 0,
  scaleMultiplier: 1
});

export interface FrameOverrideAddress {
  readonly clipId: string;
  readonly direction: Direction;
  readonly frameIndex: number;
}

export interface FrameOverride extends FrameOverrideAddress {
  readonly rootDelta?: TransformDelta | undefined;
  readonly jointDeltas?: Readonly<Partial<Record<JointId, TransformDelta>>> | undefined;
  readonly partDeltas?: Readonly<Partial<Record<PartSlot, TransformDelta>>> | undefined;
  readonly layerOrderOverride?: readonly PartSlot[] | undefined;
}

export interface EffectiveFramePose {
  readonly rig: DirectionRig;
  readonly partDeltas: Readonly<Partial<Record<PartSlot, TransformDelta>>>;
  readonly layerOrderOverride: readonly PartSlot[] | null;
  readonly warnings: readonly string[];
}

export interface GeneratedFramePose {
  readonly rig: DirectionRig;
  readonly partTransforms?: Readonly<Partial<Record<PartSlot, TransformDelta>>>;
  readonly layerOrder?: readonly PartSlot[];
}

const EPSILON = 1e-9;

export function isNeutralFrameDelta(delta: TransformDelta): boolean {
  return (
    Math.abs(delta.offsetX) <= EPSILON &&
    Math.abs(delta.offsetY) <= EPSILON &&
    Math.abs(delta.rotationDelta) <= EPSILON &&
    Math.abs(delta.scaleMultiplier - 1) <= EPSILON
  );
}

function freezeDelta(delta: TransformDelta): TransformDelta {
  return Object.freeze({
    offsetX: Math.round(delta.offsetX),
    offsetY: Math.round(delta.offsetY),
    rotationDelta: delta.rotationDelta,
    scaleMultiplier: delta.scaleMultiplier
  });
}

function normalizeRecord<Key extends string>(
  record: Readonly<Partial<Record<Key, TransformDelta>>> | undefined,
  order: readonly Key[]
): Readonly<Partial<Record<Key, TransformDelta>>> | undefined {
  if (!record) return undefined;
  const normalized: Partial<Record<Key, TransformDelta>> = {};
  for (const key of order) {
    const delta = record[key];
    if (delta && !isNeutralFrameDelta(delta)) normalized[key] = freezeDelta(delta);
  }
  return Object.keys(normalized).length > 0 ? Object.freeze(normalized) : undefined;
}

function normalizeLayerOrder(
  order: readonly PartSlot[] | undefined
): readonly PartSlot[] | undefined {
  if (!order || order.length === 0) return undefined;
  return Object.freeze([...order]);
}

export function normalizeFrameOverride(
  override: FrameOverride
): FrameOverride | null {
  const rootDelta =
    override.rootDelta && !isNeutralFrameDelta(override.rootDelta)
      ? freezeDelta(override.rootDelta)
      : undefined;
  const jointDeltas = normalizeRecord(override.jointDeltas, JOINT_IDS);
  const partDeltas = normalizeRecord(override.partDeltas, PART_SLOT_IDS);
  const layerOrderOverride = normalizeLayerOrder(override.layerOrderOverride);
  if (!rootDelta && !jointDeltas && !partDeltas && !layerOrderOverride) return null;
  return Object.freeze({
    clipId: override.clipId,
    direction: override.direction,
    frameIndex: override.frameIndex,
    ...(rootDelta ? { rootDelta } : {}),
    ...(jointDeltas ? { jointDeltas } : {}),
    ...(partDeltas ? { partDeltas } : {}),
    ...(layerOrderOverride ? { layerOrderOverride } : {})
  });
}

export function frameOverrideMatches(
  override: FrameOverrideAddress,
  address: FrameOverrideAddress
): boolean {
  return (
    override.clipId === address.clipId &&
    override.direction === address.direction &&
    override.frameIndex === address.frameIndex
  );
}

function compareOverrides(left: FrameOverrideAddress, right: FrameOverrideAddress): number {
  return (
    left.clipId.localeCompare(right.clipId) ||
    DIRECTION_IDS.indexOf(left.direction) - DIRECTION_IDS.indexOf(right.direction) ||
    left.frameIndex - right.frameIndex
  );
}

export function upsertFrameOverride<Override extends FrameOverride>(
  overrides: readonly Override[],
  override: Override
): readonly Override[] {
  const normalized = normalizeFrameOverride(override);
  const retained = overrides.filter((entry) => !frameOverrideMatches(entry, override));
  return Object.freeze(
    [...retained, ...(normalized ? [normalized as Override] : [])].sort(compareOverrides)
  );
}

export function removeFrameOverride<Override extends FrameOverride>(
  overrides: readonly Override[],
  address: FrameOverrideAddress
): readonly Override[] {
  return Object.freeze(
    overrides.filter((entry) => !frameOverrideMatches(entry, address))
  );
}

export const resetFrameOverride = removeFrameOverride;

export function resetDirectionOverrides<Override extends FrameOverride>(
  overrides: readonly Override[],
  clipId: string,
  direction: Direction
): readonly Override[] {
  return Object.freeze(
    overrides.filter(
      (entry) => entry.clipId !== clipId || entry.direction !== direction
    )
  );
}

export function findFrameOverride<Override extends FrameOverride>(
  overrides: readonly Override[],
  address: FrameOverrideAddress
): Override | null {
  return overrides.find((entry) => frameOverrideMatches(entry, address)) ?? null;
}

function transformPoint(
  point: Readonly<{ x: number; y: number }>,
  pivot: Readonly<{ x: number; y: number }>,
  delta: TransformDelta
): Readonly<{ x: number; y: number }> {
  const relativeX = (point.x - pivot.x) * delta.scaleMultiplier;
  const relativeY = (point.y - pivot.y) * delta.scaleMultiplier;
  const cosine = Math.cos(delta.rotationDelta);
  const sine = Math.sin(delta.rotationDelta);
  return Object.freeze({
    x: pivot.x + relativeX * cosine - relativeY * sine + delta.offsetX,
    y: pivot.y + relativeX * sine + relativeY * cosine + delta.offsetY
  });
}

export function collectFrameOverrideWarnings(
  override: FrameOverride | null | undefined
): readonly string[] {
  if (!override) return Object.freeze([]);
  const warnings: string[] = [];
  const inspect = (label: string, delta: TransformDelta) => {
    if (
      Math.abs(delta.offsetX) > FRAME_OVERRIDE_OFFSET_WARNING ||
      Math.abs(delta.offsetY) > FRAME_OVERRIDE_OFFSET_WARNING
    ) warnings.push(`${label}: Verschiebung über ${FRAME_OVERRIDE_OFFSET_WARNING} px.`);
    if (Math.abs(delta.rotationDelta) > FRAME_OVERRIDE_ROTATION_WARNING) {
      warnings.push(`${label}: Drehung über 90°.`);
    }
    if (
      delta.scaleMultiplier < FRAME_OVERRIDE_MIN_SCALE_WARNING ||
      delta.scaleMultiplier > FRAME_OVERRIDE_MAX_SCALE_WARNING
    ) warnings.push(`${label}: extreme Skalierung.`);
  };
  if (override.rootDelta) inspect("Root", override.rootDelta);
  for (const joint of JOINT_IDS) {
    const delta = override.jointDeltas?.[joint];
    if (delta) inspect(`Joint ${joint}`, delta);
  }
  for (const slot of PART_SLOT_IDS) {
    const delta = override.partDeltas?.[slot];
    if (delta) inspect(`Part ${slot}`, delta);
  }
  return Object.freeze(warnings);
}

/** Resolves the immutable generated rig plus sparse frame deltas. */
export function resolveEffectiveFramePose(
  baselineRig: DirectionRig,
  override: FrameOverride | null | undefined
): EffectiveFramePose {
  const root = baselineRig.joints.root.position;
  const rootDelta = override?.rootDelta ?? IDENTITY_FRAME_DELTA;
  const positions = Object.fromEntries(
    JOINT_IDS.map((jointId) => [
      jointId,
      transformPoint(baselineRig.joints[jointId].position, root, rootDelta)
    ])
  ) as Record<JointId, Readonly<{ x: number; y: number }>>;
  const children = new Map<JointId, JointId[]>();
  for (const bone of BONE_TOPOLOGY) {
    const existing = children.get(bone.parentJointId) ?? [];
    existing.push(bone.childJointId);
    children.set(bone.parentJointId, existing);
  }
  const descendants = (joint: JointId): readonly JointId[] => {
    const direct = children.get(joint) ?? [];
    return direct.flatMap((child) => [child, ...descendants(child)]);
  };
  for (const jointId of JOINT_IDS) {
    const jointDelta = override?.jointDeltas?.[jointId];
    if (!jointDelta) continue;
    const pivot = positions[jointId];
    positions[jointId] = Object.freeze({
      x: pivot.x + jointDelta.offsetX,
      y: pivot.y + jointDelta.offsetY
    });
    for (const childId of descendants(jointId)) {
      positions[childId] = transformPoint(positions[childId], pivot, jointDelta);
    }
  }
  const joints = Object.fromEntries(
    JOINT_IDS.map((jointId) => [
      jointId,
      Object.freeze({ id: jointId, position: positions[jointId] })
    ])
  ) as DirectionRig["joints"];
  return Object.freeze({
    rig: Object.freeze({ ...baselineRig, joints: Object.freeze(joints) }),
    partDeltas: Object.freeze({ ...(override?.partDeltas ?? {}) }),
    layerOrderOverride: override?.layerOrderOverride
      ? Object.freeze([...override.layerOrderOverride])
      : null,
    warnings: collectFrameOverrideWarnings(override)
  });
}

function deltaBetween(
  baseline: TransformDelta | undefined,
  edited: TransformDelta | undefined
): TransformDelta | null {
  const from = baseline ?? IDENTITY_FRAME_DELTA;
  const to = edited ?? IDENTITY_FRAME_DELTA;
  const delta = freezeDelta({
    offsetX: to.offsetX - from.offsetX,
    offsetY: to.offsetY - from.offsetY,
    rotationDelta: to.rotationDelta - from.rotationDelta,
    scaleMultiplier: to.scaleMultiplier / from.scaleMultiplier
  });
  return isNeutralFrameDelta(delta) ? null : delta;
}

/** Produces the minimal persisted delta between a generated and edited pose. */
export function diffFrameFromGeneratedBaseline(
  address: FrameOverrideAddress,
  baseline: GeneratedFramePose,
  edited: GeneratedFramePose
): FrameOverride | null {
  const rootOffset = Object.freeze({
    offsetX: Math.round(edited.rig.joints.root.position.x - baseline.rig.joints.root.position.x),
    offsetY: Math.round(edited.rig.joints.root.position.y - baseline.rig.joints.root.position.y),
    rotationDelta: 0,
    scaleMultiplier: 1
  });
  const jointDeltas: Partial<Record<JointId, TransformDelta>> = {};
  for (const jointId of JOINT_IDS) {
    if (jointId === "root") continue;
    const from = baseline.rig.joints[jointId].position;
    const to = edited.rig.joints[jointId].position;
    const delta = freezeDelta({
      offsetX: to.x - from.x - rootOffset.offsetX,
      offsetY: to.y - from.y - rootOffset.offsetY,
      rotationDelta: 0,
      scaleMultiplier: 1
    });
    if (!isNeutralFrameDelta(delta)) jointDeltas[jointId] = delta;
  }
  const partDeltas: Partial<Record<PartSlot, TransformDelta>> = {};
  for (const slot of PART_SLOT_IDS) {
    const delta = deltaBetween(baseline.partTransforms?.[slot], edited.partTransforms?.[slot]);
    if (delta) partDeltas[slot] = delta;
  }
  const sameLayerOrder =
    JSON.stringify(baseline.layerOrder ?? []) === JSON.stringify(edited.layerOrder ?? []);
  return normalizeFrameOverride({
    ...address,
    ...(!isNeutralFrameDelta(rootOffset) ? { rootDelta: rootOffset } : {}),
    ...(Object.keys(jointDeltas).length > 0 ? { jointDeltas } : {}),
    ...(Object.keys(partDeltas).length > 0 ? { partDeltas } : {}),
    ...(!sameLayerOrder && edited.layerOrder
      ? { layerOrderOverride: edited.layerOrder }
      : {})
  });
}

/** Applies an explicit slot order while retaining every unmentioned base slot. */
export function applyFrameLayerOrder(
  baseOrder: readonly PartSlot[],
  override: readonly PartSlot[] | null | undefined
): readonly PartSlot[] {
  if (!override?.length) return Object.freeze([...baseOrder]);
  const specified = new Set(override);
  return Object.freeze([
    ...override,
    ...baseOrder.filter((slot) => !specified.has(slot))
  ]);
}
