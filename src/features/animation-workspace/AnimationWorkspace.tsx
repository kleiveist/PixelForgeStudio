import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent
} from "react";
import { Badge, Surface } from "../../components/ui";
import {
  HUMANOID_WALK_CLIP_ID,
  HUMANOID_WALK_FRAME_COUNT,
  HUMANOID_WALK_PHASES,
  MAX_PROJECT_LAYER_OFFSET,
  MIN_PROJECT_LAYER_OFFSET,
  getBuiltInRigTemplate,
  getDefaultLayerGroup,
  getDirectionDrawOrder,
  isDirection,
  resolveDirectionDrawOrder,
  resolveRuntimeDirectionRig,
  type FrameEdge,
  type LayerGroup,
  type MirrorPolicy,
  type PartSlot,
  type RenderDiagnostic,
  type RenderedFrame
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

export interface AnimationWorkspaceProps {
  readonly project: AnimationProject;
  readonly canSave: boolean;
  readonly saveStatus: WorkspaceSaveStatus;
  readonly saveError: string | null;
  readonly sourceError: string | null;
  readonly projectRevision?: number;
  readonly playbackScheduler?: AnimationFrameScheduler;
  readonly onSave: () => void;
  readonly partAssets?: readonly AnimationPartAsset[];
  readonly missingPartAssetIds?: readonly StableId[];
  readonly partAssetLoadError?: string | null;
  readonly partAssetsLoading?: boolean;
  readonly imageDecoder?: ImageDecoder | null;
  readonly onImportPart?: (
    definition: PartImportCommitDefinition
  ) => Promise<PartImportCommitResult>;
  readonly onLoadPartBlob?: (blobId: StableId) => Promise<PartBlobLoadResult>;
  readonly onConfigurePart?: (
    definition: AnchorEditorCommitDefinition
  ) => Promise<AnchorEditorCommitResult>;
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
}

const DISCONNECTED_PART_IMPORT: NonNullable<
  AnimationWorkspaceProps["onImportPart"]
> = async () => ({
  status: "error",
  message: "Der Part-Import ist in dieser Ansicht nicht verbunden."
});

const EMPTY_PART_ASSETS: readonly AnimationPartAsset[] = Object.freeze([]);

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
  readonly playback: AnimationPlaybackController;
  readonly playbackEnabled: boolean;
  readonly playbackMessage: string;
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
  playback,
  playbackEnabled,
  playbackMessage
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
            disabled
            aria-describedby="animation-export-unavailable"
          >
            Exportieren
          </button>
          <span id="animation-export-unavailable" className={styles.actionReason}>
            Export bleibt bis zur Renderpipeline gesperrt.
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
  readonly imageDecoder: ImageDecoder | null;
  readonly onImportPart: (
    definition: PartImportCommitDefinition
  ) => Promise<PartImportCommitResult>;
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
  imageDecoder,
  onImportPart,
  unresolvedReferenceCount,
  onConfirmMirrorReview,
  dispatch,
  layout
}: PartInventoryProps) {
  const [reviewCell, setReviewCell] = useState<PartCoverageCell | null>(null);
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedSlotDefinition = getPartSlotDefinition(selectedSlot);
  const existingPart = selectedSlot
    ? findPartAssetForSource(partAssets, selectedSlot, direction)
    : null;
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
  dispatch,
  layout
}: RigViewportProps) {
  const [showAllDirections, setShowAllDirections] = useState(false);
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
        Tastatur: Pfeile verschieben um 8 px, Umschalt + Pfeil um 32 px, +/− zoomt, Pos1 zentriert.
      </p>
      <p id="animation-viewport-status" className={styles.viewportStatus} role="status" aria-live="polite">
        {project.frameProfile.frameSize.width} × {project.frameProfile.frameSize.height} Projektpixel · Zoom {state.zoom}× · Versatz X {state.pan.x}, Y {state.pan.y} · {DIRECTION_LABELS[state.direction]} · Frame {activeClip ? state.frameIndex + 1 : "–"}
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
            <>
              <dl className={styles.factList}>
                <div><dt>Clip</dt><dd>{clipLabel(activeClip)}</dd></div>
                <div><dt>Frame</dt><dd>{state.frameIndex + 1} von {activeClip.frameCount}</dd></div>
                <div><dt>Richtung</dt><dd>{DIRECTION_LABELS[state.direction]}</dd></div>
                <div><dt>Root-Offset</dt><dd>Noch nicht bearbeitbar</dd></div>
                <div><dt>Joint-/Partkorrekturen</dt><dd>Noch nicht bearbeitbar</dd></div>
                <div><dt>Layer-Override</dt><dd>Noch nicht bearbeitbar</dd></div>
              </dl>
              <p className={styles.emptyDetail}>
                Die Timeline wählt bereits den Ziel-Frame; Rigänderungen folgen in einer eigenen Phase.
              </p>
            </>
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
  partAssets = EMPTY_PART_ASSETS,
  missingPartAssetIds,
  partAssetLoadError = null,
  partAssetsLoading = false,
  imageDecoder = null,
  onImportPart = DISCONNECTED_PART_IMPORT,
  onLoadPartBlob = DISCONNECTED_PART_BLOB_LOADER,
  onConfigurePart = DISCONNECTED_PART_CONFIGURATION,
  onSetPartLayerOffset = DISCONNECTED_LAYER_CONFIGURATION,
  onSetProjectMirrorPolicy = DISCONNECTED_MIRROR_CONFIGURATION,
  onSetPartMirrorPolicy = DISCONNECTED_MIRROR_CONFIGURATION,
  onConfirmMirrorReview = DISCONNECTED_MIRROR_CONFIGURATION
}: AnimationWorkspaceProps) {
  const [state, dispatch] = useReducer(
    animationWorkspaceReducer,
    project,
    createAnimationWorkspaceState
  );
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
        type: "frameSelected",
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

  return (
    <div ref={rootRef} className={styles.workspace} data-workspace-layout={layout}>
      <WorkspaceToolbar
        project={project}
        state={state}
        canSave={canSave}
        saveStatus={saveStatus}
        saveError={saveError}
        sourceError={sourceError}
        dispatch={dispatch}
        onSave={onSave}
        playback={playback}
        playbackEnabled={playbackEnabled}
        playbackMessage={playbackMessage}
      />
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
            imageDecoder={imageDecoder}
            onImportPart={onImportPart}
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
