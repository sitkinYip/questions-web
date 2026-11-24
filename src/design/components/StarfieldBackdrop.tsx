/**
 * L0 星空背景层
 * 固定定位、零滚动重绘、零重度滤镜。夜间呈现深空星尘与微弱极光，日间呈现雾白浅蓝星尘。
 */
export function StarfieldBackdrop() {
  return (
    <div className="sw-starfield" aria-hidden="true">
      <div className="sw-starfield__ambient" />
      <div className="sw-starfield__stars sw-starfield__stars--near" />
      <div className="sw-starfield__stars sw-starfield__stars--far" />
    </div>
  );
}
