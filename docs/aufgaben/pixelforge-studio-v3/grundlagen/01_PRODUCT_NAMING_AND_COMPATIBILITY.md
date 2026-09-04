<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# 01 — Produktnamen, Versionierung und Kompatibilität

> **Umsetzungsstatus:** Der Repository- und Dachproduktname wurde mit Prompt 28
> auf `kleiveist/PixelForgeStudio` beziehungsweise `PixelForge Studio`
> umgestellt. Die folgenden Kompatibilitätsverträge bleiben weiterhin bindend.

## Kanonische Produktstruktur

```text
PixelForge Studio
├── PixelForge Prompt Studio
└── PixelForge Animation Studio
```

In kompakten UI-Elementen werden die Module als **Prompt Studio** und
**Animation Studio** bezeichnet. Der Markenname wird ohne Leerzeichen
geschrieben: `PixelForge`.

## Zielnamen

| Gegenstand | Zielwert |
|---|---|
| GitHub-Repository | `kleiveist/PixelForgeStudio` |
| npm-Paket | `pixelforge-studio` |
| Dachprodukt | `PixelForge Studio` |
| Prompt-Modul | `PixelForge Prompt Studio` |
| Animationsmodul | `PixelForge Animation Studio` |
| Browser-Titel Startseite | `PixelForge Studio` |
| Browser-Titel Prompt | `<View> · Prompt Studio · PixelForge` |
| Browser-Titel Animation | `<View> · Animation Studio · PixelForge` |
| finale SemVer | `3.0.0` |

## Versionsebenen bleiben getrennt

Die Produktversion, Daten-Schemaversion und Exportformatversion sind
unterschiedliche Dinge:

```text
Produktversion:                 3.0.0
bestehende Prompt-Schemaversion: 2
bestehende Prompt-Formatversion: 2
Animationsprojekt-Schemaversion: 1
Animationsbundle-Formatversion:  1
```

Ein Major-Release des Produkts erzwingt keine künstliche Migration aller
Promptdaten.

## Kompatibilitätsverträge

Folgende Werte dürfen nicht still geändert werden:

```text
EXPORT_APPLICATION_ID = "PixelForge Prompt Studio"
pixelforge:v2:settings
pixelforge:v2:base-profiles
pixelforge:v2:category-profiles
pixelforge:v2:asset-profiles
pixelforge:v2:draft
pixelforge:v2:migration-backup
schemaVersion: 2 für bestehende Promptdaten
formatVersion: 2 für bestehende Prompt-Export-Bundles
```

Die visuelle Dachmarke wird von diesen Protokollwerten getrennt:

```ts
export const BRAND = Object.freeze({
  productName: "PixelForge Studio",
  shortName: "PixelForge",
  versionLabel: "V3",
  modules: {
    prompt: {
      productName: "PixelForge Prompt Studio",
      shortLabel: "Prompt Studio"
    },
    animation: {
      productName: "PixelForge Animation Studio",
      shortLabel: "Animation Studio"
    }
  }
} as const);

export const PROMPT_EXPORT_APPLICATION_ID =
  "PixelForge Prompt Studio" as const;

export const ANIMATION_EXPORT_APPLICATION_ID =
  "PixelForge Animation Studio" as const;

// Rückwärtskompatibler öffentlicher Alias:
export const EXPORT_APPLICATION_ID =
  PROMPT_EXPORT_APPLICATION_ID;
```

`versionLabel: "V3"` wird erst im finalen Release-Prompt gesetzt. Während der
Umsetzung darf eine sichtbare `Studio Preview`-Kennzeichnung verwendet werden.

## Repository-Umbenennung

Der administrative Zielvorgang lautet sinngemäß:

```bash
gh repo rename PixelForgeStudio \
  --repo kleiveist/PixelartPromptStudio \
  --yes
```

Danach muss die lokale `origin`-URL auf den neuen Namen zeigen. Das verwendete
Protokoll — SSH oder HTTPS — wird beibehalten.

Prüfung:

```bash
git remote -v
gh repo view kleiveist/PixelForgeStudio
```

Wenn die Umgebung keine Adminrechte oder keine authentifizierte GitHub CLI
besitzt, darf sie den Remote-Schritt nicht simulieren. Alle lokalen
Rebranding-Änderungen werden trotzdem abgeschlossen und der exakte fehlende
Adminschritt wird im Abschlussbericht genannt.

## Dokumentationsstrategie

Historische V2-Dateinamen müssen nicht massenhaft verschoben werden. Sie werden
als Spezifikation des **Prompt-Studio-Moduls** kenntlich gemacht. Neue
Dachdokumentation kommt additiv hinzu. Dadurch bleiben:

- historische Links,
- Git-Diff-Historie,
- V2-Migrationsnachweise,
- und bisherige Codex-Prompts

verständlich.

## Nicht umbenennen

- stabile IDs gespeicherter Profile
- bestehende Storage-Namespaces
- vorhandene Schema- oder Formatversionen
- bestehende Migrationsfixtures
- alte Commitnachrichten
- historische Changelog-Einträge
- öffentliche Kompatibilitäts-Exports ohne Alias
