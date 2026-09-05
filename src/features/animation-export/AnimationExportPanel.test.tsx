import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DIRECTION_IDS } from "../../domain/animation";
import {
  parseAnimationPartAsset,
  parseAnimationProject
} from "../../schemas";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput
} from "../../test/animationSchemaFixtures";
import { AnimationExportPanel } from "./AnimationExportPanel";

function exportFrames(opaqueEdge = false) {
  return DIRECTION_IDS.flatMap((direction) =>
    Array.from({ length: 8 }, (_, frameIndex) => {
      const pixels = new Uint8ClampedArray(128 * 128 * 4);
      if (opaqueEdge) pixels[3] = 255;
      return { direction, frameIndex, frame: { width: 128, height: 128, pixels } };
    })
  );
}

function renderPanel(options: Readonly<{ opaqueEdge?: boolean; frameCount?: number }> = {}) {
  const project = parseAnimationProject(createAnimationProjectInput());
  const part = parseAnimationPartAsset(createAnimationPartAssetInput());
  const download = vi.fn();
  const encode = vi.fn(async () => new Blob(["png"], { type: "image/png" }));
  render(
    <AnimationExportPanel
      project={project}
      clip={project.clips[0] ?? null}
      frames={exportFrames(options.opaqueEdge).slice(0, options.frameCount)}
      partAssets={[part]}
      readImageBlob={async () => new Blob()}
      pngEncoder={{ encode }}
      onDownload={download}
    />
  );
  return { download, encode };
}

describe("AnimationExportPanel", () => {
  it("exports a validated sheet and reports completion", async () => {
    const user = userEvent.setup();
    const { download, encode } = renderPanel();
    await user.click(screen.getByRole("button", { name: "SpriteSheet PNG" }));
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(download.mock.calls[0]?.[1]).toBe("waldwachter-walk_walk.png");
    expect(encode).toHaveBeenCalledWith(
      expect.objectContaining({ width: 1024, height: 1024 })
    );
    expect(screen.getByText("Export abgeschlossen")).toBeVisible();
  });

  it("blocks hard errors and requires a visible warning confirmation", async () => {
    const user = userEvent.setup();
    const incomplete = renderPanel({ frameCount: 63 });
    expect(screen.getByRole("button", { name: "SpriteSheet PNG" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/Exportfehler/);
    expect(incomplete.download).not.toHaveBeenCalled();

    cleanup();
    const warning = renderPanel({ opaqueEdge: true });
    const sheet = screen.getByRole("button", { name: "SpriteSheet PNG" });
    expect(sheet).toBeDisabled();
    await user.click(
      screen.getByRole("checkbox", {
        name: /Warnungen geprüft/
      })
    );
    expect(sheet).toBeEnabled();
    expect(warning.download).not.toHaveBeenCalled();
  });
});
