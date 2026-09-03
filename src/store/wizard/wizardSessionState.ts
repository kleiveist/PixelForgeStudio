import type {
  AssetCategory,
  AssetSubtype,
  DirectionCount
} from "../../domain/assets";
import type { CharacterAnimationActionId } from "../../domain/characters";
import { jsonValuesEqual } from "../../domain/json";
import type {
  CharacterAnswers,
  BaseProfileValues,
  MovingObjectAnswers,
  NatureAnswers,
  StableId,
  StaticObjectAnswers,
  TextureAnswers,
  TilesetAnswers,
  WizardDraft
} from "../../schemas";

export type WizardStartIntent =
  | Readonly<{ kind: "newAsset"; category: AssetCategory | null }>
  | Readonly<{ kind: "profile"; assetProfileId: StableId }>
  | Readonly<{ kind: "resume"; draftId: StableId }>;

export interface WizardSessionState {
  readonly startIntent: WizardStartIntent | null;
  readonly activeDraft: WizardDraft | null;
  readonly baselineDraft: WizardDraft | null;
  readonly draftPersisted: boolean;
  readonly rawCoreFormValues: WizardRawCoreFormValues | null;
  readonly sessionRevision: number;
}

export interface WizardRawCoreFormValues {
  readonly projectName: string;
  readonly category?: AssetCategory | undefined;
  readonly subtype?: AssetSubtype | undefined;
  readonly baseProfileId?: string | undefined;
  readonly pixelDensity?: BaseProfileValues["pixelDensity"] | undefined;
  readonly styleProfile?: BaseProfileValues["styleProfile"] | undefined;
  readonly tileSize?: BaseProfileValues["tileSize"] | undefined;
  readonly characterHeight?: BaseProfileValues["characterHeight"];
  readonly perspectiveType?: BaseProfileValues["perspectiveType"] | undefined;
  readonly cameraAngle?: BaseProfileValues["cameraAngle"] | undefined;
  readonly cameraDirection?: BaseProfileValues["cameraDirection"] | undefined;
  readonly projectionType?: BaseProfileValues["projectionType"] | undefined;
  readonly outlineStyle?: BaseProfileValues["outlineStyle"] | undefined;
  readonly paletteMode?: BaseProfileValues["paletteMode"] | undefined;
  readonly backgroundMode?: BaseProfileValues["backgroundMode"] | undefined;
  readonly alphaPadding?: BaseProfileValues["alphaPadding"] | undefined;
  readonly nearestNeighbor?: BaseProfileValues["nearestNeighbor"] | undefined;
  readonly lightingPolicy?: BaseProfileValues["lightingDefaults"]["policy"] | undefined;
  readonly lightingNotes?: BaseProfileValues["lightingDefaults"]["notes"] | undefined;
  readonly role?: CharacterAnswers["role"];
  readonly subjectDescription?: CharacterAnswers["subjectDescription"];
  readonly variantCount?: CharacterAnswers["variantCount"];
  readonly genderPresentation?: CharacterAnswers["genderPresentation"];
  readonly age?: CharacterAnswers["age"];
  readonly relativeHeight?: CharacterAnswers["relativeHeight"];
  readonly bodyBuild?: CharacterAnswers["bodyBuild"];
  readonly posture?: CharacterAnswers["posture"];
  readonly faceShape?: CharacterAnswers["faceShape"];
  readonly skinTone?: CharacterAnswers["skinTone"];
  readonly eyeVisibility?: CharacterAnswers["eyeVisibility"];
  readonly hair?: CharacterAnswers["hair"];
  readonly hairstyle?: CharacterAnswers["hairstyle"];
  readonly beard?: CharacterAnswers["beard"];
  readonly hat?: CharacterAnswers["hat"];
  readonly headwearCondition?: CharacterAnswers["headwearCondition"];
  readonly scarf?: CharacterAnswers["scarf"];
  readonly outerwear?: CharacterAnswers["outerwear"];
  readonly lowerwear?: CharacterAnswers["lowerwear"];
  readonly clothingLayers?: CharacterAnswers["clothingLayers"];
  readonly gloves?: CharacterAnswers["gloves"];
  readonly handPose?: CharacterAnswers["handPose"];
  readonly shoes?: CharacterAnswers["shoes"];
  readonly beltBags?: CharacterAnswers["beltBags"];
  readonly accessories?: CharacterAnswers["accessories"];
  readonly backItem?: CharacterAnswers["backItem"];
  readonly equipment?: CharacterAnswers["equipment"];
  readonly materials?: CharacterAnswers["materials"];
  readonly characterPaletteSource?: CharacterAnswers["characterPaletteSource"];
  readonly primaryColor?: CharacterAnswers["primaryColor"];
  readonly secondaryColor?: CharacterAnswers["secondaryColor"];
  readonly accentColor?: CharacterAnswers["accentColor"];
  readonly condition?: CharacterAnswers["condition"];
  readonly expression?: CharacterAnswers["expression"];
  readonly silhouette?: CharacterAnswers["silhouette"];
  readonly pose?: CharacterAnswers["pose"];
  readonly professionReadable?: CharacterAnswers["professionReadable"];
  readonly socialRole?: CharacterAnswers["socialRole"];
  readonly wealth?: CharacterAnswers["wealth"];
  readonly culturalFunction?: CharacterAnswers["culturalFunction"];
  readonly typicalActivity?: CharacterAnswers["typicalActivity"];
  readonly conversationGesture?: CharacterAnswers["conversationGesture"];
  readonly everydayTool?: CharacterAnswers["everydayTool"];
  readonly frontBackDetails?: CharacterAnswers["frontBackDetails"];
  readonly extraDetails?: CharacterAnswers["extraDetails"];
  readonly characterAnimationFrames?: Readonly<
    Partial<Record<CharacterAnimationActionId, number>>
  > | undefined;
  readonly movingObjectClass?: MovingObjectAnswers["objectClass"] | undefined;
  readonly movingObjectPurpose?: MovingObjectAnswers["purpose"] | undefined;
  readonly movingObjectBasicShape?: MovingObjectAnswers["basicShape"] | undefined;
  readonly movingObjectDescription?: MovingObjectAnswers["subjectDescription"] | undefined;
  readonly movingObjectFootprintWidthTiles?: NonNullable<
    MovingObjectAnswers["footprint"]
  >["widthTiles"] | undefined;
  readonly movingObjectFootprintDepthTiles?: NonNullable<
    MovingObjectAnswers["footprint"]
  >["depthTiles"] | undefined;
  readonly movingObjectHeightPixels?: MovingObjectAnswers["heightPixels"] | undefined;
  readonly movingObjectAnchorMode?: MovingObjectAnswers["anchorMode"] | undefined;
  readonly movingObjectMechanism?: MovingObjectAnswers["mechanism"] | undefined;
  readonly movingObjectMaterial?: MovingObjectAnswers["material"] | undefined;
  readonly movingObjectMaterialDetails?: MovingObjectAnswers["materialDetails"] | undefined;
  readonly movingObjectCondition?: MovingObjectAnswers["condition"] | undefined;
  readonly movingObjectLightingBehavior?: MovingObjectAnswers["lightingBehavior"] | undefined;
  readonly movingObjectShadowMode?: MovingObjectAnswers["shadowMode"] | undefined;
  readonly movingObjectExtraDetails?: MovingObjectAnswers["extraDetails"] | undefined;
  readonly movingObjectAnimationFrames?: Readonly<
    Partial<
      Record<NonNullable<MovingObjectAnswers["animationType"]>, number>
    >
  > | undefined;
  readonly textureMaterialType?: TextureAnswers["materialType"];
  readonly textureUsage?: TextureAnswers["usage"];
  readonly textureDescription?: TextureAnswers["subjectDescription"];
  readonly textureStructure?: TextureAnswers["structure"];
  readonly textureCondition?: TextureAnswers["condition"];
  readonly textureSurface?: TextureAnswers["surface"];
  readonly textureMoisture?: TextureAnswers["moisture"];
  readonly textureIcing?: TextureAnswers["icing"];
  readonly textureLighting?: TextureAnswers["lighting"];
  readonly textureOrientation?: TextureAnswers["orientation"];
  readonly textureExtraDetails?: TextureAnswers["extraDetails"];
  readonly naturePlantType?: NatureAnswers["plantType"];
  readonly natureSpecies?: NatureAnswers["species"];
  readonly natureDescription?: NatureAnswers["subjectDescription"];
  readonly natureClimate?: NatureAnswers["climate"];
  readonly natureSeason?: NatureAnswers["season"];
  readonly natureAge?: NatureAnswers["age"];
  readonly natureSilhouette?: NatureAnswers["silhouette"];
  readonly natureTrunkThickness?: NatureAnswers["trunkThickness"];
  readonly natureTrunkShape?: NatureAnswers["trunkShape"];
  readonly natureTrunkDetails?: NatureAnswers["trunkDetails"];
  readonly natureCrownShape?: NatureAnswers["crownShape"];
  readonly natureCrownDensity?: NatureAnswers["crownDensity"];
  readonly natureFoliageDetails?: NatureAnswers["foliageDetails"];
  readonly natureRootVisibility?: NatureAnswers["rootVisibility"];
  readonly natureRootDetails?: NatureAnswers["rootDetails"];
  readonly natureMossCoverage?: NatureAnswers["mossCoverage"];
  readonly natureMushroomGrowth?: NatureAnswers["mushroomGrowth"];
  readonly natureSnowCover?: NatureAnswers["snowCover"];
  readonly natureVineGrowth?: NatureAnswers["vineGrowth"];
  readonly natureFootprintWidthTiles?: NonNullable<
    NatureAnswers["footprint"]
  >["widthTiles"] | undefined;
  readonly natureFootprintDepthTiles?: NonNullable<
    NatureAnswers["footprint"]
  >["depthTiles"] | undefined;
  readonly natureGrounding?: NatureAnswers["grounding"];
  readonly natureVariantCount?: NatureAnswers["variantCount"];
  readonly natureExtraDetails?: NatureAnswers["extraDetails"];
  readonly staticObjectClass?: StaticObjectAnswers["objectClass"] | undefined;
  readonly staticObjectPurpose?: StaticObjectAnswers["purpose"] | undefined;
  readonly staticObjectBasicShape?: StaticObjectAnswers["basicShape"] | undefined;
  readonly staticObjectProportion?: StaticObjectAnswers["proportion"] | undefined;
  readonly staticObjectSymmetry?: StaticObjectAnswers["symmetry"] | undefined;
  readonly staticObjectDescription?: StaticObjectAnswers["subjectDescription"] | undefined;
  readonly staticObjectPrimaryMaterial?: StaticObjectAnswers["primaryMaterial"] | undefined;
  readonly staticObjectSecondaryMaterial?: StaticObjectAnswers["secondaryMaterial"] | undefined;
  readonly staticObjectMaterialDetails?: StaticObjectAnswers["materialDetails"] | undefined;
  readonly staticObjectCondition?: StaticObjectAnswers["condition"] | undefined;
  readonly staticObjectDetailElements?: StaticObjectAnswers["detailElements"] | undefined;
  readonly staticObjectContents?: StaticObjectAnswers["contents"] | undefined;
  readonly staticObjectInteraction?: StaticObjectAnswers["interaction"] | undefined;
  readonly staticObjectFootprintWidthTiles?: NonNullable<
    StaticObjectAnswers["footprint"]
  >["widthTiles"] | undefined;
  readonly staticObjectFootprintDepthTiles?: NonNullable<
    StaticObjectAnswers["footprint"]
  >["depthTiles"] | undefined;
  readonly staticObjectShadowMode?: StaticObjectAnswers["shadowMode"] | undefined;
  readonly staticObjectVariantCount?: StaticObjectAnswers["variantCount"] | undefined;
  readonly staticObjectExtraDetails?: StaticObjectAnswers["extraDetails"] | undefined;
  readonly directionCount?: DirectionCount | undefined;
  readonly animationAction?: CharacterAnswers["animationAction"];
  readonly animationType?:
    | MovingObjectAnswers["animationType"]
    | StaticObjectAnswers["animationType"]
    | NatureAnswers["animationType"]
    | TilesetAnswers["animationType"];
  readonly movementType?: MovingObjectAnswers["movementType"];
  readonly seamless?: TextureAnswers["seamless"];
  readonly tileableAxes?: TilesetAnswers["tileableAxes"];
}

export type WizardDraftActivationMode =
  | "hydrate-transient"
  | "hydrate-persisted"
  | "edit"
  | "saved";

export type WizardSessionAction =
  | Readonly<{
      type: "startRequested";
      intent: WizardStartIntent;
    }>
  | Readonly<{
      type: "draftActivated";
      draft: WizardDraft;
      mode: WizardDraftActivationMode;
    }>
  | Readonly<{
      type: "rawCoreFormValuesCaptured";
      values: WizardRawCoreFormValues;
    }>
  | Readonly<{
      type: "profileRequestCleared";
      assetProfileId: StableId;
    }>;

export const INITIAL_WIZARD_SESSION_STATE: WizardSessionState = Object.freeze({
  startIntent: null,
  activeDraft: null,
  baselineDraft: null,
  draftPersisted: false,
  rawCoreFormValues: null,
  sessionRevision: 0
});

export function wizardDraftsStructurallyEqual(
  left: WizardDraft | null,
  right: WizardDraft | null
): boolean {
  if (left === null || right === null) return left === right;
  return jsonValuesEqual(left, right);
}

export function selectWizardSessionDirty(state: WizardSessionState): boolean {
  return (
    state.rawCoreFormValues !== null ||
    !wizardDraftsStructurallyEqual(state.activeDraft, state.baselineDraft)
  );
}

export function wizardSessionReducer(
  state: WizardSessionState,
  action: WizardSessionAction
): WizardSessionState {
  switch (action.type) {
    case "startRequested":
      return {
        startIntent: action.intent,
        activeDraft: null,
        baselineDraft: null,
        draftPersisted: false,
        rawCoreFormValues: null,
        sessionRevision: state.sessionRevision + 1
      };
    case "draftActivated":
      return {
        ...state,
        activeDraft: action.draft,
        baselineDraft:
          action.mode === "edit" ? state.baselineDraft : action.draft,
        draftPersisted:
          action.mode === "hydrate-transient"
            ? false
            : action.mode === "hydrate-persisted" || action.mode === "saved"
              ? true
              : state.draftPersisted,
        rawCoreFormValues: null
      };
    case "rawCoreFormValuesCaptured":
      return {
        ...state,
        rawCoreFormValues: Object.freeze({ ...action.values })
      };
    case "profileRequestCleared":
      return state.startIntent?.kind === "profile" &&
        state.startIntent.assetProfileId === action.assetProfileId
        ? {
            ...state,
            startIntent: null
          }
        : state;
  }
}
