import {
  applyTransformDelta,
  applyFrameLayerOrder,
  composeTransforms,
  createRotationTransform,
  createTranslationTransform,
  createUniformScaleTransform,
  cropRgba,
  findSlotBinding,
  isRequiredPartSlot,
  mirrorRgbaImage,
  mirrorSourceAnchors,
  mirrorSourceRect,
  mirrorTransformDelta,
  resolveProjectDirectionCoverage,
  resolveRuntimeDirectionRig,
  resolveDirectionDrawOrder,
  resolveBonePlacement,
  resolveEffectiveAnchor,
  resolvePartAttachmentJoint,
  type Direction,
  type LayeredPart,
  type PartSlot,
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
  "invalidLayerOrder",
  "directionSourceBlocked"
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
  const rigResolution = resolveRuntimeDirectionRig(template, direction);
  if (!rigResolution) {
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

  const assignedIds = new Set(project.parts.map(({ assetId }) => assetId));
  const assignedAssets = partAssets
    .filter((asset) => assignedIds.has(asset.assetId))
    .map((asset) => {
      const assignment = project.parts.find(
        ({ assetId }) => assetId === asset.assetId
      );
      return assignment?.mirrorPolicy
        ? Object.freeze({ ...asset, mirrorPolicy: assignment.mirrorPolicy })
        : asset;
    });
  const coverage = resolveProjectDirectionCoverage({
    mode: project.directionSourceMode,
    assets: assignedAssets,
    projectMirrorPolicy: project.mirrorPolicy,
    reviews: project.mirrorReviews
  });
  const cells = coverage.rows.map((row) =>
    row.cells.find((cell) => cell.targetDirection === direction)!
  );
  const projections = new Map(
    cells.flatMap((cell) =>
      cell.sourceAsset &&
      (cell.status === "authoredSource" ||
        cell.status === "mirroredValid" ||
        cell.status === "mirroredNeedsReview" ||
        cell.status === "anchorsIncomplete")
        ? [[cell.sourceAsset.assetId, Object.freeze({ mirrored: cell.mirrored })] as const]
        : []
    )
  );
  const prepared = prepareDirectionRigParts(
    project,
    template,
    rigResolution.rig,
    partAssets,
    decodedSources,
    projections
  );
  return Object.freeze({
    parts: prepared.parts,
    issues: prepared.issues
  });
}

export interface PartRuntimeProjection {
  readonly mirrored: boolean;
}

export interface FrameRenderCorrection {
  readonly partDeltas?: Readonly<Partial<Record<PartSlot, TransformDelta>>>;
  readonly layerOrderOverride?: readonly PartSlot[] | null;
}

function combineTransformDeltas(
  base: TransformDelta,
  frame: TransformDelta | undefined
): TransformDelta {
  if (!frame) return base;
  return Object.freeze({
    offsetX: base.offsetX + frame.offsetX,
    offsetY: base.offsetY + frame.offsetY,
    rotationDelta: base.rotationDelta + frame.rotationDelta,
    scaleMultiplier: base.scaleMultiplier * frame.scaleMultiplier
  });
}

/** Prepares renderer-ready parts against an already resolved authored pose. */
export function prepareDirectionRigParts(
  project: AnimationProject,
  template: RigTemplate,
  directionRig: DirectionRig,
  partAssets: readonly AnimationPartAsset[],
  decodedSources: readonly DecodedPartSource[],
  projections?: ReadonlyMap<string, PartRuntimeProjection>,
  frameCorrection?: FrameRenderCorrection
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
    const projection = asset ? projections?.get(asset.assetId) : undefined;
    if (
      !asset ||
      (projections ? !projection : asset.direction !== direction)
    ) continue;
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
    const decodedSource = sourcesByAssetId.get(asset.assetId);
    if (!decodedSource) {
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
      decodedSource.width !== asset.sourceSize.width ||
      decodedSource.height !== asset.sourceSize.height
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
    const mirrored = projection?.mirrored ?? false;
    const source = mirrored ? mirrorRgbaImage(decodedSource) : decodedSource;
    const trimRect = mirrored
      ? mirrorSourceRect(asset.sourceSize.width, asset.trimRect)
      : asset.trimRect;
    const sourceAnchors = Object.freeze({
      proximal: asset.anchors.proximal,
      ...(asset.anchors.distal ? { distal: asset.anchors.distal } : {}),
      ...(asset.anchors.pivot ? { pivot: asset.anchors.pivot } : {})
    });
    const anchors = mirrored
      ? mirrorSourceAnchors(asset.sourceSize.width, sourceAnchors)
      : sourceAnchors;
    let cropped: RgbaImage;
    try {
      cropped = cropRgba(source, trimRect);
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
    const baseDelta = assignment.transformDelta ?? IDENTITY_DELTA;
    const projectedDelta = mirrored ? mirrorTransformDelta(baseDelta) : baseDelta;
    const delta = combineTransformDeltas(
      projectedDelta,
      frameCorrection?.partDeltas?.[asset.slot]
    );
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
        trimRect,
        sourceSize: asset.sourceSize,
        anchors,
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
        trimRect,
        anchors.proximal
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
  const baseSlotOrder = ordered.definition.entries.map(({ slot }) => slot);
  const frameSlotOrder = applyFrameLayerOrder(
    baseSlotOrder,
    frameCorrection?.layerOrderOverride
  );
  const frameSlotIndex = new Map(
    frameSlotOrder.map((slot, index) => [slot, index] as const)
  );
  const frameOrderedParts = frameCorrection?.layerOrderOverride
    ? [...ordered.parts].sort(
        (left, right) =>
          (frameSlotIndex.get(left.slot) ?? left.effectiveIndex) -
            (frameSlotIndex.get(right.slot) ?? right.effectiveIndex) ||
          left.id.localeCompare(right.id)
      )
    : ordered.parts;
  const parts = frameOrderedParts.flatMap((part) => {
    const renderable = renderableById.get(part.id);
    return renderable ? [renderable] : [];
  });

  return Object.freeze({
    parts: Object.freeze(parts),
    issues: Object.freeze(issues)
  });
}
