import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StableIdSchema } from "../../schemas";
import { MemoryNavigation } from "../../test/memoryNavigation";
import { NavigationProvider, useNavigation } from "./NavigationProvider";

function RouteProbe() {
  const {
    activeRoute,
    activeView,
    hrefForRoute,
    navigateTo
  } = useNavigation();

  return (
    <>
      <output data-testid="active-route">{JSON.stringify(activeRoute)}</output>
      <output data-testid="prompt-view">{activeView}</output>
      <a href={hrefForRoute({ studio: "home" })}>Home route</a>
      <button
        type="button"
        onClick={() => navigateTo({ studio: "animation", view: "projects" })}
      >
        Animation projects
      </button>
    </>
  );
}

function renderProvider(
  navigation: MemoryNavigation,
  fallbackView: "dashboard" | "profiles" = "dashboard",
  confirmNavigation?: (
    nextRoute: Parameters<MemoryNavigation["pushRoute"]>[0],
    currentRoute: Parameters<MemoryNavigation["pushRoute"]>[0]
  ) => boolean
) {
  return render(
    <NavigationProvider
      fallbackView={fallbackView}
      navigationAdapter={navigation}
      {...(confirmNavigation ? { confirmNavigation } : {})}
    >
      <RouteProbe />
    </NavigationProvider>
  );
}

describe("studio navigation provider", () => {
  it("keeps a valid roof route as the canonical provider state", () => {
    const navigation = new MemoryNavigation({
      status: "valid",
      route: { studio: "home" }
    });

    renderProvider(navigation, "profiles");

    expect(screen.getByTestId("active-route")).toHaveTextContent(
      '{"studio":"home"}'
    );
    expect(screen.getByTestId("prompt-view")).toHaveTextContent("profiles");
    expect(screen.getByRole("link", { name: "Home route" })).toHaveAttribute(
      "href",
      "?studio=home"
    );
    expect(navigation.replacedRoutes).toEqual([]);
  });

  it("uses and canonicalizes the injected fallback for a missing route", () => {
    const navigation = new MemoryNavigation({ status: "missing" });

    renderProvider(navigation, "profiles");

    expect(screen.getByTestId("active-route")).toHaveTextContent(
      '{"studio":"prompt","view":"profiles"}'
    );
    expect(navigation.replacedRoutes).toEqual([
      { studio: "prompt", view: "profiles" }
    ]);
    expect(navigation.pushedRoutes).toEqual([]);
  });

  it("canonicalizes a parsed legacy Prompt route without pushing history", () => {
    const navigation = new MemoryNavigation({
      status: "legacy",
      route: { studio: "prompt", view: "wizard" }
    });

    renderProvider(navigation);

    expect(screen.getByTestId("active-route")).toHaveTextContent(
      '{"studio":"prompt","view":"wizard"}'
    );
    expect(navigation.replacedRoutes).toEqual([
      { studio: "prompt", view: "wizard" }
    ]);
    expect(navigation.pushedRoutes).toEqual([]);
  });

  it("keeps popstate and explicit route navigation synchronized", async () => {
    const user = userEvent.setup();
    const navigation = new MemoryNavigation({
      status: "valid",
      route: { studio: "home" }
    });
    const projectId = StableIdSchema.parse("project_navigation_01");
    renderProvider(navigation);

    act(() => {
      navigation.emitRoute({
        status: "valid",
        route: {
          studio: "animation",
          view: "workspace",
          projectId
        }
      });
    });
    expect(screen.getByTestId("active-route")).toHaveTextContent(
      `{"studio":"animation","view":"workspace","projectId":"${projectId}"}`
    );
    expect(navigation.pushedRoutes).toEqual([]);
    expect(navigation.replacedRoutes).toEqual([]);

    await user.click(
      screen.getByRole("button", { name: "Animation projects" })
    );
    await user.click(
      screen.getByRole("button", { name: "Animation projects" })
    );
    expect(screen.getByTestId("active-route")).toHaveTextContent(
      '{"studio":"animation","view":"projects"}'
    );
    expect(navigation.pushedRoutes).toEqual([
      { studio: "animation", view: "projects" }
    ]);
  });

  it("keeps the current route when a navigation guard rejects links or history changes", async () => {
    const user = userEvent.setup();
    const navigation = new MemoryNavigation({
      status: "valid",
      route: { studio: "home" }
    });
    const confirmNavigation = vi.fn(() => false);
    renderProvider(navigation, "dashboard", confirmNavigation);

    await user.click(
      screen.getByRole("button", { name: "Animation projects" })
    );
    expect(screen.getByTestId("active-route")).toHaveTextContent(
      '{"studio":"home"}'
    );
    expect(navigation.pushedRoutes).toEqual([]);
    expect(confirmNavigation).toHaveBeenCalledWith(
      { studio: "animation", view: "projects" },
      { studio: "home" }
    );

    act(() => {
      navigation.emitRoute({
        status: "valid",
        route: { studio: "prompt", view: "profiles" }
      });
    });
    expect(screen.getByTestId("active-route")).toHaveTextContent(
      '{"studio":"home"}'
    );
    expect(navigation.replacedRoutes).toEqual([{ studio: "home" }]);
  });
});
