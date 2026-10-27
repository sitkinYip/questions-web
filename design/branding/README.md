# Starward 品牌资源

- 项目名称：`Starward`，代码与包名使用 `starward`。
- 前端名称：赴星之约。
- 副标题：向着星辰的冒险。
- 应用图标：已选定的黑底星尘版。冰蓝星光居中，星环以土星式结构前后穿插，左下环线轻微擦淡，背景底部保留星尘。
- 页面标志：从选定素材中提取星光与星环，保留形状、冰蓝渐变和左下轻擦，使用透明背景。

`starward-icon-master.png` 是选定图标的原始 PNG，保留完整设计。`starward-mark-master.png` 是通过内置 imagegen 单独去底的透明 PNG，处理提示保存在 [`starward-mark-prompt.txt`](./starward-mark-prompt.txt)。页面标志与应用图标分别使用以下资源：

| 资源                                             | 用途                                   | 背景     |
| ------------------------------------------------ | -------------------------------------- | -------- |
| `public/branding/starward-icon-{32,48}.png`      | 浏览器图标                             | 黑底星尘 |
| `public/branding/starward-icon-180.png`          | iPhone 添加到主屏幕                    | 黑底星尘 |
| `public/branding/starward-icon-{192,512}.png`    | Web App Manifest 图标                  | 黑底星尘 |
| `public/branding/starward-icon-maskable-512.png` | Android 自适应主屏幕图标（`maskable`） | 黑底星尘 |
| `public/branding/starward-mark-{96,192}.png`     | 页头、加载页、版本弹层的响应式标志     | 透明     |

页面中的透明标志统一由 `src/components/brand/BrandMark.tsx` 引用，采用等比包含显示，不添加方形裁切或圆角。浏览器和手机入口在 `index.html` 与 `public/manifest.webmanifest` 中继续声明黑底星尘图标。图形内不加入中英文名称。

Maskable 图标从 `starward-icon-master.png` 等比导出为 460×460，居中放入 512×512 黑色画布，每边补 26px，保留原始星光、星环与星尘。主要星光与星环落在以图标中心为圆心、半径为边长 40% 的安全圆内，适配系统的圆形、圆角方形等裁切；外围星尘是可裁切装饰。该文件仅声明 `purpose: maskable`，原有 192/512 图标继续声明 `purpose: any`，不能将未经留白的常规图标直接兼作 maskable。

主屏幕入口使用「赴星之约」名称和独立窗口元数据，Apple 状态栏采用 `default`。Manifest 的相对路径使预览、正式部署各自保留独立入口；当前不包含 Service Worker、离线缓存或应用内安装提示。
