import {
  PROMPT_STUDIO_VIEW_IDS,
  VIEW_QUERY_PARAMETER,
  isPromptStudioView,
  type PromptStudioView
} from "./studioRoute";

/** @deprecated Use `PROMPT_STUDIO_VIEW_IDS`. */
export const APP_VIEW_IDS = PROMPT_STUDIO_VIEW_IDS;

/** @deprecated Use `VIEW_QUERY_PARAMETER`. */
export const APP_VIEW_QUERY_PARAMETER = VIEW_QUERY_PARAMETER;

/** @deprecated Use `PromptStudioView`. */
export type AppView = PromptStudioView;

export type NavigationRoute =
  | Readonly<{ status: "valid"; view: AppView }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid"; value: string }>;

/** @deprecated Use `isPromptStudioView`. */
export function isAppView(value: unknown): value is AppView {
  return isPromptStudioView(value);
}

/**
 * @deprecated Use `parseStudioRouteSearch`. This compatibility parser retains
 * the original `?view=` result shape for existing consumers.
 */
export function parseAppViewSearch(search: string): NavigationRoute {
  const parameters = new URLSearchParams(search);
  if (!parameters.has(APP_VIEW_QUERY_PARAMETER)) {
    return { status: "missing" };
  }

  const values = parameters.getAll(APP_VIEW_QUERY_PARAMETER);
  const value = values[0] ?? "";
  if (values.length !== 1 || !isAppView(value)) {
    return { status: "invalid", value };
  }

  return { status: "valid", view: value };
}

/**
 * @deprecated Use `serializeStudioRoute`. This compatibility serializer keeps
 * the original query shape until consumers migrate to `StudioRoute`.
 */
export function createAppViewSearch(
  view: AppView,
  currentSearch = ""
): string {
  const parameters = new URLSearchParams(currentSearch);
  parameters.set(APP_VIEW_QUERY_PARAMETER, view);
  return `?${parameters.toString()}`;
}
