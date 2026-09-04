import { describe, expect, it } from "vitest";
import { parseAnimationProject } from "../../schemas";
import { createAnimationProjectSummary } from "../../services";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import { filterAndSortAnimationProjects } from "./animationProjectsData";

const forest = createAnimationProjectSummary(
  parseAnimationProject(
    createAnimationProjectInput({
      projectId: "project_forest_001",
      name: "Waldlauf",
      updatedAt: "2026-09-04T13:00:00.000Z"
    })
  )
);
const castle = createAnimationProjectSummary(
  parseAnimationProject(
    createAnimationProjectInput({
      projectId: "project_castle_001",
      name: "Burgwache",
      updatedAt: "2026-09-04T14:00:00.000Z",
      directionSourceMode: "eightAuthored"
    })
  )
);

describe("filterAndSortAnimationProjects", () => {
  it("sorts by recency and name without mutating its source", () => {
    const source = [forest, castle];

    expect(
      filterAndSortAnimationProjects(source, "", "updatedDesc").map(
        ({ name }) => name
      )
    ).toEqual(["Burgwache", "Waldlauf"]);
    expect(
      filterAndSortAnimationProjects(source, "", "nameDesc").map(
        ({ name }) => name
      )
    ).toEqual(["Waldlauf", "Burgwache"]);
    expect(source).toEqual([forest, castle]);
  });

  it("searches project name, rig, raw mode and localized mode label", () => {
    expect(
      filterAndSortAnimationProjects([forest, castle], "8 eigene", "nameAsc")
    ).toEqual([castle]);
    expect(
      filterAndSortAnimationProjects([forest, castle], "humanoid-80", "nameAsc")
    ).toHaveLength(2);
    expect(
      filterAndSortAnimationProjects([forest, castle], "unbekannt", "nameAsc")
    ).toEqual([]);
  });
});
