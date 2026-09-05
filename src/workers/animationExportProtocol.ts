import type {
  RgbaImage,
  SpriteSheetLayout,
  SpriteSheetSourceFrame
} from "../domain/animation";
import type {
  AnimationPartAsset,
  AnimationProject,
  StableId
} from "../schemas";
import type {
  DecodedPartSource,
  DirectionalRenderedFrame,
  DirectionalWalkDiagnostic
} from "../features/animation-workspace";

export const ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION = 1 as const;

export type AnimationExportWorkerOperation =
  | "renderFrames"
  | "composeSpriteSheet"
  | "prepareExport"
  | "packageBundle";

export type AnimationExportWorkerStage =
  | "validating"
  | "rendering"
  | "encoding"
  | "packaging";

export interface AnimationWorkerIdentity {
  readonly protocolVersion: typeof ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION;
  readonly jobId: string;
  readonly projectId: StableId;
  readonly projectRevision: number;
}

export interface AnimationWorkerRenderFramesRequest extends AnimationWorkerIdentity {
  readonly type: "renderFrames";
  readonly payload: Readonly<{
    project: AnimationProject;
    clipId: StableId;
    partAssets: readonly AnimationPartAsset[];
    decodedSources: readonly DecodedPartSource[];
  }>;
}

export interface AnimationWorkerComposeSpriteSheetRequest extends AnimationWorkerIdentity {
  readonly type: "composeSpriteSheet";
  readonly payload: Readonly<{
    layout: SpriteSheetLayout;
    frames: readonly SpriteSheetSourceFrame[];
  }>;
}

export interface AnimationWorkerPrepareExportRequest extends AnimationWorkerIdentity {
  readonly type: "prepareExport";
  readonly payload: Readonly<{
    images: readonly Readonly<{
      name: string;
      image: RgbaImage;
    }>[];
  }>;
}

export interface AnimationWorkerPackageBundleRequest extends AnimationWorkerIdentity {
  readonly type: "packageBundle";
  readonly payload: Readonly<{
    entries: readonly Readonly<{ path: string; bytes: Uint8Array }>[];
    mimeType: string;
  }>;
}

export interface AnimationWorkerCancelRequest extends AnimationWorkerIdentity {
  readonly type: "cancel";
  readonly reason?: string;
}

export type AnimationExportWorkerJobRequest =
  | AnimationWorkerRenderFramesRequest
  | AnimationWorkerComposeSpriteSheetRequest
  | AnimationWorkerPrepareExportRequest
  | AnimationWorkerPackageBundleRequest;

export type AnimationExportWorkerRequest =
  | AnimationExportWorkerJobRequest
  | AnimationWorkerCancelRequest;

export interface AnimationWorkerProgressMessage extends AnimationWorkerIdentity {
  readonly type: "progress";
  readonly operation: AnimationExportWorkerOperation;
  readonly stage: AnimationExportWorkerStage;
  readonly completed: number;
  readonly total: number;
}

export interface AnimationWorkerRenderedFramesResult {
  readonly kind: "renderFrames";
  readonly frames: readonly DirectionalRenderedFrame[];
  readonly diagnostics: readonly DirectionalWalkDiagnostic[];
}

export interface AnimationWorkerComposedSheetResult {
  readonly kind: "composeSpriteSheet";
  readonly image: RgbaImage;
}

export type AnimationWorkerPreparedExportResult =
  | Readonly<{
      kind: "prepareExport";
      encoding: "worker";
      files: readonly Readonly<{
        name: string;
        mimeType: "image/png";
        bytes: Uint8Array;
      }>[];
    }>
  | Readonly<{
      kind: "prepareExport";
      encoding: "fallback";
      images: readonly Readonly<{ name: string; image: RgbaImage }>[];
    }>;

export interface AnimationWorkerPackagedBundleResult {
  readonly kind: "packageBundle";
  readonly archive: Uint8Array;
  readonly mimeType: string;
}

export type AnimationExportWorkerResult =
  | AnimationWorkerRenderedFramesResult
  | AnimationWorkerComposedSheetResult
  | AnimationWorkerPreparedExportResult
  | AnimationWorkerPackagedBundleResult;

export interface AnimationWorkerCompletedMessage extends AnimationWorkerIdentity {
  readonly type: "completed";
  readonly operation: AnimationExportWorkerOperation;
  readonly result: AnimationExportWorkerResult;
}

export interface AnimationWorkerFailedMessage extends AnimationWorkerIdentity {
  readonly type: "failed";
  readonly operation: AnimationExportWorkerOperation;
  readonly message: string;
}

export interface AnimationWorkerCancelledMessage extends AnimationWorkerIdentity {
  readonly type: "cancelled";
  readonly operation: AnimationExportWorkerOperation;
}

export type AnimationExportWorkerResponse =
  | AnimationWorkerProgressMessage
  | AnimationWorkerCompletedMessage
  | AnimationWorkerFailedMessage
  | AnimationWorkerCancelledMessage;

const OPERATIONS: readonly AnimationExportWorkerOperation[] = Object.freeze([
  "renderFrames",
  "composeSpriteSheet",
  "prepareExport",
  "packageBundle"
]);
const RESPONSE_TYPES = Object.freeze([
  "progress",
  "completed",
  "failed",
  "cancelled"
] as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isAnimationExportWorkerResponse(
  value: unknown
): value is AnimationExportWorkerResponse {
  if (!isRecord(value)) return false;
  if (
    value.protocolVersion !== ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION ||
    typeof value.jobId !== "string" ||
    value.jobId.length === 0 ||
    typeof value.projectId !== "string" ||
    !Number.isInteger(value.projectRevision) ||
    (value.projectRevision as number) < 0 ||
    !RESPONSE_TYPES.includes(value.type as (typeof RESPONSE_TYPES)[number]) ||
    !OPERATIONS.includes(value.operation as AnimationExportWorkerOperation)
  ) {
    return false;
  }
  if (value.type === "progress") {
    return (
      ["validating", "rendering", "encoding", "packaging"].includes(
        value.stage as string
      ) &&
      Number.isInteger(value.completed) &&
      Number.isInteger(value.total) &&
      (value.completed as number) >= 0 &&
      (value.total as number) >= (value.completed as number)
    );
  }
  if (value.type === "failed") return typeof value.message === "string";
  if (value.type === "completed") return isRecord(value.result);
  return true;
}

export function animationWorkerOperation(
  request: AnimationExportWorkerJobRequest
): AnimationExportWorkerOperation {
  return request.type;
}
