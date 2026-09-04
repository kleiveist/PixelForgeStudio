<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

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
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md
   - docs/aufgaben/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md
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
