import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBrowserNavigationAdapter } from "./navigationAdapter";

const testPath = "/studio/index.html";

describe("browser navigation adapter", () => {
  beforeEach(() => {
    window.history.replaceState(
      { source: "test" },
      "",
      `${testPath}?project=forest&view=dashboard#main-content`
    );
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("reads views and builds same-document links without losing other parameters", () => {
    const adapter = createBrowserNavigationAdapter(window);

    expect(adapter.readRoute()).toEqual({
      status: "valid",
      view: "dashboard"
    });
    expect(adapter.hrefFor("profiles")).toBe(
      `${testPath}?project=forest&view=profiles`
    );
  });

  it("pushes user navigation, replaces canonical fallbacks, and clears fragments", () => {
    const adapter = createBrowserNavigationAdapter(window);

    adapter.pushView("wizard");
    expect(window.location.pathname).toBe(testPath);
    expect(window.location.search).toBe("?project=forest&view=wizard");
    expect(window.location.hash).toBe("");
    expect(window.history.state).toBeNull();

    window.history.replaceState(
      { keep: true },
      "",
      `${testPath}?project=forest&view=unknown`
    );
    adapter.replaceView("settings");
    expect(window.location.search).toBe("?project=forest&view=settings");
    expect(window.history.state).toEqual({ keep: true });
  });

  it("subscribes only to browser traversal and cleans up with the same listener", () => {
    const adapter = createBrowserNavigationAdapter(window);
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);

    adapter.pushView("profiles");
    expect(listener).not.toHaveBeenCalled();

    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(adapter.readRoute()).toEqual({ status: "valid", view: "profiles" });

    unsubscribe();
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
