import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StableIdSchema } from "../schemas";
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

  it("reads legacy views and builds canonical same-document route links", () => {
    const adapter = createBrowserNavigationAdapter(window);

    expect(adapter.readRoute()).toEqual({
      status: "legacy",
      route: { studio: "prompt", view: "dashboard" }
    });
    expect(
      adapter.hrefForRoute({ studio: "prompt", view: "profiles" })
    ).toBe(
      `${testPath}?studio=prompt&view=profiles&mode=compact`
    );
    expect(adapter.hrefFor("profiles")).toBe(
      `${testPath}?studio=prompt&view=profiles&mode=compact`
    );
  });

  it("pushes typed routes, repairs duplicate route parameters, and clears fragments", () => {
    const adapter = createBrowserNavigationAdapter(window);
    const projectId = StableIdSchema.parse("project_forest_01");

    adapter.pushRoute({
      studio: "animation",
      view: "workspace",
      projectId
    });
    expect(window.location.pathname).toBe(testPath);
    expect(window.location.search).toBe(
      `?studio=animation&view=workspace&project=${projectId}&mode=compact`
    );
    expect(window.location.hash).toBe("");
    expect(window.history.state).toBeNull();

    window.history.replaceState(
      { keep: true },
      "",
      `${testPath}?studio=prompt&studio=animation&view=unknown&mode=wide`
    );
    expect(adapter.readRoute()).toMatchObject({
      status: "invalid",
      reason: "duplicateParameter",
      parameter: "studio"
    });
    expect(adapter.hrefForRoute({ studio: "home" })).toBe(
      `${testPath}?studio=home&mode=wide`
    );
    adapter.replaceRoute({ studio: "home" });
    expect(window.location.search).toBe("?studio=home&mode=wide");
    expect(window.history.state).toEqual({ keep: true });
  });

  it("subscribes only to browser traversal and cleans up with the same listener", () => {
    const adapter = createBrowserNavigationAdapter(window);
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);

    adapter.pushRoute({ studio: "prompt", view: "profiles" });
    expect(listener).not.toHaveBeenCalled();

    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(adapter.readRoute()).toEqual({
      status: "valid",
      route: { studio: "prompt", view: "profiles" }
    });

    unsubscribe();
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
