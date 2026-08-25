import { Toast } from "radix-ui";
import type { ReactNode } from "react";

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider label="冒险通知" swipeDirection="up" duration={8_000}>
      {children}
      <Toast.Viewport
        className="ui-toast-viewport"
        hotkey={["altKey", "KeyT"]}
        label="冒险通知（Alt+T）"
      />
    </Toast.Provider>
  );
}
