import type { FrameProfile, MirrorPolicy, RigTemplateId } from "./animation.types";
import {
  resolveDirectionSource,
  resolveProjectDirectionCoverage,
  type DirectionMirrorReview,
  type DirectionSourceAsset,
  type DirectionCoverageStatus
} from "./coverage";
import type { DirectionSourceMode } from "./directions";
import {
  DEFAULT_FREE_ACCESSORY_LAYER_GROUP,
  getDefaultLayerGroup,
  isFreeAccessorySlot,
  type LayerGroup
} from "./layerOrder";
import {
  normalizeFrameOverride,
  type FrameOverride,
  type FrameOverrideAddress
} from "./frameOverrides";
import { createRigCompatibilityKey, type RigTemplate } from "./rigTemplate";
import { isJointId } from "./rigTopology";
import type { PartSlot } from "./slots";

export interface CharacterKitCoverageSummary {
  readonly requiredCellCount: number;
  readonly resolvedRequiredCellCount: number;
  readonly authoredRequiredCellCount: number;
  readonly mirroredRequiredCellCount: number;
  readonly anchorsIncompleteCount: number;
  readonly mirrorReviewCount: number;
  readonly mirrorForbiddenCount: number;
  readonly productionReady: boolean;
}

export interface CharacterKitContract {
  readonly kitId: string;
  readonly rigTemplateId: RigTemplateId;
  readonly rigCompatibilityKey: string;
  readonly directionSourceMode: DirectionSourceMode;
  readonly mirrorPolicy: MirrorPolicy;
  readonly partAssetIds: readonly string[];
}

export interface CharacterKitProjectPartAssignment {
  readonly assetId: string;
  readonly transformDelta?: Readonly<{
    offsetX: number;
    offsetY: number;
    rotationDelta: number;
    scaleMultiplier: number;
  }> | undefined;
  readonly layerOffset?: number | undefined;
  readonly mirrorPolicy?: MirrorPolicy | undefined;
}

export interface CharacterKitProjectContract {
  readonly projectId: string;
  readonly rigTemplateId: RigTemplateId;
  readonly frameProfile: FrameProfile;
  readonly directionSourceMode: DirectionSourceMode;
  readonly mirrorPolicy: MirrorPolicy;
  readonly parts: readonly CharacterKitProjectPartAssignment[];
  readonly overrides: readonly FrameOverride[];
  readonly mirrorReviews: readonly DirectionMirrorReview[];
  readonly updatedAt: string;
}

export interface CharacterKitPartAsset extends DirectionSourceAsset {
  readonly attachmentJointId?: string | undefined;
}

export const CHARACTER_KIT_COMPATIBILITY_ISSUE_CODES = Object.freeze([
  "missingRigTemplate",
  "projectRigMismatch",
  "kitRigMismatch",
  "compatibilityKeyMismatch"
] as const);

export type CharacterKitCompatibilityIssueCode =
  (typeof CHARACTER_KIT_COMPATIBILITY_ISSUE_CODES)[number];

export interface CharacterKitCompatibilityIssue {
  readonly code: CharacterKitCompatibilityIssueCode;
  readonly message: string;
}

export interface CharacterKitCompatibilityResult {
  readonly compatible: boolean;
  readonly expectedKey: string | null;
  readonly issues: readonly CharacterKitCompatibilityIssue[];
}

export interface CharacterKitOverrideConflict extends FrameOverrideAddress {
  readonly slots: readonly PartSlot[];
  readonly statuses: Readonly<Partial<Record<PartSlot, DirectionCoverageStatus>>>;
}

export interface CharacterKitApplicationAssessment {
  readonly compatibility: CharacterKitCompatibilityResult;
  readonly coverage: CharacterKitCoverageSummary;
  readonly missingAssetIds: readonly string[];
  readonly overrideConflicts: readonly CharacterKitOverrideConflict[];
}

export type CharacterKitApplyResult<Project extends CharacterKitProjectContract> =
  | Readonly<{
      status: "ok";
      project: Project;
      assessment: CharacterKitApplicationAssessment;
      removedOverrideSlots: number;
    }>
  | Readonly<{
      status: "incompatible" | "missingAssets" | "overrideConflict";
      assessment: CharacterKitApplicationAssessment;
    }>;

function freezeCompatibilityIssue(
  code: CharacterKitCompatibilityIssueCode,
  message: string
): CharacterKitCompatibilityIssue {
  return Object.freeze({ code, message });
}

/** Pure, fail-closed compatibility check. Project and its frame profile own the target. */
export function checkCharacterKitCompatibility(
  kit: CharacterKitContract,
  project: CharacterKitProjectContract,
  template: RigTemplate | null
): CharacterKitCompatibilityResult {
  const issues: CharacterKitCompatibilityIssue[] = [];
  if (!template) {
    issues.push(
      freezeCompatibilityIssue(
        "missingRigTemplate",
        `Rig-Vorlage ${project.rigTemplateId} ist nicht verfügbar.`
      )
    );
    return Object.freeze({
      compatible: false,
      expectedKey: null,
      issues: Object.freeze(issues)
    });
  }
  if (template.id !== project.rigTemplateId) {
    issues.push(
      freezeCompatibilityIssue(
        "projectRigMismatch",
        "Die geladene Rig-Vorlage gehört nicht zum Projekt."
      )
    );
  }
  if (kit.rigTemplateId !== project.rigTemplateId) {
    issues.push(
      freezeCompatibilityIssue(
        "kitRigMismatch",
        `Kit-Rig ${kit.rigTemplateId} passt nicht zu Projekt-Rig ${project.rigTemplateId}.`
      )
    );
  }
  const expectedKey = createRigCompatibilityKey(template, project.frameProfile);
  if (kit.rigCompatibilityKey !== expectedKey) {
    issues.push(
      freezeCompatibilityIssue(
        "compatibilityKeyMismatch",
        "Frameprofil, Charakterhöhe oder Rig-Contract des Kits ist inkompatibel."
      )
    );
  }
  return Object.freeze({
    compatible: issues.length === 0,
    expectedKey,
    issues: Object.freeze(issues)
  });
}

/** Compact persisted read model; source assets and detailed matrices stay canonical. */
export function summarizeCharacterKitCoverage(input: Readonly<{
  mode: DirectionSourceMode;
  assets: readonly DirectionSourceAsset[];
  projectMirrorPolicy?: MirrorPolicy;
  kitMirrorPolicy?: MirrorPolicy;
  reviews?: readonly DirectionMirrorReview[];
}>): CharacterKitCoverageSummary {
  const coverage = resolveProjectDirectionCoverage(input);
  const requiredCells = coverage.rows
    .filter((row) => row.required)
    .flatMap((row) => row.cells);
  const allCells = coverage.rows.flatMap((row) => row.cells);
  const authoredRequiredCellCount = requiredCells.filter(
    (cell) => cell.status === "authoredSource"
  ).length;
  const mirroredRequiredCellCount = requiredCells.filter(
    (cell) => cell.status === "mirroredValid"
  ).length;
  return Object.freeze({
    requiredCellCount: requiredCells.length,
    resolvedRequiredCellCount:
      authoredRequiredCellCount + mirroredRequiredCellCount,
    authoredRequiredCellCount,
    mirroredRequiredCellCount,
    anchorsIncompleteCount: allCells.filter(
      (cell) => cell.status === "anchorsIncomplete"
    ).length,
    mirrorReviewCount: allCells.filter(
      (cell) => cell.status === "mirroredNeedsReview"
    ).length,
    mirrorForbiddenCount: allCells.filter(
      (cell) => cell.status === "mirrorForbidden"
    ).length,
    productionReady: coverage.readyForEightDirectionExport
  });
}

function kitAssets(
  kit: CharacterKitContract,
  assets: readonly CharacterKitPartAsset[]
): readonly CharacterKitPartAsset[] {
  const ids = new Set(kit.partAssetIds);
  return Object.freeze(assets.filter((asset) => ids.has(asset.assetId)));
}

export function assessCharacterKitApplication(
  kit: CharacterKitContract,
  project: CharacterKitProjectContract,
  template: RigTemplate | null,
  assets: readonly CharacterKitPartAsset[]
): CharacterKitApplicationAssessment {
  const selectedAssets = kitAssets(kit, assets);
  const selectedIds = new Set(selectedAssets.map((asset) => asset.assetId));
  const missingAssetIds = kit.partAssetIds.filter((id) => !selectedIds.has(id));
  const retainedReviews = project.mirrorReviews.filter((review) =>
    selectedIds.has(review.assetId)
  );
  const coverage = summarizeCharacterKitCoverage({
    mode: kit.directionSourceMode,
    assets: selectedAssets,
    kitMirrorPolicy: kit.mirrorPolicy,
    reviews: retainedReviews
  });
  const overrideConflicts = project.overrides.flatMap((override) => {
    const statuses: Partial<Record<PartSlot, DirectionCoverageStatus>> = {};
    const invalidSlots = Object.keys(override.partDeltas ?? {}).filter(
      (slot): slot is PartSlot => {
        const resolution = resolveDirectionSource({
          mode: kit.directionSourceMode,
          slot: slot as PartSlot,
          targetDirection: override.direction,
          assets: selectedAssets,
          kitMirrorPolicy: kit.mirrorPolicy,
          reviews: retainedReviews
        });
        const valid =
          resolution.status === "authoredSource" ||
          resolution.status === "mirroredValid";
        if (!valid) statuses[slot as PartSlot] = resolution.status;
        return !valid;
      }
    );
    return invalidSlots.length === 0
      ? []
      : [
          Object.freeze({
            clipId: override.clipId,
            direction: override.direction,
            frameIndex: override.frameIndex,
            slots: Object.freeze(invalidSlots),
            statuses: Object.freeze(statuses)
          })
        ];
  });
  return Object.freeze({
    compatibility: checkCharacterKitCompatibility(kit, project, template),
    coverage,
    missingAssetIds: Object.freeze(missingAssetIds),
    overrideConflicts: Object.freeze(overrideConflicts)
  });
}

function cleanConflictingPartDeltas(
  overrides: readonly FrameOverride[],
  conflicts: readonly CharacterKitOverrideConflict[]
): readonly FrameOverride[] {
  const conflictsByAddress = new Map(
    conflicts.map((conflict) => [
      `${conflict.clipId}:${conflict.direction}:${conflict.frameIndex}`,
      new Set(conflict.slots)
    ])
  );
  return Object.freeze(
    overrides.flatMap((override) => {
      const slots = conflictsByAddress.get(
        `${override.clipId}:${override.direction}:${override.frameIndex}`
      );
      if (!slots) return [override];
      const partDeltas = Object.fromEntries(
        Object.entries(override.partDeltas ?? {}).filter(([slot]) =>
          !slots.has(slot as PartSlot)
        )
      );
      const normalized = normalizeFrameOverride({
        ...override,
        partDeltas: Object.keys(partDeltas).length > 0 ? partDeltas : undefined
      });
      return normalized ? [normalized] : [];
    })
  );
}

/** Applies only metadata references. Rig, clips and every binary source stay untouched. */
export function applyCharacterKitToProject<
  Project extends CharacterKitProjectContract
>(input: Readonly<{
  kit: CharacterKitContract;
  project: Project;
  template: RigTemplate | null;
  assets: readonly CharacterKitPartAsset[];
  timestamp: string;
  overrideResolution: "abort" | "removeInvalidPartDeltas";
}>): CharacterKitApplyResult<Project> {
  const assessment = assessCharacterKitApplication(
    input.kit,
    input.project,
    input.template,
    input.assets
  );
  if (!assessment.compatibility.compatible) {
    return Object.freeze({ status: "incompatible", assessment });
  }
  if (assessment.missingAssetIds.length > 0) {
    return Object.freeze({ status: "missingAssets", assessment });
  }
  if (
    assessment.overrideConflicts.length > 0 &&
    input.overrideResolution === "abort"
  ) {
    return Object.freeze({ status: "overrideConflict", assessment });
  }

  const retainedAssignments = new Map(
    input.project.parts.map((assignment) => [assignment.assetId, assignment])
  );
  const partIds = new Set(input.kit.partAssetIds);
  const parts = input.kit.partAssetIds.map((assetId) => {
    const retained = retainedAssignments.get(assetId);
    return retained
      ? Object.freeze({
          assetId,
          ...(retained.transformDelta
            ? { transformDelta: retained.transformDelta }
            : {}),
          ...(retained.layerOffset !== undefined
            ? { layerOffset: retained.layerOffset }
            : {})
        })
      : Object.freeze({ assetId });
  });
  const assetsById = new Map(input.assets.map((asset) => [asset.assetId, asset]));
  const mirrorReviews = input.project.mirrorReviews.filter((review) => {
    const source = assetsById.get(review.assetId);
    return (
      partIds.has(review.assetId) &&
      source?.updatedAt === review.sourceUpdatedAt
    );
  });
  const overrides =
    input.overrideResolution === "removeInvalidPartDeltas"
      ? cleanConflictingPartDeltas(
          input.project.overrides,
          assessment.overrideConflicts
        )
      : input.project.overrides;
  const removedOverrideSlots = assessment.overrideConflicts.reduce(
    (sum, conflict) => sum + conflict.slots.length,
    0
  );
  const project = Object.freeze({
    ...input.project,
    directionSourceMode: input.kit.directionSourceMode,
    mirrorPolicy: input.kit.mirrorPolicy,
    parts: Object.freeze(parts),
    mirrorReviews: Object.freeze(mirrorReviews),
    overrides,
    updatedAt: input.timestamp
  }) as Project;
  return Object.freeze({
    status: "ok",
    project,
    assessment,
    removedOverrideSlots
  });
}

export type EquipCharacterPartResult<Project extends CharacterKitProjectContract> =
  | Readonly<{
      status: "ok";
      project: Project;
      replacedAssetIds: readonly string[];
      defaultLayerGroup: LayerGroup;
    }>
  | Readonly<{ status: "invalid"; message: string }>;

/** Reference-only inventory mutation; matching slot+direction is replaced atomically. */
export function equipCharacterPart<
  Project extends CharacterKitProjectContract
>(input: Readonly<{
  project: Project;
  asset: CharacterKitPartAsset;
  assignedAssets: readonly CharacterKitPartAsset[];
  timestamp: string;
}>): EquipCharacterPartResult<Project> {
  const defaultLayerGroup = getDefaultLayerGroup(
    input.asset.direction,
    input.asset.slot
  );
  if (!defaultLayerGroup) {
    return Object.freeze({
      status: "invalid",
      message: `Slot ${input.asset.slot} besitzt keine gültige LayerGroup.`
    });
  }
  if (
    isFreeAccessorySlot(input.asset.slot) &&
    !input.asset.attachmentJointId
  ) {
    return Object.freeze({
      status: "invalid",
      message: `Freies Accessoire ${input.asset.slot} benötigt einen Attachment-Joint.`
    });
  }
  if (
    isFreeAccessorySlot(input.asset.slot) &&
    !isJointId(input.asset.attachmentJointId)
  ) {
    return Object.freeze({
      status: "invalid",
      message: `Attachment-Joint ${input.asset.attachmentJointId} ist für ${input.asset.slot} ungültig.`
    });
  }
  if (
    isFreeAccessorySlot(input.asset.slot) &&
    defaultLayerGroup !== DEFAULT_FREE_ACCESSORY_LAYER_GROUP
  ) {
    return Object.freeze({
      status: "invalid",
      message: `Freies Accessoire ${input.asset.slot} benötigt die Default-LayerGroup ${DEFAULT_FREE_ACCESSORY_LAYER_GROUP}.`
    });
  }

  const replacedAssetIds = input.assignedAssets
    .filter(
      (asset) =>
        asset.assetId !== input.asset.assetId &&
        asset.slot === input.asset.slot &&
        asset.direction === input.asset.direction
    )
    .map((asset) => asset.assetId);
  const replaced = new Set(replacedAssetIds);
  const retainedParts = input.project.parts.filter(
    (assignment) => !replaced.has(assignment.assetId)
  );
  const alreadyAssigned = retainedParts.some(
    (assignment) => assignment.assetId === input.asset.assetId
  );
  const project = Object.freeze({
    ...input.project,
    parts: Object.freeze([
      ...retainedParts,
      ...(alreadyAssigned ? [] : [Object.freeze({ assetId: input.asset.assetId })])
    ]),
    mirrorReviews: Object.freeze(
      input.project.mirrorReviews.filter(
        (review) => !replaced.has(review.assetId)
      )
    ),
    updatedAt: input.timestamp
  }) as Project;
  return Object.freeze({
    status: "ok",
    project,
    replacedAssetIds: Object.freeze(replacedAssetIds),
    defaultLayerGroup
  });
}

export function removeCharacterPart<Project extends CharacterKitProjectContract>(
  project: Project,
  assetId: string,
  timestamp: string
): Project {
  return Object.freeze({
    ...project,
    parts: Object.freeze(
      project.parts.filter((assignment) => assignment.assetId !== assetId)
    ),
    mirrorReviews: Object.freeze(
      project.mirrorReviews.filter((review) => review.assetId !== assetId)
    ),
    updatedAt: timestamp
  }) as Project;
}
