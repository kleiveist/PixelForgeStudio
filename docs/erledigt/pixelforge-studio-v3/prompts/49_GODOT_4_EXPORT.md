<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

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
