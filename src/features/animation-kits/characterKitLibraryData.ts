import type { CharacterKit } from "../../schemas";

export type CharacterKitCoverageFilter = "all" | "ready" | "draft";
export type CharacterKitRigFilter = "all" | CharacterKit["rigTemplateId"];

export function filterCharacterKits(
  kits: readonly CharacterKit[],
  query: string,
  rig: CharacterKitRigFilter,
  coverage: CharacterKitCoverageFilter
): readonly CharacterKit[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("de");
  return Object.freeze(
    kits.filter((kit) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${kit.name} ${kit.description} ${kit.kitId}`
          .toLocaleLowerCase("de")
          .includes(normalizedQuery);
      const matchesRig = rig === "all" || kit.rigTemplateId === rig;
      const matchesCoverage =
        coverage === "all" ||
        (coverage === "ready"
          ? kit.coverage.productionReady
          : !kit.coverage.productionReady);
      return matchesQuery && matchesRig && matchesCoverage;
    })
  );
}
