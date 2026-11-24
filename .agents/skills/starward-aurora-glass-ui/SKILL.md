---
name: starward-aurora-glass-ui
description: >-
  Enforces the Starward (赴星之约) Aurora Glass v2 visual design system,
  interaction constraints, Motion Prompt animation rules, dual-platform
  (mobile/desktop) parity, style/motion architecture gates, and screenshot
  verification workflow. Use whenever modifying, refactoring, reviewing, or
  adding any UI, CSS, layout, component, or animation in the questions-web
  repository.
---

# 赴星之约 · 极光玻璃 v2 UI 开发与审查规范

在 `questions-web` 中修改任何界面、组件、样式、主题、布局或动效前，必须先遵循本 Skill，并对照权威设计文档 [docs/design-system-aurora-glass-v2.md](../../../docs/design-system-aurora-glass-v2.md)。

## 一、核心视觉与交互红线（不可违背）

1. **禁止“只换色不改结构”**
   - 改动 UI 必须同时核对 DOM 信息层级、容器圆角、按钮形态、留白密度与交互反馈；不得在过时骨架上仅替换主题变量。
   - 存在多入口的业务（如「来信」的 `/notifications` 路由页 + 答题内 `NotificationDialog` 弹窗与悬浮铃铛）必须同步改造。
2. **品牌色板纪律（取自 Logo）**
   - Dark：深空底 `#070a12`、星白字 `#eef3ff`、冰蓝强调 `#8db4ff`。
   - Light：雾白底 `#f3f6fb`、深墨字 `#0e1424`、深冰蓝强调 `#2f6bdb`（AA 对比度）。
   - **金色（`--color-reward`：`#e3c27a` / `#b5832a`）严格仅用于奖品、成就、稀有度与终章徽章**，禁止用于普通按钮、导航、提示条或音频控件。
   - 严禁紫/粉 AI 渐变与旧版墨绿/暖金硬编码色值。`Letter` 纸张、`Bless` 星空与全屏媒体剧场保留独立沉浸主题。
3. **三层材质与原生迁移友好**
   - **L0 底景**：固定视口星点微光背景，不随滚动重绘。
   - **L1 内容玻璃卡**：**禁止 `backdrop-filter`**；仅用 `--color-glass-card` 渐变填充 + `1px` 细边 + 顶部 `1px` 内高光（`inset 0 1px 0 var(--color-glass-highlight)`）+ 指针柔光；玻璃本体不形变。
   - **L2 悬浮控制层**：仅悬浮底栏、悬浮顶栏、答题顶栏、Sheet、Dialog、账号气泡、浮动线索胶囊、全屏庆祝遮罩允许受控模糊，且必须提供 `@media (prefers-reduced-transparency: reduce)` 实体回退。
   - 避免 `mask-image`、`clip-path` 与重 CSS 滤镜，确保后续可无损迁移至 HarmonyOS ArkUI。
4. **字体、数字与 4 档圆角**
   - 仅用系统原生无衬线字体（`HarmonyOS Sans SC` / `PingFang SC` / `system-ui`），零外链字体；所有数字统一 `tabular-nums`。
   - 严格 4 档圆角：`--radius-sm`（`10px`）、`--radius-control`（`16px`）、`--radius-panel`（`24px`）、`--radius-round`（`999px`）。
5. **去 AI 味文案守则**
   - 删除所有英文 eyebrow（`CHAPTER`、`QUEST SESSION`、`UNLOCKED ARCHIVE`、`IMPORTANT SIGNAL`、`RANK`、`Decoded fragment` 等）、空洞口号和占位废话（如「点击查看已解锁内容」）。
   - 保留真实业务规则（等级限制、开放/截止时间、核销指引、密码要求、未读提醒、失败原因与重试），视觉极简但无障碍读屏信息通过 `.sr-only` 保留完整。
6. **双端独立适配**
   - `useDesktopLayout`（`1100px`）是唯一桌面边界；桌面端使用专属分栏/双栏/4 列网格，严禁简单拉伸移动端单列。
   - 保留移动端悬浮胶囊底栏现有触摸流光追踪与拖动切换行为；答题页不展示常驻底栏。
7. **Motion Prompt 动效规范**
   - 复用已选定的 6 项 Motion Prompt 动效（002 Stagger、003 Burst、007 Count-up、022 Light sweep、051 Bottom sheet、060 Segmented control），保留 MIT 署名注释（**CSS 注释中不要写 `#002` 等带 `#` 编号**）。
   - 只动画 `transform` / `opacity`，全局服从 `prefers-reduced-motion: reduce`；JS 调用 `window.matchMedia` 必须做 `typeof window.matchMedia === "function"` 保护。

## 二、工程硬门禁速查

详细避坑案例与排查清单见 [references/engineering-pitfalls.md](./references/engineering-pitfalls.md)。动手前务必牢记：

- **样式架构（`pnpm check:styles`）**：
  - `src/index.css` 保持纯 `@import` 且固定 49 模块顺序。
  - `src/styles/` 单文件 **≤ 650 行**；`@keyframes` 只能写在 `src/styles/effects/*-keyframes.css`。
  - 结构层 CSS **零字面量色**（`#hex`/`rgb()`/`rgba()`/`hsl()`/`hsla()`，连注释中的 `#NNN` 都会触发失败）；一律在 `src/styles/foundation/tokens.css` 声明语义变量后引用。
  - `src/styles/effects/*` 禁止包含 `.ui-button` / `.ui-input` / `.ui-select` / `.ui-sheet` / `.ui-toast` 选择器。
- **动效架构（`pnpm check:motion`）**：
  - 严禁在 `src/styles/components/motion.css` 之外覆盖 11 个弹层容器的外层 `animation`。

## 三、标准执行与验收闭环

1. **改前核对**：读清目标页面所有关联组件、PC/移动分支、多入口（路由 + 弹窗）与相关单测/E2E 断言。
2. **结构与样式同步改**：优先消费 `src/styles/foundation/tokens.css` 与 `src/design/` 共享原语，禁止留下旧色块或双套样式打架。
3. **快速静态自检**：
   ```bash
   pnpm check:styles && pnpm check:motion && pnpm lint && pnpm exec tsc -b --noEmit
   ```
4. **真实页面多端实拍对比（强制）**：
   - 使用 Playwright 访问**真实业务路由**（非仅看隔离预览页），拍摄手机（`390×844`）与桌面（`1366×820`）的深色/浅色与关键交互态（含进行中、已完成、空态、弹层/庆祝态）截图。
   - 逐张肉眼检查：圆角、间距、截断、重叠、刘海避让、透明图底色与设计基线一致后，再进入测试与门禁。
5. **同步测试与完整发布门禁（强制）**：
   - 合理更新因有意结构变更而失效的快照或布局断言，**严禁删除业务断言或放宽校验标准**。
   - 所有改动落定后运行完整门禁（macOS 加 `caffeinate -i` 防止睡眠导致假性超时）：
     ```bash
     pnpm format && caffeinate -i pnpm verify:release
     ```
   - 汇报必须列出实际命令、通过数，并明确区分本地验证、远端 CI 与实际部署。
