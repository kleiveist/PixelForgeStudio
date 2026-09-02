# Changelog

## Unreleased — V2-Planung

- aktives Root-Projekt auf React 19, TypeScript strict, Vite 8 und npm migriert
- Vitest-, React-Testing-Library- und jsdom-Testfundament eingerichtet
- Legacy-V1 vollständig nach `legacy/v1/` verschoben und über eigene Scripts weiter prüfbar gehalten
- minimale responsive V2-App-Shell mit CSS Modules, semantischen Tokens und lokalem SVG-Signet ergänzt
- V1-Defaults, State-Whitelist, Promptaufbau, Validierung und technische Metriken als frameworkfreie Strict-TypeScript-Domain portiert
- bytegenaue Vitest-Parität über Legacy-Referenz, synthetische Storage-Fixtures und SHA-256-Promptsignaturen abgesichert
- reproduzierbare Legacy-V1-Migrationsbaseline mit synthetischen Storage-Fixtures und Promptsignaturen ergänzt
- verbindliche `AGENTS.md`-Projektanweisung für Codex ergänzt
- schrittweisen Ausführungsplan in `PLANS.md` angelegt
- vollständige V2-Zielarchitektur und Umsetzungsphasen dokumentiert
- Abfragekatalog für Charaktere, bewegliche und statische Objekte, Texturen, Natur, Gebäude, Tilesets, Items und Artwork definiert
- hierarchisches Profilmodell mit Basisprofilen, Sperren und Kompatibilitätsschlüsseln spezifiziert
- Capability-System zur Trennung von Bewegung, Richtungen und Animation dokumentiert
- 25 einzeln ausführbare Codex-Arbeitsprompts plus Review- und Universalprompt ergänzt

## 1.0.0 – 2026-09-02

- vollständige modulare Webanwendung angelegt
- zwei getrennte Fantasy-Stilprofile eingebaut
- feste frontale 3/4-RPG-Kamera und orthografische Projektion definiert
- 32 × 32 px Tile-Raster und 80 px Figurenstandard festgelegt
- 4- und 8-Richtungssets mit berechnetem Sheet-Layout ergänzt
- adaptive Lichtmatrix für Tag, Nacht, Innenräume und düstere Stimmungen umgesetzt
- transparenter Alpha-Hintergrund und wählbare Schattenlogik ergänzt
- dynamische Haupt-, Negativ- und Technikprompts umgesetzt
- lokale Presets, Autospeicherung, JSON-Import und Exporte ergänzt
- automatische Syntax-, Struktur- und Prompt-Tests eingerichtet
- Startskripte für Windows, Linux und macOS ergänzt
