import { describe, expect, it } from "vitest";
import {
  resolveDirectionSource,
  resolveProjectDirectionCoverage,
  validateMirrorPolicy,
  type DirectionSourceAsset
} from "./coverage";

function asset(
  overrides: Partial<DirectionSourceAsset> = {}
): DirectionSourceAsset {
  return Object.freeze({
    assetId: "part_head_east",
    slot: "head",
    direction: "east",
    anchorStatus: "ready",
    mirrorPolicy: "inherit",
    updatedAt: "2026-09-04T12:00:00.000Z",
    ...overrides
  });
}

describe("direction source coverage", () => {
  it("resolves part, project, kit and fail-closed inherited policies", () => {
    expect(validateMirrorPolicy({
      partPolicy: "forbid",
      projectPolicy: "allow",
      kitPolicy: "allow"
    })).toMatchObject({ effectivePolicy: "forbid", source: "part", valid: true });
    expect(validateMirrorPolicy({
      partPolicy: "inherit",
      projectPolicy: "allow",
      kitPolicy: "forbid"
    })).toMatchObject({ effectivePolicy: "allow", source: "project", valid: true });
    expect(validateMirrorPolicy({
      partPolicy: "inherit",
      projectPolicy: "inherit",
      kitPolicy: "allow"
    })).toMatchObject({ effectivePolicy: "allow", source: "kit", valid: true });
    expect(validateMirrorPolicy({ partPolicy: "inherit" })).toMatchObject({
      effectivePolicy: "forbid",
      source: "safeFallback",
      valid: false
    });
  });

  it("resolves all mirror pairs and gives an authored target source priority", () => {
    const cases = [
      ["southEast", "southWest"],
      ["east", "west"],
      ["northEast", "northWest"]
    ] as const;
    for (const [sourceDirection, targetDirection] of cases) {
      expect(resolveDirectionSource({
        mode: "fiveAuthoredPlusMirror",
        slot: "head",
        targetDirection,
        assets: [asset({ direction: sourceDirection })],
        projectMirrorPolicy: "allow"
      })).toMatchObject({
        status: "mirroredValid",
        sourceDirection,
        targetDirection,
        mirrored: true
      });
    }

    const ownWest = asset({
      assetId: "part_head_west",
      direction: "west",
      mirrorPolicy: "forbid"
    });
    expect(resolveDirectionSource({
      mode: "fiveAuthoredPlusMirror",
      slot: "head",
      targetDirection: "west",
      assets: [asset(), ownWest],
      projectMirrorPolicy: "forbid"
    })).toMatchObject({
      status: "authoredSource",
      sourceAsset: ownWest,
      mirrored: false
    });
  });

  it("blocks forbidden mirroring and incomplete anchors", () => {
    expect(resolveDirectionSource({
      mode: "fiveAuthoredPlusMirror",
      slot: "head",
      targetDirection: "west",
      assets: [asset({ mirrorPolicy: "forbid" })],
      projectMirrorPolicy: "allow"
    })).toMatchObject({ status: "mirrorForbidden", blocksProduction: true });
    expect(resolveDirectionSource({
      mode: "fiveAuthoredPlusMirror",
      slot: "head",
      targetDirection: "west",
      assets: [asset({ anchorStatus: "anchorsPending" })],
      projectMirrorPolicy: "allow"
    })).toMatchObject({ status: "anchorsIncomplete", blocksProduction: true });
  });

  it("requires an explicit, revision-bound review for asymmetric equipment", () => {
    const weapon = asset({
      assetId: "part_weapon_east",
      slot: "weapon.right"
    });
    const input = {
      mode: "fiveAuthoredPlusMirror" as const,
      slot: "weapon.right" as const,
      targetDirection: "west" as const,
      assets: [weapon],
      projectMirrorPolicy: "allow" as const
    };
    expect(resolveDirectionSource(input)).toMatchObject({
      status: "mirroredNeedsReview",
      reviewConfirmed: false,
      blocksProduction: true
    });
    expect(resolveDirectionSource({
      ...input,
      reviews: [{
        assetId: weapon.assetId,
        sourceUpdatedAt: weapon.updatedAt,
        targetDirection: "west"
      }]
    })).toMatchObject({
      status: "mirroredValid",
      reviewConfirmed: true,
      blocksProduction: false
    });
    expect(resolveDirectionSource({
      ...input,
      reviews: [{
        assetId: weapon.assetId,
        sourceUpdatedAt: "2026-09-03T12:00:00.000Z",
        targetDirection: "west"
      }]
    }).status).toBe("mirroredNeedsReview");
  });

  it("never falls back to mirroring in eight-authored or prototype mode", () => {
    expect(resolveDirectionSource({
      mode: "eightAuthored",
      slot: "head",
      targetDirection: "west",
      assets: [asset()],
      projectMirrorPolicy: "allow"
    })).toMatchObject({ status: "missingSource", mirrored: false });
    expect(resolveDirectionSource({
      mode: "singleDirectionPrototype",
      slot: "head",
      targetDirection: "west",
      assets: [asset({ direction: "south" })],
      projectMirrorPolicy: "allow"
    })).toMatchObject({ status: "missingSource", blocksProduction: true });
  });

  it("builds a full slot-by-eight matrix with explicit optional state", () => {
    const coverage = resolveProjectDirectionCoverage({
      mode: "singleDirectionPrototype",
      assets: [asset({ direction: "south" })],
      projectMirrorPolicy: "allow"
    });
    expect(coverage.directions).toHaveLength(8);
    expect(coverage.rows).toHaveLength(39);
    expect(coverage.rows.every((row) => row.cells.length === 8)).toBe(true);
    expect(
      coverage.rows.find(({ slot }) => slot === "hair.back")?.cells[0]?.status
    ).toBe("optionalUnused");
    expect(coverage.readyForEightDirectionExport).toBe(false);
    expect(coverage.blockers.length).toBeGreaterThan(0);
  });
});
