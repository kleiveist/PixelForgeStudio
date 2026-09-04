import {
  DIRECTION_IDS,
  PART_SLOT_DEFINITIONS,
  PART_SLOT_GROUPS,
  getRequiredAuthoredDirections,
  type Direction,
  type PartSlot,
  type PartSlotDefinition,
  type PartSlotGroupDefinition
} from "../../domain/animation";
import type { AnimationClip, AnimationProject, StableId } from "../../schemas";
import {
  DEFAULT_ONION_SKIN_OPACITY,
  clampOnionSkinOpacity,
  type OnionSkinMode
} from "./onionSkin";

export const WORKSPACE_ZOOM_LEVELS = Object.freeze([
  1,
  2,
  4,
  8,
  12,
  16
] as const);

export const WORKSPACE_OVERLAY_IDS = Object.freeze([
  "grid",
  "rig",
  "anchors",
  "boundingBoxes",
  "footline"
] as const);

export const WORKSPACE_PANEL_IDS = Object.freeze([
  "parts",
  "viewport",
  "inspector",
  "timeline"
] as const);

export type WorkspaceZoom = (typeof WORKSPACE_ZOOM_LEVELS)[number];
export type WorkspaceOverlay = (typeof WORKSPACE_OVERLAY_IDS)[number];
export type WorkspacePanel = (typeof WORKSPACE_PANEL_IDS)[number];
export type WorkspaceSidePanel = Extract<WorkspacePanel, "parts" | "inspector">;
export type WorkspaceInspectorContext = "project" | "part" | "frame";
export type WorkspaceLayout = "desktop" | "medium" | "small";

export interface WorkspaceSlotGroup extends PartSlotGroupDefinition {
  readonly slots: readonly PartSlotDefinition[];
}

export interface AnimationWorkspaceState {
  readonly direction: Direction;
  readonly clipId: StableId | null;
  readonly frameIndex: number;
  readonly onionSkinMode: OnionSkinMode;
  readonly onionSkinOpacity: number;
  readonly selectedSlot: PartSlot | null;
  readonly activePanel: WorkspacePanel;
  readonly activeSidePanel: WorkspaceSidePanel;
  readonly inspectorContext: WorkspaceInspectorContext;
  readonly zoom: WorkspaceZoom;
  readonly overlays: Readonly<Record<WorkspaceOverlay, boolean>>;
  readonly pan: Readonly<{ x: number; y: number }>;
}

export type AnimationWorkspaceAction =
  | Readonly<{ type: "directionSelected"; direction: Direction }>
  | Readonly<{
      type: "clipSelected";
      clipId: StableId;
      frameCount: number;
    }>
  | Readonly<{
      type: "frameSelected";
      frameIndex: number;
      frameCount: number;
    }>
  | Readonly<{ type: "onionSkinModeSelected"; mode: OnionSkinMode }>
  | Readonly<{ type: "onionSkinOpacitySelected"; opacity: number }>
  | Readonly<{ type: "slotSelected"; slot: PartSlot }>
  | Readonly<{ type: "panelSelected"; panel: WorkspacePanel }>
  | Readonly<{ type: "sidePanelSelected"; panel: WorkspaceSidePanel }>
  | Readonly<{
      type: "inspectorContextSelected";
      context: WorkspaceInspectorContext;
    }>
  | Readonly<{ type: "zoomSelected"; zoom: WorkspaceZoom }>
  | Readonly<{ type: "zoomStepped"; step: -1 | 1 }>
  | Readonly<{ type: "overlayToggled"; overlay: WorkspaceOverlay }>
  | Readonly<{ type: "panned"; deltaX: number; deltaY: number }>
  | Readonly<{ type: "panReset" }>;

export const DIRECTION_LABELS: Readonly<Record<Direction, string>> =
  Object.freeze({
    south: "Süd",
    southEast: "Südost",
    east: "Ost",
    northEast: "Nordost",
    north: "Nord",
    northWest: "Nordwest",
    west: "West",
    southWest: "Südwest"
  });

export const OVERLAY_LABELS: Readonly<Record<WorkspaceOverlay, string>> =
  Object.freeze({
    grid: "Raster",
    rig: "Rig",
    anchors: "Anker",
    boundingBoxes: "Begrenzungsrahmen",
    footline: "Fußlinie"
  });

export const PANEL_LABELS: Readonly<Record<WorkspacePanel, string>> =
  Object.freeze({
    parts: "Teile",
    viewport: "Viewport",
    inspector: "Eigenschaften",
    timeline: "Timeline"
  });

export const WORKSPACE_SLOT_GROUPS: readonly WorkspaceSlotGroup[] =
  Object.freeze(
    PART_SLOT_GROUPS.map((group) =>
      Object.freeze({
        ...group,
        slots: Object.freeze(
          PART_SLOT_DEFINITIONS.filter((slot) => slot.groupId === group.id)
        )
      })
    )
  );

export const WORKSPACE_SLOT_COUNT = PART_SLOT_DEFINITIONS.length;

const INITIAL_OVERLAYS: Readonly<Record<WorkspaceOverlay, boolean>> =
  Object.freeze({
    grid: true,
    rig: true,
    anchors: true,
    boundingBoxes: false,
    footline: true
  });

function clampFrameIndex(frameIndex: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  return Math.min(Math.max(Math.trunc(frameIndex), 0), frameCount - 1);
}

function stepZoom(zoom: WorkspaceZoom, step: -1 | 1): WorkspaceZoom {
  const currentIndex = WORKSPACE_ZOOM_LEVELS.indexOf(zoom);
  const nextIndex = Math.min(
    Math.max(currentIndex + step, 0),
    WORKSPACE_ZOOM_LEVELS.length - 1
  );
  return WORKSPACE_ZOOM_LEVELS[nextIndex] ?? zoom;
}

export function createAnimationWorkspaceState(
  project: AnimationProject
): AnimationWorkspaceState {
  const direction =
    getRequiredAuthoredDirections(project.directionSourceMode)[0] ??
    DIRECTION_IDS[0];
  return Object.freeze({
    direction,
    clipId: project.clips[0]?.clipId ?? null,
    frameIndex: 0,
    onionSkinMode: "off",
    onionSkinOpacity: DEFAULT_ONION_SKIN_OPACITY,
    selectedSlot: null,
    activePanel: "viewport",
    activeSidePanel: "parts",
    inspectorContext: "project",
    zoom: 4,
    overlays: INITIAL_OVERLAYS,
    pan: Object.freeze({ x: 0, y: 0 })
  });
}

export function animationWorkspaceReducer(
  state: AnimationWorkspaceState,
  action: AnimationWorkspaceAction
): AnimationWorkspaceState {
  switch (action.type) {
    case "directionSelected":
      return Object.freeze({ ...state, direction: action.direction });
    case "clipSelected":
      return Object.freeze({
        ...state,
        clipId: action.clipId,
        frameIndex: clampFrameIndex(0, action.frameCount),
        inspectorContext: "frame"
      });
    case "frameSelected":
      return Object.freeze({
        ...state,
        frameIndex: clampFrameIndex(action.frameIndex, action.frameCount),
        inspectorContext: "frame"
      });
    case "onionSkinModeSelected":
      return Object.freeze({ ...state, onionSkinMode: action.mode });
    case "onionSkinOpacitySelected":
      return Object.freeze({
        ...state,
        onionSkinOpacity: clampOnionSkinOpacity(action.opacity)
      });
    case "slotSelected":
      return Object.freeze({
        ...state,
        selectedSlot: action.slot,
        inspectorContext: "part"
      });
    case "panelSelected":
      return Object.freeze({ ...state, activePanel: action.panel });
    case "sidePanelSelected":
      return Object.freeze({ ...state, activeSidePanel: action.panel });
    case "inspectorContextSelected":
      return Object.freeze({ ...state, inspectorContext: action.context });
    case "zoomSelected":
      return Object.freeze({ ...state, zoom: action.zoom });
    case "zoomStepped":
      return Object.freeze({ ...state, zoom: stepZoom(state.zoom, action.step) });
    case "overlayToggled":
      return Object.freeze({
        ...state,
        overlays: Object.freeze({
          ...state.overlays,
          [action.overlay]: !state.overlays[action.overlay]
        })
      });
    case "panned":
      return Object.freeze({
        ...state,
        pan: Object.freeze({
          x: state.pan.x + action.deltaX,
          y: state.pan.y + action.deltaY
        })
      });
    case "panReset":
      return Object.freeze({
        ...state,
        pan: Object.freeze({ x: 0, y: 0 })
      });
  }
}

export function getWorkspaceLayout(viewportWidth: number): WorkspaceLayout {
  if (viewportWidth < 720) return "small";
  if (viewportWidth < 1120) return "medium";
  return "desktop";
}

export function getActiveWorkspaceClip(
  project: AnimationProject,
  clipId: StableId | null
): AnimationClip | null {
  if (!clipId) return null;
  return project.clips.find((clip) => clip.clipId === clipId) ?? null;
}

export function getWorkspaceDirectionOptions(
  project: AnimationProject
): readonly Readonly<{
  direction: Direction;
  label: string;
  source: "authored" | "mirrored";
}>[] {
  const authored = new Set(
    getRequiredAuthoredDirections(project.directionSourceMode)
  );
  return Object.freeze(
    DIRECTION_IDS.map((direction) =>
      Object.freeze({
        direction,
        label: DIRECTION_LABELS[direction],
        source: authored.has(direction) ? "authored" : "mirrored"
      })
    )
  );
}

export function getPartSlotDefinition(
  slot: PartSlot | null
): PartSlotDefinition | null {
  if (!slot) return null;
  return PART_SLOT_DEFINITIONS.find((definition) => definition.id === slot) ?? null;
}
