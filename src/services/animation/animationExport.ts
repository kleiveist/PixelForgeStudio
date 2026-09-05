import {
  DIRECTION_IDS,
  hasOpaqueOuterEdge,
  type Direction,
  type RgbaImage,
  type SpriteSheetLayout,
  type SpriteSheetSourceFrame
} from "../../domain/animation";
import {
  SpriteSheetMetadataSchema,
  type AnimationClip,
  type AnimationProject,
  type SpriteSheetMetadata,
  type StableId
} from "../../schemas";

export const ANIMATION_EXPORT_ISSUE_CODES = Object.freeze([
  "missingFrame",
  "duplicateFrame",
  "invalidFrameSize",
  "invalidClip",
  "invalidBlobReference",
  "productionError",
  "renderWarning",
  "opaqueOuterEdge"
] as const);

export type AnimationExportIssueCode =
  (typeof ANIMATION_EXPORT_ISSUE_CODES)[number];

export interface AnimationExportIssue {
  readonly code: AnimationExportIssueCode;
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly direction?: Direction;
  readonly frameIndex?: number;
}

export interface AnimationExportValidationResult {
  readonly hardErrors: readonly AnimationExportIssue[];
  readonly warnings: readonly AnimationExportIssue[];
  readonly canExportWithoutConfirmation: boolean;
}

export interface ValidateAnimationExportInput {
  readonly project: AnimationProject;
  readonly clip: AnimationClip | null;
  readonly frames: readonly SpriteSheetSourceFrame[];
  readonly missingBlobIds?: readonly StableId[];
  readonly productionDiagnostics?: readonly Readonly<{
    severity: "error" | "warning";
    message: string;
    direction?: Direction;
    frameIndex?: number;
  }>[];
}

function exportIssue(
  code: AnimationExportIssueCode,
  severity: AnimationExportIssue["severity"],
  message: string,
  context: Pick<AnimationExportIssue, "direction" | "frameIndex"> = {}
): AnimationExportIssue {
  return Object.freeze({ code, severity, message, ...context });
}

export function validateAnimationExport(
  input: ValidateAnimationExportInput
): AnimationExportValidationResult {
  const errors: AnimationExportIssue[] = [];
  const warnings: AnimationExportIssue[] = [];
  if (
    !input.clip ||
    input.clip.action !== "walk" ||
    input.clip.frameCount !== 8 ||
    !input.clip.loop
  ) {
    errors.push(
      exportIssue(
        "invalidClip",
        "error",
        "Der Export benötigt einen validen acht Frames langen Walk-Loop."
      )
    );
  }
  for (const blobId of input.missingBlobIds ?? []) {
    errors.push(
      exportIssue(
        "invalidBlobReference",
        "error",
        `Der referenzierte Originalblob ${blobId} fehlt.`
      )
    );
  }
  const byAddress = new Map<string, SpriteSheetSourceFrame>();
  for (const source of input.frames) {
    const address = `${source.direction}:${source.frameIndex}`;
    if (byAddress.has(address)) {
      errors.push(
        exportIssue("duplicateFrame", "error", `Frame ${address} ist doppelt.`, {
          direction: source.direction,
          frameIndex: source.frameIndex
        })
      );
      continue;
    }
    byAddress.set(address, source);
    if (
      source.frame.width !== input.project.frameProfile.frameSize.width ||
      source.frame.height !== input.project.frameProfile.frameSize.height ||
      source.frame.pixels.length !== source.frame.width * source.frame.height * 4
    ) {
      errors.push(
        exportIssue(
          "invalidFrameSize",
          "error",
          `Frame ${address} entspricht nicht dem Projekt-Frameprofil.`,
          { direction: source.direction, frameIndex: source.frameIndex }
        )
      );
    } else if (hasOpaqueOuterEdge(source.frame)) {
      warnings.push(
        exportIssue(
          "opaqueOuterEdge",
          "warning",
          `Frame ${address} berührt den Außenrand mit opaken Pixeln.`,
          { direction: source.direction, frameIndex: source.frameIndex }
        )
      );
    }
  }
  for (const direction of DIRECTION_IDS) {
    for (let frameIndex = 0; frameIndex < 8; frameIndex += 1) {
      if (!byAddress.has(`${direction}:${frameIndex}`)) {
        errors.push(
          exportIssue(
            "missingFrame",
            "error",
            `Frame ${direction}:${frameIndex} fehlt.`,
            { direction, frameIndex }
          )
        );
      }
    }
  }
  for (const diagnostic of input.productionDiagnostics ?? []) {
    const target = diagnostic.severity === "error" ? errors : warnings;
    target.push(
      exportIssue(
        diagnostic.severity === "error" ? "productionError" : "renderWarning",
        diagnostic.severity,
        diagnostic.message,
        {
          ...(diagnostic.direction ? { direction: diagnostic.direction } : {}),
          ...(diagnostic.frameIndex !== undefined
            ? { frameIndex: diagnostic.frameIndex }
            : {})
        }
      )
    );
  }

  return Object.freeze({
    hardErrors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
    canExportWithoutConfirmation: errors.length === 0 && warnings.length === 0
  });
}

export function canRunAnimationExport(
  validation: AnimationExportValidationResult,
  warningsConfirmed: boolean
): boolean {
  return (
    validation.hardErrors.length === 0 &&
    (validation.warnings.length === 0 || warningsConfirmed)
  );
}

export function createSpriteSheetMetadata(input: Readonly<{
  project: AnimationProject;
  clip: AnimationClip;
  layout: SpriteSheetLayout;
}>): SpriteSheetMetadata {
  const { project, clip, layout } = input;
  return SpriteSheetMetadataSchema.parse({
    application: "PixelForge Animation Studio",
    formatVersion: 1,
    kind: "spriteSheetMetadata",
    projectId: project.projectId,
    projectName: project.name,
    clipId: clip.clipId,
    action: clip.action,
    fps: clip.fps,
    loop: clip.loop,
    frameWidth: layout.frameSize.width,
    frameHeight: layout.frameSize.height,
    sheetWidth: layout.sheetWidth,
    sheetHeight: layout.sheetHeight,
    columns: layout.columns,
    rows: layout.rows,
    margin: layout.margin,
    spacing: layout.spacing,
    footAnchor: project.frameProfile.footAnchor,
    directions: layout.directions,
    animations: layout.directions.map((direction) => ({
      name: `walk_${direction}`,
      direction,
      frames: layout.cells
        .filter((cell) => cell.direction === direction)
        .map((cell) => ({
          index: cell.frameIndex,
          x: cell.x,
          y: cell.y,
          width: cell.width,
          height: cell.height
        }))
    }))
  });
}

export function asSpriteSheetSourceFrames(
  frames: readonly Readonly<{
    direction: Direction;
    frameIndex: number;
    frame: RgbaImage;
  }>[]
): readonly SpriteSheetSourceFrame[] {
  return Object.freeze(
    frames.map(({ direction, frameIndex, frame }) =>
      Object.freeze({ direction, frameIndex, frame })
    )
  );
}
