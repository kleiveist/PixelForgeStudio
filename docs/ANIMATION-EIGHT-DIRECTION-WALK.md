<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# Acht-Richtungs-Walk

Der Produktionsgenerator erzeugt aus dem gemeinsamen Clip
`walk-humanoid-8-v1` genau acht Frames für jede Richtung. Die Ausgabe folgt
immer dem kanonischen Katalog:

```text
Süd → Südost → Ost → Nordost → Nord → Nordwest → West → Südwest
```

Ein vollständiger Lauf besteht damit aus 64 adressierbaren, flüchtigen
Renderframes. Es wird dabei weder ein SpriteSheet geschrieben noch ein
Renderframe in den Projektmetadaten gespeichert.

## Richtungsprofile

Jede der fünf authored Rigposen besitzt ein versioniertes
`DirectionMotionProfile`. Die drei westlichen Zielprofile entstehen durch die
kontrollierte Geometriespiegelung aus Prompt 44. Das Profil projiziert die
normierten Clipkanäle auf Schrittachse, Stride, Oberschenkel,
Unterschenkel, Knie-/Fußhub, Gegenarm, Root-Sway und Bend-Seite.

| Projektion | Oberschenkel | Unterschenkel | Arm |
|---|---:|---:|---:|
| Seite | 18° | 28° | 14° |
| Diagonal | 14° | 22° | 11° |
| Front/Rücken | 9° | 18° | 8° |

Kontaktfüße bleiben auf der gemeinsamen Groundline. Der Renderer erfindet
weder eine neue Kamera noch richtungsspezifisches Weltlicht.

## Produktionsprüfung

Vor dem Rendern müssen Clip und Zielrig gültig sein. Alle Pflichtslots brauchen
eine auflösbare Richtungsquelle, produktionsreife Originalanker und eine
dekodierte Blobquelle. Verbotene Spiegelungen und offene Reviews blockieren den
gesamten 64-Frame-Satz. Ein Fehler in nur einer Richtung wird deshalb niemals
als vollständiger Erfolg angezeigt.

Nach dem Rendern werden Framegröße, FootAnchor, endliche Pose, sichtbare
Silhouette und Clipping geprüft. Die Silhouettenhöhe jeder Phase wird mit Süd
verglichen; eine Abweichung über ±1 px wird als richtungsbezogene Warnung
ausgegeben, sofern Clipping die Messung nicht unzuverlässig macht.

## Vorschau und Cache

Die Richtungswahl zeigt alle acht echten Walk-Sequenzen in derselben Timeline.
„Alle Richtungen prüfen“ öffnet acht kleine, statische Previewfelder für den
gemeinsam gewählten Frame. Diese Felder besitzen keine eigenen Uhren und
starten insbesondere bei reduzierter Bewegung nicht automatisch.

Gerenderte Frames liegen nur im begrenzten Arbeitsspeicher-Cache. Der
vollständige Schlüssel besteht aus Projekt-ID, Projektrevision, Clip-ID,
Richtung und Frameindex. Eine neue Projektrevision verwirft alte Frames; die
Originalbilder und Projektmetadaten bleiben die rekonstruierbare Quelle.
