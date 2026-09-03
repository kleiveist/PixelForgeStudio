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
→ App Shell, sechs Views und Browsernavigation ✓
→ kategoriebasiertes Dashboard und lokales Icon-System ✓
→ kategorisierte Profilbibliothek und sicheres Assetprofil-CRUD ✓
→ geführte RHF/Zod-Wizard-Engine mit Autosave und Resume ✓
→ Capability-gesteuertes Kategorie-Routing und dynamische Fragen ✓
→ Basisprofilwahl, Vererbung, Locks, Anlage und Duplikation ✓
→ Character-/NPC-Editor mit Aktions- und Frame-Modell ✓
→ Moving-Object-Editor mit Produktions- und Sequenzmodell ✓
→ weitere spezialisierte Editormodelle
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

Der Wizard fragt zuerst Projekt, Hauptkategorie und Untertyp ab. Danach wird
eine Produktionsfamilie gewählt oder angelegt; erst anschließend erscheinen
die zur Capability passenden Fragen und Editoren.

## Spezialisierte Editoren

Character-/NPC- und Moving-Object-Editor sind als getrennte React-Features
umgesetzt. Weitere geplante Features sind:

- Static Object
- Texture/Material
- Nature/Tree
- Building
- Tileset
- Item/Equipment
- Artwork

Der Character-Schritt folgt unmittelbar auf die Basisprofilwahl und erscheint
nur für Figuren-Untertypen. Er gruppiert Identität, Körper, Gesicht,
Kleidung, Ausrüstung, Material, Palette und Lesbarkeit; NPC-Kontextfelder und
humanoide Kleidung werden zusätzlich nach Untertyp eingeblendet. Die wirksame
Figurenhöhe bleibt ein read-only Wert der Profilkette mit sichtbarer Quelle und
Lock-Status und wird nicht als Figurenantwort dupliziert.

Damit erhält eine Holztextur keine NPC-Fragen und ein normaler Baum keine
8-Richtungs-Auswahl. Ein Windbaum kann trotzdem animiert werden, weil
`animated` und `directional` getrennt modelliert werden. Bei Figuren erscheint
die 4/8-Auswahl nur mit `directional`; Animationen bleiben ein eigener Schritt
mit eindeutigen Aktionen und jeweils 1 bis 8 Frames. Walk startet bei einer
Neuauswahl mit 5 Frames.

Der eigene `movingObjectDetails`-Schritt folgt für bewegliche Nicht-Figuren
ebenfalls direkt auf die Basisprofilwahl. Er erfasst Objektklasse, Zweck,
Grundform, Beschreibung, Tile-Footprint (je Achse 1–64), Höhe (16–2048 px),
Anker, Bewegungsart, Mechanik, Material, Zustand sowie Licht- und
Schattenverhalten. Animationen werden davon getrennt als eindeutige,
kanonisch sortierte `animationSequences` mit 1 bis 16 Frames je Sequenz
gespeichert. Bestehende Ein-Sequenz-Daten bleiben beim Lesen kompatibel.
Ein Karren kann dadurch Richtungen und Animation besitzen; ein pulsierender
schwebender Kristall bleibt animiert, erhält aber keine Richtungsfrage.

## Aktueller Migrationsstand

Prompt 00 bis Prompt 15 sind abgeschlossen. Die nächste einzeln auszuführende
Phase ist:

```text
docs/CODEX-V2-PROMPTS.md
→ Prompt 16 — Texture/Material Editor
```

Danach immer genau:

```text
Aufgabe → implementieren → testen → Diff prüfen → committen → nächste Aufgabe
```

Das Root-Projekt ist bereits die aktive Vite-/React-/TypeScript-Anwendung. Die
persistente App-Shell stellt Dashboard, Profile, Wizard, Prüfung, Ausgabe und
Einstellungen als typisierte Ansichten bereit. Nutzerwechsel laufen ohne
Reload über `?view=…`; Zurück/Vorwärts wird über die History API synchronisiert,
während der Fragmentanker für den Skip-Link frei bleibt. Das aktive Dashboard
startet neue Assets über neun fachliche Kategorien, zeigt validierte letzte
Profile, Favoriten, Basisprofile und einen lokalen Entwurf und verwendet eigene
SVG-React-Icons. Die aktive Profilbibliothek bietet Suche, kombinierbare
Filter, Kategorie-/Compatibility-Gruppen und sichere Assetprofilaktionen. Die
aktive Wizard Engine trennt die generische RHF-Navigation und Persistenz von
einer deklarativen, produktspezifischen Flow-Definition. Sie bietet
Zod-Validierung, sichtbaren Fortschritt, Dirty-/Autosave-Status, exaktes Resume
und eine technische Zusammenfassung. Der stabile Einstieg lautet
`Projekt → Hauptkategorie/Untertyp → Basisprofil → Character- oder
Moving-Object-Details, falls relevant → Capability-Schritte`.
Der Basisprofil-Schritt zeigt wirksame Werte mit Quelle und Sperrstatus,
normalisiert entsperrte Abweichungen zu minimalen Draft-Overrides und bietet
bei Locks einen bewussten Wechsel, ein Duplikat oder eine neue Familie an.
Richtungs-, Animations- oder Tileability-Schritte erscheinen ausschließlich
nach den zentral aufgelösten Capabilities. Character-Antworten durchlaufen den
gleichen RHF-Draft-, Autosave- und Resume-Pfad wie die Core-Felder; Wechsel von
Kategorie oder Untertyp entfernen alte Character-Daten, ein Basiswechsel
erhält sie. Die Zusammenfassung und die Dashboard-Projektion zeigen die
tatsächliche Rolle, Richtungszahl sowie gewählte Aktionen mit Framezahl.
Das ausdrückliche Leeren eines geerbten Character-Defaults löst den Entwurf
verlustfrei vom Kategorieprofil, sodass etwa „keine Richtungen“ oder „keine
Animation“ auch nach einem Resume bestehen bleibt.
Moving-Object-Antworten nutzen denselben Base→Category→Asset-Vertrag:
Basiswechsel erhalten die Fachwerte, Klassifikationswechsel bereinigen sie,
und das ausdrückliche Leeren eines geerbten Moving-Object-Defaults löst die
Kategorie-/Assetprovenienz und materialisiert die übrigen wirksamen Werte.
Rohwerte, Autosave und exaktes Resume umfassen auch beide Moving-Object-
Editoren; Zusammenfassung und Dashboard zeigen Klasse, Bewegung, Standfläche,
Anker, Richtungen nur bei `directional`, Sequenzen mit Frames, Material und
Zustand.
Prompt-Erzeugung und Output-Flächen folgen erst in ihren späteren Phasen.

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

Der öffentliche Character-Katalog unter `src/domain/characters/` bündelt die
typisierten Auswahlwerte, NPC-/Humanoid-Untertypprüfungen und die kanonische
Reihenfolge der Animationsaktionen. `animationActions` speichert jede Aktion
genau einmal mit 1 bis 8 Frames; die UI-Vorgaben liegen ebenfalls dort und
setzen Walk auf 5 Frames.

Der öffentliche Moving-Object-Katalog unter
`src/domain/moving-objects/` bündelt Objektklassen, Bewegungs-, Anker-,
Mechanik-, Material-, Zustands-, Licht- und Schattenoptionen sowie die
kanonische Sequenzreihenfolge und zentralen Frame-Defaults. Die aus dem
Untertyp abgeleitete Objektklasse verhindert widersprüchliche Klassifikation.

Alle persistierten V2-Kernverträge liegen unter `src/schemas/`. Base-,
Kategorie- und Assetprofile, Einstellungen, Wizard-Entwürfe und Exportpakete
werden dort aus `unknown` mit Zod geparst; ihre TypeScript-Typen werden direkt
aus den Schemas abgeleitet. Das strikt additive `CharacterAnswersSchema`
begrenzt alle Character-Felder und eindeutigen Aktionslisten. Bestehende
Schema-V2-Daten mit `animationAction` und `framesPerDirection` bleiben lesbar;
neue Wizard-Projektionen schreiben ausschließlich `animationActions`.
Das additive `MovingObjectAnswersSchema` begrenzt Footprint-Achsen auf 1–64,
die Objekthöhe auf 16–2048 px und jede eindeutige `animationSequences`-Sequenz
auf 1–16 Frames. Die bisherigen Felder `animationType` und
`framesPerDirection` bleiben als schreibfreier Lesepfad erhalten; neue
Moving-Object-Projektionen schreiben nur das kanonische Sequenzmodell.

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

Das Dashboard unter `src/features/dashboard/` leitet seine neun Karten direkt
aus der Domain-Taxonomie ab. Sein reines Read-Model liest Profilbibliothek und
Entwurf über einen injizierten Storage-Port, löst effektive Profilwerte auf und
blendet technisch irrelevante Angaben aus. Kategorie-, Profil- und
Entwurfsaktionen übergeben lediglich einen flüchtigen typisierten Startintent
an den Wizard; Prompt 09 schreibt deshalb weder Profile noch Drafts. Für
Character-Profile projiziert das Dashboard die kanonischen Aktions-/Frame-Paare
und bleibt bei bestehenden Ein-Aktions-Daten abwärtslesbar. Moving-Object-
Profile zeigen zusätzlich die tatsächliche Objektklasse, Bewegung, Standfläche,
Anker, capability-gesteuerte Richtungen, Sequenz-/Frame-Paare, Material und
Zustand; auch hier bleibt die alte Ein-Sequenz-Repräsentation lesbar.

Die Profilbibliothek unter `src/features/profiles/` durchsucht und filtert
Assetprofile, gruppiert sie wahlweise nach Kategorie oder ihrem neu
aufgelösten, für die UI opaken Compatibility Key und zeigt technische Werte
nur bei fachlicher Relevanz. Separate Kartenaktionen laden, favorisieren,
duplizieren oder löschen ein Assetprofil nach ausdrücklicher Bestätigung.
`src/store/profiles/` hält Bibliothek und Filter über Ansichtswechsel hinweg.
Neben den Assetprofil-Aktionen legt dieser Provider neue Basisfamilien an oder
dupliziert eine bestehende Familie. Beide Operationen ändern weder das Original
noch dessen Kinder oder Elternreferenzen. Mutationen werden erst nach erneuter
Zod-Prüfung und erfolgreichem, vollständigem Best-Effort-Gesamtgraph-Write mit
Rollback-Versuch sichtbar übernommen.

Die Wizard-Grundlage unter `src/features/wizard/` trennt deklarative
Schrittdefinitionen, pure Draft-Lifecycle-Funktionen und React-Darstellung.
Der appweite `src/store/wizard/`-Reducer hält Startintent, aktiven Draft,
Dirty-Baseline, ungültige transiente Core-Formwerte und Persistenzstatus über
Ansichtswechsel hinweg; React Hook Form bleibt Eigentümer der sichtbaren
Eingaben. Gültige Änderungen werden verzögert über den injizierten
Storage-Adapter gesichert, bewusste Schrittnavigation sofort. Initialer Start,
Profil-Hydration, Resume und sichere Recovery-Zustände schreiben nichts.
Gespeicherte Override-Snapshots werden beim Resume erneut gegen aktuelle Locks
geprüft und bleiben unabhängig von einer optionalen Quellprofil-Provenienz.
Die vom Dashboard kommende Kategorie bleibt ein flüchtiger Startkontext, bis
der Nutzer einen dazu passenden Untertyp auswählt. Danach wählt oder erstellt
er ein Basisprofil; erst dann bestimmt das zentrale Capability-System die
sichtbaren Folgeschritte. Wirksame technische Werte bleiben mit ihrer Quelle
und ihrem Lock sichtbar. Entsperrte lokale Abweichungen werden beim
Draft-Mapping gegen die wirksame Base→Category-Vererbung verglichen und
redundant gleiche Werte entfernt.
Ein gesperrter Wert ist read-only und führt in einen expliziten
Wechsel-/Duplikat-/Neu-Workflow statt zu einer stillen Mutation. Eine neue oder
duplizierte Familie wird erst nach erfolgreicher Bibliothekspersistenz in das
Formular übernommen. Der generische Engine-Hook für programmatische
Mehrfeldänderungen stößt anschließend genau die normale Draft-Projektion und
den Autosave an. Initialisierung, Profil-Hydration und Resume bleiben
schreibfrei. Ein Wechsel der Klassifikation verwirft alte Kategorieantworten
und Profilprovenienz, ohne ein bestehendes Basisprofil in-place zu verändern.

Der Moving-Object-Zweig hydratisiert wirksame Fachantworten aus
Base→Category→Asset und projiziert nur nicht redundante lokale Werte. Beim
ausdrücklichen Leeren eines geerbten Moving-Object-Werts werden die
Kategorie-/Assetverknüpfungen gelöst und alle übrigen wirksamen Fach- und
Technikwerte relativ zur Base materialisiert. Dadurch stellt ein Resume den
entfernten Wert nicht wieder her.

Der spezialisierte Character-/NPC-Editor unter
`src/features/character-editor/` ist als eigener Wizard-Schritt direkt nach
dem Basisprofil eingebunden. Er rendert nur Character-Fachfelder und blendet
NPC-Kontext sowie humanoide Kleidung nach Untertyp ein. Die Figurenhöhe wird
aus der wirksamen Base→Category→lokal-Kette read-only mit Quelle und Lock
angezeigt. Der getrennte Animationsschritt verwaltet eine formularnahe
Aktions-/Frame-Map, die das Draft-Mapping deterministisch in eindeutige,
kanonisch sortierte `animationActions` umwandelt. Rolle, Richtungen,
Animationen und Silhouette fließen live in die technische Zusammenfassung;
Mount, Hydration und Resume bleiben auch für diese Felder schreibfrei.

Der spezialisierte Moving-Object-Editor unter
`src/features/moving-object-editor/` stellt Objekt- und Produktionsdetails im
eigenen `movingObjectDetails`-Schritt bereit. Sein separater Animationseditor
verwaltet eine RHF-Map, die deterministisch in eindeutige
`animationSequences: [{ type, frames }]` mit 1–16 Frames überführt wird.
Richtung bleibt ein eigener Capability-Schritt und erscheint etwa beim Karren,
nicht jedoch beim animierten `floatingCrystal`. Beide Flächen nutzen denselben
Rohzustand, Autosave- und schreibfreien Resume-Pfad wie der Wizard-Core.

Die Kategorie- und Materialgrafiken sind lokale, dekorative SVG-React-
Komponenten unter `src/components/icons/`; sichtbare Textlabels bleiben die
zugängliche Informationsquelle. Dashboard-Raster und Aktionen sind mit CSS
Modules für drei, zwei und eine Spalte ausgelegt und verwenden die semantischen
Light-/Dark-Tokens.

## Datenschutz

V2 bleibt lokal. Es ist kein Backend vorgesehen. Profile und Entwürfe werden im Browser gespeichert und können als JSON importiert/exportiert werden.

## Lizenz

MIT, siehe `LICENSE`.
