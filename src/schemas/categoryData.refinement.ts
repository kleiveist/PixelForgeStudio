import { z } from "zod";
import {
  resolveCapabilities,
  type AssetSelection
} from "../domain/assets";
import { getDefaultMovingObjectClass } from "../domain/moving-objects";
import {
  getDefaultNaturePlantType,
  natureSubtypeHasCrown,
  natureSubtypeHasRoots,
  natureSubtypeHasTrunk
} from "../domain/nature";
import { getDefaultStaticObjectClass } from "../domain/static-objects";
import { getDefaultTextureMaterialType } from "../domain/textures";

export type CategoryDataCarrier = AssetSelection;

type CategoryDataKey = "answers" | "defaults";

export function validateCategoryDataCapabilities<DataKey extends CategoryDataKey>(
  value: CategoryDataCarrier & Readonly<Record<DataKey, unknown>>,
  dataKey: DataKey,
  context: z.RefinementCtx
): void {
  const categoryData = value[dataKey] as Readonly<Record<string, unknown>>;
  const capabilities = resolveCapabilities(value.category, value.subtype);
  const addIssue = (field: string, message: string): void => {
    context.addIssue({ code: "custom", path: [dataKey, field], message });
  };
  const hasAnimationData =
    categoryData.animationSequences !== undefined ||
    categoryData.animationActions !== undefined ||
    categoryData.animationAction !== undefined ||
    categoryData.animationType !== undefined;

  if (value.category === "movingObject" && categoryData.objectClass !== undefined) {
    const expectedClass = getDefaultMovingObjectClass(value.subtype);
    if (categoryData.objectClass !== expectedClass) {
      addIssue(
        "objectClass",
        `Object class "${String(categoryData.objectClass)}" does not match moving-object subtype "${value.subtype}"; expected "${expectedClass}".`
      );
    }
  }

  if (value.category === "staticObject" && categoryData.objectClass !== undefined) {
    const expectedClass = getDefaultStaticObjectClass(value.subtype);
    if (categoryData.objectClass !== expectedClass) {
      addIssue(
        "objectClass",
        `Object class "${String(categoryData.objectClass)}" does not match static-object subtype "${value.subtype}"; expected "${expectedClass}".`
      );
    }
  }

  if (value.category === "texture" && categoryData.materialType !== undefined) {
    const expectedMaterialType = getDefaultTextureMaterialType(value.subtype);
    if (categoryData.materialType !== expectedMaterialType) {
      addIssue(
        "materialType",
        `Material type "${String(categoryData.materialType)}" does not match texture subtype "${value.subtype}"; expected "${expectedMaterialType}".`
      );
    }
  }

  if (value.category === "nature") {
    if (categoryData.plantType !== undefined) {
      const expectedPlantType = getDefaultNaturePlantType(value.subtype);
      if (categoryData.plantType !== expectedPlantType) {
        addIssue(
          "plantType",
          `Plant type "${String(categoryData.plantType)}" does not match nature subtype "${value.subtype}"; expected "${expectedPlantType}".`
        );
      }
    }

    const rejectIrrelevantFields = (
      fields: readonly string[],
      relevant: boolean,
      anatomy: string
    ): void => {
      if (relevant) return;
      for (const field of fields) {
        if (categoryData[field] !== undefined) {
          addIssue(
            field,
            `${anatomy} data is not valid for nature subtype "${value.subtype}".`
          );
        }
      }
    };

    rejectIrrelevantFields(
      ["trunkThickness", "trunkShape", "trunkDetails"],
      natureSubtypeHasTrunk(value.subtype),
      "Trunk"
    );
    rejectIrrelevantFields(
      ["crownShape", "crownDensity", "foliageDetails"],
      natureSubtypeHasCrown(value.subtype),
      "Crown"
    );
    rejectIrrelevantFields(
      ["rootVisibility", "rootDetails"],
      natureSubtypeHasRoots(value.subtype),
      "Root"
    );
  }

  if (categoryData.movementType !== undefined && !capabilities.movable) {
    addIssue("movementType", "Movement data is only valid for movable asset subtypes.");
  }

  if (categoryData.footprint !== undefined && !capabilities.footprint) {
    addIssue("footprint", "Footprints are only valid for footprint-capable asset subtypes.");
  }

  if (categoryData.anchorMode !== undefined && !capabilities.footprint) {
    addIssue("anchorMode", "Anchors are only valid for footprint-capable asset subtypes.");
  }

  if (categoryData.directionCount !== undefined && !capabilities.directional) {
    addIssue("directionCount", "Direction counts are only valid for directional asset subtypes.");
  }

  if (categoryData.framesPerDirection !== undefined) {
    if (!capabilities.directional) {
      addIssue(
        "framesPerDirection",
        "Frames per direction are only valid for directional asset subtypes."
      );
    } else if (categoryData.directionCount === undefined) {
      addIssue("framesPerDirection", "Frames per direction require a direction count.");
    } else if (
      typeof categoryData.framesPerDirection === "number" &&
      categoryData.framesPerDirection > 1 &&
      !hasAnimationData
    ) {
      addIssue(
        "framesPerDirection",
        "Multiple frames per direction require an animation action or animation type."
      );
    }
  }

  if (hasAnimationData && !capabilities.animated) {
    const animationField =
      categoryData.animationSequences !== undefined
        ? "animationSequences"
        : categoryData.animationActions !== undefined
          ? "animationActions"
          : categoryData.animationAction !== undefined
            ? "animationAction"
            : "animationType";
    addIssue(
      animationField,
      "Animation data is only valid for animated asset subtypes."
    );
  }

  const hasWearableData =
    categoryData.wearPosition !== undefined ||
    categoryData.presentation === "equipped" ||
    (value.category === "item" && categoryData.purpose === "wearable");
  if (hasWearableData && !capabilities.wearable) {
    const field =
      categoryData.wearPosition !== undefined
        ? "wearPosition"
        : categoryData.presentation === "equipped"
          ? "presentation"
          : "purpose";
    addIssue(field, "Wearable data is only valid for wearable item subtypes.");
  }

  if (categoryData.modular === true && !capabilities.modular) {
    addIssue("modular", "Modular output is only valid for modular asset subtypes.");
  }
}
