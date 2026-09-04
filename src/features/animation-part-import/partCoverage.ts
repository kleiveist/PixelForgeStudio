import {
  PART_SLOT_DEFINITIONS,
  getRequiredAuthoredDirections,
  type Direction,
  type PartSlot
} from "../../domain/animation";
import type { AnimationPartAsset, AnimationProject } from "../../schemas";

export type PartCoverageStatus =
  | "ready"
  | "missing"
  | "anchorsPending"
  | "invalidAnchors";

export interface PartCoverageCell {
  readonly slot: PartSlot;
  readonly direction: Direction;
  readonly status: PartCoverageStatus;
  readonly asset: AnimationPartAsset | null;
}

export interface PartCoverageRow {
  readonly slot: PartSlot;
  readonly label: string;
  readonly required: boolean;
  readonly cells: readonly PartCoverageCell[];
}

export interface PartCoverageMatrix {
  readonly directions: readonly Direction[];
  readonly rows: readonly PartCoverageRow[];
}

export function findPartAssetForSource(
  assets: readonly AnimationPartAsset[],
  slot: PartSlot,
  direction: Direction
): AnimationPartAsset | null {
  return (
    assets.find((asset) => asset.slot === slot && asset.direction === direction) ?? null
  );
}

export function createPartCoverageMatrix(
  project: AnimationProject,
  assets: readonly AnimationPartAsset[]
): PartCoverageMatrix {
  const directions = getRequiredAuthoredDirections(project.directionSourceMode);
  const rows = PART_SLOT_DEFINITIONS.map((slot) => {
    const cells = directions.map((direction) => {
      const asset = findPartAssetForSource(assets, slot.id, direction);
      const status: PartCoverageStatus = asset
        ? asset.anchorStatus === "anchorsPending"
          ? "anchorsPending"
          : asset.anchorStatus === "invalidAnchors"
            ? "invalidAnchors"
            : "ready"
        : "missing";
      return Object.freeze({ slot: slot.id, direction, status, asset });
    });
    return Object.freeze({
      slot: slot.id,
      label: slot.label,
      required: slot.required,
      cells: Object.freeze(cells)
    });
  });
  return Object.freeze({ directions, rows: Object.freeze(rows) });
}
