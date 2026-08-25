# UI 组件边界

## 基础组件

- `Button` 统一 `primary`、`secondary`、`danger`、`ghost`、`icon` 变体及 disabled、hover、active、focus 状态。
- `Input` 与 `Select` 统一表单表面；`Field` 负责可访问标签和辅助说明，业务组件不自行拼接标签结构。
- `AppDialog` 与 `Sheet` 使用同一 Overlay 调度和 Radix 焦点模型；Sheet 只定义抽屉接口，具体内容仍属于 feature。
- `AppToast` 只承载可忽略或可稍后处理的短暂反馈。必须立即做决定的操作继续使用 Dialog/AlertDialog，而不是 Toast。

## 状态归属

```text
业务数据与流程状态        feature / domain
弹窗是否请求打开          feature
弹窗并发优先级与焦点      OverlayProvider / AppDialog
Toast 可访问播报与视口     ToastProvider / AppToast
按钮、输入和选择器状态样式 components/ui
```

Provider 不保存答案、题目进度、媒体内容或删除目标。它只管理跨功能的展示规则，避免 UI 基础设施反向拥有业务状态。

## 动效层级

- `components/effects` 只包含无业务含义的环境和仪式视觉；全部设置 `aria-hidden`，不参与焦点与读屏顺序。
- 题目切换使用 `transform + opacity` 的弹性入场；正误结果通过 `data-tone` 选择不同反馈，不以颜色作为唯一信息来源。
- 环境光和微粒固定于视口且不接收指针事件。移动端减少视觉密度，`prefers-reduced-motion` 下关闭持续动画和粒子。

## 样式工程边界

`src/index.css` 只负责按明确的级联顺序组合样式，不允许再写具体选择器。样式文件按所有权放置：

```text
src/styles/
├── foundation/  主题 Token、reset 与全局基础规则
├── components/  跨业务复用的控件、Overlay、媒体与音频组件
├── layout/      应用级布局和可访问性辅助类
├── effects/     环境效果、反馈效果与统一 keyframes
└── features/    quest、clues、records、letter 等业务专属样式
```

- 颜色、层级、运动曲线等跨模块决策先进入 `foundation/tokens.css`，业务特有色彩留在 feature 内，避免把主题变量变成无意义的颜色字典。
- `effects/keyframes.css` 是动画定义的唯一入口；触发条件和 reduced-motion 规则仍由拥有该状态的 feature/component 维护。
- 新增样式先判断所有权。仅单个业务使用的规则不得进入 components；通用组件不得引用 feature 选择器。
- `pnpm check:styles` 校验组合入口、模块清单、动画归属和单文件体积；它已纳入 `pnpm check`。

当前不引入 Tailwind 或 Less。Tailwind 适合 utility-first 的新实现，但迁移现有语义 class 会同时扩大 JSX 变更面；Less 能减少书写重复，却不会自动提供模块所有权。现阶段使用 Vite 原生 CSS 拆分和变量，后续新建或大改的封闭组件可单独采用 CSS Modules。
