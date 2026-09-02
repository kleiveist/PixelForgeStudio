# PixelForge Prompt Studio — Codex V2 React/TypeScript Paket ⚙️

<!-- PYGINDEX:README START -->
## Dokumentation
- [Dokumentationsübersicht](docs/index.md)

## Projektdateien
- [AGENTS.md — PixelForge Prompt Studio V2](AGENTS.md)
- [Changelog](CHANGELOG.md)
- [PixelForge Prompt Studio V2 — React/TypeScript-Ausführungsplan](PLANS.md)
<!-- PYGINDEX:README END -->

Dieses Repository enthält drei aufeinander abgestimmte Bereiche:

1. das aktive **V2-Grundgerüst mit React, TypeScript und Vite**,
2. die eingefrorene **Legacy-V1 unter `legacy/v1/`** als ausführbare Migrationsquelle,
3. den **verbindlichen V2-Codex-Bauplan** für die schrittweise Produktmigration.

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

Codex soll bestehende Promptregeln, Presets, Speicherformate und technische Berechnungen nicht neu erfinden oder versehentlich verlieren. Deshalb bleibt die bestehende Anwendung bis zur bestätigten V2-Feature-Parität unter `legacy/v1/` ausführbar und getestet.

Die Migration läuft kontrolliert:

```text
V1 inventarisieren ✓
→ React/TS/Vite aufsetzen ✓
→ Fachlogik nach TypeScript portieren ✓
→ Kategorien und Capabilities typisieren ✓
→ V2-Datenverträge mit Zod absichern ✓
→ Profilvererbung, Locks und Compatibility Key ✓
→ validierte Speicherung + Migration ✓
→ Brand, Design Tokens und Light/Dark/System ✓
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
| `docs/LEGACY-V1-BASELINE.md` | reproduzierbare V1-Inventur, Migrationsverträge und bewusste V2-Korrekturen |
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

## Aktueller Migrationsstand

Prompt 00 bis Prompt 07 sind abgeschlossen. Die nächste einzeln auszuführende
Phase ist:

```text
docs/CODEX-V2-PROMPTS.md
→ Prompt 08 — App Shell und Navigation
```

Danach immer genau:

```text
Aufgabe → implementieren → testen → Diff prüfen → committen → nächste Aufgabe
```

Das Root-Projekt ist bereits die aktive Vite-/React-/TypeScript-Anwendung. Die
aktuelle App-Shell zeigt bereits das neue visuelle Fundament und den lokal
persistierten Light-/Dark-/System-Umschalter; Navigation, Dashboard, Wizard und
Fachlogik für die Produktoberfläche folgen erst in ihren vorgesehenen Phasen.

## Legacy-V1 lokal prüfen

Die eingefrorene V1 bleibt separat ausführbar:

```bash
npm run check:legacy
npm run test:legacy
npm run dev:legacy
npm run build:legacy
```

Details: `legacy/v1/README.md` und `docs/LEGACY-V1-BASELINE.md`.

## Entwicklung und Prüfung

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run test:run
npm run build
npm run verify
```

Voraussetzung: Node.js 20.19+ beziehungsweise 22.12+ und npm 10+.

## V2-Zielstruktur

```text
src/
├── app/
├── components/
├── config/
├── domain/
├── features/
├── schemas/
├── services/
├── store/
├── styles/
└── test/
```

Die Prompt-Engine und Profilauflösung bleiben frameworkfreies TypeScript. React übernimmt Darstellung und Benutzerinteraktion.

Die bytegenau kompatible V1-Fachlogik ist bereits unter
`src/domain/legacy-v1/` portiert. Sie bleibt klar namespaced, damit kommende
V2-Regeln das historische Migrationsverhalten nicht unbemerkt verändern.

Das V2-Capability-System unter `src/domain/assets/` trennt Bewegung,
Richtungsansichten und Animation. Die UI kann dadurch 4/8 Richtungen nur für
tatsächlich `directional` Assets anbieten.

Alle persistierten V2-Kernverträge liegen unter `src/schemas/`. Base-,
Kategorie- und Assetprofile, Einstellungen, Wizard-Entwürfe und Exportpakete
werden dort aus `unknown` mit Zod geparst; ihre TypeScript-Typen werden direkt
aus den Schemas abgeleitet.

Die öffentliche Profilauflösung unter `src/domain/profiles/` führt validierte
Base-, Kategorie- und Assetprofile zusammen. Sie setzt Locks durch, meldet
Referenz- und Override-Konflikte strukturiert und berechnet den versionierten
Compatibility Key neu. Gespeicherte oder importierte Keys werden nicht als
vertrauenswürdige Quelle verwendet; Figurenhöhe fließt ausschließlich bei
`scaledCharacter` ein.

Die öffentliche Persistenz- und Transfergrenze liegt unter `src/services/`.
Alle V2-Namespaces werden über einen injizierbaren Adapter gelesen und vor dem
Schreiben mit Zod validiert. Korrupte oder nicht verfügbare Browser-Speicher
erzeugen strukturierte Ergebnisse statt Abstürze. Die V1-Migration legt vor
jedem Parse ein unverändertes Rohdaten-Backup an, kann vorbereitete Läufe
deterministisch fortsetzen und lässt die ursprünglichen V1-Keys bestehen.
JSON-Pakete prüfen Referenzen und Compatibility Keys; ID-Konflikte werden ohne
explizite Ersetzungsentscheidung nicht überschrieben.

Die zentrale Markenidentität liegt unter `src/config/`, die pure
Theme-Auflösung unter `src/domain/theme/` und der globale Settings-State unter
`src/store/settings/`. Die gespeicherte Präferenz kann `light`, `dark` oder
`system` sein; am Dokument-Root steht immer nur das wirksame
`data-theme="light|dark"`. Systemänderungen werden live übernommen, ohne die
gespeicherten App-Einstellungen zu verändern.

## Datenschutz

V2 bleibt lokal. Es ist kein Backend vorgesehen. Profile und Entwürfe werden im Browser gespeichert und können als JSON importiert/exportiert werden.

## Lizenz

MIT, siehe `LICENSE`.
