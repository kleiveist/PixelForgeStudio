import { BRAND } from "../config";
import type {
  AnimationStudioView,
  StudioRoute
} from "../domain/navigation";
import { PROMPT_STUDIO_VIEW_DEFINITIONS } from "./appViewConfig";

export interface StudioViewDefinition {
  readonly label: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
}

export const ANIMATION_STUDIO_VIEW_DEFINITIONS: Readonly<
  Record<AnimationStudioView, StudioViewDefinition>
> = Object.freeze({
  projects: Object.freeze({
    label: "Projekte",
    title: "Animationsprojekte organisieren.",
    eyebrow: "Animation Studio",
    description:
      "Lokale Projekte lassen sich anlegen, suchen, öffnen, umbenennen, duplizieren und kontrolliert löschen."
  }),
  workspace: Object.freeze({
    label: "Workspace",
    title: "Kein Animationsprojekt geöffnet.",
    eyebrow: "Animation Workspace",
    description:
      "Lege ein Projekt an oder öffne eines aus der Projektübersicht, bevor du Figuren riggst."
  }),
  library: Object.freeze({
    label: "Character Kits",
    title: "Figuren und Ausrüstung wiederverwenden.",
    eyebrow: "Kit-Bibliothek",
    description:
      "Lokale Character Kits teilen PartAssets sicher zwischen kompatiblen Projekten."
  }),
  rigs: Object.freeze({
    label: "Rig-Vorlagen",
    title: "Produktionsreife Rig-Vorlagen.",
    eyebrow: "Rig-Bibliothek",
    description:
      "Versionierte, validierte Vorlagen machen Frameprofil, Gelenke, Bones und Pflichtslot-Bindungen transparent."
  })
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
