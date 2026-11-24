import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/design/tokens.css";
import "@/design/components.css";
import "@/design/motion-prompt.css";
import "./design-preview.css";
import { DesignPreviewApp } from "./DesignPreviewApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DesignPreviewApp />
  </StrictMode>,
);
