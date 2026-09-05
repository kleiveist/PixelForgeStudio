import {
  HUMANOID_WALK_CLIP_ID,
  HUMANOID_WALK_FRAME_COUNT,
  REQUIRED_PART_SLOT_IDS,
  applyPoseToDirectionRig,
  findFrameOverride,
  renderFrame,
  resolveHumanoidWalkPose,
  resolveEffectiveFramePose,
  validatePose,
  type RequiredPartSlot,
  type RenderedFrame,
  type RigTemplate,
  type WalkPoseIssue
} from "../../domain/animation";
import type {
  AnimationPartAsset,
  AnimationProject,
  StableId
} from "../../schemas";
import {
  prepareDirectionRigParts,
  type DecodedPartSource,
  type NeutralPosePreparationIssue
} from "./neutralPoseRenderer";

export const SOUTH_WALK_GENERATION_DIAGNOSTIC_CODES = Object.freeze([
  "missingClip",
  "invalidClip",
  "missingPart",
  "duplicatePart",
  "anchorsPending",
  "invalidAnchors",
  "missingDecodedSource",
  "invalidBoneLength",
  "poseError",
  "preparationError",
  "renderError"
] as const);

export type SouthWalkGenerationDiagnosticCode =
  (typeof SOUTH_WALK_GENERATION_DIAGNOSTIC_CODES)[number];

export interface SouthWalkGenerationDiagnostic {
  readonly code: SouthWalkGenerationDiagnosticCode;
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly frameIndex?: number;
  readonly assetId?: StableId;
  readonly slot?: RequiredPartSlot;
}

export type SouthWalkGenerationResult =
  | Readonly<{
      status: "ok";
      frames: readonly RenderedFrame[];
      diagnostics: readonly SouthWalkGenerationDiagnostic[];
    }>
  | Readonly<{
      status: "invalid";
      frames: readonly [];
      issues: readonly SouthWalkGenerationDiagnostic[];
    }>;

function diagnostic(
  code: SouthWalkGenerationDiagnosticCode,
  severity: SouthWalkGenerationDiagnostic["severity"],
  message: string,
  context: Readonly<{
    frameIndex?: number;
    assetId?: StableId;
    slot?: RequiredPartSlot;
  }> = {}
): SouthWalkGenerationDiagnostic {
  return Object.freeze({ code, severity, message, ...context });
}

function poseDiagnostic(
  issue: WalkPoseIssue,
  frameIndex?: number
): SouthWalkGenerationDiagnostic {
  return diagnostic(
    issue.code === "invalidBoneLength" ? "invalidBoneLength" : "poseError",
    "error",
    issue.message,
    frameIndex === undefined ? {} : { frameIndex }
  );
}

function preparationDiagnostic(
  issue: NeutralPosePreparationIssue,
  frameIndex: number
): SouthWalkGenerationDiagnostic {
  return diagnostic(
    issue.code === "missingDecodedSource"
      ? "missingDecodedSource"
      : "preparationError",
    issue.severity,
    issue.message,
    {
      frameIndex,
      ...(issue.assetId ? { assetId: issue.assetId } : {})
    }
  );
}

/**
 * Generates transient South frames. The project keeps only clip metadata,
 * sources and overrides; rendered bytes never become persisted truth.
 */
export function generateSouthWalkFrames(
  project: AnimationProject,
  template: RigTemplate,
  partAssets: readonly AnimationPartAsset[],
  decodedSources: readonly DecodedPartSource[],
  targetClipId: StableId | null = null
): SouthWalkGenerationResult {
  const issues: SouthWalkGenerationDiagnostic[] = [];
  const clip = targetClipId
    ? project.clips.find((candidate) => candidate.clipId === targetClipId)
    : project.clips.find(
        (candidate) => candidate.templateId === HUMANOID_WALK_CLIP_ID
      );
  if (!clip) {
    issues.push(
      diagnostic(
        "missingClip",
        "error",
        `Dem Projekt fehlt der Clip ${HUMANOID_WALK_CLIP_ID}.`
      )
    );
  } else if (
    clip.templateId !== HUMANOID_WALK_CLIP_ID ||
    clip.action !== "walk" ||
    clip.frameCount !== HUMANOID_WALK_FRAME_COUNT ||
    !clip.loop
  ) {
    issues.push(
      diagnostic(
        "invalidClip",
        "error",
        `${HUMANOID_WALK_CLIP_ID} benötigt die Aktion Walk, acht Frames und aktivierten Loop.`
      )
    );
  }

  const southRig = template.directions.find(
    (directionRig) => directionRig.direction === "south"
  );
  if (!southRig) {
    issues.push(
      diagnostic("poseError", "error", "Das Rig besitzt keine authored South-Pose.")
    );
  } else {
    const poseValidation = validatePose(southRig);
    if (!poseValidation.valid) {
      issues.push(...poseValidation.issues.map((issue) => poseDiagnostic(issue)));
    }
  }

  const assignedIds = new Set(project.parts.map(({ assetId }) => assetId));
  const assignedSouthAssets = partAssets.filter(
    (asset) => assignedIds.has(asset.assetId) && asset.direction === "south"
  );
  const decodedIds = new Set(decodedSources.map(({ assetId }) => assetId));
  for (const slot of REQUIRED_PART_SLOT_IDS) {
    const matches = assignedSouthAssets.filter((asset) => asset.slot === slot);
    if (matches.length === 0) {
      issues.push(
        diagnostic(
          "missingPart",
          "error",
          `Pflichtpart ${slot} für South fehlt.`,
          { slot }
        )
      );
      continue;
    }
    if (matches.length > 1) {
      issues.push(
        diagnostic(
          "duplicatePart",
          "error",
          `Pflichtpart ${slot} ist für South mehrfach belegt.`,
          { slot }
        )
      );
      continue;
    }
    const asset = matches[0]!;
    if (asset.anchorStatus === "anchorsPending") {
      issues.push(
        diagnostic(
          "anchorsPending",
          "error",
          `Die Anker für ${asset.label} stehen noch aus.`,
          { assetId: asset.assetId, slot }
        )
      );
      continue;
    }
    if (asset.anchorStatus !== "ready" || !asset.anchors) {
      issues.push(
        diagnostic(
          "invalidAnchors",
          "error",
          `Die Anker für ${asset.label} sind ungültig.`,
          { assetId: asset.assetId, slot }
        )
      );
      continue;
    }
    if (!decodedIds.has(asset.assetId)) {
      issues.push(
        diagnostic(
          "missingDecodedSource",
          "error",
          `Die dekodierte RGBA-Quelle für ${asset.label} fehlt.`,
          { assetId: asset.assetId, slot }
        )
      );
    }
  }

  if (issues.some((issue) => issue.severity === "error") || !southRig) {
    return Object.freeze({
      status: "invalid",
      frames: Object.freeze([] as const),
      issues: Object.freeze(issues)
    });
  }

  const frames: RenderedFrame[] = [];
  const diagnostics: SouthWalkGenerationDiagnostic[] = [];
  for (let frameIndex = 0; frameIndex < HUMANOID_WALK_FRAME_COUNT; frameIndex += 1) {
    const pose = resolveHumanoidWalkPose(frameIndex);
    const applied = applyPoseToDirectionRig(southRig, pose);
    if (applied.status === "invalid") {
      issues.push(
        ...applied.issues.map((issue) => poseDiagnostic(issue, frameIndex))
      );
      continue;
    }
    const override = findFrameOverride(project.overrides, {
      clipId: clip!.clipId,
      direction: "south",
      frameIndex
    });
    const effective = resolveEffectiveFramePose(applied.rig, override);
    const prepared = prepareDirectionRigParts(
      project,
      template,
      effective.rig,
      partAssets,
      decodedSources,
      undefined,
      {
        partDeltas: effective.partDeltas,
        layerOrderOverride: effective.layerOrderOverride
      }
    );
    diagnostics.push(
      ...prepared.issues.map((issue) =>
        preparationDiagnostic(issue, frameIndex)
      )
    );
    const frame = renderFrame(project.frameProfile.frameSize, prepared.parts);
    for (const renderIssue of frame.diagnostics) {
      diagnostics.push(
        diagnostic(
          "renderError",
          renderIssue.severity,
          renderIssue.message,
          { frameIndex }
        )
      );
    }
    frames.push(frame);
  }
  const allDiagnostics = [...issues, ...diagnostics];
  if (
    frames.length !== HUMANOID_WALK_FRAME_COUNT ||
    allDiagnostics.some((issue) => issue.severity === "error")
  ) {
    return Object.freeze({
      status: "invalid",
      frames: Object.freeze([] as const),
      issues: Object.freeze(allDiagnostics)
    });
  }
  return Object.freeze({
    status: "ok",
    frames: Object.freeze(frames),
    diagnostics: Object.freeze(diagnostics)
  });
}
