# PixelForge Studio — Arbeitsplan

## Status

- **Aktuelle Aufgabe:** Prompt 31 — Studio-Startseite und Startziele (abgeschlossen)
- **Nächste Aufgabe:** Prompt 32 — Animationsdomain-Grundlage (nicht begonnen)
- **Abgeschlossene V2-Serie:** Prompts 00–27; archiviert unter `docs/erledigt/`
- **Aktive Serie:** Phase A mit Prompts 28–31 abgeschlossen; Prompts 32–51
  offen unter
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

## Prompt 30 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `11d44a7`
- Baseline: `npm run verify` erfolgreich mit 110 Testdateien und 658 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: globale Dach-Shell mit Home-Brandlink, semantischem Modulumschalter,
  globalem Theme/Skip-Link und sichtbarem Modulkontext; unveränderte sechs
  Prompt-Views; vier zugängliche Animation-Placeholder-Views
- Grenze: keine Animationsdomain, kein IndexedDB/Canvas, keine produktive
  Home-Datenfläche und kein Prompt 31

## Prompt 30 — Ergebnis

1. `StudioShell` besitzt den einzigen globalen Header, Brandlink, Skip-Link,
   Theme-Umschalter, sichtbaren Modulkontext, Hauptbereich und Footer. Titel und
   Fokus folgen vollständigen Studio-Routen sowie neuen Wizard-Sessions.
2. `StudioSwitcher` ist eine echte Navigation aus zentralen Moduldefinitionen.
   Beide Ziele haben kanonische URLs; nur das aktive Modul trägt
   `aria-current="page"`.
3. Die bestehende Prompt-Oberfläche bleibt mit allen sechs Views und ihren
   Providern erhalten. Ein Modulwechsel verwirft weder Theme noch transienten
   Wizard-Zustand.
4. Animation Studio stellt Projekte, Workspace, Character Kits und
   Rig-Vorlagen als vier eindeutige, zugängliche Platzhalter bereit. Der
   Workspace ohne Projekt zeigt einen kontrollierten Empty State; Fachdomain,
   IndexedDB und Canvas bleiben bewusst ausstehend.
5. Alte `?view=`-URLs werden weiter ins Prompt Studio kanonisiert. Home,
   Prompt- und Animationsansichten erhalten routeabhängige Titel, genau eine H1
   und denselben fokussierbaren Hauptbereich.
6. Gezielte Prüfung: 7 Testdateien und 58 Tests bestanden. Vollständige
   Prüfung: 112 Testdateien und 669 Tests, Typecheck und Build bestanden;
   `git diff --check` ist sauber. PyGitIndex meldet 63 unveränderte
   Markdown-Dateien, und alle 43 Paketchecksummen sind gültig.

## Prompt 31 — Ausgangsstand und Abnahme

- Ausgangs-HEAD: `f5510ce`
- Baseline: `npm run verify` erfolgreich mit 112 Testdateien und 669 Tests;
  Typecheck und Build erfolgreich; `git diff --check` sauber
- Abnahme: additive AppSettings-V2-Defaults und pure Startziel-Helfer; drei
  getrennt persistierbare Startentscheidungen; produktive Studio-Home mit zwei
  gleichwertigen Modulkarten, vorhandenen Prompt-Zusammenfassungen und echtem
  Animation-Empty-State; Dashboard-Schnellaktionen und alte/neue Bundle-
  Kompatibilität
- Grenze: keine Schemaversion 3, keine Animationsdomain oder IndexedDB, keine
  automatische Projektöffnung und kein Prompt 32

## Prompt 31 — Ergebnis

1. `AppSettings` V2 besitzt additive Zod-Defaults für `startStudio: home` und
   `animationStartView: projects`; `startView` bleibt unverändert die Prompt-
   Startansicht. Alte strikte Settings und Export-Bundles werden ohne Write und
   ohne Schemaversionserhöhung normalisiert.
2. Pure Helfer lösen die Startdestination auf und ändern Dach-, Prompt- oder
   Animationsstart unabhängig. Der SettingsProvider bleibt die einzige
   UI-Mutationsgrenze; die drei Entscheidungen sind sichtbar persistierbar und
   melden nicht verfügbare beziehungsweise ungültige Writes explizit.
3. Die produktive Studio-Startseite bietet zwei gleichwertige Modulkarten,
   einen optional fortsetzbaren Prompt-Entwurf und letzte Prompt-Profile über
   bestehende Provider/Ports. Animation-Projekte bleiben bis Prompt 35 ein
   ehrlicher Empty State; Home schreibt keine Domainwerte.
4. Das Prompt-Dashboard behält den vollständigen Neun-Kategorien-Einstieg im
   Vordergrund und ergänzt darunter tastaturbedienbare Schnellaktionen zu Home
   und Animation.
5. Alte und neue Settings-/ExportBundle-Formen, jede Startdestination,
   Persistenzfehler, Home-Zusammenfassungen, Empty States, Tastatur und Fokus
   sind durch Domain-, Schema-, Transfer- und React-Tests abgedeckt.
6. Gezielte Prüfung: 8 Testdateien und 98 Tests bestanden. Vollständige
   Prüfung: 113 Testdateien und 684 Tests, Typecheck und Produktionsbuild
   bestanden; einzige Ausgabe ist die bekannte Vite-Warnung zum über 500 kB
   großen Hauptchunk. `git diff --check` ist sauber. PyGitIndex meldet 63
   unveränderte Markdown-Dateien, alle 43 Paketchecksummen sind gültig.
7. Phase A ist abgeschlossen. Prompt 32 ist als nächste Aufgabe dokumentiert,
   aber nicht begonnen; Animationsdomain, -schemas und IndexedDB bleiben offen.

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

- Prompt 32 ist der nächste Einzelauftrag und beginnt erst nach einem neuen
  konkreten Auftrag.
- Abgeschlossene Phasenkataloge und Nachweise bleiben unverändert als Historie
  unter `docs/erledigt/` erhalten.
- Neue öffentliche Modulgrenzen werden weiterhin in `src/ARCHITECTURE.md`
  dokumentiert.
