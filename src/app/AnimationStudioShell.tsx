import { StudioLink } from "../components/navigation";
import { Surface } from "../components/ui";
import {
  ANIMATION_STUDIO_VIEW_IDS,
  type AnimationStudioRoute,
  type AnimationStudioView
} from "../domain/navigation";
import {
  AnimationProjectsView,
  AnimationWorkspaceLifecycleView
} from "../features/animation-projects";
import { CharacterKitLibraryView } from "../features/animation-kits";
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

  return (
    <section
      aria-labelledby={`animation-${route.view}-view-title`}
      data-animation-view={route.view}
      data-studio-view="animation"
    >
      {route.view === "projects" ? <AnimationProjectsView /> : null}
      {route.view === "workspace" ? (
        <AnimationWorkspaceLifecycleView
          {...(route.projectId ? { projectId: route.projectId } : {})}
        />
      ) : null}
      {route.view === "library" ? <CharacterKitLibraryView /> : null}
      {route.view === "rigs" ? (
        <div className={styles.view}>
          <p className={styles.eyebrow}>{definition.eyebrow}</p>
          <h1 id={`animation-${route.view}-view-title`}>{definition.title}</h1>
          <p className={styles.description}>{definition.description}</p>
          <Surface
            as="section"
            className={styles.placeholder}
            tone="soft"
            role="note"
          >
            <h2>Noch keine Projektdaten</h2>
            <p>{definition.nextStep}</p>
          </Surface>
        </div>
      ) : null}
    </section>
  );
}
