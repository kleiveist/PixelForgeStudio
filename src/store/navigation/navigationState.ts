import type { AppView, NavigationRoute } from "../../domain/navigation";

export interface NavigationState {
  readonly activeView: AppView;
}

export type NavigationAction = Readonly<{
  type: "viewChanged";
  view: AppView;
}>;

export function resolveInitialView(
  route: NavigationRoute,
  fallbackView: AppView
): AppView {
  return route.status === "valid" ? route.view : fallbackView;
}

export function createNavigationState(
  route: NavigationRoute,
  fallbackView: AppView
): NavigationState {
  return { activeView: resolveInitialView(route, fallbackView) };
}

export function navigationReducer(
  state: NavigationState,
  action: NavigationAction
): NavigationState {
  if (action.view === state.activeView) return state;
  return { activeView: action.view };
}
