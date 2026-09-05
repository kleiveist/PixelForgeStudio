import { describe, expect, it } from "vitest";
import type { Direction, RenderedFrame } from "../../domain/animation";
import { StableIdSchema } from "../../schemas";
import {
  RevisionBoundRenderedFrameCache,
  advancePlaybackClock,
  type RenderedFrameCacheKey
} from "./animationPlayback";

function frame(marker: number): RenderedFrame {
  return Object.freeze({
    width: 1,
    height: 1,
    pixels: new Uint8ClampedArray([marker, 0, 0, 255]),
    diagnostics: Object.freeze([]),
    renderedPartIds: Object.freeze([`part-${marker}`])
  });
}

function key(
  overrides: Partial<RenderedFrameCacheKey> = {}
): RenderedFrameCacheKey {
  return {
    projectId: StableIdSchema.parse("project_walk_001"),
    projectRevision: 3,
    clipId: StableIdSchema.parse("clip_walk_001"),
    direction: "south" as Direction,
    frameIndex: 0,
    ...overrides
  };
}

describe("animation playback clock", () => {
  it("uses clip FPS rather than display ticks", () => {
    const beforeBoundary = advancePlaybackClock(
      { frameIndex: 0, remainderMs: 0 },
      99,
      10,
      8,
      true
    );
    expect(beforeBoundary).toEqual({
      frameIndex: 0,
      remainderMs: 99,
      advancedFrames: 0,
      ended: false
    });

    expect(
      advancePlaybackClock(beforeBoundary, 1, 10, 8, true)
    ).toEqual({
      frameIndex: 1,
      remainderMs: 0,
      advancedFrames: 1,
      ended: false
    });
    expect(
      advancePlaybackClock(
        { frameIndex: 0, remainderMs: 0 },
        250,
        12,
        8,
        true
      ).frameIndex
    ).toBe(3);
  });

  it("loops frame 7 to 0 and catches up delayed ticks in constant time", () => {
    expect(
      advancePlaybackClock(
        { frameIndex: 7, remainderMs: 0 },
        100,
        10,
        8,
        true
      ).frameIndex
    ).toBe(0);

    expect(
      advancePlaybackClock(
        { frameIndex: 1, remainderMs: 25 },
        425,
        10,
        8,
        true
      )
    ).toEqual({
      frameIndex: 5,
      remainderMs: 50,
      advancedFrames: 4,
      ended: false
    });
  });

  it("stops non-looping clips on their final frame", () => {
    expect(
      advancePlaybackClock(
        { frameIndex: 6, remainderMs: 0 },
        900,
        10,
        8,
        false
      )
    ).toEqual({
      frameIndex: 7,
      remainderMs: 0,
      advancedFrames: 1,
      ended: true
    });
  });
});

describe("RevisionBoundRenderedFrameCache", () => {
  it("hits only an exact project/revision/clip/direction/frame key", () => {
    const cache = new RevisionBoundRenderedFrameCache(4);
    const rendered = frame(1);
    cache.set(key(), rendered);

    expect(cache.get(key())).toBe(rendered);
    expect(cache.get(key({ projectRevision: 4 }))).toBeNull();
    expect(cache.get(key({ direction: "east" }))).toBeNull();
    expect(cache.get(key({ frameIndex: 1 }))).toBeNull();
  });

  it("invalidates only the affected scope and prunes stale revisions", () => {
    const cache = new RevisionBoundRenderedFrameCache(8);
    cache.set(key({ frameIndex: 0 }), frame(0));
    cache.set(key({ frameIndex: 1 }), frame(1));
    cache.set(key({ direction: "east", frameIndex: 0 }), frame(2));
    cache.set(
      key({
        projectId: StableIdSchema.parse("project_walk_002"),
        frameIndex: 0
      }),
      frame(3)
    );

    expect(
      cache.invalidate({
        projectId: StableIdSchema.parse("project_walk_001"),
        clipId: StableIdSchema.parse("clip_walk_001"),
        direction: "south",
        frameIndex: 1
      })
    ).toBe(1);
    expect(cache.get(key({ frameIndex: 0 }))).not.toBeNull();
    expect(cache.get(key({ direction: "east", frameIndex: 0 }))).not.toBeNull();
    expect(cache.size).toBe(3);

    cache.set(key({ projectRevision: 4, frameIndex: 0 }), frame(4));
    expect(
      cache.pruneProjectRevisions(StableIdSchema.parse("project_walk_001"), 4)
    ).toBe(2);
    expect(cache.size).toBe(2);
  });

  it("evicts the least recently used entry at its hard bound", () => {
    const cache = new RevisionBoundRenderedFrameCache(2);
    cache.set(key({ frameIndex: 0 }), frame(0));
    cache.set(key({ frameIndex: 1 }), frame(1));
    expect(cache.get(key({ frameIndex: 0 }))).not.toBeNull();
    cache.set(key({ frameIndex: 2 }), frame(2));

    expect(cache.size).toBe(2);
    expect(cache.get(key({ frameIndex: 1 }))).toBeNull();
    expect(cache.get(key({ frameIndex: 0 }))).not.toBeNull();
  });

  it("rebases unaffected frames and invalidates only the corrected address", () => {
    const cache = new RevisionBoundRenderedFrameCache(8);
    const unchanged = frame(0);
    cache.set(key({ projectRevision: 3, frameIndex: 0 }), unchanged);
    cache.set(key({ projectRevision: 3, frameIndex: 1 }), frame(1));
    cache.set(key({ projectRevision: 3, direction: "east", frameIndex: 1 }), frame(2));

    expect(
      cache.rebaseProjectRevision(
        StableIdSchema.parse("project_walk_001"),
        3,
        4,
        [{ clipId: StableIdSchema.parse("clip_walk_001"), direction: "south", frameIndex: 1 }]
      )
    ).toEqual({ carried: 2, invalidated: 1 });
    expect(cache.get(key({ projectRevision: 4, frameIndex: 0 }))).toBe(unchanged);
    expect(cache.get(key({ projectRevision: 4, frameIndex: 1 }))).toBeNull();
    expect(cache.get(key({ projectRevision: 4, direction: "east", frameIndex: 1 }))).not.toBeNull();
    expect(cache.get(key({ projectRevision: 3, frameIndex: 0 }))).toBeNull();
  });
});
