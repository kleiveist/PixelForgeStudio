import type { MirrorPolicy } from "./animation.types";
import {
  DIRECTION_IDS,
  type Direction,
  type DirectionSourceMode
} from "./directions";
import { getMirroredSourceDirection } from "./directionProjection";
import {
  PART_SLOT_DEFINITIONS,
  type PartSlot
} from "./slots";

export const DIRECTION_COVERAGE_STATUSES = Object.freeze([
  "authoredSource",
  "mirroredValid",
  "mirroredNeedsReview",
  "mirrorForbidden",
  "missingSource",
  "optionalUnused",
  "anchorsIncomplete"
] as const);

export type DirectionCoverageStatus =
  (typeof DIRECTION_COVERAGE_STATUSES)[number];
export type EffectiveMirrorPolicy = Exclude<MirrorPolicy, "inherit">;
export type MirrorPolicySource = "part" | "project" | "kit" | "safeFallback";

export interface MirrorPolicyValidation {
  readonly valid: boolean;
  readonly effectivePolicy: EffectiveMirrorPolicy;
  readonly source: MirrorPolicySource;
  readonly issues: readonly string[];
}

export interface DirectionSourceAsset {
  readonly assetId: string;
  readonly slot: PartSlot;
  readonly direction: Direction;
  readonly anchorStatus: "anchorsPending" | "invalidAnchors" | "ready";
  readonly mirrorPolicy: MirrorPolicy;
  readonly updatedAt: string;
}

export interface DirectionMirrorReview {
  readonly assetId: string;
  readonly sourceUpdatedAt: string;
  readonly targetDirection: Direction;
}

export interface ResolveDirectionSourceInput {
  readonly mode: DirectionSourceMode;
  readonly slot: PartSlot;
  readonly targetDirection: Direction;
  readonly assets: readonly DirectionSourceAsset[];
  readonly projectMirrorPolicy?: MirrorPolicy;
  readonly kitMirrorPolicy?: MirrorPolicy;
  readonly reviews?: readonly DirectionMirrorReview[];
}

export interface DirectionSourceResolution {
  readonly slot: PartSlot;
  readonly targetDirection: Direction;
  readonly sourceDirection: Direction | null;
  readonly sourceAsset: DirectionSourceAsset | null;
  readonly status: DirectionCoverageStatus;
  readonly mirrored: boolean;
  readonly effectiveMirrorPolicy: EffectiveMirrorPolicy | null;
  readonly policySource: MirrorPolicySource | null;
  readonly reviewConfirmed: boolean;
  readonly blocksProduction: boolean;
  readonly message: string;
}

export interface ProjectDirectionCoverageRow {
  readonly slot: PartSlot;
  readonly label: string;
  readonly required: boolean;
  readonly cells: readonly DirectionSourceResolution[];
}

export interface ProjectDirectionCoverage {
  readonly directions: readonly Direction[];
  readonly rows: readonly ProjectDirectionCoverageRow[];
  readonly blockers: readonly DirectionSourceResolution[];
  readonly readyForEightDirectionExport: boolean;
}

function isResolvedPolicy(policy: MirrorPolicy | undefined): policy is EffectiveMirrorPolicy {
  return policy === "allow" || policy === "forbid";
}

export function validateMirrorPolicy(input: Readonly<{
  partPolicy: MirrorPolicy;
  projectPolicy?: MirrorPolicy;
  kitPolicy?: MirrorPolicy;
}>): MirrorPolicyValidation {
  if (isResolvedPolicy(input.partPolicy)) {
    return Object.freeze({
      valid: true,
      effectivePolicy: input.partPolicy,
      source: "part",
      issues: Object.freeze([])
    });
  }
  if (isResolvedPolicy(input.projectPolicy)) {
    return Object.freeze({
      valid: true,
      effectivePolicy: input.projectPolicy,
      source: "project",
      issues: Object.freeze([])
    });
  }
  if (isResolvedPolicy(input.kitPolicy)) {
    return Object.freeze({
      valid: true,
      effectivePolicy: input.kitPolicy,
      source: "kit",
      issues: Object.freeze([])
    });
  }
  return Object.freeze({
    valid: false,
    effectivePolicy: "forbid",
    source: "safeFallback",
    issues: Object.freeze([
      "Inherited mirror policy has no explicit project or Character Kit default; mirroring is forbidden fail-closed."
    ])
  });
}

/** Optional/equipment layers are treated as asymmetric until explicitly reviewed. */
export function partRequiresMirrorReview(slot: PartSlot): boolean {
  return !PART_SLOT_DEFINITIONS.find((definition) => definition.id === slot)?.required;
}

function sourceFor(
  assets: readonly DirectionSourceAsset[],
  slot: PartSlot,
  direction: Direction
): DirectionSourceAsset | null {
  return assets.find(
    (asset) => asset.slot === slot && asset.direction === direction
  ) ?? null;
}

function resolution(
  input: Omit<DirectionSourceResolution, "blocksProduction"> &
    Readonly<{ blocksProduction?: boolean }>
): DirectionSourceResolution {
  return Object.freeze({
    ...input,
    blocksProduction: input.blocksProduction ?? false
  });
}

export function resolveDirectionSource(
  input: ResolveDirectionSourceInput
): DirectionSourceResolution {
  const exact = sourceFor(input.assets, input.slot, input.targetDirection);
  if (exact) {
    const ready = exact.anchorStatus === "ready";
    return resolution({
      slot: input.slot,
      targetDirection: input.targetDirection,
      sourceDirection: input.targetDirection,
      sourceAsset: exact,
      status: ready ? "authoredSource" : "anchorsIncomplete",
      mirrored: false,
      effectiveMirrorPolicy: null,
      policySource: null,
      reviewConfirmed: false,
      blocksProduction: !ready,
      message: ready
        ? "Eigene Zielrichtungsquelle"
        : "Eigene Quelle mit unvollständigen Ankern"
    });
  }

  const slotDefinition = PART_SLOT_DEFINITIONS.find(
    (definition) => definition.id === input.slot
  );
  const slotAssets = input.assets.filter((asset) => asset.slot === input.slot);
  if (slotDefinition && !slotDefinition.required && slotAssets.length === 0) {
    return resolution({
      slot: input.slot,
      targetDirection: input.targetDirection,
      sourceDirection: null,
      sourceAsset: null,
      status: "optionalUnused",
      mirrored: false,
      effectiveMirrorPolicy: null,
      policySource: null,
      reviewConfirmed: false,
      message: "Optionaler Slot ist nicht belegt"
    });
  }

  const mirrorSourceDirection =
    input.mode === "fiveAuthoredPlusMirror"
      ? getMirroredSourceDirection(input.targetDirection)
      : null;
  if (!mirrorSourceDirection) {
    return resolution({
      slot: input.slot,
      targetDirection: input.targetDirection,
      sourceDirection: null,
      sourceAsset: null,
      status: "missingSource",
      mirrored: false,
      effectiveMirrorPolicy: null,
      policySource: null,
      reviewConfirmed: false,
      blocksProduction: true,
      message:
        input.mode === "singleDirectionPrototype" && input.targetDirection !== "south"
          ? "Einrichtungsprototyp ist nicht für acht Richtungen exportbereit"
          : "Eigene Richtungsquelle fehlt"
    });
  }

  const source = sourceFor(input.assets, input.slot, mirrorSourceDirection);
  if (!source) {
    return resolution({
      slot: input.slot,
      targetDirection: input.targetDirection,
      sourceDirection: mirrorSourceDirection,
      sourceAsset: null,
      status: "missingSource",
      mirrored: true,
      effectiveMirrorPolicy: null,
      policySource: null,
      reviewConfirmed: false,
      blocksProduction: true,
      message: `Spiegelquelle ${mirrorSourceDirection} fehlt`
    });
  }
  if (source.anchorStatus !== "ready") {
    return resolution({
      slot: input.slot,
      targetDirection: input.targetDirection,
      sourceDirection: mirrorSourceDirection,
      sourceAsset: source,
      status: "anchorsIncomplete",
      mirrored: true,
      effectiveMirrorPolicy: null,
      policySource: null,
      reviewConfirmed: false,
      blocksProduction: true,
      message: "Spiegelquelle besitzt unvollständige Anker"
    });
  }

  const policy = validateMirrorPolicy({
    partPolicy: source.mirrorPolicy,
    ...(input.projectMirrorPolicy
      ? { projectPolicy: input.projectMirrorPolicy }
      : {}),
    ...(input.kitMirrorPolicy ? { kitPolicy: input.kitMirrorPolicy } : {})
  });
  if (policy.effectivePolicy === "forbid") {
    return resolution({
      slot: input.slot,
      targetDirection: input.targetDirection,
      sourceDirection: mirrorSourceDirection,
      sourceAsset: source,
      status: "mirrorForbidden",
      mirrored: true,
      effectiveMirrorPolicy: policy.effectivePolicy,
      policySource: policy.source,
      reviewConfirmed: false,
      blocksProduction: true,
      message: "Spiegelung ist verboten; eigene Zielquelle erforderlich"
    });
  }

  const reviewed = input.reviews?.some(
    (review) =>
      review.assetId === source.assetId &&
      review.sourceUpdatedAt === source.updatedAt &&
      review.targetDirection === input.targetDirection
  ) ?? false;
  const needsReview = partRequiresMirrorReview(input.slot) && !reviewed;
  return resolution({
    slot: input.slot,
    targetDirection: input.targetDirection,
    sourceDirection: mirrorSourceDirection,
    sourceAsset: source,
    status: needsReview ? "mirroredNeedsReview" : "mirroredValid",
    mirrored: true,
    effectiveMirrorPolicy: policy.effectivePolicy,
    policySource: policy.source,
    reviewConfirmed: reviewed,
    blocksProduction: needsReview,
    message: needsReview
      ? "Gespiegelte asymmetrische Quelle muss ausdrücklich geprüft werden"
      : reviewed
        ? "Gespiegelte Quelle wurde ausdrücklich geprüft"
        : "Gültig gespiegelte Quelle"
  });
}

export function resolveProjectDirectionCoverage(input: Readonly<{
  mode: DirectionSourceMode;
  assets: readonly DirectionSourceAsset[];
  projectMirrorPolicy?: MirrorPolicy;
  kitMirrorPolicy?: MirrorPolicy;
  reviews?: readonly DirectionMirrorReview[];
}>): ProjectDirectionCoverage {
  const rows = PART_SLOT_DEFINITIONS.map((definition) =>
    Object.freeze({
      slot: definition.id,
      label: definition.label,
      required: definition.required,
      cells: Object.freeze(
        DIRECTION_IDS.map((targetDirection) =>
          resolveDirectionSource({
            mode: input.mode,
            slot: definition.id,
            targetDirection,
            assets: input.assets,
            ...(input.projectMirrorPolicy
              ? { projectMirrorPolicy: input.projectMirrorPolicy }
              : {}),
            ...(input.kitMirrorPolicy
              ? { kitMirrorPolicy: input.kitMirrorPolicy }
              : {}),
            ...(input.reviews ? { reviews: input.reviews } : {})
          })
        )
      )
    })
  );
  const blockers = rows.flatMap((row) =>
    row.cells.filter((cell) => cell.blocksProduction)
  );
  return Object.freeze({
    directions: DIRECTION_IDS,
    rows: Object.freeze(rows),
    blockers: Object.freeze(blockers),
    readyForEightDirectionExport:
      input.mode !== "singleDirectionPrototype" && blockers.length === 0
  });
}
