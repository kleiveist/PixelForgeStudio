import {
  createAppViewSearch,
  parseAppViewSearch,
  type AppView,
  type NavigationRoute
} from "../domain/navigation";

export interface NavigationAdapter {
  readonly readRoute: () => NavigationRoute;
  readonly hrefFor: (view: AppView) => string;
  readonly pushView: (view: AppView) => void;
  readonly replaceView: (view: AppView) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

export function createBrowserNavigationAdapter(
  browserWindow: Window = window
): NavigationAdapter {
  const destinationFor = (view: AppView): string => {
    const search = createAppViewSearch(view, browserWindow.location.search);
    return `${browserWindow.location.pathname}${search}`;
  };

  return {
    readRoute: () => parseAppViewSearch(browserWindow.location.search),
    hrefFor: destinationFor,
    pushView: (view) => {
      browserWindow.history.pushState(null, "", destinationFor(view));
    },
    replaceView: (view) => {
      browserWindow.history.replaceState(
        browserWindow.history.state,
        "",
        destinationFor(view)
      );
    },
    subscribe: (listener) => {
      browserWindow.addEventListener("popstate", listener);
      return () => browserWindow.removeEventListener("popstate", listener);
    }
  };
}
