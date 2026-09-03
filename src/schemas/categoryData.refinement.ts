import { z } from "zod";
import {
  resolveCapabilities,
  type AssetCategory,
  type AssetSubtype
} from "../domain/assets";

export interface CategoryDataCarrier {
  readonly category: AssetCategory;
  readonly subtype: AssetSubtype;
}

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
    categoryData.animationActions !== undefined ||
    categoryData.animationAction !== undefined ||
    categoryData.animationType !== undefined;

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
      categoryData.animationActions !== undefined
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
