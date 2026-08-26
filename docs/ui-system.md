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
外观偏好与设备主题解析      ThemeProvider / theme repository
```

Provider 不保存答案、题目进度、媒体内容或删除目标。它只管理跨功能的展示规则，避免 UI 基础设施反向拥有业务状态。

## 主题系统

主题分为偏好和解析结果两层：

```ts
type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";
```

- 默认偏好是 `system`。`ThemeProvider` 监听 `(prefers-color-scheme: dark)`，只在 system 状态下把设备变化反映到界面。
- `?theme=light|dark|system` 可指定链接级初始偏好；合法 query 优先于本地存储但不自动持久化，非法或缺失时回退本地偏好。
- `index.html` 在样式和 React 首次绘制前按 query → 存储 → 设备的优先级解析，设置 `html[data-theme]`、`color-scheme` 和 `theme-color`，避免首屏闪烁。
- 头像使用 Radix DropdownMenu 提供三项单选；始终渲染按钮，没有图片时显示旅行者名称首字。
- 偏好按应用和浏览器保存，不按业务用户隔离；其他标签页通过 `storage` 事件同步。

### 语义色板

| 角色           | Dark      | Light     |
| -------------- | --------- | --------- |
| Canvas         | `#10110f` | `#f4f0e7` |
| Surface        | `#151612` | `#fbf8f1` |
| Raised surface | `#171814` | `#fffdf8` |
| Strong text    | `#f0ecdf` | `#211f19` |
| Body text      | `#e7e6e1` | `#38352e` |
| Muted text     | `#aaa99f` | `#69645a` |
| Accent         | `#d4bc7d` | `#76602f` |
| On accent      | `#191811` | `#fffaf0` |
| Border         | `#30322c` | `#d8d0c1` |

浅色中的 `#76602f` 承担链接、焦点和主按钮等交互角色；浅金只用于装饰和低透明度光效。不要让同一个物理色值跨主题承担相同语义。

### Token 所有权

1. `foundation/tokens.css` 只定义跨功能语义：canvas、surface、text、border、accent、status、overlay、shadow。
2. Quest、Records、通用控件和布局属于结构层，必须只消费语义 Token，不允许直接新增 hex/rgb/hsl。
3. Notification 紫、组合线索青、Letter 纸张等属于 feature 身份色，在所属 CSS 内提供 dark/light 局部 recipe，不升级成全局颜色字典。
4. Letter 正文、Bless 星空和媒体剧场是内容自有的沉浸式主题，使用 `color-scheme` 或局部变量隔离；它们不是漏适配。

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
- `effects` 可以拥有装饰色和主题 recipe，但不得直接拥有 `.ui-button`、`.ui-input` 等复用控件选择器。
- `effects/keyframes.css` 是动画定义的唯一入口；触发条件和 reduced-motion 规则仍由拥有该状态的 feature/component 维护。
- 新增样式先判断所有权。仅单个业务使用的规则不得进入 components；通用组件不得引用 feature 选择器。
- `pnpm check:styles` 校验组合入口、模块清单、动画归属、主题契约、结构层颜色字面量、复用控件所有权和单文件体积；它已纳入 `pnpm check`。

当前不引入 Tailwind 或 Less。Tailwind 适合 utility-first 的新实现，但迁移现有语义 class 会同时扩大 JSX 变更面；Less 能减少书写重复，却不会自动提供模块所有权。现阶段使用 Vite 原生 CSS 拆分和变量，后续新建或大改的封闭组件可单独采用 CSS Modules。
