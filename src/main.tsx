import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { App } from "@/app/App.tsx";
import { installDevViewportScaleRecovery } from "@/shared/layout/devViewportRecovery";

if (import.meta.env.DEV) {
  installDevViewportScaleRecovery();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
