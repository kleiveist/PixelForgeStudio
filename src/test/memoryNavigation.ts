import {
  createPromptStudioRoute,
  serializeStudioRoute,
  type AppView,
  type NavigationRoute,
  type StudioRoute,
  type StudioRouteParseResult
} from "../domain/navigation";
import type { NavigationAdapter } from "../services";

type MemoryNavigationInput = NavigationRoute | StudioRouteParseResult;

function normalizeResult(
  result: MemoryNavigationInput
): StudioRouteParseResult {
  if (result.status === "valid" && "view" in result) {
    return {
      status: "valid",
      route: createPromptStudioRoute(result.view)
    };
  }
  if (result.status === "invalid" && !("reason" in result)) {
    return {
      status: "invalid",
      reason: "unknownView",
      parameter: "view",
      value: result.value
    };
  }
  return result;
}

export class MemoryNavigation implements NavigationAdapter {
  readonly pushedRoutes: StudioRoute[] = [];
  readonly replacedRoutes: StudioRoute[] = [];
  /** @deprecated Prompt-view projection retained for existing feature tests. */
  readonly pushedViews: AppView[] = [];
  /** @deprecated Prompt-view projection retained for existing feature tests. */
  readonly replacedViews: AppView[] = [];
  private readonly listeners = new Set<() => void>();
  private result: StudioRouteParseResult;

  constructor(initialRoute: MemoryNavigationInput = { status: "missing" }) {
    this.result = normalizeResult(initialRoute);
  }

  readonly readRoute = (): StudioRouteParseResult => this.result;

  readonly hrefForRoute = (route: StudioRoute): string =>
    serializeStudioRoute(route);

  readonly pushRoute = (route: StudioRoute): void => {
    this.pushedRoutes.push(route);
    if (route.studio === "prompt") this.pushedViews.push(route.view);
    this.result = { status: "valid", route };
  };

  readonly replaceRoute = (route: StudioRoute): void => {
    this.replacedRoutes.push(route);
    if (route.studio === "prompt") this.replacedViews.push(route.view);
    this.result = { status: "valid", route };
  };

  /** @deprecated Use `hrefForRoute`. */
  readonly hrefFor = (view: AppView): string =>
    this.hrefForRoute(createPromptStudioRoute(view));

  /** @deprecated Use `pushRoute`. */
  readonly pushView = (view: AppView): void => {
    this.pushRoute(createPromptStudioRoute(view));
  };

  /** @deprecated Use `replaceRoute`. */
  readonly replaceView = (view: AppView): void => {
    this.replaceRoute(createPromptStudioRoute(view));
  };

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  emitRoute(route: MemoryNavigationInput): void {
    this.result = normalizeResult(route);
    for (const listener of this.listeners) listener();
  }

  activeListenerCount(): number {
    return this.listeners.size;
  }
}
