# 极光玻璃 v2 工程避坑与复盘手册

本手册沉淀本轮 `questions-web` 极光玻璃 v2 改造期间实际踩过的坑与固定解法，供后续迭代与审查查阅。

---

## 1. `check:styles` 高频报错清单

| 报错现象                                                                               | 真实原因                                                                                                                                          | 固定解法                                                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `must consume semantic theme tokens instead of literal colors`（但代码里明明没写颜色） | `verify-style-architecture.mjs` 的正则 `/#[\da-f]{3,8}\b/i` 会扫描整份文件（含注释），注释里写 `#022`、`#003`、`#007` 会被误判成 3 位十六进制色值 | 注释改写为 `Motion Prompt 022`（不带 `#`）；任何物理色值统一放进 `src/styles/foundation/tokens.css`                                                                      |
| `has N lines (limit: 650)`                                                             | 单模块超过 650 行硬上限                                                                                                                           | 按职责拆分到已登记的对应模块（如题图/视频封面/选项媒体归 `features/question-images.css`，答题反馈/引导/选项归 `effects/answer-feedback.css`），不随意新增未登记 CSS 文件 |
| `defines @keyframes outside an effects keyframes module`                               | 在业务 CSS 中直接写了 `@keyframes`                                                                                                                | 所有新关键帧统一写入 `src/styles/effects/game-keyframes.css`（或对应 `*-keyframes.css`）                                                                                 |
| `must not own reusable UI primitives`                                                  | 在 `src/styles/effects/*.css` 里写了 `.ui-button` / `.ui-input` 等类名                                                                            | 通用控件覆写放进 `components/controls-and-overlays.css` 或对应 `features/*.css`                                                                                          |

---

## 2. `check:motion` 外层动效所有权

以下 11 个弹层容器的外层进出场 `animation` 由 `src/styles/components/motion.css` 独占，其他 CSS 禁止为它们写非 `none` 的 `animation`：

- `.ui-sheet`
- `.clue-dialog`
- `.multi-clue-dialog`
- `.notification-dialog`
- `.media-viewer`
- `.rank-up-dialog`
- `.completion-dialog`
- `.version-dialog`
- `.record-confirm`
- `.avatar-crop-dialog`
- `.game-retry-dialog`

装饰性光效动画只应挂在内部子节点（如 `.completion-sigil`、`.completion-aura::before`、`::after`），不挂在容器本身。

---

## 3. 布局、组件与交互高频踩坑

1. **不要因迁就旧布局测试而保留过时结构**
   - 坑：曾为了不改旧 E2E 而保留旧侧边栏抽屉、旧纵向 Tabs 栏、旧题卡内嵌输入栏与护照平铺表单，导致真实页面与预览布局大相径庭。
   - 解：严格按设计规范和预览实现真实 DOM 结构（移除侧边栏、护照改设置页 + 弹层表单、答题输入栏独立底部悬浮、横向滑动分段器），同步更新对应布局 E2E，同时完整保留所有业务、隐私、安全区和无障碍断言。
2. **移动端底部独立输入栏与浮动控件避让**
   - 坑：移动端答题页 `.quest-input-dock` 固定在视口底部（`bottom: max(18px, var(--safe-area-bottom))`），左下角默认 `y: 1` 的浮动来信铃铛（`NotificationCenter`）会直接压住输入框左侧；右下角 `BgmControls` 也会与圆形提交按钮重叠。
   - 解：`.quest-layout:has(> .quest-input-dock)` 预留 `padding-bottom: calc(96px + var(--safe-area-bottom))`；浮动来信铃铛设为 `{ x: 0, y: 0.84 }`、`BgmControls` 设为 `{ x: 1, y: 0.84 }`、`MultiClueLauncher` 设为 `{ x: 1, y: 0.74 }`，三者均安全浮于输入栏上方且互不重叠。
3. **透明背景题图变黑底**
   - 坑：给 `.question-image img` 加上 `background: var(--color-media-surface)` 导致带透明通道的 PNG 题图底部出现实色块，且触发 `e2e/question-images.spec.ts` 的透明帧断言失败。
   - 解：`.question-image img`、`.question-gallery img`、`.quest-prompt img` 保持 `background: transparent; object-fit: contain; border-radius: var(--radius-control);`，悬停仅变边框与阴影，绝不对图片内部做 `scale` 裁切。
4. **登录页 `<GameBrand />` 与展开帮助偏移**
   - 坑：去掉登录页 `<GameBrand />` 会破坏品牌与 5 连击版本彩蛋测试（`branding.spec.ts`、`version.spec.ts`）；登录主体垂直居中若不锁定顶距，展开「还没有账号」帮助会导致左侧星标位移（`desktop-layout.spec.ts:29`）。
   - 解：保留 `<GameBrand />`（隐藏多余 tagline），并固定 `.game-auth__main` 顶部对齐防止展开帮助时抖动。
5. **护照弹层与头像裁剪弹窗层级协同**
   - 坑：护照页点击「修改资料」打开底部/右侧 `Sheet` 后，再点击上传头像会打开 `AvatarCropDialog`；若层级优先级配置错误会导致弹窗互抢焦点或关闭裁剪后丢失草稿。
   - 解：护照设置 `Sheet` 使用 `overlayPriority.content`（60），`AvatarCropDialog` 保持 `priority={80}`，并将 `useProfileEditor` / `usePasswordEditor` 状态提升在 `GameProfilePage` 层级，跨弹层开关与 `1100px` 断点缩放均保留草稿与裁剪预览。
6. **旧 CSS 尾部重复规则覆盖新样式**
   - 坑：`game-collections.css`、`game-shell.css`、`answer-feedback.css`、`quest-lighting.css` 曾存在尾部旧规则静默覆盖前面新样式（例如旧的 `quest-card` 双层内框 `outline-offset: -7px` 和旧的 `.quest-nav button { min-width: 94px }`）。
   - 解：重构某模块样式时必须**全局 grep 对应选择器**（包括 `effects/` 和 `desktop/`），把残留覆盖规则一起清理。
7. **jsdom 单元测试中的 `window.matchMedia` 崩溃**
   - 坑：在 `useCountUp` 等新 Hook 中直接调用 `window.matchMedia(...)` 在 Vitest jsdom 环境下报 `window.matchMedia is not a function`。
   - 解：凡是在前端组件/Hook 中调用 `window.matchMedia`，必须加 `typeof window !== "undefined" && typeof window.matchMedia === "function"` 保护。
8. **双入口遗漏与视觉漂移**
   - 坑：只改 `/notifications` 独立页，漏掉答题页内 `NotificationDialog` 与悬浮铃铛；只改首页场次卡，漏改答题页 DOM 结构。
   - 解：改造前先按业务功能盘点所有路由入口和弹层入口；改造后必须用 Playwright 对**真实路由**（不是 `preview-v2.html`）拍手机/桌面、浅色/深色截图逐张核验。
9. **macOS 上运行完整发布门禁防睡眠假性 flake**
   - 坑：长时间执行 160 项 Playwright E2E 时，Mac 进入息屏/休眠会导致 5–7 个 Chromium 用例超时重跑成 flaky（CI 将 flaky 视为失败）。
   - 解：本地统一使用 `caffeinate -i pnpm verify:release` 执行完整门禁。
