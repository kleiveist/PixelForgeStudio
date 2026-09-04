import type {
  AnimationPartAsset,
  AnimationProject,
  CharacterKit,
  StableId
} from "../../schemas";

export interface AnimationBinaryReferenceSnapshot {
  readonly projects: readonly AnimationProject[];
  readonly partAssets: readonly AnimationPartAsset[];
  readonly kits: readonly CharacterKit[];
  readonly imageBlobIds: readonly StableId[];
  readonly previewIds: readonly StableId[];
}

export interface AnimationBinaryReferenceAnalysis {
  readonly referencedImageBlobIds: readonly StableId[];
  readonly unreferencedImageBlobIds: readonly StableId[];
  readonly referencedPreviewIds: readonly StableId[];
  readonly unreferencedPreviewIds: readonly StableId[];
}

function sortedIds(ids: Iterable<StableId>): readonly StableId[] {
  return Object.freeze([...ids].sort((left, right) => left.localeCompare(right)));
}

export function analyzeAnimationBinaryReferences(
  snapshot: AnimationBinaryReferenceSnapshot
): AnimationBinaryReferenceAnalysis {
  const referencedImageBlobIds = new Set(
    snapshot.partAssets.map((partAsset) => partAsset.blobId)
  );
  const referencedPreviewIds = new Set<StableId>();

  for (const project of snapshot.projects) {
    if (project.previewBlobId) referencedPreviewIds.add(project.previewBlobId);
  }
  for (const kit of snapshot.kits) {
    if (kit.previewBlobId) referencedPreviewIds.add(kit.previewBlobId);
  }

  return Object.freeze({
    referencedImageBlobIds: sortedIds(referencedImageBlobIds),
    unreferencedImageBlobIds: sortedIds(
      snapshot.imageBlobIds.filter((blobId) => !referencedImageBlobIds.has(blobId))
    ),
    referencedPreviewIds: sortedIds(referencedPreviewIds),
    unreferencedPreviewIds: sortedIds(
      snapshot.previewIds.filter(
        (previewId) => !referencedPreviewIds.has(previewId)
      )
    )
  });
}
