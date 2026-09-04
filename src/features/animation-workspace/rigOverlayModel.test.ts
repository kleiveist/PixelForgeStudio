import { describe, expect, it } from "vitest";
import { HUMANOID_80_RIG_TEMPLATE } from "../../domain/animation";
import { createRigOverlayModel } from "./rigOverlayModel";

describe("createRigOverlayModel", () => {
  it("projects the selected production direction without duplicating coordinates", () => {
    const model = createRigOverlayModel(HUMANOID_80_RIG_TEMPLATE, "south");
    expect(model).not.toBeNull();
    expect(model?.direction).toBe("south");
    expect(model?.bones).toHaveLength(20);
    expect(model?.joints).toHaveLength(21);
    expect(model?.slotLabels).toHaveLength(15);
    expect(model?.groundlineY).toBe(112);
    expect(model?.joints.find(({ id }) => id === "head")?.position).toEqual({
      x: 64,
      y: 34
    });
    expect(model?.bones.find(({ id }) => id === "neck.head")).toEqual({
      id: "neck.head",
      start: { x: 64, y: 44 },
      end: { x: 64, y: 34 }
    });
  });

  it("does not invent a western source direction", () => {
    expect(createRigOverlayModel(HUMANOID_80_RIG_TEMPLATE, "west")).toBeNull();
  });
});
