<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# PixelForge Prompt Studio V2 — Implementierungsstatus

## Stand

Der letzte vollständig implementierte Funktionsabschnitt ist **Prompt 22 —
Artwork Editor**. Er ist im separaten Feature-Commit mit dem Betreff
`🖼️ feat: add flexible artwork editor` abgeschlossen. Prompt 23 ist als
nächste Phase vorbereitet, aber noch nicht implementiert; eine Prompt Engine
2.0 existiert deshalb noch nicht.

Prompt 18 ist vollständig in Commit `6dabbbb` enthalten. Dessen Betreff
(`♻️ refactor: Code vereinfachen und strukturieren`) beschreibt den Inhalt
unzutreffend, denn der Commit führt den Static-Object-Editor samt Domain,
Schema-, Wizard-, Dashboard- und Testintegration ein. Prompt 19 und Prompt 20
folgen als getrennte Feature-Commits `433eeda` beziehungsweise `2557c94`;
der Dokumentationsstand vor Prompt 21 liegt in `446cbd0`, Prompt 21 selbst in
`bb90757`.

Die Anwendung besitzt aktuell React, TypeScript und Vite als aktive
V2-Architektur. Legacy V1 bleibt als getestete Migrationsquelle unter
`legacy/v1/` erhalten.

## Abgeschlossene Grundlagen

| Prompt | Ergebnis |
|---:|---|
| 00 | reproduzierbare Legacy-V1-Baseline, Fixtures und Migrationsinventar |
| 01 | React-/TypeScript-/Vite-Grundgerüst mit Strict TypeScript und Testsetup |
| 02 | bestehende Prompt-, Default- und Metriklogik als frameworkfreie TypeScript-Domain |
| 03 | neun Asset-Kategorien, Untertypen und getrennte Capabilities für Richtung und Animation |
| 04 | strikte Schema-V2-Verträge mit Zod und daraus abgeleitete TypeScript-Typen |

## Abgeschlossene beauftragte Phasen 05–22

| Prompt | Commit | Umgesetzter Stand |
|---:|---|---|
| 05 | `b258b37` | Base→Category→Asset-Vererbung, Locks, Konflikte und Compatibility Key |
| 06 | `69c9677` | validierter Storage-Adapter, V1-Backup/Migration und JSON-Transfer |
| 07 | `f3b010c` | Branding, semantische Design-Tokens sowie Light/Dark/System |
| 08 | `f206108` | React-App-Shell, sechs Ansichten und Browsernavigation |
| 09 | `1c8fce5` | Dashboard, neun Kategoriekarten und lokales SVG-Icon-System |
| 10 | `80d2300` | Profilbibliothek mit Suche, Filtern, Gruppieren und sicherem CRUD |
| 11 | `8783ab1` | deklarative RHF-/Zod-Wizard-Engine mit Navigation, Autosave und Resume |
| 12 | `13831e5` | capability-gesteuertes Kategorie-Routing und Bereinigung irrelevanter Daten |
| 13 | `4b8d830` | Basisprofilwahl/-anlage/-duplikation mit sichtbarer Vererbung und Locks |
| 14 | `fdb9c8c` | Character-/NPC-Editor mit Kleidung, Ausrüstung, Richtungen und Aktionsframes |
| 15 | `f6e3cc7` | Moving-Object-Editor mit Footprint, Richtung und separaten Animationssequenzen |
| 16 | `85872c5` | Texture-/Material-Editor mit Seamless-, Oberflächen- und Feuchtigkeitslogik |
| 17 | `a0f6c86` | Nature-/Tree-Editor mit Anatomie, Klima, Bewuchs und Windanimation ohne Richtung |
| 18 | `6dabbbb` | Static-Object-Editor mit Form, Material, Footprint, Interaktion und Animation ohne Richtung |
| 19 | `433eeda` | Building-/Architecture-Editor mit Footprint, Fassade, Mapping, Modularität und Licht |
| 20 | `2557c94` | Tileset-Editor mit Kanten, Ecken, Übergängen, Seam-Regeln, Varianten und berechnetem Atlaslayout |
| 21 | `bb90757` | Item-/Equipment-Editor mit Material, Zustand, Funktion, Bedeutung, Größe und Lesbarkeitsregeln |
| 22 | `🖼️ Feature-Commit` | freier Artwork-/Konzeptbild-Editor mit Motiv, Szene, Komposition, Format, Hintergrund, Fokus, Licht und Detailgrad |

Durchgehend umgesetzt sind außerdem:

- technische Werte und Fachantworten werden getrennt gehalten;
- `characterHeight` gilt nur für `scaledCharacter`;
- 4/8 Richtungen erscheinen ausschließlich bei `directional`;
- Animation und Richtung sind eigenständige Capabilities;
- Profil-Hydration und Resume bleiben schreibfrei;
- gültige Nutzeränderungen laufen über den gemeinsamen Autosave-Pfad;
- Kategorie-/Untertypwechsel entfernen irrelevante Fachantworten;
- persistierte/importierte V2-Daten werden an Zod-Grenzen validiert;
- Komponenten verwenden den Storage-Adapter statt direkten `localStorage`-
  Zugriff.

## Letzter vollständiger Prüfstand

Der Funktionsstand bis Prompt 22 wurde am 3. September 2026 mit folgenden
Ergebnissen geprüft:

- TypeScript-Typecheck erfolgreich;
- Legacy-Strukturprüfung für 13 JavaScript-Dateien und 51 Formularfelder
  erfolgreich;
- 10 von 10 Legacy-Tests erfolgreich;
- 98 Vitest-Dateien mit 563 von 563 Tests erfolgreich;
- Vite-Produktionsbuild erfolgreich;
- `git diff --check` sauber.

Vite meldet weiterhin ausschließlich die bekannte, nicht blockierende Warnung
für einen JavaScript-Chunk über 500 kB. Code-Splitting ist damit eine spätere
Optimierung, kein Fehler des aktuellen Funktionsstands.

## Noch umzusetzen

Die verbleibenden Phasen werden weiterhin einzeln implementiert, geprüft,
dokumentiert und jeweils separat committet:

| Prompt | Offene Aufgabe |
|---:|---|
| 23 | modulare frameworkfreie Prompt Engine 2.0 mit allen vier Ausgabearten |
| 24 | produktionsreife Review- und Output-Ansichten samt Copy, TXT, JSON und Profilspeicherung |
| 25 | kontrollierter Profilkonflikt- und Konvertierungsworkflow |
| 26 | abschließende Accessibility-, Keyboard-, Responsive- und visuelle Politur |
| 27 | vollständige V2-Release-Abnahme; Legacy-UI nur bei belegter Parität entfernen |

Die nächste einzeln auszuführende Phase ist **Prompt 23 — Prompt Engine
2.0**. Übergabe und Arbeitsgrenze stehen in `PLANS.md`; der verbindliche
Phasenscope bleibt `docs/CODEX-V2-PROMPTS.md`.

## Git- und Remote-Hinweis

`origin/main` steht weiterhin auf `6dabbbb`; die Branches sind nicht
divergiert. Der lokale Branch enthält zusätzlich die getrennten Prompt-19-,
Prompt-20-, Statusdokumentations-, Prompt-21- und Prompt-22-Commits. Der
Remote-Stand
enthält damit den funktionalen Prompt-18-Inhalt unter dem unzutreffenden
Refactor-Betreff, während die späteren Phasen einschließlich Prompt 22 bisher
nur lokal vorliegen. Es wurde nicht gepusht.
