import {
  DIRECTION_IDS,
  JOINT_IDS,
  createRigCompatibilityKey,
  type Direction,
  type RigTemplate
} from "../../domain/animation";

const DIRECTION_LABELS: Readonly<Record<Direction, string>> = Object.freeze({
  south: "Süd",
  southEast: "Südost",
  east: "Ost",
  northEast: "Nordost",
  north: "Nord",
  northWest: "Nordwest",
  west: "West",
  southWest: "Südwest"
});

export interface RigTemplateLibraryItem {
  readonly id: RigTemplate["id"];
  readonly label: string;
  readonly frameLabel: string;
  readonly characterHeightLabel: string;
  readonly footAnchorLabel: string;
  readonly authoredDirections: readonly string[];
  readonly runtimeDirectionCount: number;
  readonly jointCount: number;
  readonly boneCount: number;
  readonly requiredSlotCount: number;
  readonly compatibilityKey: string;
}

/** Pure presentation projection; the immutable rig domain remains authoritative. */
export function createRigTemplateLibraryItem(
  template: RigTemplate
): RigTemplateLibraryItem {
  const { frameProfile } = template;
  return Object.freeze({
    id: template.id,
    label: template.id === "humanoid-80-v1" ? "Humanoid 80" : template.id,
    frameLabel: `${frameProfile.frameSize.width} × ${frameProfile.frameSize.height} px`,
    characterHeightLabel: `${frameProfile.characterHeight} px`,
    footAnchorLabel: `${frameProfile.footAnchor.x} / ${frameProfile.footAnchor.y}`,
    authoredDirections: Object.freeze(
      template.directions.map(({ direction }) => DIRECTION_LABELS[direction])
    ),
    runtimeDirectionCount: DIRECTION_IDS.length,
    jointCount: JOINT_IDS.length,
    boneCount: template.bones.length,
    requiredSlotCount: template.slotBindings.length,
    compatibilityKey: createRigCompatibilityKey(template)
  });
}
