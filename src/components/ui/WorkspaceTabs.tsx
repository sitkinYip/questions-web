import { Tabs } from "radix-ui";
import { useRef, type ComponentProps } from "react";
import { useWorkspaceViewport } from "@/shared/layout/useWorkspaceViewport";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";

/** Navigation stays outside the active pane; Radix owns selection and keyboard focus. */
export function WorkspaceTabs({
  className = "",
  ...props
}: ComponentProps<typeof Tabs.Root>) {
  const desktop = useDesktopLayout();
  const viewportRef = useRef<HTMLDivElement>(null);
  useWorkspaceViewport(viewportRef, desktop);
  return (
    <Tabs.Root
      {...props}
      ref={viewportRef}
      orientation={desktop ? "vertical" : "horizontal"}
      data-workspace-tabs
      data-wide={desktop ? "true" : undefined}
      className={`workspace-tabs ${className}`}
    />
  );
}
