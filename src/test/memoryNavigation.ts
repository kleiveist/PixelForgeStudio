import {
  createAppViewSearch,
  type AppView,
  type NavigationRoute
} from "../domain/navigation";
import type { NavigationAdapter } from "../services";

export class MemoryNavigation implements NavigationAdapter {
  readonly pushedViews: AppView[] = [];
  readonly replacedViews: AppView[] = [];
  private readonly listeners = new Set<() => void>();
  private route: NavigationRoute;

  constructor(initialRoute: NavigationRoute = { status: "missing" }) {
    this.route = initialRoute;
  }

  readonly readRoute = (): NavigationRoute => this.route;

  readonly hrefFor = (view: AppView): string => createAppViewSearch(view);

  readonly pushView = (view: AppView): void => {
    this.pushedViews.push(view);
    this.route = { status: "valid", view };
  };

  readonly replaceView = (view: AppView): void => {
    this.replacedViews.push(view);
    this.route = { status: "valid", view };
  };

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  emitRoute(route: NavigationRoute): void {
    this.route = route;
    for (const listener of this.listeners) listener();
  }

  activeListenerCount(): number {
    return this.listeners.size;
  }
}
