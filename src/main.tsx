import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { BRAND } from "./config";
import {
  createBrowserNavigationAdapter,
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

createRoot(rootElement).render(
  <StrictMode>
    <App
      navigationAdapter={navigationAdapter}
      outputAdapter={outputAdapter}
      storageAdapter={storageAdapter}
      startupMigration={migration}
    />
  </StrictMode>
);
