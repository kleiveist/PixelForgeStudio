import { describe, expect, it } from "vitest";
import { parseCharacterKit } from "../../schemas";
import { createCharacterKitInput } from "../../test/animationSchemaFixtures";
import { filterCharacterKits } from "./characterKitLibraryData";

describe("filterCharacterKits", () => {
  const ready = parseCharacterKit(
    createCharacterKitInput({
      kitId: "kit_ready",
      name: "Waldläuferin",
      description: "Grüner Umhang",
      coverage: {
        requiredCellCount: 120,
        resolvedRequiredCellCount: 120,
        authoredRequiredCellCount: 75,
        mirroredRequiredCellCount: 45,
        anchorsIncompleteCount: 0,
        mirrorReviewCount: 0,
        mirrorForbiddenCount: 0,
        productionReady: true
      }
    })
  );
  const draft = parseCharacterKit(
    createCharacterKitInput({
      kitId: "kit_draft",
      name: "Wache",
      description: "Schwere Rüstung"
    })
  );

  it("searches normalized metadata and filters rig plus coverage", () => {
    expect(filterCharacterKits([ready, draft], "umhang", "all", "all")).toEqual([
      ready
    ]);
    expect(
      filterCharacterKits([ready, draft], "", "humanoid-80-v1", "ready")
    ).toEqual([ready]);
    expect(filterCharacterKits([ready, draft], "", "all", "draft")).toEqual([
      draft
    ]);
  });
});
