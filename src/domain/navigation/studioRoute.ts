import { StableIdSchema, type StableId } from "../../schemas/common.schema";

export const STUDIO_IDS = Object.freeze([
  "home",
  "prompt",
  "animation"
] as const);

export const PROMPT_STUDIO_VIEW_IDS = Object.freeze([
  "dashboard",
  "profiles",
  "wizard",
  "output",
  "settings"
] as const);

const LEGACY_REVIEW_VIEW = "review";

export const ANIMATION_STUDIO_VIEW_IDS = Object.freeze([
  "projects",
  "workspace",
  "library",
  "rigs"
] as const);

export const STUDIO_QUERY_PARAMETER = "studio";
export const VIEW_QUERY_PARAMETER = "view";
export const PROJECT_QUERY_PARAMETER = "project";

export const STUDIO_ROUTE_QUERY_PARAMETERS = Object.freeze([
  STUDIO_QUERY_PARAMETER,
  VIEW_QUERY_PARAMETER,
  PROJECT_QUERY_PARAMETER
] as const);

export type StudioId = (typeof STUDIO_IDS)[number];
export type PromptStudioView = (typeof PROMPT_STUDIO_VIEW_IDS)[number];
export type AnimationStudioView = (typeof ANIMATION_STUDIO_VIEW_IDS)[number];
export type StudioRouteQueryParameter =
  (typeof STUDIO_ROUTE_QUERY_PARAMETERS)[number];

export type PromptStudioRoute = Readonly<{
  studio: "prompt";
  view: PromptStudioView;
}>;

export type AnimationStudioRoute =
  | Readonly<{
      studio: "animation";
      view: "workspace";
      projectId?: StableId;
    }>
  | Readonly<{
      studio: "animation";
      view: Exclude<AnimationStudioView, "workspace">;
    }>;

export type StudioRoute =
  | Readonly<{ studio: "home" }>
  | PromptStudioRoute
  | AnimationStudioRoute;

export type StudioRouteInvalidReason =
  | "duplicateParameter"
  | "unknownStudio"
  | "missingView"
  | "unexpectedView"
  | "unknownView"
  | "unexpectedProject"
  | "invalidProjectId";

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

const studioIds = new Set<string>(STUDIO_IDS);
const promptStudioViewIds = new Set<string>(PROMPT_STUDIO_VIEW_IDS);
const animationStudioViewIds = new Set<string>(ANIMATION_STUDIO_VIEW_IDS);
const controlledParameters = new Set<string>(STUDIO_ROUTE_QUERY_PARAMETERS);

export function isStudioId(value: unknown): value is StudioId {
  return typeof value === "string" && studioIds.has(value);
}

export function isPromptStudioView(value: unknown): value is PromptStudioView {
  return typeof value === "string" && promptStudioViewIds.has(value);
}

export function isAnimationStudioView(
  value: unknown
): value is AnimationStudioView {
  return typeof value === "string" && animationStudioViewIds.has(value);
}

export function createPromptStudioRoute(
  view: PromptStudioView
): PromptStudioRoute {
  return { studio: "prompt", view };
}

export function promptStudioViewOf(
  route: StudioRoute
): PromptStudioView | null {
  return route.studio === "prompt" ? route.view : null;
}

export function studioRoutesEqual(
  left: StudioRoute,
  right: StudioRoute
): boolean {
  if (left.studio !== right.studio) return false;
  if (left.studio === "home" && right.studio === "home") return true;
  if (left.studio === "prompt" && right.studio === "prompt") {
    return left.view === right.view;
  }
  if (left.studio === "animation" && right.studio === "animation") {
    if (left.view !== right.view) return false;
    if (left.view !== "workspace" || right.view !== "workspace") return true;
    return left.projectId === right.projectId;
  }
  return false;
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

  if (studioValue === null) {
    if (viewValue === null) {
      if (projectValue === null) return { status: "missing" };
      return {
        status: "invalid",
        reason: "unexpectedProject",
        parameter: PROJECT_QUERY_PARAMETER,
        value: projectValue
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
    if (projectValue !== null) {
      return {
        status: "invalid",
        reason: "unexpectedProject",
        parameter: PROJECT_QUERY_PARAMETER,
        value: projectValue
      };
    }
    return {
      status: "legacy",
      route: createPromptStudioRoute(
        viewValue === LEGACY_REVIEW_VIEW ? "output" : viewValue
      )
    };
  }

  if (!isStudioId(studioValue)) {
    return {
      status: "invalid",
      reason: "unknownStudio",
      parameter: STUDIO_QUERY_PARAMETER,
      value: studioValue
    };
  }

  if (studioValue === "home") {
    if (viewValue !== null) {
      return {
        status: "invalid",
        reason: "unexpectedView",
        parameter: VIEW_QUERY_PARAMETER,
        value: viewValue
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
    return { status: "valid", route: { studio: "home" } };
  }

  if (viewValue === null) {
    return {
      status: "invalid",
      reason: "missingView",
      parameter: VIEW_QUERY_PARAMETER
    };
  }

  if (studioValue === "prompt") {
    if (viewValue !== LEGACY_REVIEW_VIEW && !isPromptStudioView(viewValue)) {
      return {
        status: "invalid",
        reason: "unknownView",
        parameter: VIEW_QUERY_PARAMETER,
        value: viewValue
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
    return {
      status: viewValue === LEGACY_REVIEW_VIEW ? "legacy" : "valid",
      route: createPromptStudioRoute(
        viewValue === LEGACY_REVIEW_VIEW ? "output" : viewValue
      )
    };
  }

  if (!isAnimationStudioView(viewValue)) {
    return {
      status: "invalid",
      reason: "unknownView",
      parameter: VIEW_QUERY_PARAMETER,
      value: viewValue
    };
  }
  if (viewValue !== "workspace") {
    if (projectValue !== null) {
      return {
        status: "invalid",
        reason: "unexpectedProject",
        parameter: PROJECT_QUERY_PARAMETER,
        value: projectValue
      };
    }
    return {
      status: "valid",
      route: { studio: "animation", view: viewValue }
    };
  }
  if (projectValue === null) {
    return {
      status: "valid",
      route: { studio: "animation", view: "workspace" }
    };
  }

  const projectId = StableIdSchema.safeParse(projectValue);
  if (!projectId.success) {
    return {
      status: "invalid",
      reason: "invalidProjectId",
      parameter: PROJECT_QUERY_PARAMETER,
      value: projectValue
    };
  }
  return {
    status: "valid",
    route: {
      studio: "animation",
      view: "workspace",
      projectId: projectId.data
    }
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
  parameters.set(STUDIO_QUERY_PARAMETER, route.studio);
  if (route.studio !== "home") {
    parameters.set(VIEW_QUERY_PARAMETER, route.view);
  }
  if (
    route.studio === "animation" &&
    route.view === "workspace" &&
    route.projectId !== undefined
  ) {
    const projectId = StableIdSchema.safeParse(route.projectId);
    if (!projectId.success) {
      throw new TypeError("Cannot serialize an invalid animation project ID.");
    }
    parameters.set(PROJECT_QUERY_PARAMETER, projectId.data);
  }

  for (const [parameter, value] of currentParameters) {
    if (!controlledParameters.has(parameter)) {
      parameters.append(parameter, value);
    }
  }
  return `?${parameters.toString()}`;
}
