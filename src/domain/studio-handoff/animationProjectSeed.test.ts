import { describe, expect, it } from "vitest";
import { resolveCapabilities } from "../assets";
import { createCompatibilityKey, resolveProfile } from "../profiles";
import { parseAssetProfile, type ProfileLibrary, type StableId } from "../../schemas";
import { createProfileLibraryFixture } from "../../test/profileLibraryFixtures";
import { createAnimationProjectSeedFromCharacterProfile } from "./animationProjectSeed";

function resolution(library: ProfileLibrary, profileId: StableId) {
  const assetProfile = library.assetProfiles.find(({ id }) => id === profileId)!;
  const baseProfile = library.baseProfiles.find(
    ({ id }) => id === assetProfile.baseProfileId
  );
  const categoryProfile = assetProfile.categoryProfileId
    ? library.categoryProfiles.find(({ id }) => id === assetProfile.categoryProfileId)
    : undefined;
  return resolveProfile({
    assetProfile,
    ...(baseProfile ? { baseProfile } : {}),
    ...(categoryProfile ? { categoryProfile } : {})
  });
}

describe("Prompt-to-animation project seed", () => {
  it("requires explicit acceptance when a requested Walk has five instead of eight frames", () => {
    const library = createProfileLibraryFixture();
    const source = resolution(library, "asset_smith_80" as StableId);
    expect(createAnimationProjectSeedFromCharacterProfile(source)).toEqual({
      status: "confirmationRequired",
      confirmations: [
        { code: "walkFrameMismatch", requestedFrames: 5, templateFrames: 8 }
      ]
    });

    const accepted = createAnimationProjectSeedFromCharacterProfile(source, {
      acceptEightFrameWalkTemplate: true
    });
    expect(accepted).toEqual({
      status: "ready",
      seed: expect.objectContaining({
        sourcePromptProfileId: "asset_smith_80",
        displayName: "Dorfschmied mit Lederschürze",
        characterHeight: 80,
        requestedDirectionCount: 8,
        directionRequirement: 8,
        directionDecision: "alreadyEightDirections",
        requestedClips: [{ action: "walk", frames: 5 }],
        walkTemplate: { enabled: true, requestedFrames: 5, templateFrames: 8 }
      })
    });
    const serialized = JSON.stringify(accepted);
    expect(serialized).not.toContain("blacksmith");
    expect(serialized).not.toContain("clothing");
    expect(serialized).not.toContain("subjectDescription");
  });

  it("retains or upgrades a four-direction wish only after an explicit decision", () => {
    const source = resolution(
      createProfileLibraryFixture(),
      "asset_mage_96" as StableId
    );
    expect(createAnimationProjectSeedFromCharacterProfile(source)).toEqual({
      status: "confirmationRequired",
      confirmations: [
        { code: "fourDirectionDecision", requestedDirections: 4, mvpDirections: 8 }
      ]
    });
    expect(
      createAnimationProjectSeedFromCharacterProfile(source, {
        directionDecision: "retainFourDirectionRequirement"
      })
    ).toEqual({
      status: "ready",
      seed: expect.objectContaining({
        characterHeight: 96,
        requestedDirectionCount: 4,
        directionRequirement: 4,
        directionDecision: "retainFourDirectionRequirement"
      })
    });
    expect(
      createAnimationProjectSeedFromCharacterProfile(source, {
        directionDecision: "upgradeToEightDirectionMvp"
      })
    ).toEqual({
      status: "ready",
      seed: expect.objectContaining({
        requestedDirectionCount: 4,
        directionRequirement: 8,
        directionDecision: "upgradeToEightDirectionMvp"
      })
    });
  });

  it("passes an eight-frame Walk without a confirmation", () => {
    const library = createProfileLibraryFixture();
    const source = library.assetProfiles.find(({ id }) => id === "asset_smith_80")!;
    const assetProfile = parseAssetProfile({
      ...source,
      id: "asset_walk_eight",
      migratedFromVersion: undefined,
      legacyData: undefined,
      answers: {
        directionCount: 8,
        animationActions: [{ action: "walk", frames: 8 }]
      }
    });
    const baseProfile = library.baseProfiles.find(({ id }) => id === source.baseProfileId)!;
    const result = createAnimationProjectSeedFromCharacterProfile(
      resolveProfile({
        assetProfile,
        baseProfile,
        categoryProfile: library.categoryProfiles[0]
      })
    );
    expect(result).toEqual({
      status: "ready",
      seed: expect.objectContaining({
        requestedClips: [{ action: "walk", frames: 8 }]
      })
    });
  });

  it("blocks conflicted, category-mismatched and non-humanoid profiles", () => {
    const library = createProfileLibraryFixture();
    const smith = library.assetProfiles.find(({ id }) => id === "asset_smith_80")!;
    expect(
      createAnimationProjectSeedFromCharacterProfile(
        resolveProfile({ assetProfile: smith })
      )
    ).toEqual({
      status: "blocked",
      blockers: [{ code: "profileConflict", conflictCount: 1 }]
    });

    const texture = resolution(library, "asset_oak_wood" as StableId);
    expect(createAnimationProjectSeedFromCharacterProfile(texture)).toEqual({
      status: "blocked",
      blockers: [{ code: "wrongCategory", actualCategory: "texture" }]
    });

    const baseProfile = library.baseProfiles.find(({ id }) => id === smith.baseProfileId)!;
    const animalSelection = { category: "character", subtype: "animal" } as const;
    const animal = parseAssetProfile({
      ...smith,
      id: "asset_animal",
      categoryProfileId: undefined,
      subtype: animalSelection.subtype,
      capabilities: resolveCapabilities(animalSelection.category, animalSelection.subtype),
      compatibilityKey: createCompatibilityKey(baseProfile.values, animalSelection),
      answers: { directionCount: 8 },
      migratedFromVersion: undefined,
      legacyData: undefined
    });
    expect(
      createAnimationProjectSeedFromCharacterProfile(
        resolveProfile({ assetProfile: animal, baseProfile })
      )
    ).toEqual({
      status: "blocked",
      blockers: [{ code: "nonHumanoid", subtype: "animal" }]
    });
  });

  it("blocks a humanoid profile without an explicit direction count", () => {
    const library = createProfileLibraryFixture();
    const smith = library.assetProfiles.find(({ id }) => id === "asset_smith_80")!;
    const baseProfile = library.baseProfiles.find(({ id }) => id === smith.baseProfileId)!;
    const profile = parseAssetProfile({
      ...smith,
      id: "asset_without_direction",
      categoryProfileId: undefined,
      answers: {},
      migratedFromVersion: undefined,
      legacyData: undefined
    });
    expect(
      createAnimationProjectSeedFromCharacterProfile(
        resolveProfile({ assetProfile: profile, baseProfile })
      )
    ).toEqual({
      status: "blocked",
      blockers: [{ code: "missingDirectionCount" }]
    });
  });
});
