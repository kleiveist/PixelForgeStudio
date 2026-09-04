import {
  resolveProjectDirectionCoverage,
  type Direction,
  type DirectionCoverageStatus,
  type DirectionSourceResolution,
  type PartSlot
} from "../../domain/animation";
import type { AnimationPartAsset, AnimationProject } from "../../schemas";

export type PartCoverageStatus = DirectionCoverageStatus;

export interface PartCoverageCell extends DirectionSourceResolution {
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
  readonly blockers: readonly PartCoverageCell[];
  readonly readyForEightDirectionExport: boolean;
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
  const assignedIds = new Set(project.parts.map(({ assetId }) => assetId));
  const assignedAssets = assets
    .filter((asset) => assignedIds.has(asset.assetId))
    .map((asset) => {
      const assignment = project.parts.find(
        ({ assetId }) => assetId === asset.assetId
      );
      return assignment?.mirrorPolicy
        ? Object.freeze({ ...asset, mirrorPolicy: assignment.mirrorPolicy })
        : asset;
    });
  const resolved = resolveProjectDirectionCoverage({
    mode: project.directionSourceMode,
    assets: assignedAssets,
    projectMirrorPolicy: project.mirrorPolicy,
    reviews: project.mirrorReviews
  });
  const rows = resolved.rows.map((row) =>
    Object.freeze({
      ...row,
      cells: Object.freeze(
        row.cells.map((cell) =>
          Object.freeze({
            ...cell,
            asset: cell.sourceAsset as AnimationPartAsset | null
          })
        )
      )
    })
  );
  const cellByKey = new Map(
    rows.flatMap((row) =>
      row.cells.map((cell) => [`${cell.slot}:${cell.targetDirection}`, cell] as const)
    )
  );
  return Object.freeze({
    directions: resolved.directions,
    rows: Object.freeze(rows),
    blockers: Object.freeze(
      resolved.blockers.flatMap((blocker) => {
        const cell = cellByKey.get(`${blocker.slot}:${blocker.targetDirection}`);
        return cell ? [cell] : [];
      })
    ),
    readyForEightDirectionExport: resolved.readyForEightDirectionExport
  });
}
