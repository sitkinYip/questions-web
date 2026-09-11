import { Tabs } from "radix-ui";
import type { ComponentProps } from "react";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";

/** Navigation stays outside the active pane; Radix owns selection and keyboard focus. */
export function WorkspaceTabs({
  className = "",
  ...props
}: ComponentProps<typeof Tabs.Root>) {
  const desktop = useDesktopLayout();
  return (
    <Tabs.Root
      {...props}
      orientation={desktop ? "vertical" : "horizontal"}
      data-workspace-tabs
      data-wide={desktop ? "true" : undefined}
      className={`workspace-tabs ${className}`}
    />
  );
}
