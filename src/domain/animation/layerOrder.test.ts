import { describe, expect, it } from "vitest";
import {
  DIRECTION_DRAW_ORDERS,
  DIRECTION_IDS,
  DRAW_ORDER_VERSION,
  PART_SLOT_IDS,
  REQUIRED_PART_SLOT_IDS,
  getDefaultLayerGroup,
  resolveDirectionDrawOrder,
  validateDrawOrder,
  renderFrame,
  IDENTITY_TRANSFORM,
  type Direction,
  type DirectionDrawOrder,
  type LayeredPart,
  type RgbaImage
} from "./index";

function part(
  id: string,
  slot: string,
  overrides: Partial<LayeredPart> = {}
): LayeredPart {
  return { id, slot, ...overrides };
}

function solid(r: number, g: number, b: number): RgbaImage {
  return {
    width: 1,
    height: 1,
    pixels: new Uint8ClampedArray([r, g, b, 255])
  };
}

describe("directional draw order", () => {
  it("defines a complete valid versioned order for every target direction", () => {
    expect(DIRECTION_DRAW_ORDERS.map(({ direction }) => direction)).toEqual(
      DIRECTION_IDS
    );
    for (const order of DIRECTION_DRAW_ORDERS) {
      expect(order.version).toBe(DRAW_ORDER_VERSION);
      expect(order.entries).toHaveLength(PART_SLOT_IDS.length);
      expect(new Set(order.entries.map(({ slot }) => slot)).size).toBe(
        PART_SLOT_IDS.length
      );
      expect(validateDrawOrder(order)).toEqual({ valid: true, issues: [] });
      for (const requiredSlot of REQUIRED_PART_SLOT_IDS) {
        expect(
          order.entries.filter(({ slot }) => slot === requiredSlot)
        ).toHaveLength(1);
      }
    }
    expect(new Set(DIRECTION_DRAW_ORDERS.map(({ entries }) => entries)).size).toBe(8);
  });

  it("records anatomical near sides independently for cardinals and diagonals", () => {
    const nearSide = Object.fromEntries(
      DIRECTION_DRAW_ORDERS.map((order) => [order.direction, order.nearSide])
    );
    expect(nearSide).toEqual({
      south: "balanced",
      southEast: "right",
      east: "right",
      northEast: "left",
      north: "balanced",
      northWest: "right",
      west: "left",
      southWest: "left"
    });
  });

  it("skips absent optionals and inserts every occupied slot exactly once", () => {
    const resolved = resolveDirectionDrawOrder("south", [
      part("cape", "cape.back"),
      part("torso", "torso"),
      part("weapon", "weapon.left")
    ]);

    expect(resolved.status).toBe("ok");
    if (resolved.status !== "ok") throw new Error("Expected a valid order.");
    expect(resolved.parts.map(({ id }) => id)).toEqual([
      "cape",
      "torso",
      "weapon"
    ]);
    expect(resolved.parts.map(({ group }) => group)).toEqual([
      "rearAccessories",
      "core",
      "frontEquipment"
    ]);
    expect(getDefaultLayerGroup("south", "accessory.1")).toBe(
      "frontEquipment"
    );
  });

  it("rejects duplicate and unknown slots and incomplete required definitions", () => {
    const duplicate = resolveDirectionDrawOrder("south", [
      part("one", "torso"),
      part("two", "torso")
    ]);
    const unknown = resolveDirectionDrawOrder("south", [
      part("unknown", "wing.left")
    ]);
    const source = DIRECTION_DRAW_ORDERS[0];
    if (!source) throw new Error("Expected the south draw order.");
    const incomplete: DirectionDrawOrder = {
      ...source,
      entries: source.entries.filter(({ slot }) => slot !== "torso")
    };

    expect(duplicate.status).toBe("invalid");
    expect(
      duplicate.status === "invalid"
        ? duplicate.issues.map(({ code }) => code)
        : []
    ).toContain("duplicateSlot");
    expect(unknown.status).toBe("invalid");
    expect(
      unknown.status === "invalid" ? unknown.issues.map(({ code }) => code) : []
    ).toContain("unknownSlot");
    expect(validateDrawOrder(incomplete)).toMatchObject({ valid: false });
    expect(
      validateDrawOrder(incomplete).issues.map(({ code }) => code)
    ).toContain("missingRequiredSlot");
  });

  it("requires a valid attachment joint for free accessories", () => {
    const missing = resolveDirectionDrawOrder("south", [
      part("spark", "accessory.1")
    ]);
    const invalid = resolveDirectionDrawOrder("south", [
      part("spark", "accessory.1", { attachmentJointId: "hat.tip" })
    ]);
    const valid = resolveDirectionDrawOrder("south", [
      part("spark", "accessory.1", { attachmentJointId: "hand.left" })
    ]);

    expect(missing.status === "invalid" ? missing.issues[0]?.code : null).toBe(
      "missingAttachmentJoint"
    );
    expect(invalid.status === "invalid" ? invalid.issues[0]?.code : null).toBe(
      "invalidAttachmentJoint"
    );
    expect(valid.status).toBe("ok");
  });

  it("applies a small project layer offset without replacing the full order", () => {
    const base = resolveDirectionDrawOrder("south", [
      part("pelvis", "pelvis"),
      part("torso", "torso")
    ]);
    const moved = resolveDirectionDrawOrder("south", [
      part("pelvis", "pelvis", { layerOffset: 1 }),
      part("torso", "torso")
    ]);
    const invalid = resolveDirectionDrawOrder("south", [
      part("pelvis", "pelvis", { layerOffset: 9 })
    ]);

    expect(base.status === "ok" ? base.parts.map(({ id }) => id) : []).toEqual([
      "pelvis",
      "torso"
    ]);
    expect(moved.status === "ok" ? moved.parts.map(({ id }) => id) : []).toEqual([
      "torso",
      "pelvis"
    ]);
    expect(invalid.status).toBe("invalid");
  });

  it.each<readonly [Direction, readonly number[]]>([
    ["southEast", [0, 0, 255, 255]],
    ["east", [0, 0, 255, 255]],
    ["northEast", [255, 0, 0, 255]],
    ["northWest", [0, 0, 255, 255]],
    ["west", [255, 0, 0, 255]],
    ["southWest", [255, 0, 0, 255]]
  ])("renders the visually near arm last for %s", (direction, expected) => {
    const resolved = resolveDirectionDrawOrder(direction, [
      part("left", "arm.left.upper"),
      part("right", "arm.right.upper")
    ]);
    if (resolved.status !== "ok") throw new Error("Expected a valid order.");
    const sources = { left: solid(255, 0, 0), right: solid(0, 0, 255) };
    const frame = renderFrame(
      { width: 1, height: 1 },
      resolved.parts.map(({ id }) => ({
        id,
        source: sources[id as keyof typeof sources],
        transform: IDENTITY_TRANSFORM
      }))
    );

    expect([...frame.pixels]).toEqual(expected);
  });
});
