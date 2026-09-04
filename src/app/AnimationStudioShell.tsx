import { StudioLink } from "../components/navigation";
import { Surface } from "../components/ui";
import {
  ANIMATION_STUDIO_VIEW_IDS,
  type AnimationStudioRoute,
  type AnimationStudioView
} from "../domain/navigation";
import shellStyles from "./AppShell.module.css";
import styles from "./StudioPlaceholderViews.module.css";
import { ANIMATION_STUDIO_VIEW_DEFINITIONS } from "./studioViewConfig";

function routeForAnimationView(
  view: AnimationStudioView,
  activeRoute: AnimationStudioRoute
): AnimationStudioRoute {
  if (activeRoute.view === view) return activeRoute;
  return view === "workspace"
    ? { studio: "animation", view: "workspace" }
    : { studio: "animation", view };
}

export function AnimationStudioNavigation({
  route
}: Readonly<{ route: AnimationStudioRoute }>) {
  return (
    <div className={shellStyles.navigationRow} data-module-navigation="animation">
      <nav
        className={shellStyles.primaryNavigation}
        aria-label="Animation Studio"
      >
        <ul className={shellStyles.navigationList}>
          {ANIMATION_STUDIO_VIEW_IDS.map((view) => (
            <li key={view}>
              <StudioLink
                className={shellStyles.navigationLink}
                indicateCurrent
                route={routeForAnimationView(view, route)}
              >
                {ANIMATION_STUDIO_VIEW_DEFINITIONS[view].label}
              </StudioLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function AnimationStudioShell({
  route
}: Readonly<{ route: AnimationStudioRoute }>) {
  const definition = ANIMATION_STUDIO_VIEW_DEFINITIONS[route.view];
  const projectSelected =
    route.view === "workspace" && route.projectId !== undefined;
  const title = projectSelected
    ? "Animationsworkspace wird vorbereitet."
    : definition.title;

  return (
    <section
      className={styles.view}
      aria-labelledby={`animation-${route.view}-view-title`}
      data-animation-view={route.view}
      data-studio-view="animation"
    >
      <p className={styles.eyebrow}>{definition.eyebrow}</p>
      <h1 id={`animation-${route.view}-view-title`}>{title}</h1>
      <p className={styles.description}>{definition.description}</p>
      <Surface
        as="section"
        className={styles.placeholder}
        tone="soft"
        role="note"
      >
        <h2>{projectSelected ? "Projekt erkannt" : "Noch keine Projektdaten"}</h2>
        <p>{definition.nextStep}</p>
        {projectSelected ? (
          <p>
            Die validierte Projekt-ID ist in der Route vorhanden. Projektladen
            und Bearbeitung werden erst mit der Animationsprojekt-Domain aktiv.
          </p>
        ) : null}
      </Surface>
    </section>
  );
}
