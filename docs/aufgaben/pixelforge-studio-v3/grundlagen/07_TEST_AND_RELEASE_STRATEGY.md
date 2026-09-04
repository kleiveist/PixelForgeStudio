<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# 07 — Test-, Qualitäts- und Release-Strategie

## 1. Grundsatz

Das Animation Studio verarbeitet visuelle Binärdaten, darf aber nicht nur
durch manuelles Anschauen getestet werden. Die Architektur legt deshalb
Geometrie, Schema, Rasterisierung und Layout in pure TypeScript-Funktionen.

## 2. Testpyramide

### Pure Domain-Tests

Pflichtbereiche:

- Richtungsreihenfolge
- Slotkatalog
- Rig-Validierung
- Vektor-/Matrixoperationen
- inverse affine Transformation
- Anker-Normierung
- Scale-/Rotation-/Translation-Berechnung
- Mirror-Transformation
- Direction-Projection
- Draw Order
- Walk-Clip-Phasen
- Fußkontaktregeln
- SpriteSheet-Metriken
- Compatibility Key
- Exportdateinamen

### Rastertests

Kleine synthetische RGBA-Fixtures verwenden, zum Beispiel:

```text
1 × 1
2 × 2
3 × 3
5 × 4
```

Prüfen:

- reine Translation
- 90°-Rotation
- Spiegelung
- Uniform Scale
- transparente Quellpixel
- Source-over-Komposition
- Layerreihenfolge
- Clipping
- identische Eingabe → identische RGBA-Ausgabe
- keine unerwarteten Zwischenfarben

Erwartete RGBA-Arrays oder kompakte Pixelmatrizen sind belastbarer als große
PNG-Snapshots.

### Schema-Tests

Jedes neue Schema testet:

- vollständigen gültigen Fall
- Minimalfall
- unbekannte Keys
- falsche Version
- leere IDs
- ungültige Richtungen
- doppelte Parts
- fehlende Blob-Referenzen auf Bundle-Ebene
- ungültige Anker
- Grenzwerte
- readonly/frozen Normalform, sofern im Projekt üblich

### Repository-Tests

Mit in-memory Testadapter:

- Projekt CRUD
- Part + Blob transaktional
- Fehler ohne Stateverlust
- Duplikation
- Konflikt-IDs
- Garbage-Collection
- Autosave-Baseline
- Import atomar
- Quota-/Unavailable-Ergebnis

Browser-IndexedDB wird durch schmale Adaptertests ergänzt. UI-Tests verwenden
keine echte globale Datenbank.

### Reducer-/State-Tests

- Projekt geladen
- Dirty
- Save läuft
- Save erfolgreich/fehlgeschlagen
- Undo/Redo
- neue Änderung leert Future
- Hydration schreibt nicht
- ungültige Rohwerte überschreiben kein gültiges Modell
- Bildimport-History ohne Blobkopie

### React Testing Library

Aus Nutzersicht:

- Modulwechsel
- bestehende `?view`-Route öffnet Prompt Studio
- neues Animationsprojekt
- Projekt öffnen/duplizieren/löschen
- PNG über File Input importieren
- Slot auswählen
- Anker über zugängliche Koordinatenfelder ändern
- Richtungswarnung
- Timeline bedienen
- Exportblock bei Fehler
- Exportfortschritt
- Promptprofil als Animationsprojekt starten
- Fokusmanagement
- Tastaturalternative zu Drag-and-drop
- Fehlermeldungen und Statusregionen

Nicht testen:

- interne Hook-Aufrufreihenfolge
- private Komponentenstate-Details
- CSS-Klassennamen als Produktverhalten
- Canvas nur per Screenshot ohne Domainprüfung

## 3. Testfixtures

Empfohlene synthetische Fixtures:

```text
src/test/fixtures/animation/
├── rgba/
│   ├── solid-red-1x1.json
│   ├── cross-3x3.json
│   └── alpha-edge-3x3.json
├── projects/
│   ├── minimal-south-project.json
│   ├── humanoid-five-direction-project.json
│   └── invalid-missing-blob-project.json
├── rigs/
│   └── humanoid-80-v1.json
├── exports/
│   ├── walk-metadata.json
│   └── godot4-spriteframes.tres
└── bundles/
    └── synthetic-pfanim-manifest.json
```

Keine realen privaten Nutzerassets einchecken.

## 4. Visuelle manuelle Abnahme

Pflichtszenarien:

1. Prompt Studio funktioniert nach Umbau unverändert.
2. Alter Link `?view=dashboard` öffnet Prompt Studio.
3. Studio-Startseite wechselt sauber zwischen Modulen.
4. Neues Standardprojekt wird angelegt.
5. South-Partset wird importiert und verankert.
6. Walk-South spielt mit acht Frames.
7. fünf Richtungen werden geladen.
8. drei Spiegelrichtungen werden erzeugt.
9. asymmetrische Waffe blockiert ungültige Spiegelung.
10. eigener West-Override hebt Block auf.
11. 1024×1024-SpriteSheet wird exportiert.
12. Metadaten enthalten 64 korrekte Regionen.
13. `.pfanim` wird in leeren Workspace reimportiert.
14. Godot-Paket wird geprüft.
15. Undo/Redo und Autosave funktionieren.
16. Fehlerhafte Datei zerstört kein Projekt.

## 5. Browsermatrix

Mindestens:

- Chromium-basiert, aktueller unterstützter Stand
- Firefox, aktueller unterstützter Stand

Zusätzlich sinnvoll:

- Linux
- Windows
- Dark/Light/System
- reduzierte Bewegung
- Tastatur-only
- 200 % Browserzoom

Browserunterschiede dürfen die finalen RGBA-Pixel nicht verändern, weil der
Software-Rasterizer die Quelle der Wahrheit ist.

## 6. Accessibility

Prüfen:

- Skip-Link
- Landmark-Struktur
- eindeutige Überschriften
- Modulumschalter semantisch korrekt
- Fokus nach Navigation
- Dialogfokus
- Statusmeldungen mit geeigneten Live-Regionen
- Symbole nicht nur über Farbe
- sichtbarer Fokus
- Form-Labels
- Fehlermeldungsverknüpfung
- Tastaturalternative für Drag-and-drop
- Canvas-Bedienung über DOM-Felder
- Zoom bis 200 %
- `prefers-reduced-motion`

Onion Skin und Playback dürfen bei reduzierter Bewegung nicht automatisch
starten.

## 7. Performance und Stabilität

Messen statt raten:

- Projekthydration
- Dekodierung eines Partsets
- Renderzeit eines Frames
- Renderzeit von 64 Frames
- PNG-Encoding
- Bundle-Erstellung
- IndexedDB-Speicherung
- Speicherfreigabe nach Projektwechsel

Verbindliche qualitative Ziele:

- kein blockierender 64-Frame-Export auf dem React-Hauptthread
- Export abbrechbar
- Decoded-Image-Cache revisionsgebunden
- Object URLs werden freigegeben
- Worker wird bei App-Unmount kontrolliert beendet
- keine unbeschränkte Undo-History
- kein Blob in React-Context serialisiert
- keine automatische Endlosschleife durch Autosave

## 8. Kompatibilitätsmatrix

| Vertrag | muss erhalten bleiben |
|---|---|
| Prompt-Storage V2 | ja |
| Prompt-Export Bundle V2 | ja |
| V1→V2 Prompt-Migration | ja |
| sechs alte Prompt-Views | ja |
| alte `?view=` URLs | ja |
| bestehende Profil-IDs | ja |
| bestehende Tests | ja |
| historische Dokumentation | ja |
| neuer Animation-Store | unabhängig |
| neues `.pfanim` V1 | neu |

## 9. Prüfkommandos je Prompt

```bash
npm run typecheck
npm run test:run
npm run build
npm run verify
git diff --check
git status --short
```

Zusätzlich je nach Prompt:

```text
gezielte Vitest-Datei
Browser-Manuallauf
Godot-Validierung
Bundle-Roundtrip
Pixelvergleich
```

## 10. Commitstrategie

Jeder Prompt 28–51 erhält einen eigenen Commit. Format:

```text
<emoji> <englischer Conventional-Commit-Text>
```

Keine Sammelcommits über mehrere Prompts, sofern die fortlaufende Umsetzung
beauftragt ist.

## 11. Release 3.0

Erst Prompt 51:

- `package.json` auf `3.0.0`
- sichtbares Label auf `V3`
- README und Changelog final
- Architektur vollständig
- Prompt-Studio-Regression grün
- Animation-Studio-MVP grün
- Remote-Name geprüft
- keine unbestätigten Behauptungen über Godot-Test
- bekannte Restrisiken dokumentiert
- finale `npm run verify`
- `git diff --check`
- sauberer Arbeitsbaum nach Commit

## 12. Release-Blocker

- altes Prompt-Bundle wird nicht mehr akzeptiert
- alte `?view`-Links brechen
- PNGs landen als Base64 im Prompt-Storage
- Rendering erzeugt weichgezeichnete Pixel
- 8-Richtungs-Export erfindet Ansichten aus nur einer Quelle
- verbotene Spiegelung wird still ausgeführt
- fehlende Blobs erzeugen unvollständigen Export
- IndexedDB-Fehler zerstört validen In-Memory-State
- Export friert UI unkontrolliert ein
- kritische Bedienung ist nur per Maus möglich
- `npm run verify` ist rot
