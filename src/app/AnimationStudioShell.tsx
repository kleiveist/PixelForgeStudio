import { StudioLink } from "../components/navigation";
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
import { RigTemplateLibraryView } from "../features/animation-rigs";
import shellStyles from "./AppShell.module.css";
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
      {route.view === "rigs" ? <RigTemplateLibraryView /> : null}
    </section>
  );
}
