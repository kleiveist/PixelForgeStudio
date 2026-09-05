import {
  ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
  animationWorkerOperation,
  isAnimationExportWorkerResponse,
  type AnimationExportWorkerJobRequest,
  type AnimationExportWorkerResponse,
  type AnimationWorkerCompletedMessage,
  type AnimationWorkerProgressMessage
} from "../../workers/animationExportProtocol";

export interface AnimationWorkerMessageEvent {
  readonly data: unknown;
}

export interface AnimationWorkerPort {
  postMessage(message: unknown): void;
  addEventListener(
    type: "message",
    listener: (event: AnimationWorkerMessageEvent) => void
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: AnimationWorkerMessageEvent) => void
  ): void;
  terminate(): void;
}

export interface RunAnimationWorkerJobOptions {
  readonly signal?: AbortSignal;
  readonly onProgress?: (message: AnimationWorkerProgressMessage) => void;
  readonly currentProjectRevision?: () => number;
}

export class AnimationWorkerCancelledError extends Error {
  public constructor() {
    super("Der Workerexport wurde abgebrochen.");
    this.name = "AnimationWorkerCancelledError";
  }
}

export class StaleAnimationWorkerResultError extends Error {
  public constructor() {
    super("Das Workerresultat gehört zu einer veralteten Projektrevision.");
    this.name = "StaleAnimationWorkerResultError";
  }
}

interface PendingJob {
  readonly request: AnimationExportWorkerJobRequest;
  readonly options: RunAnimationWorkerJobOptions;
  readonly resolve: (message: AnimationWorkerCompletedMessage) => void;
  readonly reject: (reason: unknown) => void;
  readonly abortListener?: () => void;
}

/** Browser-independent revision/cancel boundary; covered with a fake port. */
export class AnimationExportWorkerController {
  readonly #jobs = new Map<string, PendingJob>();
  readonly #onMessage = (event: AnimationWorkerMessageEvent) => {
    if (!isAnimationExportWorkerResponse(event.data)) return;
    this.#handleMessage(event.data);
  };
  #terminated = false;

  public constructor(private readonly worker: AnimationWorkerPort) {
    worker.addEventListener("message", this.#onMessage);
  }

  public run(
    request: AnimationExportWorkerJobRequest,
    options: RunAnimationWorkerJobOptions = {}
  ): Promise<AnimationWorkerCompletedMessage> {
    if (this.#terminated) {
      return Promise.reject(new Error("Der Animation Worker wurde bereits beendet."));
    }
    if (request.protocolVersion !== ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION) {
      return Promise.reject(new Error("Unbekannte Animation-Worker-Protokollversion."));
    }
    if (this.#jobs.has(request.jobId)) {
      return Promise.reject(new Error(`Workerjob ${request.jobId} ist bereits aktiv.`));
    }
    if (options.signal?.aborted) {
      return Promise.reject(new AnimationWorkerCancelledError());
    }

    return new Promise((resolve, reject) => {
      const abortListener = options.signal
        ? () => {
            this.#postCancel(request);
            this.#settle(request.jobId, () => reject(new AnimationWorkerCancelledError()));
          }
        : undefined;
      const pending: PendingJob = {
        request,
        options,
        resolve,
        reject,
        ...(abortListener ? { abortListener } : {})
      };
      this.#jobs.set(request.jobId, pending);
      if (abortListener) options.signal!.addEventListener("abort", abortListener, { once: true });
      this.worker.postMessage(request);
    });
  }

  public cancel(jobId: string): boolean {
    const pending = this.#jobs.get(jobId);
    if (!pending) return false;
    this.#postCancel(pending.request);
    this.#settle(jobId, () => pending.reject(new AnimationWorkerCancelledError()));
    return true;
  }

  public terminate(): void {
    if (this.#terminated) return;
    this.#terminated = true;
    this.worker.removeEventListener("message", this.#onMessage);
    for (const [jobId, pending] of this.#jobs) {
      this.#settle(jobId, () => pending.reject(new AnimationWorkerCancelledError()));
    }
    this.worker.terminate();
  }

  #postCancel(request: AnimationExportWorkerJobRequest): void {
    this.worker.postMessage({
      protocolVersion: ANIMATION_EXPORT_WORKER_PROTOCOL_VERSION,
      type: "cancel",
      jobId: request.jobId,
      projectId: request.projectId,
      projectRevision: request.projectRevision,
      reason: "cancelledByClient"
    });
  }

  #handleMessage(message: AnimationExportWorkerResponse): void {
    const pending = this.#jobs.get(message.jobId);
    if (!pending) return;
    const request = pending.request;
    if (
      message.projectId !== request.projectId ||
      message.projectRevision !== request.projectRevision ||
      message.operation !== animationWorkerOperation(request)
    ) {
      return;
    }
    const currentRevision = pending.options.currentProjectRevision?.();
    if (
      currentRevision !== undefined &&
      currentRevision !== request.projectRevision
    ) {
      this.#postCancel(request);
      this.#settle(message.jobId, () =>
        pending.reject(new StaleAnimationWorkerResultError())
      );
      return;
    }
    if (message.type === "progress") {
      pending.options.onProgress?.(message);
      return;
    }
    if (message.type === "completed") {
      this.#settle(message.jobId, () => pending.resolve(message));
      return;
    }
    if (message.type === "cancelled") {
      this.#settle(message.jobId, () =>
        pending.reject(new AnimationWorkerCancelledError())
      );
      return;
    }
    this.#settle(message.jobId, () => pending.reject(new Error(message.message)));
  }

  #settle(jobId: string, settle: () => void): void {
    const pending = this.#jobs.get(jobId);
    if (!pending) return;
    this.#jobs.delete(jobId);
    if (pending.abortListener && pending.options.signal) {
      pending.options.signal.removeEventListener("abort", pending.abortListener);
    }
    settle();
  }
}

export function createBrowserAnimationExportWorkerController():
  | AnimationExportWorkerController
  | null {
  if (typeof Worker === "undefined") return null;
  try {
    const worker = new Worker(
      new URL("../../workers/animationExport.worker.ts", import.meta.url),
      { type: "module", name: "pixelforge-animation-export" }
    );
    return new AnimationExportWorkerController(worker);
  } catch {
    return null;
  }
}
