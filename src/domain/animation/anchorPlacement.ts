import type {
  Point,
  Rect,
  Size,
  SourceAnchors,
  Transform2D,
  TransformDelta
} from "./animation.types";
import {
  composeTransforms,
  createRotationTransform,
  createTranslationTransform,
  createUniformScaleTransform
} from "./matrices";
import type { SlotBinding } from "./rigTemplate";
import {
  normalizeAngle,
  subtractVectors,
  vectorAngle,
  vectorLength
} from "./vectors";

export const SOURCE_VECTOR_EPSILON = 1e-3;
export const EXTREME_SCALE_WARNING_MIN = 0.5;
export const EXTREME_SCALE_WARNING_MAX = 2;

export const SOURCE_ANCHOR_ISSUE_CODES = Object.freeze([
  "missingProximal",
  "missingDistal",
  "invalidCoordinate",
  "outsideSource",
  "nearZeroSourceVector",
  "missingDefaultOrientation"
] as const);

export type SourceAnchorIssueCode =
  (typeof SOURCE_ANCHOR_ISSUE_CODES)[number];

export interface SourceAnchorIssue {
  readonly code: SourceAnchorIssueCode;
  readonly path: readonly ("proximal" | "distal" | "pivot" | "defaultSourceOrientation")[];
  readonly message: string;
}

export type SourceAnchorValidationResult =
  | Readonly<{ valid: true; issues: readonly [] }>
  | Readonly<{ valid: false; issues: readonly SourceAnchorIssue[] }>;

export type EditableSourceAnchors = Readonly<{
  proximal?: Point | undefined;
  distal?: Point | undefined;
  pivot?: Point | undefined;
}>;

function addAnchorIssue(
  issues: SourceAnchorIssue[],
  code: SourceAnchorIssueCode,
  path: SourceAnchorIssue["path"],
  message: string
): void {
  issues.push(Object.freeze({ code, path: Object.freeze([...path]), message }));
}

function validatePoint(
  name: "proximal" | "distal" | "pivot",
  point: Point | undefined,
  sourceSize: Size | undefined,
  issues: SourceAnchorIssue[]
): void {
  if (!point) return;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    addAnchorIssue(
      issues,
      "invalidCoordinate",
      [name],
      `${name} anchor coordinates must be finite.`
    );
    return;
  }
  if (
    sourceSize &&
    (point.x < 0 ||
      point.x >= sourceSize.width ||
      point.y < 0 ||
      point.y >= sourceSize.height)
  ) {
    addAnchorIssue(
      issues,
      "outsideSource",
      [name],
      `${name} anchor must be inside the original source image.`
    );
  }
}

/** Validates source-space anchors against the selected rig-slot contract. */
export function validateSourceAnchors(
  binding: SlotBinding,
  anchors: EditableSourceAnchors | null | undefined,
  sourceSize?: Size
): SourceAnchorValidationResult {
  const issues: SourceAnchorIssue[] = [];
  if (!anchors?.proximal) {
    addAnchorIssue(
      issues,
      "missingProximal",
      ["proximal"],
      "A proximal source anchor is required."
    );
  }
  if (binding.sourceAnchorRequirement === "twoPoint" && !anchors?.distal) {
    addAnchorIssue(
      issues,
      "missingDistal",
      ["distal"],
      "This limb slot requires a distal source anchor."
    );
  }
  if (
    binding.sourceAnchorRequirement === "singlePoint" &&
    !Number.isFinite(binding.defaultSourceOrientation)
  ) {
    addAnchorIssue(
      issues,
      "missingDefaultOrientation",
      ["defaultSourceOrientation"],
      "Single-point slots require a versioned default source orientation."
    );
  }

  validatePoint("proximal", anchors?.proximal, sourceSize, issues);
  validatePoint("distal", anchors?.distal, sourceSize, issues);
  validatePoint("pivot", anchors?.pivot, sourceSize, issues);

  if (
    binding.sourceAnchorRequirement === "twoPoint" &&
    anchors?.proximal &&
    anchors.distal &&
    Number.isFinite(anchors.proximal.x) &&
    Number.isFinite(anchors.proximal.y) &&
    Number.isFinite(anchors.distal.x) &&
    Number.isFinite(anchors.distal.y) &&
    vectorLength(subtractVectors(anchors.distal, anchors.proximal)) <=
      SOURCE_VECTOR_EPSILON
  ) {
    addAnchorIssue(
      issues,
      "nearZeroSourceVector",
      ["distal"],
      "Proximal and distal anchors are too close to define an orientation."
    );
  }

  return issues.length === 0
    ? Object.freeze({ valid: true, issues: Object.freeze([] as const) })
    : Object.freeze({ valid: false, issues: Object.freeze(issues) });
}

/** Converts one original-image point into coordinates of the trimmed image. */
export function resolveEffectiveAnchor(
  trimRect: Rect,
  sourceAnchor: Point
): Point {
  return Object.freeze({
    x: sourceAnchor.x - trimRect.x,
    y: sourceAnchor.y - trimRect.y
  });
}

export interface BonePlacementWarning {
  readonly code: "extremeScale";
  readonly scale: number;
  readonly message: string;
}

export interface BonePlacement {
  readonly effectiveProximal: Point;
  readonly effectiveDistal?: Point;
  readonly targetParent: Point;
  readonly targetChild: Point;
  readonly sourceLength: number | null;
  readonly targetLength: number;
  readonly rotation: number;
  readonly scale: number;
  readonly translation: Point;
  readonly transform: Transform2D;
  readonly warnings: readonly BonePlacementWarning[];
}

export type BonePlacementResult =
  | Readonly<{ status: "ok"; placement: BonePlacement }>
  | Readonly<{
      status: "invalidAnchors";
      issues: readonly SourceAnchorIssue[];
    }>;

export interface ResolveBonePlacementInput {
  readonly binding: SlotBinding;
  readonly trimRect: Rect;
  readonly anchors: EditableSourceAnchors;
  readonly targetParent: Point;
  readonly targetChild: Point;
  readonly sourceSize?: Size;
}

function composePlacementTransform(
  translation: Point,
  rotation: number,
  scale: number,
  effectiveProximal: Point
): Transform2D {
  return composeTransforms(
    createTranslationTransform(translation.x, translation.y),
    createRotationTransform(rotation),
    createUniformScaleTransform(scale),
    createTranslationTransform(-effectiveProximal.x, -effectiveProximal.y)
  );
}

export function resolveBonePlacement(
  input: ResolveBonePlacementInput
): BonePlacementResult {
  const validation = validateSourceAnchors(
    input.binding,
    input.anchors,
    input.sourceSize
  );
  if (!validation.valid) {
    return Object.freeze({
      status: "invalidAnchors",
      issues: validation.issues
    });
  }

  const proximal = input.anchors.proximal;
  if (!proximal) {
    throw new Error("Validated anchors unexpectedly have no proximal point.");
  }
  const targetVector = subtractVectors(input.targetChild, input.targetParent);
  const targetLength = vectorLength(targetVector);
  const targetAngle = vectorAngle(targetVector) ?? 0;
  const effectiveProximal = resolveEffectiveAnchor(input.trimRect, proximal);
  const effectiveDistal = input.anchors.distal
    ? resolveEffectiveAnchor(input.trimRect, input.anchors.distal)
    : undefined;

  let sourceLength: number | null = null;
  let scale = 1;
  let sourceAngle: number;
  if (input.binding.sourceAnchorRequirement === "twoPoint") {
    if (!input.anchors.distal) {
      throw new Error("Validated two-point anchors unexpectedly lack distal.");
    }
    const sourceVector = subtractVectors(input.anchors.distal, proximal);
    sourceLength = vectorLength(sourceVector);
    sourceAngle = vectorAngle(sourceVector) ?? 0;
    scale = targetLength / sourceLength;
  } else {
    sourceAngle = input.binding.defaultSourceOrientation ?? 0;
  }

  const rotation = normalizeAngle(targetAngle - sourceAngle);
  const translation = Object.freeze({ ...input.targetParent });
  const warnings: BonePlacementWarning[] = [];
  if (
    scale < EXTREME_SCALE_WARNING_MIN ||
    scale > EXTREME_SCALE_WARNING_MAX
  ) {
    warnings.push(
      Object.freeze({
        code: "extremeScale",
        scale,
        message: `Automatic scale ${scale.toFixed(3)} lies outside the visible warning range ${EXTREME_SCALE_WARNING_MIN}–${EXTREME_SCALE_WARNING_MAX}; it was not clamped.`
      })
    );
  }

  return Object.freeze({
    status: "ok",
    placement: Object.freeze({
      effectiveProximal,
      ...(effectiveDistal ? { effectiveDistal } : {}),
      targetParent: Object.freeze({ ...input.targetParent }),
      targetChild: Object.freeze({ ...input.targetChild }),
      sourceLength,
      targetLength,
      rotation,
      scale,
      translation,
      transform: composePlacementTransform(
        translation,
        rotation,
        scale,
        effectiveProximal
      ),
      warnings: Object.freeze(warnings)
    })
  });
}

export interface AdjustedBonePlacement {
  readonly basePlacement: BonePlacement;
  readonly delta: TransformDelta;
  readonly rotation: number;
  readonly scale: number;
  readonly translation: Point;
  readonly transform: Transform2D;
}

/** Applies a project correction without mutating or replacing the base truth. */
export function applyTransformDelta(
  basePlacement: BonePlacement,
  delta: TransformDelta
): AdjustedBonePlacement {
  const translation = Object.freeze({
    x: basePlacement.translation.x + delta.offsetX,
    y: basePlacement.translation.y + delta.offsetY
  });
  const rotation = normalizeAngle(
    basePlacement.rotation + delta.rotationDelta
  );
  const scale = basePlacement.scale * delta.scaleMultiplier;
  return Object.freeze({
    basePlacement,
    delta: Object.freeze({ ...delta }),
    rotation,
    scale,
    translation,
    transform: composePlacementTransform(
      translation,
      rotation,
      scale,
      basePlacement.effectiveProximal
    )
  });
}

/** Default pointer behaviour: nearest whole source pixel, clamped in-frame. */
export function snapSourcePoint(point: Point, sourceSize: Size): Point {
  return Object.freeze({
    x: Math.min(sourceSize.width - 1, Math.max(0, Math.round(point.x))),
    y: Math.min(sourceSize.height - 1, Math.max(0, Math.round(point.y)))
  });
}

export function toSourceAnchors(
  anchors: EditableSourceAnchors
): SourceAnchors | null {
  if (!anchors.proximal) return null;
  return Object.freeze({
    proximal: Object.freeze({ ...anchors.proximal }),
    ...(anchors.distal
      ? { distal: Object.freeze({ ...anchors.distal }) }
      : {}),
    ...(anchors.pivot ? { pivot: Object.freeze({ ...anchors.pivot }) } : {})
  });
}
