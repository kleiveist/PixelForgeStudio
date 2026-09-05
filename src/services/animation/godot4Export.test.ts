import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { DIRECTION_IDS, resolveSpriteSheetLayout } from "../../domain/animation";
import { parseAnimationProject } from "../../schemas";
import { createAnimationProjectInput } from "../../test/animationSchemaFixtures";
import { createSpriteSheetMetadata } from "./animationExport";
import {
  GODOT_4_ANIMATION_NAMES,
  GODOT_4_EXPORT_TARGET,
  buildGodot4ExportModel,
  createGodot4ImportReadme,
  createGodot4Package,
  escapeGodotString,
  generateGodot4SpriteFrames
} from "./godot4Export";

export function createGodotMetadataFixture() {
  const project = parseAnimationProject(
    createAnimationProjectInput({
      projectId: "project_godot_fixture_001",
      name: "Fixture Hero",
      frameProfile: {
        frameSize: { width: 2, height: 2 },
        characterHeight: 1,
        footAnchor: { x: 1, y: 1 }
      },
      previewBlobId: undefined
    })
  );
  return createSpriteSheetMetadata({
    project,
    clip: project.clips[0]!,
    layout: resolveSpriteSheetLayout({ frameSize: project.frameProfile.frameSize })
  });
}

describe("Godot 4 export", () => {
  it("projects neutral metadata into eight stable animations and 64 exact regions", () => {
    const metadata = createGodotMetadataFixture();
    const before = JSON.stringify(metadata);
    const model = buildGodot4ExportModel(metadata);

    expect(model.target).toEqual({ engine: "godot", major: 4 });
    expect(model.target).toBe(GODOT_4_EXPORT_TARGET);
    expect(model.animations.map(({ name }) => name)).toEqual(
      DIRECTION_IDS.map((direction) => GODOT_4_ANIMATION_NAMES[direction])
    );
    expect(model.animations.every(({ frames, loop, speed }) =>
      frames.length === 8 && loop && speed === 10
    )).toBe(true);
    expect(model.animations.flatMap(({ frames }) => frames)).toHaveLength(64);
    expect(model.animations[7]?.frames[7]).toMatchObject({
      subResourceId: "AtlasTexture_southWest_07",
      region: { x: 14, y: 14, width: 2, height: 2 }
    });
    expect(JSON.stringify(metadata)).toBe(before);
  });

  it("generates the deterministic review fixture with stable resource IDs", () => {
    const text = generateGodot4SpriteFrames(
      buildGodot4ExportModel(createGodotMetadataFixture())
    );
    const fixture = readFileSync(
      resolve(
        process.cwd(),
        "src/test/fixtures/animation/exports/godot4-spriteframes.tres"
      ),
      "utf8"
    );
    expect(text).toBe(fixture);
    expect(text.match(/\[sub_resource type="AtlasTexture"/g)).toHaveLength(64);
    expect(text.match(/"name": &"walk_/g)).toHaveLength(8);
    expect(text.match(/"duration": 1\.0/g)).toHaveLength(64);
    expect(text.match(/"speed": 10\.0/g)).toHaveLength(8);
    expect(text.match(/"loop": true/g)).toHaveLength(8);
    const regionMatches = [...text.matchAll(
      /\[sub_resource type="AtlasTexture" id="([^"]+)"\]\natlas = ExtResource\("1_sheet"\)\nregion = Rect2\((\d+), (\d+), (\d+), (\d+)\)/g
    )];
    expect(regionMatches).toHaveLength(64);
    expect(
      regionMatches.map((match) => ({
        id: match[1],
        x: Number(match[2]),
        y: Number(match[3]),
        width: Number(match[4]),
        height: Number(match[5])
      }))
    ).toEqual(
      buildGodot4ExportModel(createGodotMetadataFixture()).animations.flatMap(
        ({ frames }) =>
          frames.map(({ subResourceId: id, region }) => ({ id, ...region }))
      )
    );
  });

  it("normalizes resource paths and escapes Godot strings", () => {
    const model = buildGodot4ExportModel(createGodotMetadataFixture(), {
      packageName: '../Wächter "North"\\evil'
    });
    expect(model.packageName).toBe("wachter-north-evil");
    expect(model.sheetResourcePath).toBe(
      "res://wachter-north-evil/wachter-north-evil_walk.png"
    );
    expect(escapeGodotString('a"b\\c\n')).toBe('a\\"b\\\\c\\n');
    expect(() =>
      buildGodot4ExportModel(createGodotMetadataFixture(), {
        target: { engine: "godot", major: 3 as 4 }
      })
    ).toThrow(/major-version 4/);
  });

  it("packages PNG, unchanged JSON, SpriteFrames and complete import help", async () => {
    const metadata = createGodotMetadataFixture();
    const result = await createGodot4Package({
      metadata,
      sheetPng: new Blob([
        Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1])
      ], { type: "image/png" })
    });
    const files = unzipSync(new Uint8Array(await result.blob.arrayBuffer()));
    expect(Object.keys(files)).toEqual([
      "fixture-hero/fixture-hero_walk.png",
      "fixture-hero/fixture-hero_walk.json",
      "fixture-hero/fixture-hero_sprite_frames.tres",
      "fixture-hero/README_IMPORT.md"
    ]);
    expect(Object.keys(files).every((path) => !path.startsWith("/") && !path.includes(".."))).toBe(true);
    expect(JSON.parse(strFromU8(files["fixture-hero/fixture-hero_walk.json"]!))).toEqual(
      metadata
    );
    const readme = strFromU8(files["fixture-hero/README_IMPORT.md"]!);
    expect(readme).toContain("Warten, bis Godot");
    expect(readme).toContain("AnimatedSprite2D");
    expect(readme).toContain("Bewegungsrichtung");
    expect(readme).toContain("FootAnchor (1, 1)");
    expect(createGodot4ImportReadme(result.model)).toBe(readme);
  });
});
