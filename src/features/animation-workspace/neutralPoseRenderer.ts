import {
  applyTransformDelta,
  composeTransforms,
  createRotationTransform,
  createTranslationTransform,
  createUniformScaleTransform,
  cropRgba,
  findDirectionRig,
  findSlotBinding,
  isRequiredPartSlot,
  resolveDirectionDrawOrder,
  resolveBonePlacement,
  resolveEffectiveAnchor,
  resolvePartAttachmentJoint,
  type Direction,
  type LayeredPart,
  type RenderablePart,
  type RgbaImage,
  type DirectionRig,
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
  "missingAttachmentJoint",
  "missingDecodedSource",
  "decodedDimensionsMismatch",
  "invalidPlacement",
  "invalidLayerOrder"
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
 * Resolves neutral-pose geometry and applies the versioned directional order
 * before returning Renderer-ready parts.
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

  return prepareDirectionRigParts(
    project,
    template,
    directionRig,
    partAssets,
    decodedSources
  );
}

/** Prepares renderer-ready parts against an already resolved authored pose. */
export function prepareDirectionRigParts(
  project: AnimationProject,
  template: RigTemplate,
  directionRig: DirectionRig,
  partAssets: readonly AnimationPartAsset[],
  decodedSources: readonly DecodedPartSource[]
): NeutralPosePreparationResult {
  const direction = directionRig.direction;

  const assetsById = new Map(partAssets.map((asset) => [asset.assetId, asset]));
  const sourcesByAssetId = new Map(
    decodedSources.map((source) => [source.assetId, source.image])
  );
  const renderableById = new Map<string, RenderablePart>();
  const layeredParts: LayeredPart[] = [];
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
    const delta = assignment.transformDelta ?? IDENTITY_DELTA;
    let placementTransform: Transform2D;
    if (isRequiredPartSlot(asset.slot)) {
      const binding = findSlotBinding(template, asset.slot);
      const parent = binding
        ? directionRig.joints[binding.proximalJointId]?.position
        : undefined;
      const bone = binding
        ? template.bones.find(({ id }) => id === binding.boneId)
        : undefined;
      const childId = binding?.distalJointId ?? bone?.childJointId;
      const child = childId
        ? directionRig.joints[childId]?.position
        : undefined;
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
      placementTransform = applyTransformDelta(
        placement.placement,
        delta
      ).transform;
    } else {
      const attachmentJointId = resolvePartAttachmentJoint(
        asset.slot,
        asset.attachmentJointId
      );
      const target = attachmentJointId
        ? directionRig.joints[attachmentJointId]?.position
        : undefined;
      if (!attachmentJointId || !target) {
        issues.push(
          issue(
            "missingAttachmentJoint",
            "error",
            `Optional part ${asset.label} requires a valid attachment joint.`,
            asset.assetId
          )
        );
        continue;
      }
      const effectiveProximal = resolveEffectiveAnchor(
        asset.trimRect,
        asset.anchors.proximal
      );
      placementTransform = composeTransforms(
        createTranslationTransform(
          target.x + delta.offsetX,
          target.y + delta.offsetY
        ),
        createRotationTransform(delta.rotationDelta),
        createUniformScaleTransform(delta.scaleMultiplier),
        createTranslationTransform(
          -effectiveProximal.x,
          -effectiveProximal.y
        )
      );
    }
    renderableById.set(
      asset.assetId,
      Object.freeze({
        id: asset.assetId,
        source: cropped,
        transform: placementToRasterTransform(placementTransform)
      })
    );
    layeredParts.push(
      Object.freeze({
        id: asset.assetId,
        slot: asset.slot,
        ...(asset.attachmentJointId
          ? { attachmentJointId: asset.attachmentJointId }
          : {}),
        ...(assignment.layerOffset !== undefined
          ? { layerOffset: assignment.layerOffset }
          : {})
      })
    );
  }

  const ordered = resolveDirectionDrawOrder(direction, layeredParts);
  if (ordered.status === "invalid") {
    issues.push(
      ...ordered.issues.map((orderIssue) =>
        issue(
          "invalidLayerOrder",
          "error",
          orderIssue.message
        )
      )
    );
    return Object.freeze({
      parts: Object.freeze([]),
      issues: Object.freeze(issues)
    });
  }
  const parts = ordered.parts.flatMap((part) => {
    const renderable = renderableById.get(part.id);
    return renderable ? [renderable] : [];
  });

  return Object.freeze({
    parts: Object.freeze(parts),
    issues: Object.freeze(issues)
  });
}
