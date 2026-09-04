import {
  DIRECTION_IDS,
  REQUIRED_PART_SLOT_IDS,
  getRequiredAuthoredDirections,
  isRequiredPartSlot,
  resolveProjectDirectionCoverage,
  resolveDirectionDrawOrder,
  type Direction,
  type PartSlot,
  type RequiredPartSlot
} from "../domain/animation";
import type { AnimationPartAsset } from "./animationPartAsset.schema";
import type { AnimationProject } from "./animationProject.schema";

export type AnimationProductionIssue =
  | Readonly<{
      code: "missingPartAsset";
      assetId: AnimationPartAsset["assetId"];
    }>
  | Readonly<{
      code: "missingRequiredSource";
      slot: RequiredPartSlot;
      direction: Direction;
    }>
  | Readonly<{
      code: "anchorsPending";
      assetId: AnimationPartAsset["assetId"];
      slot: PartSlot;
      direction: Direction;
    }>
  | Readonly<{
      code: "invalidAnchors";
      assetId: AnimationPartAsset["assetId"];
      slot: PartSlot;
      direction: Direction;
    }>
  | Readonly<{
      code: "duplicatePartSlot";
      slot: PartSlot;
      direction: Direction;
      assetIds: readonly AnimationPartAsset["assetId"][];
    }>
  | Readonly<{
      code: "missingAttachmentJoint";
      assetId: AnimationPartAsset["assetId"];
      slot: PartSlot;
      direction: Direction;
    }>
  | Readonly<{
      code: "mirrorForbidden" | "mirrorReviewRequired";
      assetId: AnimationPartAsset["assetId"];
      slot: PartSlot;
      sourceDirection: Direction;
      targetDirection: Direction;
    }>;

function sourceKey(slot: RequiredPartSlot, direction: Direction): string {
  return `${slot}:${direction}`;
}

export function validateAnimationProjectProductionSources(
  project: AnimationProject,
  availablePartAssets: readonly AnimationPartAsset[]
): readonly AnimationProductionIssue[] {
  const assetsById = new Map(
    availablePartAssets.map((asset) => [asset.assetId, asset])
  );
  const referencedAssets: AnimationPartAsset[] = [];
  const issues: AnimationProductionIssue[] = [];

  for (const assignment of project.parts) {
    const asset = assetsById.get(assignment.assetId);
    if (!asset) {
      issues.push(
        Object.freeze({
          code: "missingPartAsset",
          assetId: assignment.assetId
        })
      );
      continue;
    }
    referencedAssets.push(asset);
    if (asset.anchorStatus === "anchorsPending") {
      issues.push(
        Object.freeze({
          code: "anchorsPending",
          assetId: asset.assetId,
          slot: asset.slot,
          direction: asset.direction
        })
      );
    } else if (asset.anchorStatus === "invalidAnchors") {
      issues.push(
        Object.freeze({
          code: "invalidAnchors",
          assetId: asset.assetId,
          slot: asset.slot,
          direction: asset.direction
        })
      );
    }
  }

  const requiredSources = new Map<string, AnimationPartAsset>();
  for (const asset of referencedAssets) {
    if (isRequiredPartSlot(asset.slot)) {
      requiredSources.set(sourceKey(asset.slot, asset.direction), asset);
    }
  }

  for (const direction of getRequiredAuthoredDirections(
    project.directionSourceMode
  )) {
    for (const slot of REQUIRED_PART_SLOT_IDS) {
      const asset = requiredSources.get(sourceKey(slot, direction));
      if (!asset) {
        issues.push(
          Object.freeze({
            code: "missingRequiredSource",
            slot,
            direction
          })
        );
        continue;
      }
    }
  }

  const assignmentByAssetId = new Map(
    project.parts.map((assignment) => [assignment.assetId, assignment])
  );
  const coverageAssets = referencedAssets.map((asset) => {
    const assignment = assignmentByAssetId.get(asset.assetId);
    return assignment?.mirrorPolicy
      ? Object.freeze({ ...asset, mirrorPolicy: assignment.mirrorPolicy })
      : asset;
  });
  const coverage = resolveProjectDirectionCoverage({
    mode: project.directionSourceMode,
    assets: coverageAssets,
    projectMirrorPolicy: project.mirrorPolicy,
    reviews: project.mirrorReviews
  });
  for (const cell of coverage.rows.flatMap((row) => row.cells)) {
    if (
      !cell.sourceAsset ||
      !cell.sourceDirection ||
      (cell.status !== "mirrorForbidden" &&
        cell.status !== "mirroredNeedsReview")
    ) {
      continue;
    }
    issues.push(Object.freeze({
      code:
        cell.status === "mirrorForbidden"
          ? "mirrorForbidden"
          : "mirrorReviewRequired",
      assetId: cell.sourceAsset.assetId as AnimationPartAsset["assetId"],
      slot: cell.slot,
      sourceDirection: cell.sourceDirection,
      targetDirection: cell.targetDirection
    }));
  }

  for (const direction of DIRECTION_IDS) {
    const directionAssets = referencedAssets.filter(
      (asset) => asset.direction === direction
    );
    if (directionAssets.length === 0) continue;
    const resolution = resolveDirectionDrawOrder(
      direction,
      directionAssets.map((asset) => {
        const assignment = assignmentByAssetId.get(asset.assetId);
        return {
          id: asset.assetId,
          slot: asset.slot,
          ...(asset.attachmentJointId
            ? { attachmentJointId: asset.attachmentJointId }
            : {}),
          ...(assignment?.layerOffset !== undefined
            ? { layerOffset: assignment.layerOffset }
            : {})
        };
      })
    );
    if (resolution.status === "ok") continue;
    for (const drawOrderIssue of resolution.issues) {
      if (drawOrderIssue.code === "duplicateSlot") {
        const partIndex = drawOrderIssue.path[1];
        const slot =
          typeof partIndex === "number"
            ? directionAssets[partIndex]?.slot
            : undefined;
        if (!slot) continue;
        if (
          issues.some(
            (issue) =>
              issue.code === "duplicatePartSlot" &&
              issue.direction === direction &&
              issue.slot === slot
          )
        ) {
          continue;
        }
        issues.push(
          Object.freeze({
            code: "duplicatePartSlot",
            slot,
            direction,
            assetIds: Object.freeze(
              directionAssets
                .filter((asset) => asset.slot === slot)
                .map((asset) => asset.assetId)
            )
          })
        );
      }
      if (drawOrderIssue.code === "missingAttachmentJoint") {
        const partIndex = drawOrderIssue.path[1];
        const asset =
          typeof partIndex === "number" ? directionAssets[partIndex] : undefined;
        if (!asset) continue;
        issues.push(
          Object.freeze({
            code: "missingAttachmentJoint",
            assetId: asset.assetId,
            slot: asset.slot,
            direction
          })
        );
      }
    }
  }

  return Object.freeze(issues);
}
