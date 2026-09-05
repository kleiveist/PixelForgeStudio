<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

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
