import type { Direction, RigTemplate } from "../../domain/animation";
import { DIRECTION_LABELS } from "./animationWorkspaceModel";
import { createRigOverlayModel } from "./rigOverlayModel";
import styles from "./AnimationWorkspace.module.css";

export interface RigOverlayProps {
  readonly template: RigTemplate;
  readonly direction: Direction;
  readonly showRig: boolean;
  readonly showGroundline: boolean;
}

export function RigOverlay({
  template,
  direction,
  showRig,
  showGroundline
}: RigOverlayProps) {
  const model = createRigOverlayModel(template, direction);
  const directionLabel = DIRECTION_LABELS[direction];

  if (!model) {
    return (
      <svg
        className={styles.rigSvg}
        viewBox={`0 0 ${template.frameProfile.frameSize.width} ${template.frameProfile.frameSize.height}`}
        role="img"
        aria-label={`${directionLabel}: keine freigegebene Rig-Quellgeometrie`}
        data-testid="rig-overlay"
        data-rig-direction={direction}
        data-rig-available="false"
      >
        <title>
          {directionLabel}: Rig-Quellgeometrie folgt mit der Spiegelableitung
        </title>
        {showGroundline ? (
          <line
            className={styles.rigGroundline}
            x1="0"
            x2={template.frameProfile.frameSize.width}
            y1={template.frameProfile.footAnchor.y}
            y2={template.frameProfile.footAnchor.y}
            data-testid="rig-groundline"
          />
        ) : null}
      </svg>
    );
  }

  return (
    <svg
      className={styles.rigSvg}
      viewBox={`0 0 ${model.frameWidth} ${model.frameHeight}`}
      role="img"
      aria-label={`${directionLabel}: Neutralpose des ${model.templateId}`}
      data-testid="rig-overlay"
      data-rig-direction={model.direction}
      data-rig-available="true"
    >
      <title>
        {directionLabel}: Neutralpose des {model.templateId}
      </title>
      <desc>
        {model.bones.length} Bones, {model.joints.length} Joints und{" "}
        {model.slotLabels.length} Pflichtslot-Bindungen.
      </desc>
      {showGroundline ? (
        <line
          className={styles.rigGroundline}
          x1="0"
          x2={model.frameWidth}
          y1={model.groundlineY}
          y2={model.groundlineY}
          data-testid="rig-groundline"
        />
      ) : null}
      {showRig ? (
        <g data-testid="rig-neutral-pose">
          <g className={styles.rigBones} aria-label="Bones">
            {model.bones.map((bone) => (
              <line
                key={bone.id}
                x1={bone.start.x}
                y1={bone.start.y}
                x2={bone.end.x}
                y2={bone.end.y}
                data-bone-id={bone.id}
              />
            ))}
          </g>
          <g className={styles.rigJoints} aria-label="Joints">
            {model.joints.map((joint) => (
              <circle
                key={joint.id}
                cx={joint.position.x}
                cy={joint.position.y}
                r="1.35"
                data-joint-id={joint.id}
              >
                <title>
                  {joint.id}: {joint.position.x} / {joint.position.y}
                </title>
              </circle>
            ))}
          </g>
          <g className={styles.rigSlotLabels} aria-label="Pflichtslots">
            {model.slotLabels.map((slot) => (
              <text
                key={slot.slotId}
                x={slot.position.x}
                y={slot.position.y}
                data-slot-id={slot.slotId}
              >
                {slot.label}
              </text>
            ))}
          </g>
        </g>
      ) : null}
    </svg>
  );
}
