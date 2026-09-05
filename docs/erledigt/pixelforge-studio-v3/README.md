<!-- PYGINDEX:NAVIGATION START -->
[Übergeordnete Übersicht](../index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Erledigte Promptserie — PixelForge Studio V3

<!-- PYGINDEX:INDEX START -->
## Inhalt

### Seiten
- [START HERE](START_HERE.md)

### Bereiche
- [Grundlagen](grundlagen/index.md)
- [Prompts](prompts/index.md)
- [Templates](templates/index.md)
<!-- PYGINDEX:INDEX END -->

Dieses Paket dokumentiert die abgeschlossene Weiterentwicklung des als
`kleiveist/PixelForgeStudio` geführten Repositorys zu **PixelForge Studio**.
Die Dachanwendung besitzt zwei klar getrennte Module:

- **PixelForge Prompt Studio** — die bestehende, release-abgenommene
  Prompt-Produktion.
- **PixelForge Animation Studio** — ein neues lokales Werkzeug zum
  Zusammensetzen modularer Pixelart-Figuren, Riggen und Erzeugen von
  Laufanimationen für acht Richtungen.

Die erhaltenen Codex-Aufträge setzen die Reihe nach Prompt 27 fort. Sie sind
als **Prompt 28 bis Prompt 51** nummeriert und wurden für Release 3.0 jeweils
separat umgesetzt, geprüft und committed.

## Umsetzungsstand

- Prompts 28–51: abgeschlossen
- Phasen A–F: abgeschlossen
- Release 3.0: automatisiert abgenommen; reale Godot-Prüfung ausdrücklich
  noch manuell, siehe `../../PIXELFORGE-STUDIO-V3-RELEASE-ACCEPTANCE.md`

## Empfohlener Zielname

| Ebene | Ziel |
|---|---|
| Dachprodukt | `PixelForge Studio` |
| Prompt-Modul | `PixelForge Prompt Studio` |
| Animationsmodul | `PixelForge Animation Studio` |
| GitHub-Repository | `kleiveist/PixelForgeStudio` |
| npm-Paket | `pixelforge-studio` |
| finale Produktversion | `3.0.0` |
| bestehendes Prompt-Datenformat | weiterhin Schema/Format V2 |
| neues Animationsprojektformat | Schema/Format V1 |

Das Rebranding darf keine bestehenden Prompt-Daten ungültig machen. Der bisherige
Prompt-Export-Identifier `"PixelForge Prompt Studio"`, vorhandene
`pixelforge:v2:*`-Storage-Keys und vorhandene `schemaVersion: 2`-Daten bleiben
kompatibel.

## Historische Nachweise

1. `START_HERE.md` hält die ursprüngliche Lesereihenfolge fest.
2. `(cd docs/erledigt/pixelforge-studio-v3 && sha256sum -c CHECKSUMS.sha256)`
   prüft die Integrität des archivierten Pakets.
3. Die Einzelaufträge unter
   `docs/erledigt/pixelforge-studio-v3/prompts/` bleiben inhaltlich als
   Anforderungsnachweise erhalten.
4. Der tatsächliche Abschlussstand steht in `PLANS.md`, `CHANGELOG.md` und der
   V3-Release-Abnahme.

`MANIFEST.json` bleibt als unveränderte Empfangsquittung des ursprünglichen
Planungspakets erhalten. `CHECKSUMS.sha256` ist dagegen die aktuelle
Integritätsliste nach Indexierung und Archivverschiebung.

## Phasen

| Phase | Prompts | Ergebnis |
|---|---:|---|
| A — Rebranding und Studio-Shell | 28–31 | neues Dachprodukt, Repositoryname, Modulumschaltung |
| B — Animationsprojekt-Grundlage | 32–35 | Domain, Schemas, IndexedDB, Projektverwaltung |
| C — Rig-Aufbau und Körperteile | 36–39 | Workspace, Import, Humanoid-Rig, automatische Platzierung |
| D — Rendering und Laufzyklus | 40–43 | pixelgenauer Renderer, Layering, Walk-Clip, Timeline |
| E — acht Richtungen und Wiederverwendung | 44–47 | Spiegelregeln, 8 Richtungen, Korrekturen, Character Kits |
| F — Export, Integration und Release | 48–51 | SpriteSheets, Godot, Studio-Verknüpfung, Release 3.0 |

## Verbindliche technische Richtung

- TypeScript `strict`
- React und Vite
- Zod an allen Import- und Persistenzgrenzen
- React Context + `useReducer`
- CSS Modules und bestehende Design Tokens
- native Canvas-Anzeige, aber deterministische nearest-neighbor
  Rasterkomposition für den finalen Export
- IndexedDB für PNG-Blobs und Animationsprojekte
- kein Backend
- kein Python in der Hauptanwendung
- keine automatische Erfindung unbekannter Seiten- oder Rückenansichten
- keine großen Base64-Bilder in `localStorage`
- keine pointer-only Bedienung

## Historischer administrativer Punkt

Das Umbenennen des GitHub-Repositories ist keine normale Dateiveränderung.
Prompt 28 enthält deshalb einen ausdrücklich abgegrenzten administrativen
Schritt. Wenn die ausführende Umgebung keine Repository-Adminrechte besitzt,
werden alle Code- und Dokumentationsänderungen trotzdem abgeschlossen und
**nur diese eine ausstehende Adminaktion** exakt dokumentiert.

Für Release 3.0 bestätigen Paketmetadaten, Git-Remote und GitHub-Abfrage den
Zielnamen `kleiveist/PixelForgeStudio`; die Aktion ist abgeschlossen.
