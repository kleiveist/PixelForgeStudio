# PixelForge Prompt Studio V2 — Arbeitsplan

## Status

- **Aktuelle Aufgabe:** Dokumentations-Refresh für kommende Prompt-Phasen (abgeschlossen)
- **Nächste Aufgabe:** noch nicht beauftragt
- **Abgeschlossene V2-Serie:** Prompts 00–27; archiviert unter `docs/erledigt/`
- **Arbeitsregel:** genau eine beauftragte Phase umsetzen, prüfen und getrennt committen

## Plan — Dokumentations-Refresh

1. Aktive Leitdokumente von abgeschlossenen Phasen- und Releaseunterlagen trennen.
2. Die doppelte, rekursiv indexierte Projektdokumentation entfernen.
3. Die Root-README auf Produktzweck, Einstiegspunkte, npm-Befehle und
   Indexierung reduzieren.
4. Alle verschobenen Verweise aktualisieren und die Navigation mit
   PyGitIndex 2.1.0 neu erzeugen.
5. Links, Dokumentationsindex, `npm run verify` und `git diff --check` prüfen.
6. Ausschließlich den Dokumentations-Refresh mit einem englischen
   Emoji-Conventional-Commit committen.

## Ergebnis — Dokumentations-Refresh

1. Die Root-README enthält nur noch Produktzweck, Schnellstart,
   Einstiegspunkte, npm-Befehle und Hinweise zur Indexpflege.
2. Die abgeschlossene V2-Serie, Releaseberichte und die historische
   Zielvorlage liegen unter `docs/erledigt/`; aktive Verträge bleiben direkt
   unter `docs/`.
3. Die rekursive Kopie `docs/pixelforge-v2-docs/` wurde entfernt.
4. PyGitIndex 2.1.0 erzeugte alle Übersichten und Rückverweise neu; der
   Prüfmodus meldet keinen offenen Indexierungsbedarf.
5. Alle 21 Markdown-Dateien besitzen gültige relative Links. `npm run verify`
   bestand mit 107 Testdateien und 614 Tests; Typecheck und Build sind grün.

## Übergabe

- Neue Prompt-Phasen werden erst nach einem konkreten Auftrag als aktive
  Arbeitsunterlage ergänzt.
- Abgeschlossene Phasenkataloge und Nachweise bleiben unverändert als Historie
  unter `docs/erledigt/` erhalten.
- Neue öffentliche Modulgrenzen werden weiterhin in `src/ARCHITECTURE.md`
  dokumentiert.
