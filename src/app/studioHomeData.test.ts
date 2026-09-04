import { describe, expect, it } from "vitest";
import { parseWizardDraft } from "../schemas";
import { createProfileLibraryFixture } from "../test/profileLibraryFixtures";
import { createStudioHomeData } from "./studioHomeData";

describe("studio home summary projection", () => {
  it("projects only a resumable draft summary and recent Prompt profiles", () => {
    const library = createProfileLibraryFixture();
    const draft = parseWizardDraft({
      schemaVersion: 2,
      kind: "wizardDraft",
      draftId: "draft_home_summary",
      projectName: "Nordtorwache",
      route: "wizard/editor",
      currentStep: "character-details",
      baseProfileId: library.baseProfiles[0]?.id,
      category: "character",
      subtype: "npc",
      answers: { role: "guard" },
      validation: { errors: [], warnings: [] },
      savedAt: "2026-09-04T14:00:00.000Z"
    });

    const data = createStudioHomeData(
      { status: "valid", value: library },
      { status: "valid", value: draft },
      library.baseProfiles[0]?.id ?? null
    );

    expect(data.draft).toEqual({
      id: "draft_home_summary",
      projectName: "Nordtorwache",
      categoryLabel: "Charakter / Figur"
    });
    expect(data.draft).not.toHaveProperty("answers");
    expect(data.recentProfiles.map((profile) => profile.id)).toEqual([
      "asset_smith_80",
      "asset_guard_80",
      "asset_mage_96"
    ]);
    expect(data.recentProfiles[0]).toEqual({
      id: "asset_smith_80",
      name: "Dorfschmied mit Lederschürze",
      category: "character",
      categoryLabel: "Charakter / Figur",
      subtypeLabel: "NPC",
      favorite: true
    });
    expect(data.recentProfiles[0]).not.toHaveProperty("facts");
    expect(data.recentProfiles[0]).not.toHaveProperty("materials");
    expect(data.recentProfiles[0]).not.toHaveProperty("tags");
  });

  it("keeps unavailable and empty sources explicit", () => {
    const data = createStudioHomeData(
      { status: "empty" },
      {
        status: "unavailable",
        key: "pixelforge:v2:draft",
        message: "Unavailable"
      },
      null
    );

    expect(data).toMatchObject({
      collectionStatus: "empty",
      recentProfiles: [],
      draftStatus: "unavailable",
      draft: null
    });
  });
});
