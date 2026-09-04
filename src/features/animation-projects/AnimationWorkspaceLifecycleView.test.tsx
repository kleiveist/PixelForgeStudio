import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { parseAnimationProject, type AnimationProject } from "../../schemas";
import {
  MemoryAnimationRepository,
  createV2StorageAdapter,
  type AnimationRepositoryReadResult
} from "../../services";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import { PNG_SIGNATURE } from "../animation-part-import";
import { MemoryNavigation } from "../../test/memoryNavigation";
import { MemoryStorage } from "../../test/memoryStorage";

function renderWorkspaceRoute(
  repository: MemoryAnimationRepository | null,
  projectId?: string,
  unavailableMessage?: string,
  importOptions: Readonly<{
    imageDecoder?: Readonly<{ decode: (blob: Blob) => Promise<Readonly<{
      width: number;
      height: number;
      pixels: Uint8ClampedArray;
    }>> }>;
    createPartAssetId?: () => string;
    createImageBlobId?: () => string;
    now?: () => string;
  }> = {}
) {
  const navigation = new MemoryNavigation({
    status: "valid",
    route: projectId
      ? {
          studio: "animation",
          view: "workspace",
          projectId: parseAnimationProject(
            createAnimationProjectInput({ projectId })
          ).projectId
        }
      : { studio: "animation", view: "workspace" }
  });
  return render(
    <App
      navigationAdapter={navigation}
      storageAdapter={createV2StorageAdapter(new MemoryStorage())}
      animationRepository={repository}
      {...(importOptions.imageDecoder
        ? { animationImageDecoder: importOptions.imageDecoder }
        : {})}
      {...(importOptions.createPartAssetId
        ? { createAnimationPartAssetId: importOptions.createPartAssetId }
        : {})}
      {...(importOptions.createImageBlobId
        ? { createAnimationImageBlobId: importOptions.createImageBlobId }
        : {})}
      {...(importOptions.now ? { now: importOptions.now } : {})}
      {...(unavailableMessage
        ? { animationRepositoryUnavailableMessage: unavailableMessage }
        : {})}
    />
  );
}

describe("AnimationWorkspaceLifecycleView", () => {
  it("keeps the workspace closed when no project ID was selected", () => {
    renderWorkspaceRoute(new MemoryAnimationRepository());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Kein Animationsprojekt geöffnet."
      })
    ).toBeVisible();
    expect(screen.getByText(/weder Beispieldaten erzeugt/)).toBeVisible();
  });

  it("shows loading before a requested project resolves and then mounts the shell", async () => {
    const repository = new MemoryAnimationRepository();
    const project = parseAnimationProject(
      createAnimationProjectInput({ projectId: "project_deferred_001" })
    );
    let resolveRead: (
      result: AnimationRepositoryReadResult<AnimationProject>
    ) => void = () => undefined;
    const readResult = new Promise<AnimationRepositoryReadResult<AnimationProject>>(
      (resolve) => {
        resolveRead = resolve;
      }
    );
    vi.spyOn(repository, "readProject").mockReturnValue(readResult);

    renderWorkspaceRoute(repository, project.projectId);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Animationsprojekt wird geladen …"
      })
    ).toBeVisible();

    await act(async () => resolveRead({ status: "ok", value: project }));
    expect(
      await screen.findByRole("heading", { level: 1, name: project.name })
    ).toBeVisible();
    expect(screen.getByText("Alle Änderungen gespeichert")).toBeVisible();
  });

  it("renders repository failures without retrying or inventing a project", async () => {
    const repository = new MemoryAnimationRepository();
    const readProject = vi.spyOn(repository, "readProject").mockResolvedValue({
      status: "failed",
      reason: "transaction",
      message: "Der lokale Projekt-Read ist fehlgeschlagen."
    });

    renderWorkspaceRoute(repository, "project_failed_read_001");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Animationsprojekt konnte nicht geöffnet werden."
      })
    ).toBeVisible();
    expect(screen.getByText("Der lokale Projekt-Read ist fehlgeschlagen.")).toBeVisible();
    expect(readProject).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { level: 2, name: "Timeline" })).not.toBeInTheDocument();
  });

  it("distinguishes an unavailable repository from a missing project", async () => {
    renderWorkspaceRoute(
      null,
      "project_unavailable_001",
      "IndexedDB ist in dieser Browserumgebung nicht verfügbar."
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Animationsprojekt konnte nicht geöffnet werden."
      })
    ).toBeVisible();
    expect(
      screen.getByText("IndexedDB ist in dieser Browserumgebung nicht verfügbar.")
    ).toBeVisible();
  });

  it("imports a valid PNG through the workspace and exposes anchor-pending coverage", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAnimationRepository();
    const project = parseAnimationProject(
      createAnimationProjectInput({
        projectId: "project_import_ui_001",
        parts: [],
        previewBlobId: undefined
      })
    );
    await repository.createProject(project);
    const pixels = new Uint8ClampedArray(2 * 2 * 4);
    pixels[3] = 255;
    renderWorkspaceRoute(repository, project.projectId, undefined, {
      imageDecoder: {
        decode: vi.fn().mockResolvedValue({ width: 2, height: 2, pixels })
      },
      createPartAssetId: () => "part_import_ui_001",
      createImageBlobId: () => "blob_import_ui_001",
      now: () => "2026-09-04T16:00:00.000Z"
    });

    expect(await screen.findByRole("heading", { level: 1, name: project.name })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Kopf; Erforderlich; Fehlt" }));
    const source = new File([new Uint8Array(PNG_SIGNATURE)], "hero-head.png", {
      type: "image/png"
    });
    await user.upload(screen.getByLabelText("PNG-Datei auswählen"), source);
    await user.click(await screen.findByRole("button", { name: "Import bestätigen" }));

    expect(await screen.findByText(/hero-head.*wurde importiert/)).toBeVisible();
    await waitFor(async () => {
      expect(await repository.readProject(project.projectId)).toMatchObject({
        status: "ok",
        value: {
          updatedAt: "2026-09-04T16:00:00.000Z",
          parts: [{ assetId: "part_import_ui_001" }]
        }
      });
    });
    expect(await repository.readPartAsset("part_import_ui_001")).toMatchObject({
      status: "ok",
      value: {
        label: "hero-head",
        anchorStatus: "anchorsPending",
        trimRect: { x: 0, y: 0, width: 1, height: 1 }
      }
    });
    expect(await repository.readBlob("blob_import_ui_001")).toMatchObject({
      status: "ok",
      value: { type: "image/png" }
    });
    await waitFor(() =>
      expect(document.querySelector('td[data-coverage="anchorsIncomplete"]')).toHaveTextContent(
        "Anker unvollständig"
      )
    );
    await user.click(screen.getByRole("button", { name: "Eigenschaften" }));
    expect(screen.getByText("Ausstehend – Produktion gesperrt")).toBeVisible();
  });
});
