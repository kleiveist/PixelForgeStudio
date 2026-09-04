<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Workspace — Accessibility

## Timeline und Wiedergabe

Die acht Frames bilden eine benannte Radiogruppe mit Roving Tabindex. Jeder
Eintrag nennt Framezahl und Phase; sein Canvas besitzt zusätzlich eine
Textalternative. Pfeil links/rechts, Pos1 und Ende funktionieren unabhängig
von Pointerbedienung. Der semantisch beschriftete Scrubbing-Regler bietet eine
weitere direkte Auswahl.

Play, Pause, Stopp, Vor und Zurück liegen in der benannten Gruppe
„Walk-Wiedergabe steuern“. Gesperrte Controls verweisen auf eine sichtbare
Begründung. Statusregionen melden aktuellen Frame, Phase, FPS,
Wiedergabezustand, Renderwarnungen und fehlende Produktionsvoraussetzungen,
ohne den Fokus zu verschieben.

## Bewegung und Onion Skin

Der Workspace besitzt kein Auto-Play. Das gilt ausdrücklich auch bei
`prefers-reduced-motion: reduce`; eine Wiedergabe beginnt nur nach Betätigung
von „Abspielen“. Projekt-/Clip-/Richtungswechsel und Unmount brechen einen
offenen Animation-Frame-Request ab.

Onion Skin ist beim Öffnen aus. Modus und begrenzte Deckkraft sind über
beschriftete native Controls erreichbar. Die zusätzlichen Canvas-Schichten
sind `aria-hidden`, weil vorheriger und nächster Frame bereits über ihre
Timeline-Thumbnails benannt sind und nicht als neue Bedienziele erscheinen.
Farbe ist nicht die einzige Information: Der Modus steht stets als Text im
Select.

## Prüfabdeckung

RTL-Tests decken zugängliche Namen, Status, Sperrzustand, Klick/Pointer,
Scrubbing, Pfeile, Pos1/Ende und alle Onion-Skin-Modi ab. Ein injizierter
Scheduler prüft 10 FPS, Pause, Stopp, Loop, verzögerte Ticks,
Projektwechsel-Cleanup, Unmount und Reduced Motion ohne globale Echtzeituhr.
