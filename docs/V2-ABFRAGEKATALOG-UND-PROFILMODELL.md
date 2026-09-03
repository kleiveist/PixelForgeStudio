<!-- PYGINDEX:NAVIGATION START -->
[Zur Übersicht](index.md)
<!-- PYGINDEX:NAVIGATION END -->

# PixelForge Prompt Studio V2 — Abfragekatalog und Profilmodell

## 1. Zweck

Dieses Dokument legt fest, **welche Informationen das Studio abfragt**, **wann eine Frage erscheint**, **wie Profile kategorisiert werden** und **welche Werte global vererbt werden**.

Der zentrale Grundsatz lautet:

> Zuerst wird die Art des gewünschten Bildes bestimmt. Erst danach öffnet sich ein passender, spezialisierter Abfragekatalog.

Dadurch erhält eine Holztextur keine Figurenfragen, ein NPC keinen Textur-Wizard und ein Artwork keine unnötigen Sprite-Sheet-Zwangsregeln.

---

## 2. Begriffe

| Begriff | Bedeutung |
|---|---|
| **Basisprofil** | Globales Produktionsprofil mit technischen Regeln wie Pixelgröße, Tilegröße, Kamera und Outline |
| **Kategorieprofil** | Wiederverwendbare Vorgaben für eine Asset-Kategorie, zum Beispiel „NPC 80 px“ oder „nahtlose 32-px-Texturen“ |
| **Asset-Profil** | Konkretes gespeichertes Profil, zum Beispiel „Dorfschmied mit Lederschürze“ |
| **Entwurf** | Aktueller, noch nicht als Profil gespeicherter Wizard-Zustand |
| **Capability** | Technische Fähigkeit eines Asset-Typs, zum Beispiel `directional`, `animated`, `tileable` oder `transparent` |
| **Kompatibilitätsschlüssel** | Automatisch erzeugter Schlüssel, der technisch kompatible Profile gruppiert |
| **Richtungsset** | Mehrere Ansichten desselben beweglichen Motivs bei unveränderter Kamera |
| **Animationsset** | Mehrere Bewegungsphasen; kann mit oder ohne Richtungsset existieren |

---

# 3. Dashboard-Aufbau

## 3.1 Hauptbereiche

| Dashboard-Bereich | Inhalt | Aktion |
|---|---|---|
| **Neues Asset** | große Kategoriekarten mit Icons | startet neuen Wizard |
| **Basisprofile** | globale technische Produktionsprofile | laden, duplizieren, sperren, bearbeiten |
| **Gespeicherte Asset-Profile** | kategorisierte Profilkarten | laden, favorisieren, duplizieren, exportieren |
| **Letzte Entwürfe** | zuletzt bearbeitete, automatisch gespeicherte Projekte | fortsetzen |
| **Vorlagen** | mitgelieferte Startprofile | als neues Profil verwenden |
| **Import / Export** | JSON-Pakete oder einzelne Profile | sichern und wiederherstellen |

## 3.2 Kategoriekarten und Icons

| Hauptkategorie | Haupticon | mögliche Badge-Icons | Standard-Capabilities |
|---|---|---|---|
| Charakter / Figur | Person | NPC, Held, Gegner, Tier | `movable`, `directional`, `animated`, `scaledCharacter` |
| Bewegliches Objekt | Objekt mit Bewegungspfeil | Wagen, schwebend, rollend, mechanisch | `movable`, optional `directional`, optional `animated` |
| Statisches Objekt | Kiste / Säule | Möbel, Behälter, Dekoration | `static`, optional `animated` |
| Textur / Material | Rastermuster | Holz, Schnee, Stein, Metall, Stoff | `tileable`, `materialSurface` |
| Natur / Pflanze | Baum | Laub, Schnee, Sumpf, Pilz | `static`, optional `animated`, `worldScaled` |
| Gebäude / Architektur | Haus | Holzbau, Steinbau, Ruine, Turm | `static`, `footprint`, optional `modular` |
| Tileset / Kartenelement | Kachelraster | Boden, Wand, Übergang, Autotile | `tileable`, `gridBound`, optional `modular` |
| Item / Ausrüstung | Beutel / Kristall | Kleidung, Werkzeug, Trank, Questobjekt | `static`, optional `wearable` |
| Artwork / Konzeptbild | Bildrahmen | Figur, Szene, Umgebung | `freeComposition`, optional `transparent` |

Materialprofile zeigen ein kombiniertes Symbol, zum Beispiel:

- Haupticon: **Textur**
- Badge: **Holz**
- Zusatzbadge: **32 px**

Ein Profil kann mehrere Tags besitzen, aber genau eine Hauptkategorie.

---

# 4. Geführter Wizard

## 4.1 Standardablauf

| Schritt | Bezeichnung | Inhalt | kann übersprungen werden? |
|---:|---|---|---|
| 1 | Projektstart | neues Asset, Profil laden oder Vorlage wählen | nein |
| 2 | Bildart | Hauptkategorie und Untertyp | nein |
| 3 | Basisprofil | technisches Basisprofil wählen oder neu anlegen | nein |
| 4 | Motiv | kategoriespezifische Motivfragen | nein |
| 5 | Material und Zustand | Oberflächen, Farben und Abnutzung | abhängig von Kategorie |
| 6 | Setting und Licht | Umgebung, Tageszeit, Stimmung, Lichtquelle | bei reiner Neutraltextur teilweise |
| 7 | Bewegung und Animation | nur bei passender Capability | ja, wenn nicht relevant |
| 8 | Ausgabe und Layout | Einzelasset, Richtungsset, Sheet, Tile, Artwork | nein |
| 9 | Prüfung | Zusammenfassung, Konflikte, geerbte und eigene Werte | nein |
| 10 | Prompt-Ausgabe | Hauptprompt, Negativprompt, Technik, kombiniert | nein |
| 11 | Speichern | Asset-Profil oder Entwurf speichern | optional |

## 4.2 Navigationsregeln

- Der Nutzer kann zu abgeschlossenen Schritten zurückkehren.
- Beim Wechsel der Hauptkategorie wird gewarnt, wenn kategoriespezifische Daten verworfen würden.
- Unsichtbare Felder dürfen nicht unbemerkt in den Prompt einfließen.
- Pflichtfelder werden vor „Weiter“ geprüft.
- Eine seitliche Zusammenfassung zeigt aktive Kategorie, Basisprofil, Maßstab, Ausgabe und Capability-Status.
- Der Wizard speichert gültige Nutzeränderungen verzögert und bewusste
  Schrittwechsel sofort lokal. Initialisierung, Profil-Hydration und Resume
  lösen keinen Write aus.

## 4.3 Umgesetzter Einstieg bis Prompt 20

Der aktuell implementierte Core-Flow lautet:

```text
Projekt → Hauptkategorie/Untertyp → Basisprofil
→ Character-, Moving-Object-, Static-Object-, Texture-, Nature-, Building-
oder Tileset-Details, falls relevant
→ Capability-Schritte
```

Ein klassifizierter Entwurf darf vor der Basiswahl auf `wizard/profile`
fortsetzbar bleiben. Erst eine in der aktuellen Bibliothek vorhandene oder dort
erfolgreich neu angelegte Basisfamilie öffnet die nachfolgenden Richtungs-,
Animations- oder Kachelbarkeitsfragen. Deren Sichtbarkeit stammt ausschließlich
aus `resolveCapabilities()`. Für die Hauptkategorie `character` liegt zwischen
Basisprofil und Capability-Schritten ein eigener Character-/NPC-Fachschritt.
`movingObject`, `staticObject`, `texture`, `nature`, `building` und `tileset` nutzen an derselben
Stelle ihre eigenen `movingObjectDetails`-, `staticObjectDetails`-,
`textureDetails`-, `natureDetails`-, `buildingDetails`- beziehungsweise
`tilesetDetails`-Schritte; alle anderen Kategorien überspringen diese sieben
Fachschritte.

Der Basisprofil-Schritt zeigt für alle relevanten Produktionswerte den
wirksamen Wert, seine Quelle (Basisprofil, Kategorieprofil oder lokaler Entwurf)
und den Lock-Status. Figurenhöhe erscheint nur bei `scaledCharacter`, Raster-
und Weltkamerageometrie nicht bei `freeComposition` und der Alpha-Rand nur bei
transparentem Hintergrund. Profil-Hydration setzt den Formularzustand, ohne
beim Mount zu schreiben. Eine bewusste Auswahl oder andere programmatische
Mehrfeldänderung wird nach der vollständigen Übernahme einmal durch den
generischen Engine-Hook in Draft-Projektion, Dirty-Status und Autosave gegeben.

Der Character-Schritt verwaltet seine Fachwerte in React Hook Form und
projiziert sie über das strikte additive Character-Schema in den Draft. Ein
Kategorie- oder Untertypwechsel entfernt diese Antworten, ein Basiswechsel
erhält sie. Autosave und exaktes Resume gelten auch für die neuen Felder;
Initialisierung, Profil-Hydration und Resume bleiben schreibfrei. Rolle,
Richtungszahl, gewählte Aktionen mit Frames und Silhouette erscheinen in der
Live-Zusammenfassung, das Dashboard bildet persistierte Aktions-/Frame-Paare ab.
Wird ein geerbtes optionales Character-Default ausdrücklich geleert, entfernt
die Draft-Projektion die Kategorieverknüpfung und materialisiert alle übrigen
wirksamen Fach- und Technikwerte relativ zur Base. So bleibt der leere Wert
auch nach Resume erhalten.

Der Moving-Object-Schritt erfasst Objektklasse, Zweck, Grundform,
Beschreibung, Footprint, Höhe, Anker, Bewegung, Mechanik, Material, Zustand,
Licht und Schatten im selben RHF-/Draft-/Autosave-/Resume-Pfad. Animation wird
getrennt als kanonische Sequenz-/Frame-Liste erfasst. Ein Basiswechsel erhält
diese Antworten, ein Kategorie- oder Untertypwechsel entfernt sie. Beim
ausdrücklichen Leeren eines geerbten Moving-Object-Defaults werden die
Kategorie-/Assetverknüpfungen gelöst und die übrigen wirksamen Fach- und
Technikwerte relativ zur Base materialisiert. Summary und Dashboard zeigen
nur tatsächlich konfigurierte, capability-gültige Moving-Object-Fakten.

Der Texture-Schritt erfasst Materialtyp, Einsatz, Beschreibung, Nahtlosigkeit,
Struktur, Zustand, Oberflächenaufbau und -richtung, Feuchtigkeit, Vereisung,
Materiallicht und Zusatzdetails im gemeinsamen RHF-/Draft-/Autosave-/Resume-
Pfad. Materialtyp und wirksame Tilegröße sind read-only; `tileSize` bleibt in
der technischen Base→Category→Asset-Kette statt in `TextureAnswers`.
Nahtlosigkeit unterscheidet „nicht festgelegt“, `true` und `false`.
Klassifikationswechsel bereinigen Texture-Antworten, Basiswechsel erhalten sie.
Explicit Clear löst geerbte Elternprovenienz und materialisiert die übrigen
wirksamen Fach- und Technikwerte relativ zur Base. Holz erhält fokussierte
Produktionshinweise; Figuren-, Kleidungs-, Bewegungs- und Richtungsfragen
bleiben für Texturen vollständig aus. Der generische `tileability`-Schritt
wird nicht zusätzlich angezeigt, weil `textureDetails` die dreiwertige
Nahtlosigkeit bereits erfasst. Summary und Dashboard zeigen nur
tatsächlich konfigurierte Material-, Kachel- und Oberflächenfakten.

Der Nature-Schritt erfasst den aus dem Untertyp abgeleiteten Pflanzentyp, Art,
Beschreibung, Klima, Saison, Alter, Silhouette, untertypabhängige Stamm-,
Kronen- und Wurzelfelder, Moos, Pilze, Schnee, Ranken, Standfläche,
Bodenanschluss und 1 bis 12 Varianten im gemeinsamen
RHF-/Draft-/Autosave-/Resume-Pfad. Pflanzentyp und wirksame Tilegröße sind
read-only; `tileSize` bleibt in der technischen Base→Category→Asset-Kette und
wird nicht in `NatureAnswers` dupliziert. Basiswechsel erhalten die Antworten,
Klassifikationswechsel bereinigen sie. Explicit Clear löst geerbte
Kategorie-/Assetprovenienz und materialisiert die übrigen wirksamen Fach- und
Technikwerte relativ zur Base. Initialisierung, Profil-Hydration und Resume
schreiben nicht. Wind-/Magieanimation bleibt ein separater
`animated`-Capability-Schritt; Nature-Untertypen sind nicht `directional` und
erhalten keine 4/8-Richtungs- oder Figurenfragen. Summary und Dashboard zeigen
nur relevante Naturfakten.

Der Static-Object-Schritt erfasst die aus dem Untertyp abgeleitete
Objektklasse, Funktion, Beschreibung, Grundform, Proportion, Symmetrie, Haupt-
und Nebenmaterial, Materialdetails, Zustand, Konstruktion, Inhalt,
vollständige Standfläche, Schatten und 1 bis 12 Varianten im gemeinsamen
RHF-/Draft-/Autosave-/Resume-Pfad. Objektklasse und wirksame Tilegröße sind
read-only; `tileSize` bleibt in der technischen Base→Category→Asset-Kette.
Basiswechsel erhalten Fachantworten, Klassifikationswechsel bereinigen sie und
Explicit Clear löst geerbte Provenienz. Öffnen, Leuchten, Zerbrechen und
benutzerdefinierte Animation bleiben im separaten `animated`-Schritt. Kein
Static-Object-Untertyp ist `directional`, daher erscheint nie eine
4/8-Richtungsfrage. Summary und Dashboard zeigen nur kompakte tatsächliche
Objektfakten.

Der Building-Schritt erfasst den aus dem Untertyp abgeleiteten Gebäudetyp,
Nutzung, Bauform, Größe, vollständigen Footprint, Gebäudehöhe, Stockwerke,
Materialien, Dach, Fassade, Türen, Fenster, Zustand, Belegung, Umgebung,
Mapping, Kollision, Modularität und lokales Licht im gemeinsamen
RHF-/Draft-/Autosave-/Resume-Pfad. Gebäudetyp und wirksame technische
Weltgeometrie sind read-only und werden nicht in Fachantworten dupliziert.
Basiswechsel erhalten Building-Antworten, Klassifikationswechsel bereinigen
sie und Explicit Clear löst geerbte Provenienz. Modulare Optionen erscheinen
nur für Tor, Befestigung und Dungeon-Modul. Eine Toranimation bleibt ein
separater `animated`-Capability-Schritt; kein Building-Untertyp erhält
Figurenhöhe oder 4/8 Richtungen. Summary und Dashboard zeigen nur kompakte
tatsächliche Architekturfakten.

Der Tileset-Schritt erfasst den aus dem Untertyp abgeleiteten Tiletyp,
Mapping-Einsatz, untertyprelevante Kanten, Innen-/Außenecken, Übergänge und
Materialnachbarschaften, Seam-Regeln, Kachelachsen, Wiederholung, Varianten und
Atlasparameter im gemeinsamen RHF-/Draft-/Autosave-/Resume-Pfad. Tiletyp,
Tilegröße und Pixelmaßstab sind read-only beziehungsweise technische Werte und
werden nicht in Fachantworten dupliziert. Eine pure Berechnung liefert
Atlaszeilen, Spalten, Kapazität, Leerplätze und exakte Canvasmaße. Basiswechsel
erhalten Tileset-Antworten, Klassifikationswechsel bereinigen sie und Explicit
Clear löst geerbte Provenienz. Der Fachschritt ersetzt die generische
`tileability`-Stufe; alte Drafts werden beim Resume schreibfrei umgeleitet. Nur
das animierte Tile erhält einen getrennten Animationsschritt, kein Tileset
Figurenhöhe oder 4/8 Richtungen. Summary und Dashboard zeigen kompakte
tatsächliche Tileset- und Atlasfakten.

Prompts 00 bis 20 sind abgeschlossen. Prompt 21 ergänzt als nächste Phase den
Item-/Equipment-Editor.
Die späteren Material-, Setting-, Review-, Prompt- und Output-Flächen der
Tabelle oben werden durch Prompt 20 noch nicht als fertig erklärt.

---

# 5. Globale Basisparameter

Diese Werte gehören in ein **Basisprofil**. Sie werden nicht in jedem Asset erneut frei gewählt, sofern sie gesperrt sind.

| Parameter | Standard | relevant für | sperrbar | Bemerkung |
|---|---|---|---|---|
| Pixelstil | Modern-HD Pixelart | alle | ja | moderne, klar erkennbare Pixelstruktur |
| Tilegröße | 32 × 32 px | Spielassets, Tiles, Texturen | ja | Artwork kann davon entkoppelt werden |
| Figurenhöhe | 80 px | Figuren und figurähnliche Kreaturen | ja | nur bei `scaledCharacter` |
| Perspektive | frontale 3/4-RPG-Draufsicht | Weltassets | ja | Artwork darf optional abweichen |
| Projektion | orthografisch | Weltassets | ja | keine Entfernungsverkleinerung |
| Kameraneigung | ca. 60° | Weltassets | ja | zentral konfigurierbar |
| Kamerarichtung | Süd nach Nord | richtungsbezogene Weltassets | ja | Kamera bleibt fest |
| Outline | weich und selektiv | alle Pixelassets | ja | Profilstandard |
| Farbprofil | nach Stilprofil A/B | alle | ja | Kategorie kann lokale Palette ergänzen |
| Hintergrund | transparent | Einzelassets | ja | Texturen/Tiles benötigen keine klassische Freistellung |
| Alpha-Sicherheitsrand | 8 px | freigestellte Assets | ja | kann nach Assetgröße erhöht werden |
| Skalierung | Nearest Neighbor | Pixelassets | ja | keine geglättete Skalierung |
| Stilprofil | A, B oder beide | alle | optional | getrennte Prompt-Pakete |
| Lichtgrundlogik | kontextabhängig | alle | ja | lokale Lichtquelle darf ergänzen |
| Prompt-Ausgabe | 4 Blöcke | alle | ja | Haupt, negativ, technisch, kombiniert |

## 5.1 Sperrverhalten

Ein Feld im Basisprofil besitzt:

```json
{
  "value": 80,
  "locked": true
}
```

Regeln:

1. Ein gesperrter Wert wird im Kindprofil angezeigt, aber nicht direkt verändert.
2. Der Konfliktworkflow bietet Abbruch, die Wahl einer anderen Familie,
   „Basisprofil duplizieren“ oder „neues Basisprofil erstellen“; es gibt keinen
   stillen Override.
3. Ein ungesperrter Wert kann vom Kategorie- oder Asset-Profil überschrieben werden.
4. Die Zusammenfassung kennzeichnet Werte als **geerbt**, **überschrieben** oder **lokal**.
5. Beim Speichern wird kein redundanter Override geschrieben, wenn der Wert dem Basisprofil entspricht.
6. Eine neue oder duplizierte Familie wird als vollständiger Kandidat mit
   neuer ID und neuen Zeitstempeln in den validierten Gesamtgraphen eingefügt.
   Erst nach einem erfolgreichen Gesamtgraph-Write wird sie im Entwurf gewählt.
7. Anlage und Duplikation verändern weder eine bestehende Familie noch deren
   Nachkommen oder Elternreferenzen. In-place-Bearbeitung und Reparenting sind
   nicht Bestandteil des Prompt-13-Schritts.

Im Wizard sind entsperrte technische Felder RHF-gesteuerte lokale
Entwurfswerte. Das Draft-Mapping vergleicht sie mit der wirksamen
Base→Category-Vererbung und persistiert nur minimale, nicht redundante sowie
capability-relevante Asset-Level-Overrides. Die Lock-Schalter selbst werden nur beim expliziten
Anlegen oder Duplizieren einer echten Basisfamilie bearbeitet; sie sind keine
Asset-Overrides.

Die in der Parametertabelle genannte Prompt-Ausgabe bleibt Teil des
vollständigen Zielmodells. Sie ist kein Feld des aktuell implementierten
`BaseProfileValuesSchema` und wurde durch Prompt 13 nicht vorgezogen.

---

# 6. Kompatibilitäts- und Kategorisierungsmodell

## 6.1 Hierarchie

```text
Basisprofil
├── Kategorieprofil: Charakter / NPC
│   ├── Asset-Profil: Dorfbewohner
│   ├── Asset-Profil: Händler
│   └── Asset-Profil: Wache
├── Kategorieprofil: Textur / Holz
│   ├── Asset-Profil: helle Eichenplanken
│   └── Asset-Profil: verwittertes dunkles Holz
└── Kategorieprofil: Natur / Baum
    ├── Asset-Profil: Sommer-Laubbaum
    └── Asset-Profil: verschneiter Nadelbaum
```

## 6.2 Kompatibilitätsschlüssel

Ein deterministischer Schlüssel gruppiert technisch kompatible Profile, beispielsweise:

```text
pf2-compat-v1__modern-hd__tile-32__char-80__three-quarter-60__orthographic__outline-soft-selective__camera-south-to-north__style-both__palette-by-profile__nearest-neighbor-on__background-transparent__alpha-padding-8__light-adaptive__light-notes-44-6bbb7cc7c856862a
```

Für eine Textur ohne Figurenmaßstab wird der irrelevante Teil ausgelassen:

```text
pf2-compat-v1__modern-hd__tile-32__three-quarter-60__orthographic__outline-soft-selective__camera-south-to-north__style-both__palette-by-profile__nearest-neighbor-on__light-adaptive__light-notes-44-6bbb7cc7c856862a
```

Das Format ist versioniert, besitzt intern eine feste Serialisierungsreihenfolge
und wird nicht von der UI zerlegt. Für die Aufnahme von Dimensionen gelten:

- immer: Pixelstil, Stilprofil, Outline, Palette, Nearest-Neighbor und
  Lichtprofil;
- für nicht freie Kompositionen: Tilegröße, Perspektive, Kamerawinkel,
  Kamerarichtung und Projektion;
- Figurenhöhe ausschließlich bei `scaledCharacter`;
- Hintergrundmodus nur bei transparentfähigen Assets und Alpha-Rand nur bei
  tatsächlich transparentem Hintergrund.

Freie Artworks ignorieren Tile- und Weltkamerageometrie. Lichtnotizen werden
vor der Schlüsselbildung bezüglich Zeilenenden, Unicode und bedeutungslosem
Whitespace normalisiert und als kompakter FNV-1a-64-Fingerprint aufgenommen.
Dieser nicht-kryptografische Fingerprint dient nur der stabilen Gruppierung,
nicht der Sicherheit oder Datenintegrität.

`resolveProfile()` verarbeitet die Ebenen Base → Kategorie → Asset. Ein
abweichender Override auf einem gesperrten Basiswert bleibt wirkungslos und
wird als strukturierter Konflikt ausgegeben. Gleichwertige Overrides werden
als redundant, `characterHeight` bei nicht skalierten Kategorien als
irrelevant gemeldet und aus normalisierten Overrides entfernt. Kategorie-
Defaults werden mit definierten Asset-Antworten zusammengeführt; das Asset
gewinnt. Referenz- und Klassifikationsfehler liefern kein produktiv nutzbares
Profil.

## 6.3 Regeln für Profilkarten

Jede Profilkarte zeigt:

| Information | Beispiel |
|---|---|
| Name | Dorfschmied mit Lederschürze |
| Hauptkategorie | Charakter / NPC |
| Untertyp | Handwerker |
| Basisprofil | Weltassets 32 px / Figuren 80 px |
| Kerndaten | Modern-HD · 3/4 · 80 px · transparent |
| Bewegung | 8 Richtungen · Walk 5 Frames |
| Stil | Profil A und B |
| Tags | Dorf, Handwerk, Leder, Metall |
| Aktualisiert | Datum und Uhrzeit |
| Status | Favorit, Entwurf, vollständig, mit Warnung |

## 6.4 Filter

- Hauptkategorie
- Untertyp
- Basisprofil
- Kompatibilitätsschlüssel
- Tilegröße
- Figurenhöhe
- Pixelstil
- Perspektive
- Stilprofil
- Richtungsanzahl
- Animationsart
- Material
- Setting
- Favoriten
- zuletzt geändert

---

# 7. Capability-System

Die Sichtbarkeit von Fragen wird nicht nur über die Kategorie, sondern über Fähigkeiten gesteuert.

## 7.1 Pflicht-Capabilities

| Capability | Bedeutung |
|---|---|
| `movable` | Motiv kann sich in der Spielwelt fortbewegen |
| `directional` | unterschiedliche Ansichten je Bewegungsrichtung sind nötig |
| `animated` | Motiv besitzt mehrere zeitliche Bewegungsphasen |
| `tileable` | Motiv soll nahtlos kachelbar sein |
| `gridBound` | Ausgabe ist an ein Tile-Raster gebunden |
| `transparent` | Ausgabe verwendet echten Alpha-Hintergrund |
| `scaledCharacter` | Figurenhöhe ist ein verbindlicher Maßstab |
| `footprint` | Breite und Tiefe in Tiles werden benötigt |
| `wearable` | Item wird an einer Figur getragen |
| `modular` | Ausgabe besteht aus kombinierbaren Bauteilen |
| `freeComposition` | klassische Sprite-/Tile-Regeln sind nicht zwingend |

## 7.2 Trennung von Bewegung, Richtung und Animation

| Beispiel | movable | directional | animated | Erklärung |
|---|---:|---:|---:|---|
| NPC mit Laufzyklus | ja | ja | ja | Richtungsset und mehrere Frames |
| schwebender Kristall, nur frontal | ja | nein | ja | animiert, aber keine Richtungsansichten nötig |
| rollender Karren | ja | ja | optional | Richtungen nötig, Radanimation optional |
| Baum im Wind | nein | nein | ja | statischer Standort, Umgebungsanimation |
| geschlossene Truhe | nein | nein | nein | statisches Einzelasset |
| Truhe beim Öffnen | nein | nein | ja | Animation ohne Fortbewegungsrichtung |
| Holztextur | nein | nein | nein | nahtloses Material |
| Wasser-Tile | nein | nein | ja | Tile-Animation, aber kein Richtungsset |

**Verbindliche Regel:** Vier oder acht Richtungen werden nur angeboten, wenn `directional = true`.

---

# 8. Abfragen pro Hauptkategorie

## 8.1 Charakter / Figur

### Untertypen

- Held
- NPC
- Händler
- Dorfbewohner
- Handwerker
- Wache
- Gelehrter
- religiöse Figur
- Gegner
- Boss
- Tier
- Kreatur

### Fragegruppen

| Gruppe | Felder | Beispiele / Optionen |
|---|---|---|
| Identität | Rollenbezeichnung, Untertyp, kurze Beschreibung | NPC, Händler, Waldhüter |
| Varianten | Anzahl Figurenvarianten | 1, 2, 3, 4, 5 |
| Alter | Alterswirkung | jung, erwachsen, älter, sehr alt |
| Körper | Größe relativ, Körperbau, Haltung | schmal, normal, kräftig, gebeugt |
| Kopf | Gesichtsform, Hautwirkung, Augenlesbarkeit | schlicht, markant, verdeckt |
| Haare | Länge, Form, Farbe, Bart | kurz, Zopf, lockig, Vollbart |
| Kopfbedeckung | Art und Zustand | keine, Hut, Kapuze, Kappe, Helm |
| Hals | Schal, Kragen, Tuch | kein, kurz, lang, verhüllt |
| Oberkörper | Kleidungsart und Schichten | Hemd, Tunika, Weste, Mantel, Rüstung |
| Unterkörper | Hose, Rock, Robe, Schürze | Material und Länge |
| Hände | Handschuhe, Werkzeughaltung | frei, Handschuhe, Werkzeug |
| Füße | Schuhe und Stiefel | schlicht, robust, gepanzert |
| Accessoires | Gürtel, Tasche, Schmuck, Anhänger | mehrere auswählbar |
| Rücken | Umhang, Rucksack, Köcher, kein Element | klar sichtbare Rückansicht beachten |
| Ausrüstung | Werkzeug, Stab, Buch, Laterne, sonstiges | frei beschreibbar |
| Palette | Haupt-, Neben- und Akzentfarben | profilgebunden oder lokal |
| Zustand | sauber, gebraucht, verwittert, beschädigt | mit Materialwirkung |
| Silhouette | Erkennungsmerkmal | Hut, Mantel, breiter Gürtel, Werkzeug |
| Ausdruck | neutral, freundlich, ernst, müde, geheimnisvoll | nicht porträthaft übertreiben |
| Pose | neutraler Stand oder Handlung | idle, gehen, arbeiten |
| Maßstab | Figurenhöhe | standardmäßig geerbte 80 px |
| Output | Einzelansicht, Modellblatt, Richtungsset, Animationsset | capability-abhängig |

### Implementierungsstand seit Prompt 14

- Der Fachschritt `characterDetails` folgt direkt auf die Basisprofilwahl und
  erscheint ausschließlich für `character`.
- Alle Detailfelder sind optionale, begrenzte Bestandteile des strikten
  additiven `CharacterAnswersSchema`. Die bestehende Kategorie-Union sowie
  Kategorie-, Assetprofil- und Draft-Verträge verwenden dasselbe Schema.
- NPC-Kontextfelder erscheinen nur für NPC-artige Untertypen. Humanoide
  Kleidungsfragen werden für `animal` und `creature` ausgeblendet.
- Die Figurenhöhe wird aus Base→Category→lokalem technischen Snapshot geerbt,
  mit Quelle und Lock read-only angezeigt und nicht in `answers` dupliziert.
- RHF-Rohzustand, Draft-Projektion, Autosave, Resume und Live-Zusammenfassung
  bilden die Character-Felder vollständig ab. Hydration und Resume schreiben
  nicht; Kategorie- oder Untertypwechsel bereinigen alte Character-Antworten,
  ein Basiswechsel erhält sie.
- Der Output-Wunsch aus der Katalogtabelle ist noch kein Feld dieses Schritts;
  Ausgabeauswahl, Promptmodule und Output Workspace folgen in späteren Phasen.

### Richtungs- und Animationsfragen

Diese Gruppe erscheint nur, wenn `directional` oder `animated` aktiv ist.

| Feld | Optionen / Regel |
|---|---|
| Richtungsanzahl | 4 oder 8; 8 nur für richtungsabhängig bewegliche Figuren |
| Richtungsreihenfolge | fest definierte Reihenfolge oder konfigurierbares Layout |
| Aktionen | Idle, Walk, Run, Attack, Use, Talk sowie kompatibel Interact, Hurt und Spezialaktion; mehrere auswählbar |
| Persistiertes Modell | eindeutige, kanonisch sortierte `animationActions: [{ action, frames }]` |
| Frames pro Aktion | 1 bis 8; Walk startet bei Neuauswahl mit 5 |
| Phasenlogik | Kontakt, Absenkung, Vorbeiführung, Anhebung |
| Loop | geschlossen / nicht geschlossen |
| Spiegelung | keine blinde Spiegelung; asymmetrische Details korrekt neu zeichnen |
| Ausrüstungskonsistenz | Seite, Hand, Tasche und Mantel in allen Ansichten logisch beibehalten |
| Baseline | identischer Fußanker in allen Frames |
| Höhenabweichung | höchstens definierte Pixelabweichung |
| Sheet-Layout | automatisch aus Richtungen × Frames berechnen |

Richtung und Animation bleiben getrennte Capabilities. Die Richtungswahl zeigt
4 oder 8 nur bei `directional`; die Aktionsauswahl erscheint nur bei
`animated`. Bestehende Schema-V2-Daten mit `animationAction` und
`framesPerDirection` bleiben lesbar und werden beim nächsten bewussten
Wizard-Schreibvorgang in das kanonische Aktionsmodell projiziert. Es findet
keine schreibende Migration beim bloßen Laden statt.

### NPC-spezifische Zusatzfelder

- Beruf sofort lesbar?
- soziale Rolle
- Wohlstandsstufe
- kulturelle Funktion innerhalb der eigenen Weltbeschreibung
- typische Tätigkeit
- Gesprächshaltung / Idle-Geste
- Alltagswerkzeug
- Soll es mehrere zusammengehörige NPC-Varianten geben?
- Müssen Vorder- und Rückseite spezielle Details zeigen?

---

## 8.2 Bewegliches Objekt

### Untertypen

- Karren / Wagen
- rollendes Objekt
- schwebendes Objekt
- gleitendes Objekt
- mechanische Konstruktion
- Boot / Plattform
- magisches Objekt
- nicht-humanoide bewegliche Einheit

### Abfragen

| Gruppe | Felder |
|---|---|
| Objektkern | Typ, Zweck, Grundform, kurze Beschreibung |
| Maßstab | Tile-Footprint je Achse 1–64, Höhe 16–2048 px, Anker |
| Bewegung | rollen, gleiten, schweben, laufen, kriechen, fliegen, rotieren |
| Richtungsbedarf | keiner, 4, 8; nur wenn Form richtungsabhängig ist |
| Animation | keine, Idle-Loop, Bewegung, Rotation, Interaktion, Öffnen/Schließen, Pulsieren |
| Frames | eindeutige Sequenzen mit jeweils 1–16 Frames; bei `directional` für alle Richtungen |
| Mechanik | Räder, Gelenke, Flügel, Schienen, magischer Antrieb |
| Material | Holz, Metall, Stoff, Stein, Magie, Mischmaterial |
| Zustand | neu, gebraucht, beschädigt, provisorisch |
| Licht | neutral, emissiv, warm, kühl, diffus |
| Schatten | keiner, Kontakt, bewegungsabhängige kleine Anpassung |
| Output | Einzelasset, Richtungsset, Animationssheet, Variantenpaket |

### Implementierungsstand seit Prompt 15

- `movingObjectDetails` folgt direkt auf die Basisprofilwahl und erscheint
  ausschließlich für die Hauptkategorie `movingObject`. Die Objektklasse wird
  konsistent aus dem Untertyp abgeleitet.
- `MovingObjectAnswersSchema` bildet Objektkern, Footprint, Höhe, Anker,
  Bewegung, Mechanik, Material, Zustand, Licht und Schatten strikt und
  additiv ab. Ein nur halb ausgefüllter Footprint wird abgewiesen.
- Die separate Animationsauswahl speichert eindeutige, kanonisch sortierte
  `animationSequences: [{ type, frames }]` mit 1–16 Frames pro Sequenz.
  Bereits gespeicherte `animationType`-/`framesPerDirection`-Werte bleiben
  beim Laden und Resume lesbar; die Hydration selbst schreibt nicht.
- Richtung wird weiterhin ausschließlich über `directional` eingeblendet.
  Der Karren kann daher 4 oder 8 Richtungen besitzen, während ein pulsierender
  `floatingCrystal` animiert, aber nicht automatisch richtungsabhängig ist.
- Wirksame Moving-Object-Antworten werden Base→Category→Asset aufgelöst und
  nur als nicht redundante lokale Werte projiziert. Ein Basiswechsel erhält
  sie, ein Klassifikationswechsel bereinigt sie.
- Beim ausdrücklichen Leeren eines geerbten Moving-Object-Defaults werden
  Kategorie-/Assetprovenienz gelöst und die verbleibenden Fach- und
  Technikwerte relativ zur Base materialisiert. Der gelöschte Wert kehrt
  dadurch beim Resume nicht zurück.
- Transiente Rohwerte, Dirty State, 300-ms-Autosave, sofortige
  Schritt-Persistenz und exaktes Resume gelten für Detail- und
  Animationsfelder. Live-Zusammenfassung und Dashboard zeigen Klasse,
  Bewegung, Standfläche, Anker, capability-gültige Richtungen, Sequenzen mit
  Frames, Material und Zustand.
- Die Output-Auswahl aus der Katalogtabelle, Prompt Engine und Output Workspace
  folgen in späteren Phasen.

---

## 8.3 Statisches Objekt

### Untertypen

- Möbel
- Behälter
- Fass / Kiste
- Brunnen
- Schild
- Säule
- Altar
- Dekoration
- Arbeitsgerät
- interaktives Objekt

### Abfragen

| Gruppe | Felder |
|---|---|
| Zweck | dekorativ, interaktiv, begehbar, blockierend |
| Form | Grundform, Proportion, Symmetrie |
| Standfläche | Breite und Tiefe in Tiles |
| Material | Haupt- und Nebenmaterial |
| Zustand | sauber, gebraucht, verwittert, beschädigt, überwuchert |
| Details | Beschläge, Seile, Griffe, Muster, Inhalt |
| Interaktion | keine, öffnen, kippen, leuchten, zerbrechen |
| Animation | optional; keine Richtungsansichten nötig |
| Schatten | kein oder kleiner Kontaktschatten |
| Output | Einzelasset, Varianten, modulares Set |

### Implementierungsstand seit Prompt 18

- `staticObjectDetails` folgt direkt auf die Basisprofilwahl und erscheint
  ausschließlich für `staticObject`. Die Objektklasse wird konsistent aus dem
  Untertyp abgeleitet; Möbel, Behälter, Fässer, Kisten, Truhen, Türen,
  Brunnen, Schilder, Säulen, Altäre, Dekorationen, Arbeitsgeräte und
  interaktive Objekte sind vollständig abgedeckt.
- `StaticObjectAnswersSchema` bildet Funktion, Beschreibung, Grundform,
  Proportion, Symmetrie, Haupt- und Nebenmaterial, Materialdetails, Zustand,
  Konstruktion, Inhalt, Interaktion, Schatten, vollständigen Footprint und
  Varianten strikt und additiv ab. Frühere Schema-V2-Werte bleiben ohne eager
  Defaults lesbar; eine vorhandene Objektklasse muss zum Untertyp passen.
- `tileSize` bleibt außerhalb von `StaticObjectAnswers` ein sperrbarer
  technischer Base→Category→Asset-Wert. `StaticWorldObjectEditor` zeigt ihn
  ebenso wie die Objektklasse read-only.
- Footprint-Breite und -Tiefe müssen gemeinsam gesetzt sein und liegen je bei
  1–64 Tiles. Varianten sind ganzzahlig von 1–12.
- Static-Object-Fachantworten werden Base→Category→Asset aufgelöst und nur als
  nicht redundante lokale Abweichungen gespeichert. Basiswechsel erhalten sie,
  Klassifikationswechsel entfernen sie; Explicit Clear löst Elternprovenienz
  und materialisiert die übrigen wirksamen Werte relativ zur Base.
- Transienter Rohzustand, Dirty State, 300-ms-Autosave, unmittelbare
  Schritt-Persistenz und exaktes Resume gelten für alle Static-Object-Felder.
  Initialisierung, Profil-Hydration und Resume schreiben nicht.
- Animation wird ausschließlich im separaten `animated`-Capability-Schritt
  erfasst. Nur entsprechend markierte Untertypen erhalten Öffnen, Leuchten,
  Zerbrechen oder eine individuelle Animation; kein Static-Object-Untertyp
  erhält eine 4/8-Richtungsfrage.
- Zusammenfassung und Dashboard zeigen nur kompakte tatsächlich konfigurierte
  Objektfakten. Prompt Engine, Review-/Output-Erzeugung und Ausgabeauswahl
  folgen in späteren Phasen.

---

## 8.4 Textur / Material

### Materialtypen

- Holz
- Stein
- Schnee
- Eis
- Erde
- Sand
- Gras
- Moos
- Metall
- Stoff
- Leder
- Ziegel
- Pflaster
- Lehm
- Keramik
- eigener Materialtyp

### Abfragen

| Gruppe | Felder |
|---|---|
| Material | Typ, Unterart, gewünschte Wirkung |
| Verwendung | Boden, Wand, Dach, Objektoberfläche, Kleidung, Dekor |
| Orientierung | horizontal, vertikal, radial, ungeordnet, Maserungsrichtung |
| Kachelbarkeit | nicht festgelegt / nahtlos ja / nahtlos nein |
| Tilegröße | zentraler technischer Wert; im Texture-Editor read-only |
| Struktur | fein, mittel, grob |
| Elemente | Planken, Fugen, Risse, Knoten, Körnung, Schichtung |
| Wiederholung | sichtbare Wiederholungsmuster vermeiden |
| Zustand | neu, poliert, rau, alt, nass, frostig, beschädigt, verschmutzt |
| Feuchtigkeit | trocken, feucht, nass, vereist |
| Farbe | Grundton, Variation, Akzent, Kontrast |
| Licht | neutral für wiederverwendbare Textur; optional definierte Weltlichtseite |
| Randregeln | nahtlos an allen Kanten, keine Randvignette |
| Output | Einzeltextur, Variantenreihe, Materialatlas, Tileset |

### Materialabhängige Zusatzfragen

| Material | zusätzliche Felder |
|---|---|
| Holz | Holzart, Maserung, Plankenbreite, Knoten, Schnittart, Lack, Alter |
| Schnee | Pulvertiefe, Kruste, Glitzern, Verwehung, saubere oder betretene Fläche |
| Stein | Gesteinsart, Fugen, Bruch, Porosität, Moos, Nässe |
| Metall | Metallart, Schmiedespuren, Rost, Politur, Kantenabrieb |
| Stoff | Webart, Faltenmaßstab, Dicke, Muster, Ausfransung |
| Gras | Halmlänge, Dichte, Trockenheit, Bodenanteil, Übergänge |

### Implementierungsstand seit Prompt 16

- `textureDetails` folgt direkt auf die Basisprofilwahl und erscheint
  ausschließlich für `texture`. Der Materialtyp wird aus dem Untertyp
  abgeleitet; Holz, Stein, Schnee, Eis, Erde, Sand, Gras, Moos, Metall, Stoff,
  Leder, Ziegel, Pflaster, Lehm, Keramik und eigenes Material sind vollständig
  im readonly Domain-Katalog enthalten.
- `TextureAnswersSchema` bildet Einsatz, Beschreibung, `seamless`, Struktur,
  Zustand, Oberflächenaufbau und -richtung, Feuchtigkeit, Vereisung, Licht und
  Zusatzdetails strikt und additiv ab. Bestehende Schema-V2-Werte bleiben ohne
  eager Defaults lesbar; ein vorhandener Materialtyp muss zum Untertyp passen.
- `tileSize` bleibt außerhalb von `TextureAnswers` ein sperrbarer technischer
  Base→Category→Asset-Wert. `TextureMaterialEditor` zeigt ihn ebenso wie den
  Materialtyp read-only und führt Änderungen weiterhin über den
  Basisprofil-Schritt.
- `seamless` ist dreiwertig: eine fehlende Entscheidung bleibt `undefined`,
  „ja“ wird `true`, und „nein“ bleibt als ausdrückliches `false` erhalten.
  Holz zeigt zusätzliche Produktionshinweise zu Art, Maserung, Planken,
  Knoten, Schnitt, Lack und Alter. Der generische `tileability`-Schritt wird
  für Texturen nicht zusätzlich angezeigt.
- Fachantworten werden Base→Category→Asset aufgelöst und nur als
  nicht redundante lokale Abweichungen gespeichert. Ein Basiswechsel erhält
  sie, ein Kategorie- oder Untertypwechsel entfernt sie. Explicit Clear löst
  Kategorie-/Assetprovenienz und materialisiert die übrigen wirksamen Fach-
  und Technikwerte relativ zur Base.
- Transienter Rohzustand, Dirty State, 300-ms-Autosave, unmittelbare
  Schritt-Persistenz und exaktes Resume gelten auch für Texture-Felder.
  Initialisierung, Profil-Hydration und Resume schreiben nicht.
- Zusammenfassung und Dashboard zeigen nur tatsächlich konfigurierte
  Material-, Kachel- und Oberflächenfakten. Figuren-, Kleidungs-, Bewegungs-
  und Richtungsfragen sind aus dem Texture-Flow ausgeschlossen.
- Prompt Engine, Review-/Output-Erzeugung und die Ausgabeauswahl folgen in
  späteren Phasen.

---

## 8.5 Natur / Pflanze / Baum

### Untertypen

- Laubbaum
- Nadelbaum
- verdorrter Baum
- magischer Baum
- Busch
- Grasbüschel
- Pilz
- Wurzel
- Baumstumpf
- Rankengewächs

### Abfragen

| Gruppe | Felder |
|---|---|
| Pflanzentyp | Haupt- und Unterart |
| Klimazone | gemäßigt, Gebirge, Schnee, Sumpf, trocken, düster, magisch |
| Jahreszeit | Frühling, Sommer, Herbst, Winter, zeitlos |
| Alter | jung, ausgewachsen, uralt, abgestorben |
| Gesamtsilhouette | breit, schmal, asymmetrisch, knorrig, aufrecht |
| Stamm | Dicke, Form, Verzweigung, Rinde, Hohlräume |
| Wurzeln | verborgen, sichtbar, ausladend, felsumgreifend |
| Krone | rund, hoch, gestuft, dicht, locker, beschädigt |
| Blatt-/Nadelmasse | Größe der Cluster, Dichte, Farbvariation |
| Zusatzbewuchs | Moos, Pilze, Ranken, Flechten |
| Wetterauflage | Schnee, Frost, Nässe, Staub |
| Standfläche | Breite und Tiefe in Tiles |
| Höhe | Weltmaßstab oder Pixelhöhe |
| Varianten | 1 bis mehrere verwandte Silhouetten |
| Animation | keine oder Wind-/Magie-Loop; kein Richtungsset |
| Output | Einzelasset, Variantenpaket, Naturset |

### Implementierungsstand seit Prompt 17

- `src/domain/nature/` veröffentlicht readonly Kataloge und Typen für
  Pflanzentyp, Klima, Saison, Alter, Silhouette, Stamm, Krone, Wurzeln, Moos,
  Pilze, Schnee, Ranken, Bodenanschluss und Animation.
  `NATURE_PLANT_TYPE_BY_SUBTYPE` und `getDefaultNaturePlantType()` bilden jeden
  Natur-Untertyp deterministisch auf Baum, Busch, Gras, Pilz, Wurzel,
  Baumstumpf oder Ranke ab.
- Die puren Guards `natureSubtypeHasTrunk()`, `natureSubtypeHasCrown()` und
  `natureSubtypeHasRoots()` steuern Schema und UI gemeinsam. Baumfamilien
  erhalten Stamm, Krone und Wurzeln; Büsche Krone und Wurzeln; Wurzel und
  Baumstumpf nur ihre passenden Gruppen. Anatomisch unpassende Felder werden
  nicht nur ausgeblendet, sondern an der Zod-Grenze abgewiesen.
- `NatureAnswersSchema` umfasst optional `plantType`, `species`,
  `subjectDescription`, `climate`, `season`, `age`, `silhouette`,
  `trunkThickness`, `trunkShape`, `trunkDetails`, `crownShape`,
  `crownDensity`, `foliageDetails`, `rootVisibility`, `rootDetails`,
  `mossCoverage`, `mushroomGrowth`, `snowCover`, `vineGrowth`, `footprint`,
  `grounding`, `variantCount`, `animationType` und `extraDetails`. Frühere
  Schema-V2-Naturwerte bleiben ohne eager Defaults lesbar; ein vorhandener
  Pflanzentyp muss zum Untertyp passen.
- `NatureTreeEditor` erscheint ausschließlich als eigener `natureDetails`-
  Schritt nach der Basisprofilwahl. Pflanzentyp und wirksame technische
  `tileSize` sind read-only. `tileSize` bleibt sperrbar/vererbbar und wird weder
  in `NatureAnswers` noch in einem parallelen Naturdatenmodell dupliziert.
- Footprint-Breite und -Tiefe müssen gemeinsam gesetzt sein und liegen je bei
  1–64 Tiles. Moos, Pilze, Schnee und Ranken sind eigenständige Fachwerte;
  Varianten sind auf 1–12 begrenzt.
- Nature-Fachantworten werden Base→Category→Asset aufgelöst und nur als
  nicht redundante lokale Abweichungen gespeichert. Ein Basiswechsel erhält
  sie, ein Klassifikationswechsel entfernt sie. Explicit Clear löst
  Kategorie-/Assetprovenienz und materialisiert die übrigen wirksamen Fach-
  und Technikwerte relativ zur Base.
- Transienter Rohzustand, Dirty State, 300-ms-Autosave, unmittelbare
  Schritt-Persistenz und exaktes Resume gelten auch für Nature-Felder. Mount,
  Profil-Hydration und Resume schreiben nicht.
- Wind-, Magie- oder benutzerdefinierte Animation wird ausschließlich im
  separaten `animated`-Capability-Schritt erfasst. Nature besitzt keine
  richtungsfähigen Untertypen; Richtungs-, Figuren- und Kleidungsfragen bleiben
  aus diesem Flow ausgeschlossen.
- Zusammenfassung und Dashboard zeigen aufgelösten Pflanzentyp, Art, Umgebung,
  relevante Anatomie, Bewuchs, Schnee, Standfläche, Bodenanschluss, Varianten
  und capability-gültige Animation. Prompt Engine, Review-/Output-Erzeugung
  und Ausgabeauswahl folgen erst in späteren Phasen.

---

## 8.6 Gebäude / Architektur

### Untertypen

- Wohnhaus
- Hütte
- Geschäft
- Werkstatt
- Gasthaus
- Turm
- Tor
- Tempel
- Ruine
- Befestigung
- Dungeon-Bauteil

### Abfragen

| Gruppe | Felder |
|---|---|
| Funktion | Nutzung und Bewohnerrolle |
| Größe | Footprint, Stockwerke, Gesamthöhe |
| Bauform | rechteckig, L-Form, rund, modular, asymmetrisch |
| Hauptmaterial | Holz, Stein, Lehm, Mischbau |
| Dach | Form, Neigung, Material, Zustand |
| Fassade | Balken, Putz, Steine, Stützen, Schilder |
| Türen | Anzahl, Typ, Position, offen/geschlossen |
| Fenster | Anzahl, Form, Lichtzustand |
| Zustand | gepflegt, genutzt, verwittert, beschädigt, verlassen, überwuchert |
| Umgebungskontext | Dorf, Stadt, Wald, Schnee, Sumpf, Ruine |
| Innenlicht | warm beleuchtet, dunkel, neutral, sichtbare Quellen |
| Modularität | komplettes Gebäude oder Bauteile |
| Kollisionslesbarkeit | begehbare und blockierende Bereiche klar |
| Output | freigestelltes Gebäude, Kartenbaustein, modularer Satz |

### Implementierungsstand seit Prompt 19

- `buildingDetails` folgt direkt auf die Basisprofilwahl und erscheint
  ausschließlich für `building`. Das vollständige
  `BUILDING_TYPE_BY_SUBTYPE`-Mapping ordnet Wohnhaus, Hütte, Geschäft,
  Werkstatt, Gasthaus, Turm, Tor, Tempel, Ruine, Befestigung und Dungeon-Modul
  deterministisch einem Gebäudetyp zu.
- `BuildingAnswersSchema` bildet Nutzung, Beschreibung, Bauform, Größe,
  Gebäudehöhe, Stockwerke, Haupt- und Nebenmaterial, Materialdetails, Dach,
  Fassade, Türen, Fenster, Zustand, Belegung, Umgebung, Mapping, Kollision,
  Modularität, lokales Licht, Toranimation und vollständigen Footprint strikt
  und additiv ab. Frühere Schema-V2-Werte bleiben ohne eager Defaults lesbar.
- `tileSize`, Perspektive, Kameraneigung und Projektion bleiben sperrbare
  technische Base→Category→Asset-Werte. `BuildingArchitectureEditor` zeigt
  sie zusammen mit dem abgeleiteten Gebäudetyp read-only; Figurenhöhe und
  Richtungsfelder gehören nicht zu `BuildingAnswers`.
- Footprint-Breite und -Tiefe müssen gemeinsam gesetzt sein und liegen je bei
  1–64 Tiles. Gebäudehöhe ist auf 16–8192 px, Stockwerke auf 1–20, Türen auf
  0–64 und Fenster auf 0–256 begrenzt.
- Modulare Ausgabe und `modularSet`-Mapping sind nur für Tor, Befestigung und
  Dungeon-Modul gültig. Alle anderen Untertypen bleiben vollständige
  Einzelbauwerke mit freistehendem, kartenintegriertem oder tile-ausgerichtetem
  Mapping.
- Building-Fachantworten werden Base→Category→Asset aufgelöst und nur als
  nicht redundante lokale Abweichungen gespeichert. Basiswechsel erhalten sie,
  Klassifikationswechsel entfernen sie; Explicit Clear löst Elternprovenienz
  und materialisiert die übrigen wirksamen Werte relativ zur Base.
- Transienter Rohzustand, Dirty State, 300-ms-Autosave, unmittelbare
  Schritt-Persistenz und exaktes Resume gelten für alle Building-Felder.
  Initialisierung, Profil-Hydration und Resume schreiben nicht.
- Nur das Tor erhält im separaten `animated`-Capability-Schritt Öffnen/
  Schließen oder eine individuelle Animation. Kein Building-Untertyp ist
  `directional`; Kamera, Weltlicht und Footprint bleiben über Animationsphasen
  konstant. Zusammenfassung und Dashboard zeigen kompakte tatsächliche
  Architekturfakten. Prompt Engine und Review-/Output-Erzeugung folgen später.

---

## 8.7 Tileset / Kartenelement

### Untertypen

- Bodentile
- Wandtile
- Dachteil
- Übergang
- Ecke
- Kante
- Autotile
- Dekal
- animiertes Tile

### Abfragen

| Gruppe | Felder |
|---|---|
| Tiletyp | Boden, Wand, Dach, Übergang, Dekor |
| Raster | Tilegröße und Pixelmaßstab |
| Verbindungen | Kanten, Ecken, Innen-/Außenecken |
| Nachbarschaften | welche Materialien grenzen aneinander |
| Kachelbarkeit | horizontal, vertikal, in alle Richtungen |
| Varianten | saubere Wiederholung, beschädigte Variante, Dekalvariante |
| Kollisionsfunktion | begehbar, blockierend, Übergang |
| Licht | neutral oder weltgebunden |
| Animation | optional, Frames und Loop |
| Atlaslayout | automatisch berechnete Zeilen/Spalten |
| Output | einzelnes Tile, Miniset, vollständiges Tileset |

### Implementierungsstand seit Prompt 20

- `tilesetDetails` folgt direkt auf die Basisprofilwahl und erscheint
  ausschließlich für `tileset`. Das vollständige
  `TILESET_TYPE_BY_SUBTYPE`-Mapping ordnet Boden-, Wand-, Dach-, Übergangs-,
  Ecken-, Kanten-, Autotile-, Dekal- und animierte Untertypen deterministisch
  einem Tiletyp zu.
- `TilesetAnswersSchema` bildet Einsatz, Beschreibung, Kanten, Ecken,
  Übergangsmodus, Materialgrenze, Seam-Regeln, Kachelachsen, Wiederholungsart,
  Variantenarten und Atlasparameter strikt und additiv ab. Frühere
  Schema-V2-Werte bleiben ohne eager Defaults lesbar.
- Kanten-, Ecken- und Übergangsfelder sind nur für die passenden Untertypen
  gültig. Variantenanzahl liegt bei 1–64, Atlas-Slotzahl bei 1–256,
  Spaltenzahl bei 1–64 sowie Zwischenraum und Außenrand bei 0–64 px. Feste
  Spalten erfordern das passende Layout; nicht wiederholende Sets verwenden
  keine kachelbare Achse.
- `tileSize` und Pixelmaßstab bleiben sperrbare technische
  Base→Category→Asset-Werte. `TilesetEditor` zeigt sie zusammen mit dem
  abgeleiteten Tiletyp read-only und dupliziert sie nicht in
  `TilesetAnswers`. Die pure Atlaslogik berechnet Raster, Kapazität,
  Leerplätze und Canvasgröße für UI und technische Zusammenfassung.
- Tileset-Fachantworten werden Base→Category→Asset aufgelöst und nur als nicht
  redundante lokale Abweichungen gespeichert. Basiswechsel erhalten sie,
  Klassifikationswechsel entfernen sie; Explicit Clear löst
  Elternprovenienz. Rohzustand, Dirty State, 300-ms-Autosave, unmittelbare
  Schritt-Persistenz und exaktes Resume gelten für alle Tileset-Felder.
- Der Fachschritt besitzt Seam-, Achsen- und Wiederholungsregeln selbst und
  ersetzt daher die generische Kachelbarkeitsstufe. Alte Drafts an dieser
  Stufe werden in-memory auf `tilesetDetails` umgeleitet. Nur `animatedTile`
  erhält einen separaten Animationsschritt; kein Tileset ist `directional`.
  Prompt Engine und Review-/Output-Erzeugung folgen später.

---

## 8.8 Item / Ausrüstung

### Untertypen

- Werkzeug
- Kleidung
- Rüstungsteil
- Tasche
- Schmuck
- Verbrauchsgegenstand
- Schlüsselobjekt
- Questobjekt
- Sammelobjekt

### Abfragen

| Gruppe | Felder |
|---|---|
| Funktion | praktisch, dekorativ, tragbar, benutzbar |
| Größe | Icongröße, Weltasset oder Charakterausrüstung |
| Material | Haupt- und Nebenmaterial |
| Form | Silhouette und Erkennungsmerkmal |
| Zustand | neu, benutzt, alt, beschädigt, magisch verändert |
| Trageposition | Kopf, Hals, Hand, Körper, Rücken, Gürtel |
| Perspektive | Weltperspektive oder Iconansicht |
| Leuchteffekt | keiner oder kontrolliert |
| Varianten | Qualitätsstufen, Zustände, Farbvarianten |
| Output | Einzelitem, Iconset, Ausrüstungsansicht |

---

## 8.9 Artwork / Konzeptbild

### Untertypen

- Charakterkonzept
- Umgebungskonzept
- Gebäudeentwurf
- Materialstudie
- Szene
- Promo-Artwork
- Stimmungsbild

### Abfragen

| Gruppe | Felder |
|---|---|
| Zweck | Konzept, Präsentation, Produktionsreferenz |
| Motiv | Figur, Objekt, Umgebung, Szene |
| Komposition | Einzelmotiv, Gruppe, Vorder-/Mittel-/Hintergrund |
| Format | quadratisch, Hochformat, Querformat, frei |
| Hintergrund | transparent, einfach, vollständig ausgearbeitet |
| Kamerafreiheit | globales Profil übernehmen oder bewusst abweichen |
| Fokus | Form, Material, Stimmung, Geschichte, Maßstab |
| Lichtdramaturgie | neutral, warm, düster, Nacht, benutzerdefiniert |
| Detailgrad | Übersicht, Produktionskonzept, Showcase |
| Beschriftung | standardmäßig keine eingebrannte Schrift |
| Output | Einzelbild oder Varianten |

---

# 9. Setting- und Lichtkatalog

## 9.1 Settings

- Außenbereich
- Innenraum
- Dorf
- Stadt
- Wald
- Düsterwald
- Gebirge
- Schneegebiet
- Sumpf
- Wüste / Trockengebiet
- Höhle
- Dungeon
- Ruine
- magischer Ort
- neutraler Studiokontext für Freisteller

## 9.2 Lichtlogik

| Situation | Standardregel |
|---|---|
| Außen am Tag | neutrales Tageslicht |
| Außen in düsterer Stimmung | gedämpftes diffuses Licht |
| Außen bei Nacht | neutrales bis leicht kühles Nachtlicht |
| beleuchtetes Gebäude | warmes lokales Licht |
| dunkler Innenraum bei Nacht | neutrales niedrigintensives Restlicht |
| sichtbare warme Lichtquelle | begrenzte warme Akzente |
| wiederverwendbare Materialtextur | möglichst neutrales, gleichmäßiges Licht |
| emissives Objekt | kontrollierter Eigenglanz ohne Verlust der Pixelstruktur |

Die Lichtseite bleibt innerhalb eines zusammengehörigen Sets konstant.

---

# 10. Ausgabearten

| Ausgabeart | geeignete Kategorien | technische Fragen |
|---|---|---|
| Einzelasset | fast alle | Canvas, Rand, Anker, Transparenz |
| Variantenpaket | Figuren, Objekte, Natur, Materialien | Anzahl, gemeinsame Regeln |
| 4-Richtungsset | richtungsabhängig bewegliche Assets | Reihenfolge, Frame, Layout |
| 8-Richtungsset | richtungsabhängig bewegliche Assets | acht Ansichten, feste Kamera |
| Animationsset | animierbare Assets | Aktionen, Frames, Loop, Timing-Hinweis |
| Richtungs-Animationssheet | bewegliche und animierte Assets | Richtungen × Frames, automatische Canvasberechnung |
| nahtlose Textur | Materialien | Tilegröße, Kanten, Wiederholung |
| Tileset / Atlas | Texturen und Kartenelemente | Varianten, Ecken, Übergänge, Layout |
| Modellblatt | Figuren, Gebäude, Objekte | mehrere Ansichten ohne Gameplay-Animation |
| Artwork | Konzept / Promo | Format, Komposition, Hintergrund |

---

# 11. Prompt-Ausgabe

Jedes fertige Profil erzeugt weiterhin:

1. **Hauptprompt**
2. **Negativprompt**
3. **Technische Spezifikation**
4. **Komplette kombinierte Ausgabe**

## 11.1 Modulreihenfolge

```text
Basisprofil
→ Stilprofil
→ Kategorie und Capability
→ Motivbeschreibung
→ kategoriespezifische Details
→ Material und Zustand
→ Setting und Licht
→ Bewegung / Richtung / Animation, falls relevant
→ Ausgabe und Layout
→ Qualitätsregeln
```

## 11.2 Negative Regeln nach Kategorie

| Kategorie | zusätzliche Ausschlüsse |
|---|---|
| Charakter | inkonsistente Proportionen, fehlende Richtung, unlogische Kleidung, wechselnde Ausrüstung |
| Bewegliches Objekt | wechselnder Anker, falsche Orientierung, inkonsistente Mechanik |
| Textur | sichtbare Nähte, Randvignette, perspektivische Fläche, harte Lichtflecken |
| Baum / Natur | abgeschnittene Krone, unlesbare Silhouette, falscher Fußpunkt |
| Gebäude | wechselnder Kamerawinkel, unlogische Fassade, verzerrter Footprint |
| Tileset | nicht passende Kanten, sichtbare Wiederholung, falsches Raster |
| Artwork | unerwünschte Schrift, Wasserzeichen, unklare Hauptkomposition |

---

# 12. Empfohlenes V2-Datenmodell

## 12.1 Basisprofil

```json
{
  "schemaVersion": 2,
  "id": "base_world_32_80",
  "kind": "baseProfile",
  "name": "Weltassets 32 px / Figuren 80 px",
  "iconId": "world-grid",
  "values": {
    "pixelDensity": "modernHd",
    "styleProfile": "both",
    "tileSize": 32,
    "characterHeight": 80,
    "perspectiveType": "threeQuarter",
    "cameraAngle": 60,
    "cameraDirection": "southToNorth",
    "projectionType": "orthographic",
    "outlineStyle": "softSelective",
    "paletteMode": "byProfile",
    "backgroundMode": "transparent",
    "alphaPadding": 8,
    "nearestNeighbor": true,
    "lightingDefaults": {
      "policy": "adaptive",
      "notes": "Keep the world-space light direction stable."
    }
  },
  "locks": {
    "pixelDensity": true,
    "styleProfile": true,
    "tileSize": true,
    "characterHeight": true,
    "perspectiveType": true,
    "cameraAngle": true,
    "projectionType": true,
    "outlineStyle": true
  },
  "createdAt": "2026-09-02T12:00:00.000Z",
  "updatedAt": "2026-09-02T12:00:00.000Z"
}
```

`pixelDensity` ist der kanonische V2-Feldname für die Pixelart-Auflösung.

## 12.2 Kategorieprofil

```json
{
  "schemaVersion": 2,
  "kind": "categoryProfile",
  "id": "category_npc_80",
  "name": "NPCs 80 px",
  "baseProfileId": "base_world_32_80",
  "category": "character",
  "subtype": "npc",
  "iconId": "character-npc",
  "capabilities": {
    "movable": true,
    "directional": true,
    "animated": true,
    "scaledCharacter": true,
    "transparent": true
  },
  "overrides": {},
  "defaults": {
    "role": "villager",
    "directionCount": 8,
    "animationActions": [
      { "action": "idle", "frames": 4 },
      { "action": "walk", "frames": 5 }
    ]
  },
  "tags": ["npc", "80px"],
  "createdAt": "2026-09-02T12:00:00.000Z",
  "updatedAt": "2026-09-02T12:00:00.000Z"
}
```

## 12.3 Asset-Profil

```json
{
  "schemaVersion": 2,
  "id": "asset_npc_blacksmith_001",
  "kind": "assetProfile",
  "name": "Dorfschmied mit Lederschürze",
  "baseProfileId": "base_world_32_80",
  "compatibilityKey": "pf2-compat-v1__modern-hd__tile-32__char-80__three-quarter-60__orthographic__outline-soft-selective__camera-south-to-north__style-both__palette-by-profile__nearest-neighbor-on__background-transparent__alpha-padding-8__light-adaptive__light-notes-44-6bbb7cc7c856862a",
  "category": "character",
  "subtype": "npc",
  "iconId": "character-npc",
  "badgeIconIds": ["profession-craft", "material-leather"],
  "capabilities": {
    "movable": true,
    "directional": true,
    "animated": true,
    "scaledCharacter": true,
    "transparent": true
  },
  "overrides": {},
  "answers": {
    "role": "blacksmith",
    "hat": "none",
    "scarf": "short",
    "outerwear": "leather-apron",
    "directionCount": 8,
    "animationActions": [
      { "action": "idle", "frames": 4 },
      { "action": "walk", "frames": 5 },
      { "action": "use", "frames": 4 }
    ]
  },
  "tags": ["npc", "village", "craft", "leather", "80px"],
  "favorite": false,
  "createdAt": "2026-09-02T12:00:00.000Z",
  "updatedAt": "2026-09-02T12:00:00.000Z"
}
```

Der gespeicherte `compatibilityKey` ist ein abgeleiteter Snapshot.
`resolveProfile()` berechnet ihn deterministisch neu; Importdaten dürfen ihn
nicht als vertrauenswürdige Quelle vorgeben. Fehlende Capability-Felder werden beim
Parsen mit `false` materialisiert und der vollständige Snapshot anschließend
gegen Kategorie und Untertyp geprüft.

Die Beispiele verwenden das seit Prompt 14 kanonische Aktionsmodell. Bereits
gespeicherte Schema-V2-Daten mit einem einzelnen `animationAction` und
`framesPerDirection` bleiben parse- und resume-fähig; neue Wizard-Projektionen
schreiben diese Legacy-Felder nicht mehr.

Für Moving Objects gilt seit Prompt 15 derselbe additive Kompatibilitätsweg
mit eigenem Modell: Neue Daten speichern eindeutige, in Domain-Reihenfolge
sortierte `animationSequences: [{ type, frames }]` mit 1–16 Frames. Bereits
gespeicherte `animationType`-/`framesPerDirection`-Paare bleiben lesbar. Bei
einer Ebene gewinnt die kanonische Liste; eine explizite Repräsentation auf
Asset-Ebene ersetzt die geerbte Category-Repräsentation als zusammengehörigen
Animationswert.

Für Texturen erweitert Prompt 16 den strikten Schema-V2-Vertrag additiv um
`materialType`, `surface`, `moisture`, `icing` und `lighting`; die bisherigen
Felder `usage`, `seamless`, `orientation`, `structure`, `condition`,
`subjectDescription` und `extraDetails` bleiben unverändert lesbar. Fehlende
Werte werden beim Laden nicht ergänzt. Ein gespeicherter Materialtyp muss zum
Texture-Untertyp passen. `tileSize` bleibt ausschließlich im technischen
Profilwert-/Override-Modell und wird nicht in Texture-Antworten dupliziert.

Für Naturassets erweitert Prompt 17 den strikten Schema-V2-Vertrag additiv um
`plantType`, `species`, `silhouette`, Stamm-, Kronen- und Wurzelfelder, Moos,
Pilze, Schnee, Ranken, `grounding` und `variantCount`. Die bisherigen Felder
`subjectDescription`, `climate`, `season`, `age`, `animationType`, `footprint`
und `extraDetails` bleiben ohne materialisierte Defaults lesbar. Ein
gespeicherter Pflanzentyp muss zur vollständigen Untertypabbildung passen;
anatomisch irrelevante Felder werden abgewiesen. `tileSize` bleibt
ausschließlich im technischen Profilwert-/Override-Modell, Richtungs- und
Figurenfelder bleiben vollständig außerhalb von `NatureAnswers`.

Für statische Weltobjekte erweitert Prompt 18 den strikten Schema-V2-Vertrag
additiv um `objectClass`, `basicShape`, `proportion`, `symmetry`,
`primaryMaterial`, `secondaryMaterial`, `materialDetails`, `condition`,
`detailElements`, `contents`, `shadowMode` und `variantCount`. Die bisherigen
Felder `subjectDescription`, `extraDetails`, `purpose`, `interaction`,
`animationType` und `footprint` bleiben ohne materialisierte Defaults lesbar.
Eine gespeicherte Objektklasse muss zur vollständigen Untertypabbildung passen;
`tileSize`, Figurenmaßstab und Richtungsdaten bleiben vollständig außerhalb
von `StaticObjectAnswers`.

Für Gebäude erweitert Prompt 19 den strikten Schema-V2-Vertrag additiv um
`buildingType`, `planShape`, `size`, `heightPixels`, Material-, Dach-,
Fassaden-, Tür-, Fenster-, Belegungs-, Umgebungs-, Mapping-, Kollisions-,
Licht- und Animationswerte. Die bisherigen Felder `subjectDescription`,
`extraDetails`, `purpose`, `floors`, `condition`, `modular` und `footprint`
bleiben ohne materialisierte Defaults lesbar. Ein vorhandener Gebäudetyp muss
zum vollständigen Untertyp-Mapping passen; modulare Ausgabe und
`modularSet`-Mapping sind nur für capability-gültige Untertypen zulässig.
Tilegröße, Perspektive, Kamera, Projektion, Figurenhöhe und Richtungsdaten
bleiben vollständig außerhalb von `BuildingAnswers`.

Für Tilesets erweitert Prompt 20 den strikten Schema-V2-Vertrag additiv um
`tilesetType`, Kanten-, Ecken-, Übergangs-, Materialgrenzen-, Seam-,
Wiederholungs-, Variantenarten- und Atlaswerte. Die bisherigen Felder
`subjectDescription`, `extraDetails`, `tileUsage`, `tileableAxes`,
`variantCount` und `animationType` bleiben ohne materialisierte Defaults
lesbar. Ein vorhandener Tiletyp muss zum vollständigen Untertyp-Mapping passen;
Verbindungsfelder und Atlas-Spalten werden cross-field validiert. Tilegröße,
Pixelmaßstab, Figurenhöhe und Richtungsdaten bleiben vollständig außerhalb von
`TilesetAnswers`.

## 12.4 Wizard-Draft

```json
{
  "schemaVersion": 2,
  "kind": "wizardDraft",
  "route": "wizard/editor",
  "draftId": "draft_001",
  "projectName": "Dorfschmied",
  "currentStep": "characterDetails",
  "baseProfileId": "base_world_32_80",
  "sourceAssetProfileId": "asset_npc_blacksmith_001",
  "overrides": {},
  "category": "character",
  "subtype": "npc",
  "answers": {
    "role": "blacksmith",
    "bodyBuild": "sturdy",
    "silhouette": "broad apron and smithing hammer",
    "directionCount": 8,
    "animationActions": [
      { "action": "walk", "frames": 5 },
      { "action": "use", "frames": 4 }
    ]
  },
  "validation": {
    "errors": [],
    "warnings": []
  },
  "savedAt": "2026-09-02T12:00:00.000Z"
}
```

Drafts der frühen Routen `wizard/project` und `wizard/category` dürfen
Basisprofil, Kategorie, Untertyp und Antworten noch auslassen. Ab
`wizard/profile` ist die Kategorieauswahl vorhanden; `wizard/editor` und
`wizard/review` verlangen zusätzlich ein Basisprofil und einen Projektnamen.
Der deklarative Core-Flow setzt `baseProfile` zwischen die Klassifikation und
die kategoriespezifischen beziehungsweise capability-gesteuerten Schritte.
Für Figuren folgt `characterDetails` direkt danach. Ein exaktes Resume eines
klassifizierten Pre-Base-Drafts landet wieder beim Basisprofil und schreibt bei
der Hydration nicht; auch Character-Resume bleibt schreibfrei.
Für Moving Objects folgt stattdessen `movingObjectDetails`; seine Fachfelder
und die getrennte Sequenz-/Frame-Auswahl gehören ebenfalls zum rohen
Session-Snapshot, Autosave und exakten schreibfreien Resume.
Für Texturen folgt `textureDetails`; seine Fachfelder einschließlich der
dreiwertigen `seamless`-Entscheidung gehören ebenfalls zu Rohzustand, Autosave
und schreibfreiem Resume. Der zentrale technische `tileSize` wird aus der
Profilkette aufgelöst und nicht als Fachantwort gespeichert.
Für Naturassets folgt `natureDetails`; alle Fachfelder, die beiden gemeinsam
erforderlichen Footprint-Achsen und 1–12 Varianten gehören zu Rohzustand,
Autosave und exaktem schreibfreien Resume. Der Pflanzentyp wird aus dem
Untertyp abgeleitet, die technische `tileSize` aus der Profilkette aufgelöst.
Eine optionale Wind-/Magieanimation bleibt im folgenden Capability-Schritt und
erzeugt kein Richtungsset.
Für statische Weltobjekte folgt `staticObjectDetails`; alle Fachfelder, die
beiden gemeinsam erforderlichen Footprint-Achsen und 1–12 Varianten gehören zu
Rohzustand, Autosave und exaktem schreibfreien Resume. Die Objektklasse wird
aus dem Untertyp und die technische `tileSize` aus der Profilkette aufgelöst.
Eine optionale Animation bleibt im folgenden Capability-Schritt und erzeugt
kein Richtungsset.
Für Gebäude folgt `buildingDetails`; alle Fachfelder und die beiden gemeinsam
erforderlichen Footprint-Achsen gehören zu Rohzustand, Autosave und exaktem
schreibfreien Resume. Gebäudetyp und wirksame Weltgeometrie werden aus
Untertyp beziehungsweise Profilkette aufgelöst. Modulare Optionen sind
capability-gesteuert; eine Toranimation bleibt im folgenden separaten Schritt
und erzeugt kein Richtungsset.
Für Tilesets folgt `tilesetDetails`; alle Verbindungs-, Seam-, Wiederholungs-,
Varianten- und Atlasfelder gehören zu Rohzustand, Autosave und exaktem
schreibfreien Resume. Tiletyp und technische Gridwerte werden aus Untertyp
beziehungsweise Profilkette aufgelöst. Die generische `tileability`-Stufe wird
nicht zusätzlich gerendert; alte Drafts an dieser Position werden schreibfrei
auf den Fachschritt umgeleitet. Eine optionale Tileanimation bleibt separat und
erzeugt kein Richtungsset.
Aus einem Assetprofil erzeugte Drafts dürfen dessen ID als optionale Provenienz
und seine Asset-Level-Overrides als validierten Snapshot mitführen. Der
Override-Snapshot verhindert Informationsverlust beim Autosave; die optionale
Quell-ID ist keine harte Exportreferenz, damit ein Draft portabel bleibt.
Beim Resume wird der Snapshot erneut gegen die aktuellen Basis-/Kategorie-
Referenzen und Locks aufgelöst. Ein Konflikt öffnet Recovery und überschreibt
den gespeicherten Draft nicht; ein gelöschtes Quell-Asset allein ist dagegen
kein Fehler. Schema-ungültige laufende Formwerte sind reiner Sessionzustand und
werden nie in dieses persistierte Modell geschrieben.

Ein bestätigter Wechsel der Basisfamilie behält Kategorie, Untertyp und
Assetantworten, entfernt aber technische Overrides sowie nicht mehr passende
Kategorieprofil- und Assetprovenienz. Der Wechsel mutiert oder reparentet keine
persistierten Profile. Entsperrte Änderungen innerhalb derselben Familie
werden beim nächsten gültigen Draft-Snapshot erneut auf minimale Overrides
normalisiert.

Das ausdrückliche Leeren eines vom Kategorieprofil geerbten Character-,
Moving-Object-, Static-Object-, Texture-, Nature-, Building- oder Tileset-Feldes löst
Kategorie- und Assetprovenienz. Alle anderen wirksamen Fachantworten und
technischen Werte werden relativ zur Base materialisiert, damit der entfernte
Default nach Autosave und Resume nicht erneut erscheint.

---

# 13. Speicherbereiche

Empfohlene lokale Schlüssel:

```text
pixelforge:v2:settings
pixelforge:v2:draft
pixelforge:v2:base-profiles
pixelforge:v2:category-profiles
pixelforge:v2:asset-profiles
pixelforge:v2:migration-backup
```

Der sichtbare Markenname darf später geändert werden; die Speicher-Schlüssel
sollten danach aus Stabilitätsgründen nicht umbenannt werden. Die Profilbereiche
verwenden versionierte Collection-Envelopes. UI-Code greift ausschließlich über
den zentralen Storage-Adapter zu; Profilbereiche werden als validierter
Gesamtgraph geschrieben. Auch das Anlegen oder Duplizieren eines Basisprofils
verwendet genau diese gemeinsame Mutationsgrenze. Scheitert dieser Graph-Write,
bleiben der vorherige Bibliotheksgraph und die bisherige Draft-Basis-ID
unverändert. Scheitert erst der danach angestoßene Draft-Autosave, bleibt die
erfolgreich angelegte Familie bestehen und die Sitzung kennzeichnet ihre
Auswahl sichtbar als ungesichert.

---

# 14. V1-Migration

1. V1-Autosave und V1-Presets erkennen.
2. Beide vorhandenen Rohstrings vor dem Parsen unverändert in einem
   `prepared`-Migrationsbackup speichern.
3. Aus den bisherigen globalen Feldern ein Standard-Basisprofil erzeugen.
4. `assetType` in V2-Hauptkategorie und Untertyp übersetzen.
5. Capabilities ausschließlich aus V2-Kategorie und -Untertyp ableiten;
   `outputMode` verändert keine Capability.
6. Acht Richtungen nur übernehmen, wenn das Asset richtungsabhängig beweglich ist.
7. Den normalisierten Ursprungszustand, Quelle, Fingerprint und Hinweise als
   JSON-validiertes `legacyData` sichern, aber nie in neue Prompts einmischen.
8. Konvertierte Profile mit `migratedFromVersion: 1` markieren.
9. Erst nach validierten Profilwrites das Backup auf `completed` setzen.
10. `prepared` deterministisch wiederaufnehmen; `completed` bei späteren
    Startläufen als autoritativen No-op behandeln.

Explizite V1-Assetzuordnung:

| V1 `assetType` | V2 Kategorie / Untertyp |
|---|---|
| `hero`, `npc`, `enemy`, `boss`, `creature` | `character` / gleichnamiger Untertyp |
| `building` | `building/house` (generischer Fallback mit Hinweis) |
| `interiorObject` | `staticObject/furniture` (Fallback mit Hinweis) |
| `outdoorObject` | `staticObject/decoration` (Fallback mit Hinweis) |
| `plant` | `nature/bush` (Fallback mit Hinweis) |
| `tree` | `nature/tree` |
| `rock` | `staticObject/decoration` (Fallback mit Hinweis) |
| `ruin` | `building/ruin` |
| `weapon` | `item/weapon` |
| `armor` | `item/armorPiece` |
| `consumable` | `item/consumable` |
| `questItem` | `item/questItem` |
| `groundTile` | `tileset/groundTile` |
| `wallElement` | `tileset/wallTile` |

Die Fallbacks raten keine zusätzlichen Materialien, Zwecke oder
Darstellungsformen. Nicht exakt abbildbare Werte bleiben im `legacyData` und
erzeugen einen sichtbaren Migrationshinweis. V1-Kamera-Constraint-Flags werden
nicht als V2-Vererbungslocks umgedeutet.

---

# 15. Verbindliche Standardkonfiguration

| Bereich | V2-Standard |
|---|---|
| Perspektive | frontale 3/4-RPG-Draufsicht |
| Projektion | orthografisch |
| Kamera | Süden nach Norden, ungefähr 60° |
| Pixelstil | Modern-HD |
| Tile-Raster | 32 × 32 px |
| Figurenhöhe | ca. 80 px |
| Hintergrund | transparent |
| Richtungen | nur bei richtungsabhängig beweglichen Assets; dann standardmäßig 8 |
| Outline | weich und selektiv |
| Stilprofile | A klassische Fantasy und B düstere Fantasy |
| Licht | kontextabhängige Lichtlogik |
| Ausgaben | Hauptprompt, Negativprompt, technische Spezifikation, kombiniert |
