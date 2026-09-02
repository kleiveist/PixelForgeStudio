const option = (value, label) => ({ value, label });

export const FORM_SECTIONS = [
  {
    id: "project",
    title: "01 · Projekt und Ausgabe",
    description: "Grunddaten, Prompt-Sprache und getrennte Stilprofile.",
    open: true,
    fields: [
      {
        key: "projectName",
        label: "Projektname",
        type: "text",
        width: "half",
        placeholder: "z. B. EtherFood"
      },
      {
        key: "promptLanguage",
        label: "Prompt-Sprache",
        type: "select",
        width: "half",
        options: [
          option("en", "Englisch"),
          option("de", "Deutsch"),
          option("both", "Deutsch und Englisch")
        ],
        help: "Englisch ist für viele Bildmodelle die stabilste Standardsprache."
      },
      {
        key: "profileOutputMode",
        label: "Stilprofile erzeugen",
        type: "select",
        width: "half",
        options: [
          option("both", "Profil A und B getrennt"),
          option("selected", "Nur ausgewähltes Profil")
        ]
      },
      {
        key: "selectedProfile",
        label: "Einzelnes Stilprofil",
        type: "select",
        width: "half",
        options: [
          option("classic", "A · Klassische Fantasy"),
          option("dark", "B · Düstere Fantasy")
        ],
        help: "Wird verwendet, wenn nur ein Profil erzeugt werden soll."
      }
    ]
  },
  {
    id: "style",
    title: "02 · Pixelart-Stil",
    description: "Moderne Detailtiefe bei klarer, absichtlich pixelbasierter Darstellung.",
    open: true,
    fields: [
      {
        key: "pixelDensity",
        label: "Pixelart-Auflösung",
        type: "select",
        width: "half",
        options: [
          option("classicHd", "A · Klassisch-HD"),
          option("modernHd", "B · Modern-HD"),
          option("ultraHd", "C · Ultra-detailliert")
        ]
      },
      {
        key: "styleBalance",
        label: "Detailcharakter",
        type: "select",
        width: "half",
        options: [
          option("retro", "Stärker retro und reduziert"),
          option("balanced", "Atmosphärisch, detailliert und klar"),
          option("modern", "Stärker modern und materialreich")
        ]
      },
      {
        key: "outlineStyle",
        label: "Konturen",
        type: "select",
        width: "half",
        options: [
          option("dark", "A · Klare dunkle Outline"),
          option("softSelective", "B · Weiche selektive Outline"),
          option("minimal", "C · Kaum Outline")
        ]
      },
      {
        key: "paletteMode",
        label: "Farbcharakter",
        type: "select",
        width: "half",
        options: [
          option("natural", "A · Natürlich und leicht gedämpft"),
          option("vivid", "B · Kräftig und lebendig"),
          option("desaturated", "C · Düster und entsättigt"),
          option("byProfile", "D · Je Stilprofil getrennt")
        ]
      },
      {
        key: "colorBudget",
        label: "Farb-Budget je Asset",
        type: "select",
        width: "half",
        options: [
          option("adaptive", "Automatisch"),
          option("32", "Bis ca. 32 Farben"),
          option("48", "Bis ca. 48 Farben"),
          option("64", "Bis ca. 64 Farben"),
          option("96", "Bis ca. 96 Farben"),
          option("unlimited", "Keine feste Grenze")
        ],
        help: "Eine Begrenzung unterstützt konsistente Farbgruppen, ist aber keine harte technische Pflicht."
      }
    ]
  },
  {
    id: "asset",
    title: "03 · Asset und Motiv",
    description: "Was erzeugt wird und wie das Ergebnis strukturiert sein soll.",
    open: true,
    fields: [
      {
        key: "assetType",
        label: "Asset-Typ",
        type: "select",
        width: "half",
        options: [
          option("hero", "Held"),
          option("npc", "NPC"),
          option("enemy", "Gegner"),
          option("boss", "Boss"),
          option("creature", "Kreatur oder Tier"),
          option("building", "Gebäude"),
          option("interiorObject", "Innenraumobjekt"),
          option("outdoorObject", "Außenobjekt"),
          option("plant", "Pflanze"),
          option("tree", "Baum"),
          option("rock", "Felsen"),
          option("ruin", "Ruine"),
          option("weapon", "Waffe"),
          option("armor", "Rüstung"),
          option("consumable", "Verbrauchsgegenstand"),
          option("questItem", "Quest- oder Schatzobjekt"),
          option("groundTile", "Boden-Tile"),
          option("wallElement", "Wand- oder Architekturelement")
        ]
      },
      {
        key: "outputMode",
        label: "Ausgabeform",
        type: "select",
        width: "half",
        options: [
          option("single", "Einzelnes freigestelltes Asset"),
          option("directional4", "Richtungsset · 4 Richtungen"),
          option("directional8", "Richtungsset · 8 Richtungen"),
          option("assetSet", "Zusammengehöriges Asset-Set"),
          option("spriteSheet", "Sprite-Sheet"),
          option("tileset", "Tileset"),
          option("concept", "Konzept- oder Referenzbild")
        ]
      },
      {
        key: "assetFacing",
        label: "Blickrichtung bei Einzelasset",
        type: "select",
        width: "half",
        options: [
          option("south", "Süd · vorne"),
          option("southwest", "Südwest · vorne-links"),
          option("west", "West · links"),
          option("northwest", "Nordwest · hinten-links"),
          option("north", "Nord · hinten"),
          option("northeast", "Nordost · hinten-rechts"),
          option("east", "Ost · rechts"),
          option("southeast", "Südost · vorne-rechts")
        ]
      },
      {
        key: "condition",
        label: "Zustand",
        type: "select",
        width: "half",
        options: [
          option("new", "Neu"),
          option("maintained", "Gepflegt"),
          option("used", "Gebraucht"),
          option("weathered", "Verwittert"),
          option("damaged", "Beschädigt"),
          option("overgrown", "Überwuchert"),
          option("repaired", "Repariert"),
          option("abandoned", "Verlassen"),
          option("magical", "Magisch verändert")
        ]
      },
      {
        key: "subjectDescription",
        label: "Genaue Motivbeschreibung",
        type: "textarea",
        width: "full",
        rows: 5,
        placeholder: "Form, Kleidung, Bauweise, Funktion, Silhouette und wichtige Merkmale …"
      },
      {
        key: "materials",
        label: "Materialien und Oberflächen",
        type: "textarea",
        width: "full",
        rows: 3
      },
      {
        key: "extraDetails",
        label: "Zusätzliche Details",
        type: "textarea",
        width: "full",
        rows: 4
      }
    ]
  },
  {
    id: "scale",
    title: "04 · Raster, Maßstab und Sprite-Aufbau",
    description: "Feste Maße verbessern die Wiederholbarkeit zwischen allen Assets.",
    open: true,
    fields: [
      {
        key: "tileSize",
        label: "Tile-Größe in Pixel",
        type: "number",
        width: "third",
        min: 8,
        max: 256,
        step: 1
      },
      {
        key: "characterHeight",
        label: "Figurenhöhe in Pixel",
        type: "number",
        width: "third",
        min: 16,
        max: 512,
        step: 1,
        help: "Standard: 80 px vom Fußpunkt bis zum höchsten Körperpunkt."
      },
      {
        key: "frameSize",
        label: "Frame-Größe",
        type: "select",
        width: "third",
        options: [
          option("auto", "Automatisch"),
          option("96", "96 × 96 px"),
          option("128", "128 × 128 px"),
          option("160", "160 × 160 px"),
          option("192", "192 × 192 px"),
          option("256", "256 × 256 px")
        ]
      },
      {
        key: "footprintWidthTiles",
        label: "Standfläche · Breite in Tiles",
        type: "number",
        width: "third",
        min: 1,
        max: 32,
        step: 1
      },
      {
        key: "footprintDepthTiles",
        label: "Standfläche · Tiefe in Tiles",
        type: "number",
        width: "third",
        min: 1,
        max: 32,
        step: 1
      },
      {
        key: "sheetLayout",
        label: "Sheet-Anordnung",
        type: "select",
        width: "third",
        options: [
          option("auto", "Automatisch"),
          option("4x2", "4 Spalten × 2 Reihen"),
          option("8x1", "8 Spalten × 1 Reihe"),
          option("2x4", "2 Spalten × 4 Reihen"),
          option("4x1", "4 Spalten × 1 Reihe"),
          option("2x2", "2 Spalten × 2 Reihen")
        ]
      }
    ]
  },
  {
    id: "camera",
    title: "05 · Perspektive und Kamerasperre",
    description: "Der Kamerawinkel bleibt zwischen Assets unverändert; für Richtungen dreht sich nur das Motiv.",
    open: true,
    fields: [
      {
        key: "perspectiveType",
        label: "Grundperspektive",
        type: "select",
        width: "half",
        options: [
          option("topdown", "A · Klassisches Top-down"),
          option("threeQuarter", "B · Frontale 3/4-RPG-Draufsicht"),
          option("isometric", "C · Isometrisch"),
          option("side", "D · Seitenansicht")
        ]
      },
      {
        key: "cameraAngle",
        label: "Abwärtsneigung von der Horizontalen",
        type: "select",
        width: "half",
        options: [
          option("30", "A · Flach · ca. 30°"),
          option("45", "B · Ausgewogen · ca. 45°"),
          option("60", "C · Steil · ca. 60°")
        ]
      },
      {
        key: "cameraDirection",
        label: "Kameraausrichtung",
        type: "select",
        width: "half",
        options: [
          option("southToNorth", "Frontal · Süden nach Norden"),
          option("swToNe", "Diagonal · Südwest nach Nordost"),
          option("seToNw", "Diagonal · Südost nach Nordwest")
        ]
      },
      {
        key: "projectionType",
        label: "Projektion",
        type: "select",
        width: "half",
        options: [
          option("orthographic", "Orthografisch"),
          option("mildPerspective", "Leichte Perspektive")
        ]
      },
      {
        key: "lockAxes",
        label: "Weltachsen bildschirmparallel halten",
        type: "checkbox",
        width: "half"
      },
      {
        key: "noPerspectiveScale",
        label: "Keine Verkleinerung mit Entfernung",
        type: "checkbox",
        width: "half"
      },
      {
        key: "noIsometricAxes",
        label: "Isometrische Achsen ausdrücklich ausschließen",
        type: "checkbox",
        width: "half"
      },
      {
        key: "cameraNeverRotates",
        label: "Kamera nie drehen; nur das Motiv drehen",
        type: "checkbox",
        width: "half"
      }
    ]
  },
  {
    id: "lighting",
    title: "06 · Setting, Tageszeit und Licht",
    description: "Adaptive Regeln unterscheiden Außenbereiche, Gebäude, Nacht und düstere Stimmungen.",
    open: false,
    fields: [
      {
        key: "environment",
        label: "Umgebung",
        type: "select",
        width: "half",
        options: [
          option("outdoor", "Außenbereich"),
          option("indoor", "Innenraum"),
          option("forest", "Wald"),
          option("village", "Dorf"),
          option("town", "Stadt"),
          option("ruinArea", "Ruinengebiet"),
          option("dungeon", "Dungeon"),
          option("cave", "Höhle"),
          option("mountain", "Gebirge"),
          option("snow", "Schneegebiet"),
          option("swamp", "Sumpf"),
          option("desert", "Wüste"),
          option("magicArea", "Magischer Ort")
        ]
      },
      {
        key: "timeOfDay",
        label: "Tageszeit / Raumzustand",
        type: "select",
        width: "half",
        options: [
          option("day", "Tag"),
          option("night", "Nacht"),
          option("dawn", "Morgendämmerung"),
          option("dusk", "Abenddämmerung"),
          option("interiorLit", "Beleuchteter Innenraum"),
          option("interiorDark", "Dunkler Innenraum"),
          option("notApplicable", "Nicht relevant")
        ]
      },
      {
        key: "lightingPolicy",
        label: "Lichtregel",
        type: "select",
        width: "half",
        options: [
          option("adaptive", "Automatisch nach Setting"),
          option("neutralDay", "1 · Neutrales Tageslicht"),
          option("warmInterior", "2 · Warmes Licht in Gebäuden"),
          option("gloomyDiffuse", "3 · Düsteres diffuses Licht"),
          option("neutralNight", "Neutrales Nachtlicht"),
          option("coolNight", "Leicht kühles Nachtlicht"),
          option("custom", "Eigene Lichtbeschreibung")
        ]
      },
      {
        key: "mood",
        label: "Stimmung",
        type: "select",
        width: "half",
        options: [
          option("neutral", "Neutral"),
          option("adventure", "Abenteuerlich"),
          option("cozy", "Warm und bewohnt"),
          option("ominous", "Unheilvoll"),
          option("melancholic", "Melancholisch"),
          option("magical", "Magisch"),
          option("hostile", "Feindselig")
        ]
      },
      {
        key: "lightingNotes",
        label: "Eigene Licht- und Stimmungsregeln",
        type: "textarea",
        width: "full",
        rows: 4
      }
    ]
  },
  {
    id: "output",
    title: "07 · Transparenz, Schatten und Export",
    description: "Regeln für freigestellte, direkt weiterverwendbare Spielgrafik.",
    open: false,
    fields: [
      {
        key: "backgroundMode",
        label: "Hintergrund",
        type: "select",
        width: "half",
        options: [
          option("transparent", "Transparent freigestellt"),
          option("scene", "Szenischer Hintergrund")
        ]
      },
      {
        key: "shadowMode",
        label: "Bodenschatten",
        type: "select",
        width: "half",
        options: [
          option("automatic", "C · Je Asset automatisch"),
          option("none", "A · Kein Bodenschatten"),
          option("contact", "B · Kleiner Kontaktschatten")
        ]
      },
      {
        key: "detailLevel",
        label: "Asset-Bedeutung",
        type: "select",
        width: "half",
        options: [
          option("normal", "Normales Spielasset"),
          option("important", "Wichtiges Spielasset"),
          option("heroic", "Hauptasset / Showcase")
        ]
      },
      {
        key: "anchorMode",
        label: "Ausrichtungsanker",
        type: "select",
        width: "half",
        options: [
          option("automatic", "Automatisch nach Asset-Typ"),
          option("bottomCenter", "Unten mittig / Fußpunkt"),
          option("footprintCenter", "Mitte der Standfläche"),
          option("canvasCenter", "Exakte Canvas-Mitte")
        ]
      },
      {
        key: "alphaPadding",
        label: "Transparenter Sicherheitsrand in Pixel",
        type: "number",
        width: "half",
        min: 0,
        max: 128,
        step: 1
      },
      {
        key: "nativeResolution",
        label: "Direkt in Zielauflösung zeichnen",
        type: "checkbox",
        width: "half"
      },
      {
        key: "nearestNeighbor",
        label: "Nur Nearest-Neighbor-Skalierung zulassen",
        type: "checkbox",
        width: "half"
      },
      {
        key: "pixelPerfectEdges",
        label: "Pixelgenaue Kanten ohne Anti-Aliasing",
        type: "checkbox",
        width: "half"
      }
    ]
  },
  {
    id: "quality",
    title: "08 · Qualitäts- und Schutzregeln",
    description: "Globale Regeln gegen unklare Formen, Stilabweichungen und direkte Markenbezüge.",
    open: false,
    fields: [
      {
        key: "gameReadable",
        label: "Spiellesbarkeit priorisieren",
        type: "checkbox",
        width: "half"
      },
      {
        key: "cleanSilhouette",
        label: "Klare Silhouette verlangen",
        type: "checkbox",
        width: "half"
      },
      {
        key: "preserveProportions",
        label: "Proportionen in allen Ansichten sperren",
        type: "checkbox",
        width: "half"
      },
      {
        key: "separateForms",
        label: "Formen und Materialien sauber trennen",
        type: "checkbox",
        width: "half"
      },
      {
        key: "noBrandRefs",
        label: "Keine Spiel-, Marken- oder Künstlernamen",
        type: "checkbox",
        width: "half"
      },
      {
        key: "productionReady",
        label: "Produktionsreife Ausgabe verlangen",
        type: "checkbox",
        width: "half"
      },
      {
        key: "avoidOverdetail",
        label: "Überladung und visuelles Rauschen vermeiden",
        type: "checkbox",
        width: "half"
      },
      {
        key: "customRules",
        label: "Weitere verbindliche Regeln",
        type: "textarea",
        width: "full",
        rows: 4
      }
    ]
  }
];
