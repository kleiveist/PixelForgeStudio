import { strToU8, zipSync } from "fflate";
import {
  DIRECTION_IDS,
  normalizeAnimationExportBaseName,
  type Direction
} from "../../domain/animation";
import {
  SpriteSheetMetadataSchema,
  type SpriteSheetMetadata
} from "../../schemas";

export interface EngineExportTarget {
  readonly engine: "godot";
  readonly major: 4;
}

export const GODOT_4_EXPORT_TARGET: EngineExportTarget = Object.freeze({
  engine: "godot",
  major: 4
});

export const GODOT_4_ANIMATION_NAMES: Readonly<Record<Direction, string>> =
  Object.freeze({
    south: "walk_south",
    southEast: "walk_south_east",
    east: "walk_east",
    northEast: "walk_north_east",
    north: "walk_north",
    northWest: "walk_north_west",
    west: "walk_west",
    southWest: "walk_south_west"
  });

export interface Godot4AtlasFrame {
  readonly subResourceId: string;
  readonly index: number;
  readonly region: Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface Godot4Animation {
  readonly name: string;
  readonly direction: Direction;
  readonly loop: true;
  readonly speed: number;
  readonly frames: readonly Godot4AtlasFrame[];
}

export interface Godot4ExportModel {
  readonly target: EngineExportTarget;
  readonly packageName: string;
  readonly sheetFileName: string;
  readonly metadataFileName: string;
  readonly resourceFileName: string;
  readonly sheetResourcePath: string;
  readonly footAnchor: SpriteSheetMetadata["footAnchor"];
  readonly animations: readonly Godot4Animation[];
}

export interface Godot4PackageFileNames {
  readonly directory: string;
  readonly sheet: string;
  readonly metadata: string;
  readonly resource: string;
  readonly readme: "README_IMPORT.md";
}

export interface Godot4PackageResult {
  readonly blob: Blob;
  readonly model: Godot4ExportModel;
  readonly files: Godot4PackageFileNames;
}

export interface PreparedGodot4Package {
  readonly model: Godot4ExportModel;
  readonly files: Godot4PackageFileNames;
  readonly entries: readonly Readonly<{ path: string; bytes: Uint8Array }>[];
}

function assertTarget(target: EngineExportTarget): void {
  if (target.engine !== "godot" || target.major !== 4) {
    throw new RangeError("Only the explicit Godot major-version 4 target is supported.");
  }
}

export function escapeGodotString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/[\0-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
}

export function buildGodot4ExportModel(
  metadataInput: unknown,
  options: Readonly<{
    target?: EngineExportTarget;
    packageName?: string;
  }> = {}
): Godot4ExportModel {
  const metadata = SpriteSheetMetadataSchema.parse(metadataInput);
  const target = options.target ?? GODOT_4_EXPORT_TARGET;
  assertTarget(target);
  const packageName = normalizeAnimationExportBaseName(
    options.packageName ?? metadata.projectName,
    metadata.projectId
  );
  const sheetFileName = `${packageName}_walk.png`;
  const metadataFileName = `${packageName}_walk.json`;
  const resourceFileName = `${packageName}_sprite_frames.tres`;
  const sheetResourcePath = `res://${packageName}/${sheetFileName}`;

  const animations = DIRECTION_IDS.map((direction) => {
    const neutral = metadata.animations.find(
      (animation) => animation.direction === direction
    );
    if (!neutral) throw new RangeError(`Neutral animation ${direction} is missing.`);
    return Object.freeze({
      name: GODOT_4_ANIMATION_NAMES[direction],
      direction,
      loop: true as const,
      speed: metadata.fps,
      frames: Object.freeze(
        neutral.frames.map((frame) =>
          Object.freeze({
            subResourceId: `AtlasTexture_${direction}_${String(frame.index).padStart(2, "0")}`,
            index: frame.index,
            region: Object.freeze({
              x: frame.x,
              y: frame.y,
              width: frame.width,
              height: frame.height
            })
          })
        )
      )
    });
  });

  return Object.freeze({
    target: GODOT_4_EXPORT_TARGET,
    packageName,
    sheetFileName,
    metadataFileName,
    resourceFileName,
    sheetResourcePath,
    footAnchor: Object.freeze({ ...metadata.footAnchor }),
    animations: Object.freeze(animations)
  });
}

function godotNumber(value: number): string {
  if (!Number.isFinite(value)) throw new RangeError("Godot number must be finite.");
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

export function generateGodot4SpriteFrames(model: Godot4ExportModel): string {
  assertTarget(model.target);
  const atlasFrames = model.animations.flatMap(({ frames }) => frames);
  if (
    model.animations.length !== DIRECTION_IDS.length ||
    atlasFrames.length !== 64 ||
    model.animations.some(({ frames }) => frames.length !== 8)
  ) {
    throw new RangeError("Godot SpriteFrames requires eight animations of eight frames.");
  }
  const lines: string[] = [
    `[gd_resource type="SpriteFrames" load_steps=66 format=3]`,
    "",
    `[ext_resource type="Texture2D" path="${escapeGodotString(model.sheetResourcePath)}" id="1_sheet"]`,
    ""
  ];
  for (const frame of atlasFrames) {
    lines.push(
      `[sub_resource type="AtlasTexture" id="${escapeGodotString(frame.subResourceId)}"]`,
      'atlas = ExtResource("1_sheet")',
      `region = Rect2(${frame.region.x}, ${frame.region.y}, ${frame.region.width}, ${frame.region.height})`,
      ""
    );
  }
  lines.push("[resource]", "animations = [");
  model.animations.forEach((animation, animationIndex) => {
    lines.push("{", '"frames": [');
    animation.frames.forEach((frame, frameIndex) => {
      lines.push(
        `{ "duration": 1.0, "texture": SubResource("${escapeGodotString(frame.subResourceId)}") }${
          frameIndex === animation.frames.length - 1 ? "" : ","
        }`
      );
    });
    lines.push(
      "],",
      `"loop": ${animation.loop ? "true" : "false"},`,
      `"name": &"${escapeGodotString(animation.name)}",`,
      `"speed": ${godotNumber(animation.speed)}`,
      `}${animationIndex === model.animations.length - 1 ? "" : ","}`
    );
  });
  lines.push("]", "");
  return lines.join("\n");
}

export function createGodot4ImportReadme(model: Godot4ExportModel): string {
  assertTarget(model.target);
  return `# PixelForge Animation Studio — Godot 4 Import

Dieses Paket zielt ausdrücklich auf Godot 4.x; eine konkrete Patchversion ist
nicht Bestandteil des Datenvertrags.

1. Den Ordner \`${model.packageName}/\` unverändert in das Wurzelverzeichnis
   des Godot-Projekts kopieren.
2. Warten, bis Godot \`${model.sheetFileName}\` vollständig importiert hat.
3. \`${model.resourceFileName}\` als SpriteFrames-Ressource einem
   \`AnimatedSprite2D\` zuweisen.
4. Die Animation anhand der Bewegungsrichtung auswählen: \`${model.animations
    .map(({ name }) => name)
    .join("\`, \`")}\`.
5. \`speed_scale\` nur bewusst ändern; die Ressource verwendet das Projekt-FPS.
6. Den FootAnchor (${model.footAnchor.x}, ${model.footAnchor.y}) aus
   \`${model.metadataFileName}\` für Origin, Bodenbezug und Kollision nutzen.

Das neutrale JSON bleibt die Quelle der Wahrheit. Das Paket enthält keine
Player-Szene und keine CharacterController-Logik.
`;
}

function hasPngSignature(bytes: Uint8Array): boolean {
  return [137, 80, 78, 71, 13, 10, 26, 10].every(
    (value, index) => bytes[index] === value
  );
}

export async function prepareGodot4Package(input: Readonly<{
  metadata: unknown;
  sheetPng: Blob;
  packageName?: string;
  target?: EngineExportTarget;
}>): Promise<PreparedGodot4Package> {
  const metadata = SpriteSheetMetadataSchema.parse(input.metadata);
  const model = buildGodot4ExportModel(metadata, {
    ...(input.packageName ? { packageName: input.packageName } : {}),
    ...(input.target ? { target: input.target } : {})
  });
  const png = new Uint8Array(await input.sheetPng.arrayBuffer());
  if (!hasPngSignature(png)) {
    throw new RangeError("Godot package requires a PNG-signature SpriteSheet.");
  }
  const directory = model.packageName;
  const entries: Record<string, Uint8Array> = {
    [`${directory}/${model.sheetFileName}`]: png,
    [`${directory}/${model.metadataFileName}`]: strToU8(
      `${JSON.stringify(metadata, null, 2)}\n`
    ),
    [`${directory}/${model.resourceFileName}`]: strToU8(
      generateGodot4SpriteFrames(model)
    ),
    [`${directory}/README_IMPORT.md`]: strToU8(createGodot4ImportReadme(model))
  };
  return Object.freeze({
    model,
    entries: Object.freeze(
      Object.entries(entries).map(([path, bytes]) =>
        Object.freeze({ path, bytes })
      )
    ),
    files: Object.freeze({
      directory,
      sheet: model.sheetFileName,
      metadata: model.metadataFileName,
      resource: model.resourceFileName,
      readme: "README_IMPORT.md" as const
    })
  });
}

export async function createGodot4Package(input: Readonly<{
  metadata: unknown;
  sheetPng: Blob;
  packageName?: string;
  target?: EngineExportTarget;
}>): Promise<Godot4PackageResult> {
  const prepared = await prepareGodot4Package(input);
  const archive = zipSync(
    Object.fromEntries(
      prepared.entries.map(({ path, bytes }) => [path, bytes])
    ),
    {
      level: 6,
      mtime: new Date("1980-01-01T00:00:00.000Z")
    }
  );
  return Object.freeze({
    blob: new Blob([archive], { type: "application/zip" }),
    model: prepared.model,
    files: prepared.files
  });
}
