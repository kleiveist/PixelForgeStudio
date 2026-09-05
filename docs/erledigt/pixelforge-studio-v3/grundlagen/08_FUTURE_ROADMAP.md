<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# 08 — Spätere Erweiterungen außerhalb des MVP

Diese Punkte gehören bewusst **nicht** in die Prompts 28–51. Sie dürfen erst
nach dem stabilen Humanoid-Walk-MVP geplant werden.

## Weitere Clips

- Idle
- Run
- Attack
- Use
- Talk
- Hurt
- Death ohne grafische Detaildarstellung
- individuelle Spezialaktionen
- Blend-/Übergangsregeln zwischen Clips

Jeder Clip erhält eine eigene versionierte Vorlage. Framezahlen aus dem Prompt
Studio können als Seed dienen, ersetzen aber keine Clipdefinition.

## Weitere Rigs

- Quick Humanoid Rig
- kleine/gedrungene Humanoide
- große Humanoide
- vierbeinige Tiere
- fliegende Kreaturen
- Fahrzeuge
- modulare Maschinen

Rigfamilien benötigen eigene Slot-, Joint-, Direction- und Motion-Verträge.

## Pixelkorrekturebene

- pro Frame kleine Rasterkorrekturen
- transparentes Overlay
- Palette aus Projekt
- Stift/Radierer
- Korrekturen getrennt vom Originalpart speichern
- Exportkomposition nach Rig-Rendering

Das ist ein Pixel-Editor-Teilprojekt und wird nicht heimlich in den ersten
Anchor-Editor eingebaut.

## Tauri-Desktoppaket

Mögliche spätere Vorteile:

- direkter Projektordner
- Datei-Watcher
- native Save/Open-Dialoge
- großer Batch-Export
- besserer Austausch mit Godot-Projekten

Die TypeScript-Domain bleibt unverändert. Tauri ersetzt Adapter, nicht das
Animationsmodell.

## Optionale externe Python-Werkzeuge

Python darf später als **separates, optionales Produktionswerkzeug** dienen:

- Batch-Trim
- Alpha-/Dateiprüfung
- automatische Segmentierungsexperimente
- Computer Vision
- Pose-Erkennung
- Massentransformation vorhandener Assets

Die Haupt-App bleibt ohne Python lauffähig. Python-Ausfall darf Kernfunktionen
nicht blockieren.

## Assistierte Bildanalyse

Erst nach sauberer manueller Ankerpipeline:

- Vorschlag für transparente Bounding Box
- Vorschlag für Gelenkpunkte
- Slotklassifikation
- Qualitätswarnungen
- keine automatische stille Übernahme
- immer sichtbare Bestätigung

## Weitere Exportziele

- Aseprite
- Unity
- RPG Maker
- APNG
- GIF
- WebM
- Engine-Plugin
- CLI-Batch-Export

Alle Adapter projizieren aus dem neutralen V1-Metadatenmodell.

## Cloud und Zusammenarbeit

Nicht geplant, solange Local-first genügt:

- Accounts
- Cloudsync
- gemeinsames Echtzeit-Editing
- Asset-Marktplatz
- Telemetrie

Eine spätere Cloudfunktion braucht eine eigene Datenschutz- und
Sicherheitsentscheidung.
