# PixelForge Prompt Studio — Codex V2 React/TypeScript Paket ⚙️

Dieses Paket enthält zwei Dinge:

1. die **funktionsfähige Legacy-V1** als Referenz und sichere Migrationsquelle,
2. den **verbindlichen V2-Codex-Bauplan** für die Migration auf React + TypeScript + Vite.

Die Legacy-V1 ist **nicht** die Zieltechnologie. Neue V2-Funktionalität wird nicht mehr in Vanilla JavaScript entwickelt.

## Verbindlicher V2-Stack

| Bereich | Technologie |
|---|---|
| Sprache | TypeScript (`strict`) |
| UI | React |
| Dev/Build | Vite |
| Paketmanager | npm |
| Formulare | React Hook Form |
| Validierung | Zod |
| Globaler Zustand | React Context + `useReducer` |
| Speicherung | localStorage + JSON Import/Export |
| Styling | CSS Modules + CSS Custom Properties |
| Icons | eigene SVG-React-Komponenten |
| Tests | Vitest + React Testing Library + jsdom |
| Backend | keines |
| Python | nicht Teil der Haupt-App |
| PWA | spätere optionale Erweiterung |
| Tauri 2 | spätere optionale Desktop-Erweiterung |

Details: `docs/TECHNOLOGIE-STACK-V2.md`.

## Warum die Legacy-V1 noch enthalten ist

Codex soll bestehende Promptregeln, Presets, Speicherformate und technische Berechnungen nicht neu erfinden oder versehentlich verlieren. Deshalb bleibt die bestehende Anwendung bis zur bestätigten V2-Feature-Parität im Repository.

Die Migration läuft kontrolliert:

```text
V1 inventarisieren
→ React/TS/Vite aufsetzen
→ Fachlogik nach TypeScript portieren
→ V2-Datenmodell + Migration
→ neues Dashboard/Wizard/Editormodell
→ Prompt Engine 2.0
→ Release-Abnahme
→ Legacy-UI erst danach entfernen
```

## Dokumente für Codex

| Datei | Zweck |
|---|---|
| `AGENTS.md` | verbindliche Repository-Regeln und Produktdefaults |
| `PLANS.md` | 29-stufiger Migrations- und Entwicklungsfahrplan |
| `docs/TECHNOLOGIE-STACK-V2.md` | verbindlicher React/TypeScript/Vite-Stack |
| `docs/CODEX-V2-UMSETZUNGSANWEISUNG.md` | Architektur, Migration, Editoren, Prompt Engine, Tests |
| `docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md` | vollständige fachliche Fragen- und Profilstruktur |
| `docs/CODEX-V2-PROMPTS.md` | einzeln ausführbare Codex-Aufträge 00–27 |
| `docs/PROMPT-SPECIFICATION.md` | bestehende Prompt-Spezifikation |
| `v2-template/` | Referenz für Zielabhängigkeiten und `src/`-Architektur |

## Wichtigste Produktregeln

| Regel | V2-Vorgabe |
|---|---|
| Perspektive | frontale schräge 3/4-RPG-Draufsicht als Default |
| Projektion | orthografisch |
| Tile-Raster | 32 × 32 px Default |
| Figurenhöhe | ca. 80 px Default |
| Pixelstil | Modern-HD Pixelart |
| Hintergrund | transparent als Default |
| Outline | weich und selektiv |
| Richtungen | **4/8 nur bei directional beweglichen Assets** |
| Animation | eigene Capability, unabhängig von Richtungen |
| Stilprofile | klassische geerdete Fantasy / düstere geerdete Fantasy |
| Licht | kontextabhängig nach innen/außen, Tag/Nacht, Stimmung |
| Ausgabe | Hauptprompt, Negativprompt, technische Spezifikation, kombiniert |

## Profilhierarchie

```text
BaseProfile
└── CategoryProfile
    └── AssetProfile
```

Ein `BaseProfile` trägt globale technische Produktionswerte und Locks. Dadurch bleiben beispielsweise alle NPC-Profile einer **80-px-Figurenfamilie** technisch konsistent. Ein Wechsel auf 96 px wird nicht still in einem einzelnen NPC-Prompt vorgenommen, sondern über einen bewussten Profilwechsel oder eine Duplikation.

Ein deterministischer `compatibilityKey` gruppiert Profile nach tatsächlich relevanten Produktionsparametern. Eine Holztextur wird beispielsweise nicht anhand einer irrelevanten Figurenhöhe getrennt.

## Dashboard-Kategorien

- Charakter / Figur
- bewegliches Objekt
- statisches Objekt
- Textur / Material
- Natur / Pflanze / Baum
- Gebäude / Architektur
- Tileset / Kartenelement
- Item / Ausrüstung
- Artwork / Konzeptbild

Der Wizard fragt die Hauptkategorie zuerst ab. Danach werden nur passende Fragen und Editoren geladen.

## Spezialisierte Editoren

Geplant sind getrennte React-Features für:

- Character/NPC
- Moving Object
- Static Object
- Texture/Material
- Nature/Tree
- Building
- Tileset
- Item/Equipment
- Artwork

Damit erhält eine Holztextur keine NPC-Fragen und ein normaler Baum keine 8-Richtungs-Auswahl. Ein Windbaum kann trotzdem animiert werden, weil `animated` und `directional` getrennt modelliert werden.

## Start mit Codex

Beginne mit:

```text
docs/CODEX-V2-PROMPTS.md
→ Prompt 00 — Legacy-Baseline inventarisieren
```

Danach immer genau:

```text
Aufgabe → implementieren → testen → Diff prüfen → committen → nächste Aufgabe
```

Prompt 01 richtet das echte React/TypeScript/Vite-Projekt ein.

## Legacy-V1 lokal prüfen

Die Root-`package.json` gehört aktuell noch zur Legacy-Baseline. Bis Prompt 01 ausgeführt wurde, funktionieren die bisherigen V1-Befehle weiter:

```bash
npm run dev
npm run verify
```

Nach Prompt 01 wird die Root-Konfiguration auf den neuen Vite-/TypeScript-Testworkflow migriert.

## Zielbefehle nach Prompt 01

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run test:run
npm run build
npm run verify
```

## V2-Zielstruktur

```text
src/
├── app/
├── components/
├── domain/
├── features/
├── schemas/
├── services/
├── store/
├── styles/
└── test/
```

Die Prompt-Engine und Profilauflösung bleiben frameworkfreies TypeScript. React übernimmt Darstellung und Benutzerinteraktion.

## Datenschutz

V2 bleibt lokal. Es ist kein Backend vorgesehen. Profile und Entwürfe werden im Browser gespeichert und können als JSON importiert/exportiert werden.

## Lizenz

MIT, siehe `LICENSE`.
