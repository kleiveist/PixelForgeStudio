export const REQUIRED_PART_SLOT_IDS = Object.freeze([
  "head",
  "torso",
  "pelvis",
  "arm.left.upper",
  "arm.left.lower",
  "hand.left",
  "arm.right.upper",
  "arm.right.lower",
  "hand.right",
  "leg.left.upper",
  "leg.left.lower",
  "foot.left",
  "leg.right.upper",
  "leg.right.lower",
  "foot.right"
] as const);

export const OPTIONAL_PART_SLOT_IDS = Object.freeze([
  "hair.back",
  "hair.front",
  "face",
  "headwear",
  "armor.torso",
  "armor.shoulder.left",
  "armor.shoulder.right",
  "glove.left",
  "glove.right",
  "boot.left",
  "boot.right",
  "cape.back",
  "cape.front",
  "back.item",
  "waist.item.left",
  "waist.item.right",
  "weapon.left",
  "weapon.right",
  "shield.left",
  "shield.right",
  "accessory.1",
  "accessory.2",
  "accessory.3",
  "accessory.4"
] as const);

export const PART_SLOT_IDS = Object.freeze([
  ...REQUIRED_PART_SLOT_IDS,
  ...OPTIONAL_PART_SLOT_IDS
] as const);

export const PART_SLOT_GROUP_IDS = Object.freeze([
  "body",
  "head",
  "arm.left",
  "arm.right",
  "leg.left",
  "leg.right",
  "armor",
  "outerwear",
  "equipment",
  "accessories"
] as const);

export type RequiredPartSlot = (typeof REQUIRED_PART_SLOT_IDS)[number];
export type OptionalPartSlot = (typeof OPTIONAL_PART_SLOT_IDS)[number];
export type PartSlot = (typeof PART_SLOT_IDS)[number];
export type PartSlotGroupId = (typeof PART_SLOT_GROUP_IDS)[number];

export interface PartSlotGroupDefinition {
  readonly id: PartSlotGroupId;
  readonly label: string;
}

export interface PartSlotDefinition {
  readonly id: PartSlot;
  readonly label: string;
  readonly groupId: PartSlotGroupId;
  readonly required: boolean;
}

export const PART_SLOT_GROUPS: readonly PartSlotGroupDefinition[] =
  Object.freeze([
    Object.freeze({ id: "body", label: "Körpermitte" }),
    Object.freeze({ id: "head", label: "Kopf" }),
    Object.freeze({ id: "arm.left", label: "Linker Arm" }),
    Object.freeze({ id: "arm.right", label: "Rechter Arm" }),
    Object.freeze({ id: "leg.left", label: "Linkes Bein" }),
    Object.freeze({ id: "leg.right", label: "Rechtes Bein" }),
    Object.freeze({ id: "armor", label: "Rüstung" }),
    Object.freeze({ id: "outerwear", label: "Überwurf und Gepäck" }),
    Object.freeze({ id: "equipment", label: "Waffen und Schilde" }),
    Object.freeze({ id: "accessories", label: "Freie Accessoires" })
  ]);

function definePartSlot(
  id: PartSlot,
  label: string,
  groupId: PartSlotGroupId,
  required: boolean
): PartSlotDefinition {
  return Object.freeze({ id, label, groupId, required });
}

export const PART_SLOT_DEFINITIONS: readonly PartSlotDefinition[] =
  Object.freeze([
    definePartSlot("head", "Kopf", "head", true),
    definePartSlot("torso", "Torso", "body", true),
    definePartSlot("pelvis", "Becken", "body", true),
    definePartSlot("arm.left.upper", "Linker Oberarm", "arm.left", true),
    definePartSlot("arm.left.lower", "Linker Unterarm", "arm.left", true),
    definePartSlot("hand.left", "Linke Hand", "arm.left", true),
    definePartSlot("arm.right.upper", "Rechter Oberarm", "arm.right", true),
    definePartSlot("arm.right.lower", "Rechter Unterarm", "arm.right", true),
    definePartSlot("hand.right", "Rechte Hand", "arm.right", true),
    definePartSlot("leg.left.upper", "Linker Oberschenkel", "leg.left", true),
    definePartSlot("leg.left.lower", "Linker Unterschenkel", "leg.left", true),
    definePartSlot("foot.left", "Linker Fuß", "leg.left", true),
    definePartSlot("leg.right.upper", "Rechter Oberschenkel", "leg.right", true),
    definePartSlot("leg.right.lower", "Rechter Unterschenkel", "leg.right", true),
    definePartSlot("foot.right", "Rechter Fuß", "leg.right", true),
    definePartSlot("hair.back", "Hinteres Haar", "head", false),
    definePartSlot("hair.front", "Vorderes Haar", "head", false),
    definePartSlot("face", "Gesicht", "head", false),
    definePartSlot("headwear", "Kopfbedeckung", "head", false),
    definePartSlot("armor.torso", "Torsorüstung", "armor", false),
    definePartSlot(
      "armor.shoulder.left",
      "Linke Schulterrüstung",
      "armor",
      false
    ),
    definePartSlot(
      "armor.shoulder.right",
      "Rechte Schulterrüstung",
      "armor",
      false
    ),
    definePartSlot("glove.left", "Linker Handschuh", "armor", false),
    definePartSlot("glove.right", "Rechter Handschuh", "armor", false),
    definePartSlot("boot.left", "Linker Stiefel", "armor", false),
    definePartSlot("boot.right", "Rechter Stiefel", "armor", false),
    definePartSlot("cape.back", "Hinterer Umhang", "outerwear", false),
    definePartSlot("cape.front", "Vorderer Umhang", "outerwear", false),
    definePartSlot("back.item", "Rückengegenstand", "outerwear", false),
    definePartSlot(
      "waist.item.left",
      "Linker Hüftgegenstand",
      "outerwear",
      false
    ),
    definePartSlot(
      "waist.item.right",
      "Rechter Hüftgegenstand",
      "outerwear",
      false
    ),
    definePartSlot("weapon.left", "Linke Waffe", "equipment", false),
    definePartSlot("weapon.right", "Rechte Waffe", "equipment", false),
    definePartSlot("shield.left", "Linker Schild", "equipment", false),
    definePartSlot("shield.right", "Rechter Schild", "equipment", false),
    definePartSlot("accessory.1", "Accessoire 1", "accessories", false),
    definePartSlot("accessory.2", "Accessoire 2", "accessories", false),
    definePartSlot("accessory.3", "Accessoire 3", "accessories", false),
    definePartSlot("accessory.4", "Accessoire 4", "accessories", false)
  ]);

const partSlotIds = new Set<string>(PART_SLOT_IDS);
const requiredPartSlotIds = new Set<string>(REQUIRED_PART_SLOT_IDS);

export function isPartSlot(value: unknown): value is PartSlot {
  return typeof value === "string" && partSlotIds.has(value);
}

export function isRequiredPartSlot(value: unknown): value is RequiredPartSlot {
  return typeof value === "string" && requiredPartSlotIds.has(value);
}
