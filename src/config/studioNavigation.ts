import {
  type StudioRoute
} from "../domain/navigation";
import { BRAND } from "./brand";

export const STUDIO_MODULE_IDS = Object.freeze([
  "prompt",
  "animation"
] as const);

export type StudioModuleId = (typeof STUDIO_MODULE_IDS)[number];

export interface StudioModuleDefinition {
  readonly id: StudioModuleId;
  readonly productName: string;
  readonly shortLabel: string;
  readonly defaultRoute: StudioRoute;
}

export const STUDIO_MODULE_DEFINITIONS = Object.freeze({
  prompt: Object.freeze({
    id: "prompt",
    productName: BRAND.modules.prompt.productName,
    shortLabel: BRAND.modules.prompt.shortLabel,
    defaultRoute: Object.freeze({
      studio: "prompt",
      view: "dashboard"
    })
  }),
  animation: Object.freeze({
    id: "animation",
    productName: BRAND.modules.animation.productName,
    shortLabel: BRAND.modules.animation.shortLabel,
    defaultRoute: Object.freeze({
      studio: "animation",
      view: "projects"
    })
  })
}) satisfies Readonly<Record<StudioModuleId, StudioModuleDefinition>>;

export function studioModuleIdOf(
  route: StudioRoute
): StudioModuleId | null {
  return route.studio === "home" ? null : route.studio;
}

export function routeForStudioModule(
  moduleId: StudioModuleId,
  activeRoute: StudioRoute
): StudioRoute {
  return activeRoute.studio === moduleId
    ? activeRoute
    : STUDIO_MODULE_DEFINITIONS[moduleId].defaultRoute;
}
