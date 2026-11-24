/**
 * 赴星之约（Starward）设计系统单一来源 Token（极光玻璃 v2）
 * 配色全部取自品牌 Logo（深空黑底、星白核心、冰蓝星芒与星环），金色仅用于奖励/成就/稀有度。
 * 结构同时面向 Web CSS 变量与后续 HarmonyOS ArkUI 常量映射。
 */

export type ThemeMode = "dark" | "light";

export const designRadius = {
  /** 小控件、输入框、二级徽章 */
  sm: 10,
  /** 内部模块、题图缩略图 */
  md: 16,
  /** 主卡片、弹层容器 */
  lg: 24,
  /** 胶囊按钮、悬浮底栏、分段器 */
  pill: 999,
} as const;

export const designMotion = {
  duration: {
    /** 按压反馈 */
    press: 120,
    /** 状态切换（分段、焦点、光斑淡入） */
    state: 240,
    /** 页面与弹层切换 */
    page: 420,
    /** 答对、升级等一次性游戏仪式演出 */
    ceremony: 900,
  },
  easing: {
    /** 标准缓动，对应 ArkUI curves.cubicBezierCurve(0.2, 0, 0, 1) */
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    /** 弹簧近似，对应 ArkUI curves.springMotion(0.35, 0.82) */
    spring: "cubic-bezier(0.22, 0.9, 0.24, 1)",
  },
} as const;

export const designPalette: Record<
  ThemeMode,
  {
    bg: string;
    bgElevated: string;
    text: string;
    textStrong: string;
    textMuted: string;
    accent: string;
    accentStrong: string;
    onAccent: string;
    accentGlow: string;
    reward: string;
    rewardGlow: string;
    danger: string;
    success: string;
  }
> = {
  dark: {
    bg: "#070A12",
    bgElevated: "#0E1526",
    text: "#DCE6FA",
    textStrong: "#EEF3FF",
    textMuted: "#8A94AD",
    accent: "#8DB4FF",
    accentStrong: "#B5D0FF",
    onAccent: "#07101F",
    accentGlow: "rgba(141, 180, 255, 0.35)",
    reward: "#E3C27A",
    rewardGlow: "rgba(227, 194, 122, 0.28)",
    danger: "#E28B8B",
    success: "#7CD4C0",
  },
  light: {
    bg: "#F3F6FB",
    bgElevated: "#FFFFFF",
    text: "#1B253A",
    textStrong: "#0E1424",
    textMuted: "#5A6478",
    accent: "#2F6BDB",
    accentStrong: "#1F56BE",
    onAccent: "#FFFFFF",
    accentGlow: "rgba(47, 107, 219, 0.18)",
    reward: "#B5832A",
    rewardGlow: "rgba(181, 131, 42, 0.22)",
    danger: "#C94A54",
    success: "#1F8A70",
  },
};
