import { useEffect, useRef, useState } from "react";
import {
  HUMANOID_WALK_CLIP_ID,
  HUMANOID_WALK_FRAME_COUNT,
  getBuiltInRigTemplate,
  renderFrame,
  type Direction,
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
  generateSouthWalkFrames,
  type SouthWalkGenerationDiagnostic,
  type SouthWalkGenerationResult
} from "./southWalkRenderer";
import { RevisionBoundRenderedFrameCache } from "./animationPlayback";

export type WorkspacePartBlobLoadResult =
  | Readonly<{ status: "ok"; blob: Blob }>
  | Readonly<{ status: "error"; message: string }>;

export interface NeutralPoseFrameState {
  readonly status: "idle" | "loading" | "ready" | "unavailable" | "failed";
  readonly frame: RenderedFrame | null;
  readonly preparationIssues: readonly NeutralPosePreparationIssue[];
  readonly walkCycle: SouthWalkGenerationResult | null;
  readonly message: string | null;
}

const INITIAL_STATE: NeutralPoseFrameState = Object.freeze({
  status: "idle",
  frame: null,
  preparationIssues: Object.freeze([]),
  walkCycle: null,
  message: null
});

interface CachedWalkMetadata {
  readonly projectId: StableId;
  readonly projectRevision: number;
  readonly clipId: StableId;
  readonly diagnostics: readonly SouthWalkGenerationDiagnostic[];
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
        message: null
      })
    );
    const assignedIds = new Set(project.parts.map(({ assetId }) => assetId));
    const readyAssets = partAssets.filter(
      (asset) =>
        assignedIds.has(asset.assetId) &&
        asset.direction === direction &&
        asset.anchorStatus === "ready"
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
        let walkCycle: SouthWalkGenerationResult | null = null;
        if (direction === "south") {
          const clip = project.clips.find(
            (candidate) =>
              candidate.clipId === clipId &&
              candidate.templateId === HUMANOID_WALK_CLIP_ID
          );
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
            cachedMetadata?.projectId === project.projectId &&
            cachedMetadata.projectRevision === projectRevision &&
            cachedMetadata.clipId === clip.clipId
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
