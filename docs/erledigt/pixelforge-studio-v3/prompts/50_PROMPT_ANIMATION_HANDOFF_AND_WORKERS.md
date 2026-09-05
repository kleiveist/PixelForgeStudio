<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

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
