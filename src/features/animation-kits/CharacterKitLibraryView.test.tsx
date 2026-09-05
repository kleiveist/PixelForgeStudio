import { useEffect } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  parseAnimationPartAsset,
  parseAnimationProject,
  parseCharacterKit,
  type StableId
} from "../../schemas";
import { MemoryAnimationRepository } from "../../services";
import {
  AnimationProjectProvider,
  useAnimationProject
} from "../../store/animation";
import {
  createAnimationPartAssetInput,
  createAnimationProjectInput,
  createCharacterKitInput
} from "../../test/animationSchemaFixtures";
import { CharacterKitLibraryView } from "./CharacterKitLibraryView";

const KEY =
  "humanoid-80-v1__frame-128x128__char-80__foot-64-112__contracts-1-1-1";

function OpenProject({ projectId }: Readonly<{ projectId: StableId }>) {
  const { activeProjectId, openProject } = useAnimationProject();
  useEffect(() => {
    if (activeProjectId !== projectId) void openProject(projectId);
  }, [activeProjectId, openProject, projectId]);
  return null;
}

async function renderLibrary(withProject = true) {
  const repository = new MemoryAnimationRepository();
  const part = parseAnimationPartAsset(createAnimationPartAssetInput());
  await repository.writePartAsset(part, new Blob(["part"]));
  const project = parseAnimationProject(
    createAnimationProjectInput({ parts: [{ assetId: part.assetId }], overrides: [] })
  );
  await repository.createProject(project);
  await repository.writeKit(
    parseCharacterKit(
      createCharacterKitInput({
        kitId: "kit_ready_001",
        name: "Waldläuferin",
        description: "Grüner Umhang",
        rigCompatibilityKey: KEY,
        partAssetIds: [part.assetId],
        coverage: {
          requiredCellCount: 120,
          resolvedRequiredCellCount: 120,
          authoredRequiredCellCount: 75,
          mirroredRequiredCellCount: 45,
          anchorsIncompleteCount: 0,
          mirrorReviewCount: 0,
          mirrorForbiddenCount: 0,
          productionReady: true
        }
      })
    )
  );
  await repository.writeKit(
    parseCharacterKit(
      createCharacterKitInput({
        kitId: "kit_draft_001",
        name: "Bergwache",
        description: "Schwere Rüstung",
        rigCompatibilityKey: KEY,
        partAssetIds: [part.assetId]
      })
    )
  );

  render(
    <AnimationProjectProvider repository={repository}>
      {withProject ? <OpenProject projectId={project.projectId} /> : null}
      <CharacterKitLibraryView />
    </AnimationProjectProvider>
  );
  await screen.findByRole("heading", { name: "Gespeicherte Character Kits" });
  if (withProject) {
    await waitFor(() =>
      expect(screen.getByText(`Ziel: ${project.name}`)).toBeInTheDocument()
    );
  }
  return { repository, project, part };
}

describe("CharacterKitLibraryView", () => {
  it("shows previews and filters by search and saved coverage", async () => {
    const user = userEvent.setup();
    await renderLibrary(false);

    expect(screen.getByLabelText("Vorschau für Waldläuferin")).toHaveTextContent(
      "Keine Vorschau"
    );
    await user.type(screen.getByRole("searchbox", { name: "Suche" }), "rüstung");
    expect(screen.getByRole("heading", { name: "Bergwache" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Waldläuferin" })).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: "Suche" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Abdeckung" }), "ready");
    expect(screen.getByRole("heading", { name: "Waldläuferin" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bergwache" })).not.toBeInTheDocument();
  });

  it("opens details by keyboard and applies, renames, duplicates and deletes kits", async () => {
    const user = userEvent.setup();
    const { repository, project } = await renderLibrary();
    const card = screen.getByRole("heading", { name: "Waldläuferin" }).closest("article");
    if (!card) throw new Error("Kit card missing.");
    const openButton = within(card).getByRole("button", { name: "Öffnen" });
    openButton.focus();
    await user.keyboard("{Enter}");
    expect(within(card).getByRole("textbox", { name: "Kit-Name" })).toBeInTheDocument();
    expect(within(card).getByText("Kompatibel")).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: "Anwenden" }));
    expect(await screen.findByText(/„Waldläuferin“ wurde angewendet/)).toBeInTheDocument();

    const renameInput = within(card).getByRole("textbox", { name: "Kit-Name" });
    await user.clear(renameInput);
    await user.type(renameInput, "Waldläuferin Elite");
    await user.click(within(card).getByRole("button", { name: "Umbenennen" }));
    expect(await screen.findByRole("heading", { name: "Waldläuferin Elite" })).toBeInTheDocument();

    const renamedCard = screen.getByRole("heading", { name: "Waldläuferin Elite" }).closest("article");
    if (!renamedCard) throw new Error("Renamed card missing.");
    await user.click(within(renamedCard).getByRole("button", { name: "Duplizieren" }));
    expect(await screen.findByRole("heading", { name: "Waldläuferin Elite Kopie" })).toBeInTheDocument();

    await user.click(within(renamedCard).getByRole("button", { name: "Löschen" }));
    await user.click(within(renamedCard).getByRole("button", { name: "Kit endgültig löschen" }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Waldläuferin Elite" })).not.toBeInTheDocument()
    );
    expect(await repository.readProject(project.projectId)).toMatchObject({ status: "ok" });
  });
});
