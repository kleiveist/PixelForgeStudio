import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { createV2StorageAdapter, MemoryAnimationRepository } from "../../services";
import { MemoryNavigation } from "../../test/memoryNavigation";
import { MemoryStorage } from "../../test/memoryStorage";
import { createProfileLibraryFixture } from "../../test/profileLibraryFixtures";

function setup() {
  const memory = new MemoryStorage();
  const storage = createV2StorageAdapter(memory);
  expect(storage.writeProfileLibrary(createProfileLibraryFixture())).toEqual({ status: "ok" });
  const navigation = new MemoryNavigation({ status: "valid", view: "profiles" });
  const beforeCommit = vi.fn();
  const repository = new MemoryAnimationRepository({ beforeCommit });
  render(
    <App
      navigationAdapter={navigation}
      storageAdapter={storage}
      animationRepository={repository}
      createAnimationProjectId={() => "project_handoff_smith"}
      createAnimationClipId={() => "clip_handoff_walk"}
      now={() => "2026-09-05T01:00:00.000Z"}
    />
  );
  return { beforeCommit, navigation, repository };
}

describe("Prompt-to-Animation handoff UI", () => {
  it("creates a narrow project only after conflict confirmation and opens its workspace", async () => {
    const user = userEvent.setup();
    const { beforeCommit, navigation, repository } = setup();
    const card = screen.getByRole("article", { name: "Dorfschmied mit Lederschürze" });
    await user.click(
      within(card).getByRole("button", { name: "Im Animation Studio verwenden" })
    );

    const dialog = screen.getByRole("dialog", { name: "Animationsprojekt vorbereiten" });
    expect(within(dialog).getByText(/Gewünscht: 5 Walk-Frames/)).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Projekt anlegen" })).toBeDisabled();
    await user.click(within(dialog).getByRole("checkbox"));
    expect(within(dialog).getByText(/kein Bild erzeugt oder übertragen/)).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Projekt anlegen" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Dorfschmied mit Lederschürze" })
      ).toBeVisible()
    );
    expect(navigation.pushedRoutes.at(-1)).toEqual({
      studio: "animation",
      view: "workspace",
      projectId: "project_handoff_smith"
    });
    expect(beforeCommit).toHaveBeenCalledWith("createProject");
    const stored = await repository.readProject("project_handoff_smith");
    expect(stored).toEqual({
      status: "ok",
      value: expect.objectContaining({
        directionRequirement: 8,
        parts: [],
        sourcePrompt: {
          assetProfileId: "asset_smith_80",
          profileName: "Dorfschmied mit Lederschürze",
          compatibilityKey: expect.stringMatching(/^pf2-compat-v1__/),
          requestedDirectionCount: 8,
          directionDecision: "alreadyEightDirections",
          requestedActions: [{ action: "walk", frames: 5 }]
        }
      })
    });
    if (stored.status === "ok") expect(stored.value.previewBlobId).toBeUndefined();
    expect(screen.getByText(/Als Nächstes die Körperteil-PNGs importieren/)).toBeVisible();
  });
});
