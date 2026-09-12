import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryNavigation } from "../../test/memoryNavigation";
import { NavigationProvider, useNavigation } from "./NavigationProvider";

function RouteProbe() {
  const { activeRoute, activeView, hrefForRoute, navigateTo } = useNavigation();

  return (
    <>
      <output data-testid="active-route">{JSON.stringify(activeRoute)}</output>
      <output data-testid="prompt-view">{activeView}</output>
      <a href={hrefForRoute({ studio: "prompt", view: "dashboard" })}>
        Dashboard route
      </a>
      <button
        type="button"
        onClick={() => navigateTo({ studio: "prompt", view: "output" })}
      >
        Prompt output
      </button>
    </>
  );
}

function renderProvider(
  navigation: MemoryNavigation,
  fallbackView: "dashboard" | "profiles" = "dashboard",
  confirmNavigation?: Parameters<
    typeof NavigationProvider
  >[0]["confirmNavigation"]
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

describe("Prompt navigation provider", () => {
  it("keeps a valid Prompt route as provider state", () => {
    const navigation = new MemoryNavigation({
      status: "valid",
      route: { studio: "prompt", view: "dashboard" }
    });

    renderProvider(navigation, "profiles");

    expect(screen.getByTestId("active-route")).toHaveTextContent(
      '{"studio":"prompt","view":"dashboard"}'
    );
    expect(screen.getByTestId("prompt-view")).toHaveTextContent("dashboard");
    expect(navigation.replacedRoutes).toEqual([]);
  });

  it("canonicalizes missing and legacy routes without pushing history", () => {
    const missing = new MemoryNavigation({ status: "missing" });
    const first = renderProvider(missing, "profiles");
    expect(missing.replacedRoutes).toEqual([
      { studio: "prompt", view: "profiles" }
    ]);
    first.unmount();

    const legacy = new MemoryNavigation({
      status: "legacy",
      route: { studio: "prompt", view: "wizard" }
    });
    renderProvider(legacy);
    expect(legacy.replacedRoutes).toEqual([
      { studio: "prompt", view: "wizard" }
    ]);
  });

  it("keeps traversal and explicit navigation synchronized", async () => {
    const user = userEvent.setup();
    const navigation = new MemoryNavigation({
      status: "valid",
      route: { studio: "prompt", view: "dashboard" }
    });
    renderProvider(navigation);

    act(() => {
      navigation.emitRoute({
        status: "valid",
        route: { studio: "prompt", view: "profiles" }
      });
    });
    expect(screen.getByTestId("prompt-view")).toHaveTextContent("profiles");
    expect(navigation.pushedRoutes).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Prompt output" }));
    await user.click(screen.getByRole("button", { name: "Prompt output" }));
    expect(screen.getByTestId("prompt-view")).toHaveTextContent("output");
    expect(navigation.pushedRoutes).toEqual([
      { studio: "prompt", view: "output" }
    ]);
  });

  it("keeps the current route when a guard rejects navigation", async () => {
    const user = userEvent.setup();
    const navigation = new MemoryNavigation({
      status: "valid",
      route: { studio: "prompt", view: "dashboard" }
    });
    const confirmNavigation = vi.fn(() => false);
    renderProvider(navigation, "dashboard", confirmNavigation);

    await user.click(screen.getByRole("button", { name: "Prompt output" }));
    expect(screen.getByTestId("prompt-view")).toHaveTextContent("dashboard");
    expect(navigation.pushedRoutes).toEqual([]);

    act(() => {
      navigation.emitRoute({
        status: "valid",
        route: { studio: "prompt", view: "profiles" }
      });
    });
    expect(screen.getByTestId("prompt-view")).toHaveTextContent("dashboard");
    expect(navigation.replacedRoutes).toEqual([
      { studio: "prompt", view: "dashboard" }
    ]);
  });
});
