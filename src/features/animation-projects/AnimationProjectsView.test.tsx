import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { StableIdSchema, parseAnimationProject } from "../../schemas";
import {
  MemoryAnimationRepository,
  createV2StorageAdapter
} from "../../services";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import { MemoryNavigation } from "../../test/memoryNavigation";
import { MemoryStorage } from "../../test/memoryStorage";

const creationTimestamp = "2026-09-04T18:00:00.000Z";

function renderProjects(
  repository: MemoryAnimationRepository,
  navigation = new MemoryNavigation({
    status: "valid",
    route: { studio: "animation", view: "projects" }
  }),
  options: Readonly<{
    createProjectId?: () => string;
    createClipId?: () => string;
  }> = {}
) {
  const rendered = render(
    <App
      navigationAdapter={navigation}
      storageAdapter={createV2StorageAdapter(new MemoryStorage())}
      animationRepository={repository}
      now={() => creationTimestamp}
      {...(options.createProjectId
        ? { createAnimationProjectId: options.createProjectId }
        : {})}
      {...(options.createClipId
        ? { createAnimationClipId: options.createClipId }
        : {})}
    />
  );
  return { ...rendered, navigation };
}

async function seedProject(
  repository: MemoryAnimationRepository,
  overrides: Parameters<typeof createAnimationProjectInput>[0] = {}
) {
  const project = parseAnimationProject(createAnimationProjectInput(overrides));
  expect(await repository.createProject(project)).toEqual({ status: "ok" });
  return project;
}

function projectCard(name: string): HTMLElement {
  const card = screen.getByRole("heading", { level: 3, name }).closest("article");
  if (!card) throw new Error(`Project card for ${name} not found.`);
  return card;
}

describe("AnimationProjectsView", () => {
  it("creates a project with validated defaults and navigates by stable ID", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAnimationRepository();
    const navigation = new MemoryNavigation({
      status: "valid",
      route: { studio: "animation", view: "projects" }
    });
    renderProjects(repository, navigation, {
      createProjectId: () => "project_created_001",
      createClipId: () => "clip_created_walk_001"
    });

    await screen.findByText("Noch keine Animationsprojekte");
    await user.click(screen.getByRole("button", { name: /Neues Projekt/i }));

    const dialog = screen.getByRole("dialog", { name: "Neues Animationsprojekt" });
    const nameInput = within(dialog).getByRole("textbox", { name: "Projektname" });
    expect(nameInput).toHaveFocus();
    expect(within(dialog).getByLabelText("Rig-Vorlage")).toHaveValue(
      "humanoid-80-v1"
    );
    expect(within(dialog).getByLabelText("Framebreite")).toHaveValue(128);
    expect(within(dialog).getByLabelText("Framehöhe")).toHaveValue(128);
    expect(within(dialog).getByLabelText("Figurenhöhe")).toHaveValue(80);
    expect(within(dialog).getByLabelText("Fußanker X")).toHaveValue(64);
    expect(within(dialog).getByLabelText("Fußanker Y")).toHaveValue(112);
    expect(within(dialog).getByLabelText("Frames")).toHaveValue(8);
    expect(within(dialog).getByLabelText("FPS")).toHaveValue(10);

    await user.click(within(dialog).getByRole("button", { name: "Projekt anlegen" }));
    expect(nameInput).toHaveAttribute("aria-invalid", "true");

    await user.type(nameInput, "Waldläufer Walk");
    const frameWidth = within(dialog).getByLabelText("Framebreite");
    await user.clear(frameWidth);
    await user.type(frameWidth, "0");
    await user.click(within(dialog).getByRole("button", { name: "Projekt anlegen" }));
    expect(frameWidth).toHaveAttribute("aria-invalid", "true");

    await user.clear(frameWidth);
    await user.type(frameWidth, "128");
    await user.click(within(dialog).getByRole("button", { name: "Projekt anlegen" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Waldläufer Walk" })
    ).toBeVisible();
    expect(navigation.pushedRoutes).toEqual([
      {
        studio: "animation",
        view: "workspace",
        projectId: "project_created_001"
      }
    ]);
    expect(screen.getByRole("main")).toHaveFocus();
    expect(await repository.readProject("project_created_001")).toMatchObject({
      status: "ok",
      value: {
        frameProfile: {
          frameSize: { width: 128, height: 128 },
          characterHeight: 80,
          footAnchor: { x: 64, y: 112 }
        },
        directionSourceMode: "fiveAuthoredPlusMirror",
        clips: [{ action: "walk", frameCount: 8, fps: 10 }]
      }
    });
  });

  it("lists, searches, sorts, opens and focuses the routed workspace", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAnimationRepository();
    await seedProject(repository, {
      projectId: "project_wald_001",
      name: "Waldwache",
      updatedAt: "2026-09-04T12:00:00.000Z"
    });
    await seedProject(repository, {
      projectId: "project_burg_001",
      name: "Burgwache",
      updatedAt: "2026-09-04T14:00:00.000Z",
      directionSourceMode: "eightAuthored"
    });
    const { navigation } = renderProjects(repository);

    await screen.findByRole("heading", { level: 3, name: "Burgwache" });
    expect(
      screen.getAllByRole("heading", { level: 3 }).map(({ textContent }) => textContent)
    ).toEqual(["Burgwache", "Waldwache"]);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sortierung" }),
      "nameDesc"
    );
    expect(
      screen.getAllByRole("heading", { level: 3 }).map(({ textContent }) => textContent)
    ).toEqual(["Waldwache", "Burgwache"]);

    await user.type(
      screen.getByRole("searchbox", { name: "Animationsprojekte durchsuchen" }),
      "8 eigene"
    );
    expect(screen.getByRole("heading", { level: 3, name: "Burgwache" })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 3, name: "Waldwache" })).not.toBeInTheDocument();

    await user.click(within(projectCard("Burgwache")).getByRole("button", { name: "Öffnen" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Burgwache" })).toBeVisible();
    expect(navigation.pushedRoutes).toEqual([
      {
        studio: "animation",
        view: "workspace",
        projectId: "project_burg_001"
      }
    ]);
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("renames, duplicates with a new ID, and deletes only after confirmation", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAnimationRepository();
    await seedProject(repository, {
      projectId: "project_guard_001",
      name: "Alte Wache"
    });
    renderProjects(repository, undefined, {
      createProjectId: () => "project_guard_copy_001"
    });

    await screen.findByRole("heading", { level: 3, name: "Alte Wache" });
    let card = projectCard("Alte Wache");
    const renameTrigger = within(card).getByRole("button", { name: "Umbenennen" });
    await user.click(renameTrigger);
    const renameDialog = screen.getByRole("dialog", { name: /Alte Wache.*umbenennen/i });
    const renameInput = within(renameDialog).getByRole("textbox", { name: "Projektname" });
    expect(renameInput).toHaveFocus();
    await user.clear(renameInput);
    await user.type(renameInput, "Neue Wache{Enter}");

    await screen.findByRole("heading", { level: 3, name: "Neue Wache" });
    await waitFor(() => expect(renameTrigger).toHaveFocus());
    expect(await repository.readProject("project_guard_001")).toMatchObject({
      status: "ok",
      value: { name: "Neue Wache" }
    });

    card = projectCard("Neue Wache");
    await user.click(within(card).getByRole("button", { name: "Duplizieren" }));
    expect(
      await screen.findByRole("heading", { level: 3, name: "Neue Wache Kopie" })
    ).toBeVisible();
    expect(await repository.readProject("project_guard_copy_001")).toMatchObject({
      status: "ok",
      value: { projectId: "project_guard_copy_001", name: "Neue Wache Kopie" }
    });

    card = projectCard("Neue Wache");
    const deleteTrigger = within(card).getByRole("button", { name: "Löschen" });
    await user.click(deleteTrigger);
    let deleteDialog = screen.getByRole("alertdialog", {
      name: /Neue Wache.*endgültig löschen/i
    });
    expect(within(deleteDialog).getByRole("button", { name: "Abbrechen" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(deleteTrigger).toHaveFocus());
    expect(await repository.readProject("project_guard_001")).toMatchObject({ status: "ok" });

    await user.click(deleteTrigger);
    deleteDialog = screen.getByRole("alertdialog", {
      name: /Neue Wache.*endgültig löschen/i
    });
    await user.click(
      within(deleteDialog).getByRole("button", { name: "Projekt endgültig löschen" })
    );
    await waitFor(() => {
      expect(screen.queryByRole("heading", { level: 3, name: "Neue Wache" })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { level: 2, name: "Lokale Projekte" })).toHaveFocus();
    expect(await repository.readProject("project_guard_001")).toMatchObject({
      status: "notFound"
    });
  });

  it("explains an unknown routed ID without retry or redirect loops", async () => {
    const repository = new MemoryAnimationRepository();
    const readProject = vi.spyOn(repository, "readProject");
    const navigation = new MemoryNavigation({
      status: "valid",
      route: {
        studio: "animation",
        view: "workspace",
        projectId: StableIdSchema.parse("project_missing_001")
      }
    });
    renderProjects(repository, navigation);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Animationsprojekt wurde nicht gefunden."
      })
    ).toBeVisible();
    expect(screen.getByText(/keine Weiterleitungs- oder Ladeschleife/i)).toBeVisible();
    expect(readProject).toHaveBeenCalledTimes(1);
    expect(navigation.pushedRoutes).toEqual([]);
    expect(navigation.replacedRoutes).toEqual([]);
  });

  it("restores focus when the create dialog is cancelled from the keyboard", async () => {
    const user = userEvent.setup();
    renderProjects(new MemoryAnimationRepository());
    await screen.findByText("Noch keine Animationsprojekte");
    const trigger = screen.getByRole("button", { name: /Neues Projekt/i });

    await user.click(trigger);
    expect(screen.getByRole("textbox", { name: "Projektname" })).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("warns before internal navigation while a failed write remains dirty", async () => {
    const user = userEvent.setup();
    let failWrites = false;
    const repository = new MemoryAnimationRepository({
      beforeCommit(operation) {
        if (operation === "writeProject" && failWrites) {
          throw new Error("Autosave nicht verfügbar");
        }
      }
    });
    await seedProject(repository, {
      projectId: "project_dirty_navigation_001",
      name: "Ungesicherte Wache"
    });
    renderProjects(repository);

    await screen.findByRole("heading", { level: 3, name: "Ungesicherte Wache" });
    await user.click(
      within(projectCard("Ungesicherte Wache")).getByRole("button", {
        name: "Öffnen"
      })
    );
    await screen.findByRole("heading", { level: 1, name: "Ungesicherte Wache" });
    await user.click(screen.getByRole("link", { name: "Projekte" }));
    await screen.findByRole("heading", { level: 3, name: "Ungesicherte Wache" });

    failWrites = true;
    await user.click(
      within(projectCard("Ungesicherte Wache")).getByRole("button", {
        name: "Umbenennen"
      })
    );
    const dialog = screen.getByRole("dialog", {
      name: /Ungesicherte Wache.*umbenennen/i
    });
    const name = within(dialog).getByRole("textbox", { name: "Projektname" });
    await user.clear(name);
    await user.type(name, "Ungesicherte Wache neu{Enter}");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Autosave nicht verfügbar"
    );
    await user.click(within(dialog).getByRole("button", { name: "Abbrechen" }));
    expect(screen.getByText("Speichern fehlgeschlagen")).toBeVisible();

    const confirmNavigation = vi
      .spyOn(window, "confirm")
      .mockReturnValue(false);
    const homeLink = screen.getByRole("link", {
      name: "PixelForge Studio – Startseite"
    });
    await user.click(homeLink);
    expect(confirmNavigation).toHaveBeenCalledWith(
      "Das aktive Animationsprojekt enthält ungespeicherte Änderungen. Trotzdem navigieren?"
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Animationsprojekte organisieren." })
    ).toBeVisible();

    confirmNavigation.mockReturnValue(true);
    await user.click(homeLink);
    expect(
      await screen.findByRole("heading", { level: 1, name: "PixelForge Studio" })
    ).toBeVisible();
  });
});
