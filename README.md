# Pixelart Prompt Studio 🎮

Ein vollständiges lokales Webprojekt zur Erzeugung konsistenter Prompts für moderne, hochauflösende Pixelart-Spielassets.

Die Anwendung erstellt getrennte Prompt-Pakete für:

- **Profil A:** klassische, geerdete Fantasy
- **Profil B:** düstere, geerdete Fantasy

Jedes Paket enthält:

1. Hauptprompt
2. Negativprompt
3. technische Spezifikation
4. kombinierte Ausgabe

Direkte Namen bestehender Spiele, Marken oder Künstler werden in den erzeugten Prompts bewusst vermieden.

## Aktuelle Projektstandards

| Bereich | Standard |
|---|---|
| Perspektive | frontale 3/4-RPG-Draufsicht |
| Projektion | orthografisch |
| Kamera | Süden nach Norden, ca. 60° abwärts von der Horizontalen |
| Tile-Raster | 32 × 32 px |
| Figurenhöhe | 80 px |
| Richtungen | 8 |
| Frame | 128 × 128 px |
| Sheet | 4 × 2 Frames, insgesamt 512 × 256 px |
| Grafik | moderne High-Resolution-Pixelart |
| Konturen | weiche selektive Outline |
| Hintergrund | transparent |
| Licht | automatisch nach Setting und Stimmung |

Alle früher besprochenen Alternativen bleiben im Generator auswählbar.

## Starten

### Windows

`start.bat` doppelklicken.

### Linux oder macOS

```bash
./start.sh
```

### Über npm

Es werden keine externen Pakete benötigt. Node.js ab Version 18 genügt.

```bash
npm run dev
```

Danach läuft die Anwendung standardmäßig unter:

```text
http://127.0.0.1:4173
```

Zum automatischen Öffnen im Browser:

```bash
npm start
```

## Projekt prüfen und bauen

```bash
npm run verify
```

Der Befehl führt nacheinander aus:

- Syntax- und Strukturprüfung
- automatische Tests
- statischen Build in `dist/`

Einzelne Befehle:

```bash
npm run check
npm test
npm run build
```

## Funktionen

- getrennte Erzeugung der Stilprofile A und B
- deutsche, englische oder zweisprachige Ausgabe
- Live-Aktualisierung bei jeder Änderung
- exakte Kamera-, Raster-, Frame- und Sheet-Regeln
- automatische Canvas-Berechnung
- 4- oder 8-Richtungssets
- Einzelassets, Asset-Sets, Sprite-Sheets, Tilesets und Konzeptbilder
- adaptive Lichtlogik für Außenbereiche, Gebäude, Nacht und düstere Stimmungen
- transparenter Hintergrund und wählbarer Kontaktschatten
- dynamischer Negativprompt
- technische Plausibilitätsprüfung
- lokale automatische Speicherung
- benannte Presets
- JSON-Import und JSON-Export
- TXT-Export aller erzeugten Prompt-Pakete
- Kopierfunktionen pro Abschnitt und für die Gesamtausgabe
- responsive Oberfläche für Desktop und kleinere Bildschirme

## Projektstruktur

```text
pixelart-prompt-studio/
├── index.html
├── package.json
├── start.bat
├── start.sh
├── public/
│   └── favicon.svg
├── src/
│   ├── styles/
│   │   └── main.css
│   └── js/
│       ├── main.js
│       ├── config/
│       │   ├── default-state.js
│       │   └── form-schema.js
│       ├── core/
│       │   ├── exporter.js
│       │   ├── prompt-builder.js
│       │   └── storage.js
│       └── ui/
│           ├── form-renderer.js
│           └── output-renderer.js
├── scripts/
│   ├── build.mjs
│   ├── check.mjs
│   └── dev-server.mjs
├── tests/
│   └── prompt-builder.test.mjs
├── presets/
│   ├── building-single.json
│   └── hero-eight-directions.json
└── docs/
    ├── ASSISTANT-MASTER-PROMPT.md
    └── PROMPT-SPECIFICATION.md
```

## Presets und Datenschutz

Der letzte Zustand und benannte Presets werden über `localStorage` ausschließlich im verwendeten Browser gespeichert. Die Anwendung sendet keine Daten an einen Server und besitzt keine externe Analysefunktion.

Für Sicherungen können Presets als JSON exportiert und später wieder importiert werden.

## Anpassung der Standards

Die verbindlichen Ausgangswerte liegen in:

```text
src/js/config/default-state.js
```

Alle im Formular angebotenen Optionen liegen in:

```text
src/js/config/form-schema.js
```

Die eigentliche Prompt-Logik liegt in:

```text
src/js/core/prompt-builder.js
```

## Lizenz

MIT-Lizenz. Siehe `LICENSE`.
