<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Animation Studio — Godot-4-Export

Das Animation Studio leitet sein Godot-Paket ausschließlich aus dem neutralen
`spriteSheetMetadata` V1 und dem dazugehörigen Sheet-PNG ab. Der dauerhafte
Zielvertrag lautet `{ engine: "godot", major: 4 }`; eine Godot-Patchversion ist
weder Projekt- noch Exportzustand.

## Paket laden

Im geöffneten Animation Workspace zuerst den vollständigen
Acht-Richtungs-Walk erzeugen, **Exportieren** öffnen und **Godot 4 Paket**
wählen. Harte Produktionsfehler blockieren den Download; sichtbare Warnungen
müssen wie beim neutralen Export bestätigt werden.

Für „Kleif Wache“ enthält `kleif-wache_godot4.zip`:

```text
kleif-wache/
├── kleif-wache_walk.png
├── kleif-wache_walk.json
├── kleif-wache_sprite_frames.tres
└── README_IMPORT.md
```

Alle ZIP-Pfade sind relativ und aus einem normalisierten Namen aufgebaut. Die
`.tres`-Datei verweist über
`res://kleif-wache/kleif-wache_walk.png` auf das unverändert beigelegte
SpriteSheet. `res://` ist ein Godot-projektrelativer Ressourcenpfad und kein
lokaler absoluter Dateisystempfad.

## Animationsnamen

Die Ressource enthält deterministisch genau diese acht Animationen:

```text
walk_south
walk_south_east
walk_east
walk_north_east
walk_north
walk_north_west
walk_west
walk_south_west
```

Jede Animation besitzt acht Frames in Indexreihenfolge, `loop = true` und die
FPS des neutralen Projekts. Für jede der 64 JSON-Regionen existiert genau eine
stabil benannte `AtlasTexture`-Subresource. Die Engineprojektion verändert das
JSON nicht.

## In Godot verwenden

1. Den enthaltenen Ordner unverändert in das Wurzelverzeichnis eines
   Godot-4-Projekts kopieren.
2. Warten, bis Godot das PNG importiert hat.
3. Die `.tres`-Datei als `SpriteFrames` einem `AnimatedSprite2D` zuweisen.
4. Je nach Bewegungsrichtung einen der obigen Namen auswählen.
5. `speed_scale` nur bewusst ändern; die Ressource enthält bereits das
   Projekt-FPS.
6. Den `footAnchor` aus der JSON-Datei für Ursprung, Bodenbezug und Kollision
   verwenden.

Das Paket erzeugt absichtlich keine Player-Szene, Eingabelogik oder
CharacterController-Implementierung.

## Prüfstatus

Die Textprojektion wird gegen eine reviewbare synthetische `.tres`-Fixture
bytegenau geprüft. Tests vergleichen alle acht Namen, 64 Subresource-IDs,
Regionen, FPS/Loop, Pfadnormalisierung, ZIP-Struktur, JSON-Unverändertheit und
den Inhalt der Importanleitung.

In der aktuellen Docker-Sitzung ist keine `godot4`- oder `godot`-Ausführung
installiert. Ein echter Editor-/Headless-Import kann deshalb hier nicht
behauptet werden und bleibt Teil der manuellen Release-Abnahme.
