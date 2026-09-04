import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type CSSProperties,
  type KeyboardEvent
} from "react";
import { Badge, Surface } from "../../components/ui";
import {
  getBuiltInRigTemplate,
  isDirection,
  type PartSlot
} from "../../domain/animation";
import {
  PartImportPanel,
  createPartCoverageMatrix,
  findPartAssetForSource,
  type PartImportCommitDefinition,
  type PartImportCommitResult
} from "../animation-part-import";
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
import { RigOverlay } from "./RigOverlay";
import { useWorkspaceLayout } from "./useWorkspaceLayout";

export type WorkspaceSaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "failed";

export interface AnimationWorkspaceProps {
  readonly project: AnimationProject;
  readonly canSave: boolean;
  readonly saveStatus: WorkspaceSaveStatus;
  readonly saveError: string | null;
  readonly sourceError: string | null;
  readonly onSave: () => void;
  readonly partAssets?: readonly AnimationPartAsset[];
  readonly missingPartAssetIds?: readonly StableId[];
  readonly partAssetLoadError?: string | null;
  readonly partAssetsLoading?: boolean;
  readonly imageDecoder?: ImageDecoder | null;
  readonly onImportPart?: (
    definition: PartImportCommitDefinition
  ) => Promise<PartImportCommitResult>;
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
}

function WorkspaceToolbar({
  project,
  state,
  canSave,
  saveStatus,
  saveError,
  sourceError,
  dispatch,
  onSave
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
              {option.label} · {option.source === "authored" ? "Quelle" : "gespiegelt"}
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
        <button
          className={styles.secondaryButton}
          type="button"
          disabled
          aria-describedby="animation-playback-unavailable"
        >
          Play / Pause
        </button>
        <span id="animation-playback-unavailable" className={styles.actionReason}>
          Wiedergabe wird mit der echten Timeline aktiviert.
        </span>
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
  dispatch,
  layout
}: PartInventoryProps) {
  const selectedSlotDefinition = getPartSlotDefinition(selectedSlot);
  const existingPart = selectedSlot
    ? findPartAssetForSource(partAssets, selectedSlot, direction)
    : null;
  const coverage = createPartCoverageMatrix(project, partAssets);
  const coverageLabels = {
    authoredSource: "Quelle",
    missing: "Fehlt",
    optional: "Optional",
    anchorPending: "Anker offen"
  } as const;
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
                    : "Quelle vorhanden"
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
                    <td key={cell.direction} data-coverage={cell.status}>
                      {coverageLabels[cell.status]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Surface>
  );
}

interface RigViewportProps {
  readonly project: AnimationProject;
  readonly state: AnimationWorkspaceState;
  readonly activeClip: AnimationClip | null;
  readonly unresolvedReferenceCount: number;
  readonly loadedPartCount: number;
  readonly dispatch: (action: AnimationWorkspaceAction) => void;
  readonly layout: WorkspaceLayout;
}

function RigViewport({
  project,
  state,
  activeClip,
  unresolvedReferenceCount,
  loadedPartCount,
  dispatch,
  layout
}: RigViewportProps) {
  const rigTemplate = getBuiltInRigTemplate(project.rigTemplateId);
  const hasDirectionRig =
    rigTemplate?.directions.some(
      (directionRig) => directionRig.direction === state.direction
    ) ?? false;
  const frameStyle = {
    width: `${project.frameProfile.frameSize.width * state.zoom}px`,
    height: `${project.frameProfile.frameSize.height * state.zoom}px`,
    transform: `translate(${state.pan.x}px, ${state.pan.y}px)`,
    "--workspace-pixel-size": `${state.zoom}px`
  } as CSSProperties;

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
          {unresolvedReferenceCount > 0
            ? "Keine renderbaren Bilddaten"
            : loadedPartCount > 0
              ? "Partquellen validiert geladen"
              : "Viewport wartet auf Teile"}
        </strong>{" "}
        {unresolvedReferenceCount > 0
          ? `${unresolvedReferenceCount} Asset-Referenz${unresolvedReferenceCount === 1 ? "" : "en"} ist noch nicht bis zum Blob aufgelöst; der Projektframe bleibt absichtlich leer.`
          : loadedPartCount > 0
            ? `${loadedPartCount} Part-${loadedPartCount === 1 ? "Quelle ist" : "Quellen sind"} dem Projekt zugewiesen; die Renderpipeline folgt in ihrer eigenen Phase.`
            : "Dem Projekt sind noch keine PartAssets zugewiesen; es wird kein Dummybild erzeugt."}{" "}
        {rigTemplate
          ? ` Das SVG-Overlay liest die versionierte Neutralpose direkt aus ${rigTemplate.id}; es platziert noch keine Partbilder.`
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
            {unresolvedReferenceCount > 0
              ? "Bilddaten fehlen"
              : loadedPartCount > 0
                ? "Renderer folgt"
                : "Keine Teile belegt"}
          </span>
        </div>
      </div>

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
    </Surface>
  );
}

interface InspectorProps {
  readonly project: AnimationProject;
  readonly state: AnimationWorkspaceState;
  readonly activeClip: AnimationClip | null;
  readonly unresolvedReferenceCount: number;
  readonly partAssets: readonly AnimationPartAsset[];
  readonly dispatch: (action: AnimationWorkspaceAction) => void;
  readonly layout: WorkspaceLayout;
}

function Inspector({
  project,
  state,
  activeClip,
  unresolvedReferenceCount,
  partAssets,
  dispatch,
  layout
}: InspectorProps) {
  const selectedSlot = getPartSlotDefinition(state.selectedSlot);
  const selectedPart = state.selectedSlot
    ? findPartAssetForSource(partAssets, state.selectedSlot, state.direction)
    : null;
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
                <div><dt>Anker / Pivot</dt><dd>{selectedPart?.anchorStatus === "anchorsPending" ? "Ausstehend – Produktion gesperrt" : selectedPart?.anchors ? `${selectedPart.anchors.proximal.x} / ${selectedPart.anchors.proximal.y}` : "Noch nicht verfügbar"}</dd></div>
                <div><dt>Skalierung / Offset / Layer</dt><dd>Noch nicht verfügbar</dd></div>
                <div><dt>Spiegelregel</dt><dd>{selectedPart?.mirrorPolicy ?? "Noch nicht verfügbar"}</dd></div>
              </dl>
              <p className={styles.emptyDetail}>
                Importierte Originalbilder bleiben unverändert gespeichert. Anker werden erst in der dafür vorgesehenen Bearbeitungsphase gesetzt.
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
  readonly dispatch: (action: AnimationWorkspaceAction) => void;
  readonly layout: WorkspaceLayout;
}

function FrameTimeline({ state, activeClip, dispatch, layout }: TimelineProps) {
  const selectFrame = (frameIndex: number, focus: boolean) => {
    if (!activeClip) return;
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
                aria-checked={state.frameIndex === frameIndex}
                tabIndex={state.frameIndex === frameIndex ? 0 : -1}
                onClick={() => selectFrame(frameIndex, false)}
                onKeyDown={(event) => handleFrameKeyDown(event, frameIndex)}
              >
                <span className={styles.frameNumber}>{frameIndex + 1}</span>
                <span className={styles.framePlaceholder}>Frameplatz</span>
              </button>
            ))}
          </div>
          <p className={styles.timelineStatus} role="status" aria-live="polite">
            Frame {state.frameIndex + 1} von {activeClip.frameCount} · {DIRECTION_LABELS[state.direction]} · {activeClip.fps} Bilder pro Sekunde. Wiedergabe ist noch nicht aktiv.
          </p>
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
  canSave,
  saveStatus,
  saveError,
  sourceError,
  onSave,
  partAssets = [],
  missingPartAssetIds,
  partAssetLoadError = null,
  partAssetsLoading = false,
  imageDecoder = null,
  onImportPart = async () => ({
    status: "error",
    message: "Der Part-Import ist in dieser Ansicht nicht verbunden."
  })
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
            dispatch={dispatch}
            layout={layout}
          />
        ) : null}
        {panelIsVisible("timeline", layout, state) ? (
          <FrameTimeline
            state={state}
            activeClip={activeClip}
            dispatch={dispatch}
            layout={layout}
          />
        ) : null}
      </div>
    </div>
  );
}
