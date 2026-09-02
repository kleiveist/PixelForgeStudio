import { ForgeMarkIcon } from "../../components/icons/ForgeMarkIcon";
import { Badge, Surface } from "../../components/ui";
import { BRAND } from "../../config";
import styles from "./DashboardView.module.css";

const shellFoundations = [
  {
    label: "Ansichten",
    value: "6 klare Arbeitsbereiche",
    note: "Dashboard, Profile, Wizard, Prüfung, Ausgabe und Einstellungen."
  },
  {
    label: "Navigation",
    value: "Browser-Verlauf inklusive",
    note: "Zurück und Vorwärts führen zuverlässig durch die zuletzt geöffneten Ansichten."
  },
  {
    label: "Arbeitsweise",
    value: "Lokal · modular · fokussiert",
    note: "Globale Navigation und Feature-Inhalte bleiben sauber voneinander getrennt."
  }
] as const;

export function DashboardView() {
  return (
    <div className={styles.dashboard}>
      <Surface
        as="section"
        className={styles.hero}
        tone="raised"
        aria-labelledby="dashboard-view-title"
      >
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>App Shell · Phase 08</p>
          <h1 id="dashboard-view-title">
            Ein Studio, das sich deiner Arbeitsumgebung anpasst.
          </h1>
          <p className={styles.intro}>
            {BRAND.tagline}. Sechs feste Arbeitsbereiche und eine echte
            Browser-Historie bilden jetzt den Rahmen für die nächsten
            Produktfunktionen.
          </p>

          <Badge className={styles.statusBadge} tone="success" role="status">
            <span className={styles.statusDot} aria-hidden="true" />
            App Shell bereit
          </Badge>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <span className={styles.pixel} />
          <span className={styles.pixel} />
          <span className={styles.pixel} />
          <span className={styles.pixel} />
          <ForgeMarkIcon />
          <span className={styles.visualLabel}>PF · {BRAND.versionLabel}</span>
        </div>
      </Surface>

      <Surface
        as="section"
        className={styles.foundation}
        tone="soft"
        aria-labelledby="shell-foundation-title"
      >
        <div className={styles.foundationIntro}>
          <p className={styles.eyebrow}>Studio-Rahmen</p>
          <h2 id="shell-foundation-title">
            Bereit für fokussierte Feature-Arbeitsflächen
          </h2>
          <p>
            Die Shell bleibt beim Ansichtswechsel bestehen. Theme, globale
            Aktionen und Navigation sind damit überall direkt erreichbar.
          </p>
        </div>

        <dl className={styles.foundationGrid}>
          {shellFoundations.map((item) => (
            <div className={styles.foundationItem} key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
              <dd className={styles.foundationNote}>{item.note}</dd>
            </div>
          ))}
        </dl>
      </Surface>
    </div>
  );
}
