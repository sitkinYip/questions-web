/**
 * 纯装饰星穹氛围层（星云呼吸 + 冰蓝星尘 + 星轨弧线）。
 * 始终设置 aria-hidden，不参与焦点、输入或任何业务逻辑。
 */
export function StarfieldBackdrop({
  variant = "app",
}: {
  variant?: "app" | "auth";
}) {
  return (
    <div
      className={`starfield-backdrop starfield-backdrop--${variant}`}
      aria-hidden="true"
    >
      <div className="starfield-backdrop__nebula" />
      <div className="starfield-backdrop__stars" />
      <div className="starfield-backdrop__arc" />
    </div>
  );
}
