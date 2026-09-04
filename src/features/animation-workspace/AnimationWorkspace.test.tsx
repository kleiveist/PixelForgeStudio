import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseAnimationProject } from "../../schemas";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import { AnimationWorkspace } from "./AnimationWorkspace";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true
  });
}

function renderWorkspace(
  overrides: Parameters<typeof createAnimationProjectInput>[0] = {},
  options: Readonly<{
    canSave?: boolean;
    saveStatus?: "idle" | "dirty" | "saving" | "saved" | "failed";
    saveError?: string | null;
    sourceError?: string | null;
    onSave?: () => void;
  }> = {}
) {
  const project = parseAnimationProject(createAnimationProjectInput(overrides));
  const onSave = options.onSave ?? vi.fn();
  const rendered = render(
    <AnimationWorkspace
      project={project}
      canSave={options.canSave ?? false}
      saveStatus={options.saveStatus ?? "saved"}
      saveError={options.saveError ?? null}
      sourceError={options.sourceError ?? null}
      onSave={onSave}
    />
  );
  return { ...rendered, onSave, project };
}

afterEach(() => {
  setViewportWidth(1024);
});

describe("AnimationWorkspace", () => {
  it("shows the complete loaded desktop workspace and honest unavailable actions", async () => {
    setViewportWidth(1440);
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderWorkspace({}, {
      canSave: true,
      saveStatus: "dirty",
      onSave
    });

    expect(screen.getByRole("heading", { level: 1, name: "Waldwächter Walk" })).toBeVisible();
    expect(screen.getByText("Ungespeicherte Änderungen")).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Teileinventar" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Rig-/Pixel-Viewport" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Eigenschaften" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Timeline" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 3, name: "Körpermitte" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 3, name: "Freie Accessoires" })).toBeVisible();
    expect(screen.getByText(/1 Projekt-Referenz besitzt/)).toBeVisible();

    const headSlot = screen.getByRole("button", {
      name: "Kopf; Erforderlich; Zuordnung nicht geladen"
    });
    expect(headSlot).toHaveAttribute("aria-pressed", "false");

    const playback = screen.getByRole("button", { name: "Play / Pause" });
    const exportButton = screen.getByRole("button", { name: "Exportieren" });
    const importButton = screen.getByRole("button", { name: "PNG-Teil importieren" });
    expect(playback).toBeDisabled();
    expect(playback).toHaveAccessibleDescription(/echten Timeline/);
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAccessibleDescription(/Renderpipeline/);
    expect(importButton).toBeDisabled();
    expect(importButton).toHaveAccessibleDescription(/Prompt 37/);

    await user.click(screen.getByRole("button", { name: "Jetzt speichern" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("selects direction, frame, zoom, overlays and pan with pointer-independent controls", async () => {
    setViewportWidth(1440);
    const user = userEvent.setup();
    renderWorkspace();

    await user.selectOptions(screen.getByRole("combobox", { name: "Richtung" }), "east");
    expect(screen.getByRole("combobox", { name: "Richtung" })).toHaveValue("east");

    const thirdFrame = screen.getByRole("radio", { name: "3 Frameplatz" });
    await user.click(thirdFrame);
    expect(thirdFrame).toHaveAttribute("aria-checked", "true");
    thirdFrame.focus();
    await user.keyboard("{ArrowRight}");
    const fourthFrame = screen.getByRole("radio", { name: "4 Frameplatz" });
    expect(fourthFrame).toHaveAttribute("aria-checked", "true");
    expect(fourthFrame).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "8×" }));
    const frame = screen.getByTestId("animation-project-frame");
    expect(frame).toHaveAttribute("data-zoom", "8");

    const viewport = screen.getByRole("region", { name: "Verschiebbarer Projektframe" });
    viewport.focus();
    await user.keyboard("+");
    expect(frame).toHaveAttribute("data-zoom", "12");
    await user.keyboard("{ArrowRight}{Shift>}{ArrowDown}{/Shift}");
    expect(document.getElementById("animation-viewport-status")).toHaveTextContent(
      "Versatz X 8, Y 32"
    );

    const grid = screen.getByRole("checkbox", { name: "Raster" });
    await user.click(grid);
    expect(grid).not.toBeChecked();
    expect(frame).toHaveAttribute("data-grid", "false");
    expect(screen.getByText("Raster: aus")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Zentrieren" }));
    expect(document.getElementById("animation-viewport-status")).toHaveTextContent(
      "Versatz X 0, Y 0"
    );
  });

  it("switches between project clips and resets the frame selection", async () => {
    setViewportWidth(1440);
    const user = userEvent.setup();
    renderWorkspace({
      clips: [
        {
          clipId: "clip_walk_001",
          templateId: "walk-8-v1",
          action: "walk",
          frameCount: 8,
          fps: 10,
          loop: true
        },
        {
          clipId: "clip_walk_slow_001",
          templateId: "walk-8-v1",
          action: "walk",
          frameCount: 8,
          fps: 6,
          loop: true
        }
      ],
      overrides: []
    });

    await user.click(screen.getByRole("radio", { name: "8 Frameplatz" }));
    expect(screen.getByRole("radio", { name: "8 Frameplatz" })).toHaveAttribute(
      "aria-checked",
      "true"
    );

    const clipSelect = screen.getByRole("combobox", { name: "Clip" });
    await user.selectOptions(clipSelect, "clip_walk_slow_001");
    expect(clipSelect).toHaveValue("clip_walk_slow_001");
    expect(screen.getByRole("radio", { name: "1 Frameplatz" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByText("6 FPS")).toBeVisible();
  });

  it("links slot and frame selections to contextual read-only inspector states", async () => {
    setViewportWidth(1440);
    const user = userEvent.setup();
    renderWorkspace();

    const headSlot = screen.getByRole("button", {
      name: "Kopf; Erforderlich; Zuordnung nicht geladen"
    });
    headSlot.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Part" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const inspector = screen.getByRole("heading", { level: 2, name: "Eigenschaften" }).closest("section");
    if (!inspector) throw new Error("Inspector panel missing.");
    expect(within(inspector).getByText("Nicht aufgelöst")).toBeVisible();
    expect(within(inspector).getByText("Noch nicht geladen")).toBeVisible();
    expect(within(inspector).queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "8 Frameplatz" }));
    expect(screen.getByRole("button", { name: "Frame" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(inspector).getByText("8 von 8")).toBeVisible();
  });

  it("switches the medium side panel semantically and focuses its heading", async () => {
    setViewportWidth(900);
    const user = userEvent.setup();
    const { container } = renderWorkspace();

    expect(container.firstElementChild).toHaveAttribute("data-workspace-layout", "medium");
    expect(screen.getByRole("heading", { level: 2, name: "Teileinventar" })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 2, name: "Eigenschaften" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Rig-/Pixel-Viewport" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Timeline" })).toBeVisible();

    const sidePicker = screen.getByRole("group", { name: "Seitenpaneel auswählen" });
    await user.click(within(sidePicker).getByRole("button", { name: "Eigenschaften" }));

    expect(screen.queryByRole("heading", { level: 2, name: "Teileinventar" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Eigenschaften" })).toHaveFocus();
  });

  it("offers progressive small-screen tabs with keyboard selection and focus transfer", async () => {
    setViewportWidth(480);
    const user = userEvent.setup();
    const { container } = renderWorkspace();

    expect(container.firstElementChild).toHaveAttribute("data-workspace-layout", "small");
    const tabs = screen.getByRole("tablist", { name: "Workspace-Paneele" });
    expect(within(tabs).getAllByRole("tab").map(({ textContent }) => textContent)).toEqual([
      "Teile",
      "Viewport",
      "Eigenschaften",
      "Timeline"
    ]);
    expect(screen.getByRole("heading", { level: 2, name: "Rig-/Pixel-Viewport" })).toBeVisible();
    expect(screen.getByText("Keine renderbaren Bilddaten")).toBeVisible();
    expect(screen.queryByRole("heading", { level: 2, name: "Timeline" })).not.toBeInTheDocument();

    await user.click(within(tabs).getByRole("tab", { name: "Teile" }));
    expect(screen.getByRole("heading", { level: 2, name: "Teileinventar" })).toHaveFocus();
    expect(screen.queryByRole("heading", { level: 2, name: "Rig-/Pixel-Viewport" })).not.toBeInTheDocument();

    const partsTab = within(tabs).getByRole("tab", { name: "Teile" });
    partsTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("heading", { level: 2, name: "Rig-/Pixel-Viewport" })).toHaveFocus();
    expect(within(tabs).getByRole("tab", { name: "Viewport" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("keeps empty project and repository/source errors explicit", () => {
    setViewportWidth(1440);
    renderWorkspace(
      { parts: [], clips: [], overrides: [] },
      {
        saveStatus: "failed",
        saveError: "Projektmetadaten konnten nicht gespeichert werden.",
        sourceError: "Part-Metadaten sind beschädigt."
      }
    );

    expect(screen.getByText("Noch keine Teile zugewiesen")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Clip" })).toBeDisabled();
    expect(screen.getByText("Kein Clip vorhanden. Die Timeline erzeugt keine Beispieldaten.")).toBeVisible();
    expect(screen.getByText("Projektmetadaten konnten nicht gespeichert werden.")).toHaveAttribute("role", "alert");
    expect(screen.getByText("Part-Metadaten sind beschädigt.")).toHaveAttribute("role", "alert");
  });

  it("reacts to runtime viewport changes without persisting pane state", () => {
    setViewportWidth(1440);
    const { container } = renderWorkspace();
    expect(container.firstElementChild).toHaveAttribute("data-workspace-layout", "desktop");

    setViewportWidth(600);
    fireEvent(window, new Event("resize"));
    expect(container.firstElementChild).toHaveAttribute("data-workspace-layout", "small");
    expect(screen.getByRole("tab", { name: "Viewport" })).toHaveAttribute("aria-selected", "true");
  });
});
