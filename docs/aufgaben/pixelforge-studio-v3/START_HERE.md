<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](README.md)
<!-- PYGINDEX:NAVIGATION END -->

# START HERE

## 1. Zuerst lesen

1. `docs/aufgaben/pixelforge-studio-v3/grundlagen/00_REPOSITORY_BASELINE.md`
2. `docs/aufgaben/pixelforge-studio-v3/grundlagen/01_PRODUCT_NAMING_AND_COMPATIBILITY.md`
3. `docs/aufgaben/pixelforge-studio-v3/grundlagen/02_TARGET_ARCHITECTURE.md`
4. `docs/aufgaben/pixelforge-studio-v3/grundlagen/04_ANIMATION_PRODUCTION_RULES.md`
5. `docs/aufgaben/pixelforge-studio-v3/grundlagen/05_DATA_STORAGE_AND_FORMATS.md`
6. `docs/aufgaben/pixelforge-studio-v3/grundlagen/07_TEST_AND_RELEASE_STRATEGY.md`

## 2. Aktueller Ausführungsstand

Prompts 28 bis 33 sind abgeschlossen; Phase A ist vollständig und Phase B
besitzt Domain- sowie strikte Schema-V1-Grundverträge. Beginne nach einem
neuen konkreten Auftrag als Nächstes mit:

```text
docs/aufgaben/pixelforge-studio-v3/prompts/34_INDEXEDDB_ANIMATION_REPOSITORY.md
```

Führe anschließend weiterhin genau einen Prompt nach dem anderen bis Prompt 51
aus.

## 3. Keine Abkürzung über einen Komplett-Prompt

Die Datei `docs/aufgaben/pixelforge-studio-v3/grundlagen/CODEX-PIXELFORGE-STUDIO-PROMPTS.md` enthält den gesamten
Katalog zum Lesen und Archivieren. Für die tatsächliche Umsetzung sollen die
Einzeldateien unter `docs/aufgaben/pixelforge-studio-v3/prompts/` verwendet
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
