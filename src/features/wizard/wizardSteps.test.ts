import { describe, expect, it } from "vitest";
import {
  WIZARD_CORE_STEPS,
  WIZARD_CHARACTER_DETAIL_FIELD_PATHS,
  WIZARD_MOVING_OBJECT_DETAIL_FIELD_PATHS,
  WizardAnimationStepSchema,
  WizardBaseProfileStepSchema,
  WizardCategoryStepSchema,
  WizardCharacterDetailsStepSchema,
  WizardDirectionStepSchema,
  WizardMovingObjectDetailsStepSchema,
  WizardProjectStepSchema,
  WizardTileabilityStepSchema,
  getWizardCoreFallbackStepId,
  getWizardCoreStep,
  getWizardCoreStepIndex
} from "./wizardSteps";

describe("wizard core steps", () => {
  const technicalValues = {
    baseProfileId: "base_world_80",
    pixelDensity: "modernHd" as const,
    styleProfile: "both" as const,
    tileSize: 32,
    characterHeight: 80,
    perspectiveType: "threeQuarter" as const,
    cameraAngle: 60 as const,
    cameraDirection: "southToNorth" as const,
    projectionType: "orthographic" as const,
    outlineStyle: "softSelective" as const,
    paletteMode: "byProfile" as const,
    backgroundMode: "transparent" as const,
    alphaPadding: 8,
    nearestNeighbor: true,
    lightingPolicy: "adaptive" as const,
    lightingNotes: "Keep world light stable."
  };

  it("declares category-first core steps and capability-owned field paths", () => {
    expect(WIZARD_CORE_STEPS.map((step) => step.id)).toEqual([
      "project",
      "category",
      "baseProfile",
      "characterDetails",
      "movingObjectDetails",
      "directions",
      "animation",
      "tileability"
    ]);
    expect(getWizardCoreStep("project").fieldPaths).toEqual(["projectName"]);
    expect(getWizardCoreStep("category").fieldPaths).toEqual(["category", "subtype"]);
    expect(getWizardCoreStep("baseProfile").fieldPaths).toEqual(
      expect.arrayContaining(["baseProfileId", "tileSize", "lightingPolicy"])
    );
    expect(getWizardCoreStep("characterDetails").fieldPaths).toBe(
      WIZARD_CHARACTER_DETAIL_FIELD_PATHS
    );
    expect(getWizardCoreStep("characterDetails")).toMatchObject({
      route: "wizard/editor",
      title: "Figur und Rolle"
    });
    expect(getWizardCoreStep("movingObjectDetails").fieldPaths).toBe(
      WIZARD_MOVING_OBJECT_DETAIL_FIELD_PATHS
    );
    expect(getWizardCoreStep("movingObjectDetails")).toMatchObject({
      route: "wizard/editor",
      title: "Objekt und Bewegung"
    });
    expect(getWizardCoreStep("directions").fieldPaths).toEqual(["directionCount"]);
    expect(getWizardCoreStep("animation").fieldPaths).toEqual([
      "animationAction",
      "animationType",
      "characterAnimationFrames",
      "movingObjectAnimationFrames"
    ]);
    expect(getWizardCoreStep("tileability").fieldPaths).toEqual([
      "seamless",
      "tileableAxes"
    ]);
    expect(getWizardCoreStepIndex("project")).toBe(0);
    expect(getWizardCoreStepIndex("category")).toBe(1);
    expect(getWizardCoreStepIndex("baseProfile")).toBe(2);
    expect(getWizardCoreStepIndex("characterDetails")).toBe(3);
    expect(getWizardCoreStepIndex("movingObjectDetails")).toBe(4);
    expect(getWizardCoreStepIndex("directions")).toBe(5);
  });

  it("declares the complete moving-object detail boundary without direction or animation fields", () => {
    expect(WIZARD_MOVING_OBJECT_DETAIL_FIELD_PATHS).toEqual([
      "movingObjectClass",
      "movingObjectPurpose",
      "movingObjectBasicShape",
      "movingObjectDescription",
      "movingObjectFootprintWidthTiles",
      "movingObjectFootprintDepthTiles",
      "movingObjectHeightPixels",
      "movingObjectAnchorMode",
      "movementType",
      "movingObjectMechanism",
      "movingObjectMaterial",
      "movingObjectMaterialDetails",
      "movingObjectCondition",
      "movingObjectLightingBehavior",
      "movingObjectShadowMode",
      "movingObjectExtraDetails"
    ]);
    expect(WIZARD_MOVING_OBJECT_DETAIL_FIELD_PATHS).not.toContain(
      "directionCount"
    );
    expect(WIZARD_MOVING_OBJECT_DETAIL_FIELD_PATHS).not.toContain(
      "movingObjectAnimationFrames"
    );
  });

  it("declares the complete Character/NPC answer paths without duplicating technical height", () => {
    expect(WIZARD_CHARACTER_DETAIL_FIELD_PATHS).toEqual([
      "role",
      "subjectDescription",
      "variantCount",
      "genderPresentation",
      "age",
      "relativeHeight",
      "bodyBuild",
      "posture",
      "faceShape",
      "skinTone",
      "eyeVisibility",
      "hair",
      "hairstyle",
      "beard",
      "hat",
      "headwearCondition",
      "scarf",
      "outerwear",
      "lowerwear",
      "clothingLayers",
      "gloves",
      "handPose",
      "shoes",
      "beltBags",
      "accessories",
      "backItem",
      "equipment",
      "materials",
      "characterPaletteSource",
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "condition",
      "expression",
      "silhouette",
      "pose",
      "professionReadable",
      "socialRole",
      "wealth",
      "culturalFunction",
      "typicalActivity",
      "conversationGesture",
      "everydayTool",
      "frontBackDetails",
      "extraDetails"
    ]);
    expect(WIZARD_CHARACTER_DETAIL_FIELD_PATHS).not.toContain("characterHeight");
    expect(WIZARD_CHARACTER_DETAIL_FIELD_PATHS).not.toContain("directionCount");
    expect(WIZARD_CHARACTER_DETAIL_FIELD_PATHS).not.toContain(
      "characterAnimationFrames"
    );
  });

  it("validates the required project name at each navigation boundary", () => {
    expect(WizardProjectStepSchema.safeParse({ projectName: "" }).success).toBe(false);
    expect(WizardCategoryStepSchema.safeParse({ projectName: "   " }).success).toBe(false);
    expect(WizardProjectStepSchema.parse({ projectName: "  Winterwald  " })).toEqual({
      projectName: "Winterwald"
    });
  });

  it("requires a category-matching subtype before capability routing", () => {
    expect(
      WizardCategoryStepSchema.safeParse({
        projectName: "Winterwald",
        category: "character"
      }).success
    ).toBe(false);
    expect(
      WizardCategoryStepSchema.safeParse({
        projectName: "Winterwald",
        category: "character",
        subtype: "wood"
      }).success
    ).toBe(false);

    const npc = {
      projectName: "Winterwald",
      category: "character" as const,
      subtype: "npc" as const,
      ...technicalValues
    };
    expect(WizardCategoryStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardBaseProfileStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardDirectionStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardAnimationStepSchema.safeParse(npc).success).toBe(true);
    expect(WizardTileabilityStepSchema.safeParse(npc).success).toBe(false);

    const wood = {
      projectName: "Holzboden",
      category: "texture" as const,
      subtype: "wood" as const,
      ...technicalValues,
      seamless: true
    };
    expect(WizardDirectionStepSchema.safeParse(wood).success).toBe(false);
    expect(WizardAnimationStepSchema.safeParse(wood).success).toBe(false);
    expect(WizardTileabilityStepSchema.safeParse(wood).success).toBe(true);

    expect(
      WizardAnimationStepSchema.safeParse({
        projectName: "Windbaum",
        category: "nature",
        subtype: "tree",
        ...technicalValues,
        animationType: "lava"
      }).success
    ).toBe(false);
    expect(
      WizardAnimationStepSchema.safeParse({
        projectName: "Windbaum",
        category: "nature",
        subtype: "tree",
        ...technicalValues,
        animationType: "wind"
      }).success
    ).toBe(true);

    expect(
      WizardBaseProfileStepSchema.safeParse({
        projectName: "Basis fehlt",
        category: "character",
        subtype: "npc"
      }).success
    ).toBe(false);
    expect(
      WizardBaseProfileStepSchema.safeParse({
        projectName: "Figurenhöhe fehlt",
        category: "character",
        subtype: "npc",
        ...technicalValues,
        characterHeight: undefined
      }).success
    ).toBe(false);
  });

  it("scopes the Character-details boundary to a classified character with a Base profile", () => {
    const npc = {
      projectName: "Dorfschmied",
      category: "character" as const,
      subtype: "npc" as const,
      ...technicalValues,
      role: "blacksmith",
      age: "adult" as const,
      bodyBuild: "sturdy" as const,
      materials: "worn leather and dark iron",
      expression: "serious" as const,
      silhouette: "broad apron and hammer"
    };

    expect(WizardCharacterDetailsStepSchema.safeParse(npc).success).toBe(true);
    expect(
      WizardCharacterDetailsStepSchema.safeParse({
        ...npc,
        category: "texture",
        subtype: "wood"
      }).success
    ).toBe(false);
    expect(
      WizardCharacterDetailsStepSchema.safeParse({
        projectName: "Noch ohne Basis",
        category: "character",
        subtype: "npc",
        role: "blacksmith"
      }).success
    ).toBe(false);
  });

  it("validates canonical Character actions and their independent frame counts", () => {
    const npc = {
      projectName: "Animierter Schmied",
      category: "character" as const,
      subtype: "npc" as const,
      ...technicalValues,
      characterAnimationFrames: {
        idle: 4,
        walk: 5,
        run: 6,
        attack: 7,
        use: 5,
        talk: 4,
        interact: 3,
        hurt: 2,
        special: 8
      }
    };

    expect(WizardAnimationStepSchema.safeParse(npc).success).toBe(true);
    expect(
      WizardAnimationStepSchema.safeParse({
        ...npc,
        characterAnimationFrames: { walk: 0 }
      }).success
    ).toBe(false);
    expect(
      WizardAnimationStepSchema.safeParse({
        ...npc,
        characterAnimationFrames: { walk: 9 }
      }).success
    ).toBe(false);
    expect(
      WizardAnimationStepSchema.safeParse({
        ...npc,
        category: "nature",
        subtype: "tree",
        characterHeight: undefined,
        animationType: "wind"
      }).success
    ).toBe(false);
  });

  it("validates cart details and a directionless floating-crystal animation at their separate boundaries", () => {
    const cart = {
      projectName: "Händlerwagen",
      category: "movingObject" as const,
      subtype: "cart" as const,
      ...technicalValues,
      movingObjectClass: "cart" as const,
      movingObjectPurpose: "Transport",
      movingObjectFootprintWidthTiles: 2,
      movingObjectFootprintDepthTiles: 1,
      movementType: "roll" as const,
      directionCount: 8 as const,
      movingObjectAnimationFrames: { move: 6 }
    };
    const crystal = {
      projectName: "Pulsierender Kristall",
      category: "movingObject" as const,
      subtype: "floatingCrystal" as const,
      ...technicalValues,
      movingObjectClass: "floatingObject" as const,
      movementType: "hover" as const,
      movingObjectAnimationFrames: { pulse: 4 }
    };

    expect(WizardMovingObjectDetailsStepSchema.safeParse(cart).success).toBe(true);
    expect(WizardDirectionStepSchema.safeParse(cart).success).toBe(true);
    expect(WizardAnimationStepSchema.safeParse(cart).success).toBe(true);
    expect(WizardMovingObjectDetailsStepSchema.safeParse(crystal).success).toBe(true);
    expect(WizardAnimationStepSchema.safeParse(crystal).success).toBe(true);
    expect(WizardDirectionStepSchema.safeParse(crystal).success).toBe(false);

    expect(
      WizardMovingObjectDetailsStepSchema.safeParse({
        ...cart,
        movingObjectFootprintDepthTiles: undefined
      }).success
    ).toBe(false);
    expect(
      WizardMovingObjectDetailsStepSchema.safeParse({
        ...cart,
        movingObjectClass: "floatingObject"
      }).success
    ).toBe(false);
    expect(
      WizardAnimationStepSchema.safeParse({
        ...crystal,
        directionCount: 4
      }).success
    ).toBe(false);
    expect(
      WizardAnimationStepSchema.safeParse({
        ...crystal,
        movingObjectAnimationFrames: { pulse: 17 }
      }).success
    ).toBe(false);
  });

  it("derives safe fallbacks from persisted routes", () => {
    expect(getWizardCoreFallbackStepId("wizard/project")).toBe("project");
    expect(getWizardCoreFallbackStepId("wizard/category")).toBe("category");
    expect(getWizardCoreFallbackStepId("wizard/profile")).toBe("baseProfile");
    expect(getWizardCoreFallbackStepId("wizard/editor")).toBe("baseProfile");
  });
});
