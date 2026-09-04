import type { Direction } from "./directions";
import { DIRECTION_IDS } from "./directions";
import { isJointId, type JointId } from "./rigTopology";
import {
  PART_SLOT_IDS,
  REQUIRED_PART_SLOT_IDS,
  isPartSlot,
  type PartSlot
} from "./slots";

export const DRAW_ORDER_VERSION = 1 as const;
export const MIN_PROJECT_LAYER_OFFSET = -8;
export const MAX_PROJECT_LAYER_OFFSET = 8;

export const LAYER_GROUPS = Object.freeze([
  "rearAccessories",
  "farEquipment",
  "farLimbs",
  "core",
  "nearLimbs",
  "head",
  "frontEquipment"
] as const);

export type LayerGroup = (typeof LAYER_GROUPS)[number];
export type AnatomicalSide = "left" | "right";
export type VisualNearSide = AnatomicalSide | "balanced";

export const DEFAULT_OPTIONAL_SLOT_ATTACHMENT_JOINTS: Readonly<
  Partial<Record<PartSlot, JointId>>
> = Object.freeze({
  "hair.back": "neck",
  "hair.front": "head",
  face: "head",
  headwear: "head",
  "armor.torso": "chest",
  "armor.shoulder.left": "shoulder.left",
  "armor.shoulder.right": "shoulder.right",
  "glove.left": "hand.left",
  "glove.right": "hand.right",
  "boot.left": "ankle.left",
  "boot.right": "ankle.right",
  "cape.back": "chest",
  "cape.front": "chest",
  "back.item": "chest",
  "waist.item.left": "pelvis",
  "waist.item.right": "pelvis",
  "weapon.left": "hand.left",
  "weapon.right": "hand.right",
  "shield.left": "hand.left",
  "shield.right": "hand.right"
});

export interface DirectionLayerEntry {
  readonly slot: PartSlot;
  readonly group: LayerGroup;
}

export interface DirectionDrawOrder {
  readonly version: typeof DRAW_ORDER_VERSION;
  readonly direction: Direction;
  readonly nearSide: VisualNearSide;
  readonly entries: readonly DirectionLayerEntry[];
}

export interface LayeredPart {
  readonly id: string;
  readonly slot: string;
  readonly attachmentJointId?: string;
  readonly layerOffset?: number;
}

export interface ResolvedLayeredPart extends LayeredPart {
  readonly slot: PartSlot;
  readonly group: LayerGroup;
  readonly baseIndex: number;
  readonly effectiveIndex: number;
}

export const DRAW_ORDER_ISSUE_CODES = Object.freeze([
  "unknownDirection",
  "unknownSlot",
  "duplicateSlot",
  "missingRequiredSlot",
  "missingAttachmentJoint",
  "invalidAttachmentJoint",
  "invalidLayerOffset"
] as const);

export type DrawOrderIssueCode = (typeof DRAW_ORDER_ISSUE_CODES)[number];

export interface DrawOrderIssue {
  readonly code: DrawOrderIssueCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export type DrawOrderValidationResult =
  | Readonly<{ valid: true; issues: readonly [] }>
  | Readonly<{ valid: false; issues: readonly DrawOrderIssue[] }>;

export type ResolveDirectionDrawOrderResult =
  | Readonly<{
      status: "ok";
      definition: DirectionDrawOrder;
      parts: readonly ResolvedLayeredPart[];
    }>
  | Readonly<{
      status: "invalid";
      definition: DirectionDrawOrder | null;
      issues: readonly DrawOrderIssue[];
    }>;

const FREE_ACCESSORY_SLOTS = new Set<PartSlot>([
  "accessory.1",
  "accessory.2",
  "accessory.3",
  "accessory.4"
]);

function sideSlot(side: AnatomicalSide, stem: string): PartSlot {
  return `${stem}.${side}` as PartSlot;
}

function limbSlot(
  limb: "arm" | "leg",
  side: AnatomicalSide,
  segment: "upper" | "lower"
): PartSlot {
  return `${limb}.${side}.${segment}`;
}

function createDirectionDrawOrder(
  direction: Direction,
  nearSide: VisualNearSide,
  farSide: AnatomicalSide,
  foregroundSide: AnatomicalSide,
  headEntries: readonly PartSlot[]
): DirectionDrawOrder {
  const grouped: readonly Readonly<{
    group: LayerGroup;
    slots: readonly PartSlot[];
  }>[] = [
    {
      group: "rearAccessories",
      slots: ["hair.back", "cape.back", "back.item"]
    },
    {
      group: "farEquipment",
      slots: [
        sideSlot(farSide, "waist.item"),
        sideSlot(farSide, "weapon"),
        sideSlot(farSide, "shield")
      ]
    },
    {
      group: "farLimbs",
      slots: [
        limbSlot("leg", farSide, "upper"),
        limbSlot("leg", farSide, "lower"),
        sideSlot(farSide, "boot"),
        sideSlot(farSide, "foot"),
        limbSlot("arm", farSide, "upper"),
        limbSlot("arm", farSide, "lower"),
        sideSlot(farSide, "glove"),
        sideSlot(farSide, "hand"),
        sideSlot(farSide, "armor.shoulder")
      ]
    },
    {
      group: "core",
      slots: ["pelvis", "torso", "armor.torso"]
    },
    {
      group: "nearLimbs",
      slots: [
        limbSlot("leg", foregroundSide, "upper"),
        limbSlot("leg", foregroundSide, "lower"),
        sideSlot(foregroundSide, "boot"),
        sideSlot(foregroundSide, "foot"),
        limbSlot("arm", foregroundSide, "upper"),
        limbSlot("arm", foregroundSide, "lower"),
        sideSlot(foregroundSide, "glove"),
        sideSlot(foregroundSide, "hand"),
        sideSlot(foregroundSide, "armor.shoulder")
      ]
    },
    { group: "head", slots: headEntries },
    {
      group: "frontEquipment",
      slots: [
        sideSlot(foregroundSide, "waist.item"),
        sideSlot(foregroundSide, "weapon"),
        sideSlot(foregroundSide, "shield"),
        "accessory.1",
        "accessory.2",
        "accessory.3",
        "accessory.4"
      ]
    }
  ];
  return Object.freeze({
    version: DRAW_ORDER_VERSION,
    direction,
    nearSide,
    entries: Object.freeze(
      grouped.flatMap(({ group, slots }) =>
        slots.map((slot) => Object.freeze({ slot, group }))
      )
    )
  });
}

/** Eight authored target orders; mirrored target directions remain explicit. */
export const DIRECTION_DRAW_ORDERS: readonly DirectionDrawOrder[] =
  Object.freeze([
    createDirectionDrawOrder(
      "south",
      "balanced",
      "right",
      "left",
      ["head", "face", "hair.front", "headwear", "cape.front"]
    ),
    createDirectionDrawOrder(
      "southEast",
      "right",
      "left",
      "right",
      ["head", "hair.front", "face", "headwear", "cape.front"]
    ),
    createDirectionDrawOrder(
      "east",
      "right",
      "left",
      "right",
      ["head", "hair.front", "face", "cape.front", "headwear"]
    ),
    createDirectionDrawOrder(
      "northEast",
      "left",
      "right",
      "left",
      ["face", "head", "hair.front", "cape.front", "headwear"]
    ),
    createDirectionDrawOrder(
      "north",
      "balanced",
      "left",
      "right",
      ["face", "hair.front", "head", "cape.front", "headwear"]
    ),
    createDirectionDrawOrder(
      "northWest",
      "right",
      "left",
      "right",
      ["hair.front", "face", "head", "cape.front", "headwear"]
    ),
    createDirectionDrawOrder(
      "west",
      "left",
      "right",
      "left",
      ["hair.front", "head", "face", "cape.front", "headwear"]
    ),
    createDirectionDrawOrder(
      "southWest",
      "left",
      "right",
      "left",
      ["head", "face", "hair.front", "cape.front", "headwear"]
    )
  ]);

function addIssue(
  issues: DrawOrderIssue[],
  code: DrawOrderIssueCode,
  path: readonly (string | number)[],
  message: string
): void {
  issues.push(Object.freeze({ code, path: Object.freeze([...path]), message }));
}

export function getDirectionDrawOrder(
  direction: Direction
): DirectionDrawOrder | null {
  return (
    DIRECTION_DRAW_ORDERS.find((order) => order.direction === direction) ?? null
  );
}

export function getDefaultLayerGroup(
  direction: Direction,
  slot: PartSlot
): LayerGroup | null {
  return (
    getDirectionDrawOrder(direction)?.entries.find(
      (entry) => entry.slot === slot
    )?.group ?? null
  );
}

export function validateDrawOrder(
  order: DirectionDrawOrder,
  occupiedParts: readonly LayeredPart[] = []
): DrawOrderValidationResult {
  const issues: DrawOrderIssue[] = [];
  if (!DIRECTION_IDS.includes(order.direction)) {
    addIssue(
      issues,
      "unknownDirection",
      ["direction"],
      `Unknown draw-order direction "${order.direction}".`
    );
  }
  const orderedSlots = new Set<PartSlot>();
  order.entries.forEach((entry, index) => {
    if (!isPartSlot(entry.slot)) {
      addIssue(
        issues,
        "unknownSlot",
        ["entries", index, "slot"],
        `Unknown draw-order slot "${String(entry.slot)}".`
      );
      return;
    }
    if (orderedSlots.has(entry.slot)) {
      addIssue(
        issues,
        "duplicateSlot",
        ["entries", index, "slot"],
        `Draw-order slot "${entry.slot}" occurs more than once.`
      );
    }
    orderedSlots.add(entry.slot);
  });
  for (const requiredSlot of REQUIRED_PART_SLOT_IDS) {
    if (!orderedSlots.has(requiredSlot)) {
      addIssue(
        issues,
        "missingRequiredSlot",
        ["entries"],
        `Required occupied slot "${requiredSlot}" is missing from the order.`
      );
    }
  }

  const occupiedSlots = new Set<PartSlot>();
  occupiedParts.forEach((part, index) => {
    if (!isPartSlot(part.slot)) {
      addIssue(
        issues,
        "unknownSlot",
        ["parts", index, "slot"],
        `Unknown occupied slot "${part.slot}".`
      );
      return;
    }
    if (occupiedSlots.has(part.slot)) {
      addIssue(
        issues,
        "duplicateSlot",
        ["parts", index, "slot"],
        `Occupied slot "${part.slot}" occurs more than once.`
      );
    }
    occupiedSlots.add(part.slot);
    if (!orderedSlots.has(part.slot)) {
      addIssue(
        issues,
        "unknownSlot",
        ["parts", index, "slot"],
        `Occupied slot "${part.slot}" has no draw-order entry.`
      );
    }
    if (FREE_ACCESSORY_SLOTS.has(part.slot) && !part.attachmentJointId) {
      addIssue(
        issues,
        "missingAttachmentJoint",
        ["parts", index, "attachmentJointId"],
        `Free accessory "${part.slot}" requires an attachment joint.`
      );
    } else if (
      part.attachmentJointId !== undefined &&
      !isJointId(part.attachmentJointId)
    ) {
      addIssue(
        issues,
        "invalidAttachmentJoint",
        ["parts", index, "attachmentJointId"],
        `Attachment joint "${part.attachmentJointId}" is unknown.`
      );
    }
    if (
      part.layerOffset !== undefined &&
      (!Number.isInteger(part.layerOffset) ||
        part.layerOffset < MIN_PROJECT_LAYER_OFFSET ||
        part.layerOffset > MAX_PROJECT_LAYER_OFFSET)
    ) {
      addIssue(
        issues,
        "invalidLayerOffset",
        ["parts", index, "layerOffset"],
        `Layer offset must be an integer from ${MIN_PROJECT_LAYER_OFFSET} to ${MAX_PROJECT_LAYER_OFFSET}.`
      );
    }
  });

  return issues.length === 0
    ? Object.freeze({ valid: true, issues: Object.freeze([] as const) })
    : Object.freeze({ valid: false, issues: Object.freeze(issues) });
}

function effectiveLayerIndex(baseIndex: number, offset: number): number {
  if (offset === 0) return baseIndex;
  return baseIndex + offset + Math.sign(offset) * 0.25;
}

export function resolveDirectionDrawOrder(
  direction: Direction,
  occupiedParts: readonly LayeredPart[]
): ResolveDirectionDrawOrderResult {
  const definition = getDirectionDrawOrder(direction);
  if (!definition) {
    return Object.freeze({
      status: "invalid",
      definition: null,
      issues: Object.freeze([
        Object.freeze({
          code: "unknownDirection" as const,
          path: Object.freeze(["direction"]),
          message: `Unknown draw-order direction "${direction}".`
        })
      ])
    });
  }
  const validation = validateDrawOrder(definition, occupiedParts);
  if (!validation.valid) {
    return Object.freeze({
      status: "invalid",
      definition,
      issues: validation.issues
    });
  }
  const entryBySlot = new Map(
    definition.entries.map((entry, index) => [entry.slot, { entry, index }])
  );
  const parts = occupiedParts.map((part) => {
    if (!isPartSlot(part.slot)) {
      throw new Error("Validated draw-order part unexpectedly has an unknown slot.");
    }
    const match = entryBySlot.get(part.slot);
    if (!match) {
      throw new Error("Validated draw-order part unexpectedly lacks an entry.");
    }
    const offset = part.layerOffset ?? 0;
    return Object.freeze({
      ...part,
      slot: part.slot,
      group: match.entry.group,
      baseIndex: match.index,
      effectiveIndex: effectiveLayerIndex(match.index, offset)
    });
  });
  parts.sort(
    (left, right) =>
      left.effectiveIndex - right.effectiveIndex ||
      left.baseIndex - right.baseIndex ||
      left.id.localeCompare(right.id)
  );
  return Object.freeze({
    status: "ok",
    definition,
    parts: Object.freeze(parts)
  });
}

export function isFreeAccessorySlot(slot: PartSlot): boolean {
  return FREE_ACCESSORY_SLOTS.has(slot);
}

export function resolvePartAttachmentJoint(
  slot: PartSlot,
  explicitAttachmentJointId?: JointId
): JointId | null {
  return explicitAttachmentJointId ??
    DEFAULT_OPTIONAL_SLOT_ATTACHMENT_JOINTS[slot] ??
    null;
}

export const DEFAULT_FREE_ACCESSORY_LAYER_GROUP: LayerGroup =
  "frontEquipment";

export type AttachmentJoint = JointId;

// Compile-time guard that keeps the versioned base definitions exhaustive.
for (const order of DIRECTION_DRAW_ORDERS) {
  if (order.entries.length !== PART_SLOT_IDS.length) {
    throw new Error(`Direction ${order.direction} has an incomplete layer order.`);
  }
}
