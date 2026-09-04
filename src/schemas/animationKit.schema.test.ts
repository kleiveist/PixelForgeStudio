import { describe, expect, it } from "vitest";
import {
  CharacterKitSchema,
  MAX_ANIMATION_COMPATIBILITY_KEY_LENGTH,
  MAX_ANIMATION_DESCRIPTION_LENGTH,
  MAX_ANIMATION_NAME_LENGTH,
  MAX_ANIMATION_PARTS_PER_PROJECT,
  parseCharacterKit
} from "./index";
import { createCharacterKitInput } from "../test/animationSchemaFixtures";

describe("CharacterKitSchema", () => {
  it("parses a strict readonly Character Kit reference package", () => {
    const imported: unknown = createCharacterKitInput({
      name: "  Waldwächter  ",
      description: "  Humanoides Kit  "
    });
    const parsed = parseCharacterKit(imported);

    expect(parsed).toMatchObject({
      schemaVersion: 1,
      kind: "characterKit",
      kitId: "kit_guard_001",
      name: "Waldwächter",
      description: "Humanoides Kit",
      rigTemplateId: "humanoid-80-v1",
      directionSourceMode: "fiveAuthoredPlusMirror",
      mirrorPolicy: "allow"
    });
    expect(parsed.partAssetIds).toEqual(["part_head_south_001"]);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.partAssetIds)).toBe(true);
  });

  it("reads old kits with an allow default and accepts an explicit safe default", () => {
    const input = createCharacterKitInput();
    const { mirrorPolicy: _legacyMissing, ...legacyInput } = input;
    expect(parseCharacterKit(legacyInput).mirrorPolicy).toBe("allow");
    expect(parseCharacterKit(createCharacterKitInput({
      mirrorPolicy: "forbid"
    })).mirrorPolicy).toBe("forbid");
  });

  it("rejects duplicate PartAsset references", () => {
    expect(
      CharacterKitSchema.safeParse(
        createCharacterKitInput({
          partAssetIds: ["part_head_south_001", "part_head_south_001"]
        })
      ).success
    ).toBe(false);
  });

  it.each([
    ["schema version", { schemaVersion: 2 }],
    ["kind", { kind: "animationKit" }],
    ["rig", { rigTemplateId: "custom-rig" }],
    ["source mode", { directionSourceMode: "mirrored" }],
    ["compatibility key", { rigCompatibilityKey: "" }]
  ])("rejects an invalid %s", (_label, override) => {
    expect(
      CharacterKitSchema.safeParse({
        ...createCharacterKitInput(),
        ...override
      }).success
    ).toBe(false);
  });

  it("rejects unknown metadata instead of silently accepting it", () => {
    expect(
      CharacterKitSchema.safeParse({
        ...createCharacterKitInput(),
        cloudLibraryId: "remote_kit"
      }).success
    ).toBe(false);
  });

  it("enforces text and PartAsset-reference limits", () => {
    const maximumReferences = Array.from(
      { length: MAX_ANIMATION_PARTS_PER_PROJECT },
      (_, index) => `part_${index}`
    );

    expect(
      CharacterKitSchema.safeParse(
        createCharacterKitInput({
          name: "a".repeat(MAX_ANIMATION_NAME_LENGTH),
          description: "b".repeat(MAX_ANIMATION_DESCRIPTION_LENGTH),
          rigCompatibilityKey: "c".repeat(
            MAX_ANIMATION_COMPATIBILITY_KEY_LENGTH
          ),
          partAssetIds: maximumReferences
        })
      ).success
    ).toBe(true);
    expect(
      CharacterKitSchema.safeParse(
        createCharacterKitInput({
          name: "a".repeat(MAX_ANIMATION_NAME_LENGTH + 1)
        })
      ).success
    ).toBe(false);
    expect(
      CharacterKitSchema.safeParse(
        createCharacterKitInput({
          description: "b".repeat(MAX_ANIMATION_DESCRIPTION_LENGTH + 1)
        })
      ).success
    ).toBe(false);
    expect(
      CharacterKitSchema.safeParse(
        createCharacterKitInput({
          rigCompatibilityKey: "c".repeat(
            MAX_ANIMATION_COMPATIBILITY_KEY_LENGTH + 1
          )
        })
      ).success
    ).toBe(false);
    expect(
      CharacterKitSchema.safeParse(
        createCharacterKitInput({
          partAssetIds: [...maximumReferences, "part_overflow"]
        })
      ).success
    ).toBe(false);
  });
});
