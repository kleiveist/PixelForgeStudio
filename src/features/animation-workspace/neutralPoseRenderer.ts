import {
  applyTransformDelta,
  composeTransforms,
  createTranslationTransform,
  cropRgba,
  findDirectionRig,
  findSlotBinding,
  isRequiredPartSlot,
  resolveBonePlacement,
  type Direction,
  type RenderablePart,
  type RgbaImage,
  type RigTemplate,
  type Transform2D,
  type TransformDelta
} from "../../domain/animation";
import type {
  AnimationPartAsset,
  AnimationProject,
  StableId
} from "../../schemas";

export const NEUTRAL_POSE_PREPARATION_ISSUE_CODES = Object.freeze([
  "missingDirectionRig",
  "sourceNotReady",
  "unsupportedSlot",
  "missingDecodedSource",
  "decodedDimensionsMismatch",
  "invalidPlacement"
] as const);

export type NeutralPosePreparationIssueCode =
  (typeof NEUTRAL_POSE_PREPARATION_ISSUE_CODES)[number];

export interface NeutralPosePreparationIssue {
  readonly code: NeutralPosePreparationIssueCode;
  readonly severity: "warning" | "error";
  readonly assetId?: StableId;
  readonly message: string;
}

export interface DecodedPartSource {
  readonly assetId: StableId;
  readonly image: RgbaImage;
}

export interface NeutralPosePreparationResult {
  readonly parts: readonly RenderablePart[];
  readonly issues: readonly NeutralPosePreparationIssue[];
}

const IDENTITY_DELTA: TransformDelta = Object.freeze({
  offsetX: 0,
  offsetY: 0,
  rotationDelta: 0,
  scaleMultiplier: 1
});

function issue(
  code: NeutralPosePreparationIssueCode,
  severity: NeutralPosePreparationIssue["severity"],
  message: string,
  assetId?: StableId
): NeutralPosePreparationIssue {
  return Object.freeze({
    code,
    severity,
    ...(assetId ? { assetId } : {}),
    message
  });
}

/**
 * Placement matrices address integer-valued source/target pixel centres.
 * Raster matrices address cell edges with centres at n + 0.5.
 */
export function placementToRasterTransform(
  placement: Transform2D
): Transform2D {
  return composeTransforms(
    createTranslationTransform(0.5, 0.5),
    placement,
    createTranslationTransform(-0.5, -0.5)
  );
}

/**
 * Resolves only neutral-pose geometry. The incoming project assignment order
 * remains the temporary draw order until Prompt 41 owns layering.
 */
export function prepareNeutralPoseParts(
  project: AnimationProject,
  template: RigTemplate,
  direction: Direction,
  partAssets: readonly AnimationPartAsset[],
  decodedSources: readonly DecodedPartSource[]
): NeutralPosePreparationResult {
  const directionRig = findDirectionRig(template, direction);
  if (!directionRig) {
    return Object.freeze({
      parts: Object.freeze([]),
      issues: Object.freeze([
        issue(
          "missingDirectionRig",
          "warning",
          `Direction ${direction} has no authored neutral-pose rig.`
        )
      ])
    });
  }

  const assetsById = new Map(partAssets.map((asset) => [asset.assetId, asset]));
  const sourcesByAssetId = new Map(
    decodedSources.map((source) => [source.assetId, source.image])
  );
  const parts: RenderablePart[] = [];
  const issues: NeutralPosePreparationIssue[] = [];

  for (const assignment of project.parts) {
    const asset = assetsById.get(assignment.assetId);
    if (!asset || asset.direction !== direction) continue;
    if (asset.anchorStatus !== "ready" || !asset.anchors) {
      issues.push(
        issue(
          "sourceNotReady",
          "warning",
          `Part ${asset.label} has no production-ready anchors.`,
          asset.assetId
        )
      );
      continue;
    }
    if (!isRequiredPartSlot(asset.slot)) {
      issues.push(
        issue(
          "unsupportedSlot",
          "warning",
          `Optional slot ${asset.slot} has no production placement binding yet.`,
          asset.assetId
        )
      );
      continue;
    }
    const source = sourcesByAssetId.get(asset.assetId);
    if (!source) {
      issues.push(
        issue(
          "missingDecodedSource",
          "error",
          `Decoded RGBA source for ${asset.label} is unavailable.`,
          asset.assetId
        )
      );
      continue;
    }
    if (
      source.width !== asset.sourceSize.width ||
      source.height !== asset.sourceSize.height
    ) {
      issues.push(
        issue(
          "decodedDimensionsMismatch",
          "error",
          `Decoded dimensions for ${asset.label} do not match its metadata.`,
          asset.assetId
        )
      );
      continue;
    }
    const binding = findSlotBinding(template, asset.slot);
    const parent = binding
      ? directionRig.joints[binding.proximalJointId]?.position
      : undefined;
    const bone = binding
      ? template.bones.find(({ id }) => id === binding.boneId)
      : undefined;
    const childId = binding?.distalJointId ?? bone?.childJointId;
    const child = childId ? directionRig.joints[childId]?.position : undefined;
    if (!binding || !parent || !child) {
      issues.push(
        issue(
          "invalidPlacement",
          "error",
          `Rig placement for ${asset.label} is incomplete.`,
          asset.assetId
        )
      );
      continue;
    }
    const placement = resolveBonePlacement({
      binding,
      trimRect: asset.trimRect,
      sourceSize: asset.sourceSize,
      anchors: asset.anchors,
      targetParent: parent,
      targetChild: child
    });
    if (placement.status !== "ok") {
      issues.push(
        issue(
          "invalidPlacement",
          "error",
          `Saved anchors for ${asset.label} cannot resolve a placement.`,
          asset.assetId
        )
      );
      continue;
    }

    let cropped: RgbaImage;
    try {
      cropped = cropRgba(source, asset.trimRect);
    } catch {
      issues.push(
        issue(
          "decodedDimensionsMismatch",
          "error",
          `Trim rectangle for ${asset.label} does not fit its decoded source.`,
          asset.assetId
        )
      );
      continue;
    }
    const adjusted = applyTransformDelta(
      placement.placement,
      assignment.transformDelta ?? IDENTITY_DELTA
    );
    parts.push(
      Object.freeze({
        id: asset.assetId,
        source: cropped,
        transform: placementToRasterTransform(adjusted.transform)
      })
    );
  }

  return Object.freeze({
    parts: Object.freeze(parts),
    issues: Object.freeze(issues)
  });
}
