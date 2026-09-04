import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { parseAnimationProject } from "../schemas";
import {
  MemoryAnimationRepository,
  createV2StorageAdapter
} from "../services";
import { createAnimationProjectInput } from "../test/animationSchemaFixtures";
import { MemoryNavigation } from "../test/memoryNavigation";
import { MemoryStorage } from "../test/memoryStorage";
import { App } from "./App";

describe("Studio Home animation summaries", () => {
  it("shows the three most recent real projects without opening one automatically", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAnimationRepository();
    const inputs = [
      ["project_home_001", "Erstes Projekt", "2026-09-04T10:00:00.000Z"],
      ["project_home_002", "Zweites Projekt", "2026-09-04T11:00:00.000Z"],
      ["project_home_003", "Drittes Projekt", "2026-09-04T12:00:00.000Z"],
      ["project_home_004", "Neuestes Projekt", "2026-09-04T13:00:00.000Z"]
    ] as const;
    for (const [projectId, name, updatedAt] of inputs) {
      expect(
        await repository.createProject(
          parseAnimationProject(
            createAnimationProjectInput({ projectId, name, updatedAt })
          )
        )
      ).toEqual({ status: "ok" });
    }
    const readProject = vi.spyOn(repository, "readProject");
    const navigation = new MemoryNavigation({
      status: "valid",
      route: { studio: "home" }
    });
    render(
      <App
        navigationAdapter={navigation}
        storageAdapter={createV2StorageAdapter(new MemoryStorage())}
        animationRepository={repository}
      />
    );

    const newestName = await screen.findByText("Neuestes Projekt");
    expect(screen.getByText("Drittes Projekt")).toBeVisible();
    expect(screen.getByText("Zweites Projekt")).toBeVisible();
    expect(screen.queryByText("Erstes Projekt")).not.toBeInTheDocument();
    expect(readProject).not.toHaveBeenCalled();
    expect(navigation.pushedRoutes).toEqual([]);

    const newestButton = newestName.closest("button");
    if (!newestButton) throw new Error("Recent project button is missing.");
    const main = screen.getByRole("main");
    const focus = vi.spyOn(main, "focus");
    await user.click(newestButton);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Neuestes Projekt" })
    ).toBeVisible();
    expect(readProject).toHaveBeenCalledTimes(1);
    expect(navigation.pushedRoutes).toEqual([
      {
        studio: "animation",
        view: "workspace",
        projectId: "project_home_004"
      }
    ]);
    await waitFor(() => expect(main).toHaveFocus());
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});
