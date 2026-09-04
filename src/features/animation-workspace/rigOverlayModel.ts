import {
  JOINT_IDS,
  PART_SLOT_DEFINITIONS,
  findDirectionRig,
  type BoneId,
  type Direction,
  type JointId,
  type PartSlot,
  type Point,
  type RigSourceDirection,
  type RigTemplate
} from "../../domain/animation";

export interface RigOverlayBone {
  readonly id: BoneId;
  readonly start: Point;
  readonly end: Point;
}

export interface RigOverlayJoint {
  readonly id: JointId;
  readonly position: Point;
}

export interface RigOverlaySlotLabel {
  readonly slotId: PartSlot;
  readonly label: string;
  readonly position: Point;
}

export interface RigOverlayModel {
  readonly templateId: string;
  readonly direction: RigSourceDirection;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly groundlineY: number;
  readonly bones: readonly RigOverlayBone[];
  readonly joints: readonly RigOverlayJoint[];
  readonly slotLabels: readonly RigOverlaySlotLabel[];
}

export function createRigOverlayModel(
  template: RigTemplate,
  direction: Direction
): RigOverlayModel | null {
  const directionRig = findDirectionRig(template, direction);
  if (!directionRig) return null;

  const bones = Object.freeze(
    template.bones.map((bone) =>
      Object.freeze({
        id: bone.id,
        start: directionRig.joints[bone.parentJointId].position,
        end: directionRig.joints[bone.childJointId].position
      })
    )
  );
  const joints = Object.freeze(
    JOINT_IDS.map((jointId) => {
      const joint = directionRig.joints[jointId];
      return Object.freeze({ id: joint.id, position: joint.position });
    })
  );
  const slotLabels = Object.freeze(
    template.slotBindings.map((binding) => {
      const bone = bones.find((candidate) => candidate.id === binding.boneId);
      if (!bone) {
        throw new TypeError(
          `Slot binding references missing bone "${binding.boneId}".`
        );
      }
      const slot = PART_SLOT_DEFINITIONS.find(
        (definition) => definition.id === binding.slotId
      );
      if (!slot) {
        throw new TypeError(
          `Slot binding references missing slot "${binding.slotId}".`
        );
      }
      return Object.freeze({
        slotId: binding.slotId,
        label: slot.label,
        position: Object.freeze({
          x: (bone.start.x + bone.end.x) / 2 + 1,
          y: (bone.start.y + bone.end.y) / 2 - 1
        })
      });
    })
  );

  return Object.freeze({
    templateId: template.id,
    direction: directionRig.direction,
    frameWidth: template.frameProfile.frameSize.width,
    frameHeight: template.frameProfile.frameSize.height,
    groundlineY: template.frameProfile.footAnchor.y,
    bones,
    joints,
    slotLabels
  });
}
