import type { Direction, RenderedFrame } from "../../domain/animation";
import type { StableId } from "../../schemas";

export interface AnimationFrameScheduler {
  readonly now: () => number;
  readonly requestFrame: (callback: (timestamp: number) => void) => number;
  readonly cancelFrame: (handle: number) => void;
}

export interface PlaybackClockState {
  readonly frameIndex: number;
  readonly remainderMs: number;
}

export interface PlaybackClockResult extends PlaybackClockState {
  readonly advancedFrames: number;
  readonly ended: boolean;
}

const PLAYBACK_TIME_EPSILON_MS = 1e-7;

function assertPlaybackNumber(
  value: number,
  label: string,
  minimumExclusive: number
): void {
  if (!Number.isFinite(value) || value <= minimumExclusive) {
    throw new RangeError(`${label} must be greater than ${minimumExclusive}.`);
  }
}

/**
 * Projects elapsed wall-clock time onto clip frames in constant time. A slow
 * display tick can advance several clip frames without a catch-up loop.
 */
export function advancePlaybackClock(
  state: PlaybackClockState,
  elapsedMs: number,
  fps: number,
  frameCount: number,
  loop: boolean
): PlaybackClockResult {
  assertPlaybackNumber(fps, "Playback FPS", 0);
  if (!Number.isInteger(frameCount) || frameCount <= 0) {
    throw new RangeError("Playback frame count must be a positive integer.");
  }
  if (
    !Number.isInteger(state.frameIndex) ||
    state.frameIndex < 0 ||
    state.frameIndex >= frameCount
  ) {
    throw new RangeError("Playback frame index is outside the clip.");
  }
  if (!Number.isFinite(state.remainderMs) || state.remainderMs < 0) {
    throw new RangeError(
      "Playback remainder must be a finite non-negative duration."
    );
  }
  if (!Number.isFinite(elapsedMs)) {
    throw new RangeError("Playback elapsed time must be finite.");
  }

  const frameDurationMs = 1000 / fps;
  const availableMs = state.remainderMs + Math.max(0, elapsedMs);
  const requestedSteps = Math.floor(
    (availableMs + PLAYBACK_TIME_EPSILON_MS) / frameDurationMs
  );
  const remainderMs = Math.max(
    0,
    availableMs - requestedSteps * frameDurationMs
  );
  if (requestedSteps === 0) {
    return Object.freeze({
      frameIndex: state.frameIndex,
      remainderMs,
      advancedFrames: 0,
      ended: false
    });
  }

  if (loop) {
    return Object.freeze({
      frameIndex: (state.frameIndex + requestedSteps) % frameCount,
      remainderMs,
      advancedFrames: requestedSteps,
      ended: false
    });
  }

  const remainingFrames = frameCount - 1 - state.frameIndex;
  const advancedFrames = Math.min(requestedSteps, remainingFrames);
  const ended =
    requestedSteps >= remainingFrames &&
    state.frameIndex + advancedFrames === frameCount - 1;
  return Object.freeze({
    frameIndex: state.frameIndex + advancedFrames,
    remainderMs: ended ? 0 : remainderMs,
    advancedFrames,
    ended
  });
}

export function createBrowserAnimationFrameScheduler(): AnimationFrameScheduler {
  return Object.freeze({
    now: () => performance.now(),
    requestFrame: (callback: (timestamp: number) => void) =>
      window.requestAnimationFrame(callback),
    cancelFrame: (handle: number) => window.cancelAnimationFrame(handle)
  });
}

export interface RenderedFrameCacheKey {
  readonly projectId: StableId;
  readonly projectRevision: number;
  readonly clipId: StableId;
  readonly direction: Direction;
  readonly frameIndex: number;
}

export interface RenderedFrameCacheFilter {
  readonly projectId?: StableId;
  readonly projectRevision?: number;
  readonly clipId?: StableId;
  readonly direction?: Direction;
  readonly frameIndex?: number;
}

interface RenderedFrameCacheEntry {
  readonly key: RenderedFrameCacheKey;
  readonly frame: RenderedFrame;
}

function cacheKey(key: RenderedFrameCacheKey): string {
  return [
    key.projectId,
    key.projectRevision,
    key.clipId,
    key.direction,
    key.frameIndex
  ].join(":");
}

function assertCacheKey(key: RenderedFrameCacheKey): void {
  if (!Number.isInteger(key.projectRevision) || key.projectRevision < 0) {
    throw new RangeError("Project revision must be a non-negative integer.");
  }
  if (!Number.isInteger(key.frameIndex) || key.frameIndex < 0) {
    throw new RangeError("Cached frame index must be a non-negative integer.");
  }
}

function matchesFilter(
  key: RenderedFrameCacheKey,
  filter: RenderedFrameCacheFilter
): boolean {
  return (
    (filter.projectId === undefined || filter.projectId === key.projectId) &&
    (filter.projectRevision === undefined ||
      filter.projectRevision === key.projectRevision) &&
    (filter.clipId === undefined || filter.clipId === key.clipId) &&
    (filter.direction === undefined || filter.direction === key.direction) &&
    (filter.frameIndex === undefined || filter.frameIndex === key.frameIndex)
  );
}

/** A small LRU cache. Entries are transient and never cross persistence APIs. */
export class RevisionBoundRenderedFrameCache {
  readonly #maximumEntries: number;
  readonly #entries = new Map<string, RenderedFrameCacheEntry>();

  constructor(maximumEntries = 128) {
    if (!Number.isInteger(maximumEntries) || maximumEntries <= 0) {
      throw new RangeError("Rendered-frame cache size must be positive.");
    }
    this.#maximumEntries = maximumEntries;
  }

  get size(): number {
    return this.#entries.size;
  }

  get(key: RenderedFrameCacheKey): RenderedFrame | null {
    assertCacheKey(key);
    const serialized = cacheKey(key);
    const entry = this.#entries.get(serialized);
    if (!entry) return null;
    this.#entries.delete(serialized);
    this.#entries.set(serialized, entry);
    return entry.frame;
  }

  set(key: RenderedFrameCacheKey, frame: RenderedFrame): void {
    assertCacheKey(key);
    const serialized = cacheKey(key);
    this.#entries.delete(serialized);
    this.#entries.set(
      serialized,
      Object.freeze({ key: Object.freeze({ ...key }), frame })
    );
    while (this.#entries.size > this.#maximumEntries) {
      const oldest = this.#entries.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.#entries.delete(oldest);
    }
  }

  invalidate(filter: RenderedFrameCacheFilter): number {
    let removed = 0;
    for (const [serialized, entry] of this.#entries) {
      if (!matchesFilter(entry.key, filter)) continue;
      this.#entries.delete(serialized);
      removed += 1;
    }
    return removed;
  }

  pruneProjectRevisions(projectId: StableId, currentRevision: number): number {
    let removed = 0;
    for (const [serialized, entry] of this.#entries) {
      if (
        entry.key.projectId === projectId &&
        entry.key.projectRevision !== currentRevision
      ) {
        this.#entries.delete(serialized);
        removed += 1;
      }
    }
    return removed;
  }

  /**
   * Carries unaffected transient frames into a new metadata revision and drops
   * only explicitly changed frame addresses from the carried revision.
   */
  rebaseProjectRevision(
    projectId: StableId,
    fromRevision: number,
    toRevision: number,
    invalidated: readonly Omit<RenderedFrameCacheFilter, "projectId" | "projectRevision">[]
  ): Readonly<{ carried: number; invalidated: number }> {
    if (fromRevision === toRevision) {
      return Object.freeze({ carried: 0, invalidated: 0 });
    }
    const sourceEntries = [...this.#entries.entries()].filter(
      ([, entry]) =>
        entry.key.projectId === projectId &&
        entry.key.projectRevision === fromRevision
    );
    let carried = 0;
    let invalidatedCount = 0;
    for (const [serialized, entry] of sourceEntries) {
      this.#entries.delete(serialized);
      const changed = invalidated.some((filter) =>
        matchesFilter(entry.key, { projectId, projectRevision: fromRevision, ...filter })
      );
      if (changed) {
        invalidatedCount += 1;
        continue;
      }
      this.set({ ...entry.key, projectRevision: toRevision }, entry.frame);
      carried += 1;
    }
    return Object.freeze({ carried, invalidated: invalidatedCount });
  }

  clear(): void {
    this.#entries.clear();
  }
}
