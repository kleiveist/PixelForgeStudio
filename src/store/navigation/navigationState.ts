import {
  createPromptStudioRoute,
  promptStudioViewOf,
  studioRoutesEqual,
  type PromptStudioView,
  type StudioRoute,
  type StudioRouteParseResult
} from "../../domain/navigation";

export interface NavigationState {
  readonly activeRoute: StudioRoute;
}

export type NavigationAction = Readonly<{
  type: "routeChanged";
  route: StudioRoute;
}>;

export function resolveInitialRoute(
  result: StudioRouteParseResult,
  fallbackRoute: StudioRoute
): StudioRoute {
  return result.status === "valid" || result.status === "legacy"
    ? result.route
    : fallbackRoute;
}

export function resolvePromptStudioView(
  route: StudioRoute,
  fallbackView: PromptStudioView
): PromptStudioView {
  return promptStudioViewOf(route) ?? fallbackView;
}

export function createNavigationState(
  result: StudioRouteParseResult,
  fallbackRoute: StudioRoute
): NavigationState {
  return { activeRoute: resolveInitialRoute(result, fallbackRoute) };
}

export function navigationReducer(
  state: NavigationState,
  action: NavigationAction
): NavigationState {
  if (studioRoutesEqual(action.route, state.activeRoute)) return state;
  return { activeRoute: action.route };
}

/** @deprecated Use `resolveInitialRoute` and keep the complete studio route. */
export function resolveInitialView(
  result: StudioRouteParseResult,
  fallbackView: PromptStudioView
): PromptStudioView {
  const fallbackRoute = createPromptStudioRoute(fallbackView);
  return resolvePromptStudioView(
    resolveInitialRoute(result, fallbackRoute),
    fallbackView
  );
}
