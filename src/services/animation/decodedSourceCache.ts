import type { RgbaImage } from "../../domain/animation";

export interface DecodedSourceRevision {
  readonly sourceId: string;
  readonly blobId: string;
  readonly revision: string;
}

function assertRevisionPart(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new RangeError(`${label} must not be empty.`);
  }
}

function revisionKey(source: DecodedSourceRevision): string {
  assertRevisionPart(source.sourceId, "Decoded source id");
  assertRevisionPart(source.blobId, "Decoded blob id");
  assertRevisionPart(source.revision, "Decoded source revision");
  return JSON.stringify([source.sourceId, source.blobId, source.revision]);
}

function copyValidatedImage(image: RgbaImage): RgbaImage {
  if (
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height) ||
    image.width <= 0 ||
    image.height <= 0 ||
    !(image.pixels instanceof Uint8ClampedArray) ||
    image.pixels.length !== image.width * image.height * 4
  ) {
    throw new RangeError("Decoded source cache received malformed RGBA data.");
  }
  return Object.freeze({
    width: image.width,
    height: image.height,
    pixels: new Uint8ClampedArray(image.pixels)
  });
}

/**
 * Keeps only decoded RGBA revisions. Blob objects stay inside the injected
 * loader and are never retained by this cache.
 */
export class RevisionBoundDecodedSourceCache {
  private readonly entries = new Map<string, Promise<RgbaImage>>();
  private readonly currentKeyBySourceId = new Map<string, string>();

  public constructor(private readonly maximumEntries = 128) {
    if (!Number.isInteger(maximumEntries) || maximumEntries <= 0) {
      throw new RangeError("Decoded-source cache size must be positive.");
    }
  }

  public get size(): number {
    return this.entries.size;
  }

  public load(
    source: DecodedSourceRevision,
    loader: () => Promise<RgbaImage>
  ): Promise<RgbaImage> {
    const key = revisionKey(source);
    const currentKey = this.currentKeyBySourceId.get(source.sourceId);
    if (currentKey === key) {
      const cached = this.entries.get(key);
      if (cached) {
        this.entries.delete(key);
        this.entries.set(key, cached);
        return cached;
      }
    }
    if (currentKey && currentKey !== key) this.entries.delete(currentKey);

    const pending = Promise.resolve()
      .then(loader)
      .then(copyValidatedImage)
      .catch((error: unknown) => {
        if (this.entries.get(key) === pending) {
          this.entries.delete(key);
          this.currentKeyBySourceId.delete(source.sourceId);
        }
        throw error;
      });
    this.currentKeyBySourceId.set(source.sourceId, key);
    this.entries.set(key, pending);
    while (this.entries.size > this.maximumEntries) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      this.entries.delete(oldest);
      for (const [sourceId, currentSourceKey] of this.currentKeyBySourceId) {
        if (currentSourceKey !== oldest) continue;
        this.currentKeyBySourceId.delete(sourceId);
        break;
      }
    }
    return pending;
  }

  public delete(sourceId: string): void {
    const key = this.currentKeyBySourceId.get(sourceId);
    if (key) this.entries.delete(key);
    this.currentKeyBySourceId.delete(sourceId);
  }

  public clear(): void {
    this.entries.clear();
    this.currentKeyBySourceId.clear();
  }
}
