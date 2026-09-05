import { StudioLink } from "../../components/navigation";
import { Badge, Surface } from "../../components/ui";
import { BUILT_IN_RIG_TEMPLATES } from "../../domain/animation";
import { createRigTemplateLibraryItem } from "./rigTemplateLibraryData";
import styles from "./RigTemplateLibraryView.module.css";

const rigTemplates = Object.freeze(
  BUILT_IN_RIG_TEMPLATES.map(createRigTemplateLibraryItem)
);

export function RigTemplateLibraryView() {
  return (
    <div className={styles.view}>
      <p className={styles.eyebrow}>Rig-Bibliothek</p>
      <h1 id="animation-rigs-view-title">Produktionsreife Rig-Vorlagen.</h1>
      <p className={styles.description}>
        Die eingebauten Vorlagen sind versionierte, schreibgeschützte
        Produktionsverträge. Projekte speichern ihre Vorlagen-ID und bleiben
        dadurch reproduzierbar.
      </p>

      <section className={styles.catalog} aria-labelledby="rig-catalog-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Installierter Katalog</p>
            <h2 id="rig-catalog-title">{rigTemplates.length} Vorlage</h2>
          </div>
          <Badge tone="success">Validiert</Badge>
        </div>

        {rigTemplates.map((template) => (
          <Surface
            as="section"
            aria-labelledby={`rig-template-${template.id}-title`}
            className={styles.card}
            key={template.id}
            tone="raised"
          >
            <header className={styles.cardHeader}>
              <div>
                <p className={styles.templateId}>{template.id}</p>
                <h3 id={`rig-template-${template.id}-title`}>{template.label}</h3>
              </div>
              <Badge tone="accent">Production V1</Badge>
            </header>

            <dl className={styles.metrics}>
              <div>
                <dt>Frame</dt>
                <dd>{template.frameLabel}</dd>
              </div>
              <div>
                <dt>Figurenhöhe</dt>
                <dd>{template.characterHeightLabel}</dd>
              </div>
              <div>
                <dt>Fußanker X / Y</dt>
                <dd>{template.footAnchorLabel}</dd>
              </div>
              <div>
                <dt>Richtungen zur Laufzeit</dt>
                <dd>{template.runtimeDirectionCount}</dd>
              </div>
              <div>
                <dt>Gelenke / Bones</dt>
                <dd>{template.jointCount} / {template.boneCount}</dd>
              </div>
              <div>
                <dt>Pflichtslot-Bindungen</dt>
                <dd>{template.requiredSlotCount}</dd>
              </div>
            </dl>

            <details className={styles.details}>
              <summary>Quellrichtungen und Kompatibilität</summary>
              <p>
                Fünf authored Richtungen: {template.authoredDirections.join(", ")}.
                Nordwest, West und Südwest entstehen ausschließlich nach den
                geprüften Spiegelregeln.
              </p>
              <p className={styles.compatibilityKey}>
                <span>Compatibility Key</span>
                <code>{template.compatibilityKey}</code>
              </p>
            </details>

            <div className={styles.actions}>
              <StudioLink
                className={styles.action}
                route={{ studio: "animation", view: "projects" }}
              >
                Animationsprojekt anlegen
              </StudioLink>
              <p>Neue Projekte verwenden diese Vorlage standardmäßig.</p>
            </div>
          </Surface>
        ))}
      </section>
    </div>
  );
}
