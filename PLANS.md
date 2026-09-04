# PixelForge Studio — Arbeitsplan

## Status

- **Aktuelle Aufgabe:** Prompt 29 — modulbasierte Studio-Routen (abgeschlossen)
- **Nächste Aufgabe:** Prompt 30 — globale Studio-Shell (nicht begonnen)
- **Abgeschlossene V2-Serie:** Prompts 00–27; archiviert unter `docs/erledigt/`
- **Aktive Serie:** Prompts 28–29 abgeschlossen; Prompts 30–51 offen unter
  `docs/aufgaben/pixelforge-studio-v3/prompts/`
- **Arbeitsregel:** genau eine beauftragte Phase umsetzen, prüfen und getrennt committen

## Prompt 28 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `b708a3b`
- Ausgangs-Remote: `https://github.com/kleiveist/PixelartPromptStudio.git`
- GitHub CLI: als `kleiveist` angemeldet; Remote-Rename wird vor der lokalen
  URL-Änderung gegen GitHub geprüft
- Baseline: `npm run verify` erfolgreich mit 107 Testdateien und 614 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: Dachmarke und beide Modulnamen zentral typisiert; npm-Paket und
  sichtbare Produkttexte umbenannt; Prompt-Export-ID, Storage-Keys sowie
  Schema-/Formatversion 2 unverändert; Altbundle-Regression grün
- Grenze: keine Studio-Shell, keine neue Navigation und kein Prompt 29

## Prompt 28 — Ergebnis

1. Das private GitHub-Repository wurde mit bestätigtem `ADMIN`-Recht zu
   `kleiveist/PixelForgeStudio` umbenannt; `origin` verwendet weiterhin HTTPS
   und zeigt auf den neuen Namen.
2. npm-Paket, HTML-Metadaten, README und sichtbare Dachmarke verwenden
   `PixelForge Studio`; die Paketversion bleibt `2.0.0`.
3. `BRAND` veröffentlicht Dachprodukt sowie Prompt- und Animationsmodul zentral
   typisiert. Bestehende Prompt-Ausgaben verwenden weiterhin exakt
   `PixelForge Prompt Studio`; die Animations-ID ist nur reserviert.
4. Storage-Namespaces, Schema-/Formatversion 2, Promptdefaults und
   Profilauflösung wurden nicht verändert. Alte ExportBundles bleiben lesbar.
5. Gezielte Prüfung: 3 Testdateien und 37 Tests bestanden. Vollständige
   Prüfung: 108 Testdateien und 617 Tests, Typecheck und Build bestanden;
   `git diff --check` ist sauber.
6. Prompt 29 wurde nicht begonnen. Die bestehende Prompt-Studio-App-Shell und
   Navigation bleiben funktional unverändert.

## Prompt 29 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `2dc6b20`
- Baseline: `npm run verify` erfolgreich mit 108 Testdateien und 617 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Bestehende URL: `?view=<PromptStudioView>` mit sechs stabilen Prompt-Views
- Abnahme: typisierte Dachrouten für Home, Prompt Studio und Animation Studio;
  strukturierter Parser, kanonischer Serializer, StableId-Projektparameter,
  Browser-History und Übergangsaliase für die bestehende Prompt-Oberfläche
- Grenze: keine sichtbare Studio-Shell, keine Animationsprojektlogik und kein
  Prompt 30

## Prompt 29 — URL-Matrix

| Form | Ergebnis |
|---|---|
| `?studio=home` | kanonische Home-Route |
| `?studio=prompt&view=<PromptStudioView>` | kanonische Prompt-Route |
| `?studio=animation&view=<AnimationStudioView>` | kanonische Animationsroute |
| `?studio=animation&view=workspace&project=<StableId>` | kanonischer Workspace mit Projekt |
| `?view=<PromptStudioView>` | gültige Bestandsroute; wird mit `replaceState` kanonisiert |
| ohne kontrollierte Routenparameter | injizierter Prompt-Fallback |
| unbekannte, unvollständige oder doppelte kontrollierte Parameter | strukturiert ungültig; injizierter Fallback |

## Prompt 29 — Ergebnis

1. `StudioId`, beide Modulkataloge und die diskriminierte `StudioRoute` sind
   readonly und öffentlich verfügbar; nur der Animation-Workspace darf eine
   validierte `StableId` als Projekt führen.
2. Der pure Parser unterscheidet kanonische, fehlende, gültige Legacy- und
   strukturiert ungültige Routen. Der Serializer ist roundtrip-stabil, erhält
   fremde Parameter und akzeptiert kontrollierte Dopplungen nicht still.
3. Browseradapter und Navigation-Provider führen vollständige Studio-Routen.
   Legacy-URLs und Fallbacks werden mit `replaceState` kanonisiert; explizite
   Navigation verwendet `pushState`, und `popstate` hält URL und Context synchron.
4. Die bestehende Prompt-Shell kompiliert über klar markierte Übergangsaliase
   weiter. Ihre sechs Views, Settings-V2-Verträge, Storage-Keys, Promptdaten und
   sichtbare Struktur wurden nicht verändert.
5. Gezielte Prüfung: 6 Testdateien und 76 Tests bestanden. Vollständige Prüfung:
   110 Testdateien und 658 Tests, Typecheck und Build bestanden;
   `git diff --check` ist sauber.
6. PyGitIndex ist aktuell und alle 43 Paketchecksummen sind gültig. Prompt 30
   wurde nicht begonnen.

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

- Prompt 30 oder spätere Phasen erst nach einem neuen konkreten Auftrag
  beginnen; Prompt 30 ist noch nicht begonnen.
- Abgeschlossene Phasenkataloge und Nachweise bleiben unverändert als Historie
  unter `docs/erledigt/` erhalten.
- Neue öffentliche Modulgrenzen werden weiterhin in `src/ARCHITECTURE.md`
  dokumentiert.
