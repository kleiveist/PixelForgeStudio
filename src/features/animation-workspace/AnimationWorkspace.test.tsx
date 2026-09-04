import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseAnimationPartAsset, parseAnimationProject } from "../../schemas";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../../test/animationSchemaFixtures";
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
  it("shows a ready part through the software-rendered canvas adapter", async () => {
    setViewportWidth(1440);
    const project = parseAnimationProject(
      createAnimationProjectInput({
        parts: [{ assetId: "part_head_south_001" }],
        overrides: []
      })
    );
    const partAsset = parseAnimationPartAsset(createAnimationPartAssetInput());
    const pixels = new Uint8ClampedArray(32 * 40 * 4);
    pixels.set([255, 0, 0, 255], (30 * 32 + 16) * 4);
    const decoder = { decode: vi.fn(async () => ({ width: 32, height: 40, pixels })) };
    const loadBlob = vi.fn(async () => ({
      status: "ok" as const,
      blob: new Blob(["source"], { type: "image/png" })
    }));
    const imageData = { data: new Uint8ClampedArray(128 * 128 * 4) } as ImageData;
    const context = {
      imageSmoothingEnabled: true,
      createImageData: vi.fn(() => imageData),
      putImageData: vi.fn()
    };
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);

    try {
      render(
        <AnimationWorkspace
          project={project}
          canSave={false}
          saveStatus="saved"
          saveError={null}
          sourceError={null}
          onSave={vi.fn()}
          partAssets={[partAsset]}
          missingPartAssetIds={[]}
          imageDecoder={decoder}
          onLoadPartBlob={loadBlob}
        />
      );

      const canvas = await screen.findByRole("img", {
        name: "Gerenderter Projektframe mit 1 Part"
      });
      expect(canvas).toHaveAttribute("data-rendered-parts", "1");
      expect(screen.getByText("Neutralpose deterministisch gerendert")).toBeVisible();
      await waitFor(() => expect(context.putImageData).toHaveBeenCalledTimes(1));
      expect(context.imageSmoothingEnabled).toBe(false);
      expect(decoder.decode).toHaveBeenCalledTimes(1);
      expect(loadBlob).toHaveBeenCalledWith("blob_head_south_001");
      const renderedOffset = (44 * 128 + 64) * 4;
      expect([...imageData.data.slice(renderedOffset, renderedOffset + 4)]).toEqual([
        255,
        0,
        0,
        255
      ]);
    } finally {
      getContext.mockRestore();
    }
  });

  it("rerenders authored pixels when the selected direction changes", async () => {
    setViewportWidth(1440);
    const user = userEvent.setup();
    const south = parseAnimationPartAsset(createAnimationPartAssetInput());
    const east = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        assetId: "part_head_east_001",
        blobId: "blob_head_east_001",
        label: "Kopf Ost",
        direction: "east"
      })
    );
    const project = parseAnimationProject(
      createAnimationProjectInput({
        parts: [{ assetId: south.assetId }, { assetId: east.assetId }],
        overrides: []
      })
    );
    const decoder = {
      decode: vi.fn(async (blob: Blob) => {
        const pixels = new Uint8ClampedArray(32 * 40 * 4);
        const color = blob.type === "image/east" ? [0, 0, 255, 255] : [255, 0, 0, 255];
        pixels.set(color, (30 * 32 + 16) * 4);
        return { width: 32, height: 40, pixels };
      })
    };
    const loadBlob = vi.fn(async (blobId: string) => ({
      status: "ok" as const,
      blob: new Blob([blobId], {
        type: blobId === east.blobId ? "image/east" : "image/south"
      })
    }));
    const snapshots: Uint8ClampedArray[] = [];
    const context = {
      imageSmoothingEnabled: true,
      createImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(128 * 128 * 4)
      } as ImageData)),
      putImageData: vi.fn((imageData: ImageData) => {
        snapshots.push(Uint8ClampedArray.from(imageData.data));
      })
    };
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);

    try {
      render(
        <AnimationWorkspace
          project={project}
          canSave={false}
          saveStatus="saved"
          saveError={null}
          sourceError={null}
          onSave={vi.fn()}
          partAssets={[south, east]}
          missingPartAssetIds={[]}
          imageDecoder={decoder}
          onLoadPartBlob={loadBlob}
        />
      );

      await waitFor(() => expect(decoder.decode).toHaveBeenCalledTimes(1));
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Richtung" }),
        "east"
      );
      await waitFor(() => expect(decoder.decode).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(snapshots.length).toBeGreaterThanOrEqual(2));
      const eastPixelOffset = (44 * 128 + 61) * 4;
      expect([
        ...snapshots.at(-1)!.slice(eastPixelOffset, eastPixelOffset + 4)
      ]).toEqual([0, 0, 255, 255]);
      expect(loadBlob).toHaveBeenLastCalledWith(east.blobId);
    } finally {
      getContext.mockRestore();
    }
  });

  it("shows directional layer facts and commits a bounded project layer delta", async () => {
    setViewportWidth(1440);
    const user = userEvent.setup();
    const partAsset = parseAnimationPartAsset(createAnimationPartAssetInput());
    const project = parseAnimationProject(
      createAnimationProjectInput({
        parts: [{ assetId: partAsset.assetId, layerOffset: -1 }],
        overrides: []
      })
    );
    const onSetPartLayerOffset = vi.fn(async () => ({ status: "ok" as const }));

    render(
      <AnimationWorkspace
        project={project}
        canSave={false}
        saveStatus="saved"
        saveError={null}
        sourceError={null}
        onSave={vi.fn()}
        partAssets={[partAsset]}
        missingPartAssetIds={[]}
        onSetPartLayerOffset={onSetPartLayerOffset}
      />
    );
    await user.click(
      screen.getByRole("button", {
        name: "Kopf; Erforderlich; Produktionsbereit"
      })
    );
    const inspector = screen
      .getByRole("heading", { level: 2, name: "Eigenschaften" })
      .closest("section");
    if (!inspector) throw new Error("Inspector panel missing.");
    expect(within(inspector).getByText("Kopf und Gesicht")).toBeVisible();
    expect(within(inspector).getByText("28 von 39")).toBeVisible();
    expect(within(inspector).getByText("1 von 1")).toBeVisible();
    expect(within(inspector).getByText("ausgeglichen")).toBeVisible();

    const layerInput = within(inspector).getByRole("spinbutton", {
      name: "Projektweites Layer-Delta"
    });
    expect(layerInput).toHaveValue(-1);
    await user.clear(layerInput);
    await user.type(layerInput, "2");
    await user.click(
      within(inspector).getByRole("button", { name: "Layer übernehmen" })
    );
    await waitFor(() =>
      expect(onSetPartLayerOffset).toHaveBeenCalledWith(partAsset.assetId, 2)
    );
    expect(
      within(inspector).getByText("Projektweites Layer-Delta übernommen.")
    ).toHaveAttribute("role", "status");
  });

  it("shows clipped bounding boxes and affected frame edges in the viewport", async () => {
    setViewportWidth(1440);
    const partAsset = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        sourceSize: { width: 128, height: 128 },
        trimRect: { x: 0, y: 0, width: 128, height: 128 },
        anchors: { proximal: { x: 0, y: 0 } }
      })
    );
    const project = parseAnimationProject(
      createAnimationProjectInput({
        parts: [{ assetId: partAsset.assetId }],
        overrides: []
      })
    );
    const context = {
      imageSmoothingEnabled: true,
      createImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(128 * 128 * 4)
      } as ImageData)),
      putImageData: vi.fn()
    };
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const sourcePixels = new Uint8ClampedArray(128 * 128 * 4);
    sourcePixels.set([255, 255, 255, 255], 0);

    try {
      render(
        <AnimationWorkspace
          project={project}
          canSave={false}
          saveStatus="saved"
          saveError={null}
          sourceError={null}
          onSave={vi.fn()}
          partAssets={[partAsset]}
          missingPartAssetIds={[]}
          imageDecoder={{
            decode: vi.fn(async () => ({
              width: 128,
              height: 128,
              pixels: sourcePixels
            }))
          }}
          onLoadPartBlob={async () => ({
            status: "ok",
            blob: new Blob(["wide"], { type: "image/png" })
          })}
        />
      );

      expect(
        await screen.findByText(/Bounding-Box: X 64–192, Y 44–172\./)
      ).toHaveTextContent("Betroffene Framekanten: rechts, unten.");
    } finally {
      getContext.mockRestore();
    }
  });

  it("shows all South walk production blockers before playback is available", async () => {
    setViewportWidth(1440);
    const pendingHead = parseAnimationPartAsset(
      createAnimationPartAssetInput({
        anchorStatus: "anchorsPending",
        anchors: undefined
      })
    );
    const project = parseAnimationProject(
      createAnimationProjectInput({
        directionSourceMode: "singleDirectionPrototype",
        parts: [{ assetId: pendingHead.assetId }],
        clips: [
          {
            clipId: "clip_walk_south_001",
            templateId: "walk-humanoid-8-v1",
            action: "walk",
            frameCount: 8,
            fps: 10,
            loop: true
          }
        ],
        overrides: []
      })
    );

    render(
      <AnimationWorkspace
        project={project}
        canSave={false}
        saveStatus="saved"
        saveError={null}
        sourceError={null}
        onSave={vi.fn()}
        partAssets={[pendingHead]}
        missingPartAssetIds={[]}
        imageDecoder={{
          decode: vi.fn(async () => ({
            width: 1,
            height: 1,
            pixels: new Uint8ClampedArray(4)
          }))
        }}
      />
    );

    const alert = (await screen.findByText("Automatischer South-Walk gesperrt")).closest(
      '[role="alert"]'
    ) as HTMLElement | null;
    if (!alert) throw new Error("South walk production alert missing.");
    expect(within(alert).getByText("Die Anker für Kopf Süd stehen noch aus.")).toBeVisible();
    expect(within(alert).getByText("Pflichtpart torso für South fehlt.")).toBeVisible();
    expect(within(alert).getByText("Pflichtpart pelvis für South fehlt.")).toBeVisible();
    expect(
      within(alert).getByRole("list", {
        name: "Produktionsfehler des South-Walk-Clips"
      }).children
    ).toHaveLength(15);
  });

  it("shows the complete loaded desktop workspace and honest unavailable actions", async () => {
    setViewportWidth(1440);
    const user = userEvent.setup();
    const onSave = vi.fn();
    const { container } = renderWorkspace({}, {
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
    expect(screen.getByText(/part_head_south_001 konnte/)).toBeVisible();
    const rigOverlay = screen.getByRole("img", {
      name: "Süd: Neutralpose des humanoid-80-v1"
    });
    expect(rigOverlay).toHaveAttribute("data-rig-direction", "south");
    expect(rigOverlay).toHaveAttribute("data-rig-available", "true");
    expect(container.querySelectorAll("[data-bone-id]")).toHaveLength(20);
    expect(container.querySelectorAll("[data-joint-id]")).toHaveLength(21);
    expect(container.querySelectorAll("[data-slot-id]")).toHaveLength(15);
    expect(container.querySelector('[data-joint-id="head"]')).toHaveAttribute(
      "cx",
      "64"
    );
    expect(screen.getByTestId("rig-groundline")).toHaveAttribute("y1", "112");

    const headSlot = screen.getByRole("button", {
      name: "Kopf; Erforderlich; Fehlt"
    });
    expect(headSlot).toHaveAttribute("aria-pressed", "false");

    const playback = screen.getByRole("button", { name: "Play / Pause" });
    const exportButton = screen.getByRole("button", { name: "Exportieren" });
    const importInput = screen.getByLabelText("PNG-Datei auswählen");
    expect(playback).toBeDisabled();
    expect(playback).toHaveAccessibleDescription(/echten Timeline/);
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAccessibleDescription(/Renderpipeline/);
    expect(importInput).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Jetzt speichern" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("selects direction, frame, zoom, overlays and pan with pointer-independent controls", async () => {
    setViewportWidth(1440);
    const user = userEvent.setup();
    const { container } = renderWorkspace();

    expect(container.querySelector('[data-joint-id="chest"]')).toHaveAttribute(
      "cx",
      "64"
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Richtung" }), "east");
    expect(screen.getByRole("combobox", { name: "Richtung" })).toHaveValue("east");
    expect(screen.getByTestId("rig-overlay")).toHaveAttribute(
      "data-rig-direction",
      "east"
    );
    expect(container.querySelector('[data-joint-id="chest"]')).toHaveAttribute(
      "cx",
      "61"
    );

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

    const rigToggle = screen.getByRole("checkbox", { name: "Rig" });
    await user.click(rigToggle);
    expect(screen.queryByTestId("rig-neutral-pose")).not.toBeInTheDocument();
    expect(screen.getByTestId("rig-groundline")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Zentrieren" }));
    expect(document.getElementById("animation-viewport-status")).toHaveTextContent(
      "Versatz X 0, Y 0"
    );
  });

  it("keeps western source geometry explicitly unavailable", async () => {
    setViewportWidth(1440);
    const user = userEvent.setup();
    const { container } = renderWorkspace();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Richtung" }),
      "west"
    );

    expect(
      screen.getByRole("img", {
        name: "West: keine freigegebene Rig-Quellgeometrie"
      })
    ).toHaveAttribute("data-rig-available", "false");
    expect(container.querySelectorAll("[data-joint-id]")).toHaveLength(0);
    expect(container.querySelectorAll("[data-bone-id]")).toHaveLength(0);
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
      name: "Kopf; Erforderlich; Fehlt"
    });
    headSlot.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Part" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const inspector = screen.getByRole("heading", { level: 2, name: "Eigenschaften" }).closest("section");
    if (!inspector) throw new Error("Inspector panel missing.");
    expect(within(inspector).getByText("Teilweise nicht aufgelöst")).toBeVisible();
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
