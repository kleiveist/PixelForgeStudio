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

## 4.3 Umgesetzter Einstieg bis Prompt 13

Der aktuell implementierte Core-Flow lautet:

```text
Projekt → Hauptkategorie/Untertyp → Basisprofil → Capability-Schritte
```

Ein klassifizierter Entwurf darf vor der Basiswahl auf `wizard/profile`
fortsetzbar bleiben. Erst eine in der aktuellen Bibliothek vorhandene oder dort
erfolgreich neu angelegte Basisfamilie öffnet die nachfolgenden Richtungs-,
Animations- oder Kachelbarkeitsfragen. Deren Sichtbarkeit stammt ausschließlich
aus `resolveCapabilities()`.

Der Basisprofil-Schritt zeigt für alle relevanten Produktionswerte den
wirksamen Wert, seine Quelle (Basisprofil, Kategorieprofil oder lokaler Entwurf)
und den Lock-Status. Figurenhöhe erscheint nur bei `scaledCharacter`, Raster-
und Weltkamerageometrie nicht bei `freeComposition` und der Alpha-Rand nur bei
transparentem Hintergrund. Profil-Hydration setzt den Formularzustand, ohne
beim Mount zu schreiben. Eine bewusste Auswahl oder andere programmatische
Mehrfeldänderung wird nach der vollständigen Übernahme einmal durch den
generischen Engine-Hook in Draft-Projektion, Dirty-Status und Autosave gegeben.

Prompt 14 ergänzt als nächste Phase den Character/NPC-Detail-Editor. Die
späteren Motiv-, Material-, Setting-, Review- und Output-Flächen der Tabelle
oben werden hierdurch noch nicht als fertig erklärt.

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

### Richtungs- und Animationsfragen

Diese Gruppe erscheint nur, wenn `directional` oder `animated` aktiv ist.

| Feld | Optionen / Regel |
|---|---|
| Richtungsanzahl | 4 oder 8; 8 nur für richtungsabhängig bewegliche Figuren |
| Richtungsreihenfolge | fest definierte Reihenfolge oder konfigurierbares Layout |
| Aktion | Idle, Walk, Run, Interact, Talk, Attack, Hurt, Spezialaktion |
| Frames pro Richtung | 1 bis 8; für Walk standardmäßig 4 oder 5 |
| Phasenlogik | Kontakt, Absenkung, Vorbeiführung, Anhebung |
| Loop | geschlossen / nicht geschlossen |
| Spiegelung | keine blinde Spiegelung; asymmetrische Details korrekt neu zeichnen |
| Ausrüstungskonsistenz | Seite, Hand, Tasche und Mantel in allen Ansichten logisch beibehalten |
| Baseline | identischer Fußanker in allen Frames |
| Höhenabweichung | höchstens definierte Pixelabweichung |
| Sheet-Layout | automatisch aus Richtungen × Frames berechnen |

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
| Maßstab | Tile-Footprint, Höhe, Anker |
| Bewegung | rollen, gleiten, schweben, laufen, kriechen, fliegen, rotieren |
| Richtungsbedarf | keiner, 4, 8; nur wenn Form richtungsabhängig ist |
| Animation | keine, Idle-Loop, Bewegung, Rotation, Interaktion, Öffnen/Schließen |
| Frames | Frames je Aktion und gegebenenfalls je Richtung |
| Mechanik | Räder, Gelenke, Flügel, Schienen, magischer Antrieb |
| Material | Holz, Metall, Stoff, Stein, Magie, Mischmaterial |
| Zustand | neu, gebraucht, beschädigt, provisorisch |
| Licht | neutral, emissiv, warm, kühl, diffus |
| Schatten | keiner, Kontakt, bewegungsabhängige kleine Anpassung |
| Output | Einzelasset, Richtungsset, Animationssheet, Variantenpaket |

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
| Kachelbarkeit | nahtlos ja/nein, ein Tile oder Testfläche |
| Tilegröße | geerbt oder lokal, sofern nicht gesperrt |
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
    "animationAction": "walk",
    "directionCount": 8,
    "framesPerDirection": 5
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
    "animationAction": "walk",
    "directionCount": 8,
    "framesPerDirection": 5
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

## 12.4 Wizard-Draft

```json
{
  "schemaVersion": 2,
  "kind": "wizardDraft",
  "route": "wizard/editor",
  "draftId": "draft_001",
  "projectName": "Dorfschmied",
  "currentStep": "character-motion",
  "baseProfileId": "base_world_32_80",
  "sourceAssetProfileId": "asset_npc_blacksmith_001",
  "overrides": {},
  "category": "character",
  "subtype": "npc",
  "answers": {},
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
die capability-gesteuerten Schritte. Ein exaktes Resume eines klassifizierten
Pre-Base-Drafts landet wieder dort und schreibt bei der Hydration nicht.
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
