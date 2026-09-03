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
    title: "Pixelart-Produktion beginnt mit der richtigen Asset-Art.",
    eyebrow: "Produktionszentrale",
    description:
      "Dein Einstieg in Profile, geführte Asset-Erstellung und konsistente Prompt-Pakete.",
    nextStep: "Wähle eine Kategorie oder setze ein vorhandenes Profil fort."
  },
  profiles: {
    label: "Profile",
    title: "Produktionsprofile sicher organisieren.",
    eyebrow: "Profilbibliothek",
    description:
      "Assetprofile erhalten hier eine kategorisierte, verlässliche Arbeitsfläche auf ihrer gültigen Profilkette.",
    nextStep: "Suche, Filter, Compatibility-Gruppen und Profilaktionen sind aktiv."
  },
  wizard: {
    label: "Wizard",
    title: "Neue Assets geführt aufsetzen.",
    eyebrow: "Geführter Abfragekatalog",
    description:
      "Die wiederaufnehmbare Wizard Engine validiert jeden Schritt und sichert gültige Änderungen lokal.",
    nextStep: "Kategorie- und Capability-Routing folgt in der nächsten Phase."
  },
  review: {
    label: "Prüfung",
    title: "Konfigurationen sicher prüfen.",
    eyebrow: "Review",
    description:
      "Geerbte Werte, eigene Angaben, Locks und Konflikte werden vor der Ausgabe nachvollziehbar zusammengeführt.",
    nextStep: "Zusammenfassung und Konfliktprüfung sind mit dem aktiven Wizard-Entwurf verbunden."
  },
  output: {
    label: "Ausgabe",
    title: "Prompt-Pakete produktionsbereit ausgeben.",
    eyebrow: "Output Workspace",
    description:
      "Hauptprompt, Negativprompt, technische Spezifikation und kombinierte Ausgabe bekommen hier ihren festen Platz.",
    nextStep: "Sprach- und Stilpakete lassen sich kopieren, als TXT oder zusammen mit dem Profil als JSON exportieren."
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
