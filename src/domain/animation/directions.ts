export const DIRECTION_IDS = Object.freeze([
  "south",
  "southEast",
  "east",
  "northEast",
  "north",
  "northWest",
  "west",
  "southWest"
] as const);

export const DIRECTION_SOURCE_MODES = Object.freeze([
  "singleDirectionPrototype",
  "fiveAuthoredPlusMirror",
  "eightAuthored"
] as const);

export type Direction = (typeof DIRECTION_IDS)[number];
export type DirectionSourceMode = (typeof DIRECTION_SOURCE_MODES)[number];

const directionIds = new Set<string>(DIRECTION_IDS);

const oppositeDirections = Object.freeze({
  south: "north",
  southEast: "northWest",
  east: "west",
  northEast: "southWest",
  north: "south",
  northWest: "southEast",
  west: "east",
  southWest: "northEast"
} satisfies Readonly<Record<Direction, Direction>>);

const mirroredDirections = Object.freeze({
  south: "south",
  southEast: "southWest",
  east: "west",
  northEast: "northWest",
  north: "north",
  northWest: "northEast",
  west: "east",
  southWest: "southEast"
} satisfies Readonly<Record<Direction, Direction>>);

const prototypeDirections = Object.freeze(["south"] as const);
const fiveAuthoredDirections = Object.freeze([
  "south",
  "southEast",
  "east",
  "northEast",
  "north"
] as const);

const authoredDirectionsByMode = Object.freeze({
  singleDirectionPrototype: prototypeDirections,
  fiveAuthoredPlusMirror: fiveAuthoredDirections,
  eightAuthored: DIRECTION_IDS
} satisfies Readonly<Record<DirectionSourceMode, readonly Direction[]>>);

export function isDirection(value: unknown): value is Direction {
  return typeof value === "string" && directionIds.has(value);
}

export function getOppositeDirection(direction: Direction): Direction {
  return oppositeDirections[direction];
}

export function getMirroredDirection(direction: Direction): Direction {
  return mirroredDirections[direction];
}

export function getRequiredAuthoredDirections(
  mode: DirectionSourceMode
): readonly Direction[] {
  return authoredDirectionsByMode[mode];
}

export function isAuthoredDirectionForMode(
  direction: Direction,
  mode: DirectionSourceMode
): boolean {
  return getRequiredAuthoredDirections(mode).includes(direction);
}
