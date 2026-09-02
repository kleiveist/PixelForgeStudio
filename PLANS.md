# PixelForge Prompt Studio V2 — React/TypeScript-Ausführungsplan

## Status

- **Legacy:** V1 als Vanilla HTML/CSS/JavaScript unter `legacy/v1/` eingefroren
- **Ziel:** V2 als TypeScript + React + Vite; Grundgerüst aktiv
- **Aktive Aufgabe:** Prompt 05 abgeschlossen; Prompt 06 noch nicht gestartet
- **Arbeitsregel:** genau eine Phase umsetzen → testen → prüfen → committen

## Aktuelle Agentenübergabe

- Öffentliche V2-Taxonomie: `src/domain/assets/index.ts`
- Öffentliche Zod-Vertragsgrenze: `src/schemas/index.ts`
- Persistierte und importierte Daten immer als `unknown` an die dortigen
  `parse*`-Funktionen übergeben; keine parallelen handgeschriebenen Profiltypen.
- Öffentliche Profilauflösung: `src/domain/profiles/index.ts`. Der Aufrufer
  übergibt bereits validierte Profile an `resolveProfile()` und verzweigt über
  `status: "resolved" | "conflict"`; Konfliktergebnisse besitzen kein
  produktiv nutzbares `profile`.
- `createCompatibilityKey()` erzeugt ausschließlich aus aufgelösten,
  relevanten Werten einen versionierten `pf2-compat-v1__...`-Schlüssel.
- Lock-, Referenz- und Pflichtwertfehler sind strukturierte Konflikte.
  Redundante, irrelevante und veraltete Overrides/Keys sind strukturierte
  Hinweise. `characterHeight` wird ohne `scaledCharacter` entfernt.
- `pixelDensity` bleibt der kanonische Feldname. Einen gespeicherten
  `compatibilityKey` nie blind übernehmen, sondern aus den aufgelösten,
  tatsächlich relevanten Werten neu berechnen und validieren.
- `characterHeight` bei Kategorien ohne `scaledCharacter` weder in den
  Compatibility Key noch still in fachliche Overrides einfließen lassen.
- Referenzintegrität von Exportpaketen sowie `legacyData` und
  `migratedFromVersion` werden mit Storage/Migration in Prompt 06 ergänzt.
- Prompt 06 verwendet den Resolver erst **nach** Zod-Parsing. Storage-Lookups
  dürfen fehlende Base-/Kategorie-Referenzen als `undefined` übergeben und
  müssen Konfliktergebnisse sichtbar bzw. fehlertolerant behandeln.
- Vor Prompt 06 zuerst `npm run verify` und einen sauberen Git-Status prüfen.

## Erfasster Legacy-Ist-Stand

- Reproduzierbare Detailaufnahme: `docs/LEGACY-V1-BASELINE.md`
- V1 besitzt acht Formularabschnitte mit 51 flachen State-Feldern.
- Zwei localStorage-Namespaces, zwei mitgelieferte Import-Presets und vier
  Promptausgaben sind als Migrationsverträge erfasst.
- Synthetische Autosave-/Preset-Fixtures und Signaturen der Standardprompts
  liegen unter `legacy/v1/tests/fixtures/v1/`.
- Abweichung vom Zielmodell: V1 koppelt Richtungsmodi noch nicht an
  Capabilities und führt irrelevante flache Werte weiter. Diese Daten werden in
  V2 migriert, das Verhalten aber bewusst nicht fortgeschrieben.
- V1 nutzt weiterhin Node.js `>=18`, Vanilla JavaScript und den eingebauten
  Node-Testläufer, ist aber vollständig unter `legacy/v1/` isoliert. Das aktive
  Root-Projekt nutzt den verbindlichen V2-Stack.

## Verbindliche Quellen

- `AGENTS.md`
- `docs/TECHNOLOGIE-STACK-V2.md`
- `docs/CODEX-V2-UMSETZUNGSANWEISUNG.md`
- `docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md`
- `docs/CODEX-V2-PROMPTS.md`

## Meilensteine

| Nr. | Meilenstein | Ergebnis | Status |
|---:|---|---|---|
| 0 | Baseline + Migrationsinventar | V1-Verhalten, Storage-Keys und Promptregeln dokumentiert | abgeschlossen |
| 1 | React/TS/Vite-Grundgerüst | Vite React-TS, npm, strict TS, Testsetup | abgeschlossen |
| 2 | Legacy-Domain extrahieren | Defaults, Prompt-, Validierungs- und Metriklogik als frameworkfreies TypeScript | abgeschlossen |
| 3 | Zod-Schemas + V2-Domainmodell | Kategorien, Profile, Capabilities und Importverträge typisiert | abgeschlossen |
| 4 | Profilauflösung + Locks | Vererbung und Compatibility Key | abgeschlossen |
| 5 | Storage V2 + V1-Migration | validierte Persistenz mit Backup | offen |
| 6 | Design Tokens + Theme | Light/Dark/System und Brand-Konfiguration | offen |
| 7 | App Shell + Navigation | React-App-Struktur und Views | offen |
| 8 | Dashboard | Kategorie- und Profilkarten | offen |
| 9 | Profilbibliothek | Suche, Filter, Gruppierung, Favoriten | offen |
| 10 | Wizard Engine | Schritte, Navigation, Resume, RHF/Zod | offen |
| 11 | Kategorie-Routing | Capability-gesteuerte Fragen | offen |
| 12 | Basisprofil-Editor | globale Parameter, Locks, Konflikte | offen |
| 13 | Charakter-/NPC-Editor | vollständige Figurenfragen + Bewegung | offen |
| 14 | Bewegliches-Objekt-Editor | Richtung/Animation nach Capability | offen |
| 15 | Textur-/Materialeditor | Material, Seamless, Oberfläche | offen |
| 16 | Natur-/Baumeditor | Klima, Saison, Krone, Stamm etc. | offen |
| 17 | Statische Objekte | Objektparameter ohne unnötige Bewegung | offen |
| 18 | Gebäudeeditor | Architektur und Mappingparameter | offen |
| 19 | Tileset-Editor | Tile-/Transition-/Seam-Regeln | offen |
| 20 | Item-/Ausrüstungseditor | Spielasset-spezifische Darstellung | offen |
| 21 | Artwork-Editor | freie Komposition ohne erzwungene Tilelogik | offen |
| 22 | Prompt Engine 2.0 | modulare TS-Promptbausteine | offen |
| 23 | Review + Output Workspace | vier Ausgaben, Kopieren, Export | offen |
| 24 | Profilkonvertierung | technische Konflikte sichtbar lösen | offen |
| 25 | Accessibility + Responsive | Tastatur, Kontrast, mobile Layouts | offen |
| 26 | Release-Abnahme | Migration, Tests, Build, Dokumentation | offen |
| 27 | Optional PWA | erst nach V2-Release | später |
| 28 | Optional Tauri 2 | erst nach stabiler Web-V2 | später |

## Definition of Done pro Phase

- ein klar abgegrenztes Ergebnis
- TypeScript `strict` ohne Fehler
- neue pure Logik mit Vitest getestet
- relevantes React-Verhalten mit Testing Library getestet
- `npm run verify` erfolgreich
- `git diff --check` erfolgreich
- keine manuelle Änderung in `dist/`
- kein neues Vanilla-DOM-V2-System
- Dokumentation und ggf. Migrationshinweise aktualisiert

## Entscheidete Architekturpunkte

1. **TypeScript + React + Vite** ist verbindlich.
2. React Hook Form steuert komplexe Formulare.
3. Zod validiert Form-, Import- und Persistenzdaten.
4. Context + Reducer reicht als globaler V2-State zum Start.
5. CSS Modules + semantische CSS Custom Properties bilden das Designsystem.
6. Eigene SVG-React-Komponenten bilden die Iconbibliothek.
7. Vitest + React Testing Library bilden das Testfundament.
8. V2 bleibt ohne Backend.

## Noch lokal zu entscheiden

- ob Navigation zunächst als eigener View-State oder mit einem kleinen Router umgesetzt wird; keine Router-Abhängigkeit ohne Bedarf
- genaue Sheet-Layoutoptionen für mehrere Aktionen
- Rückkehrhistorie beim Kategorienwechsel
- Umfang einer grafischen Frame-/Canvas-Vorschau

## Hauptrisiken

| Risiko | Gegenmaßnahme |
|---|---|
| Big-Bang-Rewrite verliert V1-Regeln | Legacy zuerst inventarisieren, dann Domain schrittweise portieren |
| React-Komponenten enthalten Geschäftslogik | pure Domain-Module + Hooks als Adapter |
| Context wird zu groß | getrennte Contexts/Reducer nach Verantwortlichkeit, erst bei Bedarf weiter skalieren |
| Profilimporte sind unsicher | `unknown` → Zod → Migration → Domain |
| technische Profile laufen auseinander | Locks + Compatibility Key + Konfliktworkflow |
| 8 Richtungen erscheinen bei falschen Assets | zentrales Capability-System |
| Wizard wird monolithisch | deklarative Step-Konfiguration + Feature-Editoren |
| Theme driftet | semantische Tokens + CSS Modules |
