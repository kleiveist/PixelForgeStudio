# AGENTS.md — PixelForge Prompt Studio V2

## Auftrag

Dieses Repository enthält die Legacy-V1 sowie den verbindlichen Bauplan für **PixelForge Prompt Studio V2**. V2 ist ein lokales Prompt-Produktionsstudio für konsistente moderne Pixelart-Assets mit Dashboard, Profilbibliothek, geführtem Wizard, Profilvererbung und spezialisierten Asset-Editoren.

Vor funktionalen Änderungen lesen:

1. `docs/TECHNOLOGIE-STACK-V2.md`
2. `docs/CODEX-V2-UMSETZUNGSANWEISUNG.md`
3. `docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md`
4. `docs/CODEX-V2-PROMPTS.md`
5. `docs/PROMPT-SPECIFICATION.md`

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
- kein Backend
- kein Python in der Haupt-App

Die vorhandenen HTML/CSS/JavaScript-Dateien sind **Legacy V1**. Sie dürfen während der Migration als Referenz und Datenquelle verwendet werden. Neue V2-Features dürfen nicht als neue Vanilla-DOM-Architektur entstehen.

## Arbeitsweise

1. Genau eine Aufgabe aus `docs/CODEX-V2-PROMPTS.md` bearbeiten.
2. Vor Änderungen betroffene Legacy- und V2-Dateien untersuchen.
3. Bei komplexen Schritten den Status in `PLANS.md` aktualisieren.
4. Kleinste vollständige Lösung implementieren.
5. Domain-Logik als pure TypeScript-Funktionen halten.
6. UI-Verhalten mit React Testing Library, Domain-Logik mit Vitest testen.
7. `npm run verify` ausführen.
8. `git diff --check` ausführen.
9. Diff auf Regressionen, tote Legacy-Pfade und versehentliche Default-Änderungen prüfen.
10. Aufgabe mit geänderten Dateien, Tests, Risiken und einem englischen Emoji-Commitvorschlag abschließen.
11. Nicht selbstständig mit der nächsten Aufgabe fortfahren.

Keine Commits oder Pushes ausführen, außer der konkrete Auftrag verlangt dies.

## Zielbefehle nach der React-Migration

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run test:run
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
