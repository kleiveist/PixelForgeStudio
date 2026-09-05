<!-- PYGINDEX:NAVIGATION START -->
[Übergeordnete Übersicht](../index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Offene Aufgaben — PixelForge Studio V3

<!-- PYGINDEX:INDEX START -->
## Inhalt

### Seiten
- [START HERE](START_HERE.md)

### Bereiche
- [Grundlagen](grundlagen/index.md)
- [Prompts](prompts/index.md)
- [Templates](templates/index.md)
<!-- PYGINDEX:INDEX END -->

Dieses Paket entwickelt das nun als `kleiveist/PixelForgeStudio` geführte
Repository zu **PixelForge Studio** weiter. Die Dachanwendung besitzt zwei
klar getrennte Module:

- **PixelForge Prompt Studio** — die bestehende, release-abgenommene
  Prompt-Produktion.
- **PixelForge Animation Studio** — ein neues lokales Werkzeug zum
  Zusammensetzen modularer Pixelart-Figuren, Riggen und Erzeugen von
  Laufanimationen für acht Richtungen.

Die ausführbaren Codex-Aufträge setzen die vorhandene Reihe nach Prompt 27 fort.
Sie sind deshalb als **Prompt 28 bis Prompt 51** nummeriert.

## Umsetzungsstand

- Prompts 28–50: abgeschlossen
- Phasen A–E: abgeschlossen
- Phase E: mit Prompt 47 abgeschlossen
- Phase F: mit Prompt 48 begonnen
- Prompts 49–50: abgeschlossen
- Prompt 51: noch offen

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

## Ausführung

1. Mit `START_HERE.md` beginnen und die dortige Lesereihenfolge einhalten.
2. Vom Repository-Root aus mit
   `(cd docs/aufgaben/pixelforge-studio-v3 && sha256sum -c CHECKSUMS.sha256)`
   die Integrität prüfen.
3. Den in `PLANS.md` benannten Auftrag unter
   `docs/aufgaben/pixelforge-studio-v3/prompts/`
   **einzeln und in numerischer Reihenfolge** ausführen.
4. Nach jedem Auftrag `npm run verify` und `git diff --check` ausführen.
5. Nach jedem abgeschlossenen Auftrag separat committen.
6. Nicht mit dem nächsten Prompt beginnen, bevor der aktuelle Prompt
   vollständig abgeschlossen und dokumentiert ist.

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

## Wichtiger administrativer Punkt

Das Umbenennen des GitHub-Repositories ist keine normale Dateiveränderung.
Prompt 28 enthält deshalb einen ausdrücklich abgegrenzten administrativen
Schritt. Wenn die ausführende Umgebung keine Repository-Adminrechte besitzt,
werden alle Code- und Dokumentationsänderungen trotzdem abgeschlossen und
**nur diese eine ausstehende Adminaktion** exakt dokumentiert.
