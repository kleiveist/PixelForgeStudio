import { describe, expect, it, vi } from "vitest";
import { RevisionBoundDecodedSourceCache } from "./decodedSourceCache";

function image(red: number) {
  return {
    width: 1,
    height: 1,
    pixels: new Uint8ClampedArray([red, 0, 0, 255])
  };
}

describe("RevisionBoundDecodedSourceCache", () => {
  it("deduplicates concurrent and repeated reads of the same revision", async () => {
    const cache = new RevisionBoundDecodedSourceCache();
    const loader = vi.fn(async () => image(10));
    const source = { sourceId: "part-1", blobId: "blob-1", revision: "r1" };

    const [first, second] = await Promise.all([
      cache.load(source, loader),
      cache.load(source, loader)
    ]);
    const third = await cache.load(source, loader);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(cache.size).toBe(1);
  });

  it("evicts the previous decoded entry when source revision changes", async () => {
    const cache = new RevisionBoundDecodedSourceCache();
    const firstLoader = vi.fn(async () => image(10));
    const secondLoader = vi.fn(async () => image(20));

    const first = await cache.load(
      { sourceId: "part-1", blobId: "blob-1", revision: "r1" },
      firstLoader
    );
    const second = await cache.load(
      { sourceId: "part-1", blobId: "blob-1", revision: "r2" },
      secondLoader
    );

    expect([...first.pixels]).toEqual([10, 0, 0, 255]);
    expect([...second.pixels]).toEqual([20, 0, 0, 255]);
    expect(firstLoader).toHaveBeenCalledTimes(1);
    expect(secondLoader).toHaveBeenCalledTimes(1);
    expect(cache.size).toBe(1);
  });

  it("does not retain failed loads and validates decoded RGBA", async () => {
    const cache = new RevisionBoundDecodedSourceCache();
    const source = { sourceId: "part-1", blobId: "blob-1", revision: "r1" };
    const failure = vi.fn(async () => {
      throw new Error("decode failed");
    });

    await expect(cache.load(source, failure)).rejects.toThrow("decode failed");
    expect(cache.size).toBe(0);
    await expect(
      cache.load(source, async () => ({
        width: 2,
        height: 2,
        pixels: new Uint8ClampedArray(3)
      }))
    ).rejects.toThrow(/malformed RGBA/);
    expect(cache.size).toBe(0);
  });

  it("copies decoder pixels and can release entries explicitly", async () => {
    const cache = new RevisionBoundDecodedSourceCache();
    const decoded = image(30);
    const cached = await cache.load(
      { sourceId: "part-1", blobId: "blob-1", revision: "r1" },
      async () => decoded
    );
    decoded.pixels[0] = 99;

    expect(cached.pixels[0]).toBe(30);
    cache.delete("part-1");
    expect(cache.size).toBe(0);
    await cache.load(
      { sourceId: "part-2", blobId: "blob-2", revision: "r1" },
      async () => image(40)
    );
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("bounds decoded revisions with LRU eviction", async () => {
    const cache = new RevisionBoundDecodedSourceCache(2);
    await cache.load(
      { sourceId: "part-1", blobId: "blob-1", revision: "r1" },
      async () => image(1)
    );
    await cache.load(
      { sourceId: "part-2", blobId: "blob-2", revision: "r1" },
      async () => image(2)
    );
    await cache.load(
      { sourceId: "part-3", blobId: "blob-3", revision: "r1" },
      async () => image(3)
    );
    expect(cache.size).toBe(2);
    const reloaded = vi.fn(async () => image(1));
    await cache.load(
      { sourceId: "part-1", blobId: "blob-1", revision: "r1" },
      reloaded
    );
    expect(reloaded).toHaveBeenCalledOnce();
    expect(() => new RevisionBoundDecodedSourceCache(0)).toThrow(/positive/);
  });
});
