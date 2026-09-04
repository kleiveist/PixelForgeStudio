<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# 03 — Webseitenaufbau und Bedienkonzept

## Umsetzungsstand

Die globale Shell, der URL-basierte Modulumschalter, alle sechs bestehenden
Prompt-Views und die vier kontrollierten Animation-Platzhalter wurden mit
Prompt 30 umgesetzt. Die in Abschnitt 2 beschriebene produktive Startseite
folgt in Prompt 31.

## 1. Globale Studio-Shell

Die oberste Ebene gehört dem Dachprodukt und bleibt in beiden Modulen sichtbar.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PixelForge Studio      [ Prompt Studio | Animation Studio ]   Theme │
├──────────────────────────────────────────────────────────────────────┤
│ modulabhängige Navigation und Schnellaktionen                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         aktive Studio-View                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Globaler Header

Pflichtelemente:

- Logo und `PixelForge Studio`
- Modulumschalter mit `Prompt Studio` und `Animation Studio`
- Rückkehr zur Studio-Startseite über Logo/Brand
- Theme-Schalter
- sichtbarer Modulkontext
- globaler Skip-Link zum Hauptinhalt

Der Modulumschalter ist kein rein dekorativer Toggle. Er ist semantische
Navigation:

- `aria-label="Studio auswählen"`
- aktive Auswahl mit `aria-current="page"`
- normale Tastaturfokussierung
- kein versteckter Inhalt, der nur per Hover erreichbar ist
- Fokus landet nach Navigation auf dem neuen Hauptbereich

## 2. Studio-Startseite

Route:

```text
?studio=home
```

Die Startseite zeigt zwei gleichwertige Hauptkarten:

```text
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Prompt Studio               │  │ Animation Studio            │
│ Pixelart-Produktion planen  │  │ Figuren riggen und animieren│
│ [Öffnen]                    │  │ [Öffnen]                    │
└─────────────────────────────┘  └─────────────────────────────┘
```

Darunter:

- letzter Prompt-Entwurf, falls vorhanden
- zuletzt verwendete Profile
- letzte Animationsprojekte
- verständliche Empty States
- keine automatische Navigation allein aufgrund vorhandener Daten

Die Startseite darf keine Prompt- oder Animationsdomain duplizieren. Sie liest
über schmale Dashboard-Adapter nur Zusammenfassungen.

## 3. Prompt Studio

Die sechs bestehenden Views bleiben erhalten:

```text
Dashboard
Profile
Wizard
Prüfung
Ausgabe
Einstellungen
```

Die visuelle Modulüberschrift lautet `PixelForge Prompt Studio`. Bestehende
Arbeitsabläufe und Testselektoren bleiben möglichst stabil.

Neue Integrationspunkte:

- Charakterprofilkarte: `Im Animation Studio verwenden`
- Review/Ausgabe: `Animationsprojekt vorbereiten`
- Dashboard: Verweis auf Animation Studio
- Animationseinstellungen bleiben nicht im Prompt-Wizard versteckt

## 4. Animation Studio

Modulnavigation:

```text
Projekte
Workspace
Character Kits
Rig-Vorlagen
```

`Workspace` ohne ausgewähltes Projekt zeigt keinen defekten Editor, sondern
eine klare Aufforderung, ein Projekt anzulegen oder zu öffnen.

### 4.1 Projekte

Die Projektansicht besitzt:

- neues Projekt
- Projekt importieren
- Suche
- Sortierung
- zuletzt bearbeitet
- Karten mit Name, Rig, Richtungsabdeckung, Clipstatus und Vorschaubild
- Öffnen
- Duplizieren
- Umbenennen
- Exportieren
- Löschen mit bestätigender Dialoggrenze

Projektanlage:

```text
1. Name
2. Rig-Vorlage
3. Figurenhöhe/Frameprofil
4. Richtungsquellen
5. gewünschte Animationen
6. Projekt erstellen
```

Standard:

```text
Rig: humanoid-80-v1
Figurenhöhe: ca. 80 px
Frame: 128 × 128 px
Fußanker: 64 / 112
Richtungsmodus: fünf Originalrichtungen + drei Spiegelrichtungen
Clip: Walk, 8 Frames, 10 FPS
```

### 4.2 Workspace

Desktop-Layout:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Projektname  Save-Status  Richtung  Clip  Play  Export                │
├────────────────┬───────────────────────────────┬───────────────────────┤
│ Teileinventar  │                               │ Inspektor             │
│                │       Rig-/Pixel-Viewport     │                       │
│ Kopf           │                               │ Slot                  │
│ Torso          │       Raster                  │ Bild                  │
│ Arme           │       Figur                   │ Anker                 │
│ Beine          │       Bones/Anker             │ Skalierung            │
│ Ausrüstung     │       Framegrenzen            │ Offset/Layer          │
│                │                               │ Spiegelregel          │
├────────────────┴───────────────────────────────┴───────────────────────┤
│ Frame 1  Frame 2  Frame 3 ... Frame 8 | FPS | Onion Skin | Reset     │
└────────────────────────────────────────────────────────────────────────┘
```

Die Paneele sind in CSS-Grid aufgebaut. Resize-Funktionen sind optional; die
erste Version verwendet stabile Layoutgrenzen.

### 4.3 Teileinventar

Gruppen:

```text
Körper
├── Kopf
├── Torso
└── Becken

Arm links/rechts
├── Oberarm
├── Unterarm
└── Hand

Bein links/rechts
├── Oberschenkel
├── Unterschenkel
└── Fuß

Bekleidung/Ausrüstung
├── Haare vorne/hinten
├── Kopfbedeckung
├── Brust-/Schulterrüstung
├── Handschuhe/Schuhe
├── Umhang vorne/hinten
├── Waffe/Schild
├── Rücken-/Hüftobjekt
└── freie Accessoires
```

Jeder Slot zeigt:

- Belegungsstatus
- Richtungsabdeckung
- Warnung bei fehlenden Ankern
- Vorschau
- Teil ersetzen
- Teil entfernen
- in Bibliothek speichern

Drag-and-drop ist eine Zusatzbedienung. Jede Aktion besitzt eine Schaltfläche
und ist per Tastatur erreichbar.

### 4.4 Richtungsabdeckung

Eine Matrix macht fehlende Quellen sichtbar:

```text
                 S   SO   O   NO   N   NW   W   SW
Kopf             ✓   ✓    ✓   ✓    ✓   M    M   M
Torso            ✓   ✓    ✓   ✓    ✓   M    M   M
Waffe rechts     ✓   ✓    ✓   ✓    ✓   !    !   !
```

Legende:

- `✓` eigene Quelle
- `M` gültig gespiegelt
- `!` Spiegelung verboten oder Override erforderlich
- `—` optionaler Slot nicht verwendet
- `?` noch nicht eingerichtet

Die Matrix ist nicht nur farbcodiert; Symbol und Textstatus sind sichtbar.

### 4.5 Rig-Viewport

Anzeigemodi:

- Pixelansicht
- Rig-Overlay
- Anker bearbeiten
- Bounding Boxes
- Fußlinie
- Onion Skin
- Clipping-Warnung
- Transparenz-Schachbrett
- optionaler neutraler Testhintergrund

Zoom:

```text
1×, 2×, 4×, 8×, 12×, 16×
```

Pixelart wird nur mit nearest-neighbor dargestellt. Panning und Zoom besitzen
Maus- und Tastatursteuerung.

### 4.6 Inspektor

Je nach Auswahl:

**Part**

- Slot
- Richtung
- Bilddatei
- Originalgröße
- Trim-Bounds
- proximaler Anker
- distaler Anker
- Pivot
- Uniform Scale
- Offset X/Y
- Rotation-Offset
- Layer
- Spiegelmodus

**Frame**

- Root-Offset
- Jointkorrekturen
- Partkorrekturen
- Layer-Override
- Frame zurücksetzen

**Projekt**

- Rig
- Framegröße
- Fußanker
- Clip
- FPS
- Richtungsmodus
- Exportreihenfolge

## 5. Responsives Verhalten

### Große Desktopfläche

Drei Paneele plus Timeline.

### Mittlere Breite

- Inventar und Inspektor als umschaltbare Seitenpaneele
- Viewport bleibt zentral
- Timeline bleibt unten
- Header darf umbrechen, ohne Navigation zu verdecken

### Kleine Breite

Die App bleibt prüf- und projektfähig, aber komplexes Rigging wird als
schrittweise Ansicht angeboten:

```text
Teile → Viewport → Eigenschaften → Timeline
```

Es gibt keine künstliche Behauptung, dass ein 128×128-Pixel-Rig auf einem sehr
kleinen Smartphone genauso effizient bearbeitet werden kann wie am Desktop.
Alle Inhalte bleiben dennoch erreichbar.

## 6. Status- und Fehlermeldungen

Sichtbare Zustände:

```text
Nicht gespeichert
Speichert …
Gespeichert
Offline lokal verfügbar
Speichern fehlgeschlagen
Bild fehlt
Bild konnte nicht dekodiert werden
Anker unvollständig
Export blockiert
Export läuft
Export abgeschlossen
```

Fehler erscheinen in der Nähe der Ursache und zusätzlich in einer
zusammenfassenden Statusregion, wenn mehrere Slots betroffen sind.

## 7. Fokus und Tastatur

Mindeststeuerung:

| Aktion | Tastatur |
|---|---|
| Modul wechseln | Tab/Enter |
| Paneel wechseln | normale Tab-Reihenfolge |
| Frame vor/zurück | Pfeil links/rechts, wenn Timeline fokussiert |
| Play/Pause | Leertaste auf Playback-Control |
| Auswahl verschieben | Pfeiltasten |
| fein verschieben | Pfeiltaste |
| gröber verschieben | Shift + Pfeiltaste |
| Undo/Redo | Strg/Cmd+Z, Strg/Cmd+Shift+Z |
| löschen | Entf mit Fokus und bestätigbarer Aktion |
| Zoom | Schaltflächen und Tastenkürzel |
| Overlay umschalten | beschriftete Schalter |

Globale Browserkürzel werden nicht unnötig überschrieben.

## 8. Visuelle Konsistenz

- vorhandene semantische Light-/Dark-Tokens weiterverwenden
- keine zweite unabhängige Designbibliothek
- Modulunterschiede über semantische Akzenttokens, Icons und Bezeichnungen
- keine hartcodierten Farben in Feature-Komponenten
- Icons als lokale SVG-React-Komponenten
- klare Pixelraster nur im eigentlichen Arbeitsbereich
- normale, gut lesbare UI-Typografie außerhalb des Canvas
