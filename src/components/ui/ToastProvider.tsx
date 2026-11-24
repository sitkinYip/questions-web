import { uiCopy } from "@/config/ui-copy";
import { Toast } from "radix-ui";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** 全局 Toast 视图层独立挂在 body 下，确保在模态弹层开启时仍可被读屏与点击关闭。 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = portalRef.current;
    if (!node) return;
    const clearHidden = () => {
      if (node.getAttribute("aria-hidden") === "true") {
        node.removeAttribute("aria-hidden");
      }
      if (node.hasAttribute("data-aria-hidden")) {
        node.removeAttribute("data-aria-hidden");
      }
    };
    clearHidden();
    const observer = new MutationObserver(clearHidden);
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["aria-hidden", "data-aria-hidden"],
    });
    return () => observer.disconnect();
  }, []);

  const viewport = (
    <div ref={portalRef} className="ui-toast-portal">
      <Toast.Viewport
        className="ui-toast-viewport"
        hotkey={["altKey", "KeyT"]}
        label={uiCopy.toastProvider.shortcutLabel}
      />
    </div>
  );

  return (
    <Toast.Provider
      label={uiCopy.toastProvider.label}
      swipeDirection="up"
      duration={8_000}
    >
      {children}
      {typeof document !== "undefined"
        ? createPortal(viewport, document.body)
        : viewport}
    </Toast.Provider>
  );
}
