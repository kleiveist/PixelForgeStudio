import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import {
  ProfileLibrarySchema,
  parseWizardDraft,
  type ProfileLibrary,
  type WizardDraft
} from "../../schemas";
import {
  createV2StorageAdapter,
  parseExportBundleJson,
  type OutputWorkspaceAdapter
} from "../../services";
import { MemoryNavigation } from "../../test/memoryNavigation";
import { MemoryStorage } from "../../test/memoryStorage";
import {
  PROFILE_FIXTURE_TIMESTAMP,
  createProfileLibraryFixture
} from "../../test/profileLibraryFixtures";
import { createWizardDraftFromAssetProfile } from "../wizard";

type SelectedWizardDraft = Extract<WizardDraft, { category: unknown }>;

function createReviewDraft(
  library: ProfileLibrary,
  portable = false
): SelectedWizardDraft {
  const assetProfile = library.assetProfiles.find(
    (profile) => profile.id === "asset_smith_80"
  );
  if (!assetProfile) throw new Error("Expected the smith Asset fixture.");
  const baseProfile = library.baseProfiles.find(
    (profile) => profile.id === assetProfile.baseProfileId
  );
  const categoryProfile = library.categoryProfiles.find(
    (profile) => profile.id === assetProfile.categoryProfileId
  );
  const result = createWizardDraftFromAssetProfile({
    draftId: parseWizardDraft({
      schemaVersion: 2,
      kind: "wizardDraft",
      draftId: "draft_output_workspace",
      projectName: "",
      route: "wizard/project",
      currentStep: "project",
      validation: { errors: [], warnings: [] },
      savedAt: PROFILE_FIXTURE_TIMESTAMP
    }).draftId,
    savedAt: PROFILE_FIXTURE_TIMESTAMP,
    assetProfile,
    ...(baseProfile ? { baseProfile } : {}),
    ...(categoryProfile ? { categoryProfile } : {})
  });
  if (result.status !== "created") {
    throw new Error("Expected a resolvable review Draft.");
  }
  if (!("category" in result.draft)) {
    throw new Error("Expected a selected review Draft.");
  }
  if (!portable || !("sourceAssetProfileId" in result.draft)) {
    return result.draft;
  }
  const { sourceAssetProfileId: ignoredSource, ...portableDraft } = result.draft;
  void ignoredSource;
  const parsed = parseWizardDraft(portableDraft);
  if (!("category" in parsed)) {
    throw new Error("Expected a selected portable Draft.");
  }
  return parsed;
}

function createOutputAdapter() {
  const copyText = vi.fn(async (_text: string) => undefined);
  const downloadTextFile = vi.fn<OutputWorkspaceAdapter["downloadTextFile"]>();
  return {
    adapter: { copyText, downloadTextFile } satisfies OutputWorkspaceAdapter,
    copyText,
    downloadTextFile
  };
}

function renderWorkspace(input: Readonly<{
  library?: ProfileLibrary;
  portableDraft?: boolean;
  outputAdapter?: OutputWorkspaceAdapter;
}>) {
  const library = input.library ?? createProfileLibraryFixture();
  const draft = createReviewDraft(library, input.portableDraft);
  const memory = new MemoryStorage();
  const storageAdapter = createV2StorageAdapter(memory);
  expect(storageAdapter.writeProfileLibrary(library)).toEqual({ status: "ok" });
  expect(storageAdapter.writeDraft(draft)).toEqual({ status: "ok" });
  memory.mutations.splice(0);
  const navigation = new MemoryNavigation({ status: "valid", view: "output" });
  const output = createOutputAdapter();
  const rendered = render(
    <App
      navigationAdapter={navigation}
      storageAdapter={storageAdapter}
      outputAdapter={input.outputAdapter ?? output.adapter}
      createProfileId={() => "asset_review_created"}
      now={() => "2026-09-03T23:30:00.000Z"}
    />
  );
  return { ...rendered, draft, library, memory, navigation, output, storageAdapter };
}

describe("ReviewOutputWorkspace", () => {
  it("restores the persisted Draft and exposes all four prompt outputs and packages", async () => {
    const user = userEvent.setup();
    renderWorkspace({});

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Prompt-Pakete produktionsbereit ausgeben."
      })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Produktionszusammenfassung" })
    ).toBeVisible();
    expect(screen.getByText("Dorfschmied mit Lederschürze")).toBeVisible();
    expect(screen.getByText("Charakter / Figur · NPC")).toBeVisible();

    const tablist = screen.getByRole("tablist", {
      name: "Prompt-Ausgabeart"
    });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(4);
    expect(
      within(tablist).getByRole("tab", { name: "Kombinierte Ausgabe" })
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("HAUPTPROMPT");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("NEGATIVPROMPT");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "TECHNISCHE SPEZIFIKATION"
    );

    for (const tabName of [
      "Hauptprompt",
      "Negativprompt",
      "Technische Spezifikation",
      "Kombinierte Ausgabe"
    ]) {
      await user.click(within(tablist).getByRole("tab", { name: tabName }));
      expect(screen.getByRole("tabpanel", { name: tabName })).toBeVisible();
      expect(screen.getByRole("tabpanel", { name: tabName }).textContent?.length)
        .toBeGreaterThan(100);
    }

    await user.selectOptions(screen.getByLabelText("Sprache"), "en");
    await user.selectOptions(screen.getByLabelText("Stilvariante"), "dark");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("MAIN PROMPT");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Dark grounded fantasy"
    );
  });

  it("uses injected copy/download actions and persists a new reviewed profile", async () => {
    const user = userEvent.setup();
    const rendered = renderWorkspace({ portableDraft: true });
    const tablist = screen.getByRole("tablist", {
      name: "Prompt-Ausgabeart"
    });

    await user.click(
      within(tablist).getByRole("tab", { name: "Negativprompt" })
    );
    const expectedCopy = screen.getByRole("tabpanel").querySelector("pre")
      ?.textContent;
    await user.click(screen.getByRole("button", { name: "Kopieren" }));

    await waitFor(() => expect(rendered.output.copyText).toHaveBeenCalledOnce());
    expect(rendered.output.copyText).toHaveBeenCalledWith(expectedCopy);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Negativprompt wurde kopiert."
    );

    await user.click(screen.getByRole("button", { name: "TXT exportieren" }));
    expect(rendered.output.downloadTextFile).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filename: expect.stringMatching(/-negative\.txt$/),
        contents: expect.stringContaining("- "),
        mimeType: "text/plain;charset=utf-8"
      })
    );

    await user.click(screen.getByRole("button", { name: "Profil speichern" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Assetprofil „Dorfschmied mit Lederschürze“ wurde gespeichert."
    );
    const storedLibrary = rendered.storageAdapter.readProfileLibrary();
    expect(storedLibrary.status).toBe("valid");
    if (storedLibrary.status !== "valid") {
      throw new Error("Expected a persisted profile library.");
    }
    expect(
      storedLibrary.value.assetProfiles.find(
        (profile) => profile.id === "asset_review_created"
      )
    ).toMatchObject({
      name: "Dorfschmied mit Lederschürze",
      category: "character",
      subtype: "npc"
    });
    expect(rendered.storageAdapter.readDraft()).toMatchObject({
      status: "valid",
      value: { sourceAssetProfileId: "asset_review_created" }
    });

    await user.click(screen.getByRole("button", { name: "JSON exportieren" }));
    const jsonFile = rendered.output.downloadTextFile.mock.calls.at(-1)?.[0];
    expect(jsonFile).toMatchObject({
      filename: "dorfschmied-mit-lederschurze-profile.json",
      mimeType: "application/json;charset=utf-8"
    });
    if (!jsonFile) throw new Error("Expected a JSON download.");
    const parsed = parseExportBundleJson(jsonFile.contents);
    expect(parsed.status).toBe("valid");
    if (parsed.status !== "valid") throw new Error("Expected a valid bundle.");
    expect(parsed.bundle.assetProfiles).toHaveLength(1);
    expect(parsed.bundle.assetProfiles[0]?.id).toBe("asset_review_created");
    expect(parsed.bundle.baseProfiles).toHaveLength(1);
    expect(parsed.bundle.categoryProfiles).toHaveLength(1);
  });

  it("shows profile conflicts and never exposes production actions for a partial result", () => {
    const fixture = createProfileLibraryFixture();
    const draft = createReviewDraft(fixture);
    const library = ProfileLibrarySchema.parse({
      ...fixture,
      baseProfiles: fixture.baseProfiles.map((profile) =>
        profile.id === draft.baseProfileId
          ? { ...profile, locks: { ...profile.locks, tileSize: true } }
          : profile
      )
    });
    const conflictDraft = parseWizardDraft({
      ...draft,
      overrides: { ...draft.overrides, tileSize: 48 }
    });
    const memory = new MemoryStorage();
    const storageAdapter = createV2StorageAdapter(memory);
    expect(storageAdapter.writeProfileLibrary(library)).toEqual({ status: "ok" });
    expect(storageAdapter.writeDraft(conflictDraft)).toEqual({ status: "ok" });

    render(
      <App
        navigationAdapter={new MemoryNavigation({
          status: "valid",
          view: "review"
        })}
        storageAdapter={storageAdapter}
        outputAdapter={createOutputAdapter().adapter}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Ausgabe sicher angehalten" })
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tilegröße ist im Basisprofil gesperrt"
    );
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Profil speichern" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kopieren" })).not.toBeInTheDocument();
  });

  it("reports a rejected injected clipboard operation without changing output", async () => {
    const user = userEvent.setup();
    const copyText = vi.fn(async () => {
      throw new Error("Clipboard denied");
    });
    renderWorkspace({
      outputAdapter: {
        copyText,
        downloadTextFile: vi.fn()
      }
    });
    const content = screen.getByRole("tabpanel").textContent;

    await user.click(screen.getByRole("button", { name: "Kopieren" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "konnte nicht in die Zwischenablage kopiert werden"
    );
    expect(screen.getByRole("tabpanel").textContent).toBe(content);
  });
});
