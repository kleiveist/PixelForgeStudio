import {
  REQUIRED_PART_SLOT_IDS,
  REQUIRED_SLOT_JOINT_BINDINGS,
  getRequiredAuthoredDirections,
  isRequiredPartSlot,
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
      code: "missingDistalAnchor";
      assetId: AnimationPartAsset["assetId"];
      slot: RequiredPartSlot;
      direction: Direction;
    }>
  | Readonly<{
      code: "anchorsPending";
      assetId: AnimationPartAsset["assetId"];
      slot: PartSlot;
      direction: Direction;
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
    }
  }

  const requiredSources = new Map<string, AnimationPartAsset>();
  for (const asset of referencedAssets) {
    if (isRequiredPartSlot(asset.slot)) {
      requiredSources.set(sourceKey(asset.slot, asset.direction), asset);
    }
  }

  const bindingBySlot = new Map(
    REQUIRED_SLOT_JOINT_BINDINGS.map((binding) => [binding.slotId, binding])
  );

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

      if (
        asset.anchorStatus === "ready" &&
        bindingBySlot.get(slot)?.sourceAnchorRequirement === "twoPoint" &&
        asset.anchors?.distal === undefined
      ) {
        issues.push(
          Object.freeze({
            code: "missingDistalAnchor",
            assetId: asset.assetId,
            slot,
            direction
          })
        );
      }
    }
  }

  return Object.freeze(issues);
}
