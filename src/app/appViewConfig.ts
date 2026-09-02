import type { AppView } from "../domain/navigation";

export interface AppViewDefinition {
  readonly label: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly nextStep: string;
}

export const APP_VIEW_DEFINITIONS: Readonly<
  Record<AppView, AppViewDefinition>
> = {
  dashboard: {
    label: "Dashboard",
    title: "Ein Studio, das sich deiner Arbeitsumgebung anpasst.",
    eyebrow: "Produktionszentrale",
    description:
      "Dein Einstieg in Profile, geführte Asset-Erstellung und konsistente Prompt-Pakete.",
    nextStep: "Das kategoriebasierte Dashboard folgt in Phase 09."
  },
  profiles: {
    label: "Profile",
    title: "Profile zentral organisieren.",
    eyebrow: "Profilbibliothek",
    description:
      "Basis-, Kategorie- und Assetprofile erhalten hier eine gemeinsame, verlässliche Arbeitsfläche.",
    nextStep: "Suche, Filter und Profilaktionen folgen in der Profilbibliothek."
  },
  wizard: {
    label: "Wizard",
    title: "Neue Assets geführt aufsetzen.",
    eyebrow: "Geführter Abfragekatalog",
    description:
      "Der Wizard wird die Asset-Kategorie zuerst klären und danach ausschließlich relevante Fragen zeigen.",
    nextStep: "Schritte, Resume und Validierung folgen mit der Wizard Engine."
  },
  review: {
    label: "Prüfung",
    title: "Konfigurationen sicher prüfen.",
    eyebrow: "Review",
    description:
      "Geerbte Werte, eigene Angaben, Locks und Konflikte werden vor der Ausgabe nachvollziehbar zusammengeführt.",
    nextStep: "Die vollständige Zusammenfassung folgt mit dem Review Workspace."
  },
  output: {
    label: "Ausgabe",
    title: "Prompt-Pakete produktionsbereit ausgeben.",
    eyebrow: "Output Workspace",
    description:
      "Hauptprompt, Negativprompt, technische Spezifikation und kombinierte Ausgabe bekommen hier ihren festen Platz.",
    nextStep: "Prompt Engine und Exportaktionen folgen in den vorgesehenen Phasen."
  },
  settings: {
    label: "Einstellungen",
    title: "Das Studio passend konfigurieren.",
    eyebrow: "Einstellungen",
    description:
      "Darstellung und spätere globale Arbeitspräferenzen bleiben lokal und kontrollierbar.",
    nextStep: "Der Theme-Schalter ist bereits aktiv; weitere Optionen folgen bedarfsgerecht."
  }
};
