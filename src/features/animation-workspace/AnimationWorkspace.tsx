import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { Badge, Surface } from "../../components/ui";
import {
  HUMANOID_WALK_CLIP_ID,
  HUMANOID_WALK_FRAME_COUNT,
  HUMANOID_WALK_PHASES,
  IDENTITY_FRAME_DELTA,
  JOINT_IDS,
  MAX_PROJECT_LAYER_OFFSET,
  MIN_PROJECT_LAYER_OFFSET,
  EQUIPMENT_PART_SLOT_IDS,
  PART_SLOT_IDS,
  applyFrameLayerOrder,
  collectFrameOverrideWarnings,
  findFrameOverride,
  getBuiltInRigTemplate,
  getDefaultLayerGroup,
  getMirroredSourceDirection,
  getDirectionDrawOrder,
  isDirection,
  resolveDirectionDrawOrder,
  resolveRuntimeDirectionRig,
  normalizeFrameOverride,
  type FrameEdge,
  type FrameOverride,
  type FrameOverrideAddress,
  type JointId,
  type LayerGroup,
  type MirrorPolicy,
  type PartSlot,
  type RenderDiagnostic,
  type RenderedFrame,
  type TransformDelta
} from "../../domain/animation";
import {
  PartImportPanel,
  createPartCoverageMatrix,
  findPartAssetForSource,
  type PartCoverageCell,
  type PartImportCommitDefinition,
  type PartImportCommitResult
} from "../animation-part-import";
import {
  AnchorEditor,
  type AnchorEditorCommitDefinition,
  type AnchorEditorCommitResult,
  type PartBlobLoadResult
} from "../animation-anchor-editor";
import type {
  AnimationClip,
  AnimationPartAsset,
  AnimationProject,
  StableId
} from "../../schemas";
import type { ImageDecoder } from "../../services";
import {
  DIRECTION_LABELS,
  OVERLAY_LABELS,
  PANEL_LABELS,
  WORKSPACE_OVERLAY_IDS,
  WORKSPACE_PANEL_IDS,
  WORKSPACE_SLOT_COUNT,
  WORKSPACE_SLOT_GROUPS,
  WORKSPACE_ZOOM_LEVELS,
  animationWorkspaceReducer,
  createAnimationWorkspaceState,
  getActiveWorkspaceClip,
  getPartSlotDefinition,
  getWorkspaceDirectionOptions,
  type AnimationWorkspaceAction,
  type AnimationWorkspaceState,
  type WorkspaceInspectorContext,
  type WorkspaceLayout,
  type WorkspacePanel,
  type WorkspaceSidePanel
} from "./animationWorkspaceModel";
import styles from "./AnimationWorkspace.module.css";
import { RenderedFrameCanvas } from "./RenderedFrameCanvas";
import { RigOverlay } from "./RigOverlay";
import {
  useNeutralPoseFrame,
  type NeutralPoseFrameState
} from "./useNeutralPoseFrame";
import { useWorkspaceLayout } from "./useWorkspaceLayout";
import type { AnimationFrameScheduler } from "./animationPlayback";
import {
  MAX_ONION_SKIN_OPACITY,
  MIN_ONION_SKIN_OPACITY,
  ONION_SKIN_MODES,
  resolveOnionSkinLayers,
  type OnionSkinMode
} from "./onionSkin";
import {
  useAnimationPlayback,
  type AnimationPlaybackController
} from "./useAnimationPlayback";
import { AnimationExportPanel } from "../animation-export";

export type WorkspaceSaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "failed";

export type PartLayerOffsetCommitResult =
  | Readonly<{ status: "ok" }>
  | Readonly<{ status: "error"; message: string }>;

export type MirrorPolicyCommitResult = PartLayerOffsetCommitResult;
export type FrameOverrideCommitResult = PartLayerOffsetCommitResult;
export type PartEquipmentCommitResult = PartLayerOffsetCommitResult;

export interface AnimationWorkspaceProps {
  readonly project: AnimationProject;
  readonly canSave: boolean;
  readonly saveStatus: WorkspaceSaveStatus;
  readonly saveError: string | null;
  readonly sourceError: string | null;
  readonly projectRevision?: number;
  readonly playbackScheduler?: AnimationFrameScheduler;
  readonly onSave: () => void;
  readonly canUndo?: boolean;
  readonly canRedo?: boolean;
  readonly onUndo?: () => void;
  readonly onRedo?: () => void;
  readonly partAssets?: readonly AnimationPartAsset[];
  readonly missingPartAssetIds?: readonly StableId[];
  readonly partAssetLoadError?: string | null;
  readonly partAssetsLoading?: boolean;
  readonly libraryPartAssets?: readonly AnimationPartAsset[];
  readonly libraryPartAssetsLoading?: boolean;
  readonly libraryPartAssetError?: string | null;
  readonly imageDecoder?: ImageDecoder | null;
  readonly onImportPart?: (
    definition: PartImportCommitDefinition
  ) => Promise<PartImportCommitResult>;
  readonly onLoadPartBlob?: (blobId: StableId) => Promise<PartBlobLoadResult>;
  readonly onLoadPreviewBlob?: (previewId: StableId) => Promise<PartBlobLoadResult>;
  readonly onConfigurePart?: (
    definition: AnchorEditorCommitDefinition
  ) => Promise<AnchorEditorCommitResult>;
  readonly onEquipPartAsset?: (
    assetId: StableId
  ) => Promise<PartEquipmentCommitResult>;
  readonly onRemovePartAsset?: (
    assetId: StableId
  ) => Promise<PartEquipmentCommitResult>;
  readonly onSetPartLayerOffset?: (
    assetId: StableId,
    layerOffset: number
  ) => Promise<PartLayerOffsetCommitResult>;
  readonly onSetProjectMirrorPolicy?: (
    mirrorPolicy: MirrorPolicy
  ) => Promise<MirrorPolicyCommitResult>;
  readonly onSetPartMirrorPolicy?: (
    assetId: StableId,
    mirrorPolicy: MirrorPolicy
  ) => Promise<MirrorPolicyCommitResult>;
  readonly onConfirmMirrorReview?: (
    assetId: StableId,
    sourceUpdatedAt: string,
    targetDirection: AnimationWorkspaceState["direction"]
  ) => Promise<MirrorPolicyCommitResult>;
  readonly onCommitFrameOverride?: (
    address: FrameOverrideAddress,
    override: FrameOverride | null
  ) => Promise<FrameOverrideCommitResult>;
  readonly onResetDirectionOverrides?: (
    clipId: StableId,
    direction: AnimationWorkspaceState["direction"]
  ) => Promise<FrameOverrideCommitResult>;
}

const DISCONNECTED_PART_IMPORT: NonNullable<
  AnimationWorkspaceProps["onImportPart"]
> = async () => ({
  status: "error",
  message: "Der Part-Import ist in dieser Ansicht nicht verbunden."
});

const EMPTY_PART_ASSETS: readonly AnimationPartAsset[] = Object.freeze([]);
const EMPTY_EXPORT_FRAMES: readonly Readonly<{
  direction: AnimationWorkspaceState["direction"];
  frameIndex: number;
  frame: RenderedFrame;
}>[] = Object.freeze([]);

function asExportFrames(
  frames: readonly Readonly<{
    direction: AnimationWorkspaceState["direction"];
    frameIndex: number;
    frame: RenderedFrame;
  }>[]
) {
  return Object.freeze(
    frames.map(({ direction, frameIndex, frame }) =>
      Object.freeze({ direction, frameIndex, frame })
    )
  );
}

const DISCONNECTED_PART_BLOB_LOADER: NonNullable<
  AnimationWorkspaceProps["onLoadPartBlob"]
> = async () => ({
  status: "error",
  message: "Das Originalbild ist in dieser Ansicht nicht verbunden."
});

const DISCONNECTED_PART_CONFIGURATION: NonNullable<
  AnimationWorkspaceProps["onConfigurePart"]
> = async () => ({
  status: "error",
  message: "Die Ankerpersistenz ist in dieser Ansicht nicht verbunden."
});

const DISCONNECTED_LAYER_CONFIGURATION: NonNullable<
  AnimationWorkspaceProps["onSetPartLayerOffset"]
> = async () => ({
  status: "error",
  message: "Die Layerpersistenz ist in dieser Ansicht nicht verbunden."
});

const DISCONNECTED_MIRROR_CONFIGURATION = async (): Promise<MirrorPolicyCommitResult> => ({
  status: "error",
  message: "Die Spiegelentscheidung ist in dieser Ansicht nicht verbunden."
});

const DISCONNECTED_FRAME_OVERRIDE = async (): Promise<FrameOverrideCommitResult> => ({
  status: "error",
  message: "Die Framekorrekturen sind in dieser Ansicht nicht verbunden."
});

const DISCONNECTED_EQUIPMENT = async (): Promise<PartEquipmentCommitResult> => ({
  status: "error",
  message: "Die Ausrüstungsbibliothek ist in dieser Ansicht nicht verbunden."
});

type ReadyWalkCycle = Extract<
  NonNullable<NeutralPoseFrameState["walkCycle"]>,
  Readonly<{ status: "ok" }>
>;

function isPlayableWalkCycle(
  activeClip: AnimationClip | null,
  _direction: AnimationWorkspaceState["direction"],
  walkCycle: NeutralPoseFrameState["walkCycle"]
): walkCycle is ReadyWalkCycle {
  return (
    activeClip?.templateId === HUMANOID_WALK_CLIP_ID &&
    activeClip.action === "walk" &&
    activeClip.frameCount === HUMANOID_WALK_FRAME_COUNT &&
    activeClip.loop &&
    walkCycle?.status === "ok" &&
    walkCycle.frames.length === activeClip.frameCount
  );
}

function playbackAvailabilityMessage(
  activeClip: AnimationClip | null,
  renderState: NeutralPoseFrameState,
  enabled: boolean,
  reducedMotion: boolean
): string {
  if (enabled) {
    return reducedMotion
      ? "Manuelle Wiedergabe ist bereit; reduzierte Bewegung verhindert jeden automatischen Start."
      : "Manuelle Wiedergabe ist bereit und startet nie automatisch.";
  }
  if (!activeClip) return "Wiedergabe benötigt einen Clip.";
  if (activeClip.templateId !== HUMANOID_WALK_CLIP_ID) {
    return `Wiedergabe benötigt den Clip ${HUMANOID_WALK_CLIP_ID}.`;
  }
  if (renderState.status === "loading") {
    return "Die Walk-Frames werden noch erzeugt.";
  }
  return "Wiedergabe bleibt gesperrt, bis alle Produktionsvoraussetzungen der gewählten Richtung erfüllt sind.";
}

const LAYER_GROUP_LABELS: Readonly<Record<LayerGroup, string>> = Object.freeze({
  rearAccessories: "hintere Accessoires",
  farEquipment: "ferne Ausrüstung",
  farLimbs: "ferne Gliedmaßen",
  core: "Körperkern",
  nearLimbs: "nahe Gliedmaßen",
  head: "Kopf und Gesicht",
  frontEquipment: "vordere Ausrüstung"
});

const FRAME_EDGE_LABELS: Readonly<Record<FrameEdge, string>> = Object.freeze({
  left: "links",
  right: "rechts",
  top: "oben",
  bottom: "unten"
});

function renderDiagnosticLabel(issue: RenderDiagnostic): string {
  const severity = issue.severity === "error" ? "Fehler" : "Warnung";
  const bounds = issue.bounds
    ? ` Bounding-Box: X ${issue.bounds.x}–${issue.bounds.x + issue.bounds.width}, Y ${issue.bounds.y}–${issue.bounds.y + issue.bounds.height}.`
    : "";
  const edges = issue.edges?.length
    ? ` Betroffene Framekante${issue.edges.length === 1 ? "" : "n"}: ${issue.edges.map((edge) => FRAME_EDGE_LABELS[edge]).join(", ")}.`
    : "";
  return `${severity}: ${issue.message}${bounds}${edges}`;
}

const SAVE_STATUS_COPY: Readonly<Record<WorkspaceSaveStatus, string>> =
  Object.freeze({
    idle: "Noch nicht gespeichert",
    dirty: "Ungespeicherte Änderungen",
    saving: "Änderungen werden gespeichert …",
    saved: "Alle Änderungen gespeichert",
    failed: "Speichern fehlgeschlagen"
  });

const PANE_HEADING_IDS: Readonly<Record<WorkspacePanel, string>> =
  Object.freeze({
    parts: "animation-workspace-parts-title",
    viewport: "animation-workspace-viewport-title",
    inspector: "animation-workspace-inspector-title",
    timeline: "animation-workspace-timeline-title"
  });

const SMALL_TAB_IDS: Readonly<Record<WorkspacePanel, string>> = Object.freeze({
  parts: "animation-workspace-parts-tab",
  viewport: "animation-workspace-viewport-tab",
  inspector: "animation-workspace-inspector-tab",
  timeline: "animation-workspace-timeline-tab"
});

function panelIsVisible(
  panel: WorkspacePanel,
  layout: WorkspaceLayout,
  state: AnimationWorkspaceState
): boolean {
  if (layout === "desktop") return true;
  if (layout === "small") return state.activePanel === panel;
  if (panel === "parts" || panel === "inspector") {
    return state.activeSidePanel === panel;
  }
  return true;
}

function clipLabel(clip: AnimationClip): string {
  const action = clip.action === "walk" ? "Walk" : clip.action;
  return `${action} · ${clip.frameCount} Frames`;
}

interface ToolbarProps {
  readonly project: AnimationProject;
  readonly state: AnimationWorkspaceState;
  readonly canSave: boolean;
  readonly saveStatus: WorkspaceSaveStatus;
  readonly saveError: string | null;
  readonly sourceError: string | null;
  readonly dispatch: (action: AnimationWorkspaceAction) => void;
  readonly onSave: () => void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly playback: AnimationPlaybackController;
  readonly playbackEnabled: boolean;
  readonly playbackMessage: string;
  readonly exportEnabled: boolean;
  readonly exportExpanded: boolean;
  readonly onToggleExport: () => void;
}

function WorkspaceToolbar({
  project,
  state,
  canSave,
  saveStatus,
  saveError,
  sourceError,
  dispatch,
  onSave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  playback,
  playbackEnabled,
  playbackMessage,
  exportEnabled,
  exportExpanded,
  onToggleExport
}: ToolbarProps) {
  const directionOptions = useMemo(
    () => getWorkspaceDirectionOptions(project),
    [project]
  );

  const selectClip = (clipId: string) => {
    const clip = project.clips.find((candidate) => candidate.clipId === clipId);
    if (!clip) return;
    dispatch({
      type: "clipSelected",
      clipId: clip.clipId,
      frameCount: clip.frameCount
    });
  };

  return (
    <Surface
      as="section"
      className={styles.toolbar}
      tone="raised"
      aria-labelledby="animation-workspace-view-title"
    >
      <div className={styles.projectIdentity}>
        <span className={styles.eyebrow}>Animation Workspace</span>
        <h1 id="animation-workspace-view-title">{project.name}</h1>
        <span className={styles.projectId}>{project.projectId}</span>
      </div>

      <div className={styles.toolbarField}>
        <label htmlFor="animation-workspace-direction">Richtung</label>
        <select
          id="animation-workspace-direction"
          value={state.direction}
          onChange={(event) => {
            const direction = event.currentTarget.value;
            if (isDirection(direction)) {
              dispatch({ type: "directionSelected", direction });
            }
          }}
        >
          {directionOptions.map((option) => (
            <option key={option.direction} value={option.direction}>
              {option.label} · {option.source === "authored"
                ? "Quelle"
                : option.source === "mirrored"
                  ? "gespiegelt"
                  : "eigene Quelle erforderlich"}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.toolbarField}>
        <label htmlFor="animation-workspace-clip">Clip</label>
        <select
          id="animation-workspace-clip"
          disabled={project.clips.length === 0}
          value={state.clipId ?? ""}
          onChange={(event) => selectClip(event.currentTarget.value)}
        >
          {project.clips.length === 0 ? (
            <option value="">Kein Clip vorhanden</option>
          ) : null}
          {project.clips.map((clip) => (
            <option key={clip.clipId} value={clip.clipId}>
              {clipLabel(clip)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.saveCluster}>
        <span className={styles.toolbarLabel}>Speicherstatus</span>
        <Badge
          tone={saveStatus === "failed" ? "neutral" : saveStatus === "saved" ? "success" : "accent"}
          role="status"
          aria-live="polite"
        >
          {SAVE_STATUS_COPY[saveStatus]}
        </Badge>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={!canSave}
          onClick={onSave}
        >
          Jetzt speichern
        </button>
        <div className={styles.playbackButtons} role="group" aria-label="Projekt-History">
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={!canUndo}
            aria-label="Letzte Projektänderung rückgängig machen"
            aria-keyshortcuts="Control+Z Meta+Z"
            onClick={onUndo}
          >
            Rückgängig
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={!canRedo}
            aria-label="Projektänderung wiederholen"
            aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z"
            onClick={onRedo}
          >
            Wiederholen
          </button>
        </div>
      </div>

      <div className={styles.futureActions}>
        <div className={styles.playbackControlGroup}>
          <span className={styles.toolbarLabel}>Wiedergabe</span>
          <div
            className={styles.playbackButtons}
            role="group"
            aria-label="Walk-Wiedergabe steuern"
          >
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!playbackEnabled}
              aria-label="Vorheriger Frame"
              onClick={playback.previous}
            >
              ←
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!playbackEnabled}
              aria-describedby="animation-playback-availability"
              onClick={playback.isPlaying ? playback.pause : playback.play}
            >
              {playback.isPlaying ? "Pause" : "Abspielen"}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!playbackEnabled}
              aria-label="Stoppen und zu Frame 1"
              onClick={playback.stop}
            >
              Stopp
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={!playbackEnabled}
              aria-label="Nächster Frame"
              onClick={playback.next}
            >
              →
            </button>
          </div>
          <span
            id="animation-playback-availability"
            className={styles.actionReason}
          >
            {playbackMessage}
          </span>
        </div>
        <div className={styles.exportControlGroup}>
          <span className={styles.toolbarLabel}>Ausgabe</span>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={!exportEnabled}
            aria-expanded={exportExpanded}
            aria-controls="animation-export-panel"
            aria-describedby="animation-export-unavailable"
            onClick={onToggleExport}
          >
            Exportieren
          </button>
          <span id="animation-export-unavailable" className={styles.actionReason}>
            {exportEnabled
              ? "Alle 64 Produktionsframes sind für die Exportprüfung bereit."
              : "Export bleibt bis zur Renderpipeline mit 64 validen Frames gesperrt."}
          </span>
        </div>
      </div>

      {saveError ? (
        <p className={styles.errorNotice} role="alert">
          {saveError}
        </p>
      ) : null}
      {sourceError ? (
        <p className={styles.errorNotice} role="alert">
          {sourceError}
        </p>
      ) : null}
    </Surface>
  );
}

interface PaneNavigationProps {
  readonly layout: WorkspaceLayout;
  readonly state: AnimationWorkspaceState;
  readonly onSelectPanel: (panel: WorkspacePanel) => void;
  readonly onSelectSidePanel: (panel: WorkspaceSidePanel) => void;
}

function PaneNavigation({
  layout,
  state,
  onSelectPanel,
  onSelectSidePanel
}: PaneNavigationProps) {
  if (layout === "desktop") return null;

  if (layout === "medium") {
    return (
      <Surface className={styles.paneNavigation} tone="soft">
        <span className={styles.toolbarLabel}>Seitenpaneel</span>
        <div className={styles.segmentedControl} role="group" aria-label="Seitenpaneel auswählen">
          {(["parts", "inspector"] as const).map((panel) => (
            <button
              key={panel}
              type="button"
              aria-pressed={state.activeSidePanel === panel}
              aria-controls={`${panel}-workspace-panel`}
              onClick={() => onSelectSidePanel(panel)}
            >
              {PANEL_LABELS[panel]}
            </button>
          ))}
        </div>
      </Surface>
    );
  }

  const selectAdjacentTab = (
    event: KeyboardEvent<HTMLButtonElement>,
    panel: WorkspacePanel
  ) => {
    const currentIndex = WORKSPACE_PANEL_IDS.indexOf(panel);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % WORKSPACE_PANEL_IDS.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + WORKSPACE_PANEL_IDS.length) % WORKSPACE_PANEL_IDS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = WORKSPACE_PANEL_IDS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextPanel = WORKSPACE_PANEL_IDS[nextIndex];
    if (nextPanel) onSelectPanel(nextPanel);
  };

  return (
    <Surface className={styles.paneNavigation} tone="soft">
      <div className={styles.smallTabs} role="tablist" aria-label="Workspace-Paneele">
        {WORKSPACE_PANEL_IDS.map((panel) => (
          <button
            id={SMALL_TAB_IDS[panel]}
            key={panel}
            type="button"
            role="tab"
            aria-controls={`${panel}-workspace-panel`}
            aria-selected={state.activePanel === panel}
            tabIndex={state.activePanel === panel ? 0 : -1}
            onClick={() => onSelectPanel(panel)}
            onKeyDown={(event) => selectAdjacentTab(event, panel)}
          >
            {PANEL_LABELS[panel]}
          </button>
        ))}
      </div>
    </Surface>
  );
}

interface PartInventoryProps {
  readonly project: AnimationProject;
  readonly direction: AnimationWorkspaceState["direction"];
  readonly selectedSlot: PartSlot | null;
  readonly partAssets: readonly AnimationPartAsset[];
  readonly missingPartAssetIds: readonly StableId[];
  readonly partAssetLoadError: string | null;
  readonly partAssetsLoading: boolean;
  readonly libraryPartAssets: readonly AnimationPartAsset[];
  readonly libraryPartAssetsLoading: boolean;
  readonly libraryPartAssetError: string | null;
  readonly imageDecoder: ImageDecoder | null;
  readonly onImportPart: (
    definition: PartImportCommitDefinition
  ) => Promise<PartImportCommitResult>;
  readonly onEquipPartAsset: NonNullable<
    AnimationWorkspaceProps["onEquipPartAsset"]
  >;
  readonly onRemovePartAsset: NonNullable<
    AnimationWorkspaceProps["onRemovePartAsset"]
  >;
  readonly unresolvedReferenceCount: number;
  readonly onConfirmMirrorReview: NonNullable<
    AnimationWorkspaceProps["onConfirmMirrorReview"]
  >;
  readonly dispatch: (action: AnimationWorkspaceAction) => void;
  readonly layout: WorkspaceLayout;
}

function PartInventory({
  project,
  direction,
  selectedSlot,
  partAssets,
  missingPartAssetIds,
  partAssetLoadError,
  partAssetsLoading,
  libraryPartAssets,
  libraryPartAssetsLoading,
  libraryPartAssetError,
  imageDecoder,
  onImportPart,
  onEquipPartAsset,
  onRemovePartAsset,
  unresolvedReferenceCount,
  onConfirmMirrorReview,
  dispatch,
  layout
}: PartInventoryProps) {
  const [reviewCell, setReviewCell] = useState<PartCoverageCell | null>(null);
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [equipmentPendingId, setEquipmentPendingId] = useState<StableId | null>(null);
  const [equipmentMessage, setEquipmentMessage] = useState<string | null>(null);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedSlotDefinition = getPartSlotDefinition(selectedSlot);
  const existingPart = selectedSlot
    ? findPartAssetForSource(partAssets, selectedSlot, direction)
    : null;
  const mirrorSourceDirection = getMirroredSourceDirection(direction);
  const compatibleLibraryParts = selectedSlot
    ? libraryPartAssets.filter(
        (asset) =>
          asset.slot === selectedSlot &&
          (asset.direction === direction ||
            (project.directionSourceMode === "fiveAuthoredPlusMirror" &&
              asset.direction === mirrorSourceDirection))
      )
    : [];
  const selectedSlotIsEquipment = selectedSlot
    ? (EQUIPMENT_PART_SLOT_IDS as readonly PartSlot[]).includes(selectedSlot)
    : false;
  const coverage = createPartCoverageMatrix(project, partAssets);
  const coverageLabels = {
    authoredSource: "● Eigene Quelle",
    mirroredValid: "↔ Gültig gespiegelt",
    mirroredNeedsReview: "△ Prüfung erforderlich",
    mirrorForbidden: "⛔ Spiegelung verboten",
    missingSource: "× Quelle fehlt",
    optionalUnused: "– Optional ungenutzt",
    anchorsIncomplete: "! Anker unvollständig"
  } as const;
  const confirmReview = async () => {
    if (!reviewCell?.asset) return;
    setReviewPending(true);
    setReviewError(null);
    const result = await onConfirmMirrorReview(
      reviewCell.asset.assetId,
      reviewCell.asset.updatedAt,
      reviewCell.targetDirection
    );
    setReviewPending(false);
    if (result.status === "ok") {
      reviewTriggerRef.current?.focus();
      setReviewCell(null);
    } else {
      setReviewError(result.message);
    }
  };
  const equip = async (assetId: StableId) => {
    setEquipmentPendingId(assetId);
    setEquipmentError(null);
    setEquipmentMessage(null);
    const result = await onEquipPartAsset(assetId);
    setEquipmentPendingId(null);
    if (result.status === "ok") {
      setEquipmentMessage(existingPart ? "Teil wurde ersetzt." : "Teil wurde eingesetzt.");
    } else {
      setEquipmentError(result.message);
    }
  };
  const remove = async () => {
    if (!existingPart) return;
    setEquipmentPendingId(existingPart.assetId);
    setEquipmentError(null);
    setEquipmentMessage(null);
    const result = await onRemovePartAsset(existingPart.assetId);
    setEquipmentPendingId(null);
    if (result.status === "ok") setEquipmentMessage("Teil wurde aus dem Projekt entfernt und bleibt in der Bibliothek.");
    else setEquipmentError(result.message);
  };
  return (
    <Surface
      as="section"
      id="parts-workspace-panel"
      className={`${styles.panel} ${styles.inventory}`}
      tone="raised"
      aria-labelledby={PANE_HEADING_IDS.parts}
      {...(layout === "small"
        ? { role: "tabpanel", "aria-labelledby": SMALL_TAB_IDS.parts }
        : {})}
    >
      <div className={styles.panelHeading}>
        <div>
          <span className={styles.eyebrow}>Slots</span>
          <h2 id={PANE_HEADING_IDS.parts} tabIndex={-1}>Teileinventar</h2>
        </div>
        <Badge tone="neutral">{WORKSPACE_SLOT_COUNT} Slots</Badge>
      </div>
      <p className={styles.panelIntro}>
        Pflicht- und optionale Slots stammen direkt aus dem Humanoid-Domainkatalog.
      </p>

      {partAssetsLoading ? (
        <div className={styles.sourceNotice} role="status">
          <strong>Part-Metadaten werden geladen …</strong>
          <span>Projektzuweisungen bleiben bis zum Abschluss unverändert.</span>
        </div>
      ) : partAssetLoadError ? (
        <div className={styles.sourceNotice} role="alert">
          <strong>Part-Metadaten konnten nicht geladen werden</strong>
          <span>{partAssetLoadError}</span>
        </div>
      ) : unresolvedReferenceCount > 0 ? (
        <div className={styles.sourceNotice} role="status">
          <strong>Einige Part-Referenzen fehlen</strong>
          <span>
            {missingPartAssetIds.join(", ")} konnte{unresolvedReferenceCount === 1 ? "" : "n"}
            nicht als gespeicherte Part-Metadaten aufgelöst werden.
          </span>
        </div>
      ) : partAssets.length === 0 ? (
        <div className={styles.sourceNotice} role="status">
          <strong>Noch keine Teile zugewiesen</strong>
          <span>Der leere Katalog verändert das Projekt nicht.</span>
        </div>
      ) : (
        <div className={styles.sourceNotice} role="status">
          <strong>{partAssets.length} Part-{partAssets.length === 1 ? "Quelle" : "Quellen"} geladen</strong>
          <span>Importierte Quellen bleiben bis zur Ankerbearbeitung Produktionsentwürfe.</span>
        </div>
      )}

      <PartImportPanel
        selectedSlot={selectedSlot}
        selectedSlotLabel={selectedSlotDefinition?.label ?? null}
        direction={direction}
        directionLabel={DIRECTION_LABELS[direction]}
        decoder={imageDecoder}
        existingPart={existingPart}
        onCommit={onImportPart}
      />

      <section className={styles.equipmentLibrary} aria-labelledby="part-equipment-library-title">
        <div className={styles.equipmentHeading}>
          <div>
            <span className={styles.eyebrow}>Wiederverwendung</span>
            <h3 id="part-equipment-library-title">Kompatible Bibliotheksteile</h3>
          </div>
          {selectedSlotIsEquipment ? <Badge tone="accent">Equipment</Badge> : null}
        </div>
        {!selectedSlot ? (
          <p>Wähle zuerst eine Slotkarte.</p>
        ) : libraryPartAssetsLoading ? (
          <p role="status">Bibliotheksteile werden geladen …</p>
        ) : libraryPartAssetError ? (
          <p role="alert">{libraryPartAssetError}</p>
        ) : compatibleLibraryParts.length === 0 ? (
          <p role="status">Für {selectedSlotDefinition?.label} · {DIRECTION_LABELS[direction]} ist noch kein kompatibles Bibliotheksteil gespeichert.</p>
        ) : (
          <ul>
            {compatibleLibraryParts.map((asset) => {
              const assigned = existingPart?.assetId === asset.assetId;
              const mirroredSource = asset.direction !== direction;
              return (
                <li key={asset.assetId}>
                  <div>
                    <strong>{asset.label}</strong>
                    <span>
                      {DIRECTION_LABELS[asset.direction]}
                      {mirroredSource ? " · Spiegelquelle" : " · eigene Quelle"}
                      {asset.anchorStatus === "ready" ? " · Anker bereit" : " · Anker offen"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={assigned || equipmentPendingId !== null}
                    onClick={() => void equip(asset.assetId)}
                  >
                    {assigned ? "Eingesetzt" : existingPart ? "Ersetzen" : "Einsetzen"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {existingPart ? (
          <button
            className={styles.removeEquipmentButton}
            type="button"
            disabled={equipmentPendingId !== null}
            onClick={() => void remove()}
          >
            {existingPart.label} entfernen
          </button>
        ) : null}
        {equipmentMessage ? <p role="status">{equipmentMessage}</p> : null}
        {equipmentError ? <p className={styles.equipmentError} role="alert">{equipmentError}</p> : null}
      </section>

      <div className={styles.slotGroups}>
        {WORKSPACE_SLOT_GROUPS.map((group) => (
          <section key={group.id} className={styles.slotGroup} aria-labelledby={`slot-group-${group.id}`}>
            <h3 id={`slot-group-${group.id}`}>{group.label}</h3>
            <ul>
              {group.slots.map((slot) => {
                const source = findPartAssetForSource(
                  partAssets,
                  slot.id,
                  direction
                );
                const occupancyLabel = source
                  ? source.anchorStatus === "anchorsPending"
                    ? "Anker ausstehend"
                    : source.anchorStatus === "invalidAnchors"
                      ? "Anker ungültig"
                      : "Produktionsbereit"
                  : slot.required
                    ? "Fehlt"
                    : "Optional";
                return (
                  <li key={slot.id}>
                    <button
                      type="button"
                      className={styles.slotButton}
                      aria-label={`${slot.label}; ${slot.required ? "Erforderlich" : "Optional"}; ${occupancyLabel}`}
                      aria-pressed={selectedSlot === slot.id}
                      onClick={() =>
                        dispatch({ type: "slotSelected", slot: slot.id })
                      }
                    >
                      <span className={styles.slotName}>{slot.label}</span>
                      <span className={styles.slotMeta}>
                        <span>{slot.required ? "Erforderlich" : "Optional"}</span>
                        <span>{occupancyLabel}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <details className={styles.coverage}>
        <summary>Richtungs-Coverage</summary>
        <p role="status">
          {project.directionSourceMode === "singleDirectionPrototype"
            ? "Einrichtungsprototyp: nicht für einen produktionsfertigen 8-Richtungs-Export freigegeben."
            : coverage.readyForEightDirectionExport
              ? "Alle acht Richtungen sind für die Produktion aufgelöst."
              : `${coverage.blockers.length} Produktionsblocker müssen vor dem 8-Richtungs-Export geklärt werden.`}
        </p>
        <div className={styles.coverageScroller}>
          <table>
            <thead>
              <tr>
                <th scope="col">Slot</th>
                {coverage.directions.map((coverageDirection) => (
                  <th key={coverageDirection} scope="col">{DIRECTION_LABELS[coverageDirection]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coverage.rows.map((row) => (
                <tr key={row.slot}>
                  <th scope="row">{row.label}</th>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.targetDirection}
                      data-coverage={cell.status}
                      title={cell.message}
                    >
                      <span>{coverageLabels[cell.status]}</span>
                      {cell.status === "mirroredNeedsReview" ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            reviewTriggerRef.current = event.currentTarget;
                            setReviewError(null);
                            setReviewCell(cell);
                          }}
                        >
                          Prüfen
                        </button>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {reviewCell?.asset ? (
        <div
          className={styles.reviewBackdrop}
          role="presentation"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !reviewPending) {
              reviewTriggerRef.current?.focus();
              setReviewCell(null);
            }
          }}
        >
          <section
            className={styles.reviewDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mirror-review-title"
            aria-describedby="mirror-review-description"
          >
            <span className={styles.eyebrow}>Explizite Produktionsprüfung</span>
            <h3 id="mirror-review-title">Gespiegelte Quelle freigeben?</h3>
            <p id="mirror-review-description">
              {reviewCell.asset.label} wird von {DIRECTION_LABELS[reviewCell.sourceDirection ?? reviewCell.asset.direction]} nach {DIRECTION_LABELS[reviewCell.targetDirection]} gespiegelt. Prüfe das Ergebnis sichtbar; Schließen oder Abbrechen speichert keine Freigabe.
            </p>
            <ul>
              <li>Waffe, Schild und einseitige Taschen bleiben logisch korrekt.</li>
              <li>Narben, Schrift und Wappen erscheinen nicht seitenverkehrt.</li>
              <li>Die feste Weltlichtseite bleibt trotz Spiegelung plausibel.</li>
            </ul>
            {reviewError ? <p role="alert">{reviewError}</p> : null}
            <div className={styles.reviewActions}>
              <button
                type="button"
                disabled={reviewPending}
                onClick={() => {
                  reviewTriggerRef.current?.focus();
                  setReviewCell(null);
                }}
              >
                Abbrechen
              </button>
              <button
                type="button"
                autoFocus
                disabled={reviewPending}
                onClick={() => void confirmReview()}
              >
                {reviewPending ? "Speichert …" : "Spiegelung bestätigen"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </Surface>
  );
}

interface RigViewportProps {
  readonly project: AnimationProject;
  readonly state: AnimationWorkspaceState;
  readonly activeClip: AnimationClip | null;
  readonly unresolvedReferenceCount: number;
  readonly loadedPartCount: number;
  readonly selectedPart: AnimationPartAsset | null;
  readonly renderState: NeutralPoseFrameState;
  readonly walkFrames: readonly RenderedFrame[] | null;
  readonly onLoadPartBlob: (blobId: StableId) => Promise<PartBlobLoadResult>;
  readonly onConfigurePart: (
    definition: AnchorEditorCommitDefinition
  ) => Promise<AnchorEditorCommitResult>;
  readonly onCommitFrameOverride: NonNullable<
    AnimationWorkspaceProps["onCommitFrameOverride"]
  >;
  readonly dispatch: (action: AnimationWorkspaceAction) => void;
  readonly layout: WorkspaceLayout;
}

function RigViewport({
  project,
  state,
  activeClip,
  unresolvedReferenceCount,
  loadedPartCount,
  selectedPart,
  renderState,
  walkFrames,
  onLoadPartBlob,
  onConfigurePart,
  onCommitFrameOverride,
  dispatch,
  layout
}: RigViewportProps) {
  const [showAllDirections, setShowAllDirections] = useState(false);
  const frameDragRef = useRef<Readonly<{
    x: number;
    y: number;
    pointerId: number;
  }> | null>(null);
  const rigTemplate = getBuiltInRigTemplate(project.rigTemplateId);
  const hasDirectionRig = rigTemplate
    ? resolveRuntimeDirectionRig(rigTemplate, state.direction) !== null
    : false;
  const frameStyle = {
    width: `${project.frameProfile.frameSize.width * state.zoom}px`,
    height: `${project.frameProfile.frameSize.height * state.zoom}px`,
    transform: `translate(${state.pan.x}px, ${state.pan.y}px)`,
    "--workspace-pixel-size": `${state.zoom}px`
  } as CSSProperties;
  const selectedAssignment = selectedPart
    ? project.parts.find(({ assetId }) => assetId === selectedPart.assetId)
    : undefined;
  const currentFrame = walkFrames?.[state.frameIndex] ?? renderState.frame;
  const onionLayers =
    walkFrames && activeClip
      ? resolveOnionSkinLayers(
          walkFrames,
          state.frameIndex,
          activeClip.loop,
          state.onionSkinMode
        )
      : Object.freeze([]);
  const renderedPartCount = currentFrame?.renderedPartIds.length ?? 0;
  const renderDiagnosticCount =
    (currentFrame?.diagnostics.length ?? 0) +
    renderState.preparationIssues.length;

  const handleViewportKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const panStep = event.shiftKey ? 32 : 8;
    const panByKey: Partial<Record<string, readonly [number, number]>> = {
      ArrowLeft: [-panStep, 0],
      ArrowRight: [panStep, 0],
      ArrowUp: [0, -panStep],
      ArrowDown: [0, panStep]
    };
    const delta = panByKey[event.key];
    if (delta) {
      event.preventDefault();
      dispatch({ type: "panned", deltaX: delta[0], deltaY: delta[1] });
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      dispatch({ type: "zoomStepped", step: 1 });
    }
    if (event.key === "-") {
      event.preventDefault();
      dispatch({ type: "zoomStepped", step: -1 });
    }
    if (event.key === "Home") {
      event.preventDefault();
      dispatch({ type: "panReset" });
    }
  };

  const frameTransformTarget = (): FrameTransformTarget | null => {
    if (state.frameTransformMode === "root") return { kind: "root" };
    if (state.frameTransformMode === "joint") {
      return { kind: "joint", joint: state.selectedJoint };
    }
    if (state.frameTransformMode === "part" && state.selectedSlot) {
      return { kind: "part", slot: state.selectedSlot };
    }
    return null;
  };

  const beginFrameDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeClip || !frameTransformTarget()) return;
    frameDragRef.current = Object.freeze({
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const finishFrameDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = frameDragRef.current;
    const target = frameTransformTarget();
    frameDragRef.current = null;
    if (!start || !activeClip || !target || start.pointerId !== event.pointerId) return;
    const address = frameOverrideAddress(activeClip, state);
    const current = findFrameOverride(project.overrides, address);
    const delta = getTargetDelta(current, target);
    const horizontal = (event.clientX - start.x) / state.zoom;
    const vertical = (event.clientY - start.y) / state.zoom;
    const nextDelta = event.shiftKey
      ? Object.freeze({
          ...delta,
          rotationDelta: Math.max(
            -Math.PI,
            Math.min(Math.PI, delta.rotationDelta + horizontal * Math.PI / 180)
          )
        })
      : Object.freeze({
          ...delta,
          offsetX: Math.max(-64, Math.min(64, delta.offsetX + Math.round(horizontal))),
          offsetY: Math.max(-64, Math.min(64, delta.offsetY + Math.round(vertical)))
        });
    void onCommitFrameOverride(
      address,
      updateFrameTransformDelta(project, address, target, nextDelta)
    );
  };

  return (
    <Surface
      as="section"
      id="viewport-workspace-panel"
      className={`${styles.panel} ${styles.viewportPanel}`}
      tone="raised"
      aria-labelledby={PANE_HEADING_IDS.viewport}
      {...(layout === "small"
        ? { role: "tabpanel", "aria-labelledby": SMALL_TAB_IDS.viewport }
        : {})}
    >
      <div className={styles.panelHeading}>
        <div>
          <span className={styles.eyebrow}>Projektkoordinaten</span>
          <h2 id={PANE_HEADING_IDS.viewport} tabIndex={-1}>Rig-/Pixel-Viewport</h2>
        </div>
        <Badge tone="accent">
          {project.frameProfile.frameSize.width} × {project.frameProfile.frameSize.height} px
        </Badge>
      </div>

      <div className={styles.viewportControls}>
        <div>
          <span className={styles.toolbarLabel}>Ganzzahliger Zoom</span>
          <div className={styles.zoomControls} role="group" aria-label="Zoomstufen">
            <button
              type="button"
              aria-label="Verkleinern"
              disabled={state.zoom === WORKSPACE_ZOOM_LEVELS[0]}
              onClick={() => dispatch({ type: "zoomStepped", step: -1 })}
            >
              −
            </button>
            {WORKSPACE_ZOOM_LEVELS.map((zoom) => (
              <button
                key={zoom}
                type="button"
                aria-pressed={state.zoom === zoom}
                onClick={() => dispatch({ type: "zoomSelected", zoom })}
              >
                {zoom}×
              </button>
            ))}
            <button
              type="button"
              aria-label="Vergrößern"
              disabled={state.zoom === WORKSPACE_ZOOM_LEVELS[WORKSPACE_ZOOM_LEVELS.length - 1]}
              onClick={() => dispatch({ type: "zoomStepped", step: 1 })}
            >
              +
            </button>
          </div>
        </div>
        <fieldset className={styles.overlayControls}>
          <legend>Overlays</legend>
          {WORKSPACE_OVERLAY_IDS.map((overlay) => (
            <label key={overlay}>
              <input
                type="checkbox"
                checked={state.overlays[overlay]}
                onChange={() => dispatch({ type: "overlayToggled", overlay })}
              />
              <span>{OVERLAY_LABELS[overlay]}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <p className={styles.viewportSourceState} role="status">
        <strong>
          {renderState.status === "loading"
            ? "Partquellen werden gerendert"
            : renderState.status === "failed"
              ? "Renderquelle nicht verfügbar"
              : unresolvedReferenceCount > 0 && loadedPartCount === 0
                ? "Keine renderbaren Bilddaten"
              : renderedPartCount > 0
                ? walkFrames
                  ? "Walk-Frame deterministisch gerendert"
                  : "Neutralpose deterministisch gerendert"
                : loadedPartCount > 0
                  ? "Noch kein renderbereiter Part"
                  : "Viewport wartet auf Teile"}
        </strong>{" "}
        {renderState.status === "failed"
          ? renderState.message
          : renderedPartCount > 0
            ? `${renderedPartCount} Part-${renderedPartCount === 1 ? "Quelle wurde" : "Quellen wurden"} per inverser affiner Nearest-Neighbor-Abtastung zusammengesetzt.`
            : loadedPartCount > 0
              ? "Nur Parts mit freigegebenen Ankern und passender authored Richtung werden gezeichnet."
              : "Dem Projekt sind noch keine PartAssets zugewiesen; es wird kein Dummybild erzeugt."}{" "}
        {unresolvedReferenceCount > 0
          ? `${unresolvedReferenceCount} Asset-Referenz${unresolvedReferenceCount === 1 ? " bleibt" : "en bleiben"} ungelöst.`
          : ""}{" "}
        {rigTemplate
          ? `Das SVG-Overlay liest die versionierte Neutralpose direkt aus ${rigTemplate.id}; Canvas zeigt ausschließlich fertige RGBA-Daten.`
          : " Für die Projektreferenz ist keine Built-in-Rigvorlage verfügbar."}
      </p>

      <div
        className={styles.viewportStage}
        role="region"
        aria-label="Verschiebbarer Projektframe"
        aria-describedby="animation-viewport-keyboard-help animation-viewport-status"
        tabIndex={0}
        onKeyDown={handleViewportKeyDown}
        onPointerDown={beginFrameDrag}
        onPointerUp={finishFrameDrag}
        data-transform-mode={state.frameTransformMode}
      >
        <div
          className={styles.pixelFrame}
          style={frameStyle}
          data-testid="animation-project-frame"
          data-zoom={state.zoom}
          data-grid={state.overlays.grid}
          data-rig={state.overlays.rig}
          data-anchors={state.overlays.anchors}
          data-bounding-boxes={state.overlays.boundingBoxes}
          data-footline={state.overlays.footline}
          data-rig-direction={state.direction}
        >
          {onionLayers.map((layer) => (
            <span
              key={layer.kind}
              className={styles.onionLayer}
              style={{ opacity: state.onionSkinOpacity }}
              data-onion-layer={layer.kind}
              data-onion-frame={layer.frameIndex + 1}
            >
              <RenderedFrameCanvas
                frame={layer.frame}
                variant="onion"
                ariaHidden
                testId={`onion-${layer.kind}-frame`}
              />
            </span>
          ))}
          {currentFrame && renderedPartCount > 0 ? (
            <RenderedFrameCanvas
              frame={currentFrame}
              {...(walkFrames
                ? {
                    ariaLabel: `Aktueller Walk-Frame ${state.frameIndex + 1} von ${walkFrames.length}: ${HUMANOID_WALK_PHASES[state.frameIndex]?.label ?? "Unbekannte Phase"}`
                  }
                : {})}
            />
          ) : null}
          {state.overlays.grid ? <span className={styles.gridOverlay} /> : null}
          {state.overlays.boundingBoxes ? <span className={styles.boundsOverlay} /> : null}
          {rigTemplate ? (
            <RigOverlay
              template={rigTemplate}
              direction={state.direction}
              showRig={state.overlays.rig}
              showGroundline={state.overlays.footline}
            />
          ) : null}
          <span className={styles.viewportPlaceholder}>
            {renderState.status === "loading"
              ? "Renderer lädt"
              : renderState.status === "failed"
                ? "Renderfehler"
                : renderedPartCount > 0
                  ? `${renderedPartCount} Part${renderedPartCount === 1 ? "" : "s"}`
                  : unresolvedReferenceCount > 0
                    ? "Bilddaten fehlen"
                    : loadedPartCount > 0
                      ? "Anker fehlen"
                      : "Keine Teile belegt"}
          </span>
        </div>
      </div>

      <div className={styles.renderDiagnostics} role="status" aria-live="polite">
        <strong>Renderdiagnostik</strong>
        {renderDiagnosticCount === 0 ? (
          <span>Keine Rasterwarnungen für den aktuellen Frame.</span>
        ) : (
          <ul aria-label="Renderdiagnostik des aktuellen Frames">
            {renderState.preparationIssues.map((issue, index) => (
              <li key={`prepare-${issue.assetId ?? "frame"}-${issue.code}-${index}`}>
                {issue.code}: {issue.message}
              </li>
            ))}
            {currentFrame?.diagnostics.map((issue, index) => (
              <li key={`render-${issue.partId ?? "frame"}-${issue.code}-${index}`}>
                {renderDiagnosticLabel(issue)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {renderState.walkCycle ? (
        <div
          className={styles.walkProductionStatus}
          role={renderState.walkCycle.status === "invalid" ? "alert" : "status"}
        >
          <strong>
            {renderState.walkCycle.status === "ok"
              ? project.directionSourceMode === "singleDirectionPrototype"
                ? "Automatischer South-Walk bereit"
                : "Vollständiger 8-Richtungs-Walk bereit"
              : project.directionSourceMode === "singleDirectionPrototype"
                ? "Automatischer South-Walk gesperrt"
                : "Vollständiger 8-Richtungs-Walk gesperrt"}
          </strong>
          {renderState.walkCycle.status === "ok" ? (
            <span>
              {renderState.walkCycle.frames.length} deterministische Frames wurden
              flüchtig aus Rig, Parts und Clipvorlage erzeugt.
            </span>
          ) : (
            <ul
              aria-label={
                project.directionSourceMode === "singleDirectionPrototype"
                  ? "Produktionsfehler des South-Walk-Clips"
                  : "Produktionsfehler des 8-Richtungs-Walk-Clips"
              }
            >
              {renderState.walkCycle.issues.map((walkIssue, index) => (
                <li key={`${walkIssue.code}-${walkIssue.assetId ?? walkIssue.slot ?? "clip"}-${index}`}>
                  {walkIssue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {project.directionSourceMode !== "singleDirectionPrototype" ? (
        <div className={styles.allDirectionsReview}>
          <button
            className={styles.secondaryButton}
            type="button"
            aria-expanded={showAllDirections}
            aria-controls="all-directions-preview-grid"
            disabled={renderState.directionWalkSet?.status !== "ok"}
            onClick={() => setShowAllDirections((visible) => !visible)}
          >
            {showAllDirections
              ? "Einzelrichtung prüfen"
              : "Alle Richtungen prüfen"}
          </button>
          <span>
            Statische Previewfelder folgen gemeinsam dem gewählten Timeline-Frame;
            sie starten keine eigene Wiedergabe.
          </span>
          {showAllDirections && renderState.directionWalkSet?.status === "ok" ? (
            <div
              id="all-directions-preview-grid"
              className={styles.allDirectionsGrid}
              role="region"
              aria-label="Alle acht Richtungen prüfen"
            >
              {renderState.directionWalkSet.directions.map((entry) => {
                const preview =
                  entry.frames[state.frameIndex] ?? entry.frames[0];
                return preview ? (
                  <button
                    type="button"
                    key={entry.direction}
                    aria-pressed={state.direction === entry.direction}
                    aria-label={`${DIRECTION_LABELS[entry.direction]} auswählen; statische Vorschau Frame ${preview.frameIndex + 1}`}
                    onClick={() =>
                      dispatch({
                        type: "directionSelected",
                        direction: entry.direction
                      })
                    }
                  >
                    <RenderedFrameCanvas
                      frame={preview.frame}
                      variant="thumbnail"
                      ariaHidden
                      testId={`all-direction-preview-${entry.direction}`}
                    />
                    <span>{DIRECTION_LABELS[entry.direction]}</span>
                  </button>
                ) : null;
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.panControls} role="group" aria-label="Viewport verschieben">
        <button type="button" onClick={() => dispatch({ type: "panned", deltaX: 0, deltaY: -8 })}>
          Nach oben
        </button>
        <button type="button" onClick={() => dispatch({ type: "panned", deltaX: -8, deltaY: 0 })}>
          Nach links
        </button>
        <button type="button" onClick={() => dispatch({ type: "panReset" })}>
          Zentrieren
        </button>
        <button type="button" onClick={() => dispatch({ type: "panned", deltaX: 8, deltaY: 0 })}>
          Nach rechts
        </button>
        <button type="button" onClick={() => dispatch({ type: "panned", deltaX: 0, deltaY: 8 })}>
          Nach unten
        </button>
      </div>

      <p id="animation-viewport-keyboard-help" className={styles.keyboardHelp}>
        Tastatur: Pfeile verschieben die Ansicht, +/− zoomt, Pos1 zentriert.
        Im Root-, Joint- oder Partmodus verschiebt Ziehen in ganzen Projektpixeln;
        Umschalt + Ziehen dreht. Alle Werte sind zusätzlich im Frameinspektor editierbar.
      </p>
      <p id="animation-viewport-status" className={styles.viewportStatus} role="status" aria-live="polite">
        {project.frameProfile.frameSize.width} × {project.frameProfile.frameSize.height} Projektpixel · Zoom {state.zoom}× · Versatz X {state.pan.x}, Y {state.pan.y} · {DIRECTION_LABELS[state.direction]} · Frame {activeClip ? state.frameIndex + 1 : "–"} · Modus {state.frameTransformMode}
      </p>
      <ul className={styles.domAlternative} aria-label="Aktueller Viewportzustand">
        {WORKSPACE_OVERLAY_IDS.map((overlay) => (
          <li key={overlay}>
            {OVERLAY_LABELS[overlay]}: {state.overlays[overlay] ? "ein" : "aus"}
          </li>
        ))}
        <li>Rigvorlage: {rigTemplate?.id ?? "nicht verfügbar"}</li>
        <li>
          Neutralpose: {rigTemplate && hasDirectionRig
            ? DIRECTION_LABELS[state.direction]
            : "nicht verfügbar"}
        </li>
      </ul>
      {rigTemplate && selectedPart ? (
        <AnchorEditor
          asset={selectedPart}
          template={rigTemplate}
          direction={state.direction}
          transformDelta={selectedAssignment?.transformDelta}
          loadBlob={onLoadPartBlob}
          onCommit={onConfigurePart}
        />
      ) : (
        <p className={styles.emptyDetail} role="note">
          Wähle einen belegten Slot, um dessen Originalanker im Viewport zu bearbeiten.
        </p>
      )}
    </Surface>
  );
}

type FrameTransformTarget =
  | Readonly<{ kind: "root" }>
  | Readonly<{ kind: "joint"; joint: JointId }>
  | Readonly<{ kind: "part"; slot: PartSlot }>;

function frameOverrideAddress(
  clip: AnimationClip,
  state: AnimationWorkspaceState
): FrameOverrideAddress {
  return Object.freeze({
    clipId: clip.clipId,
    direction: state.direction,
    frameIndex: state.frameIndex
  });
}

export function updateFrameTransformDelta(
  project: AnimationProject,
  address: FrameOverrideAddress,
  target: FrameTransformTarget,
  delta: TransformDelta
): FrameOverride | null {
  const existing = findFrameOverride(project.overrides, address);
  const base: FrameOverride = existing ?? address;
  if (target.kind === "root") {
    return normalizeFrameOverride({ ...base, rootDelta: delta });
  }
  if (target.kind === "joint") {
    return normalizeFrameOverride({
      ...base,
      jointDeltas: { ...base.jointDeltas, [target.joint]: delta }
    });
  }
  return normalizeFrameOverride({
    ...base,
    partDeltas: { ...base.partDeltas, [target.slot]: delta }
  });
}

function getTargetDelta(
  override: FrameOverride | null,
  target: FrameTransformTarget
): TransformDelta {
  if (target.kind === "root") return override?.rootDelta ?? IDENTITY_FRAME_DELTA;
  if (target.kind === "joint") {
    return override?.jointDeltas?.[target.joint] ?? IDENTITY_FRAME_DELTA;
  }
  return override?.partDeltas?.[target.slot] ?? IDENTITY_FRAME_DELTA;
}

interface DeltaNumberFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly display?: (value: number) => number;
  readonly parse?: (value: number) => number;
  readonly onCommit: (value: number) => void;
  readonly onReset: () => void;
}

function DeltaNumberField({
  id,
  label,
  value,
  min,
  max,
  step,
  display = (current) => current,
  parse = (current) => current,
  onCommit,
  onReset
}: DeltaNumberFieldProps) {
  const shown = display(value);
  const [draft, setDraft] = useState(String(Number(shown.toFixed(3))));
  useEffect(() => setDraft(String(Number(shown.toFixed(3)))), [shown]);
  const commit = () => {
    const numeric = Number(draft);
    if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
      setDraft(String(Number(shown.toFixed(3))));
      return;
    }
    onCommit(parse(numeric));
  };
  return (
    <div className={styles.layerOffsetControl}>
      <label htmlFor={id}>{label}</label>
      <div>
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <button type="button" onClick={onReset} aria-label={`${label} zurücksetzen`}>
          Reset
        </button>
      </div>
    </div>
  );
}

interface FrameCorrectionEditorProps {
  readonly project: AnimationProject;
  readonly state: AnimationWorkspaceState;
  readonly activeClip: AnimationClip;
  readonly dispatch: (action: AnimationWorkspaceAction) => void;
  readonly onCommit: NonNullable<AnimationWorkspaceProps["onCommitFrameOverride"]>;
  readonly onResetDirection: NonNullable<
    AnimationWorkspaceProps["onResetDirectionOverrides"]
  >;
}

function FrameCorrectionEditor({
  project,
  state,
  activeClip,
  dispatch,
  onCommit,
  onResetDirection
}: FrameCorrectionEditorProps) {
  const address = frameOverrideAddress(activeClip, state);
  const current = findFrameOverride(project.overrides, address);
  const target: FrameTransformTarget =
    state.frameTransformMode === "joint"
      ? { kind: "joint", joint: state.selectedJoint }
      : state.frameTransformMode === "part" && state.selectedSlot
        ? { kind: "part", slot: state.selectedSlot }
        : { kind: "root" };
  const delta = getTargetDelta(current, target);
  const warnings = collectFrameOverrideWarnings(current);
  const [message, setMessage] = useState<Readonly<{
    tone: "status" | "alert";
    text: string;
  }> | null>(null);

  const commit = (next: FrameOverride | null, success: string) => {
    setMessage(null);
    void onCommit(address, next).then((result) => {
      setMessage(
        result.status === "ok"
          ? { tone: "status", text: success }
          : { tone: "alert", text: result.message }
      );
    });
  };
  const commitDelta = (nextDelta: TransformDelta) => {
    commit(
      updateFrameTransformDelta(project, address, target, nextDelta),
      "Framekorrektur übernommen."
    );
  };
  const updateDeltaValue = (key: keyof TransformDelta, value: number) => {
    commitDelta(Object.freeze({ ...delta, [key]: value }));
  };
  const baseLayerOrder =
    getDirectionDrawOrder(state.direction)?.entries.map(({ slot }) => slot) ?? [];
  const layerOrder = applyFrameLayerOrder(
    baseLayerOrder,
    current?.layerOrderOverride
  );
  const selectedLayerIndex = state.selectedSlot
    ? layerOrder.indexOf(state.selectedSlot)
    : -1;
  const moveLayer = (step: -1 | 1) => {
    if (!current && !state.selectedSlot) return;
    const nextIndex = selectedLayerIndex + step;
    if (selectedLayerIndex < 0 || nextIndex < 0 || nextIndex >= layerOrder.length) return;
    const reordered = [...layerOrder];
    [reordered[selectedLayerIndex], reordered[nextIndex]] = [
      reordered[nextIndex]!,
      reordered[selectedLayerIndex]!
    ];
    commit(
      normalizeFrameOverride({ ...(current ?? address), layerOrderOverride: reordered }),
      "Layerreihenfolge übernommen."
    );
  };
  const resetLayerOrder = () => {
    if (!current?.layerOrderOverride) return;
    const { layerOrderOverride: _removed, ...rest } = current;
    commit(normalizeFrameOverride(rest), "Layerreihenfolge zurückgesetzt.");
  };

  return (
    <>
      <dl className={styles.factList}>
        <div><dt>Generated Baseline</dt><dd>rekonstruierbar, unverändert</dd></div>
        <div><dt>Aktive Korrektur</dt><dd>{current ? "Delta aktiv" : "keine"}</dd></div>
        <div><dt>Frame</dt><dd>{state.frameIndex + 1} von {activeClip.frameCount}</dd></div>
        <div><dt>Richtung</dt><dd>{DIRECTION_LABELS[state.direction]}</dd></div>
        <div><dt>Adresse</dt><dd>{activeClip.clipId} · {state.direction} · {state.frameIndex + 1}</dd></div>
      </dl>

      <fieldset className={styles.overlayControls}>
        <legend>Transformmodus</legend>
        {(["pan", "root", "joint", "part"] as const).map((mode) => (
          <label key={mode}>
            <input
              type="radio"
              name="frame-transform-mode"
              checked={state.frameTransformMode === mode}
              onChange={() => {
                if (mode === "part" && !state.selectedSlot) {
                  dispatch({ type: "framePartSelected", slot: PART_SLOT_IDS[0] });
                } else {
                  dispatch({ type: "frameTransformModeSelected", mode });
                }
              }}
            />
            <span>{mode === "pan" ? "Ansicht" : mode === "root" ? "Root" : mode === "joint" ? "Joint" : "Part"}</span>
          </label>
        ))}
      </fieldset>

      {state.frameTransformMode === "joint" ? (
        <label className={styles.layerOffsetControl} htmlFor="frame-joint-target">
          Joint
          <select
            id="frame-joint-target"
            value={state.selectedJoint}
            onChange={(event) =>
              dispatch({ type: "frameJointSelected", joint: event.currentTarget.value as JointId })
            }
          >
            {JOINT_IDS.map((joint) => <option key={joint} value={joint}>{joint}</option>)}
          </select>
        </label>
      ) : null}
      {state.frameTransformMode === "part" ? (
        <label className={styles.layerOffsetControl} htmlFor="frame-part-target">
          Part-Slot
          <select
            id="frame-part-target"
            value={state.selectedSlot ?? PART_SLOT_IDS[0]}
            onChange={(event) =>
              dispatch({ type: "framePartSelected", slot: event.currentTarget.value as PartSlot })
            }
          >
            {PART_SLOT_IDS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
        </label>
      ) : null}

      {state.frameTransformMode !== "pan" ? (
        <div aria-label="Numerische Framekorrektur">
          <DeltaNumberField
            id="frame-delta-x"
            label="Offset X (px)"
            value={delta.offsetX}
            min={-64}
            max={64}
            step={1}
            onCommit={(value) => updateDeltaValue("offsetX", Math.round(value))}
            onReset={() => updateDeltaValue("offsetX", 0)}
          />
          <DeltaNumberField
            id="frame-delta-y"
            label="Offset Y (px)"
            value={delta.offsetY}
            min={-64}
            max={64}
            step={1}
            onCommit={(value) => updateDeltaValue("offsetY", Math.round(value))}
            onReset={() => updateDeltaValue("offsetY", 0)}
          />
          <DeltaNumberField
            id="frame-delta-rotation"
            label="Drehung (Grad)"
            value={delta.rotationDelta}
            min={-180}
            max={180}
            step={1}
            display={(value) => value * 180 / Math.PI}
            parse={(value) => value * Math.PI / 180}
            onCommit={(value) => updateDeltaValue("rotationDelta", value)}
            onReset={() => updateDeltaValue("rotationDelta", 0)}
          />
          <DeltaNumberField
            id="frame-delta-scale"
            label="Skalierung"
            value={delta.scaleMultiplier}
            min={0.25}
            max={4}
            step={0.05}
            onCommit={(value) => updateDeltaValue("scaleMultiplier", value)}
            onReset={() => updateDeltaValue("scaleMultiplier", 1)}
          />
        </div>
      ) : (
        <p className={styles.emptyDetail}>Ansichtsmodus aktiv; der Pointer verschiebt nur den Workspace.</p>
      )}

      <div className={styles.layerOffsetControl}>
        <strong>Layer-Override</strong>
        <span>{current?.layerOrderOverride ? "Frame-Reihenfolge aktiv" : "Basisreihenfolge"}</span>
        <div role="group" aria-label="Part in der Frame-Layerreihenfolge bewegen">
          <button type="button" disabled={selectedLayerIndex <= 0} onClick={() => moveLayer(-1)}>Nach hinten</button>
          <button type="button" disabled={selectedLayerIndex < 0 || selectedLayerIndex >= layerOrder.length - 1} onClick={() => moveLayer(1)}>Nach vorne</button>
          <button type="button" disabled={!current?.layerOrderOverride} onClick={resetLayerOrder}>Layer-Reset</button>
        </div>
      </div>

      <div className={styles.playbackButtons} role="group" aria-label="Framekorrekturen zurücksetzen">
        <button type="button" disabled={!current} onClick={() => commit(null, "Frame auf Generated Baseline zurückgesetzt.")}>Frame zurücksetzen</button>
        <button
          type="button"
          disabled={!project.overrides.some((entry) => entry.clipId === activeClip.clipId && entry.direction === state.direction)}
          onClick={() => {
            void onResetDirection(activeClip.clipId, state.direction).then((result) => {
              setMessage(result.status === "ok"
                ? { tone: "status", text: "Alle Korrekturen dieser Richtung wurden entfernt." }
                : { tone: "alert", text: result.message });
            });
          }}
        >
          Richtung zurücksetzen
        </button>
      </div>
      {warnings.length > 0 ? (
        <ul role="alert" aria-label="Warnungen für extreme Framekorrekturen">
          {warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : null}
      {message ? <p role={message.tone}>{message.text}</p> : null}
    </>
  );
}

interface InspectorProps {
  readonly project: AnimationProject;
  readonly state: AnimationWorkspaceState;
  readonly activeClip: AnimationClip | null;
  readonly unresolvedReferenceCount: number;
  readonly partAssets: readonly AnimationPartAsset[];
  readonly onSetPartLayerOffset: (
    assetId: StableId,
    layerOffset: number
  ) => Promise<PartLayerOffsetCommitResult>;
  readonly onSetProjectMirrorPolicy: NonNullable<
    AnimationWorkspaceProps["onSetProjectMirrorPolicy"]
  >;
  readonly onSetPartMirrorPolicy: NonNullable<
    AnimationWorkspaceProps["onSetPartMirrorPolicy"]
  >;
  readonly onCommitFrameOverride: NonNullable<
    AnimationWorkspaceProps["onCommitFrameOverride"]
  >;
  readonly onResetDirectionOverrides: NonNullable<
    AnimationWorkspaceProps["onResetDirectionOverrides"]
  >;
  readonly dispatch: (action: AnimationWorkspaceAction) => void;
  readonly layout: WorkspaceLayout;
}

interface MirrorPolicyControlProps {
  readonly id: string;
  readonly label: string;
  readonly value: MirrorPolicy;
  readonly includeInherit: boolean;
  readonly onCommit: (value: MirrorPolicy) => Promise<MirrorPolicyCommitResult>;
}

const MIRROR_POLICY_LABELS: Readonly<Record<MirrorPolicy, string>> =
  Object.freeze({
    inherit: "Projektstandard übernehmen",
    allow: "Spiegelung erlauben",
    forbid: "Spiegelung verbieten"
  });

function MirrorPolicyControl({
  id,
  label,
  value,
  includeInherit,
  onCommit
}: MirrorPolicyControlProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Readonly<{
    tone: "status" | "alert";
    text: string;
  }> | null>(null);
  return (
    <div className={styles.mirrorPolicyControl}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.currentTarget.value as MirrorPolicy;
          setPending(true);
          setMessage(null);
          void onCommit(next).then((result) => {
            setPending(false);
            setMessage(
              result.status === "ok"
                ? { tone: "status", text: "Spiegelregel übernommen." }
                : { tone: "alert", text: result.message }
            );
          });
        }}
      >
        {(["inherit", "allow", "forbid"] as const)
          .filter((policy) => includeInherit || policy !== "inherit")
          .map((policy) => (
            <option key={policy} value={policy}>
              {MIRROR_POLICY_LABELS[policy]}
            </option>
          ))}
      </select>
      {message ? <span role={message.tone}>{message.text}</span> : null}
    </div>
  );
}

interface PartLayerOffsetControlProps {
  readonly assetId: StableId;
  readonly layerOffset: number;
  readonly onCommit: (
    assetId: StableId,
    layerOffset: number
  ) => Promise<PartLayerOffsetCommitResult>;
}

function PartLayerOffsetControl({
  assetId,
  layerOffset,
  onCommit
}: PartLayerOffsetControlProps) {
  const [draft, setDraft] = useState(String(layerOffset));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Readonly<{
    tone: "status" | "alert";
    text: string;
  }> | null>(null);

  useEffect(() => {
    setDraft(String(layerOffset));
    setMessage(null);
  }, [assetId, layerOffset]);

  const commit = async () => {
    const next = Number(draft);
    if (
      !Number.isInteger(next) ||
      next < MIN_PROJECT_LAYER_OFFSET ||
      next > MAX_PROJECT_LAYER_OFFSET
    ) {
      setMessage({
        tone: "alert",
        text: `Erlaubt ist eine ganze Zahl von ${MIN_PROJECT_LAYER_OFFSET} bis ${MAX_PROJECT_LAYER_OFFSET}.`
      });
      return;
    }
    setPending(true);
    setMessage(null);
    const result = await onCommit(assetId, next);
    setPending(false);
    setMessage(
      result.status === "ok"
        ? { tone: "status", text: "Projektweites Layer-Delta übernommen." }
        : { tone: "alert", text: result.message }
    );
  };

  return (
    <div className={styles.layerOffsetControl}>
      <label htmlFor={`part-layer-offset-${assetId}`}>Projektweites Layer-Delta</label>
      <div>
        <input
          id={`part-layer-offset-${assetId}`}
          type="number"
          min={MIN_PROJECT_LAYER_OFFSET}
          max={MAX_PROJECT_LAYER_OFFSET}
          step={1}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
        />
        <button type="button" disabled={pending} onClick={() => void commit()}>
          {pending ? "Übernimmt …" : "Layer übernehmen"}
        </button>
      </div>
      <small>
        Kleine Abweichung zur richtungsspezifischen Basisreihenfolge
        ({MIN_PROJECT_LAYER_OFFSET} bis +{MAX_PROJECT_LAYER_OFFSET}).
      </small>
      {message ? <span role={message.tone}>{message.text}</span> : null}
    </div>
  );
}

function Inspector({
  project,
  state,
  activeClip,
  unresolvedReferenceCount,
  partAssets,
  onSetPartLayerOffset,
  onSetProjectMirrorPolicy,
  onSetPartMirrorPolicy,
  onCommitFrameOverride,
  onResetDirectionOverrides,
  dispatch,
  layout
}: InspectorProps) {
  const selectedSlot = getPartSlotDefinition(state.selectedSlot);
  const selectedPart = state.selectedSlot
    ? findPartAssetForSource(partAssets, state.selectedSlot, state.direction)
    : null;
  const selectedAssignment = selectedPart
    ? project.parts.find(({ assetId }) => assetId === selectedPart.assetId)
    : undefined;
  const selectedPartDelta = selectedAssignment?.transformDelta;
  const directionDrawOrder = getDirectionDrawOrder(state.direction);
  const selectedLayerGroup = selectedPart
    ? getDefaultLayerGroup(state.direction, selectedPart.slot)
    : null;
  const baseLayerIndex = selectedPart
    ? directionDrawOrder?.entries.findIndex(
        (entry) => entry.slot === selectedPart.slot
      ) ?? -1
    : -1;
  const resolvedOrder = resolveDirectionDrawOrder(
    state.direction,
    partAssets
      .filter((asset) => asset.direction === state.direction)
      .map((asset) => {
        const assignment = project.parts.find(
          (candidate) => candidate.assetId === asset.assetId
        );
        return {
          id: asset.assetId,
          slot: asset.slot,
          ...(asset.attachmentJointId
            ? { attachmentJointId: asset.attachmentJointId }
            : {}),
          ...(assignment?.layerOffset !== undefined
            ? { layerOffset: assignment.layerOffset }
            : {})
        };
      })
  );
  const resolvedLayerIndex =
    resolvedOrder.status === "ok" && selectedPart
      ? resolvedOrder.parts.findIndex((part) => part.id === selectedPart.assetId)
      : -1;
  const contexts: readonly Readonly<{
    id: WorkspaceInspectorContext;
    label: string;
  }>[] = [
    { id: "project", label: "Projekt" },
    { id: "part", label: "Part" },
    { id: "frame", label: "Frame" }
  ];

  return (
    <Surface
      as="section"
      id="inspector-workspace-panel"
      className={`${styles.panel} ${styles.inspector}`}
      tone="raised"
      aria-labelledby={PANE_HEADING_IDS.inspector}
      {...(layout === "small"
        ? { role: "tabpanel", "aria-labelledby": SMALL_TAB_IDS.inspector }
        : {})}
    >
      <div className={styles.panelHeading}>
        <div>
          <span className={styles.eyebrow}>Kontext</span>
          <h2 id={PANE_HEADING_IDS.inspector} tabIndex={-1}>Eigenschaften</h2>
        </div>
      </div>
      <div className={styles.segmentedControl} role="group" aria-label="Inspektorkontext">
        {contexts.map((context) => (
          <button
            key={context.id}
            type="button"
            aria-pressed={state.inspectorContext === context.id}
            onClick={() =>
              dispatch({
                type: "inspectorContextSelected",
                context: context.id
              })
            }
          >
            {context.label}
          </button>
        ))}
      </div>

      {state.inspectorContext === "project" ? (
        <div className={styles.inspectorContent}>
          <h3>Projekt</h3>
          <dl className={styles.factList}>
            <div><dt>Rig</dt><dd>{project.rigTemplateId}</dd></div>
            <div><dt>Framegröße</dt><dd>{project.frameProfile.frameSize.width} × {project.frameProfile.frameSize.height} px</dd></div>
            <div><dt>Figurenhöhe</dt><dd>{project.frameProfile.characterHeight} px</dd></div>
            <div><dt>Fußanker</dt><dd>{project.frameProfile.footAnchor.x} / {project.frameProfile.footAnchor.y}</dd></div>
            <div><dt>Clip</dt><dd>{activeClip ? clipLabel(activeClip) : "Kein Clip"}</dd></div>
            <div><dt>Richtungsmodus</dt><dd>{project.directionSourceMode}</dd></div>
          </dl>
          <MirrorPolicyControl
            id="project-mirror-policy"
            label="Projektstandard für Spiegelung"
            value={project.mirrorPolicy}
            includeInherit={false}
            onCommit={onSetProjectMirrorPolicy}
          />
        </div>
      ) : null}

      {state.inspectorContext === "part" ? (
        <div className={styles.inspectorContent}>
          <h3>Part</h3>
          {selectedSlot ? (
            <>
              <dl className={styles.factList}>
                <div><dt>Slot</dt><dd>{selectedSlot.label}</dd></div>
                <div><dt>Vertrag</dt><dd>{selectedSlot.required ? "Erforderlich" : "Optional"}</dd></div>
                <div><dt>Richtung</dt><dd>{DIRECTION_LABELS[state.direction]}</dd></div>
                <div><dt>Belegung</dt><dd>{selectedPart ? "Quelle vorhanden" : unresolvedReferenceCount > 0 ? "Teilweise nicht aufgelöst" : "Frei"}</dd></div>
                <div><dt>Part</dt><dd>{selectedPart?.label ?? "Noch nicht geladen"}</dd></div>
                <div><dt>Originalgröße / Trim</dt><dd>{selectedPart ? `${selectedPart.sourceSize.width} × ${selectedPart.sourceSize.height} px / X ${selectedPart.trimRect.x}, Y ${selectedPart.trimRect.y}, ${selectedPart.trimRect.width} × ${selectedPart.trimRect.height} px` : "Noch nicht verfügbar"}</dd></div>
                <div><dt>Anker / Pivot</dt><dd>{selectedPart?.anchorStatus === "anchorsPending" ? "Ausstehend – Produktion gesperrt" : selectedPart?.anchorStatus === "invalidAnchors" ? "Ungültig – Produktion gesperrt" : selectedPart?.anchors ? `${selectedPart.anchors.proximal.x} / ${selectedPart.anchors.proximal.y}` : "Noch nicht verfügbar"}</dd></div>
                <div><dt>Projektweite Korrektur</dt><dd>{selectedPart ? selectedPartDelta ? `Offset ${selectedPartDelta.offsetX} / ${selectedPartDelta.offsetY}, Rotation ${selectedPartDelta.rotationDelta}, Scale ${selectedPartDelta.scaleMultiplier}` : "Identität" : "Noch nicht verfügbar"}</dd></div>
                <div><dt>Layergruppe</dt><dd>{selectedLayerGroup ? LAYER_GROUP_LABELS[selectedLayerGroup] : "Noch nicht verfügbar"}</dd></div>
                <div><dt>Basisreihenfolge</dt><dd>{baseLayerIndex >= 0 && directionDrawOrder ? `${baseLayerIndex + 1} von ${directionDrawOrder.entries.length}` : "Nicht auflösbar"}</dd></div>
                <div><dt>Belegte Reihenfolge</dt><dd>{resolvedLayerIndex >= 0 && resolvedOrder.status === "ok" ? `${resolvedLayerIndex + 1} von ${resolvedOrder.parts.length}` : resolvedOrder.status === "invalid" ? "Produktionsvalidierung erforderlich" : "Noch nicht verfügbar"}</dd></div>
                <div><dt>Visuell nahe Seite</dt><dd>{directionDrawOrder?.nearSide === "left" ? "anatomisch links" : directionDrawOrder?.nearSide === "right" ? "anatomisch rechts" : "ausgeglichen"}</dd></div>
                <div><dt>Spiegelregel</dt><dd>{selectedPart?.mirrorPolicy ?? "Noch nicht verfügbar"}</dd></div>
              </dl>
              {selectedPart ? (
                <>
                  <MirrorPolicyControl
                    id={`part-mirror-policy-${selectedPart.assetId}`}
                    label="Partoverride für Spiegelung"
                    value={selectedAssignment?.mirrorPolicy ?? selectedPart.mirrorPolicy}
                    includeInherit
                    onCommit={(mirrorPolicy) =>
                      onSetPartMirrorPolicy(selectedPart.assetId, mirrorPolicy)
                    }
                  />
                  <PartLayerOffsetControl
                    assetId={selectedPart.assetId}
                    layerOffset={selectedAssignment?.layerOffset ?? 0}
                    onCommit={onSetPartLayerOffset}
                  />
                </>
              ) : null}
              <p className={styles.emptyDetail}>
                Importierte Originalbilder bleiben unverändert gespeichert. Source-Anker und projektweite Korrektur werden im Viewport getrennt bearbeitet.
              </p>
            </>
          ) : (
            <p className={styles.emptyDetail} role="status">
              Wähle im Teileinventar einen Slot. Es werden keine erfundenen Partwerte angezeigt.
            </p>
          )}
        </div>
      ) : null}

      {state.inspectorContext === "frame" ? (
        <div className={styles.inspectorContent}>
          <h3>Frame</h3>
          {activeClip ? (
            <FrameCorrectionEditor
              project={project}
              state={state}
              activeClip={activeClip}
              dispatch={dispatch}
              onCommit={onCommitFrameOverride}
              onResetDirection={onResetDirectionOverrides}
            />
          ) : (
            <p className={styles.emptyDetail} role="status">
              Das Projekt enthält keinen Clip. Frameeigenschaften sind daher nicht verfügbar.
            </p>
          )}
        </div>
      ) : null}
    </Surface>
  );
}

interface TimelineProps {
  readonly state: AnimationWorkspaceState;
  readonly activeClip: AnimationClip | null;
  readonly renderState: NeutralPoseFrameState;
  readonly walkFrames: readonly RenderedFrame[] | null;
  readonly playback: AnimationPlaybackController;
  readonly dispatch: (action: AnimationWorkspaceAction) => void;
  readonly layout: WorkspaceLayout;
}

const ONION_SKIN_LABELS: Readonly<Record<OnionSkinMode, string>> =
  Object.freeze({
    off: "Aus",
    previous: "Vorheriger Frame",
    next: "Nächster Frame",
    both: "Vorheriger und nächster Frame"
  });

function FrameTimeline({
  state,
  activeClip,
  renderState,
  walkFrames,
  playback,
  dispatch,
  layout
}: TimelineProps) {
  const selectFrame = (frameIndex: number, focus: boolean) => {
    if (!activeClip) return;
    playback.pause();
    dispatch({
      type: "frameSelected",
      frameIndex,
      frameCount: activeClip.frameCount
    });
    if (focus) {
      document.getElementById(`animation-frame-${frameIndex}`)?.focus();
    }
  };

  const handleFrameKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    frameIndex: number
  ) => {
    if (!activeClip) return;
    let nextFrame: number | null = null;
    if (event.key === "ArrowRight") nextFrame = (frameIndex + 1) % activeClip.frameCount;
    if (event.key === "ArrowLeft") nextFrame = (frameIndex - 1 + activeClip.frameCount) % activeClip.frameCount;
    if (event.key === "Home") nextFrame = 0;
    if (event.key === "End") nextFrame = activeClip.frameCount - 1;
    if (nextFrame === null) return;
    event.preventDefault();
    selectFrame(nextFrame, true);
  };

  const phase = HUMANOID_WALK_PHASES[state.frameIndex];
  const visibleProductionIssues =
    renderState.walkCycle?.status === "invalid"
      ? renderState.walkCycle.issues
      : renderState.walkCycle?.diagnostics.filter(
          (issue) =>
            issue.frameIndex === undefined || issue.frameIndex === state.frameIndex
        ) ?? [];

  return (
    <Surface
      as="section"
      id="timeline-workspace-panel"
      className={`${styles.panel} ${styles.timeline}`}
      tone="raised"
      aria-labelledby={PANE_HEADING_IDS.timeline}
      {...(layout === "small"
        ? { role: "tabpanel", "aria-labelledby": SMALL_TAB_IDS.timeline }
        : {})}
    >
      <div className={styles.panelHeading}>
        <div>
          <span className={styles.eyebrow}>Walk-Sequenz</span>
          <h2 id={PANE_HEADING_IDS.timeline} tabIndex={-1}>Timeline</h2>
        </div>
        {activeClip ? <Badge tone="accent">{activeClip.fps} FPS</Badge> : null}
      </div>
      {activeClip ? (
        <>
          <div className={styles.frameStrip} role="radiogroup" aria-label="Walk-Frames">
            {Array.from({ length: activeClip.frameCount }, (_, frameIndex) => (
              <button
                id={`animation-frame-${frameIndex}`}
                key={frameIndex}
                type="button"
                role="radio"
                aria-label={`Frame ${frameIndex + 1}: ${HUMANOID_WALK_PHASES[frameIndex]?.label ?? "ohne Phasenname"}`}
                aria-checked={state.frameIndex === frameIndex}
                tabIndex={state.frameIndex === frameIndex ? 0 : -1}
                onClick={() => selectFrame(frameIndex, false)}
                onKeyDown={(event) => handleFrameKeyDown(event, frameIndex)}
              >
                <span className={styles.frameNumber}>{frameIndex + 1}</span>
                {walkFrames?.[frameIndex] ? (
                  <RenderedFrameCanvas
                    frame={walkFrames[frameIndex]}
                    variant="thumbnail"
                    ariaLabel={`Vorschaubild Frame ${frameIndex + 1}, ${HUMANOID_WALK_PHASES[frameIndex]?.label ?? "ohne Phasenname"}`}
                    testId={`timeline-frame-${frameIndex + 1}`}
                  />
                ) : (
                  <span className={styles.framePlaceholder}>Vorschau nicht verfügbar</span>
                )}
                <span className={styles.framePhase}>
                  {HUMANOID_WALK_PHASES[frameIndex]?.label ?? "Ohne Phase"}
                </span>
              </button>
            ))}
          </div>
          <div className={styles.timelineControls}>
            <label className={styles.scrubber} htmlFor="animation-frame-scrubber">
              <span>Frame scrubben</span>
              <input
                id="animation-frame-scrubber"
                type="range"
                min={1}
                max={activeClip.frameCount}
                step={1}
                value={state.frameIndex + 1}
                onChange={(event) =>
                  selectFrame(Number(event.currentTarget.value) - 1, false)
                }
              />
              <output htmlFor="animation-frame-scrubber">
                {state.frameIndex + 1}
              </output>
            </label>
            <label className={styles.onionControl}>
              <span>Onion Skin</span>
              <select
                value={state.onionSkinMode}
                disabled={!walkFrames}
                onChange={(event) => {
                  const mode = event.currentTarget.value as OnionSkinMode;
                  if (ONION_SKIN_MODES.some((candidate) => candidate === mode)) {
                    dispatch({ type: "onionSkinModeSelected", mode });
                  }
                }}
              >
                {ONION_SKIN_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {ONION_SKIN_LABELS[mode]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.onionOpacity}>
              <span>Onion-Skin-Deckkraft</span>
              <input
                type="range"
                min={MIN_ONION_SKIN_OPACITY}
                max={MAX_ONION_SKIN_OPACITY}
                step={0.05}
                value={state.onionSkinOpacity}
                disabled={!walkFrames || state.onionSkinMode === "off"}
                onChange={(event) =>
                  dispatch({
                    type: "onionSkinOpacitySelected",
                    opacity: Number(event.currentTarget.value)
                  })
                }
              />
              <output>{Math.round(state.onionSkinOpacity * 100)} %</output>
            </label>
          </div>
          <p className={styles.timelineStatus} role="status" aria-live="polite">
            Frame {state.frameIndex + 1} von {activeClip.frameCount} · Phase: {phase?.label ?? "nicht verfügbar"} · {DIRECTION_LABELS[state.direction]} · {activeClip.fps} FPS · {activeClip.loop ? "Loop aktiv" : "Einmalige Wiedergabe"} · {playback.isPlaying ? "Wiedergabe läuft" : "Wiedergabe pausiert"}.
          </p>
          {visibleProductionIssues.length > 0 ? (
            <div
              className={styles.timelineIssues}
              role={renderState.walkCycle?.status === "invalid" ? "alert" : "status"}
            >
              <strong>
                {renderState.walkCycle?.status === "invalid"
                  ? "Fehlende Produktionsvoraussetzungen"
                  : "Renderwarnungen dieses Frames"}
              </strong>
              <ul>
                {visibleProductionIssues.map((issue, index) => (
                  <li key={`${issue.code}-${issue.frameIndex ?? "clip"}-${index}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : walkFrames ? (
            <p className={styles.timelineReady} role="status">
              {renderState.directionWalkSet === null
                ? "Alle acht South-Frames sind für die framegenaue Prüfung bereit."
                : `Alle acht Frames für ${DIRECTION_LABELS[state.direction]} sind für die framegenaue Prüfung bereit.`}
            </p>
          ) : null}
        </>
      ) : (
        <p className={styles.emptyDetail} role="status">
          Kein Clip vorhanden. Die Timeline erzeugt keine Beispieldaten.
        </p>
      )}
    </Surface>
  );
}

export function AnimationWorkspace({
  project,
  projectRevision = 0,
  playbackScheduler,
  canSave,
  saveStatus,
  saveError,
  sourceError,
  onSave,
  canUndo = false,
  canRedo = false,
  onUndo = () => undefined,
  onRedo = () => undefined,
  partAssets = EMPTY_PART_ASSETS,
  missingPartAssetIds,
  partAssetLoadError = null,
  partAssetsLoading = false,
  libraryPartAssets = EMPTY_PART_ASSETS,
  libraryPartAssetsLoading = false,
  libraryPartAssetError = null,
  imageDecoder = null,
  onImportPart = DISCONNECTED_PART_IMPORT,
  onLoadPartBlob = DISCONNECTED_PART_BLOB_LOADER,
  onLoadPreviewBlob,
  onConfigurePart = DISCONNECTED_PART_CONFIGURATION,
  onEquipPartAsset = DISCONNECTED_EQUIPMENT,
  onRemovePartAsset = DISCONNECTED_EQUIPMENT,
  onSetPartLayerOffset = DISCONNECTED_LAYER_CONFIGURATION,
  onSetProjectMirrorPolicy = DISCONNECTED_MIRROR_CONFIGURATION,
  onSetPartMirrorPolicy = DISCONNECTED_MIRROR_CONFIGURATION,
  onConfirmMirrorReview = DISCONNECTED_MIRROR_CONFIGURATION,
  onCommitFrameOverride = DISCONNECTED_FRAME_OVERRIDE,
  onResetDirectionOverrides = DISCONNECTED_FRAME_OVERRIDE
}: AnimationWorkspaceProps) {
  const [state, dispatch] = useReducer(
    animationWorkspaceReducer,
    project,
    createAnimationWorkspaceState
  );
  const [exportExpanded, setExportExpanded] = useState(false);
  const layout = useWorkspaceLayout();
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingPaneFocus = useRef<WorkspacePanel | null>(null);
  const activeClip = getActiveWorkspaceClip(project, state.clipId);
  const effectiveMissingPartAssetIds =
    missingPartAssetIds ?? project.parts.map(({ assetId }) => assetId);
  const unresolvedReferenceCount = effectiveMissingPartAssetIds.length;
  const selectedPart = state.selectedSlot
    ? findPartAssetForSource(partAssets, state.selectedSlot, state.direction)
    : null;
  const renderState = useNeutralPoseFrame(
    project,
    projectRevision,
    activeClip?.clipId ?? null,
    state.direction,
    partAssets,
    imageDecoder,
    onLoadPartBlob
  );
  const playbackEnabled = isPlayableWalkCycle(
    activeClip,
    state.direction,
    renderState.walkCycle
  );
  const walkFrames = playbackEnabled
    ? renderState.walkCycle.frames
    : null;
  const selectPlaybackFrame = useCallback(
    (frameIndex: number) => {
      dispatch({
        type: "playbackFrameSelected",
        frameIndex,
        frameCount: activeClip?.frameCount ?? 1
      });
    },
    [activeClip?.frameCount]
  );
  const playback = useAnimationPlayback({
    identity: `${project.projectId}:${projectRevision}:${activeClip?.clipId ?? "none"}:${state.direction}`,
    enabled: playbackEnabled,
    frameIndex: state.frameIndex,
    frameCount: activeClip?.frameCount ?? 1,
    fps: activeClip?.fps ?? 1,
    loop: activeClip?.loop ?? false,
    onFrameChange: selectPlaybackFrame,
    ...(playbackScheduler ? { scheduler: playbackScheduler } : {})
  });
  const playbackMessage = playbackAvailabilityMessage(
    activeClip,
    renderState,
    playbackEnabled,
    playback.reducedMotion
  );
  const completeDirectionSet =
    renderState.directionWalkSet?.status === "ok"
      ? renderState.directionWalkSet
      : null;
  const exportFrames = completeDirectionSet
    ? asExportFrames(completeDirectionSet.frames)
    : EMPTY_EXPORT_FRAMES;

  useEffect(() => {
    const panel = pendingPaneFocus.current;
    if (!panel) return;
    const heading = rootRef.current?.querySelector<HTMLElement>(
      `#${PANE_HEADING_IDS[panel]}`
    );
    if (!heading) return;
    heading.focus();
    pendingPaneFocus.current = null;
  }, [layout, state.activePanel, state.activeSidePanel]);

  const selectPanel = (panel: WorkspacePanel) => {
    pendingPaneFocus.current = panel;
    dispatch({ type: "panelSelected", panel });
  };

  const selectSidePanel = (panel: WorkspaceSidePanel) => {
    pendingPaneFocus.current = panel;
    dispatch({ type: "sidePanelSelected", panel });
  };

  const handleWorkspaceHistoryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== "z") {
      return;
    }
    if (event.shiftKey ? !canRedo : !canUndo) return;
    event.preventDefault();
    if (event.shiftKey) onRedo();
    else onUndo();
  };

  return (
    <div
      ref={rootRef}
      className={styles.workspace}
      data-workspace-layout={layout}
      onKeyDown={handleWorkspaceHistoryKeyDown}
    >
      <WorkspaceToolbar
        project={project}
        state={state}
        canSave={canSave}
        saveStatus={saveStatus}
        saveError={saveError}
        sourceError={sourceError}
        dispatch={dispatch}
        onSave={onSave}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        playback={playback}
        playbackEnabled={playbackEnabled}
        playbackMessage={playbackMessage}
        exportEnabled={completeDirectionSet !== null}
        exportExpanded={exportExpanded}
        onToggleExport={() => setExportExpanded((current) => !current)}
      />
      {exportExpanded ? (
        <AnimationExportPanel
          project={project}
          clip={activeClip}
          frames={exportFrames}
          productionDiagnostics={completeDirectionSet?.diagnostics ?? []}
          missingBlobIds={effectiveMissingPartAssetIds}
          partAssets={partAssets}
          readImageBlob={async (blobId) => {
            const result = await onLoadPartBlob(blobId);
            if (result.status === "error") throw new Error(result.message);
            return result.blob;
          }}
          {...(onLoadPreviewBlob
            ? {
                readPreviewBlob: async (previewId: StableId) => {
                  const result = await onLoadPreviewBlob(previewId);
                  if (result.status === "error") throw new Error(result.message);
                  return result.blob;
                }
              }
            : {})}
        />
      ) : null}
      <PaneNavigation
        layout={layout}
        state={state}
        onSelectPanel={selectPanel}
        onSelectSidePanel={selectSidePanel}
      />
      <div className={styles.workspaceGrid}>
        {panelIsVisible("parts", layout, state) ? (
          <PartInventory
            project={project}
            direction={state.direction}
            selectedSlot={state.selectedSlot}
            partAssets={partAssets}
            missingPartAssetIds={effectiveMissingPartAssetIds}
            partAssetLoadError={partAssetLoadError}
            partAssetsLoading={partAssetsLoading}
            libraryPartAssets={libraryPartAssets}
            libraryPartAssetsLoading={libraryPartAssetsLoading}
            libraryPartAssetError={libraryPartAssetError}
            imageDecoder={imageDecoder}
            onImportPart={onImportPart}
            onEquipPartAsset={onEquipPartAsset}
            onRemovePartAsset={onRemovePartAsset}
            unresolvedReferenceCount={unresolvedReferenceCount}
            onConfirmMirrorReview={onConfirmMirrorReview}
            dispatch={dispatch}
            layout={layout}
          />
        ) : null}
        {panelIsVisible("viewport", layout, state) ? (
          <RigViewport
            project={project}
            state={state}
            activeClip={activeClip}
            unresolvedReferenceCount={unresolvedReferenceCount}
            loadedPartCount={partAssets.length}
            selectedPart={selectedPart}
            renderState={renderState}
            walkFrames={walkFrames}
            onLoadPartBlob={onLoadPartBlob}
            onConfigurePart={onConfigurePart}
            onCommitFrameOverride={onCommitFrameOverride}
            dispatch={dispatch}
            layout={layout}
          />
        ) : null}
        {panelIsVisible("inspector", layout, state) ? (
          <Inspector
            project={project}
            state={state}
            activeClip={activeClip}
            unresolvedReferenceCount={unresolvedReferenceCount}
            partAssets={partAssets}
            onSetPartLayerOffset={onSetPartLayerOffset}
            onSetProjectMirrorPolicy={onSetProjectMirrorPolicy}
            onSetPartMirrorPolicy={onSetPartMirrorPolicy}
            onCommitFrameOverride={onCommitFrameOverride}
            onResetDirectionOverrides={onResetDirectionOverrides}
            dispatch={dispatch}
            layout={layout}
          />
        ) : null}
        {panelIsVisible("timeline", layout, state) ? (
          <FrameTimeline
            state={state}
            activeClip={activeClip}
            renderState={renderState}
            walkFrames={walkFrames}
            playback={playback}
            dispatch={dispatch}
            layout={layout}
          />
        ) : null}
      </div>
    </div>
  );
}
