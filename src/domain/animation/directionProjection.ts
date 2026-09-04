import type { SourceAnchors, Point, Rect, TransformDelta } from "./animation.types";
import type { Direction } from "./directions";
import type { RgbaImage } from "./rgba";
import type {
  DirectionRig,
  JointDefinition,
  RigNearSide,
  RigTemplate
} from "./rigTemplate";
import { JOINT_IDS } from "./rigTopology";

export const MIRRORED_DIRECTION_SOURCE = Object.freeze({
  southWest: "southEast",
  west: "east",
  northWest: "northEast"
} as const satisfies Readonly<
  Partial<Record<Direction, Direction>>
>);

export type MirroredTargetDirection = keyof typeof MIRRORED_DIRECTION_SOURCE;

export function getMirroredSourceDirection(
  targetDirection: Direction
): Direction | null {
  return MIRRORED_DIRECTION_SOURCE[
    targetDirection as MirroredTargetDirection
  ] ?? null;
}

/** Mirrors an integer source-pixel coordinate around the source-image axis. */
export function mirrorSourceX(sourceWidth: number, x: number): number {
  return sourceWidth - 1 - x;
}

export function mirrorSourcePoint(sourceWidth: number, point: Point): Point {
  return Object.freeze({ x: mirrorSourceX(sourceWidth, point.x), y: point.y });
}

export function mirrorSourceRect(sourceWidth: number, rect: Rect): Rect {
  return Object.freeze({
    x: sourceWidth - rect.x - rect.width,
    y: rect.y,
    width: rect.width,
    height: rect.height
  });
}

export function mirrorSourceAnchors(
  sourceWidth: number,
  anchors: SourceAnchors
): SourceAnchors {
  return Object.freeze({
    proximal: mirrorSourcePoint(sourceWidth, anchors.proximal),
    ...(anchors.distal
      ? { distal: mirrorSourcePoint(sourceWidth, anchors.distal) }
      : {}),
    ...(anchors.pivot
      ? { pivot: mirrorSourcePoint(sourceWidth, anchors.pivot) }
      : {})
  });
}

/** Mirrors a frame-space joint around the vertical root/foot-anchor axis. */
export function mirrorFramePoint(footAnchorX: number, point: Point): Point {
  return Object.freeze({ x: 2 * footAnchorX - point.x, y: point.y });
}

export function mirrorTransformDelta(delta: TransformDelta): TransformDelta {
  return Object.freeze({
    offsetX: -delta.offsetX,
    offsetY: delta.offsetY,
    rotationDelta: -delta.rotationDelta,
    scaleMultiplier: delta.scaleMultiplier
  });
}

function mirrorNearSide(nearSide: RigNearSide): RigNearSide {
  if (nearSide === "left") return "right";
  if (nearSide === "right") return "left";
  return "balanced";
}

export function mirrorDirectionRig(
  source: DirectionRig,
  targetDirection: MirroredTargetDirection,
  footAnchorX: number
): DirectionRig {
  const expectedSource = MIRRORED_DIRECTION_SOURCE[targetDirection];
  if (source.direction !== expectedSource) {
    throw new Error(
      `Direction ${targetDirection} must be mirrored from ${expectedSource}, not ${source.direction}.`
    );
  }
  const joints = Object.freeze(
    Object.fromEntries(
      JOINT_IDS.map((jointId) => {
        const joint = source.joints[jointId];
        const mirrored: JointDefinition = Object.freeze({
          id: joint.id,
          position: mirrorFramePoint(footAnchorX, joint.position)
        });
        return [jointId, mirrored];
      })
    ) as DirectionRig["joints"]
  );
  return Object.freeze({
    direction: targetDirection,
    joints,
    motionProfile: Object.freeze({
      ...source.motionProfile,
      nearSide: mirrorNearSide(source.motionProfile.nearSide),
      stepAxis: Object.freeze({
        x: -source.motionProfile.stepAxis.x,
        y: source.motionProfile.stepAxis.y
      }),
      rootSwayAxis: Object.freeze({
        x: -source.motionProfile.rootSwayAxis.x,
        y: source.motionProfile.rootSwayAxis.y
      }),
      bendSign: Object.freeze({
        left: source.motionProfile.bendSign.left === 1 ? -1 : 1,
        right: source.motionProfile.bendSign.right === 1 ? -1 : 1
      })
    })
  });
}

export interface RuntimeDirectionRigResolution {
  readonly rig: DirectionRig;
  readonly sourceDirection: Direction;
  readonly mirrored: boolean;
}

/** Resolves authored rig geometry or one of the three contractual runtime projections. */
export function resolveRuntimeDirectionRig(
  template: RigTemplate,
  targetDirection: Direction
): RuntimeDirectionRigResolution | null {
  const authored = template.directions.find(
    (candidate) => candidate.direction === targetDirection
  );
  if (authored) {
    return Object.freeze({
      rig: authored,
      sourceDirection: targetDirection,
      mirrored: false
    });
  }
  const sourceDirection = getMirroredSourceDirection(targetDirection);
  if (!sourceDirection) return null;
  const source = template.directions.find(
    (candidate) => candidate.direction === sourceDirection
  );
  if (!source) return null;
  return Object.freeze({
    rig: mirrorDirectionRig(
      source,
      targetDirection as MirroredTargetDirection,
      template.frameProfile.footAnchor.x
    ),
    sourceDirection,
    mirrored: true
  });
}

/** Public target-geometry resolver used by directional clip generation. */
export function resolveDirectionRig(
  template: RigTemplate,
  targetDirection: Direction
): DirectionRig | null {
  return resolveRuntimeDirectionRig(template, targetDirection)?.rig ?? null;
}

/** Runtime-only RGBA projection. The input bytes and persisted blob stay untouched. */
export function mirrorRgbaImage(source: RgbaImage): RgbaImage {
  const pixels = new Uint8ClampedArray(source.pixels.length);
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceOffset = (y * source.width + x) * 4;
      const targetX = mirrorSourceX(source.width, x);
      const targetOffset = (y * source.width + targetX) * 4;
      pixels[targetOffset] = source.pixels[sourceOffset] ?? 0;
      pixels[targetOffset + 1] = source.pixels[sourceOffset + 1] ?? 0;
      pixels[targetOffset + 2] = source.pixels[sourceOffset + 2] ?? 0;
      pixels[targetOffset + 3] = source.pixels[sourceOffset + 3] ?? 0;
    }
  }
  return Object.freeze({ width: source.width, height: source.height, pixels });
}
