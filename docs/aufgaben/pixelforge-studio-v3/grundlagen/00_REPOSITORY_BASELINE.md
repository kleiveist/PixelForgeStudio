<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# 00 — Verifizierte Repository-Baseline

Stand der Planung: 4. September 2026.

## Aktueller Remote- und Produktzustand

Die Planung wurde gegen das private Repository
`kleiveist/PixelartPromptStudio` auf dem Default-Branch `main` abgeglichen.

| Bereich | aktueller Zustand |
|---|---|
| GitHub-Repository | `kleiveist/PixelartPromptStudio` |
| `package.json` Name | `pixelforge-prompt-studio` |
| Paketversion | `2.0.0` |
| sichtbarer Produktname | `PixelForge Prompt Studio` |
| Kurzname | `PixelForge` |
| UI-Stack | React, TypeScript, Vite |
| Formulare | React Hook Form |
| Validierung | Zod |
| Tests | Vitest, React Testing Library, jsdom |
| Backend | keines |
| Python | nicht Teil der Haupt-App |

Relevante aktuelle Dateien:

```text
AGENTS.md
README.md
package.json
src/config/brand.ts
src/domain/navigation/appView.ts
src/app/appViewConfig.ts
src/app/App.tsx
src/app/AppShell.tsx
src/schemas/appSettings.schema.ts
src/schemas/exportBundle.schema.ts
src/services/storageAdapter.ts
src/features/character-editor/CharacterAnimationEditor.tsx
src/ARCHITECTURE.md
docs/TECHNOLOGIE-STACK-V2.md
docs/aufgaben/pixelforge-studio-v3/START_HERE.md
```

## Aktuelle Navigation

Die bestehende Anwendung besitzt sechs Prompt-Studio-Views:

```text
dashboard
profiles
wizard
review
output
settings
```

Die URL wird derzeit über `?view=…` gesteuert. Diese URLs müssen nach dem Umbau
weiter funktionieren. Die neue kanonische Route wird module-aware, alte
Lesezeichen werden aber auf das Prompt Studio abgebildet.

## Aktuelle Einstellungen

`AppSettingsSchema` ist ein striktes Schema der Version 2 und verlangt unter
anderem:

```text
theme
locale
startView
activeBaseProfileId
updatedAt
```

`startView` ist bisher eine der sechs Prompt-Views. Die Erweiterung darf alte
gespeicherte Settings oder Export-Bundles nicht ablehnen. Die Planung behält
`startView` als Prompt-Startansicht bei und ergänzt additive Felder für das
Dachprodukt.

## Aktuelle Persistenz und Exportkompatibilität

Bestehende Prompt-Daten verwenden unter anderem:

```text
pixelforge:v2:settings
pixelforge:v2:base-profiles
pixelforge:v2:category-profiles
pixelforge:v2:asset-profiles
pixelforge:v2:draft
pixelforge:v2:migration-backup
```

Diese Schlüssel bleiben unverändert.

In `src/config/brand.ts` ist der sichtbare Markenname von einem absichtlich
stabilen Export-Identifier getrennt. Der Wert

```text
PixelForge Prompt Studio
```

ist im bestehenden `ExportBundleSchema` als Protokolldiskriminator verankert.
Er darf beim visuellen Rebranding nicht verändert werden. Empfehlenswert ist:

```ts
export const PROMPT_EXPORT_APPLICATION_ID =
  "PixelForge Prompt Studio" as const;

export const EXPORT_APPLICATION_ID =
  PROMPT_EXPORT_APPLICATION_ID;
```

Neue Animationspakete erhalten einen eigenen Identifier und eine eigene
Formatversion.

## Aktuelle Animationsfunktion im Prompt Studio

Der vorhandene Character-Editor beschreibt nur die gewünschte
Produktionsausgabe:

- Aktionen wie Idle, Walk, Run oder Attack auswählen
- Frameanzahl je Aktion festlegen
- 4 oder 8 Richtungen capability-gesteuert auswählen

Er lädt keine PNG-Körperteile, besitzt kein Rig und rendert keine Frames. Diese
Funktion bleibt im Prompt Studio erhalten und wird später als Quelle für einen
Animationsprojekt-Seed verwendet.

## Konsequenzen für die Erweiterung

1. Das Prompt Studio wird nicht neu geschrieben.
2. Die vorhandene Prompt-Domain bleibt frameworkfrei und kompatibel.
3. Das Animation Studio erhält eigene Domain-, Schema-, Service-, Store- und
   Feature-Grenzen.
4. Große Binärdaten werden nicht in die vorhandenen synchronen
   `localStorage`-Adapter gedrückt.
5. Alte Prompt-Routen, Settings, Profile und Export-Bundles bleiben lesbar.
6. Der Umbau beginnt mit dem Dachprodukt und nicht mit einer parallelen zweiten
   Anwendung.
7. Die neue Promptserie setzt nach dem abgeschlossenen Prompt 27 mit Prompt 28
   fort.
