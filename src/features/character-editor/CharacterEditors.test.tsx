import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, type UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import type { CharacterSubtype } from "../../domain/characters";
import type { WizardCoreFormValues } from "../wizard/wizardSteps";
import { CharacterAnimationEditor } from "./CharacterAnimationEditor";
import { CharacterDetailsEditor } from "./CharacterDetailsEditor";

function CharacterDetailsHarness({
  onRead,
  subtype = "npc"
}: Readonly<{
  onRead?: (values: WizardCoreFormValues) => void;
  subtype?: CharacterSubtype;
}>) {
  const form = useForm<WizardCoreFormValues>({
    defaultValues: {
      projectName: "Hafenwache",
      category: "character",
      subtype
    }
  });

  return (
    <form>
      <CharacterDetailsEditor
        form={form}
        characterHeight={80}
        heightSourceName="Weltfamilie 32 px / Figuren 80 px"
        heightSource="Basisprofil"
        heightLocked
        subtype={subtype}
      />
      {onRead ? (
        <button type="button" onClick={() => onRead(form.getValues())}>
          Formularwerte lesen
        </button>
      ) : null}
    </form>
  );
}

function CharacterAnimationHarness({
  formRef,
  notifyProgrammaticChange
}: Readonly<{
  formRef?: { current: UseFormReturn<WizardCoreFormValues> | null };
  notifyProgrammaticChange: () => void;
}>) {
  const form = useForm<WizardCoreFormValues>({
    defaultValues: {
      projectName: "Hafenwache",
      category: "character",
      subtype: "npc",
      directionCount: 8
    }
  });
  if (formRef) formRef.current = form;

  return (
    <CharacterAnimationEditor
      form={form}
      notifyProgrammaticChange={notifyProgrammaticChange}
    />
  );
}

describe("CharacterDetailsEditor", () => {
  it("shows the inherited locked height without exposing an asset-level height input", () => {
    render(<CharacterDetailsHarness />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Figurenhöhe" })
    ).toBeVisible();
    expect(screen.getByText("80 px")).toBeVisible();
    expect(screen.getByText("Gesperrt")).toBeVisible();
    expect(
      screen.getByText(
        "Quelle: Basisprofil · Weltfamilie 32 px / Figuren 80 px"
      )
    ).toBeVisible();
    expect(
      screen.queryByRole("spinbutton", { name: /Figurenhöhe/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /Figurenhöhe/i })
    ).not.toBeInTheDocument();
  });

  it("renders and projects the complete optional NPC question set through native controls", async () => {
    const user = userEvent.setup();
    const onRead = vi.fn();
    render(<CharacterDetailsHarness onRead={onRead} />);

    expect(
      screen.getByRole("group", { name: "Identität und Varianten" })
    ).toBeVisible();
    expect(
      screen.getByRole("group", { name: "Körper, Gesicht und Ausdruck" })
    ).toBeVisible();
    expect(
      screen.getByRole("group", { name: "Kopfbedeckung und Kleidung" })
    ).toBeVisible();
    expect(
      screen.getByRole("group", { name: "Accessoires, Ausrüstung und Material" })
    ).toBeVisible();
    expect(screen.getByRole("group", { name: "Figurenpalette" })).toBeVisible();
    expect(screen.getByRole("group", { name: "NPC-Kontext" })).toBeVisible();

    const expectedLabels = [
      "Rolle / Beruf",
      "Kurze Figurenbeschreibung",
      "Figurenvarianten",
      "Geschlechtswirkung",
      "Alterswirkung",
      "Relative Größe",
      "Körperbau",
      "Haltung",
      "Gesichtsform",
      "Hautwirkung",
      "Augenlesbarkeit",
      "Haare",
      "Frisur",
      "Bart",
      "Ausdruck",
      "Silhouettenmerkmal",
      "Pose",
      "Weitere Figurendetails",
      "Kopfbedeckung",
      "Zustand der Kopfbedeckung",
      "Schal / Kragen",
      "Oberbekleidung",
      "Unterbekleidung",
      "Kleidungsschichten",
      "Handschuhe",
      "Hand- / Werkzeughaltung",
      "Schuhe / Stiefel",
      "Gürtel / Taschen",
      "Rückenelement",
      "Accessoires",
      "Ausrüstung / Werkzeug",
      "Materialmix",
      "Gesamtzustand",
      "Palettenquelle",
      "Hauptfarbe",
      "Nebenfarbe",
      "Akzentfarbe",
      "Beruf sofort lesbar?",
      "Wohlstandsstufe",
      "Soziale Rolle",
      "Kulturelle Funktion",
      "Typische Tätigkeit",
      "Gesprächshaltung / Idle-Geste",
      "Alltagswerkzeug",
      "Besondere Vorder- / Rückseitendetails"
    ];
    for (const label of expectedLabels) {
      expect(screen.getByLabelText(label)).toBeVisible();
    }

    await user.type(screen.getByLabelText("Rolle / Beruf"), "  Schmied  ");
    await user.selectOptions(screen.getByLabelText("Figurenvarianten"), "3");
    await user.selectOptions(screen.getByLabelText("Alterswirkung"), "adult");
    await user.selectOptions(screen.getByLabelText("Beruf sofort lesbar?"), "true");
    await user.selectOptions(screen.getByLabelText("Wohlstandsstufe"), "modest");
    await user.type(screen.getByLabelText("Silhouettenmerkmal"), "Breite Schürze");
    await user.click(screen.getByRole("button", { name: "Formularwerte lesen" }));

    expect(onRead).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "Schmied",
        variantCount: 3,
        age: "adult",
        professionReadable: true,
        wealth: "modest",
        silhouette: "Breite Schürze"
      })
    );
  });

  it("hides NPC context and humanoid clothing for animals while keeping useful gear fields", () => {
    render(<CharacterDetailsHarness subtype="animal" />);

    expect(screen.queryByRole("group", { name: "NPC-Kontext" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Kopfbedeckung und Kleidung" })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Oberbekleidung")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Ausrüstung / Werkzeug")).toBeVisible();
    expect(
      screen.getByText(/Humanoide Kleidungsfragen sind für Tier und Kreatur ausgeblendet/)
    ).toBeVisible();
  });
});

describe("CharacterAnimationEditor", () => {
  it("offers every domain action and toggles its default frame field by keyboard", async () => {
    const user = userEvent.setup();
    const notifyProgrammaticChange = vi.fn();
    const formRef: { current: UseFormReturn<WizardCoreFormValues> | null } = {
      current: null
    };
    render(
      <CharacterAnimationHarness
        formRef={formRef}
        notifyProgrammaticChange={notifyProgrammaticChange}
      />
    );

    for (const action of [
      "Idle",
      "Walk",
      "Run",
      "Attack",
      "Use",
      "Talk",
      "Interact",
      "Hurt",
      "Spezialaktion"
    ]) {
      expect(
        screen.getByRole("checkbox", { name: `${action} aktivieren` })
      ).toBeVisible();
    }

    const walk = screen.getByRole("checkbox", { name: "Walk aktivieren" });
    walk.focus();
    await user.keyboard(" ");

    expect(walk).toBeChecked();
    expect(
      screen.getByRole("spinbutton", { name: "Frames für Walk" })
    ).toHaveValue(5);
    expect(formRef.current?.getValues("characterAnimationFrames")).toEqual({
      walk: 5
    });
    expect(notifyProgrammaticChange).toHaveBeenCalledTimes(1);

    await user.keyboard(" ");
    expect(walk).not.toBeChecked();
    expect(
      screen.queryByRole("spinbutton", { name: "Frames für Walk" })
    ).not.toBeInTheDocument();
    expect(
      formRef.current?.getValues("characterAnimationFrames")
    ).toBeUndefined();
    expect(notifyProgrammaticChange).toHaveBeenCalledTimes(2);
  });

  it("edits frames natively and exposes all production consistency rules", async () => {
    const user = userEvent.setup();
    const formRef: { current: UseFormReturn<WizardCoreFormValues> | null } = {
      current: null
    };
    render(
      <CharacterAnimationHarness
        formRef={formRef}
        notifyProgrammaticChange={() => undefined}
      />
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Attack aktivieren" })
    );
    const frames = screen.getByRole("spinbutton", {
      name: "Frames für Attack"
    });
    await user.clear(frames);
    await user.type(frames, "6");

    expect(formRef.current?.getValues("characterAnimationFrames.attack")).toBe(6);
    expect(
      screen.getByText("Jede Aktion verwendet ihre Frames in allen 8 gewählten Richtungen.")
    ).toBeVisible();
    expect(screen.getByText(/Kamera und die Weltlichtseite bleiben/)).toBeVisible();
    expect(screen.getByText(/nicht blind/)).toBeVisible();
    expect(screen.getByText(/Fußanker/)).toBeVisible();
    expect(screen.getByText(/höchstens ±1 px/)).toBeVisible();
  });
});
