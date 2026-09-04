<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# 06 — Export-, SpriteSheet- und Godot-Spezifikation

## 1. Exportziele des MVP

Das Animation Studio exportiert:

1. einzelnes SpriteSheet als PNG
2. Metadaten als JSON
3. optional 64 Einzelbilder als PNG
4. vollständiges Projektbundle als `.pfanim`
5. Godot-4.x-Paket
6. Vorschaubild oder animierte Vorschau nur als spätere Zusatzoption

Der eigentliche Produktionsvertrag besteht immer aus PNG plus validierten
Metadaten. Engine-spezifische Dateien werden daraus abgeleitet.

## 2. Dateinamen

Namen werden normalisiert:

```text
Kleif Wache → kleif-wache
```

Erlaubt im Basisnamen:

```text
a-z
0-9
-
_
```

Nicht erlaubte oder problematische Zeichen werden deterministisch ersetzt.
Leere Namen fallen auf die stabile Projekt-ID zurück.

Beispiel:

```text
kleif-wache_walk.png
kleif-wache_walk.json
kleif-wache_frames/
kleif-wache.pfanim
kleif-wache_godot4.zip
```

## 3. SpriteSheet-Layout

Standard:

```text
Framebreite:  128 px
Framehöhe:    128 px
Spalten:      8 Frames
Zeilen:       8 Richtungen
Gesamtbreite: 1024 px
Gesamthöhe:   1024 px
```

Zeilenreihenfolge:

```text
0 south
1 southEast
2 east
3 northEast
4 north
5 northWest
6 west
7 southWest
```

Spalten:

```text
0 bis 7 entsprechend Walk-Frame 0 bis 7
```

Die Layoutfunktion ist pure Domainlogik:

```ts
resolveSpriteSheetLayout({
  frameSize,
  directions,
  frameCount,
  spacing: 0,
  margin: 0
})
```

Sie berechnet:

- rows
- columns
- sheetWidth
- sheetHeight
- Frame-Rechtecke
- Richtung und Frame je Zelle
- Kapazität
- optionale Spacing-/Margin-Werte

## 4. PNG-Regeln

- RGBA
- transparenter Hintergrund
- native Frameauflösung
- keine Interpolation
- keine Farbraum- oder Paletteänderung ohne sichtbare Option
- keine automatische Skalierung des fertigen Sheets
- keine Metadaten, die die Bildpixels verändern
- identische Eingabedaten erzeugen identische RGBA-Pixeldaten

PNG-Binärbytes können je Encoder variieren. Pixelgleichheit wird deshalb über
dekodierte RGBA-Werte und nicht über vollständige Binärdatei-Hashes getestet.

## 5. Neutrales Metadatenformat

Beispiel:

```json
{
  "application": "PixelForge Animation Studio",
  "formatVersion": 1,
  "kind": "spriteSheetMetadata",
  "projectId": "project-kleif",
  "projectName": "Kleif Wache",
  "action": "walk",
  "fps": 10,
  "loop": true,
  "frameWidth": 128,
  "frameHeight": 128,
  "sheetWidth": 1024,
  "sheetHeight": 1024,
  "columns": 8,
  "rows": 8,
  "footAnchor": { "x": 64, "y": 112 },
  "directions": [
    "south",
    "southEast",
    "east",
    "northEast",
    "north",
    "northWest",
    "west",
    "southWest"
  ],
  "animations": [
    {
      "name": "walk_south",
      "direction": "south",
      "frames": [
        { "index": 0, "x": 0, "y": 0, "width": 128, "height": 128 },
        { "index": 1, "x": 128, "y": 0, "width": 128, "height": 128 }
      ]
    }
  ]
}
```

Alle 64 Frameeinträge werden tatsächlich ausgegeben. Das Beispiel ist
gekürzt.

## 6. Einzelbildexport

Ordner-/ZIP-Struktur:

```text
frames/
├── walk_south_00.png
├── walk_south_01.png
├── ...
├── walk_southWest_07.png
└── metadata.json
```

Nullpadding ist stabil. Richtungsnamen verwenden die kanonischen IDs.

## 7. Exportprüfung

Vor Export:

```text
hard errors
├── fehlender Pflichtslot
├── ungültiger Anker
├── ungültige Blob-Referenz
├── verbotene Spiegelung ohne Override
├── ungültiges Rig
├── ungültiger Clip
└── Renderfehler

warnings
├── optischer Clip am Framerand
├── extreme Skalierung
├── opaker Außenrand
├── optionale Richtungsquelle fehlt
├── unbestätigte asymmetrische Spiegelung
└── manuelle Korrektur außerhalb Empfehlungsbereich
```

Harte Fehler blockieren. Warnungen werden mit expliziter Bestätigung
exportierbar.

## 8. Exportjobs

Batch-Export arbeitet über ein asynchrones Jobmodell:

```ts
type ExportJobState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "rendering"; completed: number; total: number }
  | { status: "encoding"; completed: number; total: number }
  | { status: "packaging" }
  | { status: "completed"; files: readonly ExportedFile[] }
  | { status: "cancelled" }
  | { status: "failed"; message: string };
```

- Cancel beendet den Job kontrolliert.
- Ein abgebrochener Job erzeugt keinen angeblich vollständigen Download.
- UI bleibt bedienbar.
- Objekt-URLs werden nach Download freigegeben.
- wiederholter Export verwendet Cache nur bei identischer Projektrevision.

## 9. Projektbundle

Das `.pfanim`-Bundle ist der vollständige editierbare Austauschvertrag. Es
enthält:

- validiertes Projekt
- Part-Metadaten
- Original-PNG-Blobs
- optionale Preview
- keine nur temporären Object URLs
- keine lokalen Dateisystempfade
- keine unreferenzierten Bilder

Import und Export erhalten die Originalbilder. Das Bundle ist nicht nur ein
fertiges SpriteSheet.

## 10. Godot-Ziel

Das erste Engineziel lautet:

```text
Godot 4.x
```

Der Exporter ist ausdrücklich versioniert:

```ts
type EngineExportTarget =
  | Readonly<{ engine: "godot"; major: 4 }>;
```

Keine konkrete Patchversion wird als unbefristeter Protokollwert eingebrannt.

## 11. Godot-Paketstruktur

```text
kleif-wache/
├── kleif-wache_walk.png
├── kleif-wache_walk.json
├── kleif-wache_sprite_frames.tres
└── README_IMPORT.md
```

Optional als ZIP gebündelt.

### Animationsnamen

```text
walk_south
walk_south_east
walk_east
walk_north_east
walk_north
walk_north_west
walk_west
walk_south_west
```

Engine-Dateinamen verwenden snake_case; neutrale JSON-Metadaten behalten die
kanonischen TypeScript-IDs.

### SpriteFrames-Ressource

Der Adapter erzeugt eine textuelle Godot-`SpriteFrames`-Ressource mit:

- externer Referenz auf das SpriteSheet
- AtlasTexture-Unterressourcen pro Frame
- Region je Frame
- acht benannten Animationen
- `loop = true`
- Geschwindigkeit aus Projekt-FPS
- Frames in korrekter Reihenfolge

Die neutrale JSON-Datei bleibt Quelle der Wahrheit. Der Godot-Textadapter ist
eine reine Projektion daraus.

## 12. Godot-Abnahme

Wenn eine passende Godot-4-Ausführung in der Entwicklungsumgebung vorhanden
ist:

1. minimales Testprojekt anlegen oder vorhandene Fixture verwenden
2. Ressource importieren
3. jede der acht Animationen laden
4. Framezahl, FPS, Loop und Regionen prüfen
5. keine import warnings durch falsche Pfade

Wenn Godot nicht installiert ist:

- exakte Text-/Parser-Fixtures testen
- Pfad- und Resource-ID-Escaping testen
- im Abschlussbericht klar nennen, dass die manuelle Engineprüfung offen ist
- nicht behaupten, die Datei in Godot geöffnet zu haben

## 13. Godot-README

`README_IMPORT.md` enthält:

```text
1. Ordner unverändert in das Godot-Projekt kopieren.
2. Warten, bis Godot die PNG importiert hat.
3. SpriteFrames-Ressource einem AnimatedSprite2D zuweisen.
4. Animation anhand Bewegungsrichtung auswählen.
5. Speed Scale nur bewusst ändern.
6. Fußanker/Kollisionsursprung aus metadata.json übernehmen.
```

Keine projektspezifischen absoluten Pfade ausgeben.

## 14. Spätere Exportziele

Nicht Teil des MVP-Releaseblocks:

- Aseprite JSON
- Unity Animator/metadata
- RPG Maker Layouts
- GIF
- APNG
- WebM
- Spine/DragonBones
- Godot-Szene mit vollständigem CharacterController

Sie werden aus dem neutralen Metadatenformat aufgebaut und dürfen dessen
Richtungskanon nicht verändern.
