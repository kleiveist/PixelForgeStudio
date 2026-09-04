import { describe, expect, it } from "vitest";
import { PART_SLOT_IDS, REQUIRED_PART_SLOT_IDS } from "../../domain/animation";
import { parseAnimationProject } from "../../schemas";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import {
  WORKSPACE_SLOT_GROUPS,
  animationWorkspaceReducer,
  createAnimationWorkspaceState,
  getActiveWorkspaceClip,
  getWorkspaceDirectionOptions,
  getWorkspaceLayout
} from "./animationWorkspaceModel";

const project = parseAnimationProject(createAnimationProjectInput());

describe("animation workspace model", () => {
  it("projects every canonical slot into its domain group and required status", () => {
    const slots = WORKSPACE_SLOT_GROUPS.flatMap((group) => group.slots);

    expect(WORKSPACE_SLOT_GROUPS).toHaveLength(10);
    expect(slots.map(({ id }) => id)).toEqual(
      expect.arrayContaining([...PART_SLOT_IDS])
    );
    expect(slots).toHaveLength(PART_SLOT_IDS.length);
    expect(slots.filter(({ required }) => required).map(({ id }) => id)).toEqual(
      expect.arrayContaining([...REQUIRED_PART_SLOT_IDS])
    );
    expect(slots.filter(({ required }) => required)).toHaveLength(15);
    expect(slots.filter(({ required }) => !required)).toHaveLength(24);
  });

  it("initializes only temporary selection from the loaded project", () => {
    const state = createAnimationWorkspaceState(project);

    expect(state).toMatchObject({
      direction: "south",
      clipId: "clip_walk_001",
      frameIndex: 0,
      onionSkinMode: "off",
      onionSkinOpacity: 0.25,
      selectedSlot: null,
      activePanel: "viewport",
      activeSidePanel: "parts",
      inspectorContext: "project",
      zoom: 4,
      pan: { x: 0, y: 0 }
    });
    expect(state.overlays).toEqual({
      grid: true,
      rig: true,
      anchors: true,
      boundingBoxes: false,
      footline: true
    });
    expect(getActiveWorkspaceClip(project, state.clipId)?.frameCount).toBe(8);
  });

  it("reduces direction, frame, slot, panes, zoom, overlays and pan without touching project data", () => {
    const initial = createAnimationWorkspaceState(project);
    const direction = animationWorkspaceReducer(initial, {
      type: "directionSelected",
      direction: "east"
    });
    const frame = animationWorkspaceReducer(direction, {
      type: "frameSelected",
      frameIndex: 99,
      frameCount: 8
    });
    const slot = animationWorkspaceReducer(frame, {
      type: "slotSelected",
      slot: "head"
    });
    const panel = animationWorkspaceReducer(slot, {
      type: "panelSelected",
      panel: "inspector"
    });
    const sidePanel = animationWorkspaceReducer(panel, {
      type: "sidePanelSelected",
      panel: "inspector"
    });
    const zoomed = animationWorkspaceReducer(sidePanel, {
      type: "zoomStepped",
      step: 1
    });
    const overlay = animationWorkspaceReducer(zoomed, {
      type: "overlayToggled",
      overlay: "grid"
    });
    const panned = animationWorkspaceReducer(overlay, {
      type: "panned",
      deltaX: 8,
      deltaY: -32
    });
    const onionMode = animationWorkspaceReducer(panned, {
      type: "onionSkinModeSelected",
      mode: "both"
    });
    const onionOpacity = animationWorkspaceReducer(onionMode, {
      type: "onionSkinOpacitySelected",
      opacity: 9
    });

    expect(onionOpacity).toMatchObject({
      direction: "east",
      frameIndex: 7,
      selectedSlot: "head",
      activePanel: "inspector",
      activeSidePanel: "inspector",
      inspectorContext: "part",
      zoom: 8,
      pan: { x: 8, y: -32 },
      onionSkinMode: "both",
      onionSkinOpacity: 0.6
    });
    expect(onionOpacity.overlays.grid).toBe(false);
    expect(project.parts).toEqual([{ assetId: "part_head_south_001" }]);
  });

  it("keeps zoom inside the six integer levels and resets pan", () => {
    let state = createAnimationWorkspaceState(project);
    state = animationWorkspaceReducer(state, { type: "zoomSelected", zoom: 16 });
    state = animationWorkspaceReducer(state, { type: "zoomStepped", step: 1 });
    state = animationWorkspaceReducer(state, {
      type: "panned",
      deltaX: 12,
      deltaY: 20
    });
    state = animationWorkspaceReducer(state, { type: "panReset" });

    expect(state.zoom).toBe(16);
    expect(state.pan).toEqual({ x: 0, y: 0 });
  });

  it("derives authored and mirrored direction labels and responsive modes", () => {
    expect(
      getWorkspaceDirectionOptions(project).map(({ direction, source }) => [
        direction,
        source
      ])
    ).toEqual([
      ["south", "authored"],
      ["southEast", "authored"],
      ["east", "authored"],
      ["northEast", "authored"],
      ["north", "authored"],
      ["northWest", "mirrored"],
      ["west", "mirrored"],
      ["southWest", "mirrored"]
    ]);
    expect(getWorkspaceLayout(1440)).toBe("desktop");
    expect(getWorkspaceLayout(900)).toBe("medium");
    expect(getWorkspaceLayout(360)).toBe("small");
  });
});
