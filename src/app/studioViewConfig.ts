import { BRAND } from "../config";
import type {
  AnimationStudioView,
  StudioRoute
} from "../domain/navigation";
import { PROMPT_STUDIO_VIEW_DEFINITIONS } from "./appViewConfig";

export interface StudioPlaceholderViewDefinition {
  readonly label: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly nextStep: string;
}

export const ANIMATION_STUDIO_VIEW_DEFINITIONS: Readonly<
  Record<AnimationStudioView, StudioPlaceholderViewDefinition>
> = Object.freeze({
  projects: Object.freeze({
    label: "Projekte",
    title: "Animationsprojekte übersichtlich vorbereiten.",
    eyebrow: "Animation Studio",
    description:
      "Die lokale Projektverwaltung wird in einer eigenen Umsetzungsphase ergänzt.",
    nextStep: "Bis dahin bleibt diese Fläche ein klar gekennzeichneter Einstieg."
  }),
  workspace: Object.freeze({
    label: "Workspace",
    title: "Kein Animationsprojekt geöffnet.",
    eyebrow: "Animation Workspace",
    description:
      "Lege später ein Projekt an oder öffne eines aus der Projektübersicht, bevor du Figuren riggst.",
    nextStep: "Der Workspace zeigt ohne Projekt bewusst keinen leeren Editor."
  }),
  library: Object.freeze({
    label: "Character Kits",
    title: "Wiederverwendbare Character Kits folgen.",
    eyebrow: "Kit-Bibliothek",
    description:
      "Körperteile und Ausrüstung erhalten hier später ihre lokale Bibliothek.",
    nextStep: "Es werden noch keine erfundenen Kits oder Projektdaten angezeigt."
  }),
  rigs: Object.freeze({
    label: "Rig-Vorlagen",
    title: "Rig-Vorlagen werden vorbereitet.",
    eyebrow: "Rig-Bibliothek",
    description:
      "Versionierte Vorlagen werden hier erst mit der Animationsdomain verfügbar.",
    nextStep: "Die derzeitige Ansicht verändert keine Prompt- oder Animationsdaten."
  })
});

export const STUDIO_HOME_PLACEHOLDER = Object.freeze({
  title: BRAND.productName,
  eyebrow: "Studio-Startseite",
  description:
    "Wähle im globalen Studio-Umschalter die Prompt-Produktion oder den vorbereiteten Animationsbereich.",
  nextStep:
    "Die produktive Startübersicht mit Zusammenfassungen folgt als eigener nächster Schritt."
});

export function studioRouteTitle(route: StudioRoute): string {
  if (route.studio === "home") return BRAND.productName;
  if (route.studio === "prompt") {
    return `${PROMPT_STUDIO_VIEW_DEFINITIONS[route.view].label} · ${BRAND.modules.prompt.shortLabel} · ${BRAND.shortName}`;
  }
  return `${ANIMATION_STUDIO_VIEW_DEFINITIONS[route.view].label} · ${BRAND.modules.animation.shortLabel} · ${BRAND.shortName}`;
}

export function studioRouteHeadingId(route: StudioRoute): string {
  if (route.studio === "home") return "studio-home-title";
  if (route.studio === "prompt") return `${route.view}-view-title`;
  return `animation-${route.view}-view-title`;
}

export function studioRouteContextLabel(route: StudioRoute): string {
  if (route.studio === "home") return "Studio-Startseite";
  return route.studio === "prompt"
    ? BRAND.modules.prompt.productName
    : BRAND.modules.animation.productName;
}
