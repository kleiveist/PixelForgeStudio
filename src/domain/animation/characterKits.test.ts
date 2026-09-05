import { describe, expect, it } from "vitest";
import {
  DIRECTION_IDS,
  HUMANOID_80_FRAME_PROFILE,
  HUMANOID_80_RIG_TEMPLATE,
  REQUIRED_PART_SLOT_IDS,
  applyCharacterKitToProject,
  checkCharacterKitCompatibility,
  createRigCompatibilityKey,
  equipCharacterPart,
  removeCharacterPart,
  summarizeCharacterKitCoverage,
  type CharacterKitContract,
  type CharacterKitPartAsset
} from "./index";
import {
  parseAnimationProject,
  type AnimationProject
} from "../../schemas";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";

const KEY = createRigCompatibilityKey(HUMANOID_80_RIG_TEMPLATE);
const TIMESTAMP = "2026-09-05T08:00:00.000Z";

function part(
  slot: CharacterKitPartAsset["slot"],
  direction: CharacterKitPartAsset["direction"],
  overrides: Partial<CharacterKitPartAsset> = {}
): CharacterKitPartAsset {
  return {
    assetId: `part_${slot.replaceAll(".", "_")}_${direction}`,
    slot,
    direction,
    anchorStatus: "ready",
    mirrorPolicy: "allow",
    updatedAt: TIMESTAMP,
    ...overrides
  };
}

function fiveDirectionParts(): readonly CharacterKitPartAsset[] {
  return REQUIRED_PART_SLOT_IDS.flatMap((slot) =>
    ["south", "southEast", "east", "northEast", "north"].map((direction) =>
      part(slot, direction as CharacterKitPartAsset["direction"])
    )
  );
}

function kit(
  assets: readonly CharacterKitPartAsset[],
  overrides: Partial<CharacterKitContract> = {}
): CharacterKitContract {
  return {
    kitId: "kit_npc_a",
    rigTemplateId: "humanoid-80-v1",
    rigCompatibilityKey: KEY,
    directionSourceMode: "fiveAuthoredPlusMirror",
    mirrorPolicy: "allow",
    partAssetIds: assets.map((asset) => asset.assetId),
    ...overrides
  };
}

function project(
  overrides: Parameters<typeof createAnimationProjectInput>[0] = {}
): AnimationProject {
  return parseAnimationProject(
    createAnimationProjectInput({
      frameProfile: HUMANOID_80_FRAME_PROFILE,
      directionSourceMode: "fiveAuthoredPlusMirror",
      parts: [],
      mirrorReviews: [],
      overrides: [],
      ...overrides
    })
  );
}

describe("Character Kit domain", () => {
  it("uses only the rig id, frame profile and contract versions for compatibility", () => {
    const assets = fiveDirectionParts();
    const source = kit(assets);
    expect(
      checkCharacterKitCompatibility(
        source,
        project(),
        HUMANOID_80_RIG_TEMPLATE
      )
    ).toMatchObject({ compatible: true, expectedKey: KEY, issues: [] });

    expect(
      checkCharacterKitCompatibility(
        { ...source, rigCompatibilityKey: `${KEY}-other` },
        project(),
        HUMANOID_80_RIG_TEMPLATE
      )
    ).toMatchObject({
      compatible: false,
      issues: [{ code: "compatibilityKeyMismatch" }]
    });
    expect(
      checkCharacterKitCompatibility(
        source,
        project({
          frameProfile: {
            ...HUMANOID_80_FRAME_PROFILE,
            characterHeight: 79
          }
        }),
        HUMANOID_80_RIG_TEMPLATE
      ).compatible
    ).toBe(false);
  });

  it("summarizes authored and mirrored required coverage without hiding blockers", () => {
    const summary = summarizeCharacterKitCoverage({
      mode: "fiveAuthoredPlusMirror",
      assets: fiveDirectionParts(),
      kitMirrorPolicy: "allow"
    });
    expect(summary).toEqual({
      requiredCellCount: 120,
      resolvedRequiredCellCount: 120,
      authoredRequiredCellCount: 75,
      mirroredRequiredCellCount: 45,
      anchorsIncompleteCount: 0,
      mirrorReviewCount: 0,
      mirrorForbiddenCount: 0,
      productionReady: true
    });
  });

  it("applies shared references while retaining project-owned rig and clips", () => {
    const assets = fiveDirectionParts();
    const sourceProject = project({
      parts: [{ assetId: assets[0]!.assetId, layerOffset: 1 }]
    });
    const result = applyCharacterKitToProject({
      kit: kit(assets),
      project: sourceProject,
      template: HUMANOID_80_RIG_TEMPLATE,
      assets,
      timestamp: TIMESTAMP,
      overrideResolution: "abort"
    });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.project.rigTemplateId).toBe(sourceProject.rigTemplateId);
    expect(result.project.frameProfile).toEqual(sourceProject.frameProfile);
    expect(result.project.clips).toBe(sourceProject.clips);
    expect(result.project.parts).toHaveLength(assets.length);
    expect(result.project.parts[0]).toEqual({
      assetId: assets[0]!.assetId,
      layerOffset: 1
    });
    expect(result.project.parts.map(({ assetId }) => assetId)).toEqual(
      assets.map(({ assetId }) => assetId)
    );
  });

  it("requires an explicit decision before dropping an invalid slot delta", () => {
    const assets = fiveDirectionParts().filter((asset) => asset.slot !== "head");
    const sourceProject = project({
      overrides: [
        {
          clipId: "clip_walk_001",
          direction: "south",
          frameIndex: 0,
          partDeltas: {
            head: {
              offsetX: 2,
              offsetY: 0,
              rotationDelta: 0,
              scaleMultiplier: 1
            }
          }
        }
      ]
    });
    const sourceKit = kit(assets);
    const blocked = applyCharacterKitToProject({
      kit: sourceKit,
      project: sourceProject,
      template: HUMANOID_80_RIG_TEMPLATE,
      assets,
      timestamp: TIMESTAMP,
      overrideResolution: "abort"
    });
    expect(blocked).toMatchObject({
      status: "overrideConflict",
      assessment: {
        overrideConflicts: [{ direction: "south", slots: ["head"] }]
      }
    });

    const cleaned = applyCharacterKitToProject({
      kit: sourceKit,
      project: sourceProject,
      template: HUMANOID_80_RIG_TEMPLATE,
      assets,
      timestamp: TIMESTAMP,
      overrideResolution: "removeInvalidPartDeltas"
    });
    expect(cleaned.status).toBe("ok");
    if (cleaned.status === "ok") {
      expect(cleaned.removedOverrideSlots).toBe(1);
      expect(cleaned.project.overrides).toEqual([]);
    }
  });

  it("equips, replaces and removes references with an accessible default layer", () => {
    const oldWeapon = part("weapon.right", "south", {
      assetId: "part_weapon_old"
    });
    const newWeapon = part("weapon.right", "south", {
      assetId: "part_weapon_new"
    });
    const sourceProject = project({ parts: [{ assetId: oldWeapon.assetId }] });
    const equipped = equipCharacterPart({
      project: sourceProject,
      asset: newWeapon,
      assignedAssets: [oldWeapon],
      timestamp: TIMESTAMP
    });
    expect(equipped).toMatchObject({
      status: "ok",
      replacedAssetIds: [oldWeapon.assetId],
      defaultLayerGroup: "farEquipment",
      project: { parts: [{ assetId: newWeapon.assetId }] }
    });
    if (equipped.status !== "ok") return;
    expect(
      removeCharacterPart(equipped.project, newWeapon.assetId, TIMESTAMP).parts
    ).toEqual([]);
  });

  it("rejects a free accessory without an explicit attachment joint", () => {
    const accessory = part("accessory.1", "south");
    expect(
      equipCharacterPart({
        project: project(),
        asset: accessory,
        assignedAssets: [],
        timestamp: TIMESTAMP
      })
    ).toMatchObject({ status: "invalid", message: expect.stringMatching(/Attachment-Joint/) });

    expect(
      equipCharacterPart({
        project: project(),
        asset: { ...accessory, attachmentJointId: "hand.right" },
        assignedAssets: [],
        timestamp: TIMESTAMP
      })
    ).toMatchObject({
      status: "ok",
      defaultLayerGroup: "frontEquipment"
    });
    expect(
      equipCharacterPart({
        project: project(),
        asset: { ...accessory, attachmentJointId: "unknown-joint" },
        assignedAssets: [],
        timestamp: TIMESTAMP
      })
    ).toMatchObject({ status: "invalid", message: expect.stringMatching(/ungültig/) });
  });

  it("preserves the canonical direction contract in complete kit fixtures", () => {
    const assets = REQUIRED_PART_SLOT_IDS.flatMap((slot) =>
      DIRECTION_IDS.map((direction) => part(slot, direction))
    );
    expect(summarizeCharacterKitCoverage({
      mode: "eightAuthored",
      assets,
      kitMirrorPolicy: "forbid"
    })).toMatchObject({
      requiredCellCount: 120,
      resolvedRequiredCellCount: 120,
      authoredRequiredCellCount: 120,
      mirroredRequiredCellCount: 0,
      productionReady: true
    });
  });
});
