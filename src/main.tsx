import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/tokens.css";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("PixelForge konnte das Root-Element nicht finden.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
