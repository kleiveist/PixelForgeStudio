import { describe, expect, it } from "vitest";
import { StableIdSchema } from "../../schemas";
import { createProfileLibraryFixture } from "../../test/profileLibraryFixtures";
import {
  DEFAULT_PROFILE_LIBRARY_FILTERS,
  createProfileLibraryState,
  profileLibraryReducer
} from "./index";

describe("profile library state", () => {
  it("keeps the validated library and starts with canonical filters", () => {
    const library = createProfileLibraryFixture();
    const libraryResult = { status: "valid" as const, value: library };

    expect(createProfileLibraryState(libraryResult)).toEqual({
      libraryResult,
      filters: DEFAULT_PROFILE_LIBRARY_FILTERS,
      mutation: { status: "ready" }
    });
  });

  it("updates every filter including grouping and resets them together", () => {
    const library = createProfileLibraryFixture();
    const baseProfileId = StableIdSchema.parse("base_world_96");
    let state = createProfileLibraryState({ status: "valid", value: library });

    state = profileLibraryReducer(state, {
      type: "queryChanged",
      query: "  Hofmagier  "
    });
    state = profileLibraryReducer(state, {
      type: "categoryChanged",
      category: "character"
    });
    state = profileLibraryReducer(state, {
      type: "baseProfileChanged",
      baseProfileId
    });
    state = profileLibraryReducer(state, {
      type: "favoritesChanged",
      favoritesOnly: true
    });
    state = profileLibraryReducer(state, {
      type: "groupingChanged",
      groupBy: "compatibility"
    });

    expect(state.filters).toEqual({
      query: "  Hofmagier  ",
      category: "character",
      baseProfileId,
      favoritesOnly: true,
      groupBy: "compatibility"
    });

    const reset = profileLibraryReducer(state, { type: "filtersReset" });
    expect(reset.filters).toBe(DEFAULT_PROFILE_LIBRARY_FILTERS);
    expect(
      profileLibraryReducer(reset, { type: "filtersReset" })
    ).toBe(reset);
  });

  it("publishes a successful mutation with the replacement library", () => {
    const library = createProfileLibraryFixture();
    const profile = library.assetProfiles[0];
    if (!profile) throw new Error("Expected an asset profile fixture.");
    const initial = createProfileLibraryState({
      status: "valid",
      value: createProfileLibraryFixture()
    });

    const state = profileLibraryReducer(initial, {
      type: "mutationSucceeded",
      library,
      operation: "duplicate",
      profile
    });

    expect(state.libraryResult).toEqual({ status: "valid", value: library });
    expect(state.mutation).toEqual({
      status: "saved",
      operation: "duplicate",
      profileId: profile.id,
      profileName: profile.name
    });
    expect(state.filters).toBe(initial.filters);
  });

  it("keeps library and filters on failure and can dismiss the notice", () => {
    const library = createProfileLibraryFixture();
    const initial = profileLibraryReducer(
      createProfileLibraryState({ status: "valid", value: library }),
      { type: "groupingChanged", groupBy: "compatibility" }
    );
    const failed = profileLibraryReducer(initial, {
      type: "mutationFailed",
      mutation: {
        status: "unavailable",
        operation: "delete",
        message: "Speicher nicht verfügbar."
      }
    });

    expect(failed.libraryResult).toBe(initial.libraryResult);
    expect(failed.filters).toBe(initial.filters);
    expect(failed.mutation).toEqual({
      status: "unavailable",
      operation: "delete",
      message: "Speicher nicht verfügbar."
    });

    const dismissed = profileLibraryReducer(failed, {
      type: "mutationDismissed"
    });
    expect(dismissed.mutation).toEqual({ status: "ready" });
    expect(dismissed.libraryResult).toBe(initial.libraryResult);
    expect(
      profileLibraryReducer(dismissed, { type: "mutationDismissed" })
    ).toBe(dismissed);
  });
});
