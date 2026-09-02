import type {
  AssetProfile,
  ProfileLibrary,
  StableId
} from "../../schemas";

export type AssetProfileLibraryChange =
  | Readonly<{
      status: "changed";
      library: ProfileLibrary;
      profile: AssetProfile;
    }>
  | Readonly<{
      status: "notFound";
      profileId: StableId;
    }>
  | Readonly<{
      status: "idConflict";
      profileId: StableId;
    }>;

const MAX_PROFILE_NAME_LENGTH = 120;
const COPY_SUFFIX_PATTERN = / \(Kopie(?: \d+)?\)$/u;

function normalizedProfileName(name: string): string {
  return name
    .normalize("NFKC")
    .toLocaleLowerCase("de-DE")
    .replace(/\s+/g, " ")
    .trim();
}

function copyNameWithSuffix(name: string, suffix: string): string {
  const availableLength = MAX_PROFILE_NAME_LENGTH - suffix.length;
  return `${name.slice(0, availableLength).trimEnd()}${suffix}`;
}

function replaceAssetProfile(
  library: ProfileLibrary,
  profile: AssetProfile
): ProfileLibrary {
  return {
    ...library,
    assetProfiles: library.assetProfiles.map((candidate) =>
      candidate.id === profile.id ? profile : candidate
    )
  };
}

export function createDuplicateProfileName(
  name: string,
  existingNames: readonly string[] = []
): string {
  const strippedName = name.replace(COPY_SUFFIX_PATTERN, "").trimEnd();
  const baseName = strippedName.length > 0 ? strippedName : name.trimEnd();
  const occupiedNames = new Set(existingNames.map(normalizedProfileName));

  for (
    let copyNumber = 1;
    copyNumber <= existingNames.length + 1;
    copyNumber += 1
  ) {
    const suffix = copyNumber === 1 ? " (Kopie)" : ` (Kopie ${copyNumber})`;
    const candidate = copyNameWithSuffix(baseName, suffix);
    if (!occupiedNames.has(normalizedProfileName(candidate))) return candidate;
  }

  // There are always more generated candidates than occupied names.
  return copyNameWithSuffix(baseName, ` (Kopie ${existingNames.length + 2})`);
}

export function toggleAssetProfileFavorite(
  library: ProfileLibrary,
  profileId: StableId
): AssetProfileLibraryChange {
  const source = library.assetProfiles.find((profile) => profile.id === profileId);
  if (!source) return { status: "notFound", profileId };

  const profile: AssetProfile = {
    ...source,
    favorite: !source.favorite
  };

  return {
    status: "changed",
    library: replaceAssetProfile(library, profile),
    profile
  };
}

export function duplicateAssetProfile(
  library: ProfileLibrary,
  sourceProfileId: StableId,
  duplicateProfileId: StableId,
  timestamp: string
): AssetProfileLibraryChange {
  const source = library.assetProfiles.find(
    (profile) => profile.id === sourceProfileId
  );
  if (!source) return { status: "notFound", profileId: sourceProfileId };
  if (
    library.assetProfiles.some((profile) => profile.id === duplicateProfileId)
  ) {
    return { status: "idConflict", profileId: duplicateProfileId };
  }

  const {
    legacyData: sourceLegacyData,
    migratedFromVersion: sourceMigrationVersion,
    ...copyableSource
  } = source;
  void sourceLegacyData;
  void sourceMigrationVersion;

  const profile: AssetProfile = {
    ...copyableSource,
    id: duplicateProfileId,
    name: createDuplicateProfileName(
      source.name,
      library.assetProfiles.map((profile) => profile.name)
    ),
    favorite: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return {
    status: "changed",
    library: {
      ...library,
      assetProfiles: [...library.assetProfiles, profile]
    },
    profile
  };
}

export function deleteAssetProfile(
  library: ProfileLibrary,
  profileId: StableId
): AssetProfileLibraryChange {
  const profile = library.assetProfiles.find(
    (candidate) => candidate.id === profileId
  );
  if (!profile) return { status: "notFound", profileId };

  return {
    status: "changed",
    library: {
      ...library,
      baseProfiles: library.baseProfiles,
      categoryProfiles: library.categoryProfiles,
      assetProfiles: library.assetProfiles.filter(
        (candidate) => candidate.id !== profileId
      )
    },
    profile
  };
}
