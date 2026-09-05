import { useEffect, useRef, useState } from "react";
import { jsonValuesEqual } from "../../domain/json";
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
  createBrowserAnimationExportWorkerController,
  type AnimationExportWorkerController,
  type ImageDecoder
} from "../../services";
import { ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION } from "../../workers/animationExportProtocol";
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

let workerJobSequence = 0;

function nextWorkerJobId(projectId: StableId, projectRevision: number): string {
  workerJobSequence += 1;
  return `render-${projectId}-${projectRevision}-${workerJobSequence}`;
}

async function generateEightDirections(
  controller: AnimationExportWorkerController | null,
  project: AnimationProject,
  projectRevision: number,
  template: NonNullable<ReturnType<typeof getBuiltInRigTemplate>>,
  partAssets: readonly AnimationPartAsset[],
  decodedSources: Parameters<typeof generateEightDirectionWalkSet>[3],
  clipId: StableId,
  signal: AbortSignal,
  currentRevision: () => number,
  onProgress: (completed: number) => void
): Promise<EightDirectionWalkGenerationResult> {
  if (!controller) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    return generateEightDirectionWalkSet(
      project,
      template,
      partAssets,
      decodedSources,
      clipId
    );
  }
  const completed = await controller.run(
    {
      protocolVersion: ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
      type: "renderFrames",
      jobId: nextWorkerJobId(project.projectId, projectRevision),
      projectId: project.projectId,
      projectRevision,
      payload: { project, clipId, partAssets, decodedSources }
    },
    {
      signal,
      currentProjectRevision: currentRevision,
      onProgress: (message) => {
        if (message.stage === "rendering") onProgress(message.completed);
      }
    }
  );
  if (completed.result.kind !== "renderFrames") {
    throw new Error("Der Worker lieferte ein unerwartetes Renderresultat.");
  }
  const frames: DirectionalRenderedFrame[] = completed.result.frames.map(
    (entry) => Object.freeze(entry)
  );
  return Object.freeze({
    status: "ok",
    directions: Object.freeze(
      DIRECTION_IDS.map((targetDirection) =>
        Object.freeze({
          direction: targetDirection,
          frames: Object.freeze(
            frames.filter(({ direction }) => direction === targetDirection)
          )
        })
      )
    ),
    frames: Object.freeze(frames),
    diagnostics: Object.freeze(completed.result.diagnostics)
  });
}

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
  const workerControllerRef = useRef<AnimationExportWorkerController | null | undefined>(
    undefined
  );
  const currentRevisionRef = useRef(projectRevision);
  currentRevisionRef.current = projectRevision;
  const renderedFrameCacheRef = useRef<RevisionBoundRenderedFrameCache | null>(
    null
  );
  const cachedWalkMetadataRef = useRef<CachedWalkMetadata | null>(null);
  const previousProjectRef = useRef<Readonly<{
    project: AnimationProject;
    revision: number;
  }> | null>(null);
  if (!cacheRef.current) {
    cacheRef.current = new RevisionBoundDecodedSourceCache();
  }
  if (!renderedFrameCacheRef.current) {
    renderedFrameCacheRef.current = new RevisionBoundRenderedFrameCache();
  }
  if (workerControllerRef.current === undefined) {
    workerControllerRef.current = createBrowserAnimationExportWorkerController();
  }
  const [state, setState] = useState<NeutralPoseFrameState>(INITIAL_STATE);

  useEffect(
    () => () => {
      cacheRef.current?.clear();
      renderedFrameCacheRef.current?.clear();
      cachedWalkMetadataRef.current = null;
      workerControllerRef.current?.terminate();
      workerControllerRef.current = null;
    },
    []
  );

  useEffect(() => {
    const previous = previousProjectRef.current;
    const cache = renderedFrameCacheRef.current;
    let metadataRebased = false;
    if (previous && previous.project.projectId !== project.projectId) {
      cacheRef.current?.clear();
      cache?.clear();
      cachedWalkMetadataRef.current = null;
    }
    if (
      cache &&
      previous &&
      previous.project.projectId === project.projectId &&
      previous.revision !== projectRevision
    ) {
      const previousWithoutOverrides = {
        ...previous.project,
        updatedAt: "",
        overrides: []
      };
      const currentWithoutOverrides = {
        ...project,
        updatedAt: "",
        overrides: []
      };
      if (jsonValuesEqual(previousWithoutOverrides, currentWithoutOverrides)) {
        const addresses = new Map<string, Readonly<{
          clipId: StableId;
          direction: Direction;
          frameIndex: number;
        }>>();
        for (const override of [...previous.project.overrides, ...project.overrides]) {
          const key = `${override.clipId}:${override.direction}:${override.frameIndex}`;
          const before = previous.project.overrides.find(
            (candidate) =>
              candidate.clipId === override.clipId &&
              candidate.direction === override.direction &&
              candidate.frameIndex === override.frameIndex
          );
          const after = project.overrides.find(
            (candidate) =>
              candidate.clipId === override.clipId &&
              candidate.direction === override.direction &&
              candidate.frameIndex === override.frameIndex
          );
          if (!jsonValuesEqual(before ?? null, after ?? null)) {
            addresses.set(key, {
              clipId: override.clipId,
              direction: override.direction,
              frameIndex: override.frameIndex
            });
          }
        }
        cache.rebaseProjectRevision(
          project.projectId,
          previous.revision,
          projectRevision,
          [...addresses.values()]
        );
        const metadata = cachedWalkMetadataRef.current;
        if (
          metadata &&
          metadata.projectId === project.projectId &&
          metadata.projectRevision === previous.revision
        ) {
          cachedWalkMetadataRef.current = Object.freeze({
            ...metadata,
            projectRevision
          });
          metadataRebased = true;
        }
      } else {
        cache.pruneProjectRevisions(project.projectId, projectRevision);
      }
    } else {
      cache?.pruneProjectRevisions(project.projectId, projectRevision);
    }
    previousProjectRef.current = Object.freeze({ project, revision: projectRevision });
    if (
      cachedWalkMetadataRef.current &&
      (cachedWalkMetadataRef.current.projectId !== project.projectId ||
        (cachedWalkMetadataRef.current.projectRevision !== projectRevision &&
          !metadataRebased))
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
    const renderAbort = new AbortController();
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
      .then(async (decodedSources) => {
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
          directionWalkSet = cachedSet ??
            (clip
              ? await generateEightDirections(
                  workerControllerRef.current ?? null,
                  project,
                  projectRevision,
                  template,
                  partAssets,
                  decodedSources,
                  clip.clipId,
                  renderAbort.signal,
                  () => currentRevisionRef.current,
                  (completed) => {
                    if (cancelled) return;
                    setState((current) =>
                      Object.freeze({
                        ...current,
                        message: `64-Frame-Worker: ${completed} / 64`
                      })
                    );
                  }
                )
              : generateEightDirectionWalkSet(
                  project,
                  template,
                  partAssets,
                  decodedSources,
                  clipId
                ));
          if (cancelled) return;
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
      renderAbort.abort();
    };
  }, [clipId, decoder, direction, loadBlob, partAssets, project, projectRevision]);

  return state;
}
