import { Surface } from "../components/ui";
import { STUDIO_HOME_PLACEHOLDER } from "./studioViewConfig";
import styles from "./StudioPlaceholderViews.module.css";

export function StudioHomePlaceholder() {
  return (
    <section
      className={styles.view}
      aria-labelledby="studio-home-title"
      data-studio-view="home"
    >
      <p className={styles.eyebrow}>{STUDIO_HOME_PLACEHOLDER.eyebrow}</p>
      <h1 id="studio-home-title">{STUDIO_HOME_PLACEHOLDER.title}</h1>
      <p className={styles.description}>
        {STUDIO_HOME_PLACEHOLDER.description}
      </p>
      <Surface as="section" className={styles.placeholder} tone="soft">
        <h2>Welches Studio möchtest du öffnen?</h2>
        <p>{STUDIO_HOME_PLACEHOLDER.nextStep}</p>
        <p>
          Prompt Studio und Animation Studio sind über den globalen Umschalter
          erreichbar.
        </p>
      </Surface>
    </section>
  );
}
