import {
  STUDIO_MODULE_DEFINITIONS,
  STUDIO_MODULE_IDS,
  routeForStudioModule
} from "../../config";
import { useNavigation } from "../../store/navigation";
import { StudioLink } from "./StudioLink";
import styles from "./StudioSwitcher.module.css";

export function StudioSwitcher() {
  const { activeRoute } = useNavigation();

  return (
    <nav className={styles.switcher} aria-label="Studio auswählen">
      <ul className={styles.list}>
        {STUDIO_MODULE_IDS.map((moduleId) => {
          const definition = STUDIO_MODULE_DEFINITIONS[moduleId];
          return (
            <li key={moduleId}>
              <StudioLink
                className={styles.link}
                indicateCurrent
                route={routeForStudioModule(moduleId, activeRoute)}
              >
                {definition.shortLabel}
              </StudioLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
