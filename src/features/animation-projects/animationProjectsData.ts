import type { DirectionSourceMode } from "../../domain/animation";
import type { AnimationProjectSummary } from "../../services";

export type AnimationProjectSort =
  | "updatedDesc"
  | "updatedAsc"
  | "nameAsc"
  | "nameDesc";

export const DIRECTION_SOURCE_MODE_LABELS: Readonly<
  Record<DirectionSourceMode, string>
> = Object.freeze({
  singleDirectionPrototype: "Einzelrichtungs-Prototyp",
  fiveAuthoredPlusMirror: "5 Originale + 3 Spiegelrichtungen",
  eightAuthored: "8 eigene Richtungsquellen"
});

function compareProjectSummaries(
  left: AnimationProjectSummary,
  right: AnimationProjectSummary,
  sort: AnimationProjectSort
): number {
  switch (sort) {
    case "updatedDesc":
      return (
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.projectId.localeCompare(right.projectId)
      );
    case "updatedAsc":
      return (
        left.updatedAt.localeCompare(right.updatedAt) ||
        left.projectId.localeCompare(right.projectId)
      );
    case "nameAsc":
      return (
        left.name.localeCompare(right.name, "de", { sensitivity: "base" }) ||
        left.projectId.localeCompare(right.projectId)
      );
    case "nameDesc":
      return (
        right.name.localeCompare(left.name, "de", { sensitivity: "base" }) ||
        left.projectId.localeCompare(right.projectId)
      );
  }
}

export function filterAndSortAnimationProjects(
  summaries: readonly AnimationProjectSummary[],
  query: string,
  sort: AnimationProjectSort
): readonly AnimationProjectSummary[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("de-DE");
  const filtered = normalizedQuery
    ? summaries.filter((summary) => {
        const haystack = [
          summary.name,
          summary.rigTemplateId,
          summary.directionSourceMode,
          DIRECTION_SOURCE_MODE_LABELS[summary.directionSourceMode]
        ]
          .join(" ")
          .toLocaleLowerCase("de-DE");
        return haystack.includes(normalizedQuery);
      })
    : summaries;

  return Object.freeze(
    [...filtered].sort((left, right) =>
      compareProjectSummaries(left, right, sort)
    )
  );
}
