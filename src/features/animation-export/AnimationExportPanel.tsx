import { strToU8 } from "fflate";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Surface } from "../../components/ui";
import {
  normalizeAnimationExportBaseName,
  createAnimationFrameFileName,
  DIRECTION_IDS,
  resolveSpriteSheetLayout,
  type SpriteSheetSourceFrame
} from "../../domain/animation";
import type {
  AnimationClip,
  AnimationPartAsset,
  AnimationProject,
  StableId
} from "../../schemas";
import {
  AnimationExportCancelledError,
  AnimationWorkerCancelledError,
  asSpriteSheetSourceFrames,
  canRunAnimationExport,
  createBrowserPngEncoder,
  createMetadataJsonBlob,
  composeSpriteSheetForExport,
  createBrowserAnimationExportWorkerController,
  createSpriteSheetMetadata,
  downloadBlob,
  encodeImagesForExport,
  packageFilesForExport,
  prepareGodot4Package,
  preparePfanimArchive,
  validateAnimationExport,
  type AnimationExportWorkerController,
  type AnimationExportJobState,
  type AnimationWorkerExportIdentity,
  type AnimationWorkerExportProgress,
  type PngEncoder
} from "../../services";
import styles from "./AnimationExportPanel.module.css";

export type AnimationExportKind =
  | "sheet"
  | "metadata"
  | "frames"
  | "project"
  | "godot4";

export interface AnimationExportPanelProps {
  readonly project: AnimationProject;
  readonly projectRevision?: number;
  readonly clip: AnimationClip | null;
  readonly frames: readonly SpriteSheetSourceFrame[];
  readonly productionDiagnostics?: readonly Readonly<{
    severity: "error" | "warning";
    message: string;
    direction?: SpriteSheetSourceFrame["direction"];
    frameIndex?: number;
  }>[];
  readonly missingBlobIds?: readonly StableId[];
  readonly partAssets: readonly AnimationPartAsset[];
  readonly readImageBlob: (blobId: StableId) => Promise<Blob>;
  readonly readPreviewBlob?: (previewId: StableId) => Promise<Blob>;
  readonly pngEncoder?: PngEncoder;
  readonly onDownload?: (blob: Blob, fileName: string) => void;
  readonly now?: () => string;
}

const STATUS_LABELS: Readonly<Record<AnimationExportJobState["status"], string>> = {
  idle: "Bereit",
  validating: "Wird geprüft …",
  rendering: "Frames werden vorbereitet …",
  encoding: "PNG-Dateien werden kodiert …",
  packaging: "Paket wird erstellt …",
  completed: "Export abgeschlossen",
  cancelled: "Export abgebrochen",
  failed: "Export fehlgeschlagen"
};

function defaultNow(): string {
  return new Date().toISOString();
}

export function AnimationExportPanel({
  project,
  projectRevision = 0,
  clip,
  frames,
  productionDiagnostics = [],
  missingBlobIds = [],
  partAssets,
  readImageBlob,
  readPreviewBlob,
  pngEncoder = createBrowserPngEncoder(),
  onDownload = downloadBlob,
  now = defaultNow
}: AnimationExportPanelProps) {
  const [warningsConfirmed, setWarningsConfirmed] = useState(false);
  const [job, setJob] = useState<AnimationExportJobState>({ status: "idle" });
  const activeAbortRef = useRef<AbortController | null>(null);
  const previousIdentityRef = useRef<string | null>(null);
  const workerRef = useRef<AnimationExportWorkerController | null | undefined>(
    undefined
  );
  const jobSequenceRef = useRef(0);
  const currentRevisionRef = useRef(projectRevision);
  currentRevisionRef.current = projectRevision;
  if (workerRef.current === undefined) {
    workerRef.current = createBrowserAnimationExportWorkerController();
  }
  useEffect(
    () => () => {
      activeAbortRef.current?.abort();
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );
  useEffect(() => {
    const identity = `${project.projectId}:${projectRevision}`;
    if (
      previousIdentityRef.current !== null &&
      previousIdentityRef.current !== identity
    ) {
      activeAbortRef.current?.abort();
    }
    previousIdentityRef.current = identity;
  }, [project.projectId, projectRevision]);
  const sourceFrames = useMemo(() => asSpriteSheetSourceFrames(frames), [frames]);
  const validation = useMemo(
    () =>
      validateAnimationExport({
        project,
        clip,
        frames: sourceFrames,
        missingBlobIds,
        productionDiagnostics
      }),
    [clip, missingBlobIds, productionDiagnostics, project, sourceFrames]
  );
  const isRunning = ["validating", "rendering", "encoding", "packaging"].includes(
    job.status
  );
  const canExport = canRunAnimationExport(validation, warningsConfirmed) && !isRunning;
  const baseName = normalizeAnimationExportBaseName(project.name, project.projectId);

  const workerIdentity = (): AnimationWorkerExportIdentity => ({
    projectId: project.projectId,
    projectRevision,
    currentProjectRevision: () => currentRevisionRef.current,
    nextJobId: (operation) => {
      jobSequenceRef.current += 1;
      return `${operation}-${project.projectId}-${projectRevision}-${jobSequenceRef.current}`;
    }
  });

  const reportProgress = ({
    stage,
    completed,
    total
  }: AnimationWorkerExportProgress) => {
    if (stage === "validating") setJob({ status: "validating" });
    else if (stage === "rendering") {
      setJob({ status: "rendering", completed, total });
    } else if (stage === "encoding") {
      setJob({ status: "encoding", completed, total });
    } else setJob({ status: "packaging" });
  };

  const runExport = async (kind: AnimationExportKind) => {
    if (!clip || !canRunAnimationExport(validation, warningsConfirmed)) return;
    const abort = new AbortController();
    activeAbortRef.current = abort;
    setJob({ status: "validating" });
    try {
      const layout = resolveSpriteSheetLayout({
        frameSize: project.frameProfile.frameSize,
        frameCount: clip.frameCount
      });
      const metadata = createSpriteSheetMetadata({ project, clip, layout });
      const operationOptions = {
        controller: workerRef.current ?? null,
        identity: workerIdentity(),
        signal: abort.signal,
        onProgress: reportProgress
      } as const;
      let file: Readonly<{ name: string; blob: Blob }>;
      if (kind === "sheet") {
        const sheet = await composeSpriteSheetForExport(
          layout,
          sourceFrames,
          operationOptions
        );
        const [encoded] = await encodeImagesForExport(
          [{ name: `${baseName}_walk.png`, image: sheet }],
          pngEncoder,
          operationOptions
        );
        if (!encoded) throw new Error("Das SpriteSheet wurde nicht kodiert.");
        file = {
          name: encoded.name,
          blob: new Blob([Uint8Array.from(encoded.bytes).buffer], {
            type: encoded.mimeType
          })
        };
      } else if (kind === "metadata") {
        setJob({ status: "packaging" });
        file = {
          name: `${baseName}_walk.json`,
          blob: createMetadataJsonBlob(metadata)
        };
      } else if (kind === "frames") {
        setJob({ status: "rendering", completed: 64, total: 64 });
        const ordered = [...sourceFrames].sort(
          (left, right) =>
            DIRECTION_IDS.indexOf(left.direction) -
              DIRECTION_IDS.indexOf(right.direction) ||
            left.frameIndex - right.frameIndex
        );
        const encoded = await encodeImagesForExport(
          ordered.map((source) => ({
            name: createAnimationFrameFileName(
              source.direction,
              source.frameIndex
            ),
            image: source.frame
          })),
          pngEncoder,
          operationOptions
        );
        const archive = await packageFilesForExport(
          [
            ...encoded.map(({ name, bytes }) => ({
              path: `frames/${name}`,
              bytes
            })),
            {
              path: "frames/metadata.json",
              bytes: strToU8(`${JSON.stringify(metadata, null, 2)}\n`)
            }
          ],
          "application/zip",
          operationOptions
        );
        file = {
          name: `${baseName}_frames.zip`,
          blob: archive
        };
      } else if (kind === "project") {
        setJob({ status: "packaging" });
        const prepared = await preparePfanimArchive({
          project,
          partAssets,
          exportedAt: now(),
          readImageBlob,
          ...(readPreviewBlob ? { readPreviewBlob } : {})
        });
        file = {
          name: `${baseName}.pfanim`,
          blob: await packageFilesForExport(
            prepared.entries,
            prepared.mimeType,
            operationOptions
          )
        };
      } else {
        const sheet = await composeSpriteSheetForExport(
          layout,
          sourceFrames,
          operationOptions
        );
        const [encoded] = await encodeImagesForExport(
          [{ name: `${baseName}_walk.png`, image: sheet }],
          pngEncoder,
          operationOptions
        );
        if (!encoded) throw new Error("Das Godot-SpriteSheet wurde nicht kodiert.");
        const sheetPng = new Blob([Uint8Array.from(encoded.bytes).buffer], {
          type: encoded.mimeType
        });
        if (abort.signal.aborted) throw new AnimationExportCancelledError();
        setJob({ status: "packaging" });
        const godotPackage = await prepareGodot4Package({
          metadata,
          sheetPng,
          packageName: baseName
        });
        file = {
          name: `${baseName}_godot4.zip`,
          blob: await packageFilesForExport(
            godotPackage.entries,
            "application/zip",
            operationOptions
          )
        };
      }
      if (abort.signal.aborted) throw new AnimationExportCancelledError();
      onDownload(file.blob, file.name);
      setJob({ status: "completed", files: Object.freeze([file]) });
    } catch (error) {
      if (
        error instanceof AnimationExportCancelledError ||
        error instanceof AnimationWorkerCancelledError ||
        abort.signal.aborted
      ) {
        setJob({ status: "cancelled" });
      } else {
        setJob({
          status: "failed",
          message: error instanceof Error ? error.message : "Der Export ist fehlgeschlagen."
        });
      }
    } finally {
      if (activeAbortRef.current === abort) activeAbortRef.current = null;
    }
  };

  return (
    <Surface
      as="section"
      id="animation-export-panel"
      className={styles.panel}
      tone="raised"
      aria-labelledby="animation-export-title"
    >
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Produktion</span>
          <h2 id="animation-export-title">Export</h2>
        </div>
        <Badge
          tone={job.status === "completed" ? "success" : job.status === "failed" ? "neutral" : "accent"}
          role="status"
          aria-live="polite"
        >
          {STATUS_LABELS[job.status]}
        </Badge>
      </div>

      {validation.hardErrors.length > 0 ? (
        <div className={styles.errors} role="alert">
          <strong>{validation.hardErrors.length} Exportfehler blockieren die Ausgabe.</strong>
          <ul>{validation.hardErrors.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul>
        </div>
      ) : null}
      {validation.warnings.length > 0 ? (
        <div className={styles.warnings}>
          <strong>{validation.warnings.length} Warnungen prüfen</strong>
          <ul>{validation.warnings.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul>
          <label>
            <input
              type="checkbox"
              checked={warningsConfirmed}
              onChange={(event) => setWarningsConfirmed(event.currentTarget.checked)}
            />
            <span>Warnungen geprüft und Export ausdrücklich freigeben</span>
          </label>
        </div>
      ) : null}

      <div className={styles.actions} aria-label="Exportformate">
        <button type="button" disabled={!canExport} onClick={() => void runExport("sheet")}>
          SpriteSheet PNG
        </button>
        <button type="button" disabled={!canExport} onClick={() => void runExport("metadata")}>
          Metadaten JSON
        </button>
        <button type="button" disabled={!canExport} onClick={() => void runExport("frames")}>
          64 Einzelbilder
        </button>
        <button type="button" disabled={!canExport} onClick={() => void runExport("project")}>
          Projektbundle .pfanim
        </button>
        <button type="button" disabled={!canExport} onClick={() => void runExport("godot4")}>
          Godot 4 Paket
        </button>
      </div>

      {job.status === "encoding" || job.status === "rendering" ? (
        <progress value={job.completed} max={job.total} aria-label="Exportfortschritt">
          {job.completed} / {job.total}
        </progress>
      ) : null}
      {isRunning ? (
        <button
          className={styles.cancel}
          type="button"
          onClick={() => activeAbortRef.current?.abort()}
        >
          Export abbrechen
        </button>
      ) : null}
      {job.status === "failed" ? <p className={styles.errors} role="alert">{job.message}</p> : null}
      {job.status === "completed" ? (
        <p className={styles.success} role="status">
          {job.files.map(({ name }) => name).join(", ")} wurde vollständig erzeugt.
        </p>
      ) : null}
    </Surface>
  );
}
