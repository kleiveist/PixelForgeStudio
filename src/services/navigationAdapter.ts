import {
  createPromptStudioRoute,
  parseStudioRouteSearch,
  serializeStudioRoute,
  type AppView,
  type StudioRoute,
  type StudioRouteParseResult
} from "../domain/navigation";

export interface NavigationAdapter {
  readonly readRoute: () => StudioRouteParseResult;
  readonly hrefForRoute: (route: StudioRoute) => string;
  readonly pushRoute: (route: StudioRoute) => void;
  readonly replaceRoute: (route: StudioRoute) => void;
  /** @deprecated Use `hrefForRoute`. */
  readonly hrefFor: (view: AppView) => string;
  /** @deprecated Use `pushRoute`. */
  readonly pushView: (view: AppView) => void;
  /** @deprecated Use `replaceRoute`. */
  readonly replaceView: (view: AppView) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

export function createBrowserNavigationAdapter(
  browserWindow: Window = window
): NavigationAdapter {
  const destinationFor = (
    route: StudioRoute,
    repairInvalidSearch = false
  ): string => {
    const currentResult = parseStudioRouteSearch(
      browserWindow.location.search
    );
    const hasDuplicateControlledParameter =
      currentResult.status === "invalid" &&
      currentResult.reason === "duplicateParameter";
    const search = serializeStudioRoute(
      route,
      browserWindow.location.search,
      repairInvalidSearch || hasDuplicateControlledParameter
        ? { duplicateControlledParameters: "discard" }
        : undefined
    );
    return `${browserWindow.location.pathname}${search}`;
  };

  return {
    readRoute: () => parseStudioRouteSearch(browserWindow.location.search),
    hrefForRoute: destinationFor,
    hrefFor: (view) => destinationFor(createPromptStudioRoute(view)),
    pushRoute: (route) => {
      browserWindow.history.pushState(null, "", destinationFor(route));
    },
    pushView: (view) => {
      browserWindow.history.pushState(
        null,
        "",
        destinationFor(createPromptStudioRoute(view))
      );
    },
    replaceRoute: (route) => {
      browserWindow.history.replaceState(
        browserWindow.history.state,
        "",
        destinationFor(route, true)
      );
    },
    replaceView: (view) => {
      browserWindow.history.replaceState(
        browserWindow.history.state,
        "",
        destinationFor(createPromptStudioRoute(view), true)
      );
    },
    subscribe: (listener) => {
      browserWindow.addEventListener("popstate", listener);
      return () => browserWindow.removeEventListener("popstate", listener);
    }
  };
}
