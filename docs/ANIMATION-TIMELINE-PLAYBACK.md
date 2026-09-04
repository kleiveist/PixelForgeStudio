<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — Timeline, Playback und Onion Skin

## Produktionsvoraussetzungen

Die Wiedergabe wird nur für den aktiven `walk-humanoid-8-v1`-Clip in Richtung
Süd freigeschaltet. Das Projekt benötigt alle 15 Pflichtparts, freigegebene
Anker, dekodierbare Originalquellen und ein gültiges Rig. Solange etwas fehlt,
bleiben Play, Stopp und Einzelschritte gesperrt; Timeline und Viewport nennen
alle Produktionsblocker. Es werden keine Dummyframes erzeugt.

## Timeline bedienen

Jeder der acht Einträge zeigt den tatsächlich gerenderten Frame, seine Nummer
und seine Laufphase. Der ausgewählte Frame erscheint im großen Pixel-Viewport.
Folgende Bedienwege sind gleichwertig:

- Frame anklicken oder antippen
- den Regler „Frame scrubben“ bewegen
- mit Pfeil links/rechts zum benachbarten Frame wechseln
- mit Pos1 zum ersten und mit Ende zum letzten Frame springen
- die Buttons „Vorheriger Frame“ und „Nächster Frame“ verwenden

Der Timeline-Status nennt immer `Frame x von 8`, Phase, Richtung, Projekt-FPS
und ob die Wiedergabe läuft oder pausiert.

## Wiedergabe

„Abspielen“ startet ausschließlich nach einer Nutzeraktion. „Pause“ hält den
aktuellen Frame, „Stopp“ beendet die Wiedergabe und wählt Frame 1. Der
kanonische Clip läuft im Loop; nach Frame 8 folgt Frame 1. Das im Projekt
gespeicherte Tempo bestimmt die Bildwechsel. Die Monitorfrequenz ist davon
unabhängig: verspätete Displayticks holen anhand der tatsächlich verstrichenen
Zeit in einem begrenzten Rechenschritt auf.

Auch bei `prefers-reduced-motion: reduce` startet nichts automatisch. Eine
bewusst ausgelöste manuelle Wiedergabe bleibt möglich. Projekt-, Clip- oder
Richtungswechsel sowie das Schließen des Workspace stoppen den Scheduler und
geben dessen offenen Request frei.

## Onion Skin

Onion Skin ist standardmäßig aus. Wählbar sind:

- vorheriger Frame
- nächster Frame
- vorheriger und nächster Frame
- aus

Die Deckkraft ist auf 10 bis 60 Prozent begrenzt. Nachbarframes werden als
separate Canvas-Anzeigeschichten über den aktuellen Frame gelegt. Die Funktion
verändert weder dessen RGBA-Array noch Projektmetadaten oder spätere
Exportpixel.

## Cache und Datenhaltung

Gerenderte Frames bleiben flüchtig. Der begrenzte LRU-Cache adressiert sie mit
Projekt-ID, Projektrevision, Clip-ID, Richtung und Frameindex. Eine neue
Projektrevision macht alte Frames dieses Projekts ungültig; die Cache-API kann
zusätzlich nur einen betroffenen Clip, eine Richtung oder einen Frame
entfernen. Part-, Anker-, Rig-, Clip- und Overrideänderungen laufen über die
Projekt-Revision und können deshalb keine alte Vorschau als aktuellen Frame
ausgeben. Weder Framebytes noch Onion-Skin-Zustand werden persistiert.
