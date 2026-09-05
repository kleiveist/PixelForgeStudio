<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

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
