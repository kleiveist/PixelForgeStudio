<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# PixelForge Studio 3.0 — Release-Abnahme

## Freigabestatus

**Automatisierte Release-Abnahme bestanden.** PixelForge Studio 3.0.0 führt
das kompatible Prompt Studio V2 und das Animation Studio mit Datenformat V1
unter einer gemeinsamen Oberfläche zusammen. Die einzige nicht ausgeführte
Engineprüfung ist der reale Import in Godot 4, weil in der Release-Umgebung
keine Godot-Binärdatei vorhanden ist. Sie ist unten exakt als manuelle Prüfung
ausgewiesen und wird nicht als ausgeführt behauptet.

## Release-Metadaten

| Merkmal | Wert |
|---|---|
| Datum | 2026-09-05 (UTC) |
| Produkt | PixelForge Studio 3.0.0 / sichtbares Label V3 |
| Repository | `kleiveist/PixelForgeStudio` |
| geprüfter Ausgangs-HEAD | `a8ec4df` (Prompts 28–50 abgeschlossen) |
| Betriebssystem | Debian 12, Docker-Sitzung |
| Node.js / npm | 22.22.2 / 10.9.7 |
| Testbrowser | Chrome for Testing 153.0.8010.12; Firefox 155.0 |
| Browser Runner | Playwright 1.63.0, headless |
| Godot | nicht installiert (`godot4` und `godot` nicht im `PATH`) |

Paketmetadaten, Git-Remote und die GitHub-Repositoryabfrage zeigen auf
`kleiveist/PixelForgeStudio`; ein administrativer Repository-Rename ist kein
Releaseblocker.

## Funktionsmatrix

| Bereich | Abnahme | Ergebnis |
|---|---|---|
| Studio Home | Einstieg in beide Module, kompakte letzte Aktivitäten, Startziele | bestanden |
| Prompt Studio | Dashboard, Profile, Wizard, Output und Settings; `review` als kompatibler Output-Alias | bestanden |
| Animation-Projekte | CRUD, Suche, Copy-on-write-Duplikation, Autosave, Recovery und stabile Projekt-Route | bestanden |
| Workspace | PNG-Import, Alpha-Trim, Anker, Rig, Layer, Framekorrekturen, History, Timeline und Onion Skin | bestanden |
| Rig-Vorlagen | produktiver Katalog mit `humanoid-80-v1`, Maßen, Topologie, Quellen und Compatibility Key | bestanden |
| Acht Richtungen | fünf eigene Quellen, kontrollierte Spiegelableitung und asymmetrische Reviewentscheidung | bestanden |
| Walk | acht Phasen × acht Richtungen = 64 revisionsgebundene Frames | bestanden |
| Character Kits | referenzbasierte Wiederverwendung, Kompatibilitätsprüfung und Slotausrüstung | bestanden |
| Neutraler Export | 1024×1024-Sheet, 64 Einzelbilder, JSON und `.pfanim`-Roundtrip | bestanden |
| Godot-Paket | PNG, neutrales JSON, SpriteFrames-`.tres` und Importanleitung | Fixture/Paket bestanden; echter Engineimport offen |
| Studio-Übergabe | validierter schmaler Promptprofil-Seed, explizite 4→8-/Walkentscheidung | bestanden |

## Accessibility und Responsive

| Prüfung | Nachweis | Ergebnis |
|---|---|---|
| Landmarks/Überschriften | jede Release-Route besitzt genau ein H1 und ein bezeichnetes `main`; Footer vorhanden | bestanden |
| Skip-Link und Navigationsfokus | reine Tastaturbedienung; Fokuswechsel ohne unbeabsichtigten Scrollsprung | bestanden |
| Modulumschalter | semantische Links, kanonische URL und Fokus auf dem Hauptbereich | bestanden |
| Dialogfokus | Projektanlage fokussiert das Namensfeld; Escape schließt und stellt Triggerfokus wieder her | bestanden |
| Fachbedienung | native Buttons/Felder und Tastaturalternativen für Import, Anker, Transform, Timeline und Inventar | bestanden |
| Sichtbarer Fokus/Fehler/Live-Status | globale Focus-visible-Regel sowie getestete Labels, Fehler- und Statusregionen | bestanden |
| Reflow | 1440, 900, 640 und 320 CSS px ohne horizontalen Seitenüberlauf | bestanden |
| Kleine Workspaceansicht | vier erreichbare Roving-Tabs bei 360 px, inklusive Fokusübergabe | bestanden |
| 200-%-Zoom | 640 CSS px als reproduzierbarer Reflow-Proxy für 1280 px bei 200 %; zusätzlich 320 px geprüft | bestanden als Reflow-Proxy |
| Reduced motion | Browser-Medienemulation ergibt `scroll-behavior: auto` und `transition-duration: 0s` | bestanden |

Die Browserläufe sind native, headless Chromium-/Firefox-Läufe. Eine
interaktive visuelle GUI-Abnahme oder ein Browserlauf mit tatsächlich
betätigter Zoomsteuerung wird nicht behauptet; der engere 320-px-Test und die
640-px-Reflowprüfung decken die strukturelle Erreichbarkeit automatisiert ab.

## Browsermatrix

Ausgeführt am 2026-09-05 in derselben flüchtigen Docker-Sitzung:

| Browser | Version | Szenarien | Ergebnis |
|---|---:|---:|---|
| Chromium | Chrome for Testing 153.0.8010.12 | 6 | bestanden |
| Firefox | 155.0 | 6 | bestanden |

Alle **12 Playwright-Szenarien** bestanden im finalen Lauf in 26,1 Sekunden.
Sie prüfen alle produktiven Views, alte Promptlinks einschließlich `review`,
Tastatur- und Dialogfokus, vier Reflowbreiten, den kleinen Workspace und
Reduced Motion.
Die Browser und ihre zusätzlich benötigten Debian-Laufzeitbibliotheken wurden
nur in flüchtige Sitzungsverzeichnisse installiert; sie sind kein
Repositoryinhalt.

## Kompatibilitätsnachweis

- Alle historischen `?view=`-Links werden per `replaceState` in kanonische
  Prompt-Routen überführt; `review` landet auf `output`.
- Prompt-Schema, ExportBundle, persistierter Applikations-Identifier und alle
  sechs `pixelforge:v2:*`-Keys bleiben V2.
- V1→V2-Promptmigration, alte Settings-/Bundleformen und synthetische
  Legacy-Fixtures bleiben in den Regressionstests grün.
- Profile, Wizard, Konfliktkonvertierung und die vier Promptausgaben behalten
  ihre bestehenden Verträge.
- Animation Schema/Manifest/Bundle bleiben unabhängig auf Version 1.
- `.pfanim` validiert Pfade, Größen, PNG-Signaturen und den vollständigen
  Referenzgraphen vor einer atomaren Repositorymutation.

## Laufzeit, Ressourcen und Build

- Das versionierte Workerprotokoll führt Rendern, Sheetkomposition,
  PNG-Vorbereitung und ZIP-Packaging schrittweise aus; Fortschritt, Cancel,
  Fehler und veraltete Revisionen sind getestet.
- Der kontrollierte Fallback gibt zwischen Arbeitsschritten an den Eventloop
  zurück und erzeugt bei Abbruch keinen Teildownload.
- Revisionsgebundene LRU-Caches werden bei Projektwechsel freigegeben.
- Preview- und Download-Object-URLs werden in Erfolgs- und Fehlerpfaden
  widerrufen.
- IndexedDB-Fehler und Autosave-Konflikte bleiben sichtbar; Tests sichern
  gegen Schreib- und Autosave-Schleifen.
- Der Produktionsbuild umfasst 405 Module. Fachliche Chunks senkten den
  größten JavaScript-Chunk von 1.246,01 kB auf 194,06 kB; die vorherige
  Größenwarnung tritt nicht mehr auf.

## Testmatrix

| Lauf | Ergebnis |
|---|---|
| gezielter Release-Audit | 81 Testdateien, 566 Tests bestanden |
| vollständiges `npm run verify` vor Versionsfreigabe | 179 Testdateien, 1087 Tests; Typecheck und Build bestanden |
| Playwright Chromium + Firefox | 12/12 Szenarien bestanden |
| finaler `npm run verify` nach Version und Dokumentation | 179 Testdateien, 1087 Tests; Typecheck und Build bestanden |
| zweiter finaler `npm run verify` | 179 Testdateien, 1087 Tests; Typecheck und Build bestanden |
| `git diff --check` | bestanden |
| PyGitIndex-Prüfmodus | bestanden |
| archivierte Paketchecksummen | bestanden |

## Offene manuelle Godot-Prüfung

Godot war nicht verfügbar. Ein echter Engineimport bleibt daher bewusst offen:

1. In PixelForge Studio ein vollständiges Projekt öffnen.
2. Im Exportpanel **Godot 4 Paket** wählen und das ZIP erzeugen.
3. ZIP in einen Ordner innerhalb eines Godot-4-Projekts entpacken.
4. Das Projekt in Godot 4 öffnen und den Import des PNGs abwarten.
5. Die erzeugte `.tres` als `SpriteFrames` eines `AnimatedSprite2D` zuweisen.
6. Alle acht benannten Richtungsanimationen prüfen: jeweils acht Frames,
   Projekt-FPS, Loop, Atlasregionen und unveränderte Pixelkanten.
7. Die FootAnchor-Ausrichtung im Spielkoordinatensystem prüfen.

Automatisiert grün sind die exakte `.tres`-Fixture, alle 64 Atlasregionen,
Animationsnamen, FPS/Loop, relative `res://`-Referenz, ZIP-Struktur und
Importanleitung. Das ersetzt nicht die obige Engineprüfung.

## Restrisiken und Roadmap

- Restrisiko: Der reale Godot-4-Import und eine interaktive visuelle
  Browserabnahme müssen in einer entsprechend ausgestatteten Umgebung noch
  manuell erfolgen.
- Nicht Teil von 3.0: weitere Clips, weitere Rigfamilien, Tauri, Cloud-
  Synchronisierung und KI-Bildanalyse.
- Es wurde kein Push, Release-Tag oder GitHub-Release erzeugt.
