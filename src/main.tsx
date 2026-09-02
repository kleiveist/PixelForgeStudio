import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { BRAND } from "./config";
import { createBrowserV2StorageAdapter } from "./services";
import "./styles/tokens.css";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(`${BRAND.shortName} konnte das Root-Element nicht finden.`);
}

const storageAdapter = createBrowserV2StorageAdapter();

createRoot(rootElement).render(
  <StrictMode>
    <App storageAdapter={storageAdapter} />
  </StrictMode>
);
