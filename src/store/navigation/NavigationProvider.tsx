import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  createPromptStudioRoute,
  studioRoutesEqual,
  type AppView,
  type StudioRoute
} from "../../domain/navigation";
import type { NavigationAdapter } from "../../services";
import {
  createNavigationState,
  navigationReducer,
  resolveInitialRoute,
  resolvePromptStudioView
} from "./navigationState";

export interface NavigationContextValue {
  readonly activeRoute: StudioRoute;
  readonly hrefForRoute: (route: StudioRoute) => string;
  readonly navigateTo: (route: StudioRoute) => void;
  /** @deprecated Prompt 30 will migrate the existing shell to `activeRoute`. */
  readonly activeView: AppView;
  /** @deprecated Use `hrefForRoute` with a typed Prompt Studio route. */
  readonly hrefFor: (view: AppView) => string;
  /** @deprecated Use `navigateTo` with a typed Prompt Studio route. */
  readonly navigate: (view: AppView) => void;
}

export interface NavigationProviderProps {
  readonly children: ReactNode;
  readonly fallbackView: AppView;
  readonly navigationAdapter: NavigationAdapter;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  children,
  fallbackView,
  navigationAdapter
}: NavigationProviderProps) {
  const fallbackRoute = useMemo(
    () => createPromptStudioRoute(fallbackView),
    [fallbackView]
  );
  const [initialState] = useState(() =>
    createNavigationState(navigationAdapter.readRoute(), fallbackRoute)
  );
  const [state, dispatch] = useReducer(navigationReducer, initialState);
  const activeRouteRef = useRef(state.activeRoute);

  activeRouteRef.current = state.activeRoute;

  useEffect(() => {
    const synchronizeWithLocation = () => {
      const result = navigationAdapter.readRoute();
      const route = resolveInitialRoute(result, fallbackRoute);

      if (result.status !== "valid") {
        navigationAdapter.replaceRoute(route);
      }

      activeRouteRef.current = route;
      dispatch({ type: "routeChanged", route });
    };

    const unsubscribe = navigationAdapter.subscribe(synchronizeWithLocation);
    synchronizeWithLocation();
    return unsubscribe;
  }, [fallbackRoute, navigationAdapter]);

  const hrefForRoute = useCallback(
    (route: StudioRoute) => navigationAdapter.hrefForRoute(route),
    [navigationAdapter]
  );

  const navigateTo = useCallback(
    (route: StudioRoute) => {
      if (studioRoutesEqual(route, activeRouteRef.current)) return;
      navigationAdapter.pushRoute(route);
      activeRouteRef.current = route;
      dispatch({ type: "routeChanged", route });
    },
    [navigationAdapter]
  );

  const hrefFor = useCallback(
    (view: AppView) => hrefForRoute(createPromptStudioRoute(view)),
    [hrefForRoute]
  );

  const navigate = useCallback(
    (view: AppView) => navigateTo(createPromptStudioRoute(view)),
    [navigateTo]
  );

  const activeView = resolvePromptStudioView(state.activeRoute, fallbackView);
  const value = useMemo<NavigationContextValue>(
    () => ({
      activeRoute: state.activeRoute,
      activeView,
      hrefFor,
      hrefForRoute,
      navigate,
      navigateTo
    }),
    [activeView, hrefFor, hrefForRoute, navigate, navigateTo, state.activeRoute]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider.");
  }
  return context;
}
