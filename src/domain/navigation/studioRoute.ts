export const PROMPT_STUDIO_VIEW_IDS = Object.freeze([
  "dashboard",
  "profiles",
  "wizard",
  "output",
  "settings"
] as const);

const LEGACY_REVIEW_VIEW = "review";

export const STUDIO_QUERY_PARAMETER = "studio";
export const VIEW_QUERY_PARAMETER = "view";
export const PROJECT_QUERY_PARAMETER = "project";

export const STUDIO_ROUTE_QUERY_PARAMETERS = Object.freeze([
  STUDIO_QUERY_PARAMETER,
  VIEW_QUERY_PARAMETER,
  PROJECT_QUERY_PARAMETER
] as const);

export type PromptStudioView = (typeof PROMPT_STUDIO_VIEW_IDS)[number];
export type StudioRouteQueryParameter =
  (typeof STUDIO_ROUTE_QUERY_PARAMETERS)[number];

export type PromptStudioRoute = Readonly<{
  studio: "prompt";
  view: PromptStudioView;
}>;

export type StudioRoute = PromptStudioRoute;

export type StudioRouteInvalidReason =
  | "duplicateParameter"
  | "unknownStudio"
  | "missingView"
  | "unknownView"
  | "unexpectedProject";

export type StudioRouteParseResult =
  | Readonly<{ status: "valid"; route: StudioRoute }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "legacy"; route: PromptStudioRoute }>
  | Readonly<{
      status: "invalid";
      reason: StudioRouteInvalidReason;
      parameter: StudioRouteQueryParameter;
      value?: string;
      values?: readonly string[];
    }>;

export interface StudioRouteSerializationOptions {
  readonly duplicateControlledParameters?: "reject" | "discard";
}

const promptStudioViewIds = new Set<string>(PROMPT_STUDIO_VIEW_IDS);
const controlledParameters = new Set<string>(STUDIO_ROUTE_QUERY_PARAMETERS);

export function isPromptStudioView(value: unknown): value is PromptStudioView {
  return typeof value === "string" && promptStudioViewIds.has(value);
}

export function createPromptStudioRoute(
  view: PromptStudioView
): PromptStudioRoute {
  return { studio: "prompt", view };
}

export function promptStudioViewOf(route: StudioRoute): PromptStudioView {
  return route.view;
}

export function studioRoutesEqual(
  left: StudioRoute,
  right: StudioRoute
): boolean {
  return left.view === right.view;
}

function duplicateControlledParameter(
  parameters: URLSearchParams
): StudioRouteParseResult | null {
  for (const parameter of STUDIO_ROUTE_QUERY_PARAMETERS) {
    const values = parameters.getAll(parameter);
    if (values.length > 1) {
      return {
        status: "invalid",
        reason: "duplicateParameter",
        parameter,
        values
      };
    }
  }
  return null;
}

export function parseStudioRouteSearch(
  search: string
): StudioRouteParseResult {
  const parameters = new URLSearchParams(search);
  const duplicate = duplicateControlledParameter(parameters);
  if (duplicate) return duplicate;

  const studioValue = parameters.get(STUDIO_QUERY_PARAMETER);
  const viewValue = parameters.get(VIEW_QUERY_PARAMETER);
  const projectValue = parameters.get(PROJECT_QUERY_PARAMETER);

  if (studioValue !== null && studioValue !== "prompt") {
    return {
      status: "invalid",
      reason: "unknownStudio",
      parameter: STUDIO_QUERY_PARAMETER,
      value: studioValue
    };
  }

  if (projectValue !== null) {
    return {
      status: "invalid",
      reason: "unexpectedProject",
      parameter: PROJECT_QUERY_PARAMETER,
      value: projectValue
    };
  }

  if (viewValue === null) {
    return studioValue === null
      ? { status: "missing" }
      : {
          status: "invalid",
          reason: "missingView",
          parameter: VIEW_QUERY_PARAMETER
        };
  }

  if (viewValue !== LEGACY_REVIEW_VIEW && !isPromptStudioView(viewValue)) {
    return {
      status: "invalid",
      reason: "unknownView",
      parameter: VIEW_QUERY_PARAMETER,
      value: viewValue
    };
  }

  return {
    status:
      studioValue === null || viewValue === LEGACY_REVIEW_VIEW
        ? "legacy"
        : "valid",
    route: createPromptStudioRoute(
      viewValue === LEGACY_REVIEW_VIEW ? "output" : viewValue
    )
  };
}

function assertNoDuplicateControlledParameters(
  parameters: URLSearchParams
): void {
  for (const parameter of STUDIO_ROUTE_QUERY_PARAMETERS) {
    if (parameters.getAll(parameter).length > 1) {
      throw new TypeError(
        `Cannot serialize a studio route with duplicate "${parameter}" parameters.`
      );
    }
  }
}

export function serializeStudioRoute(
  route: StudioRoute,
  currentSearch = "",
  options: StudioRouteSerializationOptions = {}
): string {
  const currentParameters = new URLSearchParams(currentSearch);
  if (options.duplicateControlledParameters !== "discard") {
    assertNoDuplicateControlledParameters(currentParameters);
  }

  const parameters = new URLSearchParams();
  parameters.set(STUDIO_QUERY_PARAMETER, "prompt");
  parameters.set(VIEW_QUERY_PARAMETER, route.view);

  for (const [parameter, value] of currentParameters) {
    if (!controlledParameters.has(parameter)) {
      parameters.append(parameter, value);
    }
  }
  return `?${parameters.toString()}`;
}
