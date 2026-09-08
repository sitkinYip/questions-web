import { uiCopy } from "@/config/ui-copy";
import { Toast } from "radix-ui";
import type { ReactNode } from "react";

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider
      label={uiCopy.toastProvider.label}
      swipeDirection="up"
      duration={8_000}
    >
      {children}
      <Toast.Viewport
        className="ui-toast-viewport"
        hotkey={["altKey", "KeyT"]}
        label={uiCopy.toastProvider.shortcutLabel}
      />
    </Toast.Provider>
  );
}
