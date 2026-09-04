<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

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
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
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
