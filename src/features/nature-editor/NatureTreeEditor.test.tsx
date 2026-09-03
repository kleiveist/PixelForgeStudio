import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, type DefaultValues, type UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import {
  getDefaultNaturePlantType,
  type NatureSubtype
} from "../../domain/nature";
import type { WizardCoreFormValues } from "../wizard/wizardSteps";
import { NatureTreeEditor } from ".";

function NatureEditorHarness({
  defaultValues,
  formRef,
  onRead,
  subtype = "tree"
}: Readonly<{
  defaultValues?: DefaultValues<WizardCoreFormValues>;
  formRef?: { current: UseFormReturn<WizardCoreFormValues> | null };
  onRead?: (values: WizardCoreFormValues) => void;
  subtype?: NatureSubtype;
}>) {
  const form = useForm<WizardCoreFormValues>({
    defaultValues: {
      projectName: "Winterhain",
      category: "nature",
      subtype,
      naturePlantType: getDefaultNaturePlantType(subtype),
      ...defaultValues
    }
  });

  if (formRef) formRef.current = form;

  return (
    <form>
      <NatureTreeEditor form={form} subtype={subtype} />
      {onRead ? (
        <button type="button" onClick={() => onRead(form.getValues())}>
          Formularwerte lesen
        </button>
      ) : null}
    </form>
  );
}

describe("NatureTreeEditor", () => {
  it("offers the complete tree workflow and projects native controls into RHF", async () => {
    const user = userEvent.setup();
    const onRead = vi.fn();
    render(
      <NatureEditorHarness
        defaultValues={{ tileSize: 32 }}
        onRead={onRead}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Baum gestalten" })
    ).toBeVisible();

    for (const group of [
      "Pflanze und Umgebung",
      "Stamm und Rinde",
      "Krone und Blattmasse",
      "Wurzeln und Fußpunkt",
      "Bewuchs und Wetterauflage",
      "Standfläche und Varianten",
      "Weitere Naturdetails"
    ]) {
      expect(screen.getByRole("group", { name: group })).toBeVisible();
    }

    expect(screen.getByRole("status", { name: "Pflanzentyp" })).toHaveTextContent(
      "Baum"
    );
    expect(
      screen.getByRole("status", { name: "Wirksame Tilegröße" })
    ).toHaveTextContent("32 × 32 px");

    await user.type(screen.getByLabelText("Art / Spezies"), "Silbereiche");
    await user.type(
      screen.getByLabelText("Kurze Naturbeschreibung"),
      "Ein uralter, schneebedeckter Baum"
    );
    await user.selectOptions(screen.getByLabelText("Klimazone"), "snow");
    await user.selectOptions(screen.getByLabelText("Jahreszeit"), "winter");
    await user.selectOptions(
      screen.getByLabelText("Alter / Entwicklungsstand"),
      "ancient"
    );
    await user.selectOptions(
      screen.getByLabelText("Gesamtsilhouette"),
      "gnarled"
    );
    await user.selectOptions(screen.getByLabelText("Stammdicke"), "thick");
    await user.selectOptions(screen.getByLabelText("Stammform"), "twisted");
    await user.type(
      screen.getByLabelText("Rinde, Verzweigung und Hohlräume"),
      "Tiefe Rindencluster und ein kleiner Hohlraum"
    );
    await user.selectOptions(screen.getByLabelText("Kronenform"), "spreading");
    await user.selectOptions(screen.getByLabelText("Kronendichte"), "dense");
    await user.type(
      screen.getByLabelText("Blätter, Nadeln und Cluster"),
      "Große, klar getrennte Blattcluster"
    );
    await user.selectOptions(
      screen.getByLabelText("Wurzelsichtbarkeit"),
      "visible"
    );
    await user.type(
      screen.getByLabelText("Wurzelform und Verlauf"),
      "Breite Wurzeln auf felsigem Boden"
    );
    await user.selectOptions(screen.getByLabelText("Moosbewuchs"), "heavy");
    await user.selectOptions(
      screen.getByLabelText("Pilzbewuchs"),
      "clustered"
    );
    await user.selectOptions(
      screen.getByLabelText("Schneebedeckung"),
      "covered"
    );
    await user.selectOptions(
      screen.getByLabelText("Rankenbewuchs"),
      "light"
    );
    await user.type(
      screen.getByLabelText("Standfläche · Breite in Tiles"),
      "3"
    );
    await user.type(
      screen.getByLabelText("Standfläche · Tiefe in Tiles"),
      "2"
    );
    await user.selectOptions(
      screen.getByLabelText("Bodenanschluss"),
      "snowy"
    );
    await user.type(screen.getByLabelText("Verwandte Varianten"), "4");
    await user.type(
      screen.getByLabelText("Weitere Naturdetails"),
      "Einzelne Eiszapfen an den unteren Ästen"
    );
    await user.click(screen.getByRole("button", { name: "Formularwerte lesen" }));

    expect(onRead).toHaveBeenCalledWith(
      expect.objectContaining({
        naturePlantType: "tree",
        natureSpecies: "Silbereiche",
        natureDescription: "Ein uralter, schneebedeckter Baum",
        natureClimate: "snow",
        natureSeason: "winter",
        natureAge: "ancient",
        natureSilhouette: "gnarled",
        natureTrunkThickness: "thick",
        natureTrunkShape: "twisted",
        natureTrunkDetails: "Tiefe Rindencluster und ein kleiner Hohlraum",
        natureCrownShape: "spreading",
        natureCrownDensity: "dense",
        natureFoliageDetails: "Große, klar getrennte Blattcluster",
        natureRootVisibility: "visible",
        natureRootDetails: "Breite Wurzeln auf felsigem Boden",
        natureMossCoverage: "heavy",
        natureMushroomGrowth: "clustered",
        natureSnowCover: "covered",
        natureVineGrowth: "light",
        natureFootprintWidthTiles: 3,
        natureFootprintDepthTiles: 2,
        natureGrounding: "snowy",
        natureVariantCount: 4,
        natureExtraDetails: "Einzelne Eiszapfen an den unteren Ästen",
        tileSize: 32
      })
    );
    expect(onRead.mock.calls[0]?.[0]).not.toHaveProperty("directionCount");
    expect(onRead.mock.calls[0]?.[0]).not.toHaveProperty("animationType");
  });

  it("hides tree anatomy for a mushroom while retaining relevant nature fields", () => {
    render(<NatureEditorHarness subtype="mushroom" />);

    expect(
      screen.getByRole("heading", { name: "Pilz gestalten" })
    ).toBeVisible();
    expect(screen.getByRole("status", { name: "Pflanzentyp" })).toHaveTextContent(
      "Pilz"
    );
    expect(
      screen.queryByRole("group", { name: "Stamm und Rinde" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Krone und Blattmasse" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Wurzeln und Fußpunkt" })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Art / Spezies")).toBeVisible();
    expect(screen.getByLabelText("Pilzbewuchs")).toBeVisible();
    expect(screen.getByLabelText("Bodenanschluss")).toBeVisible();
  });

  it("shows inherited tile size read-only and does not materialize derived values", () => {
    const formRef: { current: UseFormReturn<WizardCoreFormValues> | null } = {
      current: null
    };
    render(
      <NatureEditorHarness
        defaultValues={{ naturePlantType: undefined, tileSize: undefined }}
        formRef={formRef}
      />
    );

    expect(
      screen.getByRole("status", { name: "Wirksame Tilegröße" })
    ).toHaveTextContent("Nicht festgelegt");
    expect(screen.getByRole("status", { name: "Pflanzentyp" })).toHaveTextContent(
      "Baum"
    );
    expect(formRef.current?.getValues("tileSize")).toBeUndefined();
    expect(formRef.current?.getValues("naturePlantType")).toBeUndefined();
    expect(
      screen.queryByRole("spinbutton", { name: /Tilegröße/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Basisprofil-Vererbung/)).toBeVisible();
  });

  it("keeps animation informational and never exposes direction controls", () => {
    render(<NatureEditorHarness subtype="tree" />);

    expect(
      screen.getByRole("heading", { name: "Animation bleibt getrennt" })
    ).toBeVisible();
    expect(screen.getByText(/Wind- oder Magieanimation/)).toBeVisible();
    expect(
      screen.queryByRole("combobox", { name: /Animation/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Richtungsanzahl|Richtungsset|4 Richtungen|8 Richtungen/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText("Keine Richtungsansichten")).toBeVisible();
  });

  it("makes an incomplete footprint visible until both bounded axes exist", async () => {
    const user = userEvent.setup();
    render(<NatureEditorHarness />);

    const width = screen.getByLabelText("Standfläche · Breite in Tiles");
    const depth = screen.getByLabelText("Standfläche · Tiefe in Tiles");
    const variants = screen.getByLabelText("Verwandte Varianten");

    expect(width).toHaveAttribute("min", "1");
    expect(width).toHaveAttribute("max", "64");
    expect(depth).toHaveAttribute("min", "1");
    expect(depth).toHaveAttribute("max", "64");
    expect(variants).toHaveAttribute("min", "1");
    expect(variants).toHaveAttribute("max", "12");

    await user.type(width, "2");
    expect(
      screen.getByRole("status", { name: "Footprint-Hinweis" })
    ).toHaveTextContent(
      "Der Footprint ist unvollständig"
    );

    await user.type(depth, "3");
    expect(
      screen.queryByText(/Der Footprint ist unvollständig/)
    ).not.toBeInTheDocument();

    await user.clear(width);
    expect(
      screen.getByRole("status", { name: "Footprint-Hinweis" })
    ).toHaveTextContent(
      "Der Footprint ist unvollständig"
    );

    await user.clear(depth);
    expect(
      screen.queryByText(/Der Footprint ist unvollständig/)
    ).not.toBeInTheDocument();
  });
});
