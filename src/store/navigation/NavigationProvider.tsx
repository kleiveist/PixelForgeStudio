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
import type { AppView } from "../../domain/navigation";
import type { NavigationAdapter } from "../../services";
import {
  createNavigationState,
  navigationReducer,
  resolveInitialView
} from "./navigationState";

export interface NavigationContextValue {
  readonly activeView: AppView;
  readonly hrefFor: (view: AppView) => string;
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
  const [initialState] = useState(() =>
    createNavigationState(navigationAdapter.readRoute(), fallbackView)
  );
  const [state, dispatch] = useReducer(navigationReducer, initialState);
  const activeViewRef = useRef(state.activeView);

  activeViewRef.current = state.activeView;

  useEffect(() => {
    const synchronizeWithLocation = () => {
      const route = navigationAdapter.readRoute();
      const view = resolveInitialView(route, fallbackView);

      if (route.status !== "valid") {
        navigationAdapter.replaceView(view);
      }

      activeViewRef.current = view;
      dispatch({ type: "viewChanged", view });
    };

    const unsubscribe = navigationAdapter.subscribe(synchronizeWithLocation);
    synchronizeWithLocation();
    return unsubscribe;
  }, [fallbackView, navigationAdapter]);

  const hrefFor = useCallback(
    (view: AppView) => navigationAdapter.hrefFor(view),
    [navigationAdapter]
  );

  const navigate = useCallback(
    (view: AppView) => {
      if (view === activeViewRef.current) return;
      navigationAdapter.pushView(view);
      activeViewRef.current = view;
      dispatch({ type: "viewChanged", view });
    },
    [navigationAdapter]
  );

  const value = useMemo<NavigationContextValue>(
    () => ({ activeView: state.activeView, hrefFor, navigate }),
    [hrefFor, navigate, state.activeView]
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
