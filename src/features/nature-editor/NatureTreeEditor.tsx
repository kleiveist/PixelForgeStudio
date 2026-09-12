import { useI18n } from "../../i18n";
import type { ReactNode } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { resolveCapabilities } from "../../domain/assets";
import { GUIDED_TEXT_PRESETS_DE } from "../../domain/guided-answers";
import {
  NATURE_AGE_IDS,
  NATURE_CLIMATE_IDS,
  NATURE_CROWN_DENSITY_IDS,
  NATURE_CROWN_SHAPE_IDS,
  NATURE_GROUNDING_IDS,
  NATURE_MOSS_COVERAGE_IDS,
  NATURE_MUSHROOM_GROWTH_IDS,
  NATURE_ROOT_VISIBILITY_IDS,
  NATURE_SEASON_IDS,
  NATURE_SILHOUETTE_IDS,
  NATURE_SNOW_COVER_IDS,
  NATURE_TRUNK_SHAPE_IDS,
  NATURE_TRUNK_THICKNESS_IDS,
  NATURE_VINE_GROWTH_IDS,
  getDefaultNaturePlantType,
  natureSubtypeHasCrown,
  natureSubtypeHasRoots,
  natureSubtypeHasTrunk,
  type NatureAge,
  type NatureClimate,
  type NatureCrownDensity,
  type NatureCrownShape,
  type NatureGrounding,
  type NatureMossCoverage,
  type NatureMushroomGrowth,
  type NaturePlantType,
  type NatureRootVisibility,
  type NatureSeason,
  type NatureSilhouette,
  type NatureSnowCover,
  type NatureSubtype,
  type NatureTrunkShape,
  type NatureTrunkThickness,
  type NatureVineGrowth
} from "../../domain/nature";
import type { WizardCoreFormValues } from "../wizard/wizardSteps";
import { GuidedTextChoice } from "../wizard/GuidedTextChoice";
import styles from "./NatureTreeEditor.module.css";

type NatureForm = UseFormReturn<WizardCoreFormValues>;

type NatureTextFieldName =
  | "natureSpecies"
  | "natureDescription"
  | "natureTrunkDetails"
  | "natureFoliageDetails"
  | "natureRootDetails"
  | "natureExtraDetails";

type NatureSelectFieldName =
  | "natureClimate"
  | "natureSeason"
  | "natureAge"
  | "natureSilhouette"
  | "natureTrunkThickness"
  | "natureTrunkShape"
  | "natureCrownShape"
  | "natureCrownDensity"
  | "natureRootVisibility"
  | "natureMossCoverage"
  | "natureMushroomGrowth"
  | "natureSnowCover"
  | "natureVineGrowth"
  | "natureGrounding";

type NatureNumberFieldName =
  | "natureFootprintWidthTiles"
  | "natureFootprintDepthTiles"
  | "natureVariantCount";

interface SelectOption<Value extends string = string> {
  readonly value: Value;
  readonly label: string;
}

const SUBTYPE_LABELS: Readonly<Record<NatureSubtype, string>> = {
  tree: "Baum",
  deciduousTree: "Laubbaum",
  conifer: "Nadelbaum",
  witheredTree: "Verdorrter Baum",
  magicTree: "Magischer Baum",
  bush: "Busch",
  grassTuft: "Grasbüschel",
  mushroom: "Pilz",
  root: "Wurzel",
  treeStump: "Baumstumpf",
  vine: "Rankengewächs"
};

const PLANT_TYPE_LABELS: Readonly<Record<NaturePlantType, string>> = {
  tree: "Baum",
  bush: "Busch",
  grass: "Gras",
  mushroom: "Pilz",
  root: "Wurzel",
  treeStump: "Baumstumpf",
  vine: "Rankengewächs"
};

const CLIMATE_LABELS: Readonly<Record<NatureClimate, string>> = {
  temperate: "Gemäßigt",
  mountain: "Gebirge",
  snow: "Schneegebiet",
  swamp: "Sumpf",
  dry: "Trocken",
  dark: "Düster",
  magical: "Magisch"
};

const SEASON_LABELS: Readonly<Record<NatureSeason, string>> = {
  spring: "Frühling",
  summer: "Sommer",
  autumn: "Herbst",
  winter: "Winter",
  timeless: "Zeitlos"
};

const AGE_LABELS: Readonly<Record<NatureAge, string>> = {
  young: "Jung",
  mature: "Ausgewachsen",
  ancient: "Uralt",
  dead: "Abgestorben"
};

const SILHOUETTE_LABELS: Readonly<Record<NatureSilhouette, string>> = {
  broad: "Breit",
  narrow: "Schmal",
  asymmetric: "Asymmetrisch",
  gnarled: "Knorrig",
  upright: "Aufrecht",
  spreading: "Ausladend",
  compact: "Kompakt"
};

const TRUNK_THICKNESS_LABELS: Readonly<Record<NatureTrunkThickness, string>> = {
  thin: "Dünn",
  medium: "Mittel",
  thick: "Dick",
  massive: "Massiv"
};

const TRUNK_SHAPE_LABELS: Readonly<Record<NatureTrunkShape, string>> = {
  straight: "Gerade",
  tapered: "Konisch zulaufend",
  twisted: "Verdreht",
  gnarled: "Knorrig",
  split: "Geteilt",
  hollow: "Hohl"
};

const CROWN_SHAPE_LABELS: Readonly<Record<NatureCrownShape, string>> = {
  round: "Rund",
  tall: "Hoch",
  tiered: "Gestuft",
  spreading: "Ausladend",
  conical: "Kegelförmig",
  irregular: "Unregelmäßig",
  damaged: "Beschädigt",
  bare: "Kahl"
};

const CROWN_DENSITY_LABELS: Readonly<Record<NatureCrownDensity, string>> = {
  sparse: "Spärlich",
  loose: "Locker",
  medium: "Mittel",
  dense: "Dicht",
  bare: "Kahl"
};

const ROOT_VISIBILITY_LABELS: Readonly<Record<NatureRootVisibility, string>> = {
  hidden: "Verborgen",
  visible: "Sichtbar",
  spreading: "Ausladend",
  rockWrapping: "Felsumgreifend",
  exposed: "Freigelegt"
};

const MOSS_COVERAGE_LABELS: Readonly<Record<NatureMossCoverage, string>> = {
  none: "Kein Moos",
  light: "Leicht",
  moderate: "Mittel",
  heavy: "Stark"
};

const MUSHROOM_GROWTH_LABELS: Readonly<Record<NatureMushroomGrowth, string>> = {
  none: "Keine Pilze",
  few: "Wenige",
  clustered: "In Gruppen",
  abundant: "Reichlich"
};

const SNOW_COVER_LABELS: Readonly<Record<NatureSnowCover, string>> = {
  none: "Kein Schnee",
  dusting: "Leicht bestäubt",
  partial: "Teilweise bedeckt",
  covered: "Bedeckt",
  heavy: "Schwere Auflage"
};

const VINE_GROWTH_LABELS: Readonly<Record<NatureVineGrowth, string>> = {
  none: "Keine Ranken",
  light: "Leichter Bewuchs",
  draped: "Herabhängend",
  entangled: "Dicht verflochten"
};

const GROUNDING_LABELS: Readonly<Record<NatureGrounding, string>> = {
  natural: "Natürlicher Bodenanschluss",
  soilPatch: "Erdfläche",
  grassPatch: "Grasfläche",
  rocky: "Felsig",
  snowy: "Verschneit",
  swampy: "Sumpfig",
  freestanding: "Freigestellt ohne Bodenpatch"
};

function optionsFromIds<Value extends string>(
  ids: readonly Value[],
  labels: Readonly<Record<Value, string>>
): readonly SelectOption<Value>[] {
  return ids.map((value) => ({ value, label: labels[value] }));
}

const CLIMATE_OPTIONS = optionsFromIds(NATURE_CLIMATE_IDS, CLIMATE_LABELS);
const SEASON_OPTIONS = optionsFromIds(NATURE_SEASON_IDS, SEASON_LABELS);
const AGE_OPTIONS = optionsFromIds(NATURE_AGE_IDS, AGE_LABELS);
const SILHOUETTE_OPTIONS = optionsFromIds(
  NATURE_SILHOUETTE_IDS,
  SILHOUETTE_LABELS
);
const TRUNK_THICKNESS_OPTIONS = optionsFromIds(
  NATURE_TRUNK_THICKNESS_IDS,
  TRUNK_THICKNESS_LABELS
);
const TRUNK_SHAPE_OPTIONS = optionsFromIds(
  NATURE_TRUNK_SHAPE_IDS,
  TRUNK_SHAPE_LABELS
);
const CROWN_SHAPE_OPTIONS = optionsFromIds(
  NATURE_CROWN_SHAPE_IDS,
  CROWN_SHAPE_LABELS
);
const CROWN_DENSITY_OPTIONS = optionsFromIds(
  NATURE_CROWN_DENSITY_IDS,
  CROWN_DENSITY_LABELS
);
const ROOT_VISIBILITY_OPTIONS = optionsFromIds(
  NATURE_ROOT_VISIBILITY_IDS,
  ROOT_VISIBILITY_LABELS
);
const MOSS_COVERAGE_OPTIONS = optionsFromIds(
  NATURE_MOSS_COVERAGE_IDS,
  MOSS_COVERAGE_LABELS
);
const MUSHROOM_GROWTH_OPTIONS = optionsFromIds(
  NATURE_MUSHROOM_GROWTH_IDS,
  MUSHROOM_GROWTH_LABELS
);
const SNOW_COVER_OPTIONS = optionsFromIds(
  NATURE_SNOW_COVER_IDS,
  SNOW_COVER_LABELS
);
const VINE_GROWTH_OPTIONS = optionsFromIds(
  NATURE_VINE_GROWTH_IDS,
  VINE_GROWTH_LABELS
);
const GROUNDING_OPTIONS = optionsFromIds(
  NATURE_GROUNDING_IDS,
  GROUNDING_LABELS
);

function optionalTextValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value === "" ? undefined : value;
}

function optionalSelectValue(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function optionalNumberValue(value: unknown): number | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function fieldError(
  form: NatureForm,
  field: keyof WizardCoreFormValues
): string | null {
  const error = form.formState.errors[field];
  return typeof error?.message === "string" ? error.message : null;
}

function FieldShell({
  children,
  error,
  help,
  id,
  label,
  wide = false
}: Readonly<{
  children: ReactNode;
  error: string | null;
  help: string;
  id: string;
  label: string;
  wide?: boolean;
}>) {
  const { tx } = useI18n();
  return (
    <div
      className={wide ? `${styles.field} ${styles.wideField}` : styles.field}
    >
      <label htmlFor={id}>{tx(label)}</label>
      {children}
      <p id={`${id}-help`} className={styles.help}>
        {tx(help)}
      </p>
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          {tx(error)}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  form,
  help,
  label,
  name,
  options
}: Readonly<{
  form: NatureForm;
  help: string;
  label: string;
  name: NatureSelectFieldName;
  options: readonly SelectOption[];
}>) {
  const { t, tx } = useI18n();
  const id = `nature-${name}`;
  const error = fieldError(form, name);
  const describedBy = `${id}-help${error ? ` ${id}-error` : ""}`;

  return (
    <FieldShell error={error} help={tx(help)} id={id} label={tx(label)}>
      <select
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : "false"}
        {...form.register(name, { setValueAs: optionalSelectValue })}
      >
        <option value="">{t("Nicht festgelegt")}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {tx(option.label)}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function TextField({
  form,
  help,
  label,
  maxLength,
  multiline = false,
  name,
  notifyProgrammaticChange,
  wide = false
}: Readonly<{
  form: NatureForm;
  help: string;
  label: string;
  maxLength: number;
  multiline?: boolean;
  name: NatureTextFieldName;
  notifyProgrammaticChange: () => void;
  wide?: boolean;
}>) {
  const { tx } = useI18n();
  const id = `nature-${name}`;
  const error = fieldError(form, name);
  const describedBy = `${id}-help${error ? ` ${id}-error` : ""}`;
  const registration = form.register(name, { setValueAs: optionalTextValue });
  const value = useWatch({ control: form.control, name });

  return (
    <GuidedTextChoice
      describedBy={describedBy}
      error={error}
      errorClassName={styles.error}
      fieldClassName={
        wide ? `${styles.field} ${styles.wideField}` : styles.field
      }
      help={tx(help)}
      helpClassName={styles.help}
      id={id}
      label={tx(label)}
      maxLength={maxLength}
      multiline={multiline}
      onChoose={(nextValue) => {
        form.setValue(name, nextValue, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        });
        notifyProgrammaticChange();
      }}
      presets={GUIDED_TEXT_PRESETS_DE[name]}
      registration={registration}
      value={value}
    />
  );
}

function NumberField({
  form,
  help,
  label,
  max,
  min,
  name
}: Readonly<{
  form: NatureForm;
  help: string;
  label: string;
  max: number;
  min: number;
  name: NatureNumberFieldName;
}>) {
  const { tx } = useI18n();
  const id = `nature-${name}`;
  const error = fieldError(form, name);
  const describedBy = `${id}-help${error ? ` ${id}-error` : ""}`;

  return (
    <FieldShell error={error} help={tx(help)} id={id} label={tx(label)}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={1}
        inputMode="numeric"
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : "false"}
        {...form.register(name, { setValueAs: optionalNumberValue })}
      />
    </FieldShell>
  );
}

function PlantTypeField({
  form,
  plantType,
  subtype
}: Readonly<{
  form: NatureForm;
  plantType: NaturePlantType;
  subtype: NatureSubtype;
}>) {
  const { t, tx } = useI18n();
  const error = fieldError(form, "naturePlantType");

  return (
    <div className={styles.field}>
      <span id="nature-plant-type-label" className={styles.fieldLabel}>
        {t("Pflanzentyp")}
      </span>
      <output
        className={styles.derivedValue}
        aria-labelledby="nature-plant-type-label"
        aria-describedby={`nature-plant-type-help${error ? " nature-plant-type-error" : ""}`}
      >
        {tx(PLANT_TYPE_LABELS[plantType])}
      </output>
      <p id="nature-plant-type-help" className={styles.help}>
        {t("Aus dem Untertyp")} {tx(SUBTYPE_LABELS[subtype])}{" "}
        {t("abgeleitet. Ein Wechsel erfolgt im Schritt Bildart.")}
      </p>
      {error ? (
        <p id="nature-plant-type-error" className={styles.error}>
          {tx(error)}
        </p>
      ) : null}
    </div>
  );
}

function TileSizeField({ tileSize }: Readonly<{ tileSize?: number }>) {
  const { t } = useI18n();
  return (
    <div className={styles.field}>
      <span id="nature-tile-size-label" className={styles.fieldLabel}>
        {t("Wirksame Tilegröße")}
      </span>
      <output
        className={styles.derivedValue}
        aria-labelledby="nature-tile-size-label"
        aria-describedby="nature-tile-size-help"
      >
        {tileSize === undefined
          ? t("Nicht festgelegt")
          : t("{0} × {1} px", String(tileSize), String(tileSize))}
      </output>
      <p id="nature-tile-size-help" className={styles.help}>
        {t(
          "Technischer Wert aus der Basisprofil-Vererbung. Er wird nicht in den Naturantworten dupliziert."
        )}
      </p>
    </div>
  );
}

export interface NatureTreeEditorProps {
  readonly form: NatureForm;
  readonly notifyProgrammaticChange: () => void;
  readonly subtype: NatureSubtype;
}

export function NatureTreeEditor({
  form,
  notifyProgrammaticChange,
  subtype
}: NatureTreeEditorProps) {
  const { t, tx } = useI18n();
  const plantType = getDefaultNaturePlantType(subtype);
  const capabilities = resolveCapabilities("nature", subtype);
  const tileSize = useWatch({ control: form.control, name: "tileSize" });
  const footprintWidth = useWatch({
    control: form.control,
    name: "natureFootprintWidthTiles"
  });
  const footprintDepth = useWatch({
    control: form.control,
    name: "natureFootprintDepthTiles"
  });
  const footprintIsPartial =
    (footprintWidth === undefined) !== (footprintDepth === undefined);

  return (
    <div className={styles.editor}>
      <section
        className={styles.contextCard}
        aria-labelledby="nature-context-title"
      >
        <div className={styles.contextCopy}>
          <p className={styles.eyebrow}>{t("Naturasset im Weltmaßstab")}</p>
          <h3 id="nature-context-title">
            {tx(SUBTYPE_LABELS[subtype])} {t("gestalten")}
          </h3>
          <p className={styles.contextHelp}>
            {t(
              "Der Untertyp steuert die sichtbaren Anatomiegruppen. Kamera, Tile-Raster und Licht bleiben Teil der gemeinsamen Produktionsfamilie."
            )}
          </p>
        </div>
        <div className={styles.natureMark} aria-hidden="true">
          <span className={styles.canopy} />
          <span className={styles.trunk} />
          <span className={styles.groundLine} />
        </div>
        <ul className={styles.statusList} aria-label={t("Natur-Capabilities")}>
          <li className={styles.statusBadge}>
            {t("Keine Richtungsansichten")}
          </li>
          <li className={styles.statusBadge}>
            {capabilities.animated
              ? t("Animation separat verfügbar")
              : t("Statisches Naturasset")}
          </li>
        </ul>
      </section>

      <section
        className={styles.animationNote}
        aria-labelledby="nature-animation-title"
      >
        <h3 id="nature-animation-title">{t("Animation bleibt getrennt")}</h3>
        <p>
          {capabilities.animated
            ? t(
                "Eine optionale Wind- oder Magieanimation wird ausschließlich im folgenden Capability-Schritt gewählt. Sie erzeugt niemals ein Richtungsset."
              )
            : t(
                "Dieser Untertyp erhält hier keine Animationsauswahl und niemals ein Richtungsset."
              )}
        </p>
      </section>

      <fieldset className={styles.group}>
        <legend>{t("Pflanze und Umgebung")}</legend>
        <p className={styles.groupIntro}>
          {t(
            "Lege Art, Standort und große Silhouette fest, bevor anatomische Details und Bewuchs folgen."
          )}
        </p>
        <div className={styles.fieldGrid}>
          <PlantTypeField form={form} plantType={plantType} subtype={subtype} />
          <TextField
            form={form}
            notifyProgrammaticChange={notifyProgrammaticChange}
            name="natureSpecies"
            label={t("Art / Spezies")}
            help={t(
              "Konkrete botanische oder frei erfundene Art, ohne bestehende Marken- oder Werkbezüge."
            )}
            maxLength={200}
          />
          <TextField
            form={form}
            notifyProgrammaticChange={notifyProgrammaticChange}
            name="natureDescription"
            label={t("Kurze Naturbeschreibung")}
            help={t(
              "Fasse Motiv, Alterswirkung und wichtigste Erkennungsmerkmale zusammen."
            )}
            maxLength={4000}
            multiline
            wide
          />
          <SelectField
            form={form}
            name="natureClimate"
            label={t("Klimazone")}
            help={t("Standortklima für Form, Farbe und Bewuchs.")}
            options={CLIMATE_OPTIONS}
          />
          <SelectField
            form={form}
            name="natureSeason"
            label={t("Jahreszeit")}
            help={t("Saisonale Farb- und Wachstumswirkung.")}
            options={SEASON_OPTIONS}
          />
          <SelectField
            form={form}
            name="natureAge"
            label={t("Alter / Entwicklungsstand")}
            help={t("Jung, ausgewachsen, uralt oder abgestorben.")}
            options={AGE_OPTIONS}
          />
          <SelectField
            form={form}
            name="natureSilhouette"
            label={t("Gesamtsilhouette")}
            help={t(
              "Die Form muss in nativer Spielgröße eindeutig lesbar bleiben."
            )}
            options={SILHOUETTE_OPTIONS}
          />
        </div>
      </fieldset>

      {natureSubtypeHasTrunk(subtype) ? (
        <fieldset className={styles.group}>
          <legend>{t("Stamm und Rinde")}</legend>
          <p className={styles.groupIntro}>
            {t(
              "Stammform und große Rindencluster bestimmen Stabilität und Alter des Baumassets."
            )}
          </p>
          <div className={styles.fieldGrid}>
            <SelectField
              form={form}
              name="natureTrunkThickness"
              label={t("Stammdicke")}
              help={t("Relative Dicke des tragenden Stamms.")}
              options={TRUNK_THICKNESS_OPTIONS}
            />
            <SelectField
              form={form}
              name="natureTrunkShape"
              label={t("Stammform")}
              help={t("Große Form des Stamms ohne kleinteiliges Rauschen.")}
              options={TRUNK_SHAPE_OPTIONS}
            />
            <TextField
              form={form}
              notifyProgrammaticChange={notifyProgrammaticChange}
              name="natureTrunkDetails"
              label={t("Rinde, Verzweigung und Hohlräume")}
              help={t(
                "Beschreibe lesbare Rindenstruktur, Astansätze, Brüche oder Hohlräume."
              )}
              maxLength={500}
              multiline
              wide
            />
          </div>
        </fieldset>
      ) : null}

      {natureSubtypeHasCrown(subtype) ? (
        <fieldset className={styles.group}>
          <legend>{t("Krone und Blattmasse")}</legend>
          <p className={styles.groupIntro}>
            {t(
              "Die Krone wird als klare Clusterstruktur statt als ungeordnetes Einzelblatt-Rauschen definiert."
            )}
          </p>
          <div className={styles.fieldGrid}>
            <SelectField
              form={form}
              name="natureCrownShape"
              label={t("Kronenform")}
              help={t("Große Außenform der Krone.")}
              options={CROWN_SHAPE_OPTIONS}
            />
            <SelectField
              form={form}
              name="natureCrownDensity"
              label={t("Kronendichte")}
              help={t("Dichte und Durchlässigkeit der Blatt- oder Nadelmasse.")}
              options={CROWN_DENSITY_OPTIONS}
            />
            <TextField
              form={form}
              notifyProgrammaticChange={notifyProgrammaticChange}
              name="natureFoliageDetails"
              label={t("Blätter, Nadeln und Cluster")}
              help={t(
                "Beschreibe Clustergröße, Dichte, Schichtung und kontrollierte Farbvariation."
              )}
              maxLength={500}
              multiline
              wide
            />
          </div>
        </fieldset>
      ) : null}

      {natureSubtypeHasRoots(subtype) ? (
        <fieldset className={styles.group}>
          <legend>{t("Wurzeln und Fußpunkt")}</legend>
          <p className={styles.groupIntro}>
            {t(
              "Wurzeln und Fußpunkt verankern das Asset eindeutig auf seiner Standfläche."
            )}
          </p>
          <div className={styles.fieldGrid}>
            <SelectField
              form={form}
              name="natureRootVisibility"
              label={t("Wurzelsichtbarkeit")}
              help={t(
                "Verborgen, sichtbar, ausladend, felsumgreifend oder freigelegt."
              )}
              options={ROOT_VISIBILITY_OPTIONS}
            />
            <TextField
              form={form}
              notifyProgrammaticChange={notifyProgrammaticChange}
              name="natureRootDetails"
              label={t("Wurzelform und Verlauf")}
              help={t(
                "Beschreibe Richtung, Ausladung und Kontakt mit Boden oder Fels."
              )}
              maxLength={500}
              multiline
            />
          </div>
        </fieldset>
      ) : null}

      <fieldset className={styles.group}>
        <legend>{t("Bewuchs und Wetterauflage")}</legend>
        <p className={styles.groupIntro}>
          {t(
            "Zusatzbewuchs und Schnee werden als kontrollierte, silhouette-treue Auflagen behandelt."
          )}
        </p>
        <div className={styles.fieldGrid}>
          <SelectField
            form={form}
            name="natureMossCoverage"
            label={t("Moosbewuchs")}
            help={t("Stärke des Moosbewuchses auf den sichtbaren Flächen.")}
            options={MOSS_COVERAGE_OPTIONS}
          />
          <SelectField
            form={form}
            name="natureMushroomGrowth"
            label={t("Pilzbewuchs")}
            help={t("Anzahl und Gruppierung zusätzlicher Pilze.")}
            options={MUSHROOM_GROWTH_OPTIONS}
          />
          <SelectField
            form={form}
            name="natureSnowCover"
            label={t("Schneebedeckung")}
            help={t("Menge und Verteilung der sichtbaren Schneeauflage.")}
            options={SNOW_COVER_OPTIONS}
          />
          <SelectField
            form={form}
            name="natureVineGrowth"
            label={t("Rankenbewuchs")}
            help={t("Leichte, herabhängende oder dicht verflochtene Ranken.")}
            options={VINE_GROWTH_OPTIONS}
          />
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend>{t("Standfläche und Varianten")}</legend>
        <p className={styles.groupIntro}>
          {t(
            "Breite und Tiefe bilden gemeinsam den optionalen Footprint. Ein einzelner Wert ist unvollständig und muss vor dem Weitergehen ergänzt oder geleert werden."
          )}
        </p>
        <div className={styles.fieldGrid}>
          <NumberField
            form={form}
            name="natureFootprintWidthTiles"
            label={t("Standfläche · Breite in Tiles")}
            help={t(
              "Ganzzahlig von 1 bis 64; nur gemeinsam mit der Tiefe gültig."
            )}
            min={1}
            max={64}
          />
          <NumberField
            form={form}
            name="natureFootprintDepthTiles"
            label={t("Standfläche · Tiefe in Tiles")}
            help={t(
              "Ganzzahlig von 1 bis 64; nur gemeinsam mit der Breite gültig."
            )}
            min={1}
            max={64}
          />
          <SelectField
            form={form}
            name="natureGrounding"
            label={t("Bodenanschluss")}
            help={t(
              "Beschreibt den sichtbaren Anschluss an Boden, Fels, Schnee oder Sumpf."
            )}
            options={GROUNDING_OPTIONS}
          />
          <NumberField
            form={form}
            name="natureVariantCount"
            label={t("Verwandte Varianten")}
            help={t("Ein bis zwölf zusammengehörige Silhouetten.")}
            min={1}
            max={12}
          />
          <TileSizeField {...(tileSize === undefined ? {} : { tileSize })} />
        </div>
        {footprintIsPartial ? (
          <p
            className={styles.footprintWarning}
            role="status"
            aria-label={t("Footprint-Hinweis")}
          >
            {t(
              "Der Footprint ist unvollständig. Ergänze Breite und Tiefe gemeinsam oder leere beide Werte."
            )}
          </p>
        ) : null}
      </fieldset>

      <fieldset className={styles.group}>
        <legend>{t("Weitere Naturdetails")}</legend>
        <div className={styles.fieldGrid}>
          <TextField
            form={form}
            notifyProgrammaticChange={notifyProgrammaticChange}
            name="natureExtraDetails"
            label={t("Weitere Naturdetails")}
            help={t(
              "Optionale Ergänzungen zu Farbe, Flechten, Frost, Nässe, Staub oder magischen Merkmalen."
            )}
            maxLength={4000}
            multiline
            wide
          />
        </div>
      </fieldset>
    </div>
  );
}
