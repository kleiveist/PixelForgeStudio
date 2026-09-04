import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HUMANOID_80_RIG_TEMPLATE } from "../../domain/animation";
import { parseAnimationPartAsset } from "../../schemas";
import { createAnimationPartAssetInput } from "../../test/animationSchemaFixtures";
import { AnchorEditor } from "./AnchorEditor";

function limbAsset() {
  return parseAnimationPartAsset(
    createAnimationPartAssetInput({
      slot: "arm.left.upper",
      sourceSize: { width: 32, height: 32 },
      trimRect: { x: 2, y: 2, width: 28, height: 28 },
      anchors: {
        proximal: { x: 8, y: 7 },
        distal: { x: 8, y: 24 }
      }
    })
  );
}

describe("AnchorEditor", () => {
  it("edits anchors by coordinate fields, pointer snap and reset", async () => {
    const user = userEvent.setup();
    const asset = limbAsset();
    const loadBlob = vi.fn().mockResolvedValue({
      status: "ok",
      blob: new Blob(["png"], { type: "image/png" })
    });
    const onCommit = vi.fn().mockResolvedValue({ status: "ok", partAsset: asset });
    render(
      <AnchorEditor
        asset={asset}
        template={HUMANOID_80_RIG_TEMPLATE}
        direction="south"
        loadBlob={loadBlob}
        onCommit={onCommit}
      />
    );

    fireEvent.change(screen.getByRole("spinbutton", { name: "Proximal X" }), {
      target: { value: "12" }
    });
    expect(screen.getByRole("spinbutton", { name: "Proximal X" })).toHaveValue(12);

    await user.click(screen.getByRole("button", { name: "Distal" }));
    const stage = screen.getByTestId("anchor-source-stage");
    vi.spyOn(stage, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: 400,
      width: 400,
      height: 400,
      toJSON: () => ({})
    });
    fireEvent.pointerDown(stage, { clientX: 62.4, clientY: 123.6 });
    expect(screen.getByRole("spinbutton", { name: "Distal X" })).toHaveValue(10);
    expect(screen.getByRole("spinbutton", { name: "Distal Y" })).toHaveValue(21);

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("spinbutton", { name: "Proximal X" })).toHaveValue(8);
    expect(screen.getByRole("spinbutton", { name: "Distal Y" })).toHaveValue(24);
    expect(screen.getByText(/wurden wiederhergestellt/)).toBeVisible();
  });

  it("saves original coordinates and separate deltas, then resumes persisted values", async () => {
    const asset = limbAsset();
    const configured = parseAnimationPartAsset({
      ...asset,
      anchors: {
        proximal: { x: 11, y: 9 },
        distal: { x: 13, y: 25 }
      },
      updatedAt: "2026-09-04T13:00:00.000Z"
    });
    const loadBlob = vi.fn().mockResolvedValue({
      status: "ok",
      blob: new Blob(["png"], { type: "image/png" })
    });
    const onCommit = vi.fn().mockResolvedValue({
      status: "ok",
      partAsset: configured
    });
    const rendered = render(
      <AnchorEditor
        asset={asset}
        template={HUMANOID_80_RIG_TEMPLATE}
        direction="south"
        loadBlob={loadBlob}
        onCommit={onCommit}
      />
    );
    fireEvent.change(screen.getByRole("spinbutton", { name: "Proximal X" }), {
      target: { value: "11" }
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Part Offset X" }), {
      target: { value: "2.5" }
    });
    await userEvent.click(screen.getByRole("button", { name: "Anker speichern" }));
    await waitFor(() => expect(onCommit).toHaveBeenCalledTimes(1));
    expect(onCommit).toHaveBeenCalledWith({
      assetId: asset.assetId,
      anchors: {
        proximal: { x: 11, y: 7 },
        distal: { x: 8, y: 24 }
      },
      transformDelta: {
        offsetX: 2.5,
        offsetY: 0,
        rotationDelta: 0,
        scaleMultiplier: 1
      }
    });

    rendered.rerender(
      <AnchorEditor
        asset={configured}
        template={HUMANOID_80_RIG_TEMPLATE}
        direction="south"
        transformDelta={{
          offsetX: 2.5,
          offsetY: 0,
          rotationDelta: 0,
          scaleMultiplier: 1
        }}
        loadBlob={loadBlob}
        onCommit={onCommit}
      />
    );
    expect(screen.getByRole("spinbutton", { name: "Proximal X" })).toHaveValue(11);
    expect(screen.getByRole("spinbutton", { name: "Part Offset X" })).toHaveValue(2.5);
  });

  it("updates the live display adapter for deltas and direction changes", async () => {
    const asset = limbAsset();
    const loadBlob = vi.fn().mockResolvedValue({
      status: "ok",
      blob: new Blob(["png"], { type: "image/png" })
    });
    const objectUrlFactory = {
      createObjectURL: vi.fn(() => "blob:anchor-preview"),
      revokeObjectURL: vi.fn()
    };
    const rendered = render(
      <AnchorEditor
        asset={asset}
        template={HUMANOID_80_RIG_TEMPLATE}
        direction="south"
        loadBlob={loadBlob}
        onCommit={vi.fn()}
        objectUrlFactory={objectUrlFactory}
      />
    );
    const preview = await screen.findByTestId("anchor-placement-preview");
    const crop = preview.firstElementChild as HTMLElement;
    const initialTransform = crop.style.transform;

    fireEvent.change(screen.getByRole("spinbutton", { name: "Part Offset X" }), {
      target: { value: "3" }
    });
    expect(crop.style.transform).not.toBe(initialTransform);
    const deltaTransform = crop.style.transform;

    rendered.rerender(
      <AnchorEditor
        asset={asset}
        template={HUMANOID_80_RIG_TEMPLATE}
        direction="east"
        loadBlob={loadBlob}
        onCommit={vi.fn()}
        objectUrlFactory={objectUrlFactory}
      />
    );
    expect(screen.getByTestId("anchor-placement-preview")).toHaveAttribute(
      "data-direction",
      "east"
    );
    expect(crop.style.transform).not.toBe(deltaTransform);
  });
});
