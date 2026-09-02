<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Codex-Promptkatalog — PixelForge Prompt Studio V2 (React + TypeScript)

## Verwendung

Die folgenden Prompts werden **in Reihenfolge und einzeln** ausgeführt. Nach jedem Prompt: prüfen, committen, erst dann der nächste.

Vor jedem Auftrag lesen:

- `AGENTS.md`
- `docs/TECHNOLOGIE-STACK-V2.md`
- `docs/CODEX-V2-UMSETZUNGSANWEISUNG.md`
- `docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md`

---

## Prompt 00 — Legacy-Baseline inventarisieren

```text
ZIEL
Dokumentiere die tatsächliche V1 als Migrationsbaseline, ohne Produktverhalten zu verändern.

UMSETZUNG
1. Lies AGENTS.md und alle V2-Dokumente.
2. Führe die vorhandenen Legacy-Prüfungen aus.
3. Inventarisiere Module, Promptdefaults, Presets, Storage-Keys, Exportformate und Tests.
4. Ergänze PLANS.md nur dort, wo der echte Bestand vom Plan abweicht.
5. Dokumentiere explizit, welche V1-Funktionen in V2 erhalten werden müssen.
6. Sichere repräsentative Legacy-Konfigurationen als Migrationsfixtures, ohne Nutzerdaten einzuchecken.

EINSCHRÄNKUNG
Noch keine React-Migration und keine Produktänderung.

FERTIG, WENN
Baseline reproduzierbar dokumentiert ist und alle bisherigen Tests grün sind.

PRÜFUNG
- bestehende npm-Prüfungen
- git diff --check

STOPPE DANACH.
Commit-Vorschlag: 🧭 docs: capture legacy migration baseline
```

---

## Prompt 01 — React/TypeScript/Vite-Grundgerüst

```text
ZIEL
Migriere das Entwicklungsgrundgerüst verbindlich auf TypeScript + React + Vite + npm, ohne V1-Fachlogik zu verlieren.

UMSETZUNG
1. Nutze eine aktuelle kompatible Vite React-TypeScript-Konfiguration.
2. Installiere React, React DOM, TypeScript, Vite und @vitejs/plugin-react.
3. Installiere React Hook Form, Zod und @hookform/resolvers.
4. Installiere Vitest, jsdom und React Testing Library einschließlich user-event/jest-dom.
5. Aktiviere TypeScript strict.
6. Erzeuge die Zielordner unter src/ gemäß Umsetzungsanweisung.
7. Richte Scripts ein: dev, build, typecheck, test, test:run, verify.
8. Committe package-lock.json.
9. Stelle eine minimale React-App-Shell bereit, ohne schon Dashboard oder Wizard zu implementieren.
10. Halte Legacy-Dateien bis zur späteren Feature-Parität als Referenz/Migrationsquelle erhalten oder verschiebe sie klar in einen legacy-Bereich.

EINSCHRÄNKUNGEN
- kein alternatives Framework
- kein Backend
- keine State-Library zusätzlich zu React
- keine Router-Bibliothek ohne belegten Bedarf

FERTIG, WENN
- React-App startet über Vite
- TypeScript strict grün ist
- ein minimaler RTL-Test grün ist
- npm run verify erfolgreich ist

PRÜFUNG
npm run verify
git diff --check

STOPPE DANACH.
Commit-Vorschlag: ⚛️ chore: establish React TypeScript Vite foundation
```

---

## Prompt 02 — Legacy-Domain nach TypeScript extrahieren

```text
ZIEL
Portiere bestehende fachliche Prompt-/Metriklogik in frameworkfreie TypeScript-Module, ohne die Ergebnisse unbeabsichtigt zu ändern.

UMSETZUNG
- Erstelle domain-Module für aktuelle Defaults, Promptgrundbausteine und technische Metriken.
- Nutze Legacy-Tests/Fixtures als Verhaltensreferenz.
- Ergänze Vitest-Tests für portierte pure Funktionen.
- React darf diese Domain nutzen, Domain darf React nicht importieren.

FERTIG, WENN
repräsentative V1-Ergebnisse in TypeScript reproduzierbar sind und npm run verify grün ist.

STOPPE DANACH.
Commit-Vorschlag: 🧠 refactor: port legacy prompt domain to TypeScript
```

---

## Prompt 03 — Kategorien, Untertypen und Capabilities

```text
ZIEL
Implementiere das zentrale typsichere Capability-System.

PFLICHTKATEGORIEN
character, movingObject, staticObject, texture, nature, building, tileset, item, artwork.

CAPABILITIES
movable, directional, animated, tileable, gridBound, transparent, scaledCharacter, footprint, wearable, modular, freeComposition.

REGEL
4/8 Richtungen nur wenn directional=true. animated und directional getrennt.

UMSETZUNG
- discriminated unions / readonly Kataloge
- resolveCapabilities(category, subtype)
- supportsDirections(), supportsAnimation(), requiresCharacterScale()
- Vitest-Tests inklusive NPC, Wagen, pulsierender Kristall, Tür, Baum, Holztextur

STOPPE DANACH.
Commit-Vorschlag: 🧩 feat: add typed asset capability model
```

---

## Prompt 04 — Zod-Schemas und V2-Profilmodell

```text
ZIEL
Definiere schemaVersion 2 mit Zod als Datenquelle der Wahrheit.

SCHEMAS
BaseProfile, CategoryProfile, AssetProfile, AppSettings, WizardDraft, ExportBundle.

REGELN
- TypeScript-Typen möglichst via z.infer
- Importdaten unknown → parse
- stabile IDs unabhängig vom Namen
- Kategorie-spezifische Daten als discriminated unions

TESTS
Valid/invalid Fälle, fehlende Felder, unbekannte Kategorien, Versionen.

STOPPE DANACH.
Commit-Vorschlag: 🧬 feat: define validated v2 profile schemas
```

---

## Prompt 05 — Profilvererbung, Locks und Compatibility Key

```text
ZIEL
Implementiere BaseProfile → CategoryProfile → AssetProfile.

UMSETZUNG
- resolveProfile()
- gelockte Base-Werte blockieren stille Overrides
- deterministischer compatibilityKey
- characterHeight nur einbeziehen, wenn Kategorie ihn benötigt
- strukturierte Konflikte statt bloßer Strings

TESTS
80px-NPCs gruppieren zusammen; 96px getrennt; Texturen werden nicht wegen characterHeight getrennt; Locks greifen.

STOPPE DANACH.
Commit-Vorschlag: 🔗 feat: add profile inheritance and compatibility rules
```

---

## Prompt 06 — Storage V2 und V1-Migration

```text
ZIEL
Implementiere eine validierte lokale Persistenzschicht.

UMSETZUNG
- Storage-Adapter statt direktem localStorage in Komponenten
- v2 Namespaces
- Zod beim Lesen
- Backup vor V1-Migration
- idempotente Migration
- JSON Import/Export Roundtrip
- korrupte Daten graceful behandeln

TESTS
Migration, Backup, invalid JSON, Importkonflikt, Roundtrip.

STOPPE DANACH.
Commit-Vorschlag: 💾 feat: add validated v2 storage and migration
```

---

## Prompt 07 — Brand, Design Tokens und Light/Dark/System

```text
ZIEL
Erzeuge das neue visuelle Fundament.

UMSETZUNG
- zentrale BRAND-Konfiguration
- tokens.css + globals.css
- Light, Dark, System
- data-theme Root-Strategie
- Theme persistieren
- prefers-color-scheme beachten
- Basiskomponenten mit CSS Modules

TESTS
Theme-Wechsel und gespeicherte Einstellung mit RTL testen.

STOPPE DANACH.
Commit-Vorschlag: 🎨 feat: add branded light dark theme system
```

---

## Prompt 08 — App Shell und Navigation

```text
ZIEL
Baue Header, Navigation, Main-Bereich, globale Aktionen und View-State in React.

ANSICHTEN
Dashboard, Profiles, Wizard, Review, Output, Settings.

REGEL
Keine externe Router-Bibliothek hinzufügen, solange interne Navigation sauber genügt.

TESTS
Navigation über Nutzerinteraktion; aktiver View; Browsernavigation falls implementiert.

STOPPE DANACH.
Commit-Vorschlag: 🧭 feat: build React application shell and navigation
```

---

## Prompt 09 — Dashboard und Icon-System

```text
ZIEL
Ersetze den Formulareinstieg durch das V2-Dashboard.

UMSETZUNG
- Hero-Bereich
- Neues Asset
- Profil laden
- letzte Profile
- Favoriten
- neun Kategorien als große Karten
- eigene SVG-React-Icons
- Material-Badges für Holz, Stein, Schnee, Eis etc.
- responsive CSS Modules

TESTS
Kategorieauswahl führt in korrekten Wizard-Start; Profilkarte ist tastaturbedienbar.

STOPPE DANACH.
Commit-Vorschlag: 🏠 feat: create category driven studio dashboard
```

---

## Prompt 10 — Profilbibliothek

```text
ZIEL
Implementiere kategorisierte Profilverwaltung.

FUNKTIONEN
Suchen, Kategorie filtern, Basisprofil filtern, Compatibility Key gruppieren, Favoriten, laden, duplizieren, löschen.

KARTEN
zeigen Kerndaten einschließlich 32px/80px nur wenn relevant.

TESTS
Filter, Gruppierung, Favorit und Laden.

STOPPE DANACH.
Commit-Vorschlag: 🗂️ feat: add categorized profile library
```

---

## Prompt 11 — Wizard Engine mit React Hook Form

```text
ZIEL
Baue den geführten Wizard als wiederverwendbare Engine.

UMSETZUNG
- deklarative Step-Konfiguration
- React Hook Form
- Zod Resolver / Schrittschemas
- Fortschritt
- Zurück/Weiter
- Dirty State
- Autosave-Draft
- Resume
- technische Zusammenfassung

REGEL
Noch keine großen Spezialeditoren in diese Komponente einbetonieren.

TESTS
vor/zurück, Pflichtfeldfehler, Autosave, Resume.

STOPPE DANACH.
Commit-Vorschlag: 🧭 feat: add guided React Hook Form wizard
```

---

## Prompt 12 — Kategorie-Routing und dynamische Fragen

```text
ZIEL
Verbinde Wizard und Capability-System.

REGELN
- zuerst Hauptkategorie
- danach Untertyp
- nur relevante Schritte/Felder
- Kategorie-Wechsel bereinigt irrelevante Daten
- 8 Richtungen nie bei texture/static tree/building, außer Untertyp ist explizit directional

TESTS
NPC zeigt Bewegung; Holztextur nicht; Windbaum darf Animation ohne Richtung zeigen.

STOPPE DANACH.
Commit-Vorschlag: 🚦 feat: route wizard questions by asset capability
```

---

## Prompt 13 — Basisprofil-Editor

```text
ZIEL
Implementiere globale Produktionsfamilien mit Locks.

FELDER
Pixelstil, Tilegröße, Figurenhöhe wenn relevant, Perspektive, Kamera, Projektion, Outline, Palette, Transparenz, Lichtdefaults.

UX
- geerbte Werte sichtbar
- Locks sichtbar
- Konflikt bietet Duplizieren/Neues Profil statt stiller Änderung

TESTS
Lock-Workflow und Profilwechsel.

STOPPE DANACH.
Commit-Vorschlag: 🔒 feat: add inheritable base profile editor
```

---

## Prompt 14 — Character/NPC Editor

```text
ZIEL
Baue den vollständigen Figuren-/NPC-Editor.

FELDER
Rolle/Beruf, Alter, Körperbau, Haare, Frisur, Bart, Kopfbedeckung, Schal/Kragen, Ober-/Unterbekleidung, Schuhe, Gürtel/Taschen, Accessoires, Ausrüstung, Materialien, Palette, Ausdruck, Silhouettenlesbarkeit.

BEWEGUNG
- Richtungswahl nur bei directional
- 4/8 Richtungen
- Idle/Walk/Run/Attack/Use/Talk nach Capability/Option
- Frames je Aktion
- Standardfigur aus BaseProfile etwa 80px, nicht hart pro Asset duplizieren

TESTS
80px wird geerbt; 8 Richtungen möglich; gelockte Höhe nicht überschreibbar.

STOPPE DANACH.
Commit-Vorschlag: 🧑 feat: build comprehensive character editor
```

---

## Prompt 15 — Moving Object Editor

```text
ZIEL
Spezialeditor für alle beweglichen Nicht-Figuren.

FELDER
Objektklasse, Bewegungsart, Footprint, Anker, Richtungen bei directional, Animation, Frames, Material, Zustand.

TESTS
Wagen directional; pulsierender Kristall animated aber nicht automatisch directional.

STOPPE DANACH.
Commit-Vorschlag: 🛞 feat: add moving object production editor
```

---

## Prompt 16 — Texture/Material Editor

```text
ZIEL
Fokussierter Textur-Editor ohne Figurenballast.

FELDER
Holz/Stein/Schnee/Eis/Sand/Erde/Gras/Moos/Stoff/Metall/Ziegel etc.; Einsatz; seamless; Tilegröße; Strukturgrad; Zustand; Oberfläche; Feuchtigkeit/Vereisung; Licht.

REGEL
Keine Richtungs-, Kleidung- oder Figurenfragen.

TESTS
Holzprofil erzeugt nur relevante Daten/Promptmodule.

STOPPE DANACH.
Commit-Vorschlag: 🪵 feat: add material and seamless texture editor
```

---

## Prompt 17 — Nature/Tree Editor

```text
ZIEL
Detaillierter Natur- und Baumeditor.

FELDER
Pflanzentyp, Art, Klima, Saison, Stamm, Krone, Wurzeln, Moos, Pilze, Schnee, Ranken, Standfläche, Varianten, optionale Windanimation.

REGEL
Normaler Baum nicht directional.

TESTS
Windanimation ohne Richtungsset möglich.

STOPPE DANACH.
Commit-Vorschlag: 🌲 feat: add detailed nature and tree editor
```

---

## Prompt 18 — Static Object Editor

```text
ZIEL
Editor für Möbel, Brunnen, Kisten, Fässer, Säulen und sonstige statische Weltobjekte.

FELDER
Funktion, Material, Footprint, Zustand, Varianten, Interaktion, optionale Animation.

REGEL
Keine Richtungswahl ohne directional Capability.

STOPPE DANACH.
Commit-Vorschlag: 📦 feat: add static world object editor
```

---

## Prompt 19 — Building Editor

```text
ZIEL
Gebäude-/Architektureditor.

FELDER
Typ, Nutzung, Footprint, Größe, Stockwerke, Material, Dach, Fassade, Türen, Fenster, Zustand, bewohnt/verlassen, Mapping-Kompatibilität, Licht.

TESTS
Gebäude erbt Tile-/Perspektivregeln, aber keine characterHeight oder Richtungsfelder.

STOPPE DANACH.
Commit-Vorschlag: 🏘️ feat: add architecture and building editor
```

---

## Prompt 20 — Tileset Editor

```text
ZIEL
Tileset-spezifische Regeln und UI.

FELDER
Grid, Tiletyp, Kanten, Übergänge, Innen-/Außenecken, Seam-Regeln, Wiederholung, Varianten, Atlaslayout.

TESTS
Tilemetriken und technische Spezifikation.

STOPPE DANACH.
Commit-Vorschlag: 🧱 feat: add structured tileset editor
```

---

## Prompt 21 — Item/Equipment Editor

```text
ZIEL
Editor für freigestellte Items und Ausrüstung.

FELDER
Itemklasse, Material, Zustand, Funktion, Bedeutung, Größen-/Lesbarkeitsregeln, Hintergrund, Schatten.

REGEL
Richtungen nur bei explizit directional Untertypen.

STOPPE DANACH.
Commit-Vorschlag: 🎒 feat: add item and equipment editor
```

---

## Prompt 22 — Artwork Editor

```text
ZIEL
Freier Konzept-/Artwork-Editor ohne erzwungene Spielasset-Regeln.

FELDER
Artworktyp, Motiv, Szene, Komposition, Format, Hintergrund, Fokus, Lichtdramaturgie, Detailgrad.

REGEL
Tile-/Sprite-/Direction-Regeln standardmäßig aus.

STOPPE DANACH.
Commit-Vorschlag: 🖼️ feat: add flexible artwork editor
```

---

## Prompt 23 — Prompt Engine 2.0

```text
ZIEL
Ersetze den monolithischen Builder durch eine frameworkfreie modulare TypeScript-Engine.

MODULE
base profile, style, category, subject, materials, setting, lighting, motion, animation, composition, negatives, technical.

AUSGABEN
Hauptprompt, Negativprompt, technische Spezifikation, kombiniert.

REGELN
- irrelevante Felder ignorieren
- keine direkten Namen bestehender Spiele/Marken/Künstler
- Richtungsregeln nur bei directional
- Kamera/Weltlicht bei Directionsets konstant

TESTS
mindestens NPC, Holztextur, Winterbaum, Gebäude, bewegliches Objekt und Artwork als Snapshots/strukturierte Assertions.

STOPPE DANACH.
Commit-Vorschlag: ⚙️ feat: build modular TypeScript prompt engine
```

---

## Prompt 24 — Review und Output Workspace

```text
ZIEL
Baue Review und vier Prompt-Ausgaben als produktionsreife React-Ansicht.

FUNKTIONEN
Zusammenfassung, Konfliktwarnungen, Haupt/Negativ/Technik/Kombiniert, kopieren, TXT exportieren, Profil speichern, JSON exportieren.

TESTS
Ausgaben sichtbar, Copy-Aktion mockbar, Save/Export-Flows.

STOPPE DANACH.
Commit-Vorschlag: 📋 feat: add prompt review and output workspace
```

---

## Prompt 25 — Profilkonflikte und Konvertierung

```text
ZIEL
Mache inkompatible Änderungen kontrolliert und nachvollziehbar.

BEISPIEL
80px-NPC soll 96px werden oder 32px-Tile-Familie wechseln.

UX
Optionen: abbrechen, BaseProfile duplizieren, neues BaseProfile, kompatibles Profil wählen. Keine stille Mutation gesperrter Werte.

TESTS
Compatibility-Key-Änderung, Lock-Konflikt und Duplikation.

STOPPE DANACH.
Commit-Vorschlag: 🔀 feat: add safe profile conversion workflow
```

---

## Prompt 26 — Accessibility, Responsive Design und visuelle Politur

```text
ZIEL
V2 für Desktop/Tablet/schmale Viewports und Tastatur produktionsreif machen.

PRÜFE
Light/Dark/System, Fokus, Labels, Fehlermeldungen, Dialoge, Karten, Wizard, Profile, Output, prefers-reduced-motion, Kontrast, horizontales Overflow.

TESTS
wichtige Keyboard-Flows mit RTL; manuelle Viewport-Prüfung dokumentieren.

STOPPE DANACH.
Commit-Vorschlag: ♿ feat: polish responsive accessible studio experience
```

---

## Prompt 27 — V2 Release-Abnahme

```text
ZIEL
Führe die vollständige V2-Abnahme durch und entferne Legacy-UI nur, wenn Feature-Parität und Migration belegt sind.

CHECKLISTE
- React/TS/Vite einzige aktive V2-Architektur
- npm run verify
- git diff --check
- V1→V2 Migration
- Dashboard
- Profile/Locks/Compatibility
- alle Spezialeditoren
- 8 Richtungen nur directional
- vier Prompt-Ausgaben
- JSON/TXT
- Light/Dark/System
- Keyboard/Responsive
- keine direkten geschützten Stilreferenzen in generierten Prompts

AKTION
Nicht erfüllte Punkte dokumentieren und nicht als fertig markieren. Legacy erst löschen, wenn Tests und manuelle Parität bestätigt sind.

STOPPE DANACH.
Commit-Vorschlag: 🚀 release: complete PixelForge Prompt Studio v2 migration
```

---

# Universalprompt für spätere Einzelaufgaben

```text
Lies AGENTS.md und die relevanten V2-Dokumente. Bearbeite ausschließlich die folgende Aufgabe: <AUFGABE>.

Halte TypeScript strict, React/Vite, React Hook Form/Zod, Context+Reducer, CSS Modules und die frameworkfreie Domain-Architektur ein. Neue V2-Funktionalität darf nicht als Vanilla-DOM-Insel entstehen. Prüfe Capabilities, Profilvererbung, Locks, category relevance und V1-Migration, soweit betroffen.

Ergänze geeignete Vitest-/React-Testing-Library-Tests. Führe npm run verify und git diff --check aus. Stoppe danach und gib geänderte Dateien, Prüfungen, Risiken und einen englischen Emoji-Commitvorschlag aus.
```

# Code-Review-Prompt

```text
Prüfe den aktuellen Diff für PixelForge Prompt Studio V2. Ändere zunächst nichts.

Suche insbesondere nach:
- TypeScript-Unsicherheiten / any / ungeprüften Assertions
- React-Geschäftslogik, die in domain gehört
- direktem localStorage-Zugriff aus beliebigen Komponenten
- fehlender Zod-Validierung an Daten-/Importgrenzen
- Context-Missbrauch oder unnötigem globalen State
- falsch sichtbaren 4/8-Richtungsfeldern
- Vermischung von animated und directional
- Umgehung von Profil-Locks
- instabilem Compatibility Key
- irrelevanten Kategorie-Feldern im Prompt
- Theme-/CSS-Module-Inkonsistenzen
- Accessibility-Problemen
- fehlenden Tests
- neuer Vanilla-DOM-V2-Logik
- Änderungen in dist ohne Build

Berichte Findings nach Schweregrad mit Datei und Zeile. Wenn keine Findings bestehen, sage das ausdrücklich und nenne verbleibende Test-/Risikolücken.
```
