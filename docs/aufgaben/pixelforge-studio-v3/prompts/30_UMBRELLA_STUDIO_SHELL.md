<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

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
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
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
