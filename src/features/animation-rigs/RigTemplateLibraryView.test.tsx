import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  HUMANOID_80_RIG_TEMPLATE,
  createRigCompatibilityKey
} from "../../domain/animation";
import { NavigationProvider } from "../../store/navigation";
import { MemoryNavigation } from "../../test/memoryNavigation";
import { RigTemplateLibraryView } from "./RigTemplateLibraryView";
import { createRigTemplateLibraryItem } from "./rigTemplateLibraryData";

describe("RigTemplateLibraryView", () => {
  it("projects the production template without duplicating domain constants", () => {
    expect(createRigTemplateLibraryItem(HUMANOID_80_RIG_TEMPLATE)).toEqual({
      id: "humanoid-80-v1",
      label: "Humanoid 80",
      frameLabel: "128 × 128 px",
      characterHeightLabel: "80 px",
      footAnchorLabel: "64 / 112",
      authoredDirections: ["Süd", "Südost", "Ost", "Nordost", "Nord"],
      runtimeDirectionCount: 8,
      jointCount: 21,
      boneCount: 20,
      requiredSlotCount: 15,
      compatibilityKey: createRigCompatibilityKey(HUMANOID_80_RIG_TEMPLATE)
    });
  });

  it("renders the immutable rig contract and a keyboard-reachable project action", () => {
    render(
      <NavigationProvider
        fallbackRoute={{ studio: "animation", view: "rigs" }}
        fallbackView="dashboard"
        navigationAdapter={new MemoryNavigation({
          status: "valid",
          route: { studio: "animation", view: "rigs" }
        })}
      >
        <RigTemplateLibraryView />
      </NavigationProvider>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Produktionsreife Rig-Vorlagen." })
    ).toHaveAttribute("id", "animation-rigs-view-title");
    const card = screen.getByRole("region", { name: "Humanoid 80" });
    expect(within(card).getByRole("heading", { name: "Humanoid 80" })).toBeVisible();
    expect(within(card).getByText("128 × 128 px")).toBeVisible();
    expect(within(card).getByText("21 / 20")).toBeVisible();
    expect(within(card).getByText("Production V1")).toBeVisible();
    expect(
      within(card).getByRole("link", { name: "Animationsprojekt anlegen" })
    ).toHaveAttribute("href", "?studio=animation&view=projects");
  });
});
