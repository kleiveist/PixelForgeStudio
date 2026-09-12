import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBrowserNavigationAdapter } from "./navigationAdapter";

const testPath = "/studio/index.html";

describe("browser navigation adapter", () => {
  beforeEach(() => {
    window.history.replaceState(
      { source: "test" },
      "",
      `${testPath}?view=dashboard&mode=compact#main-content`
    );
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("reads legacy views and builds canonical same-document links", () => {
    const adapter = createBrowserNavigationAdapter(window);

    expect(adapter.readRoute()).toEqual({
      status: "legacy",
      route: { studio: "prompt", view: "dashboard" }
    });
    expect(
      adapter.hrefForRoute({ studio: "prompt", view: "profiles" })
    ).toBe(`${testPath}?studio=prompt&view=profiles&mode=compact`);
  });

  it("pushes Prompt routes and repairs duplicate or retired parameters", () => {
    const adapter = createBrowserNavigationAdapter(window);

    adapter.pushRoute({ studio: "prompt", view: "output" });
    expect(window.location.pathname).toBe(testPath);
    expect(window.location.search).toBe(
      "?studio=prompt&view=output&mode=compact"
    );
    expect(window.location.hash).toBe("");

    window.history.replaceState(
      { keep: true },
      "",
      `${testPath}?studio=animation&studio=prompt&view=workspace&project=old&mode=wide`
    );
    expect(adapter.readRoute()).toMatchObject({
      status: "invalid",
      reason: "duplicateParameter",
      parameter: "studio"
    });
    adapter.replaceRoute({ studio: "prompt", view: "dashboard" });
    expect(window.location.search).toBe(
      "?studio=prompt&view=dashboard&mode=wide"
    );
    expect(window.history.state).toEqual({ keep: true });
  });

  it("subscribes only to browser traversal and cleans up", () => {
    const adapter = createBrowserNavigationAdapter(window);
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);

    adapter.pushRoute({ studio: "prompt", view: "profiles" });
    expect(listener).not.toHaveBeenCalled();

    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
