<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Codex-Promptkatalog — PixelForge Studio V3

Diese Reihe setzt den bestehenden PixelForge-Prompt-Studio-Katalog nach Prompt 27 fort.
Jeder Prompt wird einzeln ausgeführt, geprüft und separat committet.

## Verbindliche Lesereihenfolge

- `AGENTS.md` im Repository
- bestehende V2-Dokumentation
- `docs/erledigt/pixelforge-studio-v3/grundlagen/00_REPOSITORY_BASELINE.md`
- `docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md`
- `docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md`
- `docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md`
- `docs/erledigt/pixelforge-studio-v3/grundlagen/05_DATA_STORAGE_AND_FORMATS.md`
- `docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md`

## Phasenübersicht

### A — Rebranding und Studio-Shell

- Prompt 28: Repository und Produkt zu PixelForge Studio umbenennen
- Prompt 29: Modulbasierte Studio-Routen mit Bestandskompatibilität
- Prompt 30: Globale Studio-Shell und oberer Modulumschalter
- Prompt 31: Studio-Startseite und kompatible Startziele

### B — Animationsprojekt-Grundlage

- Prompt 32: Frameworkfreie Animations-, Rig- und Slot-Domain
- Prompt 33: Versionierte Zod-Schemas für Animationsprojekte
- Prompt 34: IndexedDB-Repository für Projekte, Parts und PNG-Blobs
- Prompt 35: Projektverwaltung, Provider und sichere Autosave-Basis

### C — Rig-Aufbau und Körperteile

- Prompt 36: Produktive Workspace-Oberfläche für Rigging und Timeline
- Prompt 37: PNG-Körperteile validiert importieren und trimmen
- Prompt 38: Eingebaute Rig-Vorlage humanoid-80-v1
- Prompt 39: Ankereditor und automatische Partplatzierung

### D — Rendering und Laufzyklus

- Prompt 40: Deterministischer nearest-neighbor Software-Rasterizer
- Prompt 41: Richtungsabhängige Ebenenreihenfolge und Clippingdiagnostik
- Prompt 42: Versionierter 8-Frame-Walk-Clip und South-Generator
- Prompt 43: Timeline, Playback, Scrubbing und Onion Skin

### E — acht Richtungen und Wiederverwendung

- Prompt 44: Richtungsabdeckung, Spiegelregeln und asymmetrische Overrides
- Prompt 45: Richtungsprojektion und vollständiger 8-Richtungs-Walk
- Prompt 46: Manuelle Framekorrekturen mit Undo und Redo
- Prompt 47: Wiederverwendbare Character Kits und Inventar-Ausrüstung

### F — Export, Integration und Release

- Prompt 48: SpriteSheet-, Einzelbild-, JSON- und .pfanim-Export
- Prompt 49: Versionierter Godot-4.x-Export
- Prompt 50: Prompt-zu-Animation-Übergabe und performanter Workerexport
- Prompt 51: Accessibility-, Responsive-, Regressions- und Release-Abnahme V3

---

# Prompt 28 — Repository und Produkt zu PixelForge Studio umbenennen

**Phase:** A — Rebranding und Studio-Shell

```text
ZIEL
Benenne das Dachprodukt und – sofern die Umgebung über die ausdrücklich
benötigten Adminrechte verfügt – das GitHub-Repository von
`kleiveist/PixelartPromptStudio` zu `kleiveist/PixelForgeStudio` um. Das
bestehende Prompt Studio muss funktional und datenkompatibel bleiben.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 29.

UMSETZUNG
1. Führe vor Veränderungen `npm run verify` und `git diff --check` aus und
   dokumentiere die Baseline.
2. Prüfe `git remote -v`, Repository-Metadaten und Berechtigungen.
3. Wenn eine authentifizierte GitHub CLI mit Repository-Adminrecht vorhanden
   ist, führe den ausdrücklich beauftragten administrativen Rename aus:
   `gh repo rename PixelForgeStudio --repo kleiveist/PixelartPromptStudio --yes`.
   Aktualisiere danach die lokale `origin`-URL unter Beibehaltung von SSH oder
   HTTPS und prüfe `gh repo view kleiveist/PixelForgeStudio`.
4. Wenn der Remote-Rename technisch nicht möglich ist, simuliere ihn nicht.
   Fahre mit sämtlichen lokalen Änderungen fort und dokumentiere genau diese
   eine offene Adminaktion.
5. Ändere in `package.json` den Paketnamen auf `pixelforge-studio` und die
   Beschreibung auf das lokale Dachstudio für Prompt-Produktion und
   Pixelanimation. Lasse die Version bis zum finalen Release-Prompt
   unverändert.
6. Erweitere die zentrale Brand-Konfiguration:
   - Dachprodukt `PixelForge Studio`
   - Modul `PixelForge Prompt Studio` / Kurzlabel `Prompt Studio`
   - Modul `PixelForge Animation Studio` / Kurzlabel `Animation Studio`
   - Short name `PixelForge`
7. Extrahiere den bisherigen stabilen Prompt-Export-Identifier als
   `PROMPT_EXPORT_APPLICATION_ID`. Erhalte
   `EXPORT_APPLICATION_ID` als rückwärtskompatiblen Alias mit exakt demselben
   Stringwert.
8. Führe einen neuen
   `ANIMATION_EXPORT_APPLICATION_ID = "PixelForge Animation Studio"` ein,
   verwende ihn aber noch in keinem unfertigen Exportformat.
9. Aktualisiere sichtbare Dachprodukttexte, `index.html`, README-Überschrift,
   Repositorylinks, AGENTS-Auftrag und Dokumentationsindex. Historische
   Changelog-/Prompttexte werden nicht rückwirkend umgeschrieben.
10. Markiere bestehende V2-Dokumente sprachlich als Spezifikation des
    Prompt-Studio-Moduls, ohne die Historie massenhaft zu verschieben.
11. Ergänze Tests, die Dachmarke, beide Modulnamen und den unveränderten
    Prompt-Protokoll-Identifier festschreiben.
12. Suche abschließend nach unbeabsichtigten produktiven Referenzen auf
    `PixelartPromptStudio` und `pixelforge-prompt-studio`. Historische
    Dokumentation darf Treffer enthalten, produktive Konfiguration nicht.

ARCHITEKTUR- UND DATENREGELN
- Sichtbarer Markenname und persistierte Protokollwerte sind getrennt.
- `EXPORT_APPLICATION_ID` bleibt exakt `"PixelForge Prompt Studio"`.
- Alle bestehenden `pixelforge:v2:*`-Storage-Keys bleiben unverändert.
- Bestehende `schemaVersion: 2`- und `formatVersion: 2`-Promptdaten bleiben
  gültig.
- Keine neue App-Shell oder Navigation in diesem Prompt.
- Keine Änderungen an Promptdefaults oder Profilauflösung.
- Keine Pushes außer einer separat vorliegenden Pushfreigabe; der ausdrücklich
  beauftragte Repository-Rename ist davon als Adminaktion getrennt.

TESTS
- bestehende Brand-/Config-Tests anpassen
- neuer Test: Dachprodukt ist `PixelForge Studio`
- neuer Test: Prompt- und Animationsmodul besitzen getrennte Namen
- Regression: altes ExportBundle mit
  `application: "PixelForge Prompt Studio"` wird weiterhin geparst
- Regression: `EXPORT_APPLICATION_ID === PROMPT_EXPORT_APPLICATION_ID`
- vollständige bestehende Testsuite

NICHT TUN
- keine Storage-Key-Migration
- keine Schema-Versionsanhebung
- keine Paketversion 3.0.0 vorwegnehmen
- keine historischen IDs, Fixtures oder Commits umbenennen
- keine zweite Brand-Konfiguration parallel zur bestehenden Quelle der Wahrheit
- keinen erfolgreichen Remote-Rename behaupten, wenn er nicht geprüft wurde

DOKUMENTATION
Aktualisiere mindestens README.md, AGENTS.md, CHANGELOG.md, docs/index.md,
src/ARCHITECTURE.md und PLANS.md. Lege die endgültigen Naming- und
Kompatibilitätsregeln dauerhaft ab.

FERTIG, WENN
- Code und sichtbare Dokumentation verwenden das Dachprodukt
  `PixelForge Studio`.
- `package.json` heißt `pixelforge-studio`.
- beide Modulnamen sind zentral typisiert verfügbar.
- alte Prompt-Export-Bundles bleiben grün.
- Repository und `origin` tragen den neuen Namen oder der einzelne fehlende
  Adminschritt ist präzise dokumentiert.
- alle Prüfungen sind erfolgreich.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🏗️ chore: rebrand repository as PixelForge Studio
```

---

# Prompt 29 — Modulbasierte Studio-Routen mit Bestandskompatibilität

**Phase:** A — Rebranding und Studio-Shell

```text
ZIEL
Erweitere die pure Navigation von sechs Prompt-Views zu einer typisierten
Dachnavigation für Home, Prompt Studio und Animation Studio. Bestehende
`?view=...`-URLs müssen weiterhin funktionieren.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 30.

UMSETZUNG
1. Benenne die bestehende View-Domain behutsam zu einer Prompt-Studio-Domain
   oder erhalte kompatible Aliase, sodass bestehende Importe nicht unnötig
   brechen.
2. Definiere pure readonly Kataloge und Typen:
   - `StudioId = "home" | "prompt" | "animation"`
   - bestehende sechs `PromptStudioView`
   - `AnimationStudioView = "projects" | "workspace" | "library" | "rigs"`
   - discriminated union `StudioRoute`
3. Definiere die kanonischen Query-Parameter:
   - `studio`
   - `view`
   - optional `project` nur beim Animation-Workspace
4. Implementiere einen Parser, der folgende Formen unterscheidet:
   - gültige neue Route
   - fehlende Route
   - gültige bestehende Prompt-Route
   - ungültige/mehrdeutige Route
5. Mappe `?view=<altePromptView>` deterministisch auf
   `{studio:"prompt", view:<altePromptView>}`.
6. Implementiere einen kanonischen Serializer. Er darf fremde, nicht
   kollidierende Query-Parameter kontrolliert erhalten, aber doppelte
   Studio-/View-/Project-Parameter nicht still akzeptieren.
7. `project` ist nur als validierte StableId und nur für
   `studio=animation&view=workspace` zulässig.
8. Erweitere den injizierbaren Navigation-Adapter und den
   Navigation-Provider auf `StudioRoute`.
9. Bestehende Prompt-Routen werden nach erfolgreichem Lesen per `replaceState`, nicht
   `pushState`, kanonisiert.
10. Browser-Zurück/Vorwärts bleibt aktiv. Route und Providerstate dürfen nicht
    auseinanderlaufen.
11. Erhalte Übergangsaliase für vorhandene Komponenten, bis Prompt 30 die
    Shell umstellt.
12. Aktualisiere öffentliche Exports und Architekturgrenzen.

ARCHITEKTUR- UND DATENREGELN
- Parser und Serializer bleiben frameworkfrei.
- Keine Router-Bibliothek ergänzen.
- Die URL ist die kanonische Navigationsrepräsentation, nicht ein zweiter
  inkompatibler State.
- Fragmentanker bleiben für Skip-Links frei.
- Rohdateinamen, Blob-IDs oder unvalidierte Werte gehören nicht in die URL.
- Fallback ohne gültige Route wird noch nicht durch neue Settings entschieden;
  nutze einen injizierbaren, getesteten Fallback.

TESTS
- alle sechs alten `?view=`-Routen
- Home-Route
- jede Prompt-View in neuer Form
- jede Animation-View
- Workspace mit gültiger Projekt-ID
- Project-Parameter in falscher View wird abgelehnt
- doppelte Parameter werden abgelehnt
- unbekannte Studio-/View-Werte
- Roundtrip `parse(serialize(route))`
- fremde Query-Parameter
- `popstate`
- Kanonisierung bestehender Routen mit `replaceState`
- bestehende Navigationstests als Regression

NICHT TUN
- keine sichtbare neue Shell in diesem Prompt
- keine Animation-Projektlogik
- keine URL mit Hash als View-Router
- kein `window.location`-Zugriff in Domainfunktionen
- keine Type Assertions für unvalidierte Query-Werte
- alte Prompt-Views nicht entfernen

DOKUMENTATION
Aktualisiere `src/ARCHITECTURE.md` um Route, Bestandskanonisierung und
Modulgrenzen. Dokumentiere in PLANS.md die alte und neue URL-Matrix.

FERTIG, WENN
- alle gültigen Studio-Routen sind typisiert und roundtrip-stabil.
- alte Links öffnen weiterhin exakt die bisherige Prompt-View.
- Browsernavigation funktioniert.
- ungültige Routen liefern strukturierte Resultate.
- vorhandene Komponenten können über Übergangsadapter weiter kompilieren.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🧭 feat: add studio module routing
```

---

# Prompt 30 — Globale Studio-Shell und oberer Modulumschalter

**Phase:** A — Rebranding und Studio-Shell

```text
ZIEL
Baue die sichtbare Dachoberfläche von PixelForge Studio. Nutzer können im
globalen Header eindeutig zwischen Prompt Studio und Animation Studio
wechseln, ohne dass die bestehende Prompt-Anwendung regressiert.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 31.

UMSETZUNG
1. Teile die bisherige App-Shell in eine globale `StudioShell` und eine
   Prompt-Modulfläche. Vermeide einen Big-Bang-Rewrite.
2. Die globale Shell enthält:
   - Brandlink zur Studio-Startseite
   - semantischen Modulumschalter `Prompt Studio | Animation Studio`
   - Theme-Switcher
   - sichtbaren aktuellen Modulkontext
   - globalen Skip-Link
3. Implementiere `StudioSwitcher` als echte Navigation mit
   `aria-label="Studio auswählen"` und `aria-current`.
4. Erzeuge Moduldefinitionen zentral aus der Brand-/View-Konfiguration statt
   wiederholter Stringliterale.
5. Das Prompt Studio rendert seine sechs bestehenden Views und behält
   Profil-, Wizard-, Review-, Output- und Settings-Flows.
6. Das Animation Studio erhält vorerst eine getestete, zugängliche
   Placeholder-Fläche mit Modulnavigation:
   `Projekte`, `Workspace`, `Character Kits`, `Rig-Vorlagen`.
7. Workspace ohne Projekt zeigt einen kontrollierten Empty State.
8. Browser-Titel werden routeabhängig:
   - Home: `PixelForge Studio`
   - Prompt: `<View> · Prompt Studio · PixelForge`
   - Animation: `<View> · Animation Studio · PixelForge`
9. Fokus landet nach Modul-/View-Wechsel auf dem Hauptbereich. Bei
   Wizard-Sessionwechsel bleibt das bestehende Fokusverhalten erhalten.
10. Verwende bestehende CSS Modules und semantische Tokens. Führe keine zweite
    Designbibliothek ein.
11. Passe Desktop- und mittlere Viewports an; Navigation darf umbrechen, aber
    keine Aktionen überdecken.
12. Aktualisiere App-/Shell-Tests aus Nutzersicht.

ARCHITEKTUR- UND DATENREGELN
- globale Shell besitzt keine Prompt- oder Animationsfachlogik.
- Prompt-Provider bleiben erhalten und werden nicht in den Animation-Placeholder
  verschoben.
- Modulnavigation wird aus `StudioRoute` abgeleitet.
- keine direkte Manipulation von `history` in Komponenten.
- Theme bleibt global.
- bestehende Prompt-Daten werden durch Modulwechsel nicht zurückgesetzt.

TESTS
- Brandlink öffnet Home
- Modulumschalter öffnet Prompt/Animation
- aktive Auswahl ist semantisch markiert
- jede Prompt-View bleibt erreichbar
- jede Animation-Placeholder-View ist erreichbar
- alte `?view=wizard`-Route zeigt Prompt Studio/Wizard
- Browser-Titel
- Fokusmanagement
- Skip-Link
- Theme-Wechsel in beiden Modulen
- Prompt-Wizard-State bleibt beim Modulwechsel erhalten
- Responsive-Klassen/DOM-Verhalten ohne CSS-Snapshot-Abhängigkeit

NICHT TUN
- keine Animationsdomain, IndexedDB oder Canvas implementieren
- keine bestehende Prompt-View umbenennen oder entfernen
- keine verschachtelten interaktiven Elemente
- keinen Modulwechsel als bloßen lokalen Toggle ohne URL
- keine hartcodierten Farben
- keine Pointer-only Navigation

DOKUMENTATION
Aktualisiere README-Screens/Strukturbeschreibung, `src/ARCHITECTURE.md`,
PLANS.md und gegebenenfalls das Accessibility-Dokument. Dokumentiere die
Verantwortung von globaler Shell und Modul-Shells.

FERTIG, WENN
- PixelForge Studio hat eine sichtbare globale Dachoberfläche.
- beide Module lassen sich über den oberen Umschalter öffnen.
- Prompt Studio verhält sich weiterhin wie vor dem Umbau.
- Animation Studio besitzt eine klare, nicht irreführende Placeholder-Struktur.
- Titel, Fokus und Browsernavigation sind korrekt.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🧱 feat: build umbrella studio shell
```

---

# Prompt 31 — Studio-Startseite und kompatible Startziele

**Phase:** A — Rebranding und Studio-Shell

```text
ZIEL
Vervollständige die Dachnavigation mit einer produktiven Studio-Startseite und
kompatiblen Einstellungen für das Startmodul. Alte AppSettings-V2-Daten müssen
weiter lesbar bleiben.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 32.

UMSETZUNG
1. Erweitere `AppSettingsSchema` additiv um:
   - `startStudio: "home" | "prompt" | "animation"` mit Default `home`
   - `animationStartView` mit Default `projects`
   `startView` bleibt als Prompt-Startansicht bestehen.
2. Stelle sicher, dass alte strikte Settingsobjekte ohne neue Felder durch den
   vorgesehenen Parse-/Defaultpfad weiterhin akzeptiert werden.
3. Implementiere pure Settings-Helfer:
   - `resolveStudioStartRoute(settings)`
   - `withStartStudio(...)`
   - `withPromptStartView(...)`
   - `withAnimationStartView(...)`
4. Erweitere SettingsProvider und Settings-UI um die drei Startentscheidungen,
   ohne direkte Storage-Zugriffe.
5. Baue `StudioHomeView` mit zwei gleichwertigen Hauptkarten:
   - Prompt Studio öffnen
   - Animation Studio öffnen
6. Zeige unter den Hauptkarten:
   - fortsetzbaren Prompt-Draft, wenn vorhanden
   - zuletzt verwendete Prompt-Profile über vorhandene Adapter
   - Animation-Projektbereich als echter Empty State, bis Prompt 35 Daten
     liefert
7. Die Home-View liest nur Zusammenfassungen und schreibt keine Domainwerte.
8. Ergänze sinnvolle Schnellaktionen vom Prompt-Dashboard zur Home-/Animation-
   Placeholder-View, ohne den bestehenden Kategorieeinstieg zu verdrängen.
9. Teste Import/Export eines alten Prompt-Bundles mit alten AppSettings sowie
   eines neuen Bundles mit additiven Feldern.
10. Aktualisiere Defaultsettings und alle betroffenen Fixtures.
11. Dokumentiere den Abschluss der Phase A und den Start von Prompt 32.

ARCHITEKTUR- UND DATENREGELN
- Prompt-`schemaVersion: 2` bleibt unverändert.
- `startView` wird nicht entfernt oder semantisch umgedeutet.
- Zod ist Quelle der Wahrheit.
- Home-Dashboard liest Daten über Ports/Provider.
- kein direkter Zugriff auf IndexedDB; Animation-Projekte existieren noch
  nicht.
- eine fehlende neue Einstellung wird deterministisch ergänzt, nicht als
  Fehler behandelt.

TESTS
- altes Settingsobjekt ohne neue Felder
- neues Settingsobjekt
- ungültiges Startstudio
- jede Startdestination
- Settings-Update und Persistenzfehler
- altes ExportBundle V2
- neues ExportBundle V2
- Studio-Home-Karten und Navigation
- Prompt-Draft-Zusammenfassung
- Animation-Empty-State
- Tastatur und Fokus
- bestehende Settings-/Dashboard-Regressionstests

NICHT TUN
- keine AppSettings-Schemaversion erhöhen
- kein `startView` löschen
- keine automatische Öffnung des letzten Projekts ohne Nutzereinstellung
- keine parallele lokale Settingsquelle
- keine erfundenen Animation-Projektdaten
- keine Home-View mit direkten Storage-Lesevorgängen

DOKUMENTATION
Aktualisiere README.md, AGENTS.md, `src/ARCHITECTURE.md`, relevante
Settings-/Exportdokumente, CHANGELOG.md und PLANS.md. Halte die additive
Settings-Kompatibilität ausdrücklich fest.

FERTIG, WENN
- alte und neue Settings sind gültig.
- Nutzer können Home, Prompt oder Animation als Startmodul wählen.
- Prompt- und Animation-Startviews sind getrennt.
- Studio-Startseite ist produktiv bedienbar.
- Phase A ist dokumentiert und alle Regressionen sind grün.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🏠 feat: add PixelForge Studio home and start settings
```

---

# Prompt 32 — Frameworkfreie Animations-, Rig- und Slot-Domain

**Phase:** B — Animationsprojekt-Grundlage

```text
ZIEL
Lege die typsichere, frameworkfreie Domain des Animation Studios an. Sie wird
die einzige Quelle der Wahrheit für Richtungen, Körperteilslots, Joints, Bones,
Frameprofile, Spiegelregeln und Projektgrundbegriffe.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 33.

UMSETZUNG
1. Erzeuge ein öffentliches Modul `src/domain/animation/` mit bewusst kleinen
   Dateien und `index.ts`.
2. Definiere den stabilen Richtungskanon:
   `south, southEast, east, northEast, north, northWest, west, southWest`.
3. Implementiere pure Helfer:
   - `isDirection`
   - `getOppositeDirection`
   - `getMirroredDirection`
   - `isAuthoredDirectionForMode`
   - `getRequiredAuthoredDirections`
4. Definiere `DirectionSourceMode`:
   - `singleDirectionPrototype`
   - `fiveAuthoredPlusMirror`
   - `eightAuthored`
5. Definiere den vollständigen Production-Humanoid-Slotkatalog aus der
   Animationsspezifikation. Gruppenzuordnung, Required-/Optional-Status und
   Labeldaten liegen in der Domain, nicht als parallele UI-Literale.
6. Definiere stabile `JointId`- und `BoneId`-Kataloge sowie eine Zuordnung der
   Pflichtslots zu Eltern-/Kindjoint.
7. Definiere grundlegende readonly Typen:
   - `Point`, `Size`, `Rect`
   - `FrameProfile`
   - `SourceAnchors`
   - `Transform2D`, `TransformDelta`
   - `MirrorPolicy`
   - `RigTemplateId`
   - `AnimationActionId` zunächst mindestens `walk`
8. Implementiere pure Vektor-/Winkel-/Matrixgrundlagen, soweit sie keine
   spätere Renderentscheidung vorwegnehmen:
   - add/subtract
   - length
   - angle
   - clamp
   - angle normalization
   - affine 2D matrix compose/invert/apply
9. Definiere den kanonischen Standard:
   - `humanoid-80-v1`
   - Frame 128×128
   - Charakterhöhe 80
   - Fußanker 64/112
10. Implementiere reine Katalog- und Invarianttests. Noch keine konkrete
    Gelenkpose oder Renderingfunktion.
11. Exportiere nur die bewusst öffentliche Domainoberfläche.

ARCHITEKTUR- UND DATENREGELN
- Domain importiert weder React, Zod, Canvas, IndexedDB noch Browser-APIs.
- readonly Kataloge sind stabil und deterministisch geordnet.
- TypeScript `strict`; kein `any`.
- IDs werden nicht aus UI-Labels abgeleitet.
- Richtungsreihenfolge wird nie alphabetisch sortiert.
- `fiveAuthoredPlusMirror` besitzt exakt fünf Quellrichtungen.
- anatomisch links/rechts bleibt unabhängig von visueller Spiegelung.

TESTS
- vollständiger Richtungskanon und Reihenfolge
- Spiegelpaare
- opposite directions
- Required-Directions je SourceMode
- jeder Slot ist eindeutig
- jeder Pflicht-Limb-Slot besitzt gültige Jointbindung
- keine doppelte Joint-/Bone-ID
- Standard-Frameprofil
- Matrix Identity/Compose/Invert/Roundtrip
- Winkelnormalisierung und Nullvektorgrenzen
- öffentliche Exports kompilieren ohne React

NICHT TUN
- keine Zod-Schemas in der Domain
- keine konkrete IndexedDB-Struktur
- kein Canvas
- keine UI
- noch kein eingebautes Rig mit Koordinaten
- keine Tier-/Fahrzeugrigs
- keine künstliche Ableitung unbekannter Ansichten
- keine Stringlabels als Primärschlüssel

DOKUMENTATION
Erweitere `src/ARCHITECTURE.md` um die neue öffentliche
`domain/animation`-Grenze und ihre Nicht-Abhängigkeiten. Ergänze PLANS.md und
CHANGELOG.md.

FERTIG, WENN
- Animation-Domain besitzt stabile, getestete Grundverträge.
- Richtung, Slots, Joints und Bones sind aus einer Quelle typisiert.
- Standardframe und SourceModes sind definiert.
- Matrix-/Vektorgrundlagen sind pure und grün.
- kein Browser- oder React-Import befindet sich in der Domain.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🦴 feat: define animation rig domain
```

---

# Prompt 33 — Versionierte Zod-Schemas für Animationsprojekte

**Phase:** B — Animationsprojekt-Grundlage

```text
ZIEL
Definiere das neue Animationsprojekt-, Part-, Kit- und Bundleformat als strikte
Zod-Verträge der Version 1. Persistierte und importierte Werte beginnen als
`unknown`.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 34.

UMSETZUNG
1. Lege getrennte Schema-Dateien an:
   - `animationProject.schema.ts`
   - `animationPartAsset.schema.ts`
   - `animationKit.schema.ts`
   - `animationBundle.schema.ts`
2. Definiere einen eigenen stabilen Versionsvertrag:
   - `schemaVersion: 1`
   - `formatVersion: 1`
   - `application: ANIMATION_EXPORT_APPLICATION_ID`
3. Erzeuge Zod-Primitives für:
   - finite Pixelkoordinaten
   - positive Dimensionen
   - Frameprofile
   - TrimRect innerhalb SourceSize
   - SourceAnchors
   - Direction, Slot, Joint und MirrorPolicy aus der Domain
4. Definiere `AnimationPartAssetSchema` ohne Blobinhalt. Es enthält `blobId`,
   SourceSize, TrimRect, Slot, Richtung, Anker und Spiegelregel.
5. Definiere `AnimationProjectSchema` mit:
   - stabiler Projekt-ID
   - Name und Zeitstempel
   - Rig-ID und Frameprofil
   - DirectionSourceMode
   - Partzuweisungen
   - Clips
   - Frame-/Direction-Overrides
   - optionale Promptprofilreferenz
   - optionale Previewreferenz
6. Definiere `CharacterKitSchema` mit Partreferenzen und
   `rigCompatibilityKey`.
7. Definiere `AnimationProjectBundleManifestSchema` und den übergeordneten
   validierten Bundlegraphen.
8. Implementiere Cross-Field-Validierung:
   - Part-IDs innerhalb eines Projekts eindeutig
   - Clip-IDs eindeutig
   - Walk-Clip im MVP mit 8 Frames
   - FrameOverride nur für vorhandenen Clip/Frame/Richtung
   - Required-Source-Regeln nicht als harte Vollständigkeit beim Draft, aber
     als separate Produktionsvalidierung
   - SourceAnchors innerhalb Originalbildgrenzen
   - TrimRect innerhalb SourceSize
   - Referenzierte Part-/Blob-IDs im Bundle vorhanden
9. Begrenze Texte, Arrays, Dimensionen und Overrides anhand der
   Datenformatspezifikation.
10. Leite TypeScript-Typen via `z.infer` ab.
11. Parsefunktionen geben kanonische readonly Daten zurück, entsprechend den
    bestehenden Projektkonventionen.
12. Exportiere die neuen Schemas über `src/schemas/index.ts`.

ARCHITEKTUR- UND DATENREGELN
- keine PNG-Base64-Daten in Projektschemas
- kein Blob in JSON-Schemas
- Prompt-Schema V2 bleibt unabhängig
- unbekannte Keys werden abgelehnt
- unbekannte neuere Versionen werden abgelehnt
- kein stilles Coercing beliebiger Strings zu Zahlen
- IDs sind stabil und nicht vom Namen abhängig
- Produktionswarnungen und Schemafehler bleiben getrennt

TESTS
- vollständiger gültiger Projektfall
- minimaler Draft
- ungültige Version/Application/Kind
- unbekannte Keys
- doppelte IDs
- ungültige Direction/Slot
- Anker außerhalb SourceSize
- TrimRect außerhalb SourceSize
- Walk mit falscher Framezahl
- Override auf ungültigen Frame
- fehlende Part-/Blob-Referenz im Bundle
- Grenzwerte der Array-/Textlimits
- `parseAnimationProject(unknown)`
- Prompt-V2-Schemas als Regression

NICHT TUN
- keine Persistenz implementieren
- keine `as AnimationProject`-Assertions an Importgrenzen
- keine SchemaVersion 3 für Promptdaten
- keine Bilder in JSON serialisieren
- keine Defaultwerte erfinden, die eine importierte unvollständige
  Projektquelle als produktionsfertig erscheinen lassen

DOKUMENTATION
Dokumentiere Schemas, Versionsgrenzen und Bundlegraph in
`src/ARCHITECTURE.md`. Ergänze PLANS.md, CHANGELOG.md und einen kurzen
Formatabschnitt unter `docs/`.

FERTIG, WENN
- alle Animationsmetadaten besitzen strikte V1-Schemas.
- Typen werden aus Zod abgeleitet.
- Bundlegraphen erkennen fehlende Referenzen.
- ungültige oder neuere Daten werden strukturiert abgelehnt.
- bestehende Prompt-Schemas bleiben vollständig grün.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🧬 feat: add animation project schemas
```

---

# Prompt 34 — IndexedDB-Repository für Projekte, Parts und PNG-Blobs

**Phase:** B — Animationsprojekt-Grundlage

```text
ZIEL
Implementiere eine injizierbare asynchrone Persistenzschicht für
Animationsprojekte und Binärbilder. Bestehender Prompt-Storage bleibt
unverändert in localStorage.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 35.

UMSETZUNG
1. Definiere den öffentlichen Port `AnimationRepository` mit strukturierten
   Read-/Mutation-Resultaten.
2. Unterstütze mindestens:
   - Projekte listen/lesen/anlegen/schreiben/löschen
   - Part-Metadaten lesen/schreiben/löschen
   - Bildblob lesen/schreiben
   - Preview lesen/schreiben
   - Character Kits listen/lesen/schreiben/löschen
3. Implementiere einen Browseradapter auf nativer IndexedDB:
   - Datenbank `pixelforge-studio`
   - Version 1
   - Stores laut Datenformatspezifikation
   - sinnvolle Indizes für `updatedAt`, Slot und Richtung
4. Kapsle Open-/Upgrade-/Transaction-Fehler. Komponenten dürfen kein
   `IDBRequest` sehen.
5. Validiere Metadaten vor jedem Write mit den neuen Zod-Schemas.
6. Schreibe neue Part-Metadaten und zugehörigen Blob in einer gemeinsamen
   Transaktion.
7. Implementiere Projektduplikation mit neuen IDs und klarer Strategie für
   geteilte Part-/Blob-Referenzen. Bevorzugt werden unveränderliche
   Referenzen/copy-on-write statt Blobkopien.
8. Löschen eines Projekts darf geteilte Bilder nicht entfernen. Implementiere
   eine pure Referenzanalyse und eine explizite Garbage-Collection-Operation
   für tatsächlich unreferenzierte Daten.
9. Implementiere einen vollständigen In-Memory-Testadapter mit demselben Port.
10. Baue eine Repository-Factory, die bei fehlender IndexedDB ein
    `unavailable`-Resultat liefert statt beim Appstart zu crashen.
11. Stelle eine schmale `listProjectSummaries()`-Abfrage für Home und
    Projektübersicht bereit.
12. Dokumentiere Datenbankupgrades so, dass spätere Versionen additiv migrieren
    können.

ARCHITEKTUR- UND DATENREGELN
- kein direkter IndexedDB-Zugriff aus React-Komponenten
- keine Bilder in localStorage
- keine Base64-Konvertierung zur Persistenz
- Projektmetadaten werden als validierte Objekte gespeichert
- Browserfehler und Schemavalidierungsfehler sind unterscheidbar
- fehlgeschlagene Transaktion darf keinen halben Part hinterlassen
- Adapter bleibt testbar und austauschbar
- Prompt-V2-Storageadapter wird nicht erweitert oder umgedeutet

TESTS
- In-Memory CRUD
- Browser-Factory ohne IndexedDB
- Projekt anlegen/lesen/schreiben/löschen
- Part + Blob atomar
- invalides Projekt wird nicht geschrieben
- Transaktionsfehler lässt alten Stand erhalten
- Duplikation erzeugt neue Projekt-ID
- geteilte Blob-Referenz bleibt nach Löschen eines Projekts gültig
- Garbage-Collection findet nur unreferenzierte Blobs
- sortierte Project Summaries
- Upgradepfad Version 1
- bestehende localStorage-Tests unverändert

NICHT TUN
- keine UI oder Provider
- keine globale Singleton-Datenbank, die Tests kontaminiert
- keine direkte Nutzung von `window.indexedDB` außerhalb der Browserfactory
- keine unkontrollierte Löschung aller Daten bei Schemafehler
- kein Blob in JSON-Export an dieser Stelle
- keine neue große Storage-Bibliothek ohne dokumentierten Bedarf

DOKUMENTATION
Ergänze Technologie-Stack, `src/ARCHITECTURE.md`, PLANS.md und CHANGELOG.md
um IndexedDB als verbindlichen Animationsspeicher und um die Trennung zum
Prompt-Storage.

FERTIG, WENN
- asynchroner, injizierbarer Repository-Port ist vollständig implementiert.
- native IndexedDB und Memoryadapter folgen demselben Vertrag.
- Metadaten und Blobs werden korrekt getrennt.
- atomare Partwrites und sichere Referenzbereinigung sind getestet.
- Prompt-Storage bleibt unverändert.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 💾 feat: add IndexedDB animation repository
```

---

# Prompt 35 — Projektverwaltung, Provider und sichere Autosave-Basis

**Phase:** B — Animationsprojekt-Grundlage

```text
ZIEL
Baue den vollständigen Lebenszyklus von Animationsprojekten: anlegen,
auflisten, öffnen, umbenennen, duplizieren, löschen und lokal autosaven. Die
Studio-Startseite erhält echte zuletzt bearbeitete Animationsprojekte.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 36.

UMSETZUNG
1. Implementiere pure Reducer-/Action-/Selector-Logik für:
   - Projektliste
   - aktives Projekt
   - Loadstatus
   - Dirty/Saving/Saved/Failed
   - aktive Projektrevision
   - nicht persistierte Rohfehler
2. Erzeuge `AnimationProjectProvider` mit injiziertem
   `AnimationRepository`, Zeit- und ID-Factories.
3. Hydration oder Projektöffnung darf keinen Write auslösen.
4. Gültige Metadatenänderungen werden debounced gespeichert; bewusster
   Projektwechsel und explizites Speichern flushen sofort.
5. Ein fehlgeschlagener Write lässt den letzten gültigen In-Memory-State
   erhalten und zeigt einen konkreten Status.
6. Implementiere `AnimationProjectsView`:
   - Projekt anlegen
   - Suche/Sortierung
   - Öffnen
   - Umbenennen
   - Duplizieren
   - Löschen mit Bestätigungsdialog
   - Projektstatus und Richtungsmodus
7. Der Anlageworkflow fragt:
   - Name
   - Rig `humanoid-80-v1`
   - Frameprofil
   - DirectionSourceMode
   - Walk aktiv, 8 Frames, 10 FPS
8. Nutze als Standard 128×128, Höhe 80, Fußanker 64/112 und
   `fiveAuthoredPlusMirror`.
9. Navigation zum Workspace schreibt die stabile Projekt-ID in die Route.
10. Unbekannte/gelöschte Projekt-ID erzeugt einen erklärten Empty/Error State
    und keine Endlosschleife.
11. Verbinde `StudioHomeView` über einen schmalen Summary-Port mit den zuletzt
    bearbeiteten Animationsprojekten.
12. Implementiere eine sichere Warnung bei Navigation/Unload mit
    ungespeicherten Änderungen.
13. Character Kits, Bildimport und Workspace-Editor bleiben noch Platzhalter.

ARCHITEKTUR- UND DATENREGELN
- Repository ist einzige Persistenzgrenze.
- Provider hält keine PNG-Blobs.
- React Hook Form oder kontrollierte Formulare validieren die Projektanlage
  über Zod.
- IDs und Zeitstempel sind injizierbar.
- Autosave läuft nicht bei Hydration.
- ein gelöschtes Projekt wird aus Route und aktivem State entfernt.
- kein globales `beforeunload`, wenn State sauber ist.

TESTS
- Projektanlage mit Defaults
- ungültiger Name/Framewert
- Listen, Suche, Sortierung
- Öffnen und Route
- Rename
- Duplicate mit neuer ID
- Delete bestätigt/abgebrochen
- unbekannte Projekt-ID
- Hydration ohne Write
- debounced Autosave
- Flush bei Projektwechsel
- Writefehler
- Home zeigt letzte Projekte
- Fokus im Dialog und nach Navigation
- Tastaturbedienung

NICHT TUN
- noch kein PNG-Import
- noch kein Canvas/Rig-Editor
- keine Blobs im Provider
- keine automatische Projektöffnung ohne Nutzeraktion
- kein Löschen ohne Bestätigung
- keine direkte IndexedDB-Verwendung in der View
- keine echte Undo/Redo-History; die folgt in Prompt 46

DOKUMENTATION
Aktualisiere `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und die
Nutzer-README um Projektanlage, Defaults, Autosave und lokale Speicherung.

FERTIG, WENN
- Animationsprojekte besitzen einen vollständigen lokalen CRUD-Lebenszyklus.
- aktive Projekte werden sicher geladen und autosaved.
- Home zeigt reale Projektzusammenfassungen.
- Fehler zerstören keinen gültigen State.
- Phase B ist dokumentiert und grün.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🗂️ feat: add animation project lifecycle
```

---

# Prompt 36 — Produktive Workspace-Oberfläche für Rigging und Timeline

**Phase:** C — Rig-Aufbau und Körperteile

```text
ZIEL
Ersetze den Animation-Workspace-Placeholder durch die vollständige,
responsiv zugängliche Arbeitsflächenstruktur. Die Paneele und Zustände müssen
stehen, bevor Import, Rigging und Rendering schrittweise aktiviert werden.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 37.

UMSETZUNG
1. Implementiere `AnimationWorkspace` für ein geladenes aktives Projekt.
2. Erzeuge die Desktopstruktur:
   - Projekt-/Clip-Toolbar oben
   - Teileinventar links
   - zentraler Rig-/Pixel-Viewport
   - Part-/Frame-/Projektinspektor rechts
   - Timeline unten
3. Toolbar:
   - Projektname
   - Save-Status
   - Richtungsauswahl
   - Clipauswahl
   - Play/Pause zunächst disabled mit Erklärung
   - Export zunächst disabled mit Erklärung
4. Teileinventar:
   - Gruppen aus dem Domain-Slotkatalog
   - Required-/Optional-Status
   - Belegungsstatus
   - zugängliche Auswahl
   - Importaktion zunächst als Anschlussstelle für Prompt 37
5. Zentraler Viewport:
   - 128×128 Framegrenze
   - Schachbrett oder neutraler Testhintergrund
   - ganzzahlige Zoomstufen 1×, 2×, 4×, 8×, 12×, 16×
   - Panning
   - Overlay-Schalter für Grid, Rig, Anchors, Bounding Boxes, Footline
   - noch kein echter Part-Renderer
6. Inspektor:
   - kontextabhängige leere Zustände für Projekt, Part und Frame
   - alle späteren Eigenschaften strukturell vorbereitet
   - keine nicht funktionierenden editierbaren Fake-Felder
7. Timeline:
   - acht Walk-Frameplätze
   - Frameauswahl
   - FPS-Anzeige
   - noch keine Wiedergabe
8. Halte temporäre Auswahlwerte lokal oder in einem kleinen
   Workspace-Reducer:
   - Richtung
   - Frame
   - selektierter Slot
   - aktives Paneel
   Persistierte Projektmetadaten bleiben im ProjectProvider.
9. Mittlere Breite: Inventar und Inspektor umschaltbar.
10. Kleine Breite: schrittweise Tabs `Teile`, `Viewport`,
    `Eigenschaften`, `Timeline`.
11. Jede Canvas-nahe Funktion besitzt eine DOM-basierte Bedienalternative.
12. Ergänze Lade-, Fehl-, Kein-Projekt- und fehlender-Blob-Empty-States.

ARCHITEKTUR- UND DATENREGELN
- Workspace liest das aktive Projekt aus dem Provider.
- UI-Konfigurationen werden aus Domainkatalogen erzeugt.
- keine persistierte Auswahl für rein temporäre Paneelzustände.
- keine CSS-Inlinefarben; bestehende Tokens.
- Viewport-DOM ist nicht Quelle der Rig-Daten.
- Zoom verändert nur die Anzeige, nicht die Exportauflösung.
- Framezelle bleibt 128×128 in Projektkoordinaten.

TESTS
- geladenes Projekt zeigt Workspace
- kein Projekt zeigt korrekten Empty State
- Lade-/Repositoryfehler
- Slotgruppen und Required-Status
- Richtung und Frame auswählbar
- Zoomstufen
- Overlay-Schalter
- mittleres/kleines Layout über semantisches DOM-Verhalten
- Fokus nach Paneelwechsel
- keine enabled Play-/Exportaktion vor Funktion
- Keyboard-only Auswahl
- Save-Status sichtbar

NICHT TUN
- kein PNG-Import implementieren
- keine Dummybilder als echtes Projekt speichern
- kein Canvas-Rendering der Figur
- keine Timeline-Wiedergabe
- keine direkte Repository-Verwendung in Unterkomponenten
- keine Pointer-only Paneelbedienung
- keine feste Desktopbreite, die kleinere Viewports unzugänglich macht

DOKUMENTATION
Aktualisiere `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und das
Accessibility-/Responsive-Dokument um Workspace-Paneele und Ownership.

FERTIG, WENN
- vollständige Workspace-Informationsarchitektur ist produktiv vorhanden.
- alle zukünftigen Featuregrenzen besitzen klare Anschlussstellen.
- Projekt-, Slot-, Richtung- und Frameauswahl ist zugänglich.
- responsive Zustände sind getestet.
- keine unfertige Aktion erscheint fälschlich als verfügbar.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🖥️ feat: build animation workspace shell
```

---

# Prompt 37 — PNG-Körperteile validiert importieren und trimmen

**Phase:** C — Rig-Aufbau und Körperteile

```text
ZIEL
Implementiere den sicheren Import transparenter PNG-Körperteile in einen
gewählten Slot und eine gewählte Richtung. Originalblob, RGBA-Daten,
Trim-Bounds und Metadaten müssen nachvollziehbar getrennt werden.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 38.

UMSETZUNG
1. Definiere einen injizierbaren `ImageDecoder`-Port, der einen Blob in
   `DecodedRgbaImage {width,height,pixels}` überführt.
2. Implementiere den Browserdecoder bevorzugt mit `createImageBitmap` und
   kontrolliertem Fallback, ohne DOM-Typen in die Domain zu leaken.
3. Akzeptiere im MVP nur PNG. Prüfe:
   - Dateityp und dekodierbare PNG-Daten
   - maximal 16 MiB
   - maximal 2048×2048 px
   - mindestens einen sichtbaren Pixel
4. Implementiere pure RGBA-Funktionen:
   - `findAlphaBounds`
   - `cropRgba`
   - Alpha-Threshold Standard 1
   - Warnung bei opakem Außenrand
5. Speichere Anker später in Originalkoordinaten. Lege beim Import zunächst
   einen klaren Status `anchorsPending` an; erzeuge keine scheinpräzisen
   automatischen Gelenke.
6. Baue in `PartInventory` und Inspektor:
   - Datei auswählen
   - Drag-and-drop als Zusatz
   - Slot wählen
   - Richtung wählen
   - Vorschau
   - Dateiname/Dimension/Trim-Bounds
   - Warnungen
   - Import bestätigen/abbrechen
7. Jede Dropzone besitzt eine normale File-Input-/Buttonalternative.
8. Erzeuge IDs und Zeitstempel injizierbar.
9. Schreibe Part-Metadaten und Originalblob über die transaktionale
   Repositoryoperation aus Prompt 34.
10. Weise das neue PartAsset dem aktiven Projekt zu und aktualisiere
    `updatedAt`.
11. Ersetzten Part nicht sofort destruktiv löschen; sichere
    Referenzbereinigung erfolgt über Repository-GC.
12. Verwalte Object URLs ausschließlich über einen Hook/Service und revoke sie
    bei Ersatz, Unmount oder Projektwechsel.
13. Zeige eine erste Richtungsabdeckungsmatrix mit Status:
    eigene Quelle, fehlt, optional, Anchor pending.
14. Importfehler dürfen weder Blob noch Projektzuweisung halb speichern.

ARCHITEKTUR- UND DATENREGELN
- Originalbild bleibt unverändert erhalten.
- TrimRect liegt in Originalkoordinaten.
- keine Base64-Konvertierung.
- Dateiobjekte sind untrusted.
- Komponenten erhalten dekodierte Vorschauen über Ports/Hooks.
- Alpha-Trim ist pure Domainlogik.
- Anker werden nicht geraten.
- Drag-and-drop ist nie die einzige Bedienmöglichkeit.

TESTS
- gültiges PNG
- falscher MIME-/Dateityp und undekodierbare Daten
- Größen- und Dimensionslimit
- vollständig transparent
- opaker Rand als Warnung
- Alpha-Bounds für kleine synthetische RGBA-Matrizen
- TrimRect korrekt
- Import/Abbruch
- Repositoryfehler ohne Projektmutation
- Part ersetzen
- Object-URL-Revoke mit injizierter URL-Factory
- File Input per Tastatur
- Coverage-Matrix
- bestehender ProjectProvider/Autosave

NICHT TUN
- keine automatische Segmentierung oder Computer Vision
- keine JPEG-Unterstützung
- keine Gelenkpunkte aus Bounding Box erfinden
- keine PNG-Daten in React Context, localStorage oder JSON
- keine unbeschränkten Dateidimensionen
- keine Object-URL-Leaks
- noch keine automatische Platzierung

DOKUMENTATION
Dokumentiere Decoder-Port, Importlimits, Alpha-Trim und Object-URL-Lifecycle in
`src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- ein PNG kann sicher einem Slot und einer Richtung zugewiesen werden.
- Originalblob und validierte Metadaten liegen transaktional in IndexedDB.
- Trim-Bounds sind deterministisch.
- fehlende Anker sind sichtbar und blockieren Produktion.
- Fehler hinterlassen keinen halben Import.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🧰 feat: add validated part import pipeline
```

---

# Prompt 38 — Eingebaute Rig-Vorlage humanoid-80-v1

**Phase:** C — Rig-Aufbau und Körperteile

```text
ZIEL
Implementiere die erste versionierte Humanoid-Rig-Vorlage für ungefähr 80 px
hohe Figuren in einer 128×128-Framezelle. Sie enthält fünf explizit
modellierte neutrale Richtungsposen, Bones und Slotbindungen.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 39.

UMSETZUNG
1. Erweitere den Domainvertrag um:
   - `RigTemplate`
   - `DirectionRig`
   - `JointDefinition`
   - `BoneDefinition`
   - `SlotBinding`
   - `DirectionMotionProfile`
2. Lege die Built-in-Vorlage `humanoid-80-v1` als readonly Datenmodul an.
3. Frameprofil:
   - Breite 128
   - Höhe 128
   - Charakterhöhe 80
   - Fußanker 64/112
   - Anchor-Contract-Version 1
   - Slot-Contract-Version 1
4. Definiere fünf eigene Neutralposen:
   - south
   - southEast
   - east
   - northEast
   - north
   Sie dürfen nicht durch bloßes Umbenennen einer einzigen Pose entstehen.
5. Der South-Referenzstand besitzt mindestens folgende stabilen Zentren:
   - root 64/112
   - pelvis 64/78
   - chest 64/58
   - neck 64/44
   - head 64/34
   - shoulder.left 52/52
   - elbow.left 49/68
   - wrist.left 48/82
   - shoulder.right 76/52
   - elbow.right 79/68
   - wrist.right 80/82
   - hip.left 58/78
   - knee.left 57/95
   - ankle.left 56/109
   - hip.right 70/78
   - knee.right 71/95
   - ankle.right 72/109
   Ergänze Hand-/Toe-Joints konsistent.
6. Modelliere diagonale und seitliche Neutralposen mit kontrollierter
   Überdeckung naher/ferner Körperseiten. Dokumentiere die gewählten
   Koordinaten als Produktionsdaten, nicht als JSX.
7. Definiere Bones für Torso, Arme und Beine mit Elternbeziehungen.
8. Verknüpfe jeden Pflichtslot eindeutig mit proximalem und gegebenenfalls
   distalem Joint.
9. Implementiere `validateRigTemplate()` als pure Funktion:
   - alle Pflichtjoints vorhanden
   - Jointkoordinaten im Frame
   - Bones referenzieren existierende Joints
   - keine zyklische Bonehierarchie
   - Limb-Bones haben Länge > Epsilon
   - Pflichtslots vollständig gebunden
   - Fuß-/Toe-Zone nahe Groundline
10. Implementiere einen deterministischen
    `createRigCompatibilityKey()` aus den vertraglich relevanten
    Templatewerten.
11. Zeige im Viewport die Neutralpose, Bones, Joints, Groundline und
    Slotlabels als SVG-Overlay. Noch keine Partplatzierung.
12. Die drei westlichen Richtungsgeometrien werden noch nicht als Assetquellen
    freigegeben; Prompt 44 definiert die Spiegelableitung.

ARCHITEKTUR- UND DATENREGELN
- Built-in-Rigdaten sind immutable und frameworkfrei.
- Koordinaten besitzen eine klare Version.
- Figurenhöhe und Framegröße sind getrennt.
- Rigvalidierung liefert strukturierte Issues mit Pfad.
- UI ändert Built-in-Rigs nicht in-place.
- eigene Custom-Rigs sind nicht Teil des MVP.
- keine Bewegungsschlüssel in der Neutralpose.

TESTS
- South-Referenzkoordinaten
- fünf DirectionRigs vorhanden
- alle Pflichtjoints/-bones/-slots
- Joint innerhalb Frame
- Nullbone wird abgelehnt
- fehlender Joint
- Zyklus
- ungültige Slotbindung
- Groundline-Invariant
- stabiler Compatibility Key
- Rig-Overlay zeigt richtige Richtung
- Wechsel der Richtung aktualisiert Overlay

NICHT TUN
- noch kein Walk-Clip
- keine Partbilder rendern
- keine westlichen Bilder automatisch erzeugen
- keine editierbaren Custom-Rigs
- keine Koordinaten in React-Komponenten duplizieren
- keine Änderung des globalen Prompt-Charakterhöhen-Defaults

DOKUMENTATION
Dokumentiere alle öffentlichen Rigverträge, die South-Referenzpose,
Versionierungsregeln und die Built-in-Template-ID in `src/ARCHITECTURE.md`,
PLANS.md und einem Rig-Dokument.

FERTIG, WENN
- `humanoid-80-v1` ist vollständig typisiert, validiert und sichtbar.
- fünf neutrale Quellrichtungen besitzen eigene Gelenkgeometrie.
- alle Pflichtslots sind bindbar.
- Compatibility Key ist deterministisch.
- ungültige Rigvarianten werden in Tests erkannt.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🦴 feat: add humanoid rig template
```

---

# Prompt 39 — Ankereditor und automatische Partplatzierung

**Phase:** C — Rig-Aufbau und Körperteile

```text
ZIEL
Ermögliche das Einrichten proximaler/distaler Anker und platziere importierte
Körperteile automatisch auf dem gewählten Rig-Bone. Die automatische
Grundtransformation muss jederzeit reproduzierbar bleiben.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 40.

UMSETZUNG
1. Implementiere pure Funktionen:
   - `validateSourceAnchors`
   - `resolveEffectiveAnchor(trimRect, sourceAnchor)`
   - `resolveBonePlacement`
   - `applyTransformDelta`
2. `resolveBonePlacement` berechnet:
   - Quellvektor zwischen proximal/distal
   - Zielvektor zwischen Parent-/Child-Joint
   - Uniform Scale
   - Rotationsdifferenz
   - Translation auf den Parent-Joint
3. Behandle Null-/Fast-Null-Quelllängen als strukturierten Fehler.
4. Definiere sichtbare Warnschwellen für extreme Scale-Werte; kein stilles
   Clamp, das die Daten verfälscht.
5. Einpunktige Parts wie Kopf/Torso/Becken verwenden proximalen Anker plus
   versionierte Defaultorientierung. Limb-Parts benötigen zwei Anker.
6. Baue einen Ankerbearbeitungsmodus im Viewport:
   - Originalbild groß und pixelgenau
   - proximalen Anker setzen
   - distalen Anker setzen, falls erforderlich
   - optional Pivot
   - Koordinatenfelder als Tastaturalternative
   - Zoom/Pan
   - Reset
7. Pointeraktionen snappen standardmäßig auf ganze Quellpixel.
8. Zeige nach gültiger Einrichtung eine Live-Vorschau des Parts am Bone:
   zunächst über eine einfache Anzeigeadaptergrenze; finaler Rasterrenderer
   folgt in Prompt 40.
9. Speichere Anker in Originalbildkoordinaten und die automatische
   Grundtransformation nicht redundant als absolute Pixelwerte.
10. Erlaube manuelle, projektweite Part-Deltas:
    - offsetX/Y
    - rotationDelta
    - uniform scale multiplier in engem, validiertem Bereich
11. Speichere Deltas getrennt von SourceAnchors und Rig.
12. Aktualisiere Coverage-Status:
    `ready`, `anchorsPending`, `invalidAnchors`, `missing`.
13. Ein Part wird erst `ready`, wenn alle slotabhängigen Anker gültig sind.
14. Wechsel der Rig-Vorlage oder DirectionRig berechnet die Platzierung neu;
    die Quellanker bleiben erhalten.

ARCHITEKTUR- UND DATENREGELN
- SourceAnchors sind Originalkoordinaten.
- EffectiveAnchors berücksichtigen TrimRect genau einmal.
- automatische Platzierung ist pure Domainlogik.
- manuelle Korrekturen sind Deltas.
- keine nicht uniforme Skalierung.
- keine Canvas-Koordinaten als persistierte Quelle.
- ein Anker wird nicht aus Dateiname oder Bounding Box geraten.

TESTS
- effektiver Anker nach Trim
- Boneplacement für Translation, Rotation, Scale
- 90°-/180°-Fälle
- Nullquelllänge
- extremer Scale-Warnfall
- einpunktiger Part
- Limb-Part mit fehlendem Distalanker
- UI setzt Anchor per Koordinatenfeld
- Pointer-Snap
- Reset
- Persistenz/Resume
- Rig-/Richtungswechsel berechnet neu
- Delta verändert Grundtransformation nicht
- Coverage-Status

NICHT TUN
- noch kein vollständiger Frame-/Layer-Renderer
- keine nicht uniforme Skalierung
- keine Sourcebilder überschreiben
- keine absoluten Auto-Transforms dauerhaft als zweite Wahrheit speichern
- keine Anker ausschließlich per Maus
- keine stillen extremen Werte

DOKUMENTATION
Dokumentiere Ankerkoordinaten, Placementformel, Delta-Modell und Warnschwellen
in `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- alle Pflichtparts können über klare Ankerregeln eingerichtet werden.
- automatische Placement-Matrix ist reproduzierbar.
- Live-Vorschau reagiert auf Anchors und Deltas.
- Trim und Originalkoordinaten driften nicht auseinander.
- Coverage zeigt verlässlich, welche Parts produktionsbereit sind.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🎯 feat: add anchor placement workflow
```

---

# Prompt 40 — Deterministischer nearest-neighbor Software-Rasterizer

**Phase:** D — Rendering und Laufzyklus

```text
ZIEL
Implementiere den finalen pixelgenauen Frame-Renderer als pure
TypeScript-Domainlogik. Transformierte Körperteile dürfen keine
browserabhängige Glättung oder unerwarteten Zwischenfarben erzeugen.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 41.

UMSETZUNG
1. Definiere immutable Rastertypen:
   - `RgbaImage`
   - `RasterSurface`
   - `RenderablePart`
   - `RenderedFrame`
   - strukturierte Renderdiagnostik
2. Implementiere validierte Surface-Erzeugung für transparente RGBA-Frames.
3. Implementiere eine inverse affine nearest-neighbor Blit-Funktion:
   - transformierte Ziel-Bounding-Box bestimmen
   - Zielpixelzentrum durch inverse Matrix in Quellkoordinaten abbilden
   - nächstgelegenen Quellpixel wählen
   - außerhalb transparent
4. Implementiere deterministisches Source-over-Alpha-Compositing mit klarer
   Rundungsregel. Keine Fließkommadifferenz darf je Browser andere
   RGBA-Ergebnisse erzeugen.
5. Implementiere:
   - `blitNearestAffine`
   - `compositeSourceOver`
   - `renderPart`
   - `renderFrame`
6. `renderFrame` akzeptiert bereits aufgelöste Parts in Draw-Order und erzeugt
   einen transparenten Frame in Projektgröße.
7. Ergänze Diagnostik:
   - vollständig außerhalb
   - teilweise geclippt
   - leere Quelle
   - nicht invertierbare Matrix
   - fehlende RGBA-Daten
8. Optimierung darf die Semantik nicht ändern:
   - nur transformierte Bounds iterieren
   - transparente Quellpixel überspringen
   - keine globale Mutation von Sourcearrays
9. Implementiere einen Browser-Anzeigeadapter:
   - fertiges RGBA via `ImageData`/`putImageData` anzeigen
   - Canvas-CSS für pixelgenauen Zoom
   - `imageSmoothingEnabled = false` zusätzlich setzen
10. Der Anzeigeadapter ist nicht Exportquelle; der Software-Rasterizer bleibt
    maßgeblich.
11. Integriere den Renderer in die Part-/Neutralpose-Vorschau des Workspace.
12. Führe einen revisionsgebundenen Cache für dekodierte Quellen ein, ohne
    Blobs im ProjectProvider zu halten.
13. Dokumentiere explizit die Pixelzentrum- und Rundungskonvention.

ARCHITEKTUR- UND DATENREGELN
- Renderer importiert weder React noch Canvas-DOM.
- Source- und Zielarrays werden nicht unerwartet mutiert.
- affine Matrix muss validiert/invertierbar sein.
- nearest-neighbor ist verbindlich.
- keine Farbquantisierung.
- transparente Zieloberfläche als Default.
- identische validierte Inputs ergeben identische RGBA-Pixel.
- PNG-Encoding folgt erst in Prompt 48.

TESTS
- 1×1 Translation
- 2×2 Uniform Scale
- horizontale Spiegelung
- 90°-Rotation
- kombinierte Translate/Rotate/Scale-Matrix
- transparente Pixel
- Source-over mit opak/halbtransparent
- Layerreihenfolge
- Clipping
- nicht invertierbare Matrix
- leere Quelle
- keine unerwarteten Zwischenfarben
- Inputarrays unverändert
- deterministische Wiederholung
- Workspace zeigt das gerenderte Partbild

NICHT TUN
- kein `drawImage` als finaler Rasteralgorithmus
- keine bilineare Interpolation
- keine CSS-Transformation als Export
- kein WebGL
- keine Paletteänderung
- noch kein SpriteSheet/PNG-Export
- keine Optimierung ohne Pixelgleichheitstest

DOKUMENTATION
Erweitere `src/ARCHITECTURE.md` um Renderpipeline, Pixelzentrum,
Rundungsregel und Adaptergrenze. Ergänze PLANS.md, CHANGELOG.md und
technische Renderdokumentation.

FERTIG, WENN
- Frame-Rendering erfolgt vollständig über pure, deterministische
  nearest-neighbor Rasterlogik.
- kleine RGBA-Fixtures sind pixelgenau getestet.
- Workspace zeigt das Domain-Renderergebnis.
- Clipping-/Matrixfehler sind sichtbar und strukturiert.
- Browsercanvas ist nur Anzeigeadapter.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🧮 feat: add deterministic pixel renderer
```

---

# Prompt 41 — Richtungsabhängige Ebenenreihenfolge und Clippingdiagnostik

**Phase:** D — Rendering und Laufzyklus

```text
ZIEL
Definiere für alle acht Zielrichtungen eine stabile Draw-Order und verbinde
Pflicht- sowie Ausrüstungsslots mit dem Renderer. Die gleiche globale
Layerliste darf nicht für jede Blickrichtung verwendet werden.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 42.

UMSETZUNG
1. Definiere einen frameworkfreien Layervertrag:
   - `LayerGroup`
   - `DirectionDrawOrder`
   - `resolveDirectionDrawOrder`
   - `validateDrawOrder`
2. Lege für alle acht Richtungen explizite Draw-Orders an. Sie werden nicht
   alphabetisch oder allein durch Spiegeln sortiert.
3. Berücksichtige:
   - `hair.back`, `cape.back`, `back.item` früh
   - fernes Bein/ferner Arm
   - Becken/Torso
   - nahes Bein/naher Arm
   - Kopf/Gesicht/Haare vorn
   - vordere Waffen/Schilde/Accessoires
4. Definiere für jede Richtung, welche anatomische Seite visuell näher an der
   Kamera liegt.
5. Optional nicht belegte Slots werden übersprungen, belegte Slots erscheinen
   genau einmal.
6. Freie Accessoires besitzen:
   - Attachment-Joint
   - Default-LayerGroup
   - optionalen projektweiten Layer-Offset
7. Implementiere eine Produktionsvalidierung:
   - unbekannter Slot
   - doppelter Slot
   - belegter Pflichtslot fehlt in Order
   - Attachment-Joint fehlt
8. Integriere die aufgelöste Order in `renderFrame`.
9. Ergänze im Inspektor eine verständliche Layeranzeige. Nutzer dürfen
   projektweite Part-Layer-Deltas setzen; per-Frame Overrides folgen in
   Prompt 46.
10. Zeige Clippingdiagnostik im Viewport:
    - Bounding-Box-Warnung
    - betroffene Framekante
    - vollständig außerhalb als Fehler
11. Lege synthetische farbige Partfixtures an, mit denen Vorder-/Hinterordnung
    pixelgenau sichtbar geprüft wird.
12. Halte Weltlicht und Draw-Order getrennt; Layering darf keine Bildquelle
    spiegeln.

ARCHITEKTUR- UND DATENREGELN
- Draw-Order ist versionierte Rig-/Richtungsinformation.
- anatomische Seite und visuelle Nähe sind getrennte Begriffe.
- optionaler Slot wird nicht zur Pflicht.
- Layer-Delta speichert eine kleine Abweichung, keine duplizierte Komplettliste.
- Renderer erhält die bereits aufgelöste Reihenfolge.
- keine DOM-Sortierung als Fachlogik.

TESTS
- jede der acht Richtungen besitzt eine Order
- alle Pflichtslots genau einmal
- optionale Slots werden korrekt eingefügt
- nahe/ferne Seite für Ost/West/Diagonal
- doppelter/unbekannter Slot
- fehlender Attachment-Joint
- Layer-Delta
- farbige Pixel-Fixtures für Überdeckung
- Clipping links/rechts/oben/unten
- vollständig außerhalb
- Inspektor zeigt Reihenfolge
- Richtungswechsel aktualisiert Rendering

NICHT TUN
- keine automatische Richtungsbild-Spiegelung
- keine Walk-Bewegung
- keine per-Frame-Layer-Overrides
- keine globale DOM-z-index-Lösung für Pixelparts
- keine Pflichtslots durch Ausrüstung ersetzen
- keine Layerliste als UI-only State

DOKUMENTATION
Dokumentiere Layergruppen, Nah-/Fernseite, Draw-Order-Version und
Clippingdiagnostik in `src/ARCHITECTURE.md`, PLANS.md und CHANGELOG.md.

FERTIG, WENN
- alle acht Zielrichtungen haben eine geprüfte Draw-Order.
- Renderer zeichnet belegte Parts exakt in dieser Reihenfolge.
- Ausrüstung und freie Accessoires besitzen kontrollierte Einordnung.
- Clipping ist sichtbar diagnostiziert.
- Richtungsspezifische Überdeckung ist pixelgenau getestet.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🥞 feat: add directional layer ordering
```

---

# Prompt 42 — Versionierter 8-Frame-Walk-Clip und South-Generator

**Phase:** D — Rendering und Laufzyklus

```text
ZIEL
Implementiere die erste echte automatische Laufanimation:
`walk-humanoid-8-v1`. Aus dem neutralen South-Rig und eingerichteten Parts
werden acht deterministische Walk-Frames erzeugt.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 43.

UMSETZUNG
1. Definiere den Clipvertrag:
   - Template-ID `walk-humanoid-8-v1`
   - Aktion `walk`
   - 8 Frames
   - 10 FPS Default
   - Loop
   - phasenbasierte normierte Bewegungskanäle
2. Verwende die verbindlichen Phasen:
   0 Kontakt links
   1 Down links
   2 Passing links
   3 Up links
   4 Kontakt rechts
   5 Down rechts
   6 Passing rechts
   7 Up rechts
3. Lege die normierten Basiskanäle aus der Produktionsspezifikation als
   versionierte readonly Daten ab:
   - left/right stride
   - root bob
   - root sway
   - gegenläufiger Armswing
   - Knee-/Foot-Lift
4. Implementiere pure Funktionen:
   - `resolveClipFrame`
   - `resolveHumanoidWalkPose`
   - `applyPoseToDirectionRig`
   - `validatePose`
5. Für South:
   - linkes/rechtes Bein phasenverschoben
   - Arme gegenläufig zu den Beinen
   - Root-Bob maximal ±1 px im Standard
   - Kopf/Torso erhalten kontrollierte Gegenbewegung
6. Implementiere eine deterministische Kontaktkorrektur. Kontaktfuß bleibt in
   Kontakt-/Down-Phasen auf der projektierten Groundline.
7. Falls dafür Two-Bone-IK verwendet wird:
   - pure Funktion
   - Zielabstand kontrolliert clampen
   - Bend-Richtung pro Seite definiert
   - unerreichbares Ziel erzeugt Diagnostik, keinen NaN-Wert
8. Erzeuge aus Projekt + South-Parts acht `RenderedFrame`-Objekte über den
   Renderer aus Prompt 40.
9. Aktivieren den Clip nur, wenn alle Pflichtparts für South `ready` sind.
10. Zeige Produktionsfehler gesammelt:
    - Part fehlt
    - Anchors pending
    - ungültige Bone-Länge
    - Renderfehler
11. Erzeuge eine neutrale synthetische Humanoid-Fixture, die ohne private
    Nutzerassets alle acht Frames testbar macht.
12. Füge einen Framevergleich hinzu:
    - Frame 0 und 4 besitzen Gegenphase
    - Loopende stimmt kontrolliert mit Startbewegung überein
    - Figurenhöhe bleibt im Toleranzbereich

ARCHITEKTUR- UND DATENREGELN
- Clipdaten sind Domainwerte, keine JSX-Konstanten.
- keine Zwischenbildinterpolation; jeder der acht Frames wird explizit
  aufgelöst.
- South ist der einzige produktiv generierte Direction-Clip in diesem Prompt.
- Fußkontakt und Root-Anker sind getrennt.
- keine Speicherung gerenderter Frames als Projektquelle der Wahrheit.
- Projekt speichert Template-ID, FPS und Overrides, nicht 64 PNGs.

TESTS
- Clip-ID, Framezahl, FPS und Loop
- Phasenreihenfolge
- normierte Kanäle
- Gegenphase links/rechts
- Arm-/Bein-Gegenlauf
- Root-Bob-Grenze
- Kontaktfuß-Groundline
- IK normal, geclamped, unerreichbar
- fehlender Part/Anchor
- acht deterministische South-Frames
- Frame 0 vs. 4
- Height-Toleranz
- kein NaN/Infinity
- wiederholtes Rendern pixelgleich

NICHT TUN
- noch keine anderen sieben Richtungen generieren
- keine Timeline-Wiedergabe
- keine KI- oder Morphing-Zwischenbilder
- keine gerenderten PNGs in Projektmetadaten
- keine zufälligen Bewegungswerte
- keine Handzeichnung in Tests

DOKUMENTATION
Dokumentiere Clipkanäle, Kontaktregel, eventuelle IK-Grenzen und South-MVP in
`src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- ein vollständiges South-Partset erzeugt automatisch acht Walk-Frames.
- Kontakt, Gegenphase und Höhenregel sind getestet.
- Fehler blockieren sauber.
- Renderframes sind pixelgenau und reproduzierbar.
- Clip bleibt als versionierte Vorlage rekonstruierbar.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🚶 feat: generate humanoid walk cycle
```

---

# Prompt 43 — Timeline, Playback, Scrubbing und Onion Skin

**Phase:** D — Rendering und Laufzyklus

```text
ZIEL
Mache die automatisch erzeugten South-Walk-Frames im Workspace vollständig
prüfbar: Timeline, Play/Pause, FPS, Loop, Scrubbing, Onion Skin und
Renderstatus.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 44.

UMSETZUNG
1. Erweitere die Timeline auf echte Renderframes des aktiven Clips.
2. Implementiere Playback über einen testbaren Clock-/Scheduler-Port:
   - Projekt-FPS
   - Play
   - Pause
   - Stop/Frame 0
   - Loop
   - nächster/vorheriger Frame
3. `requestAnimationFrame` darf die Anzeige takten, die Clip-FPS bestimmen
   aber den tatsächlichen Framewechsel. Keine Annahme, dass Display-FPS =
   Clip-FPS.
4. Bei langsamen Frames wird anhand verstrichener Zeit deterministisch
   aufgeholt, ohne unkontrollierte Schleife.
5. Implementiere Scrubbing:
   - Klick/Pointer
   - Tastatur Pfeil links/rechts
   - Home/End
   - direkte Frameauswahl
6. Implementiere Onion Skin:
   - vorheriger Frame
   - nächster Frame
   - beide
   - einstellbare, begrenzte Deckkraft
   - deaktiviert als Default
7. Onion Skin ist reine Vorschau und verändert keinen Exportpixel.
8. Zeige:
   - aktueller Frame/8
   - Phase
   - FPS
   - Renderwarnungen
   - fehlende Produktionsvoraussetzungen
9. Cache gerenderte Frames anhand:
   - Projekt-ID
   - Projektrevision
   - Clip-ID
   - Richtung
   - Frameindex
10. Änderungen an Part, Anchor, Rig, Clip oder Override invalidieren nur
    betroffene Caches.
11. Bei `prefers-reduced-motion` startet Playback nie automatisch.
12. Projektwechsel/Unmount stoppt Scheduler und gibt Ressourcen frei.
13. Aktivieren die Playcontrols nur bei validem generierbarem Clip.
14. Ergänze zugängliche Namen und Statusregionen; Timeline-Thumbnails erhalten
    Textalternative.

ARCHITEKTUR- UND DATENREGELN
- Timeline hält nur Auswahl/Playback, nicht die Projektquelle.
- Onion Skin ist Anzeigeadapter.
- kein Auto-Play.
- Zeitberechnung ist testbar und nicht direkt über globale Timer verstreut.
- Cache ist revisionsgebunden.
- Projektwechsel stoppt Playback.
- reduzierte Bewegung wird respektiert.

TESTS
- Play/Pause/Stop
- 10 FPS mit fake clock
- Loop 7→0
- zeitbasierter Framewechsel bei verzögertem Tick
- Pfeil/Home/End
- Scrubbing
- Onion Skin previous/next/both/off
- Onion Skin verändert Exportframe nicht
- Controls disabled bei Fehler
- Cache Hit/Invalidierung
- Projektwechsel stoppt
- Unmount Cleanup
- reduced motion
- zugängliche Labels/Status

NICHT TUN
- keine acht Richtungen generieren
- keine gerenderten Frames persistieren
- kein `setInterval` ohne Cleanup
- kein Auto-Play bei Öffnen
- Onion Skin nicht in PNG übernehmen
- keine reine Maus-Timeline
- keine unbeschränkten Rendercaches

DOKUMENTATION
Aktualisiere `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md,
Accessibility-Dokument und Nutzerhilfe um Playback, Cache und Onion Skin.

FERTIG, WENN
- South-Walk lässt sich zuverlässig abspielen und framegenau prüfen.
- Timeline und Tastatursteuerung sind vollständig.
- Onion Skin ist optional und exportneutral.
- Cache und Scheduler sind kontrolliert.
- Phase D ist dokumentiert und grün.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: ⏱️ feat: add animation timeline preview
```

---

# Prompt 44 — Richtungsabdeckung, Spiegelregeln und asymmetrische Overrides

**Phase:** E — acht Richtungen und Wiederverwendung

```text
ZIEL
Implementiere die kontrollierte Ableitung von Südwest, West und Nordwest im
Modus `fiveAuthoredPlusMirror`. Spiegelung ist eine nachvollziehbare
Produktionsentscheidung und darf asymmetrische oder lichtkritische Teile nicht
still verfälschen.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 45.

UMSETZUNG
1. Erweitere die Domain um:
   - `DirectionSourceResolution`
   - `DirectionCoverageStatus`
   - `resolveDirectionSource`
   - `resolveProjectDirectionCoverage`
   - `validateMirrorPolicy`
2. Für `fiveAuthoredPlusMirror` gelten:
   - southWest aus southEast
   - west aus east
   - northWest aus northEast
3. Unterscheide:
   - eigene Quelle
   - gültig gespiegelt
   - gespiegelt, Prüfung erforderlich
   - Spiegelung verboten
   - Quelle fehlt
   - optional nicht verwendet
   - Anker unvollständig
4. `MirrorPolicy`:
   - `inherit`
   - `allow`
   - `forbid`
   Projekt-/Kit-Default und Partoverride werden deterministisch aufgelöst.
5. Spiegele Partpixels zur Renderzeit, ohne Originalblob oder Metadaten zu
   duplizieren. Für Sourcepixel/Sourceanchors gilt die Achse des Quellbilds;
   für Rig-Joints wird um die vertikale Root-/FootAnchor-Achse gespiegelt.
6. Dokumentiere und teste die unterschiedlichen Formeln:
   - Sourcepixel: `sourceWidth - 1 - x`
   - Framejoint: `2 * footAnchor.x - x`
7. Rotationen und X-Komponenten von Deltas werden mit korrektem Vorzeichen in
   die Zielrichtung projiziert.
8. Anatomische Slot-IDs werden nicht umbenannt. Ziel-Draw-Order entscheidet
   sichtbare Nah-/Fernseite.
9. Ein eigenes Zielrichtungsasset überschreibt die abgeleitete Spiegelquelle.
10. Baue die vollständige Coverage-Matrix in den Workspace:
    Slot × 8 Richtungen, Symbol + Textstatus.
11. Ergänze einen Reviewdialog für `mirroredNeedsReview`, insbesondere:
    - Waffe/Schild
    - Taschen
    - Narben
    - Schrift/Wappen
    - feste Weltlichtseite
12. Eine bestätigte Spiegelung speichert eine explizite Reviewentscheidung;
    sie wird nicht aus bloßem Schließen des Dialogs abgeleitet.
13. `forbid` ohne eigene Zielquelle ist ein harter Produktionsfehler.
14. `singleDirectionPrototype` bleibt sichtbar als nicht 8-dir-exportbereit.
15. `eightAuthored` verwendet niemals automatisch eine gespiegelte Quelle.

ARCHITEKTUR- UND DATENREGELN
- Originaldaten bleiben unverändert.
- Source- und Frame-Spiegelachsen werden nicht verwechselt.
- Weltlicht wird nicht als mitgespiegelt behauptet.
- bestätigte Reviewentscheidung ist projektbezogene Metadaten.
- eigene Zielquelle besitzt Vorrang.
- Draw-Order kommt aus der Zielrichtung.
- keine anatomische Left/Right-Umbenennung.

TESTS
- alle drei Spiegelpaare
- Sourcepixel-/Anchor-Spiegelung
- Rigjoint-Spiegelung um FootAnchor
- Rotation-/Delta-Vorzeichen
- eigene Quelle gewinnt
- allow/forbid/inherit
- Review required/confirmed
- eightAuthored ohne Fallback
- singleDirectionPrototype blockiert
- Coverage-Matrix mit Symbol und Text
- asymmetrische Waffe
- Ziel-Draw-Order
- Originalmetadata unverändert

NICHT TUN
- keine KI-generierten Ansichten
- keine stille Spiegelung bei `forbid`
- keine weltlichtbezogene Qualitätsbehauptung ohne Review
- keine Blobkopie nur für Spiegelung
- keine ausschließliche Farbcodierung der Matrix
- keine automatische Bestätigung

DOKUMENTATION
Dokumentiere Spiegelachsen, Reviewstatus, Overridevorrang und
Produktionsblocker in `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und
Nutzerhilfe.

FERTIG, WENN
- fünf Quellrichtungen können kontrolliert acht Zielrichtungen abdecken.
- jede abgeleitete Quelle bleibt nachvollziehbar.
- asymmetrische/verbote Parts blockieren korrekt.
- Overrides und Reviewentscheidungen funktionieren.
- die Coverage-Matrix erklärt jeden Status.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🪞 feat: add directional mirroring policies
```

---

# Prompt 45 — Richtungsprojektion und vollständiger 8-Richtungs-Walk

**Phase:** E — acht Richtungen und Wiederverwendung

```text
ZIEL
Projiziere den versionierten Walk-Clip auf alle acht DirectionRigs und rendere
den vollständigen Satz aus 64 Frames. Kamera, Fußanker, Höhe, Richtungskanon
und Weltlichtregeln bleiben konsistent.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 46.

UMSETZUNG
1. Vervollständige `humanoid-80-v1` um auflösbare Zielgeometrie für alle acht
   Richtungen:
   - fünf explizite Neutralposen
   - drei kontrolliert gespiegelte Geometrien
2. Definiere pro Richtung ein `DirectionMotionProfile`:
   - sichtbare Schrittachse
   - Stride-Amplitude
   - Knee-/Foot-Lift
   - Armamplitude
   - Root-Sway-Projektion
   - Bend-Orientierung
3. Implementiere pure Funktionen:
   - `resolveDirectionRig`
   - `projectWalkChannels`
   - `resolveDirectionalWalkPose`
   - `generateDirectionalFrames`
   - `generateEightDirectionWalkSet`
4. Verwende abgestufte Standardamplituden:
   - Seite: Oberschenkel bis 18°, Unterschenkel bis 28°, Arm bis 14°
   - Diagonal: 14° / 22° / 11°
   - Front/Rücken: 9° / 18° / 8°
   Werte liegen als versionierte Daten vor.
5. Kontaktkorrektur wird auf die jeweilige Ground-/Schrittachse projiziert.
6. Der vollständige Generator erzeugt exakt:
   - 8 Richtungen
   - 8 Frames je Richtung
   - 64 adressierbare Renderframes
7. Reihenfolge ist der kanonische Directionkatalog; keine alphabetische
   Sortierung.
8. Vor Generierung Produktionsvalidierung:
   - Required-Slots
   - gültige Anchors
   - Direction Coverage
   - Mirror Reviews
   - Rig/Clip
   - Blobverfügbarkeit
9. Nach Generierung Konsistenzdiagnostik:
   - Framegröße
   - FootAnchor
   - Körperhöhe zwischen Richtungen maximal ±1 px, soweit Silhouettenmessung
     zuverlässig ist
   - kein komplett fehlender Pflichtpart
   - Clipping
   - NaN/Infinity
10. Zeige im Workspace Direction-Auswahl und Vorschau für jede Richtung.
11. Füge einen `Alle Richtungen prüfen`-Modus mit 8 kleinen
    Previewfeldern hinzu; keine automatisch laufenden acht Animationen bei
    reduzierter Bewegung.
12. Cache Frames pro Richtung und Projektrevision.
13. Fehler in einer Richtung dürfen nicht als vollständiger Exportstatus
    erscheinen.

ARCHITEKTUR- UND DATENREGELN
- DirectionMotionProfile ist Domain-/Rig-Information.
- Clip bleibt ein gemeinsamer normierter Bewegungsvertrag.
- Weltlicht wird nicht per Renderer neu erfunden.
- gerenderte Frames werden nicht als primäre Projektmetadaten gespeichert.
- westliche Geometry darf abgeleitet sein; Partquelle folgt Prompt 44.
- alle Outputs sind deterministisch.

TESTS
- DirectionRig für alle acht
- Amplitudenprofile Seite/Diagonal/FrontBack
- exakt 64 Frames
- kanonische Reihenfolge
- FootAnchor je Richtung
- Kontaktkorrektur
- Height-Toleranz
- fehlende Richtung/Part/Blob
- Mirror Review blockiert
- Clippingdiagnostik
- Framecache je Revision
- einzelne und All-Directions-Preview
- reduzierte Bewegung
- Pixelgleichheit bei Wiederholung

NICHT TUN
- keine SpriteSheet-Datei erzeugen
- keine Richtung aus nur South erfinden
- keine 3D-Rotation
- keine alphabetische Sortierung
- keine automatisch laufende Previewwand
- keine Erfolgsanzeige bei Teilfehlern
- keine Richtungsspezialwerte in JSX

DOKUMENTATION
Dokumentiere DirectionMotionProfiles, 64-Frame-Vertrag,
Konsistenzdiagnostik und Cache in `src/ARCHITECTURE.md`, PLANS.md,
CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- ein gültiges Fünf- oder Acht-Richtungs-Partset erzeugt exakt 64 Frames.
- alle Richtungen sind prüfbar.
- Coverage-, Anchor- und Mirror-Fehler blockieren sauber.
- Höhe, FootAnchor und Reihenfolge sind getestet.
- Frames bleiben reproduzierbar.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🧭 feat: generate eight-direction walk sets
```

---

# Prompt 46 — Manuelle Framekorrekturen mit Undo und Redo

**Phase:** E — acht Richtungen und Wiederverwendung

```text
ZIEL
Ermögliche kontrollierte Nachbearbeitung automatisch erzeugter Frames, ohne
Rig, Clip oder Originalbilder destruktiv zu verändern. Jede Korrektur wird als
kleines Delta gespeichert und ist undo-/redo-fähig.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 47.

UMSETZUNG
1. Implementiere den validierten Overridevertrag:
   - Root-Delta
   - Joint-Deltas
   - Part-Transform-Deltas
   - optionaler Layer-Order-Override
   adressiert durch Clip, Richtung und Frame.
2. Deltas umfassen nur explizite Änderungen:
   - offsetX/Y
   - rotationDelta
   - uniform scale multiplier
   - Layerbewegung
3. Implementiere pure Funktionen:
   - `upsertFrameOverride`
   - `removeFrameOverride`
   - `resolveEffectiveFramePose`
   - `resetFrameOverride`
   - `resetDirectionOverrides`
   - `diffFrameFromGeneratedBaseline`
4. Zeige im Frameinspektor:
   - Generated Baseline
   - aktive Korrekturen
   - einzelne Werte zurücksetzen
   - gesamten Frame zurücksetzen
   - Richtung zurücksetzen
5. Viewportbearbeitung:
   - Part oder Joint wählen
   - per Pointer verschieben/drehen
   - Koordinaten-/Winkelfelder als Tastaturalternative
   - ganze Pixel für Position
   - klarer Transformmodus
6. Layeroverride:
   - nur innerhalb bekannter Slots
   - keine Duplikate
   - sichtbarer Reset
7. Implementiere Undo/Redo für Projektmetadaten:
   - Standardtiefe 100
   - Blobs nicht kopieren
   - neue Änderung leert Future
   - Hydration setzt Baseline
   - Autosave persistiert nur Present
8. Tastatur:
   - Strg/Cmd+Z
   - Strg/Cmd+Shift+Z
   - keine Browserkürzel außerhalb fokussierter Workspacekontexte unnötig
     abfangen
9. Partimport-Undo entfernt die Zuweisung, löscht Blob aber erst durch sichere
   Referenzbereinigung.
10. Overrideänderung invalidiert nur betroffene Framecaches.
11. Zeige Dirty-/Save-/Undo-/Redo-Status in der Toolbar.
12. Export nutzt immer Baseline + aktive Deltas.
13. Ergänze Grenzvalidierung und Warnungen für extreme Korrekturen.

ARCHITEKTUR- UND DATENREGELN
- Generated Baseline bleibt rekonstruierbar.
- nur Deltas werden gespeichert.
- History enthält keine Blobbytes oder Object URLs.
- Undo/Redo und Autosave sind getrennte Verantwortungen.
- integer position snapping; Winkel dürfen finite Floats sein.
- Reset entfernt Daten statt Null-Deltas anzuhäufen.
- Override-Order ist deterministisch.

TESTS
- Frameoverride anlegen/ändern/löschen
- effektive Pose
- einzelner und vollständiger Reset
- Richtungsreset
- Layeroverride valid/invalid
- Undo/Redo
- Future nach neuer Änderung
- Historylimit
- Hydration ohne Historyeintrag
- Autosave Present
- Import-Undo ohne Blobverlust
- Cacheinvalidierung
- Keyboard shortcuts
- Tastaturfelder
- Exportframe enthält Delta

NICHT TUN
- kein Pixelmalwerkzeug
- keine Originalbilder verändern
- keine vollständigen Renderframes als Override speichern
- keine unbeschränkte History
- keine Blobs in History
- keine Null-Deltas als dauerhafte Einträge
- keine Pointer-only Transformation

DOKUMENTATION
Dokumentiere Overrideadressierung, History-Ownership, Resetverhalten und
Cacheinvalidierung in `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und
Nutzerhilfe.

FERTIG, WENN
- jeder automatisch erzeugte Frame lässt sich kontrolliert korrigieren.
- Baseline und Deltas bleiben getrennt.
- Undo/Redo ist robust und speichersicher.
- Autosave und Cache reagieren korrekt.
- Export übernimmt Korrekturen.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: ↩️ feat: add frame corrections and history
```

---

# Prompt 47 — Wiederverwendbare Character Kits und Inventar-Ausrüstung

**Phase:** E — acht Richtungen und Wiederverwendung

```text
ZIEL
Mache vollständige Figurensätze und einzelne Ausrüstungsteile
wiederverwendbar. Nutzer sollen wie in einem Inventar kompatible Körperteile,
Rüstungen, Waffen und Accessoires einsetzen und austauschen können.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 48.

UMSETZUNG
1. Vervollständige die `CharacterKit`-Domain:
   - stabile Kit-ID
   - Name/Beschreibung
   - `rigCompatibilityKey`
   - DirectionSourceMode
   - PartAsset-Referenzen
   - Coverage-Zusammenfassung
   - Zeitstempel
2. Implementiere pure Kompatibilitätsprüfung zwischen Kit und Projekt.
3. `rigCompatibilityKey` berücksichtigt nur:
   - RigTemplateId
   - Frameprofil
   - Charakterhöhe
   - Anchor-/Slot-/Direction-Contract-Version
4. Implementiere Repositoryoperationen und Provider/Controller für:
   - Kit aus aktivem Projekt speichern
   - Kit laden
   - Kit duplizieren
   - Kit umbenennen
   - Kit löschen
   - Kit auf Projekt anwenden
5. Anwenden nutzt Referenzen/copy-on-write. Große Bildblobs werden nicht
   unnötig dupliziert.
6. Baue `CharacterKitLibraryView`:
   - Suche
   - Filter nach Rig/Abdeckung
   - Preview
   - Kompatibilitätsstatus
   - Öffnen/Anwenden/Duplizieren/Löschen
7. Teileinventar erhält echte Ausrüstungsinteraktion:
   - Slotkarte wählen
   - kompatible Assets anzeigen
   - Teil einsetzen
   - Teil entfernen
   - ersetzen
   - als eigenes PartAsset in Bibliothek belassen
8. Equipment-Slots:
   - Rüstung Torso/Schulter
   - Handschuhe/Boot-Overlay
   - Haare/Kopfbedeckung
   - Umhang
   - Waffe/Schild
   - Rücken-/Hüftobjekt
   - vier freie Accessoires
9. Freie Accessoires verlangen Attachment-Joint und Default-LayerGroup.
10. Beim Kitwechsel:
    - Projekt-Rig bleibt Eigentümer
    - inkompatible Kits werden blockiert
    - kompatible Partzuweisungen ersetzen kontrolliert
    - bestehende FrameOverrides werden geprüft; ungültige Slotdeltas werden
      vor Übernahme sichtbar bereinigt oder abgebrochen
11. Zeige Coverage- und Mirror-Status vor Anwendung.
12. Löschen eines Kits löscht keine von Projekten referenzierten Blobs.
13. Phase E wird mit einem Test abgeschlossen: zwei NPC-Kits verwenden
    denselben Walk-Clip und erzeugen unterschiedliche, gültige 64-Frame-Sets.

ARCHITEKTUR- UND DATENREGELN
- Kit ist ein Asset-/Referenzpaket, kein dupliziertes Projekt.
- Rig und Clip gehören weiter zum Projekt.
- Compatibility Key ist deterministisch und namenunabhängig.
- Blobsharing ist referenzsicher.
- Inventaraktionen besitzen Tastaturalternative.
- optionale Slots bleiben optional.
- Mirror-/Anchor-Status wird nicht durch Kitimport umgangen.

TESTS
- Kit speichern/laden/duplizieren/löschen
- Compatibility Key
- kompatibel/inkompatibel
- Anwenden mit Referenzen
- Overridekonflikt
- Equipment einsetzen/ersetzen/entfernen
- freies Accessoire ohne Attachment wird abgelehnt
- Kitdelete schützt Projektblobs
- Suche/Filter/Preview
- Tastaturbedienung
- zwei Kits, ein Clip, zwei 64-Frame-Sätze
- Phase-E-Regression aller Richtungen

NICHT TUN
- kein Online-Marktplatz
- keine Cloudbibliothek
- keine Bilder duplizieren, wenn Referenz genügt
- Rig nicht heimlich durch Kit ersetzen
- inkompatible Kits nicht mit Warnung trotzdem anwenden
- keine unkontrollierte Overrideübernahme
- keine Tier-/Fahrzeugkits

DOKUMENTATION
Dokumentiere Kitvertrag, Compatibility Key, Blobsharing,
Equipment-Slotmodell und Overridekonflikte in `src/ARCHITECTURE.md`, PLANS.md,
CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- vollständige humanoide Character Kits sind lokal wiederverwendbar.
- Ausrüstung funktioniert als nachvollziehbares Slotinventar.
- Kompatibilität, Coverage und Overrides werden kontrolliert.
- Blobs bleiben referenzsicher.
- zwei unterschiedliche NPCs nutzen denselben automatischen Walk-Clip.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🎒 feat: add reusable character kits
```

---

# Prompt 48 — SpriteSheet-, Einzelbild-, JSON- und .pfanim-Export

**Phase:** F — Export, Integration und Release

```text
ZIEL
Implementiere den neutralen Produktions- und Projektexport. Ein validiertes
8-Richtungs-Walk-Projekt erzeugt ein transparentes 1024×1024-SpriteSheet,
64 Einzelbilder, Metadaten und ein vollständig reimportierbares `.pfanim`.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 49.

UMSETZUNG
1. Implementiere pure SpriteSheet-Layoutfunktionen:
   - 8 Richtungszeilen in kanonischer Reihenfolge
   - 8 Framespalten
   - FrameRects
   - Sheetgröße
   - optionale Margin/Spacing-Werte mit Default 0
2. Erzeuge aus 64 gerenderten RGBA-Frames eine RGBA-Sheetoberfläche.
3. Implementiere einen Browser-PNG-Encoding-Port:
   - RGBA/`ImageData` auf native Canvas/OffscreenCanvas übertragen
   - PNG-Blob ausgeben
   - keine Skalierung oder Glättung
4. Implementiere neutrales `spriteSheetMetadata`-JSON V1:
   - Application/Format/Kind
   - Projekt/Clip/FPS/Loop
   - Frame-/Sheetgröße
   - FootAnchor
   - Richtungsreihenfolge
   - alle 64 Regionen
5. Implementiere Einzelbildexport mit stabilen Namen:
   `walk_<direction>_<00-07>.png`.
6. Implementiere Exportvalidierung mit harten Fehlern und bestätigbaren
   Warnungen laut Exportspezifikation.
7. Baue ein Exportpanel:
   - SpriteSheet PNG
   - Metadaten JSON
   - Einzelbilder
   - vollständiges Projektbundle
   - Status/Progress/Cancel-Anschluss
8. Implementiere `.pfanim` als ZIP:
   - manifest.json
   - project.json
   - Part-Metadaten
   - Original-PNG-Blobs
   - optionale Preview
9. Füge für ZIP eine kleine begründete Bibliothek hinzu, vorzugsweise die
   aktuelle kompatible `fflate`-Version. Committe `package-lock.json`.
10. Bundleimport:
    - Dateipfad-Sicherheit
    - Größen-/Dateizahllimits
    - Manifest zuerst
    - alles als unknown validieren
    - Referenzgraph vollständig prüfen
    - ID-Konfliktentscheidung
    - erst danach transaktional schreiben
11. Exportiere keine unreferenzierten Blobs.
12. Import eines Bundles erzeugt ein neues oder bewusst ersetztes Projekt und
    öffnet es erst nach erfolgreichem Commit.
13. Verwende Object URLs nur für kontrollierte Downloads und revoke sie.
14. Teste PNG-Pixel über dekodierte RGBA-Daten, nicht über möglicherweise
    encoderabhängige Binärbytes.
15. Ergänze einen Roundtrip:
    Projekt → `.pfanim` → leeres MemoryRepository → semantisch gleiches
    Projekt und pixelgleiche Renderframes.

ARCHITEKTUR- UND DATENREGELN
- neutrale JSON-Metadaten sind Quelle der Wahrheit.
- Sheetlayout ist pure Domainlogik.
- PNG-Encoding verändert keine Pixel.
- Bundlepfade sind relativ und sicher.
- Import schreibt erst nach Gesamtvalidierung.
- Originalbilder bleiben erhalten.
- keine absoluten lokalen Pfade.
- Exportstatus unterscheidet Warnung/Fehler.

TESTS
- 8×8 Layout = 1024×1024 bei 128er Frames
- alle 64 Rects korrekt
- Richtung/Frame-Zellen
- Sheetpixel an Zellgrenzen
- transparente Bereiche
- PNG decode pixelgleich
- stabile Dateinamen
- Hard error blockiert
- Warning confirmation
- `.pfanim`-Manifest
- Zip-Slip-/`..`-Pfad abgelehnt
- Größen-/Dateilimit
- fehlender Blob
- ID-Konflikt
- atomarer Import
- Projektbundle-Roundtrip
- Object-URL-Cleanup

NICHT TUN
- noch kein Godot-spezifischer Export
- keine Base64-Projektdateien
- keine absoluten Pfade
- keine unvalidierten ZIP-Einträge schreiben
- keine unreferenzierten Blobs exportieren
- keine Behauptung, dass PNG-Binärbytes browserübergreifend identisch sind
- kein Download bei abgebrochenem/fehlgeschlagenem Job

DOKUMENTATION
Dokumentiere Exportdateien, Layout, Bundleinhalt, Sicherheitslimits und
Roundtrip in `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- vollständige neutrale Exportpalette ist nutzbar.
- SpriteSheet, Einzelbilder und JSON stimmen exakt überein.
- `.pfanim` enthält editierbare Originaldaten und ist roundtrip-fähig.
- fehlerhafte Bundles verändern den Workspace nicht.
- Downloads und Ressourcen werden sauber freigegeben.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 📦 feat: export sprite sheets and project bundles
```

---

# Prompt 49 — Versionierter Godot-4.x-Export

**Phase:** F — Export, Integration und Release

```text
ZIEL
Erzeuge aus dem neutralen SpriteSheet-Metadatenmodell ein direkt nutzbares,
versioniertes Godot-4.x-Paket mit SpriteFrames-Ressource, PNG, JSON und
Importanleitung.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 50.

UMSETZUNG
1. Definiere den Exporttargetvertrag:
   `{engine:"godot", major:4}`.
2. Implementiere einen frameworkfreien `Godot4ExportModel`-Builder aus den
   neutralen SpriteSheet-Metadaten.
3. Generiere eine textuelle `SpriteFrames`-`.tres`-Ressource:
   - externe SpriteSheet-Referenz
   - AtlasTexture-Unterressource pro Frame
   - Region je SpriteSheet-Zelle
   - acht Animationen
   - Loop true
   - Speed aus Projekt-FPS
   - Frames 0–7 in korrekter Reihenfolge
4. Verwende stabile Engine-Namen:
   - walk_south
   - walk_south_east
   - walk_east
   - walk_north_east
   - walk_north
   - walk_north_west
   - walk_west
   - walk_south_west
5. Escape/normalisiere Dateipfade und Ressourcennamen sicher.
6. Paketstruktur:
   - `<name>_walk.png`
   - `<name>_walk.json`
   - `<name>_sprite_frames.tres`
   - `README_IMPORT.md`
7. `README_IMPORT.md` erklärt:
   - Ordner in Godot-Projekt kopieren
   - PNG-Import abwarten
   - SpriteFrames einem AnimatedSprite2D zuweisen
   - Animation nach Bewegungsrichtung auswählen
   - FootAnchor aus JSON für Origin/Kollision nutzen
8. Binde den Export als weitere Auswahl in das Exportpanel ein.
9. Paket kann als ZIP geladen werden; es enthält keine absoluten Pfade.
10. Lege eine synthetische, reviewbare `.tres`-Fixture im Testbereich ab.
11. Wenn eine passende Godot-4-Ausführung lokal vorhanden ist:
    - minimalen Importtest durchführen
    - Ressource laden
    - acht Animationen prüfen
12. Wenn Godot nicht vorhanden ist:
    - keine erfolgreiche Engineprüfung behaupten
    - Text-/Syntax-/Regionsfixtures vollständig testen
    - offenen manuellen Test im Bericht nennen
13. Hardcode keine konkrete Godot-Patchversion als dauerhaften Datenvertrag.
14. Neutrale JSON-Datei bleibt maßgeblich; der Godotadapter verändert sie
    nicht.

ARCHITEKTUR- UND DATENREGELN
- Engineadapter hängt von neutralen Metadaten ab, nicht vom React-Workspace.
- Godotpfade sind relativ.
- Animationen besitzen exakt 8 Frames.
- `.tres` ist deterministisch sortiert.
- Targetmajor 4 ist explizit.
- kein Godot-spezifischer Zustand im AnimationProject.
- keine unbestätigte Kompatibilitätsbehauptung.

TESTS
- acht Animationsnamen
- je 8 Frames
- FPS/Loop
- 64 Regionen entsprechen JSON
- stabile Resource-/Subresource-IDs
- Pfadescaping
- Paketstruktur
- README-Inhalt
- ZIP ohne absolute Pfade
- exakte `.tres`-Fixture
- optionaler echter Godot-Import, falls verfügbar
- neutraler Export bleibt unverändert

NICHT TUN
- keine Godot-3-Unterstützung
- keine vollständige Player-Scene/Controllerlogik
- keine absoluten Projektpfade
- keine aktuelle Patchversion als Schema
- keine Behauptung eines durchgeführten Godot-Tests ohne Ausführung
- neutrale Metadaten nicht zugunsten der Engine umformen

DOKUMENTATION
Dokumentiere Godot-Ziel, Paketstruktur, Animationsnamen, Teststatus und
Importanleitung in `src/ARCHITECTURE.md`, PLANS.md, CHANGELOG.md und README.

FERTIG, WENN
- ein gültiges Projekt erzeugt ein vollständiges Godot-4-Paket.
- SpriteFrames enthält acht korrekte Walk-Animationen.
- Pfade, Regionen, FPS und Loop sind getestet.
- reale Engineprüfung ist durchgeführt oder transparent als offen markiert.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🎮 feat: add Godot animation export
```

---

# Prompt 50 — Prompt-zu-Animation-Übergabe und performanter Workerexport

**Phase:** F — Export, Integration und Release

```text
ZIEL
Verbinde beide Studio-Module fachlich: ein humanoides Charakterprofil aus dem
Prompt Studio kann ein validiertes Animationsprojekt vorbereiten. Gleichzeitig
werden 64-Frame-Rendering, PNG-Encoding und Packaging in einen abbrechbaren
Workerpfad verlagert.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 51.

UMSETZUNG
TEIL A — PROMPT-ZU-ANIMATION

1. Implementiere eine pure Mappingfunktion:
   `createAnimationProjectSeedFromCharacterProfile`.
2. Sie akzeptiert nur ein erfolgreich aufgelöstes, humanoides Characterprofil
   und liefert eine Resultunion aus Seed oder strukturierten Blockern.
3. Übertrage ausschließlich relevante Werte:
   - AssetProfile-ID
   - Name/Bezeichnung
   - wirksame Figurenhöhe
   - Compatibility Key
   - directionCount
   - konfigurierte Animationsaktionen/Framewünsche
4. Lege keine Prompttexte, Kleidungstexte oder irrelevanten Kategorien in
   Animationsprojektdaten ab.
5. Das Built-in-Walktemplate besitzt 8 Frames. Wenn das Promptprofil Walk mit
   einer anderen Framezahl anfordert, zeige einen bestätigungspflichtigen
   Konflikt:
   - gewünschte Framezahl
   - verfügbarer Templatewert 8
   - bewusste Übernahme des 8-Frame-Templates
   Keine stille Änderung.
6. Wenn directionCount 4 ist, zeige ebenfalls eine bewusste Entscheidung:
   - Projekt vorerst als 4-Richtungsanforderung markieren oder
   - auf den 8-Richtungs-MVP hochstufen
   Ein 8-Richtungs-Export darf nicht still behauptet werden.
7. Füge Aktionen hinzu:
   - Profilbibliothek: `Im Animation Studio verwenden`
   - Review/Ausgabe: `Animationsprojekt vorbereiten`
   - Prompt-Dashboard: klarer Cross-Studio-Einstieg
8. Nach Bestätigung:
   - Projekt über ProjectProvider/Repository anlegen
   - `sourcePrompt`-Referenz speichern
   - zum Animation Workspace navigieren
   - Körperteilimport als nächster Schritt erklären
9. Kein PNG wird aus einem Textprompt erfunden oder automatisch übertragen.
10. Gelöschtes Quellprofil macht das Animationsprojekt nicht unlesbar; die
    Referenz wird als nicht auflösbar angezeigt.

TEIL B — WORKER UND PERFORMANCE

11. Definiere ein versioniertes Workerprotokoll für:
    - renderFrames
    - composeSpriteSheet
    - encode/export vorbereiten
    - bundle packaging
    - progress
    - cancel
    - completed
    - failed
12. Übergib serialisierbare RGBA-/Metadaten; keine React-Objekte oder Object
    URLs.
13. Verschiebe vollständige 64-Frame-Generierung und Sheetkomposition vom
    Hauptthread. PNG-Encoding läuft im Worker, wenn OffscreenCanvas verfügbar
    ist, sonst über einen kontrollierten asynchronen Adapterfallback.
14. Exportjobs sind abbrechbar und revisionsgebunden. Ein Ergebnis einer alten
    Projektrevision wird verworfen.
15. Implementiere Cache- und Ressourcenstrategie:
    - dekodierte Quellen pro Blobrevision
    - Renderframes pro Projekt-/Clip-/Richtungsrevision
    - begrenzte Cachegröße
    - Freigabe bei Projektwechsel
16. UI zeigt echte Fortschritte:
    `validating → rendering n/64 → encoding → packaging`.
17. Workerfehler führen zu sichtbarem Fehlerstatus und keinem Teil-Download.
18. Teste Workercontroller mit einem Fake Worker unabhängig vom Browser.

ARCHITEKTUR- UND DATENREGELN
- Mappingfunktion bleibt frameworkfrei.
- Prompt- und Animationsschemas bleiben getrennt.
- nur relevante, aufgelöste Werte werden übergeben.
- 5→8 Frames oder 4→8 Richtungen nie still verändern.
- Workerprotokoll ist typisiert und versioniert.
- Resultate alter Revisionen werden nicht übernommen.
- Blobs/Object URLs gehören nicht in React-Worker-Nachrichten, wenn sie nicht
  explizit transferierbar und kontrolliert sind.
- UI bleibt während Export bedienbar.

TESTS
- gültiges humanoides Characterprofil
- nicht humanoid/falsche Kategorie/Profilkonflikt
- Figurenhöhe und IDs
- Walk 8 ohne Konflikt
- Walk 5 mit Bestätigung
- Direction 4 mit Entscheidung
- Quellprofil später gelöscht
- jede Cross-Studio-Aktion
- Projektanlage/Navigationsziel
- kein PNG-Autotransfer
- Workerprotokoll
- Progress 0–64
- Cancel
- alte Revision verworfen
- Workerfehler
- Fallbackpfad
- Cachebegrenzung/Freigabe
- Prompt- und Animation-Regression

NICHT TUN
- keine zyklische Providerabhängigkeit
- keine komplette Promptantwort in AnimationProject kopieren
- keine stille Frame-/Richtungsumwandlung
- keine Bildgenerierung
- kein blockierender Voll-Export auf dem React-Hauptthread
- keine unversionierten Workernachrichten
- keine Übernahme veralteter Workerresultate

DOKUMENTATION
Dokumentiere Handoff-Mapping, ausgeschlossene Felder, Konfliktentscheidungen,
Workerprotokoll, Cache und Fallback in `src/ARCHITECTURE.md`, PLANS.md,
CHANGELOG.md und Nutzerhilfe.

FERTIG, WENN
- humanoide Promptprofile können kontrolliert Animationsprojekte anlegen.
- Konflikte bei Framezahl/Richtungszahl sind sichtbar und bestätigungspflichtig.
- Cross-Studio-Navigation funktioniert.
- Batchrendering und Packaging blockieren den Hauptthread nicht.
- Progress, Cancel, Revision und Fehler sind robust.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: 🔗 feat: connect and optimize PixelForge studios
```

---

# Prompt 51 — Accessibility-, Responsive-, Regressions- und Release-Abnahme V3

**Phase:** F — Export, Integration und Release

```text
ZIEL
Führe die vollständige Release-Abnahme von PixelForge Studio 3.0 durch. Das
Prompt Studio bleibt kompatibel; das Animation Studio liefert den
Humanoid-Walk-MVP mit acht Richtungen, Projektbundle und Godot-Export.

VOR BEGINN
1. Lies AGENTS.md.
2. Lies die für diesen Auftrag relevanten bestehenden V2-Dokumente.
3. Lies im Planungspaket mindestens:
   - docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
4. Prüfe den echten aktuellen Repository-Stand; überschreibe keine inzwischen
   weiterentwickelten Lösungen blind.
5. Aktualisiere PLANS.md mit aktuellem Prompt, Ausgangsstand und
   Abnahmekriterien.
6. Bearbeite ausschließlich diesen Prompt. Beginne nicht selbstständig mit
   Prompt 52.

UMSETZUNG
1. Führe zuerst einen vollständigen Ist-Audit durch und aktualisiere PLANS.md
   mit offenen Punkten. Ergänze keine neue Produktfunktion außerhalb dieser
   Releasehärtung.
2. Prüfe jede globale und modulare View:
   - Studio Home
   - alle sechs Prompt-Views
   - Animation Projekte
   - Workspace
   - Character Kits
   - Rig-Vorlagen
3. Accessibility-Audit:
   - Skip-Link/Landmarks/Überschriften
   - Fokus nach Navigation
   - Modulumschalter
   - Dialogfokus
   - sichtbarer Fokus
   - Labels/Fehler/Live-Regionen
   - Tastaturalternative für Import, Anchor, Transform, Timeline und Inventar
   - 200 % Zoom
   - reduced motion
4. Responsive-Audit:
   - großer Desktop
   - mittlere Breite
   - kleine schrittweise Workspaceansicht
   - keine überdeckten Headeraktionen
   - keine unerreichbaren Paneele
5. Kompatibilitätsaudit:
   - alle alten `?view=`-Links
   - Prompt-Storage V2
   - Prompt-ExportBundle V2
   - V1→V2-Promptmigration
   - Profile/Wizard/Output
   - bestehende Fixtures
6. Animation-Abnahme:
   - Projekt CRUD/Autosave/Recovery
   - PNG-Import/Trim/Anchors
   - `humanoid-80-v1`
   - South Walk
   - fünf Quellen + Spiegelreview
   - 64 Frames
   - Korrekturen/Undo/Redo
   - Character Kits
   - 1024×1024-Sheet
   - JSON
   - `.pfanim` Roundtrip
   - Godot-Paket
7. Browsermatrix mindestens Chromium und Firefox. Dokumentiere Datum,
   Version/Umgebung und Resultat.
8. Wenn Godot verfügbar ist, führe den realen Importtest aus. Wenn nicht,
   markiere ihn exakt als offene manuelle Prüfung.
9. Prüfe Leistung und Ressourcen:
   - Workerprogress/Cancel
   - kein Hauptthread-Vollbatch
   - Cachefreigabe
   - Object-URL-Revoke
   - IndexedDB-Fehler
   - keine Autosave-Schleife
10. Aktualisiere verbindlich:
    - README.md
    - AGENTS.md
    - CHANGELOG.md
    - src/ARCHITECTURE.md
    - docs/TECHNOLOGIE-STACK-V2.md oder ein neues Dach-Stack-Dokument
    - docs/index.md
    - neue V3-Release-Acceptance
11. Benenne bestehende V2-Dokumentation als Prompt-Studio-V2-Vertrag; lösche
    keine historischen Nachweise.
12. Setze erst nach grüner Abnahme:
    - `package.json` Version `3.0.0`
    - sichtbares Brandlabel `V3`
13. Prüfe Repositoryname und `origin`:
    `kleiveist/PixelForgeStudio`. Wenn der Admin-Rename noch offen ist,
    bleibt dies ein Releaseblocker und wird nicht verschwiegen.
14. Entferne tote Placeholder, Debugausgaben, unreferenzierte Testhacks und
    versehentliche Defaultänderungen.
15. Führe vollständige Tests mehrfach nach finalen Dokument-/Versionsänderungen
    aus.
16. Erstelle einen finalen Releasebericht mit:
    - Funktionsmatrix
    - Testmatrix
    - Browsermatrix
    - Godotstatus
    - Kompatibilitätsnachweis
    - Restrisiken
    - bewusst verschobene Roadmap
17. Kein Push/Release-Tag ohne zusätzliche explizite Freigabe.

ARCHITEKTUR- UND DATENREGELN
- Releasehärtung statt neuer Scope.
- Prompt-Protokollidentifier und Storage-Keys bleiben stabil.
- Animationformat bleibt V1.
- Produktversion 3.0.0 ist von Datenversionen getrennt.
- alle Behauptungen müssen durch Test/Prüfung belegt sein.
- historische Migrationsdaten bleiben erhalten.
- kein Python in der Hauptanwendung.
- keine Entfernung bestehender Kompatibilitätsverträge ohne Paritätsnachweis.

TESTS
- vollständiges `npm run verify`
- gezielte Pixel-/Schema-/Repository-/Worker-/UI-Tests
- alte Prompt-Bundle- und Storagefixtures
- Route/Browserhistory
- `.pfanim` Roundtrip
- 64-Frame- und Sheetprüfung
- Godot-Fixture/optional echter Import
- Tastaturflows
- reduced motion
- Chromium/Firefox manuell
- git diff --check
- sauberer finaler Status nach Commit

NICHT TUN
- keine neue Clip-/Rigfamilie
- kein Tauri
- keine Cloud
- keine AI-Bildanalyse
- keine verspätete Protokollumbenennung
- keine rote Prüfung akzeptieren
- keinen Remote-/Browser-/Godot-Test erfinden
- keine Pushes oder Tags ohne Freigabe

DOKUMENTATION
Erstelle beziehungsweise finalisiere ein Dach-Architekturdokument,
`docs/PIXELFORGE-STUDIO-V3-RELEASE-ACCEPTANCE.md`, README, AGENTS, Changelog,
Dokumentationsindex und PLANS-Abschluss. Halte Roadmap-Punkte ausdrücklich
außerhalb des Releaseumfangs.

FERTIG, WENN
- PixelForge Studio 3.0.0 ist vollständig dokumentiert.
- Prompt Studio V2 bleibt nachweislich kompatibel.
- Animation Studio erzeugt den geprüften 8-Richtungs-Walk-MVP.
- Export- und Projektformate sind roundtrip-fähig.
- Accessibility, Responsive, Browser und Performance sind geprüft.
- Repositoryname ist korrekt oder der Release wird nachvollziehbar blockiert.
- alle automatischen Prüfungen sind grün.

PRÜFUNG
- npm run typecheck
- npm run test:run
- npm run build
- npm run verify
- git diff --check
- git status --short

ABSCHLUSSBERICHT
Nenne:
- geänderte Dateien,
- umgesetztes Nutzerverhalten,
- ausgeführte Tests und Resultate,
- offene Risiken oder bewusst verschobene Punkte,
- den nächsten Prompt,
- und den Commit.

STOPPE DANACH.

Commit-Vorschlag: ✅ release: ship PixelForge Studio 3.0
```

---
