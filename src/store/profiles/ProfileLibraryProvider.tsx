import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { AssetCategory } from "../../domain/assets";
import {
  deleteAssetProfile,
  duplicateAssetProfile,
  toggleAssetProfileFavorite,
  type AssetProfileLibraryChange
} from "../../domain/profiles";
import {
  ProfileLibrarySchema,
  StableIdSchema,
  type AssetProfile,
  type ProfileLibrary,
  type StableId
} from "../../schemas";
import type {
  StorageMutationResult,
  V2StorageAdapter
} from "../../services";
import {
  createProfileLibraryState,
  profileLibraryReducer,
  type ProfileLibraryFilters,
  type ProfileMutationNotice,
  type ProfileMutationOperation
} from "./profileLibraryState";

export type ProfileLibraryStorage = Pick<
  V2StorageAdapter,
  "readProfileLibrary" | "writeProfileLibrary"
>;

export type ProfileActionResult =
  | Readonly<{ status: "ok"; profile: AssetProfile }>
  | Readonly<{
      status: "invalid" | "unavailable" | "notFound" | "idConflict";
      message: string;
    }>;

type ProfileActionFailure = Exclude<
  ProfileActionResult,
  Readonly<{ status: "ok" }>
>;

export interface ProfileLibraryContextValue {
  readonly libraryResult: ReturnType<ProfileLibraryStorage["readProfileLibrary"]>;
  readonly filters: ProfileLibraryFilters;
  readonly mutation: ProfileMutationNotice;
  readonly setQuery: (query: string) => void;
  readonly setCategory: (category: AssetCategory | null) => void;
  readonly setBaseProfile: (baseProfileId: StableId | null) => void;
  readonly setFavoritesOnly: (favoritesOnly: boolean) => void;
  readonly setGrouping: (groupBy: ProfileLibraryFilters["groupBy"]) => void;
  readonly resetFilters: () => void;
  readonly toggleFavorite: (profileId: StableId) => ProfileActionResult;
  readonly duplicateProfile: (profileId: StableId) => ProfileActionResult;
  readonly deleteProfile: (profileId: StableId) => ProfileActionResult;
  readonly dismissMutation: () => void;
}

export interface ProfileLibraryProviderProps {
  readonly children: ReactNode;
  readonly storageAdapter: ProfileLibraryStorage;
  readonly now?: () => string;
  readonly createProfileId?: () => string;
}

const ProfileLibraryContext =
  createContext<ProfileLibraryContextValue | null>(null);

let fallbackIdSequence = 0;

function currentIsoTimestamp(): string {
  return new Date().toISOString();
}

function createDefaultProfileId(): string {
  try {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return `asset_${globalThis.crypto.randomUUID()}`;
    }

    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.getRandomValues === "function"
    ) {
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
      const randomId = [...bytes]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
      return `asset_${randomId}`;
    }
  } catch {
    // The collision check below keeps the local fallback safe.
  }

  fallbackIdSequence += 1;
  return `asset_${Date.now().toString(36)}_${fallbackIdSequence.toString(36)}`;
}

function actionLabel(operation: ProfileMutationOperation): string {
  switch (operation) {
    case "favorite":
      return "Favoritenstatus";
    case "duplicate":
      return "Duplikat";
    case "delete":
      return "Löschung";
  }
}

function failureNotice(
  operation: ProfileMutationOperation,
  status: Exclude<ProfileActionResult["status"], "ok">,
  message: string
): Extract<ProfileMutationNotice, { status: Exclude<ProfileActionResult["status"], "ok"> }> {
  return { status, operation, message };
}

function storageFailure(
  operation: ProfileMutationOperation,
  result: Exclude<StorageMutationResult, Readonly<{ status: "ok" }>>
): ProfileActionFailure {
  return {
    status: result.status,
    message:
      result.status === "invalid"
        ? `${actionLabel(operation)} wurde nicht gespeichert, weil die Profilbibliothek ungültig wäre.`
        : `${actionLabel(operation)} wurde nicht gespeichert. Der lokale Speicher ist nicht verfügbar.`
  };
}

export function ProfileLibraryProvider({
  children,
  storageAdapter,
  now = currentIsoTimestamp,
  createProfileId = createDefaultProfileId
}: ProfileLibraryProviderProps) {
  const [initialState] = useState(() =>
    createProfileLibraryState(storageAdapter.readProfileLibrary())
  );
  const [state, dispatch] = useReducer(profileLibraryReducer, initialState);
  const libraryRef = useRef<ProfileLibrary | null>(
    initialState.libraryResult.status === "valid"
      ? initialState.libraryResult.value
      : null
  );
  const initialReadStatusRef = useRef(initialState.libraryResult.status);

  const fail = useCallback(
    (
      operation: ProfileMutationOperation,
      status: Exclude<ProfileActionResult["status"], "ok">,
      message: string
    ): ProfileActionResult => {
      dispatch({
        type: "mutationFailed",
        mutation: failureNotice(operation, status, message)
      });
      return { status, message };
    },
    []
  );

  const commitChange = useCallback(
    (
      operation: ProfileMutationOperation,
      change: AssetProfileLibraryChange
    ): ProfileActionResult => {
      if (change.status === "notFound") {
        return fail(
          operation,
          "notFound",
          "Das Profil existiert nicht mehr und wurde nicht verändert."
        );
      }
      if (change.status === "idConflict") {
        return fail(
          operation,
          "idConflict",
          "Das Duplikat konnte wegen einer bereits verwendeten Profil-ID nicht angelegt werden."
        );
      }

      const candidate = ProfileLibrarySchema.safeParse(change.library);
      if (!candidate.success) {
        return fail(
          operation,
          "invalid",
          `${actionLabel(operation)} wurde abgebrochen, weil die Profilkette ungültig wäre.`
        );
      }

      const writeResult = storageAdapter.writeProfileLibrary(candidate.data);
      if (writeResult.status !== "ok") {
        const result = storageFailure(operation, writeResult);
        return fail(operation, result.status, result.message);
      }

      libraryRef.current = candidate.data;
      dispatch({
        type: "mutationSucceeded",
        library: candidate.data,
        operation,
        profile: change.profile
      });
      return { status: "ok", profile: change.profile };
    },
    [fail, storageAdapter]
  );

  const currentLibraryOrFailure = useCallback(
    (operation: ProfileMutationOperation): ProfileLibrary | ProfileActionResult => {
      const library = libraryRef.current;
      if (library) return library;
      if (initialReadStatusRef.current === "invalid") {
        return fail(
          operation,
          "invalid",
          "Die gespeicherte Profilbibliothek ist ungültig und wurde nicht verändert."
        );
      }
      return fail(
        operation,
        "unavailable",
        "Die Profilbibliothek ist nicht verfügbar und wurde nicht verändert."
      );
    },
    [fail]
  );

  const toggleFavorite = useCallback(
    (profileId: StableId): ProfileActionResult => {
      const library = currentLibraryOrFailure("favorite");
      if (!("assetProfiles" in library)) return library;
      return commitChange(
        "favorite",
        toggleAssetProfileFavorite(library, profileId)
      );
    },
    [commitChange, currentLibraryOrFailure]
  );

  const duplicateProfile = useCallback(
    (profileId: StableId): ProfileActionResult => {
      const library = currentLibraryOrFailure("duplicate");
      if (!("assetProfiles" in library)) return library;

      let candidateId: string;
      try {
        candidateId = createProfileId();
      } catch {
        return fail(
          "duplicate",
          "invalid",
          "Das Duplikat konnte nicht mit einer neuen Profil-ID angelegt werden."
        );
      }
      const parsedId = StableIdSchema.safeParse(candidateId);
      if (!parsedId.success) {
        return fail(
          "duplicate",
          "invalid",
          "Das Duplikat konnte wegen einer ungültigen Profil-ID nicht angelegt werden."
        );
      }

      let duplicateTimestamp: string;
      try {
        duplicateTimestamp = now();
      } catch {
        return fail(
          "duplicate",
          "invalid",
          "Das Duplikat konnte nicht mit einem gültigen Zeitstempel angelegt werden."
        );
      }

      return commitChange(
        "duplicate",
        duplicateAssetProfile(
          library,
          profileId,
          parsedId.data,
          duplicateTimestamp
        )
      );
    },
    [commitChange, createProfileId, currentLibraryOrFailure, fail, now]
  );

  const deleteProfile = useCallback(
    (profileId: StableId): ProfileActionResult => {
      const library = currentLibraryOrFailure("delete");
      if (!("assetProfiles" in library)) return library;
      return commitChange("delete", deleteAssetProfile(library, profileId));
    },
    [commitChange, currentLibraryOrFailure]
  );

  const value = useMemo<ProfileLibraryContextValue>(
    () => ({
      libraryResult: state.libraryResult,
      filters: state.filters,
      mutation: state.mutation,
      setQuery: (query) => dispatch({ type: "queryChanged", query }),
      setCategory: (category) =>
        dispatch({ type: "categoryChanged", category }),
      setBaseProfile: (baseProfileId) =>
        dispatch({ type: "baseProfileChanged", baseProfileId }),
      setFavoritesOnly: (favoritesOnly) =>
        dispatch({ type: "favoritesChanged", favoritesOnly }),
      setGrouping: (groupBy) =>
        dispatch({ type: "groupingChanged", groupBy }),
      resetFilters: () => dispatch({ type: "filtersReset" }),
      toggleFavorite,
      duplicateProfile,
      deleteProfile,
      dismissMutation: () => dispatch({ type: "mutationDismissed" })
    }),
    [
      deleteProfile,
      duplicateProfile,
      state.filters,
      state.libraryResult,
      state.mutation,
      toggleFavorite
    ]
  );

  return (
    <ProfileLibraryContext.Provider value={value}>
      {children}
    </ProfileLibraryContext.Provider>
  );
}

export function useProfileLibrary(): ProfileLibraryContextValue {
  const context = useContext(ProfileLibraryContext);
  if (!context) {
    throw new Error(
      "useProfileLibrary must be used inside ProfileLibraryProvider."
    );
  }
  return context;
}
