import { Badge, Surface } from "../../components/ui";
import type { AppView } from "../../domain/navigation";
import styles from "./PlaceholderView.module.css";

interface PlaceholderViewDefinition {
  readonly label: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly nextStep: string;
}

export interface PlaceholderViewProps {
  readonly definition: PlaceholderViewDefinition;
  readonly view: Exclude<AppView, "dashboard">;
}

export function PlaceholderView({ definition, view }: PlaceholderViewProps) {
  return (
    <Surface
      as="section"
      className={styles.placeholder}
      tone="raised"
      aria-labelledby={`${view}-view-title`}
    >
      <div className={styles.copy}>
        <Badge tone="accent">Arbeitsbereich</Badge>
        <p className={styles.eyebrow}>{definition.eyebrow}</p>
        <h1 id={`${view}-view-title`}>{definition.title}</h1>
        <p className={styles.description}>{definition.description}</p>
      </div>

      <Surface className={styles.handoff} tone="soft" role="note">
        <span className={styles.marker} aria-hidden="true">
          {definition.label.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <strong>Ansicht vorbereitet</strong>
          <p>{definition.nextStep}</p>
        </div>
      </Surface>
    </Surface>
  );
}
