import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { parseAnimationProject, type AnimationProject } from "../../schemas";
import {
  MemoryAnimationRepository,
  createV2StorageAdapter,
  type AnimationRepositoryReadResult
} from "../../services";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import { MemoryNavigation } from "../../test/memoryNavigation";
import { MemoryStorage } from "../../test/memoryStorage";

function renderWorkspaceRoute(
  repository: MemoryAnimationRepository | null,
  projectId?: string,
  unavailableMessage?: string
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
});
