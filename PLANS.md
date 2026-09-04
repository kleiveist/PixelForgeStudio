# PixelForge Studio — Arbeitsplan

## Status

- **Aktuelle Aufgabe:** Dokumentation und offene Promptserie einsatzbereit ordnen (abgeschlossen)
- **Nächste Aufgabe:** Prompt 28 — Repository und Produkt umbenennen (nicht begonnen)
- **Abgeschlossene V2-Serie:** Prompts 00–27; archiviert unter `docs/erledigt/`
- **Vorbereitete Serie:** Prompts 28–51 unter
  `docs/aufgaben/pixelforge-studio-v3/prompts/`; vollständig offen
- **Arbeitsregel:** genau eine beauftragte Phase umsetzen, prüfen und getrennt committen

## Plan — Dokumentationsordnung

1. Aktive Leitdokumente von abgeschlossenen V2- und V1-Unterlagen trennen.
2. Historische Markdown-Dateien ohne Inhaltsverlust nach `docs/erledigt/`
   verschieben.
3. Prüfen, ob ausführbarer V1-JavaScript-Code übrig ist; TypeScript-
   Kompatibilitätscode und Migrationsfixtures erhalten.
4. Die offene Serie 28–51 separat ausweisen, ohne Prompt 28 zu beginnen.
5. Alle verschobenen Verweise aktualisieren und die Navigation mit
   PyGitIndex 2.1.0 neu erzeugen.
6. Links, Paketchecksummen, `npm run verify` und `git diff --check` prüfen.

## Ergebnis — Dokumentationsordnung

1. `ASSISTANT-MASTER-PROMPT.md`, `CODEX-V2-UMSETZUNGSANWEISUNG.md` und
   `LEGACY-V1-BASELINE.md` wurden bytegleich nach `docs/erledigt/` verschoben.
2. Direkt unter `docs/` verbleiben nur die drei weiterhin aktiven
   Prompt-Studio-Verträge und die Dokumentationsübersicht.
3. Ausführbarer V1-JavaScript-Code ist im Arbeitsbaum nicht mehr vorhanden.
   Die aktive TypeScript-Kompatibilitätsdomain und ihre Migrationsfixtures
   bleiben erhalten.
4. Die Prompts 28–51 sind als offene Serie verlinkt; Prompt 28 wurde nicht
   begonnen. Alle 43 SHA-256-Prüfungen des Pakets sind erfolgreich.
5. PyGitIndex 2.1.0 ist aktuell. Alle 64 Markdown-Dateien besitzen gültige
   lokale Links; `npm run verify` bestand mit 107 Testdateien und 614 Tests.

## Nachtrag — einsatzbereite Aufgabenstruktur

1. Die vollständige offene Serie liegt unter
   `docs/aufgaben/pixelforge-studio-v3/`.
2. Verbindliche Planungsunterlagen liegen unter `grundlagen/`, ausführbare
   Einzelaufträge unter `prompts/` und Übergabevorlagen unter `templates/`.
3. Alle Pfade in den Einzelprompts zeigen vom Repository-Root auf diese
   Struktur; der Einstieg erfolgt über `START_HERE.md`.
4. PyGitIndex indexiert die Aufgabenserie direkt. Die Prüfung aller neun
   Indizes meldet 58 eindeutige Einträge und keine Dopplungen.

## Übergabe

- Prompt 28 oder spätere Phasen erst nach einem neuen konkreten Auftrag
  beginnen.
- Abgeschlossene Phasenkataloge und Nachweise bleiben unverändert als Historie
  unter `docs/erledigt/` erhalten.
- Neue öffentliche Modulgrenzen werden weiterhin in `src/ARCHITECTURE.md`
  dokumentiert.
