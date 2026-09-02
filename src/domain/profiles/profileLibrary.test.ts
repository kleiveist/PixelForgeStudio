import { describe, expect, it } from "vitest";
import {
  ProfileLibrarySchema,
  StableIdSchema,
  type AssetProfile,
  type ProfileLibrary
} from "../../schemas";
import {
  PROFILE_FIXTURE_TIMESTAMP,
  createProfileLibraryFixture
} from "../../test/profileLibraryFixtures";
import {
  createDuplicateProfileName,
  deleteAssetProfile,
  duplicateAssetProfile,
  toggleAssetProfileFavorite,
  type AssetProfileLibraryChange
} from "./index";

function profileById(library: ProfileLibrary, id: string): AssetProfile {
  const profile = library.assetProfiles.find((candidate) => candidate.id === id);
  if (!profile) throw new Error(`Expected fixture profile "${id}".`);
  return profile;
}

function expectChanged(
  result: AssetProfileLibraryChange
): asserts result is Extract<AssetProfileLibraryChange, { status: "changed" }> {
  expect(result.status).toBe("changed");
  if (result.status !== "changed") {
    throw new Error(`Expected a changed library, received "${result.status}".`);
  }
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(
    value as object as Record<string, unknown>
  )) {
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}

describe("asset profile library mutations", () => {
  it("toggles a favorite immutably without treating it as a content edit", () => {
    const library = deepFreeze(createProfileLibraryFixture());
    const before = createProfileLibraryFixture();
    const source = profileById(library, "asset_smith_80");
    const untouched = profileById(library, "asset_guard_80");

    const result = toggleAssetProfileFavorite(library, source.id);

    expectChanged(result);
    expect(result.library).not.toBe(library);
    expect(result.library.assetProfiles).not.toBe(library.assetProfiles);
    expect(result.library.baseProfiles).toBe(library.baseProfiles);
    expect(result.library.categoryProfiles).toBe(library.categoryProfiles);
    expect(result.profile).toMatchObject({
      id: source.id,
      favorite: false,
      updatedAt: source.updatedAt
    });
    expect(profileById(result.library, untouched.id)).toBe(untouched);
    expect(source.favorite).toBe(true);
    expect(library).toEqual(before);
    expect(ProfileLibrarySchema.safeParse(result.library).success).toBe(true);

    const restored = toggleAssetProfileFavorite(result.library, source.id);
    expectChanged(restored);
    expect(restored.profile.favorite).toBe(true);
    expect(restored.profile.updatedAt).toBe(source.updatedAt);
  });

  it("duplicates a leaf with stable references and key but fresh V2 identity", () => {
    const library = deepFreeze(createProfileLibraryFixture());
    const source = profileById(library, "asset_smith_80");
    const duplicateId = StableIdSchema.parse("asset_smith_copy");
    const duplicateTimestamp = "2026-09-03T09:30:00.000Z";

    const result = duplicateAssetProfile(
      library,
      source.id,
      duplicateId,
      duplicateTimestamp
    );

    expectChanged(result);
    expect(result.library.assetProfiles).toHaveLength(
      library.assetProfiles.length + 1
    );
    expect(result.library.baseProfiles).toBe(library.baseProfiles);
    expect(result.library.categoryProfiles).toBe(library.categoryProfiles);
    expect(result.profile).toMatchObject({
      id: duplicateId,
      name: "Dorfschmied mit Lederschürze (Kopie)",
      baseProfileId: source.baseProfileId,
      categoryProfileId: source.categoryProfileId,
      compatibilityKey: source.compatibilityKey,
      category: source.category,
      subtype: source.subtype,
      favorite: false,
      createdAt: duplicateTimestamp,
      updatedAt: duplicateTimestamp
    });
    expect(result.profile.answers).toEqual(source.answers);
    expect(result.profile.overrides).toEqual(source.overrides);
    expect(result.profile.tags).toEqual(source.tags);
    expect(result.profile.capabilities).toEqual(source.capabilities);
    expect(result.profile).not.toHaveProperty("migratedFromVersion");
    expect(result.profile).not.toHaveProperty("legacyData");
    expect(source).toMatchObject({
      migratedFromVersion: 1,
      legacyData: { source: "fixture" },
      createdAt: PROFILE_FIXTURE_TIMESTAMP,
      favorite: true
    });
    expect(ProfileLibrarySchema.safeParse(result.library).success).toBe(true);
  });

  it("keeps generated copy names schema-safe and rejects an asset-id collision", () => {
    const library = deepFreeze(createProfileLibraryFixture());
    const source = profileById(library, "asset_smith_80");
    const occupiedId = profileById(library, "asset_guard_80").id;
    const maximumName = createDuplicateProfileName("x".repeat(120));

    expect(maximumName).toHaveLength(120);
    expect(maximumName).toMatch(/ \(Kopie\)$/);

    const result = duplicateAssetProfile(
      library,
      source.id,
      occupiedId,
      "2026-09-03T10:00:00.000Z"
    );

    expect(result).toEqual({ status: "idConflict", profileId: occupiedId });
    expect(library).toEqual(createProfileLibraryFixture());
  });

  it("numbers repeated copies with distinct schema-safe accessible names", () => {
    const library = createProfileLibraryFixture();
    const first = duplicateAssetProfile(
      library,
      StableIdSchema.parse("asset_smith_80"),
      StableIdSchema.parse("asset_smith_copy_1"),
      "2026-09-03T10:00:00.000Z"
    );
    expectChanged(first);

    const second = duplicateAssetProfile(
      first.library,
      StableIdSchema.parse("asset_smith_80"),
      StableIdSchema.parse("asset_smith_copy_2"),
      "2026-09-03T10:01:00.000Z"
    );
    expectChanged(second);

    const third = duplicateAssetProfile(
      second.library,
      StableIdSchema.parse("asset_smith_copy_1"),
      StableIdSchema.parse("asset_smith_copy_3"),
      "2026-09-03T10:02:00.000Z"
    );
    expectChanged(third);

    expect([first.profile.name, second.profile.name, third.profile.name]).toEqual([
      "Dorfschmied mit Lederschürze (Kopie)",
      "Dorfschmied mit Lederschürze (Kopie 2)",
      "Dorfschmied mit Lederschürze (Kopie 3)"
    ]);
    expect(ProfileLibrarySchema.safeParse(third.library).success).toBe(true);
  });

  it("deletes only the requested asset leaf and preserves the complete dependency graph", () => {
    const library = deepFreeze(createProfileLibraryFixture());
    const source = profileById(library, "asset_smith_80");
    const sameCompatibilityFamily = profileById(library, "asset_guard_80");
    const baseProfiles = library.baseProfiles;
    const categoryProfiles = library.categoryProfiles;

    const result = deleteAssetProfile(library, source.id);

    expectChanged(result);
    expect(result.profile).toBe(source);
    expect(result.library.baseProfiles).toBe(baseProfiles);
    expect(result.library.categoryProfiles).toBe(categoryProfiles);
    expect(result.library.assetProfiles).toHaveLength(
      library.assetProfiles.length - 1
    );
    expect(
      result.library.assetProfiles.some((profile) => profile.id === source.id)
    ).toBe(false);
    expect(profileById(result.library, sameCompatibilityFamily.id)).toBe(
      sameCompatibilityFamily
    );
    expect(
      result.library.categoryProfiles.some(
        (profile) => profile.id === source.categoryProfileId
      )
    ).toBe(true);
    expect(
      result.library.baseProfiles.some(
        (profile) => profile.id === source.baseProfileId
      )
    ).toBe(true);
    expect(ProfileLibrarySchema.safeParse(result.library).success).toBe(true);
    expect(library).toEqual(createProfileLibraryFixture());

    expect(deleteAssetProfile(result.library, source.id)).toEqual({
      status: "notFound",
      profileId: source.id
    });
  });
});
