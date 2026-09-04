import {
  applyTransformDelta,
  findDirectionRig,
  findSlotBinding,
  isRequiredPartSlot,
  resolveBonePlacement,
  type AdjustedBonePlacement,
  type Direction,
  type EditableSourceAnchors,
  type RigTemplate,
  type SourceAnchorIssue,
  type TransformDelta
} from "../../domain/animation";
import type { AnimationPartAsset } from "../../schemas";

export type PartPlacementSource = Pick<
  AnimationPartAsset,
  "slot" | "trimRect" | "sourceSize"
> &
  Readonly<{ anchors?: EditableSourceAnchors | undefined }>;

export type PartPlacementAdapterResult =
  | Readonly<{
      status: "ok";
      placement: AdjustedBonePlacement;
    }>
  | Readonly<{
      status: "invalidAnchors";
      issues: readonly SourceAnchorIssue[];
    }>
  | Readonly<{
      status: "unavailable";
      reason: "unsupportedSlot" | "missingDirectionRig" | "missingSlotBinding";
      message: string;
    }>;

export const IDENTITY_PART_DELTA: TransformDelta = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  rotationDelta: 0,
  scaleMultiplier: 1
});

/** Narrow display adapter. It resolves data only; Prompt 40 owns raster output. */
export function resolvePartPlacementForDisplay(
  template: RigTemplate,
  direction: Direction,
  asset: PartPlacementSource,
  delta: TransformDelta = IDENTITY_PART_DELTA
): PartPlacementAdapterResult {
  if (!isRequiredPartSlot(asset.slot)) {
    return Object.freeze({
      status: "unavailable",
      reason: "unsupportedSlot",
      message: "This optional slot has no production bone binding yet."
    });
  }
  const directionRig = findDirectionRig(template, direction);
  if (!directionRig) {
    return Object.freeze({
      status: "unavailable",
      reason: "missingDirectionRig",
      message: `Direction ${direction} has no authored rig geometry.`
    });
  }
  const binding = findSlotBinding(template, asset.slot);
  if (!binding) {
    return Object.freeze({
      status: "unavailable",
      reason: "missingSlotBinding",
      message: `Slot ${asset.slot} has no rig binding.`
    });
  }
  const parent = directionRig.joints[binding.proximalJointId]?.position;
  const childId = binding.distalJointId ?? template.bones.find(
    ({ id }) => id === binding.boneId
  )?.childJointId;
  const child = childId ? directionRig.joints[childId]?.position : undefined;
  if (!parent || !child) {
    return Object.freeze({
      status: "unavailable",
      reason: "missingSlotBinding",
      message: `Slot ${asset.slot} references incomplete rig joints.`
    });
  }
  const result = resolveBonePlacement({
    binding,
    trimRect: asset.trimRect,
    sourceSize: asset.sourceSize,
    anchors: asset.anchors ?? {},
    targetParent: parent,
    targetChild: child
  });
  return result.status === "ok"
    ? Object.freeze({
        status: "ok",
        placement: applyTransformDelta(result.placement, delta)
      })
    : result;
}
