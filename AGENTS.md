# AGENTS.md — PixelForge Prompt Studio

## Auftrag

Dieses Repository enthält ausschließlich das **PixelForge Prompt Studio**.
Es bleibt dem V2-Schema-, Storage- und Exportvertrag verpflichtet. Eine
separate Animationsanwendung, Animationsprojekte, Rig-/Renderfunktionen,
IndexedDB-Persistenz und Engineexporte sind nicht Bestandteil des Produkts.

Vor funktionalen Änderungen lesen:

1. `docs/TECHNOLOGIE-STACK-V2.md`
2. `docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md`
3. `docs/PROMPT-SPECIFICATION.md`
4. `PLANS.md` und eine dort gegebenenfalls benannte aktive Unterlage

Die abgeschlossenen Promptserien 00–27 sowie 28–51 liegen ausschließlich als
historische Referenz unter `docs/erledigt/`. Die ehemalige V3-Serie
dokumentiert ein später wieder entferntes Dach-/Animationsprodukt und ist
keine aktive Produkt- oder Aufgabenbeschreibung.

## Naming- und Kompatibilitätsgrenze

- Produkt: `PixelForge Prompt Studio`
- Kurzname: `Prompt Studio`
- npm-Paket: `pixelforge-studio`
- Repository: `kleiveist/PixelForgeStudio`
- Der persistierte Application-Identifier bleibt exakt
  `PixelForge Prompt Studio`.
- Alle `pixelforge:v2:*`-Keys sowie Schema- und Formatversion 2 bleiben
  stabil.
- `AppSettings.startView` ist die einzige wirksame Startansicht.
- Die früher additiven Felder `startStudio` und `animationStartView`
  bleiben ausschließlich lesbare Kompatibilitätsdaten, damit alte Settings
  und Export-Bundles ohne Schemaerhöhung importierbar sind.

## Verbindlicher Ziel-Stack

- TypeScript (`strict: true`)
- React
- Vite
- npm
- React Hook Form
- Zod
- React Context + `useReducer`
- localStorage + JSON-Import/-Export
- CSS Modules + CSS Custom Properties
- eigene lokale SVG-React-Komponenten
- Vitest + React Testing Library + jsdom
- Playwright-Smokes in Chromium und Firefox
- kein Backend
- kein Python in der Haupt-App

Die ausführbare HTML/CSS/JavaScript-Legacy-V1 wurde nach belegter Parität
entfernt. Ihre pure TypeScript-Kompatibilitätsdomain und synthetischen
Fixtures bleiben ausschließlich für Promptmigration und Regression erhalten.
Neue Features dürfen nicht als Vanilla-DOM-Architektur entstehen.

## Arbeitsweise

1. Genau eine konkret beauftragte Aufgabe bearbeiten und ihren Status in
   `PLANS.md` führen.
2. Vor Änderungen betroffene V2- und gegebenenfalls
   Legacy-Kompatibilitätsdateien untersuchen.
3. Bei komplexen Schritten den Status in `PLANS.md` aktualisieren.
4. Kleinste vollständige Lösung implementieren.
5. Domain-Logik als pure TypeScript-Funktionen halten.
6. UI-Verhalten mit React Testing Library, Domain-Logik mit Vitest testen.
7. `npm run verify` ausführen.
8. `git diff --check` ausführen.
9. Diff auf Regressionen, tote Pfade und versehentliche Default-Änderungen
   prüfen.
10. Mit geänderten Dateien, Tests, Risiken und einem englischen
    Emoji-Commitvorschlag abschließen.
11. Nicht selbstständig mit der nächsten Aufgabe fortfahren.

Keine Commits oder Pushes ausführen, außer der konkrete Auftrag verlangt dies.

## Zielbefehle

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

`npm run verify` fasst mindestens Typecheck, Tests und Build zusammen.

## Architekturregeln

- React ist UI-Schicht, nicht Domänenmodell.
- Prompt-Engine, Profilauflösung, Capabilities, Compatibility Key und
  Migration dürfen React nicht importieren.
- Formulare mit React Hook Form; Datenvalidierung mit Zod.
- Persistenz nur über Storage-Adapter; Komponenten greifen nicht direkt
  beliebig auf `localStorage` zu.
- V2-Daten haben `schemaVersion: 2`.
- Importdaten beginnen als `unknown` und werden validiert.
- State zu Profilen und App-Einstellungen über Context + Reducer; lokaler
  UI-State bleibt lokal.
- Styling über CSS Modules; globale Farben/Abstände über semantische
  CSS-Variablen.
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

Defaults sind über Basisprofile änderbar und sperrbar.

## Capability-Regel

**8 Richtungen gelten nur für richtungsabhängig bewegliche Assets.**

- Charaktere, Tiere, laufende/fahrende Objekte können Richtungssets besitzen.
- Statische Objekte, normale Gebäude, Texturen und gewöhnliche Bäume erhalten
  keine Richtungsfrage.
- Animation und Richtung sind Prompt-Capabilities: Eine Tür oder ein Baum kann
  animiert beschrieben sein, ohne ein Richtungsset zu besitzen.
- Kamera und Weltlicht bleiben im Richtungsset konstant; das Motiv ändert
  seine Orientierung.

## Profilmodell

1. `BaseProfile` — globale technische Produktionsparameter + Locks
2. `CategoryProfile` — wiederverwendbare Kategorieparameter
3. `AssetProfile` — konkrete gespeicherte Asset-Konfiguration

Kinder referenzieren `baseProfileId`. Ein deterministischer
`compatibilityKey` gruppiert technisch kompatible Profile. Gesperrte
Basiswerte dürfen nicht still überschrieben werden.

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

Der Wizard fragt zuerst die Hauptkategorie und zeigt danach nur relevante
Fragen.

## Urheberrechtliche Abgrenzung

Generierte Prompts enthalten keine direkten Namen bestehender Spiele, Marken,
Figuren oder Künstler und fordern keine Imitation eines unverwechselbaren
Werk- oder Künstlerstils.

## Definition of Done

Eine Aufgabe ist abgeschlossen, wenn:

- Akzeptanzkriterien erfüllt sind,
- neue Domain-Logik typisiert und getestet ist,
- React-Komponenten anhand Nutzerverhalten getestet sind, wo sinnvoll,
- `npm run verify` erfolgreich ist,
- `git diff --check` sauber ist,
- Dokumentation angepasst wurde,
- keine neue Vanilla-Architektur entstanden ist,
- kein irrelevanter Kategorie-State in Prompts einfließt,
- und der Abschlussbericht vollständig ist.
