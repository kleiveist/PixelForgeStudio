import {
  DIRECTION_IDS,
  HUMANOID_WALK_CLIP_ID,
  HUMANOID_WALK_FRAME_COUNT,
  REQUIRED_PART_SLOT_IDS,
  applyPoseToDirectionRig,
  findAlphaBounds,
  findFrameOverride,
  renderFrame,
  resolveDirectionRig,
  resolveDirectionalWalkPose,
  resolveEffectiveFramePose,
  resolveProjectDirectionCoverage,
  validatePose,
  type Direction,
  type DirectionSourceResolution,
  type PartSlot,
  type RenderedFrame,
  type RigTemplate
} from "../../domain/animation";
import type {
  AnimationPartAsset,
  AnimationProject,
  StableId
} from "../../schemas";
import {
  prepareDirectionRigParts,
  type DecodedPartSource,
  type PartRuntimeProjection
} from "./neutralPoseRenderer";

export const DIRECTIONAL_WALK_DIAGNOSTIC_CODES = Object.freeze([
  "missingClip",
  "invalidClip",
  "frameProfileMismatch",
  "missingDirectionRig",
  "missingPart",
  "duplicatePart",
  "anchorsIncomplete",
  "coverageBlocked",
  "missingDecodedSource",
  "poseError",
  "preparationError",
  "renderError",
  "frameSizeMismatch",
  "footAnchorMismatch",
  "heightVariance",
  "emptySilhouette",
  "clipping"
] as const);

export type DirectionalWalkDiagnosticCode =
  (typeof DIRECTIONAL_WALK_DIAGNOSTIC_CODES)[number];

export interface DirectionalWalkDiagnostic {
  readonly code: DirectionalWalkDiagnosticCode;
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly direction?: Direction;
  readonly frameIndex?: number;
  readonly assetId?: StableId;
  readonly slot?: PartSlot;
}

export interface DirectionalRenderedFrame {
  readonly direction: Direction;
  readonly frameIndex: number;
  readonly footAnchor: Readonly<{ x: number; y: number }>;
  readonly frame: RenderedFrame;
}

export type DirectionalFrameGenerationResult =
  | Readonly<{
      status: "ok";
      direction: Direction;
      frames: readonly DirectionalRenderedFrame[];
      diagnostics: readonly DirectionalWalkDiagnostic[];
    }>
  | Readonly<{
      status: "invalid";
      direction: Direction;
      frames: readonly [];
      issues: readonly DirectionalWalkDiagnostic[];
    }>;

export type EightDirectionWalkGenerationResult =
  | Readonly<{
      status: "ok";
      directions: readonly Readonly<{
        direction: Direction;
        frames: readonly DirectionalRenderedFrame[];
      }>[];
      frames: readonly DirectionalRenderedFrame[];
      diagnostics: readonly DirectionalWalkDiagnostic[];
    }>
  | Readonly<{
      status: "invalid";
      directions: readonly [];
      frames: readonly [];
      issues: readonly DirectionalWalkDiagnostic[];
    }>;

function diagnostic(
  code: DirectionalWalkDiagnosticCode,
  severity: DirectionalWalkDiagnostic["severity"],
  message: string,
  context: Omit<DirectionalWalkDiagnostic, "code" | "severity" | "message"> = {}
): DirectionalWalkDiagnostic {
  return Object.freeze({ code, severity, message, ...context });
}

function assignedAssetsWithPolicy(
  project: AnimationProject,
  partAssets: readonly AnimationPartAsset[]
): readonly AnimationPartAsset[] {
  const assignmentById = new Map(
    project.parts.map((assignment) => [assignment.assetId, assignment])
  );
  return Object.freeze(
    partAssets
      .filter((asset) => assignmentById.has(asset.assetId))
      .map((asset) => {
        const policy = assignmentById.get(asset.assetId)?.mirrorPolicy;
        return policy
          ? Object.freeze({ ...asset, mirrorPolicy: policy })
          : asset;
      })
  );
}

function activeClip(project: AnimationProject, clipId: StableId | null) {
  return clipId
    ? project.clips.find((candidate) => candidate.clipId === clipId)
    : project.clips.find(
        (candidate) => candidate.templateId === HUMANOID_WALK_CLIP_ID
      );
}

function sourceProjections(
  cells: readonly DirectionSourceResolution[]
): ReadonlyMap<string, PartRuntimeProjection> {
  return new Map(
    cells.flatMap((cell) =>
      cell.sourceAsset &&
      (cell.status === "authoredSource" || cell.status === "mirroredValid")
        ? [[cell.sourceAsset.assetId, Object.freeze({ mirrored: cell.mirrored })] as const]
        : []
    )
  );
}

function validateDirectionGeneration(
  project: AnimationProject,
  template: RigTemplate,
  direction: Direction,
  partAssets: readonly AnimationPartAsset[],
  decodedSources: readonly DecodedPartSource[],
  clipId: StableId | null
): Readonly<{
  issues: readonly DirectionalWalkDiagnostic[];
  cells: readonly DirectionSourceResolution[];
}> {
  const issues: DirectionalWalkDiagnostic[] = [];
  if (
    template.frameProfile.frameSize.width !==
      project.frameProfile.frameSize.width ||
    template.frameProfile.frameSize.height !==
      project.frameProfile.frameSize.height ||
    template.frameProfile.footAnchor.x !== project.frameProfile.footAnchor.x ||
    template.frameProfile.footAnchor.y !== project.frameProfile.footAnchor.y ||
    template.frameProfile.characterHeight !==
      project.frameProfile.characterHeight
  ) {
    issues.push(
      diagnostic(
        "frameProfileMismatch",
        "error",
        "Projekt- und Rig-Frameprofil sind nicht kompatibel.",
        { direction }
      )
    );
  }
  const clip = activeClip(project, clipId);
  if (!clip) {
    issues.push(
      diagnostic("missingClip", "error", `Clip ${HUMANOID_WALK_CLIP_ID} fehlt.`, {
        direction
      })
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
        `${HUMANOID_WALK_CLIP_ID} benötigt Walk, acht Frames und Loop.`,
        { direction }
      )
    );
  }

  const rig = resolveDirectionRig(template, direction);
  if (!rig) {
    issues.push(
      diagnostic(
        "missingDirectionRig",
        "error",
        `Zielgeometrie für ${direction} fehlt.`,
        { direction }
      )
    );
  } else {
    const validation = validatePose(rig);
    if (!validation.valid) {
      issues.push(
        ...validation.issues.map((poseIssue) =>
          diagnostic("poseError", "error", poseIssue.message, { direction })
        )
      );
    }
    if (
      rig.joints.root.position.x !== project.frameProfile.footAnchor.x ||
      rig.joints.root.position.y !== project.frameProfile.footAnchor.y
    ) {
      issues.push(
        diagnostic(
          "footAnchorMismatch",
          "error",
          `Rigwurzel für ${direction} stimmt nicht mit dem FootAnchor überein.`,
          { direction }
        )
      );
    }
  }

  const assigned = assignedAssetsWithPolicy(project, partAssets);
  const coverage = resolveProjectDirectionCoverage({
    mode: project.directionSourceMode,
    assets: assigned,
    projectMirrorPolicy: project.mirrorPolicy,
    reviews: project.mirrorReviews
  });
  const cells = coverage.rows.map((row) =>
    row.cells.find((cell) => cell.targetDirection === direction)!
  );
  const requiredSlots = new Set(REQUIRED_PART_SLOT_IDS);
  for (const cell of cells) {
    if (!cell.blocksProduction) continue;
    if (!requiredSlots.has(cell.slot as (typeof REQUIRED_PART_SLOT_IDS)[number])) {
      const slotIsUsed = assigned.some((asset) => asset.slot === cell.slot);
      if (!slotIsUsed) continue;
    }
    const code =
      cell.status === "anchorsIncomplete"
        ? "anchorsIncomplete"
        : cell.status === "missingSource"
          ? "missingPart"
          : "coverageBlocked";
    issues.push(
      diagnostic(code, "error", `${cell.slot}: ${cell.message}`, {
        direction,
        slot: cell.slot,
        ...(cell.sourceAsset
          ? { assetId: cell.sourceAsset.assetId as StableId }
          : {})
      })
    );
  }

  const targetSources = cells.flatMap((cell) =>
    cell.sourceAsset && !cell.blocksProduction ? [cell.sourceAsset] : []
  );
  const bySlotAndDirection = new Map<string, AnimationPartAsset[]>();
  for (const asset of assigned) {
    const key = `${asset.slot}:${asset.direction}`;
    const matches = bySlotAndDirection.get(key) ?? [];
    matches.push(asset);
    bySlotAndDirection.set(key, matches);
  }
  for (const matches of bySlotAndDirection.values()) {
    if (matches.length <= 1) continue;
    issues.push(
      diagnostic(
        "duplicatePart",
        "error",
        `Slot ${matches[0]!.slot} ist in ${matches[0]!.direction} mehrfach belegt.`,
        { direction }
      )
    );
  }

  const decodedIds = new Set(decodedSources.map(({ assetId }) => assetId));
  for (const source of targetSources) {
    if (!decodedIds.has(source.assetId as StableId)) {
      issues.push(
        diagnostic(
          "missingDecodedSource",
          "error",
          `Dekodierte Blobquelle für ${source.assetId} fehlt.`,
          { direction, assetId: source.assetId as StableId }
        )
      );
    }
  }
  return Object.freeze({ issues: Object.freeze(issues), cells: Object.freeze(cells) });
}

/** Pure single-direction generation from validated metadata and decoded RGBA sources. */
export function generateDirectionalFrames(
  project: AnimationProject,
  template: RigTemplate,
  direction: Direction,
  partAssets: readonly AnimationPartAsset[],
  decodedSources: readonly DecodedPartSource[],
  clipId: StableId | null = null
): DirectionalFrameGenerationResult {
  const preflight = validateDirectionGeneration(
    project,
    template,
    direction,
    partAssets,
    decodedSources,
    clipId
  );
  if (preflight.issues.some((issue) => issue.severity === "error")) {
    return Object.freeze({
      status: "invalid",
      direction,
      frames: Object.freeze([] as const),
      issues: preflight.issues
    });
  }
  const rig = resolveDirectionRig(template, direction)!;
  const targetClipId = activeClip(project, clipId)!.clipId;
  const projections = sourceProjections(preflight.cells);
  const frames: DirectionalRenderedFrame[] = [];
  const diagnostics: DirectionalWalkDiagnostic[] = [];
  for (let frameIndex = 0; frameIndex < HUMANOID_WALK_FRAME_COUNT; frameIndex += 1) {
    const pose = resolveDirectionalWalkPose(rig, frameIndex);
    const applied = applyPoseToDirectionRig(rig, pose);
    if (applied.status === "invalid") {
      diagnostics.push(
        ...applied.issues.map((poseIssue) =>
          diagnostic("poseError", "error", poseIssue.message, {
            direction,
            frameIndex
          })
        )
      );
      continue;
    }
    const override = findFrameOverride(project.overrides, {
      clipId: targetClipId,
      direction,
      frameIndex
    });
    const effective = resolveEffectiveFramePose(applied.rig, override);
    const prepared = prepareDirectionRigParts(
      project,
      template,
      effective.rig,
      partAssets,
      decodedSources,
      projections,
      {
        partDeltas: effective.partDeltas,
        layerOrderOverride: effective.layerOrderOverride
      }
    );
    diagnostics.push(
      ...prepared.issues.map((preparationIssue) =>
        diagnostic(
          "preparationError",
          preparationIssue.severity,
          preparationIssue.message,
          {
            direction,
            frameIndex,
            ...(preparationIssue.assetId
              ? { assetId: preparationIssue.assetId }
              : {})
          }
        )
      )
    );
    const frame = renderFrame(project.frameProfile.frameSize, prepared.parts);
    for (const renderIssue of frame.diagnostics) {
      const clipping =
        renderIssue.code === "partiallyClipped" ||
        renderIssue.code === "fullyOutside";
      diagnostics.push(
        diagnostic(
          clipping ? "clipping" : "renderError",
          renderIssue.severity,
          renderIssue.message,
          { direction, frameIndex }
        )
      );
    }
    frames.push(
      Object.freeze({
        direction,
        frameIndex,
        footAnchor: Object.freeze({ ...project.frameProfile.footAnchor }),
        frame
      })
    );
  }
  if (
    frames.length !== HUMANOID_WALK_FRAME_COUNT ||
    diagnostics.some((entry) => entry.severity === "error")
  ) {
    return Object.freeze({
      status: "invalid",
      direction,
      frames: Object.freeze([] as const),
      issues: Object.freeze(diagnostics)
    });
  }
  return Object.freeze({
    status: "ok",
    direction,
    frames: Object.freeze(frames),
    diagnostics: Object.freeze(diagnostics)
  });
}

export function validateEightDirectionWalkConsistency(
  project: AnimationProject,
  frames: readonly DirectionalRenderedFrame[]
): readonly DirectionalWalkDiagnostic[] {
  const diagnostics: DirectionalWalkDiagnostic[] = [];
  for (const entry of frames) {
    if (
      entry.frame.width !== project.frameProfile.frameSize.width ||
      entry.frame.height !== project.frameProfile.frameSize.height
    ) {
      diagnostics.push(
        diagnostic("frameSizeMismatch", "error", "Framegröße weicht vom Projektprofil ab.", {
          direction: entry.direction,
          frameIndex: entry.frameIndex
        })
      );
    }
    if (
      entry.footAnchor.x !== project.frameProfile.footAnchor.x ||
      entry.footAnchor.y !== project.frameProfile.footAnchor.y
    ) {
      diagnostics.push(
        diagnostic("footAnchorMismatch", "error", "FootAnchor ist nicht richtungskonstant.", {
          direction: entry.direction,
          frameIndex: entry.frameIndex
        })
      );
    }
  }

  for (let frameIndex = 0; frameIndex < HUMANOID_WALK_FRAME_COUNT; frameIndex += 1) {
    const samePhase = frames.filter((entry) => entry.frameIndex === frameIndex);
    const reliable = samePhase.every(
      (entry) => !entry.frame.diagnostics.some(
        (renderIssue) =>
          renderIssue.code === "partiallyClipped" ||
          renderIssue.code === "fullyOutside"
      )
    );
    const heights = samePhase.flatMap((entry) => {
      const bounds = findAlphaBounds(
        {
          width: entry.frame.width,
          height: entry.frame.height,
          pixels: entry.frame.pixels
        },
        1
      );
      if (!bounds) {
        diagnostics.push(
          diagnostic("emptySilhouette", "error", "Frame besitzt keine sichtbare Silhouette.", {
            direction: entry.direction,
            frameIndex
          })
        );
        return [];
      }
      return [bounds.height];
    });
    if (reliable && heights.length === DIRECTION_IDS.length) {
      const referenceHeight = heights[0]!;
      const maximumDeviation = Math.max(
        ...heights.map((height) => Math.abs(height - referenceHeight))
      );
      if (maximumDeviation > 1) {
        diagnostics.push(
          diagnostic(
            "heightVariance",
            "warning",
            `Silhouettenhöhe weicht in Frame ${frameIndex + 1} bis zu ${maximumDeviation} px von Süd ab; Ziel ist maximal ±1 px.`,
            { frameIndex }
          )
        );
      }
    }
  }
  return Object.freeze(diagnostics);
}

/** Generates the canonical 8 × 8 set and never returns a partial success. */
export function generateEightDirectionWalkSet(
  project: AnimationProject,
  template: RigTemplate,
  partAssets: readonly AnimationPartAsset[],
  decodedSources: readonly DecodedPartSource[],
  clipId: StableId | null = null
): EightDirectionWalkGenerationResult {
  const generated = DIRECTION_IDS.map((direction) =>
    generateDirectionalFrames(
      project,
      template,
      direction,
      partAssets,
      decodedSources,
      clipId
    )
  );
  return finalizeEightDirectionWalkGeneration(project, generated);
}

/** Joins independently generated directions without accepting partial output. */
export function finalizeEightDirectionWalkGeneration(
  project: AnimationProject,
  generated: readonly DirectionalFrameGenerationResult[]
): EightDirectionWalkGenerationResult {
  const failures = generated.flatMap((result) =>
    result.status === "invalid" ? result.issues : []
  );
  if (failures.length > 0) {
    return Object.freeze({
      status: "invalid",
      directions: Object.freeze([] as const),
      frames: Object.freeze([] as const),
      issues: Object.freeze(failures)
    });
  }
  const successes = generated.filter(
    (result): result is Extract<DirectionalFrameGenerationResult, { status: "ok" }> =>
      result.status === "ok"
  );
  const frames = Object.freeze(successes.flatMap((result) => result.frames));
  const postflight = validateEightDirectionWalkConsistency(project, frames);
  if (postflight.some((entry) => entry.severity === "error")) {
    return Object.freeze({
      status: "invalid",
      directions: Object.freeze([] as const),
      frames: Object.freeze([] as const),
      issues: postflight
    });
  }
  return Object.freeze({
    status: "ok",
    directions: Object.freeze(
      successes.map((result) =>
        Object.freeze({ direction: result.direction, frames: result.frames })
      )
    ),
    frames,
    diagnostics: Object.freeze([
      ...successes.flatMap((result) => result.diagnostics),
      ...postflight
    ])
  });
}
