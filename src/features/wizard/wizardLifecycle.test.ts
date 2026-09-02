import { describe, expect, it } from "vitest";
import {
  ProfileLibrarySchema,
  parseAssetProfile,
  parseBaseProfile,
  parseWizardDraft,
  type AssetProfile,
  type BaseProfile,
  type CategoryProfile,
  type ProfileLibrary,
  type StableId,
  type WizardDraft
} from "../../schemas";
import {
  PROFILE_FIXTURE_TIMESTAMP,
  createProfileLibraryFixture
} from "../../test/profileLibraryFixtures";
import {
  createBlankWizardDraft,
  createWizardDraftFromAssetProfile,
  resolveWizardCoreStep,
  resolveWizardDraftSnapshot,
  updateWizardDraft,
  validateWizardResume
} from "./wizardLifecycle";

const draftId = "draft_wizard_011" as StableId;

interface PortableOverrideFixture {
  readonly base: BaseProfile;
  readonly category: CategoryProfile;
  readonly draft: WizardDraft;
  readonly library: ProfileLibrary;
  readonly source: AssetProfile;
}

function portableOverrideFixture(): PortableOverrideFixture {
  const library = createProfileLibraryFixture();
  const source = library.assetProfiles.find(
    (profile) => profile.id === "asset_smith_80"
  );
  const base = library.baseProfiles.find(
    (profile) => profile.id === source?.baseProfileId
  );
  const category = library.categoryProfiles.find(
    (profile) => profile.id === source?.categoryProfileId
  );
  if (!source || !base || !category) {
    throw new Error("Expected a complete portable override fixture.");
  }

  const overriddenSource = parseAssetProfile({
    ...source,
    id: "asset_portable_source",
    compatibilityKey: "stale-but-schema-valid",
    overrides: {
      tileSize: 48,
      lightingDefaults: {
        policy: "warmInterior",
        notes: "Portable forge lighting."
      }
    }
  });
  const created = createWizardDraftFromAssetProfile({
    draftId,
    savedAt: PROFILE_FIXTURE_TIMESTAMP,
    assetProfile: overriddenSource,
    baseProfile: base,
    categoryProfile: category
  });
  if (created.status !== "created") {
    throw new Error("Expected a portable selected Draft.");
  }

  return {
    base,
    category,
    draft: created.draft,
    library,
    source: overriddenSource
  };
}

describe("wizard draft lifecycle", () => {
  it("creates a blank project draft without inventing category state", () => {
    const draft = createBlankWizardDraft({
      draftId,
      savedAt: PROFILE_FIXTURE_TIMESTAMP
    });

    expect(draft).toEqual({
      schemaVersion: 2,
      kind: "wizardDraft",
      draftId,
      projectName: "",
      route: "wizard/project",
      currentStep: "project",
      validation: { errors: [], warnings: [] },
      savedAt: PROFILE_FIXTURE_TIMESTAMP
    });
    expect(draft).not.toHaveProperty("category");
    expect(draft).not.toHaveProperty("baseProfileId");
  });

  it("starts from the current resolved profile chain without losing source data", () => {
    const library = createProfileLibraryFixture();
    const source = library.assetProfiles.find((profile) => profile.id === "asset_smith_80");
    const base = library.baseProfiles.find((profile) => profile.id === source?.baseProfileId);
    const category = library.categoryProfiles.find(
      (profile) => profile.id === source?.categoryProfileId
    );
    if (source === undefined || base === undefined || category === undefined) {
      throw new Error("Expected complete smith fixture chain.");
    }

    const profile = parseAssetProfile({
      ...source,
      id: "asset_smith_override",
      compatibilityKey: "stale-but-schema-valid",
      overrides: {
        tileSize: 48,
        lightingDefaults: {
          policy: "warmInterior",
          notes: "Forge light stays stable."
        }
      }
    });
    const result = createWizardDraftFromAssetProfile({
      draftId,
      savedAt: PROFILE_FIXTURE_TIMESTAMP,
      assetProfile: profile,
      baseProfile: base,
      categoryProfile: category
    });

    expect(result.status).toBe("created");
    if (result.status !== "created") throw new Error("Expected a profile draft.");
    expect(result.draft).toMatchObject({
      route: "wizard/profile",
      currentStep: "category",
      projectName: profile.name,
      sourceAssetProfileId: profile.id,
      baseProfileId: profile.baseProfileId,
      categoryProfileId: profile.categoryProfileId,
      category: profile.category,
      subtype: profile.subtype,
      answers: profile.answers,
      overrides: profile.overrides
    });
    expect(result.notices.some((notice) => notice.code === "staleCompatibilityKey")).toBe(
      true
    );
  });

  it("returns structured profile-resolution conflicts instead of a partial draft", () => {
    const library = createProfileLibraryFixture();
    const profile = library.assetProfiles[0];
    if (profile === undefined) throw new Error("Expected an asset fixture.");

    const result = createWizardDraftFromAssetProfile({
      draftId,
      savedAt: PROFILE_FIXTURE_TIMESTAMP,
      assetProfile: profile
    });

    expect(result.status).toBe("conflict");
    if (result.status !== "conflict") throw new Error("Expected a conflict result.");
    expect(result.conflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missingReference", reference: "baseProfile" })
      ])
    );
  });

  it("updates navigation and project values without mutating the source draft", () => {
    const source = createBlankWizardDraft({
      draftId,
      savedAt: PROFILE_FIXTURE_TIMESTAMP
    });
    const updated = updateWizardDraft({
      draft: source,
      projectName: "Winterwald",
      currentStep: "category",
      savedAt: "2026-09-02T13:00:00.000Z"
    });

    expect(source.projectName).toBe("");
    expect(source.route).toBe("wizard/project");
    expect(updated).toMatchObject({
      projectName: "Winterwald",
      route: "wizard/category",
      currentStep: "category",
      savedAt: "2026-09-02T13:00:00.000Z"
    });
  });

  it("resumes only the exact requested draft and validates its references", () => {
    const library = createProfileLibraryFixture();
    const profile = library.assetProfiles[0];
    const base = library.baseProfiles.find((candidate) => candidate.id === profile?.baseProfileId);
    const category = library.categoryProfiles.find(
      (candidate) => candidate.id === profile?.categoryProfileId
    );
    if (profile === undefined || base === undefined || category === undefined) {
      throw new Error("Expected complete profile fixtures.");
    }
    const created = createWizardDraftFromAssetProfile({
      draftId,
      savedAt: PROFILE_FIXTURE_TIMESTAMP,
      assetProfile: profile,
      baseProfile: base,
      categoryProfile: category
    });
    if (created.status !== "created") throw new Error("Expected a profile draft.");

    expect(
      validateWizardResume({
        requestedDraftId: draftId,
        draft: created.draft,
        profileLibrary: library
      })
    ).toMatchObject({ status: "ready", draft: { draftId } });

    expect(
      validateWizardResume({
        requestedDraftId: "draft_other",
        draft: created.draft,
        profileLibrary: library
      })
    ).toMatchObject({
      status: "recovery",
      issues: [{ code: "draftIdMismatch", actualDraftId: draftId }]
    });

    expect(
      validateWizardResume({
        requestedDraftId: draftId,
        draft: created.draft,
        profileLibrary: { ...library, baseProfiles: [] }
      })
    ).toMatchObject({
      status: "recovery",
      issues: expect.arrayContaining([expect.objectContaining({ code: "missingBaseProfile" })])
    });

    expect(
      validateWizardResume({
        requestedDraftId: draftId,
        draft: created.draft,
        profileLibrary: { ...library, categoryProfiles: [] }
      })
    ).toMatchObject({
      status: "recovery",
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "missingCategoryProfile" })
      ])
    });
  });

  it("treats profile provenance as portable metadata, not a hard resume reference", () => {
    const library = createProfileLibraryFixture();
    const profile = library.assetProfiles[0];
    const base = library.baseProfiles.find((candidate) => candidate.id === profile?.baseProfileId);
    const category = library.categoryProfiles.find(
      (candidate) => candidate.id === profile?.categoryProfileId
    );
    if (profile === undefined || base === undefined || category === undefined) {
      throw new Error("Expected complete profile fixtures.");
    }
    const created = createWizardDraftFromAssetProfile({
      draftId,
      savedAt: PROFILE_FIXTURE_TIMESTAMP,
      assetProfile: profile,
      baseProfile: base,
      categoryProfile: category
    });
    if (created.status !== "created") throw new Error("Expected a profile draft.");

    const withoutSourceProfile = {
      ...library,
      assetProfiles: library.assetProfiles.filter((candidate) => candidate.id !== profile.id)
    };
    expect(
      validateWizardResume({
        requestedDraftId: draftId,
        draft: created.draft,
        profileLibrary: withoutSourceProfile
      })
    ).toMatchObject({ status: "ready" });
  });

  it("resolves the portable Draft override snapshot after its source Asset was removed", () => {
    const fixture = portableOverrideFixture();
    const withoutSourceProfile = ProfileLibrarySchema.parse({
      ...fixture.library,
      assetProfiles: fixture.library.assetProfiles.filter(
        (profile) => profile.id !== fixture.source.id
      )
    });

    expect(
      withoutSourceProfile.assetProfiles.some(
        (profile) => profile.id === fixture.source.id
      )
    ).toBe(false);
    expect(
      validateWizardResume({
        requestedDraftId: draftId,
        draft: fixture.draft,
        profileLibrary: withoutSourceProfile
      })
    ).toMatchObject({ status: "ready" });

    const resolution = resolveWizardDraftSnapshot(
      fixture.draft,
      withoutSourceProfile
    );
    expect(resolution).toMatchObject({
      status: "resolved",
      profile: {
        values: {
          tileSize: 48,
          lightingDefaults: {
            policy: "warmInterior",
            notes: "Portable forge lighting."
          }
        },
        normalizedOverrides: {
          asset: {
            tileSize: 48,
            lightingDefaults: {
              policy: "warmInterior",
              notes: "Portable forge lighting."
            }
          }
        }
      }
    });
  });

  it("fails closed when current Base locks reject a portable Draft override", () => {
    const fixture = portableOverrideFixture();
    const lockedBase = parseBaseProfile({
      ...fixture.base,
      locks: { ...fixture.base.locks, tileSize: true },
      updatedAt: "2026-09-02T13:00:00.000Z"
    });
    const currentLibrary = ProfileLibrarySchema.parse({
      ...fixture.library,
      baseProfiles: fixture.library.baseProfiles.map((profile) =>
        profile.id === lockedBase.id ? lockedBase : profile
      ),
      assetProfiles: fixture.library.assetProfiles.filter(
        (profile) => profile.id !== fixture.source.id
      )
    });

    expect(
      validateWizardResume({
        requestedDraftId: draftId,
        draft: fixture.draft,
        profileLibrary: currentLibrary
      })
    ).toMatchObject({
      status: "recovery",
      issues: [
        {
          code: "profileResolutionConflict",
          conflict: {
            code: "lockedOverride",
            source: "asset",
            field: "tileSize",
            profileId: draftId,
            inheritedValue: 32,
            attemptedValue: 48
          }
        }
      ]
    });
  });

  it("falls back safely from unknown persisted steps without changing savedAt", () => {
    const draft = parseWizardDraft({
      schemaVersion: 2,
      kind: "wizardDraft",
      draftId,
      projectName: "Alte Sitzung",
      route: "wizard/category",
      currentStep: "removed-step",
      validation: { errors: [], warnings: [] },
      savedAt: PROFILE_FIXTURE_TIMESTAMP
    });
    const library = createProfileLibraryFixture();

    expect(resolveWizardCoreStep(draft)).toEqual({
      stepId: "category",
      usedFallback: true,
      unknownStep: "removed-step"
    });
    expect(
      validateWizardResume({
        requestedDraftId: draftId,
        draft,
        profileLibrary: library
      })
    ).toEqual({
      status: "ready",
      draft: { ...draft, currentStep: "category" },
      notices: [
        {
          code: "unknownCurrentStep",
          unknownStep: "removed-step",
          fallbackStep: "category"
        }
      ]
    });
  });

  it("rejects malformed resume payloads before lifecycle handling", () => {
    const result = validateWizardResume({
      requestedDraftId: draftId,
      draft: { schemaVersion: 2, kind: "wizardDraft" },
      profileLibrary: createProfileLibraryFixture()
    });

    expect(result).toMatchObject({
      status: "recovery",
      issues: [expect.objectContaining({ code: "invalidDraft" })]
    });
  });
});
