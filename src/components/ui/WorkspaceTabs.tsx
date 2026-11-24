import { Tabs } from "radix-ui";
import { useRef, type ComponentProps } from "react";
import { useWorkspaceViewport } from "@/shared/layout/useWorkspaceViewport";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";

/** 统一标签页容器：桌面与移动端均采用水平滑动分段，由活动面板承担内部滚动。 */
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
      orientation="horizontal"
      data-workspace-tabs
      data-wide={desktop ? "true" : undefined}
      className={`workspace-tabs ${className}`}
    />
  );
}
