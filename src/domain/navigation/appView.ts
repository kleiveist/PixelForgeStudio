export const APP_VIEW_IDS = [
  "dashboard",
  "profiles",
  "wizard",
  "review",
  "output",
  "settings"
] as const;

export const APP_VIEW_QUERY_PARAMETER = "view";

export type AppView = (typeof APP_VIEW_IDS)[number];

export type NavigationRoute =
  | Readonly<{ status: "valid"; view: AppView }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "invalid"; value: string }>;

const appViewIds = new Set<string>(APP_VIEW_IDS);

export function isAppView(value: unknown): value is AppView {
  return typeof value === "string" && appViewIds.has(value);
}

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

export function createAppViewSearch(
  view: AppView,
  currentSearch = ""
): string {
  const parameters = new URLSearchParams(currentSearch);
  parameters.set(APP_VIEW_QUERY_PARAMETER, view);
  return `?${parameters.toString()}`;
}
