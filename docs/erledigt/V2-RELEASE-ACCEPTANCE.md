<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# PixelForge Prompt Studio V2 — Release-Abnahme

Stand: **3. September 2026, Prompt 27**

Ergebnis: **abgenommen**

## Checkliste und Evidenz

| Prüffeld | Ergebnis | Evidenz |
|---|---|---|
| React/TypeScript/Vite als einzige aktive App | bestanden | Root-Einstieg `src/main.tsx`, Strict-TypeScript und Vite-Build; die ausführbare Vanilla-V1 wurde nach der Paritätsprüfung entfernt. |
| Vollständiger Prüfstand | bestanden | `npm run verify`: 106 Vitest-Dateien, 611/611 Tests, Typecheck und Produktionsbuild. `git diff --check` ist sauber. |
| V1→V2-Migration | bestanden | Der Browser-Bootstrap migriert vor dem ersten Provider-Read. Tests belegen Backup vor Profilwrites, Wiederanlauf, Idempotenz, Konflikte und Storage-Ausfälle. Ein realer V1-Autosave wurde im Browser in die drei V2-Profilnamespaces überführt; Quelle und Backup blieben erhalten. |
| Dashboard | bestanden | Dashboard-, Startintent-, Empty-/Fehlerzustands- und Keyboardtests plus Browserpfad über Kategorie, Untertyp und Basisprofil. |
| Profile, Locks und Compatibility | bestanden | Resolver-, Schema-, Provider-, Bibliotheks- und Konvertierungstests; ein migriertes Profil wurde im Browser über die vollständige Kette geladen und bis zur Ausgabe aufgelöst. |
| Alle Spezialeditoren | bestanden | Die neun Editorfamilien sind automatisiert abgedeckt und wurden über den echten Wizard geöffnet: NPC, Karren, Fass, Holztextur, Baum, Haus, Boden-Tile, Waffe und Szenen-Artwork. |
| Richtung nur bei `directional` | bestanden | 4/8 Richtungen waren im Browser nur für NPC und fahrenden Karren sichtbar. Fass, Textur, Baum, Haus, Tileset, Item und Artwork erhielten keine Richtungsfrage. Capability-, Routing-, Schema- und Engine-Tests sichern dieselbe Grenze. |
| Vier Prompt-Ausgaben | bestanden | Hauptprompt, Negativprompt, technische Spezifikation und kombinierte Ausgabe wurden als vier Tabs geprüft; der kombinierte Text enthält alle drei benannten Abschnitte. |
| JSON und TXT | bestanden | Reale Profil-JSON- und TXT-Downloads wurden geparst beziehungsweise mit der sichtbaren Ausgabe verglichen. Der neue Workspace-Transfer exportiert Profile, Settings und den lokalen Draft; Import validiert vollständig und verlangt bei ID-Konflikten eine explizite Ersetzung. |
| Light/Dark/System | bestanden | Theme-Reducer, System-Media-Query und Radiogruppe sind getestet; helle, dunkle und systemgesteuerte Darstellung wurden im Browser geprüft. |
| Keyboard und Responsive | bestanden | Skip-Link, Navigation, Radiogruppe, Dialog-/Konvertierungsfokus und roving Output-Tabs sind automatisiert geprüft. Alle sechs Ansichten blieben bei 360 px ohne Seiten-Overflow; die breitere Prompt-26-Matrix umfasst 360, 768 und 1440 px. |
| Keine direkten geschützten Stilreferenzen | bestanden | App-eigene Engine-Vorlagen und die erzeugten Release-Ausgaben wurden auf direkte Spiel-, Marken-, Figuren-, Werk- und Künstlernamen geprüft. Sie enthalten nur die generische negative Ausschlussregel für namentliche Imitation, keine konkrete geschützte Stilvorlage. |

## Produktive Release-Ergänzungen

`initializeBrowserWorkspaceStorage()` erstellt den V2-Adapter und führt die
vorhandene pure Migration aus, bevor React-Provider Daten lesen. Das Ergebnis
wird an die Einstellungsansicht weitergereicht. Ein blockierter oder defekter
Storage beendet den Start nicht, sondern liefert einen sichtbaren,
strukturierten Status.

Die Einstellungsansicht ist nun die öffentliche Grenze für vollständige lokale
Workspace-Transfers. Exportiert werden die validierte Profilbibliothek,
Einstellungen und – sofern vorhanden – der aktive Draft. Importdateien sind
auf 10 MiB begrenzt, werden vor jedem Write als `unknown` mit Zod geprüft und
zeigen Kollisionen vor der Bestätigung. Nach erfolgreichem Import rehydrieren
Profil- und Settings-Provider ohne Seitenreload; der jüngste enthaltene Draft
kann optional wiederhergestellt werden.

## Manuelle Browsermatrix

Die Releasepfade wurden in Chromium über die produktive Vite-App geprüft:

- V1-Autosave → Startmigration → sichtbarer Status → erhaltene Quelle und
  Backup;
- kompletter Workspace-Export und Import in einen leeren Browserkontext,
  einschließlich Profilkette, Theme und Draft;
- alle sechs Shell-Ansichten bei 360 px ohne horizontales Seiten-Overflow;
- alle neun Editorfamilien über Dashboard → Projekt → Klassifikation →
  Basisprofil → Fachschritt;
- migriertes Richtungsprofil bis Review und Output, alle vier Tabs sowie reale
  TXT-/JSON-Downloads;
- Light, Dark, System und Skip-Link-Fokus;
- keine Seiten- oder Konsolenfehler in den geprüften Flows.

Der detaillierte Desktop-/Tablet-/Schmalviewport-, Kontrast- und
Tastaturstand aus Prompt 26 bleibt in
`V2-ACCESSIBILITY-RESPONSIVE-AUDIT.md` dokumentiert.

## Entscheidung zur Legacy-UI

Vor der Entfernung bestanden die historische Syntax-/Formprüfung für 13
JavaScript-Dateien und 51 Felder, alle 10 V1-Node-Tests, der V2-Prüfstand und
die Browsermigration. Danach wurden die ausführbaren HTML-, CSS-,
JavaScript-, Server-, Build- und V1-Testdateien unter `legacy/v1/` entfernt.

Die für Migration und Regression nötigen, synthetischen Verträge liegen nun
unter `src/test/fixtures/legacy-v1/`. Der frameworkfreie Kompatibilitätsport
unter `src/domain/legacy-v1/` und die Migrationsdomain bleiben aktiv getestet.
Der entfernte V1-Quellstand ist über die Git-Historie vor Prompt 27
wiederherstellbar. Die produktive Migration löscht keine vorhandenen
V1-localStorage-Keys.

## Restrisiken

- Vite meldet einen JavaScript-Chunk von rund 860 kB. Das ist eine bekannte,
  nicht blockierende Code-Splitting- und Ladezeitoptimierung.
- `localStorage` bietet keine Transaktion über mehrere Namespaces. Profilgraph-
  Writes werden validiert und zusammenhängend ausgeführt; schlägt eine danach
  optional gewählte Settings- oder Draft-Wiederherstellung fehl, meldet die UI
  den Teilstatus ausdrücklich.
- Die manuelle Releaseprüfung lief in Chromium. Zusätzliche reale
  Screenreader-, Betriebssystem-Hochkontrast- und Touchgeräteprüfungen bleiben
  sinnvolle plattformspezifische Qualitätssicherung, aber keine offene
  Prompt-27-Funktion.

## Abschlussbefehle

```bash
npm run verify
git diff --check
```

Alle nummerierten V2-Prompts **00–27** sind abgeschlossen. PWA und Tauri 2
bleiben optionale, nicht gestartete Folgeprojekte.
