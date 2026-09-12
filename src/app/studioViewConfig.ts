import { BRAND } from "../config";
import type { StudioRoute } from "../domain/navigation";
import { PROMPT_STUDIO_VIEW_DEFINITIONS } from "./appViewConfig";

export function studioRouteTitle(route: StudioRoute): string {
  return `${PROMPT_STUDIO_VIEW_DEFINITIONS[route.view].label} · ${BRAND.productName}`;
}

export function studioRouteHeadingId(route: StudioRoute): string {
  return `${route.view}-view-title`;
}

export function studioRouteContextLabel(_route: StudioRoute): string {
  return BRAND.productName;
}
