import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { BRAND } from "./config";
import {
  createBrowserNavigationAdapter,
  createBrowserV2StorageAdapter
} from "./services";
import "./styles/tokens.css";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(`${BRAND.shortName} konnte das Root-Element nicht finden.`);
}

const storageAdapter = createBrowserV2StorageAdapter();
const navigationAdapter = createBrowserNavigationAdapter();

createRoot(rootElement).render(
  <StrictMode>
    <App
      navigationAdapter={navigationAdapter}
      storageAdapter={storageAdapter}
    />
  </StrictMode>
);
