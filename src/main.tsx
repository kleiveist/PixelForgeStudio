import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { BRAND } from "./config";
import {
  createBrowserNavigationAdapter,
  createBrowserAnimationRepository,
  createBrowserOutputWorkspaceAdapter,
  initializeBrowserWorkspaceStorage
} from "./services";
import "./styles/tokens.css";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(`${BRAND.shortName} konnte das Root-Element nicht finden.`);
}

const { storageAdapter, migration } = initializeBrowserWorkspaceStorage();
const navigationAdapter = createBrowserNavigationAdapter();
const outputAdapter = createBrowserOutputWorkspaceAdapter();

async function renderApplication(root: HTMLElement) {
  const animationRepositoryResult = await createBrowserAnimationRepository();

  createRoot(root).render(
    <StrictMode>
      <App
        navigationAdapter={navigationAdapter}
        outputAdapter={outputAdapter}
        storageAdapter={storageAdapter}
        startupMigration={migration}
        animationRepository={
          animationRepositoryResult.status === "ok"
            ? animationRepositoryResult.repository
            : null
        }
        {...(animationRepositoryResult.status === "unavailable"
          ? {
              animationRepositoryUnavailableMessage:
                animationRepositoryResult.message
            }
          : {})}
      />
    </StrictMode>
  );
}

void renderApplication(rootElement);
