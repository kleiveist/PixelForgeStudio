<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](README.md)
<!-- PYGINDEX:NAVIGATION END -->

# START HERE

## 1. Zuerst lesen

1. `docs/erledigt/pixelforge-studio-v3/grundlagen/00_REPOSITORY_BASELINE.md`
2. `docs/erledigt/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md`
3. `docs/erledigt/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md`
4. `docs/erledigt/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md`
5. `docs/erledigt/pixelforge-studio-v3/grundlagen/05_DATA_STORAGE_AND_FORMATS.md`
6. `docs/erledigt/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md`

## 2. Aktueller Ausführungsstand

Prompts 28 bis 51 und damit die Phasen A bis F sind vollständig abgeschlossen.
Das Animation Studio besitzt nun Grundlagen, Projektpersistenz, den
Rig-/Part-Workflow, den deterministischen acht Frames langen Walk-Laufzyklus,
acht Richtungen, Character Kits und die vollständigen Releaseexporte. Der
letzte ausgeführte Einzelauftrag war:

```text
docs/erledigt/pixelforge-studio-v3/prompts/51_PIXELFORGE_STUDIO_V3_RELEASE.md
```

Die Prompts wurden genau in Reihenfolge ausgeführt. Dieses Dokument ist nur
noch die erhaltene historische Einstiegs- und Lesereihenfolge; aus diesem
Paket ist keine weitere Aufgabe zu starten.

## 3. Keine Abkürzung über einen Komplett-Prompt

Die Datei `docs/erledigt/pixelforge-studio-v3/grundlagen/CODEX-PIXELFORGE-STUDIO-PROMPTS.md` enthält den gesamten
Katalog zum Lesen und Archivieren. Für die tatsächliche Umsetzung wurden die
Einzeldateien unter `docs/erledigt/pixelforge-studio-v3/prompts/` verwendet
werden. Dadurch bleiben Diff, Tests, Risiken und Commits je Phase
kontrollierbar.

## 4. Abnahmeprinzip

Ein Prompt gilt nur dann als erledigt, wenn:

- sein Funktionsumfang vollständig umgesetzt ist,
- neue Domain-Logik getestet ist,
- UI-Verhalten nutzerzentriert getestet ist,
- Persistenz- und Importgrenzen validiert sind,
- `npm run verify` erfolgreich ist,
- `git diff --check` sauber ist,
- Architektur- und Planungsdokumentation aktualisiert wurde,
- und ein eigener Commit erstellt wurde, sofern die fortlaufende Serie
  ausdrücklich beauftragt wurde.
