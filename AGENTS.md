# AGENTS.md — PixelForge Studio

## Auftrag

Dieses Repository enthält das release-abgenommene Dachprodukt **PixelForge
Studio 3.0**. Das **PixelForge Prompt Studio** bleibt dem V2-Schema-, Storage-
und Exportvertrag verpflichtet. Das produktive **PixelForge Animation Studio**
verwaltet lokale Projekte, PNG-Körperteile, `humanoid-80-v1`, Acht-Richtungs-
Walks, Character Kits sowie neutrale und Godot-4-Exporte im eigenständigen
Animationsformat V1.

Vor funktionalen Änderungen lesen:

1. `docs/TECHNOLOGIE-STACK-V3.md`
2. `docs/TECHNOLOGIE-STACK-V2.md`
3. `docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md`
4. `docs/PROMPT-SPECIFICATION.md`
5. `PLANS.md` und die dort benannte aktive Prompt-Unterlage

Die abgeschlossene V3-Serie 28–51 liegt als historischer Umsetzungsnachweis
unter `docs/erledigt/pixelforge-studio-v3/`. Sie ist keine aktive
Aufgabenliste. Die verbindliche Release-Evidenz steht unter
`docs/PIXELFORGE-STUDIO-V3-RELEASE-ACCEPTANCE.md`.

Der abgeschlossene Katalog der Prompts 00–27 liegt ausschließlich als
historische Referenz unter `docs/erledigt/CODEX-V2-PROMPTS.md` und ist keine
aktive Aufgabenliste. Die frühere V2-Umsetzungsanweisung und die
V1-Migrationsbaseline liegen ebenfalls nur noch unter `docs/erledigt/`.

## Naming- und Kompatibilitätsgrenze

- Dachprodukt: `PixelForge Studio`
- Prompt-Modul: `PixelForge Prompt Studio` / `Prompt Studio`
- Animationsmodul: `PixelForge Animation Studio` / `Animation Studio`
- npm-Paket: `pixelforge-studio`
- Repository: `kleiveist/PixelForgeStudio`
- Der persistierte Prompt-Identifier bleibt exakt `PixelForge Prompt Studio`.
- Alle `pixelforge:v2:*`-Keys sowie Schema- und Formatversion 2 bleiben stabil.
- `AppSettings.startView` bleibt die Prompt-Startansicht; die additiven Felder
  `startStudio` und `animationStartView` besitzen Zod-Defaults, damit alte
  Settings und Export-Bundles ohne Schemaerhöhung lesbar bleiben.

## Verbindlicher Ziel-Stack

- TypeScript (`strict: true`)
- React
- Vite
- npm
- React Hook Form
- Zod
- React Context + `useReducer`
- localStorage + JSON-Import/-Export
- native IndexedDB für Animationsmetadaten und Bildblobs
- `fflate` für lokale ZIP-Bundles
- CSS Modules + CSS Custom Properties
- eigene lokale SVG-React-Komponenten
- Vitest + React Testing Library + jsdom
- Playwright-Smokes in Chromium und Firefox
- kein Backend
- kein Python in der Haupt-App

Die ausführbare HTML/CSS/JavaScript-**Legacy V1** wurde in Prompt 27 nach
belegter Parität entfernt. Ihre pure TypeScript-Kompatibilitätsdomain und
synthetischen Fixtures bleiben ausschließlich für Migration und Regression
erhalten. Neue Features dürfen nicht als Vanilla-DOM-Architektur entstehen.

## Arbeitsweise

1. Genau eine konkret beauftragte Aufgabe beziehungsweise neue Prompt-Phase
   bearbeiten und ihren Status in `PLANS.md` führen.
2. Vor Änderungen betroffene V2- und gegebenenfalls
   Legacy-Kompatibilitätsdateien untersuchen.
3. Bei komplexen Schritten den Status in `PLANS.md` aktualisieren.
4. Kleinste vollständige Lösung implementieren.
5. Domain-Logik als pure TypeScript-Funktionen halten.
6. UI-Verhalten mit React Testing Library, Domain-Logik mit Vitest testen.
7. `npm run verify` ausführen.
8. `git diff --check` ausführen.
9. Diff auf Regressionen, tote Legacy-Pfade und versehentliche Default-Änderungen prüfen.
10. Aufgabe mit geänderten Dateien, Tests, Risiken und einem englischen Emoji-Commitvorschlag abschließen.
11. Nicht selbstständig mit der nächsten Aufgabe fortfahren.
12. Wenn eine fortlaufende Umsetzung ausdrücklich beauftragt ist, jeden
    abgeschlossenen Prompt separat committen, bevor der nächste beginnt. Das
    Commitformat lautet `<emoji> <englischer Conventional-Commit-Text>`.
13. Für die Übergabe an weitere Agenten den aktuellen und nächsten Prompt in
    `PLANS.md` sowie neue öffentliche Modulgrenzen in `src/ARCHITECTURE.md`
    dokumentieren.

Keine Commits oder Pushes ausführen, außer der konkrete Auftrag verlangt dies.
Ein Auftrag zur fortlaufenden Abarbeitung der nummerierten Promptserie gilt als
Commitfreigabe für diese getrennten Phasen, nicht als Pushfreigabe.

## Zielbefehle nach der React-Migration

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run test:run
npm run test:browser:install
npm run test:browser
npm run build
npm run verify
```

`npm run verify` soll mindestens `typecheck`, Tests und Build zusammenfassen.

## Architekturregeln

- React ist UI-Schicht, nicht Domänenmodell.
- Prompt-Engine, Profilauflösung, Capabilities, Compatibility Key und Migration dürfen React nicht importieren.
- Formulare mit React Hook Form; Datenvalidierung mit Zod.
- Persistenz nur über Storage-Adapter; Komponenten greifen nicht direkt beliebig auf `localStorage` zu.
- V2-Daten haben `schemaVersion: 2`.
- Importdaten beginnen als `unknown` und werden validiert.
- State zu Profilen und App-Einstellungen über Context + Reducer; lokaler UI-State bleibt lokal.
- Styling über CSS Modules; globale Farben/Abstände über semantische CSS-Variablen.
- keine unsichere HTML-Injektion.
- keine manuellen Änderungen in `dist/`.
- `package-lock.json` committen.

## Produktdefaults

- Perspektive: frontale schräge 3/4-RPG-Draufsicht
- Projektion: orthografisch
- Kamera: südlich, Blick nach Norden, etwa 60° abwärts von der Horizontalen
- Pixelstil: Modern-HD Pixelart
- Tile-Raster: 32 × 32 px
- Standard-Figurenhöhe: ca. 80 px
- Outline: weich und selektiv
- Hintergrund: transparent
- Stilprofil A: klassische geerdete Fantasy
- Stilprofil B: düstere geerdete Fantasy
- Licht: kontextabhängig
- Ausgabe: Hauptprompt, Negativprompt, technische Spezifikation, kombiniert

Defaults sind in V2 über Basisprofile änderbar und sperrbar.

## Capability-Regel

**8 Richtungen gelten nur für richtungsabhängig bewegliche Assets.**

- Charaktere, Tiere, laufende/fahrende Objekte können Richtungssets besitzen.
- Statische Objekte, normale Gebäude, Texturen und gewöhnliche Bäume erhalten keine Richtungsfrage.
- Animation und Richtung sind getrennte Capabilities: eine Tür oder ein Baum kann animiert sein, ohne ein Richtungsset zu besitzen.
- Kamera und Weltlicht bleiben im Richtungsset konstant; das Motiv ändert seine Orientierung.

## Profilmodell

Drei Ebenen:

1. `BaseProfile` — globale technische Produktionsparameter + Locks
2. `CategoryProfile` — wiederverwendbare Kategorieparameter
3. `AssetProfile` — konkrete gespeicherte Asset-Konfiguration

Kinder referenzieren `baseProfileId`. Ein deterministischer `compatibilityKey` gruppiert technisch kompatible Profile. Gesperrte Basiswerte dürfen nicht still überschrieben werden.

Mindestens sperrbar/vererbbar:

- Pixelstil
- Tilegröße
- Figurenhöhe, falls relevant
- Perspektive
- Kamerawinkel
- Projektion
- Outline
- Farbprofil
- Transparenzstandard
- Lichtgrundregeln

## Pflichtkategorien

- Charakter / Figur
- bewegliches Objekt
- statisches Objekt
- Textur / Material
- Natur / Pflanze / Baum
- Gebäude / Architektur
- Tileset / Kartenelement
- Item / Ausrüstung
- Artwork / Konzeptbild

Der Wizard fragt zuerst die Hauptkategorie und zeigt danach nur relevante Fragen.

## Urheberrechtliche Abgrenzung

Generierte Prompts enthalten keine direkten Namen bestehender Spiele, Marken, Figuren oder Künstler und fordern keine Imitation eines unverwechselbaren Werk- oder Künstlerstils. Stil wird über allgemeine Kamera-, Material-, Pixel-, Farb-, Licht- und Kompositionsmerkmale beschrieben.

## Definition of Done

Eine Aufgabe ist abgeschlossen, wenn:

- Akzeptanzkriterien erfüllt sind,
- neue Domain-Logik typisiert und getestet ist,
- React-Komponenten anhand Nutzerverhalten getestet sind, wo sinnvoll,
- `npm run verify` erfolgreich ist,
- `git diff --check` sauber ist,
- Dokumentation angepasst wurde,
- keine parallele neue Vanilla-V2-Architektur entstanden ist,
- kein irrelevanter Kategorie-State in Prompts einfließt,
- und der Abschlussbericht vollständig ist.
