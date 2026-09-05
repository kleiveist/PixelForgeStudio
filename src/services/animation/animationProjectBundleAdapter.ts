import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { canonicalizeJson } from "../../domain/json";
import {
  AnimationPartAssetSchema,
  AnimationProjectBundleSchema,
  AnimationProjectBundleManifestSchema,
  AnimationProjectSchema,
  MAX_ANIMATION_BUNDLE_FILES,
  MAX_ANIMATION_UNPACKED_BUNDLE_BYTES,
  type AnimationPartAsset,
  type AnimationProject,
  type AnimationProjectBundle,
  type StableId
} from "../../schemas";
import type {
  AnimationBundleConflictResolution,
  AnimationRepository,
  AnimationRepositoryValueMutationResult,
  PersistedAnimationProjectBundle
} from "./animationRepository";

export const PFANIM_MIME_TYPE = "application/vnd.pixelforge.animation+zip";

export const PFANIM_BUNDLE_ERROR_CODES = Object.freeze([
  "invalidArchive",
  "unsafePath",
  "fileLimit",
  "sizeLimit",
  "missingFile",
  "unexpectedFile",
  "invalidJson",
  "invalidManifest",
  "invalidGraph",
  "invalidPng",
  "repositoryRead"
] as const);

export type PfanimBundleErrorCode =
  (typeof PFANIM_BUNDLE_ERROR_CODES)[number];

export class PfanimBundleError extends Error {
  public readonly code: PfanimBundleErrorCode;

  public constructor(code: PfanimBundleErrorCode, message: string) {
    super(message);
    this.name = "PfanimBundleError";
    this.code = code;
  }
}

export interface CreatePfanimArchiveInput {
  readonly project: AnimationProject;
  readonly partAssets: readonly AnimationPartAsset[];
  readonly exportedAt: string;
  readonly readImageBlob: (blobId: StableId) => Promise<Blob>;
  readonly readPreviewBlob?: (previewId: StableId) => Promise<Blob>;
}

export interface ParsedPfanimArchive {
  readonly bundle: AnimationProjectBundle;
  readonly imageBlobs: readonly Readonly<{ blobId: StableId; blob: Blob }>[];
  readonly preview?: Readonly<{ previewId: StableId; blob: Blob }>;
}

export interface PreparedPfanimArchive {
  readonly mimeType: typeof PFANIM_MIME_TYPE;
  readonly entries: readonly Readonly<{ path: string; bytes: Uint8Array }>[];
}

export interface PfanimArchiveLimits {
  readonly maxFiles?: number;
  readonly maxUnpackedBytes?: number;
}

const PNG_SIGNATURE = Object.freeze([137, 80, 78, 71, 13, 10, 26, 10]);
const ZIP_TIMESTAMP = new Date("1980-01-01T00:00:00.000Z");

function jsonBytes(value: unknown): Uint8Array {
  return strToU8(`${JSON.stringify(JSON.parse(canonicalizeJson(value)), null, 2)}\n`);
}

function hasPngSignature(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

async function pngBytes(blob: Blob, label: string): Promise<Uint8Array> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!hasPngSignature(bytes)) {
    throw new PfanimBundleError(
      "invalidPng",
      `${label} ist kein gültig signierter PNG-Blob.`
    );
  }
  return bytes;
}

function partPath(assetId: StableId): string {
  return `parts/${assetId}.json`;
}

function blobPath(blobId: StableId): string {
  return `blobs/${blobId}.png`;
}

function previewPath(previewId: StableId): string {
  return `preview/${previewId}.png`;
}

export async function preparePfanimArchive(
  input: CreatePfanimArchiveInput
): Promise<PreparedPfanimArchive> {
  const parsedProject = AnimationProjectSchema.safeParse(input.project);
  if (!parsedProject.success) {
    throw new PfanimBundleError("invalidGraph", "Das Exportprojekt ist ungültig.");
  }
  const byId = new Map(input.partAssets.map((part) => [part.assetId, part]));
  const referencedParts = parsedProject.data.parts.map(({ assetId }) => {
    const part = byId.get(assetId);
    if (!part) {
      throw new PfanimBundleError(
        "missingFile",
        `PartAsset ${assetId} fehlt für den Bundleexport.`
      );
    }
    return AnimationPartAssetSchema.parse(part);
  });
  const uniqueBlobIds = Object.freeze([
    ...new Set(referencedParts.map(({ blobId }) => blobId))
  ]);
  const manifest = AnimationProjectBundleManifestSchema.parse({
    application: "PixelForge Animation Studio",
    formatVersion: 1,
    kind: "animationProjectBundle",
    exportedAt: input.exportedAt,
    projectFile: "project.json"
  });
  const blobIds = [
    ...uniqueBlobIds,
    ...(parsedProject.data.previewBlobId
      ? [parsedProject.data.previewBlobId]
      : [])
  ];
  const bundle = AnimationProjectBundleSchema.parse({
    manifest,
    project: parsedProject.data,
    partAssets: referencedParts,
    blobIds
  });

  const entries: Record<string, Uint8Array> = {
    "manifest.json": jsonBytes(manifest),
    "project.json": jsonBytes(bundle.project)
  };
  for (const part of referencedParts) entries[partPath(part.assetId)] = jsonBytes(part);
  for (const blobId of uniqueBlobIds) {
    const blob = await input.readImageBlob(blobId);
    entries[blobPath(blobId)] = await pngBytes(blob, `Originalbild ${blobId}`);
  }
  if (parsedProject.data.previewBlobId) {
    if (!input.readPreviewBlob) {
      throw new PfanimBundleError(
        "missingFile",
        "Das Projekt referenziert eine Preview, aber kein Preview-Reader ist verbunden."
      );
    }
    const previewId = parsedProject.data.previewBlobId;
    entries[previewPath(previewId)] = await pngBytes(
      await input.readPreviewBlob(previewId),
      `Preview ${previewId}`
    );
  }
  if (Object.keys(entries).length > MAX_ANIMATION_BUNDLE_FILES) {
    throw new PfanimBundleError("fileLimit", "Das Bundle überschreitet das Dateilimit.");
  }
  const totalBytes = Object.values(entries).reduce((sum, bytes) => sum + bytes.length, 0);
  if (totalBytes > MAX_ANIMATION_UNPACKED_BUNDLE_BYTES) {
    throw new PfanimBundleError("sizeLimit", "Das Bundle überschreitet das Größenlimit.");
  }
  return Object.freeze({
    mimeType: PFANIM_MIME_TYPE,
    entries: Object.freeze(
      Object.entries(entries).map(([path, bytes]) =>
        Object.freeze({ path, bytes })
      )
    )
  });
}

export async function createPfanimArchive(
  input: CreatePfanimArchiveInput
): Promise<Blob> {
  const prepared = await preparePfanimArchive(input);
  const entries = Object.fromEntries(
    prepared.entries.map(({ path, bytes }) => [path, bytes])
  );
  const archive = zipSync(entries, { level: 6, mtime: ZIP_TIMESTAMP });
  return new Blob([archive], { type: prepared.mimeType });
}

export function assertSafeBundlePath(path: string): void {
  if (
    path.length === 0 ||
    path.length > 512 ||
    path.startsWith("/") ||
    path.startsWith("\\") ||
    /^[a-zA-Z]:/.test(path) ||
    path.includes("\\") ||
    /[\0-\x1f\x7f]/.test(path)
  ) {
    throw new PfanimBundleError("unsafePath", `Unsicherer Bundlepfad: ${path}`);
  }
  const segments = path.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new PfanimBundleError("unsafePath", `Unsicherer Bundlepfad: ${path}`);
  }
}

function parseJsonFile(entries: Readonly<Record<string, Uint8Array>>, path: string): unknown {
  const bytes = entries[path];
  if (!bytes) throw new PfanimBundleError("missingFile", `${path} fehlt im Bundle.`);
  try {
    return JSON.parse(strFromU8(bytes));
  } catch {
    throw new PfanimBundleError("invalidJson", `${path} enthält kein gültiges JSON.`);
  }
}

function parseArchiveEntries(
  bytes: Uint8Array,
  limits: PfanimArchiveLimits
): Readonly<Record<string, Uint8Array>> {
  const maxFiles = limits.maxFiles ?? MAX_ANIMATION_BUNDLE_FILES;
  const maxUnpackedBytes =
    limits.maxUnpackedBytes ?? MAX_ANIMATION_UNPACKED_BUNDLE_BYTES;
  if (!Number.isInteger(maxFiles) || maxFiles <= 0) {
    throw new RangeError("maxFiles must be a positive integer.");
  }
  if (!Number.isInteger(maxUnpackedBytes) || maxUnpackedBytes <= 0) {
    throw new RangeError("maxUnpackedBytes must be a positive integer.");
  }
  if (bytes.length > maxUnpackedBytes) {
    throw new PfanimBundleError("sizeLimit", "Das komprimierte Bundle ist zu groß.");
  }
  let fileCount = 0;
  let unpackedBytes = 0;
  const paths = new Set<string>();
  try {
    const unzipped = unzipSync(bytes, {
      filter(file) {
        assertSafeBundlePath(file.name);
        fileCount += 1;
        if (fileCount > maxFiles) {
          throw new PfanimBundleError("fileLimit", "Das Bundle enthält zu viele Dateien.");
        }
        if (paths.has(file.name)) {
          throw new PfanimBundleError("unsafePath", `Doppelter Bundlepfad: ${file.name}`);
        }
        paths.add(file.name);
        unpackedBytes += file.originalSize;
        if (
          !Number.isSafeInteger(file.originalSize) ||
          file.originalSize < 0 ||
          unpackedBytes > maxUnpackedBytes
        ) {
          throw new PfanimBundleError(
            "sizeLimit",
            "Das entpackte Bundle überschreitet das Größenlimit."
          );
        }
        return true;
      }
    });
    const actualEntries = Object.values(unzipped);
    const actualSize = actualEntries.reduce(
      (sum, entry) => sum + entry.byteLength,
      0
    );
    if (actualEntries.length > maxFiles) {
      throw new PfanimBundleError("fileLimit", "Das Bundle enthält zu viele Dateien.");
    }
    if (actualSize > maxUnpackedBytes) {
      throw new PfanimBundleError(
        "sizeLimit",
        "Das tatsächlich entpackte Bundle überschreitet das Größenlimit."
      );
    }
    return unzipped;
  } catch (error) {
    if (error instanceof PfanimBundleError) throw error;
    throw new PfanimBundleError(
      "invalidArchive",
      error instanceof Error ? error.message : "Das ZIP-Archiv ist beschädigt."
    );
  }
}

export async function parsePfanimArchive(
  input: Blob | Uint8Array,
  limits: PfanimArchiveLimits = {}
): Promise<ParsedPfanimArchive> {
  const bytes = input instanceof Uint8Array
    ? input
    : new Uint8Array(await input.arrayBuffer());
  const entries = parseArchiveEntries(bytes, limits);

  // The discriminator is deliberately parsed before any nested project data.
  const manifestResult = AnimationProjectBundleManifestSchema.safeParse(
    parseJsonFile(entries, "manifest.json")
  );
  if (!manifestResult.success) {
    throw new PfanimBundleError("invalidManifest", "manifest.json ist inkompatibel.");
  }
  const projectResult = AnimationProjectSchema.safeParse(
    parseJsonFile(entries, manifestResult.data.projectFile)
  );
  if (!projectResult.success) {
    throw new PfanimBundleError("invalidGraph", "project.json ist ungültig.");
  }
  const partAssets: AnimationPartAsset[] = [];
  for (const assignment of projectResult.data.parts) {
    const path = partPath(assignment.assetId);
    const partResult = AnimationPartAssetSchema.safeParse(parseJsonFile(entries, path));
    if (!partResult.success || partResult.data.assetId !== assignment.assetId) {
      throw new PfanimBundleError(
        "invalidGraph",
        `${path} stimmt nicht mit seiner Projekt-Referenz überein.`
      );
    }
    partAssets.push(partResult.data);
  }
  const imageBlobIds = [...new Set(partAssets.map(({ blobId }) => blobId))];
  const blobIds = [
    ...imageBlobIds,
    ...(projectResult.data.previewBlobId ? [projectResult.data.previewBlobId] : [])
  ];
  const bundleResult = AnimationProjectBundleSchema.safeParse({
    manifest: manifestResult.data,
    project: projectResult.data,
    partAssets,
    blobIds
  });
  if (!bundleResult.success) {
    throw new PfanimBundleError("invalidGraph", "Der Bundle-Referenzgraph ist ungültig.");
  }

  const expectedPaths = new Set([
    "manifest.json",
    manifestResult.data.projectFile,
    ...partAssets.map(({ assetId }) => partPath(assetId)),
    ...imageBlobIds.map(blobPath),
    ...(projectResult.data.previewBlobId
      ? [previewPath(projectResult.data.previewBlobId)]
      : [])
  ]);
  for (const path of Object.keys(entries)) {
    if (!expectedPaths.has(path)) {
      throw new PfanimBundleError("unexpectedFile", `Nicht referenzierte Datei: ${path}`);
    }
  }
  if (Object.keys(entries).length !== expectedPaths.size) {
    throw new PfanimBundleError("missingFile", "Das Bundle ist nicht vollständig.");
  }

  const imageBlobs = imageBlobIds.map((blobId) => {
    const entry = entries[blobPath(blobId)];
    if (!entry) throw new PfanimBundleError("missingFile", `Blob ${blobId} fehlt.`);
    if (!hasPngSignature(entry)) {
      throw new PfanimBundleError("invalidPng", `Blob ${blobId} ist kein PNG.`);
    }
    return Object.freeze({
      blobId,
      blob: new Blob([Uint8Array.from(entry).buffer], { type: "image/png" })
    });
  });
  const previewId = projectResult.data.previewBlobId;
  let preview: ParsedPfanimArchive["preview"];
  if (previewId) {
    const entry = entries[previewPath(previewId)];
    if (!entry || !hasPngSignature(entry)) {
      throw new PfanimBundleError("invalidPng", `Preview ${previewId} ist kein PNG.`);
    }
    preview = Object.freeze({
      previewId,
      blob: new Blob([Uint8Array.from(entry).buffer], { type: "image/png" })
    });
  }
  return Object.freeze({
    bundle: bundleResult.data,
    imageBlobs: Object.freeze(imageBlobs),
    ...(preview ? { preview } : {})
  });
}

export async function importPfanimArchive(
  repository: AnimationRepository,
  archive: Blob | Uint8Array,
  conflictResolution: AnimationBundleConflictResolution = "abort",
  limits: PfanimArchiveLimits = {}
): Promise<AnimationRepositoryValueMutationResult<PersistedAnimationProjectBundle>> {
  const parsed = await parsePfanimArchive(archive, limits);
  return repository.importProjectBundle({
    ...parsed,
    conflictResolution
  });
}
