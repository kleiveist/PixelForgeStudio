<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# 02 — Zielarchitektur von PixelForge Studio

## Umsetzungsstand

Die modulbasierte Route, ihre Browser-History-Grenze und der zugehörige
Provider wurden mit Prompt 29 umgesetzt. Prompt 30 ergänzte die sichtbare
globale Studio-Shell, die produktive Prompt-Modulfläche und die vier bewusst
fachlogikfreien Animation-Platzhalter. Prompt 31 vervollständigte Phase A mit
der produktiven Home-Fläche sowie kompatiblen, getrennten Startzielen.

## Leitprinzip

PixelForge Studio ist **eine Anwendung mit zwei Modulen**, nicht zwei
unabhängige Apps und nicht ein React-Frontend mit verpflichtendem
Python-Nebenprozess.

```text
PixelForge Studio
├── globale Studio-Shell
│   ├── Brand
│   ├── Modulumschaltung
│   ├── Theme
│   └── Startseite
├── Prompt Studio
│   └── bestehende V2-Funktionen
└── Animation Studio
    ├── Projekte
    ├── Workspace
    ├── Körperteilbibliothek
    └── Rig-Vorlagen
```

## Schichten

```text
React UI
  ↓
Feature Controller / Hooks
  ↓
Context + Reducer
  ↓
frameworkfreie TypeScript-Domain
  ↓
Schema- und Service-Ports
  ↓
localStorage / IndexedDB / Datei-Export
```

Verbindlich:

- Domain importiert weder React noch Browser-DOM.
- Schemas akzeptieren persistierte oder importierte Daten als `unknown`.
- Komponenten greifen weder direkt auf `localStorage` noch direkt auf
  IndexedDB zu.
- Binärdaten werden nicht in Reducern oder URL-State gehalten.
- Rendergeometrie und Rasterkomposition sind pure TypeScript-Funktionen.
- Die sichtbare Canvas-Schicht ist austauschbar und nicht die alleinige
  Quelle der Wahrheit.

## Vorgeschlagene Quellstruktur

```text
src/
├── app/
│   ├── App.tsx
│   ├── StudioShell.tsx
│   ├── StudioHomeView.tsx
│   ├── studioViewConfig.ts
│   └── modules/
│       ├── PromptStudioShell.tsx
│       └── AnimationStudioShell.tsx
│
├── components/
│   ├── navigation/
│   │   ├── StudioLink.tsx
│   │   ├── StudioSwitcher.tsx
│   │   └── ModuleNavigation.tsx
│   └── ...
│
├── domain/
│   ├── navigation/
│   │   ├── studioRoute.ts
│   │   └── ...
│   ├── animation/
│   │   ├── animation.types.ts
│   │   ├── directions.ts
│   │   ├── slots.ts
│   │   ├── matrices.ts
│   │   ├── anchors.ts
│   │   ├── placement.ts
│   │   ├── rigTemplate.ts
│   │   ├── humanoidRig80.ts
│   │   ├── walkClip.ts
│   │   ├── directionProjection.ts
│   │   ├── layerOrder.ts
│   │   ├── coverage.ts
│   │   ├── renderer.ts
│   │   ├── spriteSheet.ts
│   │   └── index.ts
│   └── ...
│
├── features/
│   ├── animation-projects/
│   │   ├── AnimationProjectsView.tsx
│   │   └── ...
│   ├── animation-studio/
│   │   ├── AnimationStudioView.tsx
│   │   ├── AnimationWorkspace.tsx
│   │   ├── PartInventory.tsx
│   │   ├── RigViewport.tsx
│   │   ├── RigOverlay.tsx
│   │   ├── PartInspector.tsx
│   │   ├── DirectionCoverage.tsx
│   │   ├── FrameTimeline.tsx
│   │   ├── PlaybackControls.tsx
│   │   └── ExportPanel.tsx
│   ├── animation-library/
│   │   ├── CharacterKitLibraryView.tsx
│   │   └── ...
│   └── bestehende Prompt-Features
│
├── schemas/
│   ├── animationProject.schema.ts
│   ├── animationKit.schema.ts
│   ├── animationBundle.schema.ts
│   └── ...
│
├── services/
│   ├── animation/
│   │   ├── animationRepository.ts
│   │   ├── browserAnimationRepository.ts
│   │   ├── imageDecoder.ts
│   │   ├── browserImageDecoder.ts
│   │   ├── animationExportAdapter.ts
│   │   ├── projectBundleAdapter.ts
│   │   └── godotExportAdapter.ts
│   └── bestehende Prompt-Services
│
├── store/
│   ├── studio/
│   │   ├── StudioNavigationProvider.tsx
│   │   └── studioNavigationState.ts
│   ├── animation/
│   │   ├── AnimationProjectProvider.tsx
│   │   ├── animationProjectState.ts
│   │   └── animationHistory.ts
│   └── bestehende Stores
│
├── workers/
│   ├── animationExport.worker.ts
│   └── workerProtocol.ts
│
└── test/
    ├── animationFixtures.ts
    ├── memoryAnimationRepository.ts
    └── ...
```

Die genaue Aufteilung darf sich während der Umsetzung leicht verändern. Die
öffentlichen Modulgrenzen und Abhängigkeitsrichtung dürfen sich nicht
verwischen.

## Navigation und URLs

### Neue kanonische Routen

```text
?studio=home
?studio=prompt&view=dashboard
?studio=prompt&view=profiles
?studio=prompt&view=wizard
?studio=prompt&view=review
?studio=prompt&view=output
?studio=prompt&view=settings
?studio=animation&view=projects
?studio=animation&view=workspace&project=<id>
?studio=animation&view=library
?studio=animation&view=rigs
```

Die Projekt-ID wird nur dann in die URL geschrieben, wenn sie als stabile,
validierte ID vorliegt. Rohdaten und Dateipfade gehören nicht in die URL.

### Bestehende Prompt-Routen

```text
?view=dashboard
?view=profiles
?view=wizard
?view=review
?view=output
?view=settings
```

werden als Prompt-Studio-Routen interpretiert. Der Navigation-Adapter darf sie
nach erfolgreichem Parsing mit `replaceState` kanonisieren, ohne einen
zusätzlichen Browser-History-Eintrag zu erzeugen.

### Domainmodell

```ts
export const STUDIO_IDS = [
  "home",
  "prompt",
  "animation"
] as const;

export const PROMPT_STUDIO_VIEW_IDS = [
  "dashboard",
  "profiles",
  "wizard",
  "review",
  "output",
  "settings"
] as const;

export const ANIMATION_STUDIO_VIEW_IDS = [
  "projects",
  "workspace",
  "library",
  "rigs"
] as const;

export type StudioRoute =
  | Readonly<{ studio: "home" }>
  | Readonly<{
      studio: "prompt";
      view: PromptStudioView;
    }>
  | Readonly<{
      studio: "animation";
      view: Exclude<AnimationStudioView, "workspace">;
    }>
  | Readonly<{
      studio: "animation";
      view: "workspace";
      projectId?: StableId;
    }>;
```

Parser und Serializer sind pure Funktionen und besitzen Tests für:

- neue gültige Routen,
- alte Prompt-Routen,
- doppelte Query-Parameter,
- unbekannte Studios,
- unbekannte Views,
- Projekt-ID nur im Workspace,
- Erhalt fremder, nicht konfliktbehafteter Query-Parameter,
- Browser-Zurück/Vorwärts.

## Settings-Kompatibilität

Die bestehende `schemaVersion: 2` bleibt erhalten. Statt `startView` zu
entfernen, werden Felder additiv ergänzt:

```ts
startStudio: "home" | "prompt" | "animation";
startView: PromptStudioView;
animationStartView: AnimationStudioView;
```

Die neuen Felder besitzen Zod-Defaults:

```text
startStudio: home
startView: dashboard
animationStartView: projects
```

Damit bleiben ältere gespeicherte Settings und Export-Bundles lesbar.
`startView` behält seine bestehende Bedeutung als Prompt-Startansicht.

Eine pure Funktion erzeugt daraus die Startdestination:

```ts
resolveStudioStartRoute(settings): StudioRoute
```

Dieser Vertrag ist seit Prompt 31 umgesetzt. Die Settings-Oberfläche schreibt
alle drei Entscheidungen ausschließlich über den SettingsProvider. Ein
Workspace-Start erzeugt weder eine Projekt-ID noch öffnet er automatisch ein
zuletzt verwendetes Projekt.

## Zustandsgrenzen

### Global

`StudioNavigationProvider` besitzt nur:

- aktive kanonische Route,
- Navigationsergebnis,
- Browsernavigation,
- Fokuswechsel nach View-Wechsel.

### Prompt Studio

Bestehende Provider bleiben Eigentümer ihrer bisherigen Daten:

- Settings
- Profilbibliothek
- Wizard-Session
- Prompt-Ausgabe

Es entsteht keine zweite Prompt-State-Quelle.

### Animation Studio

`AnimationProjectProvider` besitzt:

- aktive Projekt-ID,
- geladenes validiertes Projekt-Metadatenmodell,
- Save-/Autosave-Status,
- Ladefehler,
- Metadaten-History für Undo/Redo,
- selektierten Slot, Frame und Richtung als lokalen Workspace-State.

PNG-Blobs werden über Repository-Referenzen geladen. Sie werden nicht bei
jeder Reducer-Aktion kopiert.

## Persistenzgrenzen

```text
bestehende Promptdaten
└── V2StorageAdapter → localStorage

Animationsprojekte und Bilder
└── AnimationRepository → IndexedDB

Exportdateien
└── AnimationExportAdapter → Blob/Download

Projektpakete
└── ProjectBundleAdapter → ZIP/Import
```

Das Animation Repository ist asynchron. React-Komponenten arbeiten über
Controller/Provider und dürfen nicht voraussetzen, dass Speichern synchron
erfolgt.

## Rendering

### Quelle der Wahrheit

Ein Frame entsteht aus:

```text
RigTemplate
+ DirectionRig
+ CharacterKit / PartAssets
+ AnimationClip
+ FrameOverrides
+ DirectionOverrides
+ DrawOrder
```

### Pipeline

```text
validierte Projektmetadaten
→ Pose aus Clip bestimmen
→ Richtung projizieren
→ Bone-/Joint-Transformationen berechnen
→ Part-Transformationen berechnen
→ draw order bestimmen
→ nearest-neighbor affine Rasterkomposition
→ RGBA-Frame
→ Canvas-Vorschau oder PNG/SpriteSheet
```

Die finale Rasterkomposition ist eine pure TypeScript-Funktion. Eine
DOM-Canvas-Implementierung darf nur Anzeige, Dekodierung und PNG-Encoding
übernehmen. Dadurch sind Pixeltests ohne Browser möglich.

### Worker

Der MVP darf zunächst synchron kleine Einzelbilder rendern. Bevor der
vollständige 64-Frame-Export freigegeben wird, wird die Batcharbeit hinter ein
Worker-Protokoll verschoben:

```text
renderFrames
renderSpriteSheet
cancelJob
progress
completed
failed
```

Die UI bleibt während des Exports bedienbar.

## Abhängigkeiten

Weiterhin verbindlich:

- React
- TypeScript
- Vite
- React Hook Form
- Zod
- Context + Reducer
- CSS Modules
- Vitest/RTL/jsdom

Neu zulässig:

- native IndexedDB
- Web Worker
- Canvas 2D für Anzeige und Encoding
- eine kleine, begründete ZIP-Bibliothek für `.pfanim`-Pakete, vorzugsweise
  `fflate`

Nicht ohne eigenen Architekturentscheid:

- Konva/Fabric/Pixi
- Redux/Zustand/MobX
- Backend
- Python-Runtime
- WebGL-Engine
- KI-Service
- Cloudspeicherung

## Prompt-zu-Animation-Übergabe

Das Prompt Studio liefert keine fertigen PNGs. Die Integration erzeugt nur
einen validierten Projekt-Seed:

```ts
interface AnimationProjectSeed {
  readonly sourcePromptProfileId: StableId;
  readonly displayName: string;
  readonly characterHeight: number;
  readonly directionCount: 4 | 8;
  readonly requestedClips: readonly {
    action: CharacterAnimationActionId;
    frames: number;
  }[];
  readonly baseCompatibilityKey: string;
}
```

Das Animation Studio fordert danach die passenden Körperteilbilder an. Prompt-
und Animationsdaten bleiben über stabile IDs nachvollziehbar, aber nicht
zyklisch voneinander abhängig.
