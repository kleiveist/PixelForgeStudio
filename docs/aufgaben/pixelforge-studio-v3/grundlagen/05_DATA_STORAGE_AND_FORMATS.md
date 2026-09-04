<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# 05 — Datenmodell, Speicherung und Dateiformate

## Umsetzungsstand

Die additive AppSettings-Erweiterung aus Abschnitt 10 ist seit Prompt 31 ohne
Schemaversionserhöhung umgesetzt. Alte Settings- und ExportBundle-V2-Objekte
ohne die neuen Felder bleiben über Zod-Defaults lesbar. Die strikten
Animationsschemas und der referenzgeprüfte Bundlegraph sind seit Prompt 33
umgesetzt; ihre IndexedDB-Persistenz beginnt erst mit Prompt 34.

## 1. Formatgrenzen

Bestehende Promptdaten und neue Animationsdaten sind getrennte Protokolle.

```text
Prompt Studio:
  schemaVersion: 2
  formatVersion: 2
  application: "PixelForge Prompt Studio"

Animation Studio:
  schemaVersion: 1
  formatVersion: 1
  application: "PixelForge Animation Studio"
```

Kein gemeinsames, übergroßes Universalschema erzeugen.

## 2. Kernobjekte

```text
AnimationProject
├── ProjectSettings
├── RigReference
├── DirectionSourceConfiguration
├── PartAssignments
├── Clips
├── FrameOverrides
├── SourcePromptReference (optional)
└── PreviewReference (optional)

AnimationPartAsset
├── BlobReference
├── Slot
├── Direction
├── SourceDimensions
├── TrimRect
├── Anchors
├── MirrorPolicy
└── Attribution/Label

CharacterKit
├── RigCompatibilityKey
├── PartAssetReferences
├── DirectionCoverage
└── KitMetadata

RigTemplate
├── FrameProfile
├── JointsByDirection
├── Bones
├── SlotBindings
├── DrawOrderByDirection
└── MotionProfiles
```

## 3. Beispieltypen

```ts
type StableId = string;

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Size {
  readonly width: number;
  readonly height: number;
}

interface Rect extends Point, Size {}

interface AnimationProject {
  readonly schemaVersion: 1;
  readonly kind: "animationProject";
  readonly projectId: StableId;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly rigTemplateId: string;
  readonly frameProfile: {
    readonly frameSize: Size;
    readonly characterHeight: number;
    readonly footAnchor: Point;
  };
  readonly directionSourceMode: DirectionSourceMode;
  readonly parts: readonly ProjectPartAssignment[];
  readonly clips: readonly AnimationClip[];
  readonly overrides: readonly DirectionFrameOverride[];
  readonly sourcePrompt?: {
    readonly assetProfileId: StableId;
    readonly compatibilityKey: string;
  };
  readonly previewBlobId?: StableId;
}
```

```ts
interface AnimationPartAsset {
  readonly schemaVersion: 1;
  readonly kind: "animationPartAsset";
  readonly assetId: StableId;
  readonly blobId: StableId;
  readonly label: string;
  readonly slot: PartSlot;
  readonly direction: Direction;
  readonly sourceSize: Size;
  readonly trimRect: Rect;
  readonly anchors: SourceAnchors;
  readonly mirrorPolicy: MirrorPolicy;
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

```ts
interface AnimationClip {
  readonly clipId: StableId;
  readonly templateId: string;
  readonly action: "walk";
  readonly frameCount: 8;
  readonly fps: number;
  readonly loop: boolean;
}
```

Die konkreten Zod-Schemas sind streng. Werte aus Schemas werden möglichst über
`z.infer` typisiert.

## 4. Projekt- und Blobtrennung

Projektmetadaten enthalten keine PNG-Base64-Daten.

```text
AnimationProject.parts[*].assetId
    ↓
AnimationPartAsset.blobId
    ↓
IndexedDB imageBlobs[blobId] = Blob
```

Vorteile:

- Undo/Redo kopiert keine Bilder
- Metadaten bleiben klein
- Blobs können zwischen Projekt und Character Kit geteilt werden
- Vorschauen können getrennt neu erzeugt werden
- Import/Export kann Bilder gezielt streamen oder bündeln

## 5. IndexedDB

Empfohlener Datenbankname:

```text
pixelforge-studio
```

Version 1 Stores:

```text
animationProjects
animationPartAssets
animationImageBlobs
animationCharacterKits
animationPreviews
```

Key Paths:

```text
animationProjects.projectId
animationPartAssets.assetId
animationImageBlobs.blobId
animationCharacterKits.kitId
animationPreviews.previewId
```

Indizes:

```text
animationProjects.updatedAt
animationPartAssets.slot
animationPartAssets.direction
animationCharacterKits.updatedAt
```

Das Repository kapselt Upgrade, Transaktionen und Fehler:

```ts
interface AnimationRepository {
  listProjects(): Promise<readonly AnimationProjectSummary[]>;
  readProject(projectId: StableId): Promise<AnimationProjectReadResult>;
  createProject(input: unknown): Promise<AnimationMutationResult>;
  writeProject(input: unknown): Promise<AnimationMutationResult>;
  deleteProject(projectId: StableId): Promise<AnimationMutationResult>;

  readPartAsset(assetId: StableId): Promise<AnimationPartAssetReadResult>;
  writePartAsset(
    metadata: unknown,
    blob: Blob
  ): Promise<AnimationMutationResult>;
  deletePartAsset(assetId: StableId): Promise<AnimationMutationResult>;

  readBlob(blobId: StableId): Promise<Blob | null>;
  writePreview(projectId: StableId, blob: Blob): Promise<AnimationMutationResult>;

  listKits(): Promise<readonly CharacterKitSummary[]>;
  readKit(kitId: StableId): Promise<CharacterKitReadResult>;
  writeKit(input: unknown): Promise<AnimationMutationResult>;
}
```

## 6. Transaktionen

Verbindliche Regeln:

- Metadaten werden vor jeder Speicherung mit Zod validiert.
- Part-Metadaten und neuer Bildblob werden in einer gemeinsamen
  IndexedDB-Transaktion geschrieben.
- Löschen eines Projekts entfernt nicht unkontrolliert geteilte Kit-Blobs.
- Unreferenzierte Blobs werden über eine explizite Garbage-Collection-Funktion
  ermittelt.
- Import eines Bundles schreibt erst nach vollständiger Validierung.
- Ein fehlgeschlagener Import hinterlässt kein halbes Projekt.
- Schemafehler und Browser-/Quota-Fehler sind unterschiedliche Resultate.

Ergebnisunion:

```ts
type AnimationMutationResult =
  | Readonly<{ status: "ok" }>
  | Readonly<{
      status: "invalid";
      message: string;
      issues: readonly ValidationIssue[];
    }>
  | Readonly<{
      status: "conflict";
      message: string;
    }>
  | Readonly<{
      status: "unavailable";
      message: string;
    }>;
```

## 7. Autosave

- gültige Metadatenänderungen werden verzögert gespeichert
- bewusster Projektwechsel speichert sofort
- Import-/Hydration löst keinen Save aus
- ungültiger UI-Rohzustand bleibt temporär lokal und überschreibt kein
  gültiges Projekt
- Save-Status ist sichtbar
- Schließen/Navigation bei ungespeicherten Änderungen zeigt eine kontrollierte
  Warnung
- Browser-`beforeunload` ist nur eine letzte Schutzschicht

Empfohlene Zustände:

```text
idle
dirty
saving
saved
invalid
failed
```

## 8. Undo/Redo

Die History speichert nur Projektmetadaten beziehungsweise reversible Actions:

```ts
interface AnimationHistoryState {
  readonly past: readonly AnimationProject[];
  readonly present: AnimationProject;
  readonly future: readonly AnimationProject[];
}
```

Für größere Projekte ist ein Action-/Patch-Modell zulässig. Verbindlich:

- maximal konfigurierbare Historytiefe, Standard 100
- keine Blobs in History
- Autosave speichert nur `present`
- Import/Hydration setzt eine neue Baseline
- Undo nach Bildimport entfernt die Zuweisung, löscht aber den Blob erst durch
  sichere Referenzbereinigung
- Redo ist nach neuer Änderung geleert

## 9. Object URLs und Bilddekodierung

`URL.createObjectURL()` wird nur in einem Service/Hook verwendet. Jede URL wird
mit `URL.revokeObjectURL()` freigegeben.

Bilddekodierung hinter einem Port:

```ts
interface ImageDecoder {
  decode(blob: Blob): Promise<DecodedRgbaImage>;
}

interface DecodedRgbaImage {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8ClampedArray;
}
```

Die Domain erhält RGBA-Daten und kennt weder `HTMLImageElement` noch
`ImageBitmap`.

## 10. AppSettings-Erweiterung

Kompatible additive Felder:

```ts
startStudio: "home" | "prompt" | "animation";
animationStartView: "projects" | "workspace" | "library" | "rigs";
```

`startView` bleibt bestehen und bezeichnet die Prompt-Startansicht.

Alte Daten ohne neue Felder werden über Zod-Defaults gelesen. Neue Writes
enthalten die Felder. Bestehende ExportBundle-Tests erhalten zusätzliche
Fixtures für beide Formen. Die Implementierung und beide Import-/Export-
Regressionen wurden in Prompt 31 abgeschlossen; `schemaVersion: 2` bleibt
unverändert.

## 11. Projektbundle `.pfanim`

Container:

```text
<project-name>.pfanim
```

Technisch ZIP, Inhalt:

```text
manifest.json
project.json
parts/
  <assetId>.json
images/
  <blobId>.png
previews/
  project.png              optional
README.txt                 optional
```

`manifest.json`:

```json
{
  "application": "PixelForge Animation Studio",
  "formatVersion": 1,
  "kind": "animationProjectBundle",
  "exportedAt": "2026-09-04T12:00:00.000Z",
  "projectFile": "project.json"
}
```

Importregeln:

1. Dateinamen als untrusted behandeln.
2. Keine absoluten Pfade oder `..`.
3. Größen-/Dateianzahllimits vor vollständiger Verarbeitung prüfen.
4. `manifest.json` zuerst validieren.
5. Projekt und Part-Metadaten mit Zod validieren.
6. Blob-Referenzen vollständig auflösen.
7. IDs bei Konflikt wahlweise ersetzen oder als neues Projekt remappen.
8. Erst danach atomar in IndexedDB schreiben.

## 12. Größenlimits des MVP

Zentrale, getestete Konstanten:

```text
maximale einzelne Quelldatei:       16 MiB
maximale Quelldimension:             2048 × 2048 px
maximale Parts pro Projekt:          512
maximale Projekte im Bundle:         1
maximale entpackte Bundlegröße:       256 MiB
maximale Bundle-Dateianzahl:          2048
maximale Clips im MVP:                16
maximale Overrides pro Projekt:       10000
```

Limits werden sichtbar gemeldet und nicht nur durch Browserfehler erzwungen.

## 13. Rig-Kompatibilität

Ein deterministischer `rigCompatibilityKey` berücksichtigt mindestens:

```text
rigTemplateId
frameWidth
frameHeight
characterHeight
anchorContractVersion
requiredSlotContractVersion
directionContractVersion
```

Nicht berücksichtigen:

- Projektname
- Farbpalette
- einzelne Ausrüstung
- Zeitstempel
- Preview
- Promptprofil-ID

Dadurch können Character Kits nur in tatsächlich kompatible Projekte
eingesetzt werden.

## 14. Migration

Animationsschema V1 startet ohne ältere Animationsdaten. Trotzdem braucht jeder
Schema-Reader eine explizite Versionsgrenze:

- unbekannte neuere Version ablehnen
- ältere unterstützte Version über pure Migration transformieren
- niemals importierte Daten per Type Assertion übernehmen
- Migrationen idempotent testen
- Quelldaten vor destructive write sichern

Prompt-Studio-V2-Migration bleibt davon unberührt.
