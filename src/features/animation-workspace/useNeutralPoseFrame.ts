import { useEffect, useRef, useState } from "react";
import {
  DIRECTION_IDS,
  HUMANOID_WALK_CLIP_ID,
  HUMANOID_WALK_FRAME_COUNT,
  getBuiltInRigTemplate,
  renderFrame,
  resolveProjectDirectionCoverage,
  type Direction,
  type PartSlot,
  type RenderedFrame
} from "../../domain/animation";
import type {
  AnimationPartAsset,
  AnimationProject,
  StableId
} from "../../schemas";
import {
  RevisionBoundDecodedSourceCache,
  type ImageDecoder
} from "../../services";
import {
  prepareNeutralPoseParts,
  type NeutralPosePreparationIssue
} from "./neutralPoseRenderer";
import {
  generateSouthWalkFrames
} from "./southWalkRenderer";
import { RevisionBoundRenderedFrameCache } from "./animationPlayback";
import {
  generateEightDirectionWalkSet,
  type DirectionalRenderedFrame,
  type DirectionalWalkDiagnostic,
  type EightDirectionWalkGenerationResult
} from "./directionalWalkRenderer";

export type WorkspacePartBlobLoadResult =
  | Readonly<{ status: "ok"; blob: Blob }>
  | Readonly<{ status: "error"; message: string }>;

export interface NeutralPoseFrameState {
  readonly status: "idle" | "loading" | "ready" | "unavailable" | "failed";
  readonly frame: RenderedFrame | null;
  readonly preparationIssues: readonly NeutralPosePreparationIssue[];
  readonly walkCycle: WorkspaceWalkCycleResult | null;
  readonly directionWalkSet: EightDirectionWalkGenerationResult | null;
  readonly message: string | null;
}

export interface WorkspaceWalkDiagnostic {
  readonly code: string;
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly direction?: Direction;
  readonly frameIndex?: number;
  readonly assetId?: StableId;
  readonly slot?: PartSlot;
}

export type WorkspaceWalkCycleResult =
  | Readonly<{
      status: "ok";
      frames: readonly RenderedFrame[];
      diagnostics: readonly WorkspaceWalkDiagnostic[];
    }>
  | Readonly<{
      status: "invalid";
      frames: readonly [];
      issues: readonly WorkspaceWalkDiagnostic[];
    }>;

const INITIAL_STATE: NeutralPoseFrameState = Object.freeze({
  status: "idle",
  frame: null,
  preparationIssues: Object.freeze([]),
  walkCycle: null,
  directionWalkSet: null,
  message: null
});

type CachedWalkMetadata =
  | Readonly<{
      kind: "singleDirection";
      projectId: StableId;
      projectRevision: number;
      clipId: StableId;
      diagnostics: readonly WorkspaceWalkDiagnostic[];
    }>
  | Readonly<{
      kind: "eightDirections";
      projectId: StableId;
      projectRevision: number;
      clipId: StableId;
      diagnostics: readonly DirectionalWalkDiagnostic[];
    }>;

function hasCachedIdentity(
  metadata: CachedWalkMetadata | null,
  project: AnimationProject,
  projectRevision: number,
  clipId: StableId,
  kind: CachedWalkMetadata["kind"]
): metadata is CachedWalkMetadata {
  return Boolean(
    metadata &&
      metadata.kind === kind &&
      metadata.projectId === project.projectId &&
      metadata.projectRevision === projectRevision &&
      metadata.clipId === clipId
  );
}

function readCachedEightDirectionSet(
  cache: RevisionBoundRenderedFrameCache,
  metadata: CachedWalkMetadata | null,
  project: AnimationProject,
  projectRevision: number,
  clipId: StableId
): EightDirectionWalkGenerationResult | null {
  if (
    !hasCachedIdentity(
      metadata,
      project,
      projectRevision,
      clipId,
      "eightDirections"
    ) ||
    metadata.kind !== "eightDirections"
  ) {
    return null;
  }
  const directions = DIRECTION_IDS.map((targetDirection) => {
    const frames = Array.from(
      { length: HUMANOID_WALK_FRAME_COUNT },
      (_, frameIndex): DirectionalRenderedFrame | null => {
        const frame = cache.get({
          projectId: project.projectId,
          projectRevision,
          clipId,
          direction: targetDirection,
          frameIndex
        });
        return frame
          ? Object.freeze({
              direction: targetDirection,
              frameIndex,
              footAnchor: Object.freeze({ ...project.frameProfile.footAnchor }),
              frame
            })
          : null;
      }
    );
    return frames.every(
      (candidate): candidate is DirectionalRenderedFrame => candidate !== null
    )
      ? Object.freeze({ direction: targetDirection, frames: Object.freeze(frames) })
      : null;
  });
  if (directions.some((candidate) => candidate === null)) return null;
  const complete = directions.filter(
    (candidate): candidate is NonNullable<typeof candidate> => candidate !== null
  );
  return Object.freeze({
    status: "ok",
    directions: Object.freeze(complete),
    frames: Object.freeze(complete.flatMap(({ frames }) => frames)),
    diagnostics: metadata.diagnostics
  });
}

function selectDirectionWalkCycle(
  set: EightDirectionWalkGenerationResult,
  direction: Direction
): WorkspaceWalkCycleResult {
  if (set.status === "invalid") {
    return Object.freeze({
      status: "invalid",
      frames: Object.freeze([] as const),
      issues: set.issues
    });
  }
  const selected = set.directions.find(
    (candidate) => candidate.direction === direction
  );
  if (!selected) {
    return Object.freeze({
      status: "invalid",
      frames: Object.freeze([] as const),
      issues: Object.freeze([
        Object.freeze({
          code: "missingDirectionRig",
          severity: "error" as const,
          message: `Für ${direction} wurden keine Vorschauframes erzeugt.`,
          direction
        })
      ])
    });
  }
  return Object.freeze({
    status: "ok",
    frames: Object.freeze(selected.frames.map(({ frame }) => frame)),
    diagnostics: Object.freeze(
      set.diagnostics.filter(
        (entry) => entry.direction === undefined || entry.direction === direction
      )
    )
  });
}

export function useNeutralPoseFrame(
  project: AnimationProject,
  projectRevision: number,
  clipId: StableId | null,
  direction: Direction,
  partAssets: readonly AnimationPartAsset[],
  decoder: ImageDecoder | null,
  loadBlob: (blobId: StableId) => Promise<WorkspacePartBlobLoadResult>
): NeutralPoseFrameState {
  const cacheRef = useRef<RevisionBoundDecodedSourceCache | null>(null);
  const renderedFrameCacheRef = useRef<RevisionBoundRenderedFrameCache | null>(
    null
  );
  const cachedWalkMetadataRef = useRef<CachedWalkMetadata | null>(null);
  if (!cacheRef.current) {
    cacheRef.current = new RevisionBoundDecodedSourceCache();
  }
  if (!renderedFrameCacheRef.current) {
    renderedFrameCacheRef.current = new RevisionBoundRenderedFrameCache();
  }
  const [state, setState] = useState<NeutralPoseFrameState>(INITIAL_STATE);

  useEffect(
    () => () => {
      cacheRef.current?.clear();
      renderedFrameCacheRef.current?.clear();
      cachedWalkMetadataRef.current = null;
    },
    []
  );

  useEffect(() => {
    renderedFrameCacheRef.current?.pruneProjectRevisions(
      project.projectId,
      projectRevision
    );
    if (
      cachedWalkMetadataRef.current &&
      (cachedWalkMetadataRef.current.projectId !== project.projectId ||
        cachedWalkMetadataRef.current.projectRevision !== projectRevision)
    ) {
      cachedWalkMetadataRef.current = null;
    }
    const template = getBuiltInRigTemplate(project.rigTemplateId);
    if (!template) {
      setState(
        Object.freeze({
          status: "unavailable",
          frame: null,
          preparationIssues: Object.freeze([]),
          walkCycle: null,
          directionWalkSet: null,
          message: "Für das Projekt ist keine Built-in-Rigvorlage verfügbar."
        })
      );
      return undefined;
    }
    if (!decoder) {
      setState(
        Object.freeze({
          status: "unavailable",
          frame: null,
          preparationIssues: Object.freeze([]),
          walkCycle: null,
          directionWalkSet: null,
          message: "Der RGBA-Decoder ist in dieser Ansicht nicht verbunden."
        })
      );
      return undefined;
    }

    let cancelled = false;
    setState(
      Object.freeze({
        status: "loading",
        frame: null,
        preparationIssues: Object.freeze([]),
        walkCycle: null,
        directionWalkSet: null,
        message: null
      })
    );
    const assignedIds = new Set(project.parts.map(({ assetId }) => assetId));
    const assignedAssets = partAssets
      .filter((asset) => assignedIds.has(asset.assetId))
      .map((asset) => {
        const assignment = project.parts.find(
          ({ assetId }) => assetId === asset.assetId
        );
        return assignment?.mirrorPolicy
          ? Object.freeze({ ...asset, mirrorPolicy: assignment.mirrorPolicy })
          : asset;
      });
    const coverage = resolveProjectDirectionCoverage({
      mode: project.directionSourceMode,
      assets: assignedAssets,
      projectMirrorPolicy: project.mirrorPolicy,
      reviews: project.mirrorReviews
    });
    const targetAssetIds = new Set(
      coverage.rows.flatMap((row) =>
        row.cells.flatMap((cell) =>
          (project.directionSourceMode !== "singleDirectionPrototype" ||
            cell.targetDirection === direction) &&
          cell.sourceAsset?.anchorStatus === "ready"
            ? [cell.sourceAsset.assetId]
            : []
        )
      )
    );
    const readyAssets = assignedAssets.filter((asset) =>
      targetAssetIds.has(asset.assetId)
    );

    void Promise.all(
      readyAssets.map(async (asset) => {
        const image = await cacheRef.current?.load(
          {
            sourceId: asset.assetId,
            blobId: asset.blobId,
            revision: asset.updatedAt
          },
          async () => {
            const blobResult = await loadBlob(asset.blobId);
            if (blobResult.status !== "ok") {
              throw new Error(blobResult.message);
            }
            return decoder.decode(blobResult.blob);
          }
        );
        if (!image) {
          throw new Error("Der Decoded-Source-Cache ist nicht verfügbar.");
        }
        return Object.freeze({ assetId: asset.assetId, image });
      })
    )
      .then((decodedSources) => {
        if (cancelled) return;
        const prepared = prepareNeutralPoseParts(
          project,
          template,
          direction,
          partAssets,
          decodedSources
        );
        const frame = renderFrame(project.frameProfile.frameSize, prepared.parts);
        const clip = project.clips.find(
          (candidate) =>
            candidate.clipId === clipId &&
            candidate.templateId === HUMANOID_WALK_CLIP_ID
        );
        let walkCycle: WorkspaceWalkCycleResult | null = null;
        let directionWalkSet: EightDirectionWalkGenerationResult | null = null;
        if (project.directionSourceMode !== "singleDirectionPrototype") {
          const cachedSet =
            clip && renderedFrameCacheRef.current
              ? readCachedEightDirectionSet(
                  renderedFrameCacheRef.current,
                  cachedWalkMetadataRef.current,
                  project,
                  projectRevision,
                  clip.clipId
                )
              : null;
          directionWalkSet =
            cachedSet ??
            generateEightDirectionWalkSet(
              project,
              template,
              partAssets,
              decodedSources,
              clipId
            );
          if (clip && !cachedSet && directionWalkSet.status === "ok") {
            for (const entry of directionWalkSet.frames) {
              renderedFrameCacheRef.current?.set(
                {
                  projectId: project.projectId,
                  projectRevision,
                  clipId: clip.clipId,
                  direction: entry.direction,
                  frameIndex: entry.frameIndex
                },
                entry.frame
              );
            }
            cachedWalkMetadataRef.current = Object.freeze({
              kind: "eightDirections",
              projectId: project.projectId,
              projectRevision,
              clipId: clip.clipId,
              diagnostics: directionWalkSet.diagnostics
            });
          }
          walkCycle = selectDirectionWalkCycle(directionWalkSet, direction);
        } else if (direction === "south") {
          const cachedFrames = clip
            ? Array.from({ length: HUMANOID_WALK_FRAME_COUNT }, (_, frameIndex) =>
                renderedFrameCacheRef.current?.get({
                  projectId: project.projectId,
                  projectRevision,
                  clipId: clip.clipId,
                  direction,
                  frameIndex
                }) ?? null
              )
            : [];
          const cachedMetadata = cachedWalkMetadataRef.current;
          if (
            clip &&
            cachedFrames.length === HUMANOID_WALK_FRAME_COUNT &&
            cachedFrames.every((candidate) => candidate !== null) &&
            hasCachedIdentity(
              cachedMetadata,
              project,
              projectRevision,
              clip.clipId,
              "singleDirection"
            ) &&
            cachedMetadata.kind === "singleDirection"
          ) {
            walkCycle = Object.freeze({
              status: "ok",
              frames: Object.freeze(
                cachedFrames.filter(
                  (candidate): candidate is RenderedFrame => candidate !== null
                )
              ),
              diagnostics: cachedMetadata.diagnostics
            });
          } else {
            walkCycle = generateSouthWalkFrames(
              project,
              template,
              partAssets,
              decodedSources,
              clipId
            );
            if (clip && walkCycle.status === "ok") {
              walkCycle.frames.forEach((walkFrame, frameIndex) => {
                renderedFrameCacheRef.current?.set(
                  {
                    projectId: project.projectId,
                    projectRevision,
                    clipId: clip.clipId,
                    direction,
                    frameIndex
                  },
                  walkFrame
                );
              });
              cachedWalkMetadataRef.current = Object.freeze({
                kind: "singleDirection",
                projectId: project.projectId,
                projectRevision,
                clipId: clip.clipId,
                diagnostics: walkCycle.diagnostics
              });
            }
          }
        }
        setState(
          Object.freeze({
            status: "ready",
            frame,
            preparationIssues: prepared.issues,
            walkCycle,
            directionWalkSet,
            message: null
          })
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState(
          Object.freeze({
            status: "failed",
            frame: null,
            preparationIssues: Object.freeze([]),
            walkCycle: null,
            directionWalkSet: null,
            message:
              error instanceof Error
                ? error.message
                : "Die Partquellen konnten nicht gerendert werden."
          })
        );
      });

    return () => {
      cancelled = true;
    };
  }, [clipId, decoder, direction, loadBlob, partAssets, project, projectRevision]);

  return state;
}
