import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { EditorPreview } from "./EditorPreview";

// Separate HTML entry: no GameGate, API queries or persistent providers.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EditorPreview />
  </StrictMode>,
);
