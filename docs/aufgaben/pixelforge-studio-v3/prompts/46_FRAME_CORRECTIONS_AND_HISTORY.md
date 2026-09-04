<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

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
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
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
