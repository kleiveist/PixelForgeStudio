import { describe, expect, it } from "vitest";
import { StableIdSchema } from "../../schemas";
import {
  INITIAL_WIZARD_SESSION_STATE,
  wizardSessionReducer
} from "./index";

describe("wizard start session", () => {
  it("keeps a selected category without inventing a subtype", () => {
    expect(
      wizardSessionReducer(INITIAL_WIZARD_SESSION_STATE, {
        type: "startRequested",
        intent: { kind: "newAsset", category: "texture" }
      })
    ).toEqual({
      startIntent: { kind: "newAsset", category: "texture" }
    });
  });

  it("clears a stale category for a generic new-asset start", () => {
    const selected = wizardSessionReducer(INITIAL_WIZARD_SESSION_STATE, {
      type: "startRequested",
      intent: { kind: "newAsset", category: "character" }
    });

    expect(
      wizardSessionReducer(selected, {
        type: "startRequested",
        intent: { kind: "newAsset", category: null }
      })
    ).toEqual({ startIntent: { kind: "newAsset", category: null } });
  });

  it("carries only validated profile and draft identifiers", () => {
    const profileId = StableIdSchema.parse("asset_blacksmith_001");
    const draftId = StableIdSchema.parse("draft_blacksmith_001");
    const profileStart = wizardSessionReducer(INITIAL_WIZARD_SESSION_STATE, {
      type: "startRequested",
      intent: { kind: "profile", assetProfileId: profileId }
    });
    const resumed = wizardSessionReducer(profileStart, {
      type: "startRequested",
      intent: { kind: "resume", draftId }
    });

    expect(profileStart).toEqual({
      startIntent: { kind: "profile", assetProfileId: profileId }
    });
    expect(resumed).toEqual({
      startIntent: { kind: "resume", draftId }
    });
  });
});
