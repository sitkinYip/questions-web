import type { HTMLAttributes, ReactNode } from "react";
import { useImmersiveLight } from "@/design/useImmersiveLight";

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** L1 内容卡片（无 blur）或 L2 浮层（带系统级 blur） */
  elevation?: "card" | "floating";
  /** 语义色调：默认 / 进行中冰蓝高亮 / 奖励金色稀有 / 锁定弱化 */
  tone?: "default" | "active" | "reward" | "locked";
  /** 4 档系统圆角 */
  radius?: "sm" | "md" | "lg" | "pill";
  /** L2 模糊档位 */
  blur?: "soft" | "strong";
  /** 是否启用鸿蒙沉浸光感指针跟随 */
  interactive?: boolean;
  children?: ReactNode;
}

/**
 * 极光玻璃通用容器
 * L1 使用半透明冷调填充 + 1px 顶部内高光 + 局部跟随光斑（无 blur，确保滚动流畅与 ArkUI 对应）；
 * L2 仅用于顶栏、底栏与弹层，启用可控 2 档 blur。
 */
export function GlassSurface({
  elevation = "card",
  tone = "default",
  radius = "lg",
  blur = "soft",
  interactive = false,
  className = "",
  children,
  onPointerEnter,
  onPointerDown,
  onPointerMove,
  onPointerLeave,
  onPointerUp,
  onPointerCancel,
  ...rest
}: GlassSurfaceProps) {
  const light = useImmersiveLight(interactive && tone !== "locked");

  return (
    <div
      {...rest}
      data-elevation={elevation}
      data-tone={tone}
      data-radius={radius}
      data-blur={elevation === "floating" ? blur : undefined}
      data-interactive={interactive && tone !== "locked" ? "true" : undefined}
      className={`sw-glass ${className}`.trim()}
      onPointerEnter={(e) => {
        light.onPointerEnter(e);
        onPointerEnter?.(e);
      }}
      onPointerDown={(e) => {
        light.onPointerDown(e);
        onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        light.onPointerMove(e);
        onPointerMove?.(e);
      }}
      onPointerLeave={(e) => {
        light.onPointerLeave(e);
        onPointerLeave?.(e);
      }}
      onPointerUp={(e) => {
        light.onPointerUp(e);
        onPointerUp?.(e);
      }}
      onPointerCancel={(e) => {
        light.onPointerCancel(e);
        onPointerCancel?.(e);
      }}
    >
      <div className="sw-glass__content">{children}</div>
    </div>
  );
}
