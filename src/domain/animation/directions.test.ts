import { describe, expect, it } from "vitest";
import {
  DIRECTION_IDS,
  DIRECTION_SOURCE_MODES,
  getMirroredDirection,
  getOppositeDirection,
  getRequiredAuthoredDirections,
  isAuthoredDirectionForMode,
  isDirection,
  type Direction
} from "./index";

describe("animation direction domain", () => {
  it("keeps the production and sprite-sheet direction order stable", () => {
    expect(DIRECTION_IDS).toEqual([
      "south",
      "southEast",
      "east",
      "northEast",
      "north",
      "northWest",
      "west",
      "southWest"
    ]);
    expect(DIRECTION_IDS.every(isDirection)).toBe(true);
    expect(isDirection("South")).toBe(false);
    expect(isDirection("north-east")).toBe(false);
    expect(isDirection(null)).toBe(false);
  });

  it("defines all three source modes in their stable order", () => {
    expect(DIRECTION_SOURCE_MODES).toEqual([
      "singleDirectionPrototype",
      "fiveAuthoredPlusMirror",
      "eightAuthored"
    ]);
  });

  it.each<[Direction, Direction]>([
    ["south", "south"],
    ["southEast", "southWest"],
    ["east", "west"],
    ["northEast", "northWest"],
    ["north", "north"],
    ["northWest", "northEast"],
    ["west", "east"],
    ["southWest", "southEast"]
  ])("mirrors %s horizontally to %s", (source, mirrored) => {
    expect(getMirroredDirection(source)).toBe(mirrored);
    expect(getMirroredDirection(mirrored)).toBe(source);
  });

  it.each<[Direction, Direction]>([
    ["south", "north"],
    ["southEast", "northWest"],
    ["east", "west"],
    ["northEast", "southWest"],
    ["north", "south"],
    ["northWest", "southEast"],
    ["west", "east"],
    ["southWest", "northEast"]
  ])("resolves the opposite of %s as %s", (source, opposite) => {
    expect(getOppositeDirection(source)).toBe(opposite);
    expect(getOppositeDirection(opposite)).toBe(source);
  });

  it("requires only south for a single-direction prototype", () => {
    expect(getRequiredAuthoredDirections("singleDirectionPrototype")).toEqual([
      "south"
    ]);
    expect(
      isAuthoredDirectionForMode("south", "singleDirectionPrototype")
    ).toBe(true);
    expect(
      isAuthoredDirectionForMode("east", "singleDirectionPrototype")
    ).toBe(false);
  });

  it("requires exactly the five non-derived sources for mirrored production", () => {
    expect(getRequiredAuthoredDirections("fiveAuthoredPlusMirror")).toEqual([
      "south",
      "southEast",
      "east",
      "northEast",
      "north"
    ]);
    expect(
      DIRECTION_IDS.filter((direction) =>
        isAuthoredDirectionForMode(direction, "fiveAuthoredPlusMirror")
      )
    ).toEqual(["south", "southEast", "east", "northEast", "north"]);
  });

  it("requires every canonical direction in eight-authored mode", () => {
    expect(getRequiredAuthoredDirections("eightAuthored")).toBe(DIRECTION_IDS);
    expect(
      DIRECTION_IDS.every((direction) =>
        isAuthoredDirectionForMode(direction, "eightAuthored")
      )
    ).toBe(true);
  });
});
