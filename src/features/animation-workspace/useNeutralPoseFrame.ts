import { useEffect, useRef, useState } from "react";
import {
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

export type WorkspacePartBlobLoadResult =
  | Readonly<{ status: "ok"; blob: Blob }>
  | Readonly<{ status: "error"; message: string }>;

export interface NeutralPoseFrameState {
  readonly status: "idle" | "loading" | "ready" | "unavailable" | "failed";
  readonly frame: RenderedFrame | null;
  readonly preparationIssues: readonly NeutralPosePreparationIssue[];
  readonly message: string | null;
}

const INITIAL_STATE: NeutralPoseFrameState = Object.freeze({
  status: "idle",
  frame: null,
  preparationIssues: Object.freeze([]),
  message: null
});

export function useNeutralPoseFrame(
  project: AnimationProject,
  direction: Direction,
  partAssets: readonly AnimationPartAsset[],
  decoder: ImageDecoder | null,
  loadBlob: (blobId: StableId) => Promise<WorkspacePartBlobLoadResult>
): NeutralPoseFrameState {
  const cacheRef = useRef<RevisionBoundDecodedSourceCache | null>(null);
  if (!cacheRef.current) {
    cacheRef.current = new RevisionBoundDecodedSourceCache();
  }
  const [state, setState] = useState<NeutralPoseFrameState>(INITIAL_STATE);

  useEffect(
    () => () => {
      cacheRef.current?.clear();
    },
    []
  );

  useEffect(() => {
    const template = getBuiltInRigTemplate(project.rigTemplateId);
    if (!template) {
      setState(
        Object.freeze({
          status: "unavailable",
          frame: null,
          preparationIssues: Object.freeze([]),
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
        setState(
          Object.freeze({
            status: "ready",
            frame,
            preparationIssues: prepared.issues,
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
  }, [decoder, direction, loadBlob, partAssets, project]);

  return state;
}
