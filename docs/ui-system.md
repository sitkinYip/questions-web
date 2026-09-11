# UI 组件边界

## 基础组件

- `Button` 统一 `primary`、`secondary`、`danger`、`ghost`、`icon` 变体及 disabled、hover、active、focus 状态。
- `Input` 与 `Select` 统一表单表面；`Field` 用稳定 ID 关联独立 label、控件和辅助说明，避免密码显隐按钮或提示文案混入输入框名称。
- `PasswordInput` 复用 Input，显隐切换保留值且不提交表单；按钮有独立可访问名称。
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
- 手机与平板头像继续打开基于 Radix 的 Sheet；桌面头像使用非模态 hover / focus 气泡菜单，不遮罩当前工作区。`GameThemePicker` 提供三项原生 radio，登录页也可切换主题。移动端收起文字时仍保留可访问名称。
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
├── features/    quest、clues、records、letter 等业务专属样式
└── desktop/     仅桌面启用的工作区与分屏组合，不改变手机布局
```

- 颜色、层级、运动曲线等跨模块决策先进入 `foundation/tokens.css`，业务特有色彩留在 feature 内，避免把主题变量变成无意义的颜色字典。
- `effects` 可以拥有装饰色和主题 recipe，但不得直接拥有 `.ui-button`、`.ui-input` 等复用控件选择器。
- 动画定义只允许进入 `effects/*keyframes.css`；游戏外壳使用 `game-keyframes.css`，与原有答题、信件和星空动效分开维护。
- 新增样式先判断所有权。仅单个业务使用的规则不得进入 components；通用组件不得引用 feature 选择器。
- `pnpm check:styles` 校验组合入口、模块清单、动画归属、主题契约、结构层颜色字面量、复用控件所有权和单文件体积；它已纳入 `pnpm check`。

当前不引入 Tailwind 或 Less。Tailwind 适合 utility-first 的新实现，但迁移现有语义 class 会同时扩大 JSX 变更面；Less 能减少书写重复，却不会自动提供模块所有权。现阶段使用 Vite 原生 CSS 拆分和变量，后续新建或大改的封闭组件可单独采用 CSS Modules。

## 星图探险外壳（2026-08）

新增页面从 `GamePages.tsx` 拆为 `features/game/pages/` 下的独立页面。保留 React、Radix、TanStack Query 和现有服务端契约，不引入第二套样式语言或动画运行时。

| 所有者                               | 职责                                                          |
| ------------------------------------ | ------------------------------------------------------------- |
| `game-queries.ts`                    | 按玩家隔离的 query key、统一查询与轮询；不保存本地表单草稿    |
| `game-presentation.ts`               | XP 百分比、场次展示状态、日期和等级文案；不替代服务端权限判定 |
| `game-navigation.ts`                 | 桌面/手机/侧栏共用导航定义和安全的答题返回路径                |
| `GameLayout`                         | 桌面顶栏、移动底栏、跳转焦点、返回正在探索的场次              |
| `PlayerPassport` / `ExperienceMeter` | 共享玩家名片与 XP；数据始终来自当前玩家                       |
| `AssignmentCard` / `AssignmentBrief` | 章节票券、出发前说明、真实场次限制与时间                      |
| `ProfileEditor` / `useProfileEditor` | 共享表单展示 / 昵称草稿、头像预览生命周期、资料提交           |
| `GameState`                          | 与最终布局接近的 skeleton、空状态、可重试错误                 |
| `CelestialAtlas`                     | 纯装饰几何，不参与输入、焦点和业务状态                        |

### 视觉约束

- 保留原有深橄榄黑 / 金色与浅纸色两套语义色板；不把全站强行改成深色。
- 游戏标题沿用适合星图手稿的衬线字体，表单和正文使用 UI 无衬线字体；数值使用等宽/等宽数字。
- 共享尺寸进入 tokens：`--space-*`、`--radius-control`（10px）、`--radius-panel`（18px）、`--control-height`（52px）、`--page-width`、`--page-gutter`。
- 控件圆角不覆盖老答题控件：新表单/新 CTA 按新尺度；原谜题卡、媒体弹窗、BGM 与叙事页面维持现有视觉协议。
- 桌面大厅为章节 + 护照双区，760px 以下单列；手机底栏使用悬浮圆角玻璃容器与独立选中气泡，避开 safe-area 并为正文预留底部空间。Web 玻璃效果由半透明表面、内描边与 `backdrop-filter` 近似实现，在降低透明度偏好或不支持模糊时回退为实体表面。答题页不显示常驻底栏。
- 答题中的顶部只保留玩家与进度，头像打开导航；场次说明仅在开场前展示，不再插入返回/详情行挤压题目。
- 移动侧栏使用 `Sheet` 的 `className` 与 `headerContent` 插槽；`GameSidebarIdentity` 复用头像、经验条与装饰星盘，完整护照不复用到侧栏。桌面气泡复用同一导航、主题与退出动作，支持 hover、点击、焦点进入、Esc 和外部点击关闭。两种菜单规则都归属 `features/game-sidebar.css`，不影响其他抽屉。
- 侧栏按扣除 padding / safe-area 后的可用高度做 container query：低于 620px 保留紧凑身份与完整操作；620px 起恢复星盘徽章；740px 起恢复导航说明与更大的徽章。`cqh` 连续调整头像/星盘尺度，导航等分剩余高度，主题与退出自然落底，不依赖绝对定位或 JS 测量。
- 高屏和短屏都保留无障碍标题、焦点返回、44px 关闭/导航点击区。极矮横屏或放大文字时允许滚动兜底，不裁切操作。测试同时检查可操作性、无滚动、底部贴合与区块占用率，不能只用“无溢出”代表视觉通过。
- 安全区统一使用 `--safe-area-top/bottom`，入口开启 `viewport-fit=cover`。显式顶部留白取 `max(原间距, 安全区)`；居中顶栏只补足安全区超过原有留白的差值，非刘海屏不变。底部额外留白仅随移动端底栏出现，不加到答题页或登录页。
- Phosphor 为新增图标的唯一来源，细线用于大装饰、常规线重用于小控件；图标独立分包。
- 文案以“启程 / 收藏 / 来信 / 护照”为主，但等级限制、核销、账号来源、密码要求等真实规则不藏进隐喻。

### 动效约束

- 章节和页面：14px 位移 + 透明度入场；列表错峰最多 120ms，不随列表长度累计等待。
- 星盘：仅轨道 transform 旋转；中心星透明度呼吸；移动端减少一层持续运动。
- 按钮/菜单：按压与悬浮反馈，沿用统一弹性曲线；不添加滚动劫持。
- `prefers-reduced-motion` 关闭新增持续/入场动画，缩短共享时长变量。静态内容不依赖动画完成才可见。
- `GameLoadingScreen` 统一账号初始化、场次和叙事的整页加载状态，复用 `CelestialAtlas`，样式归属 `features/game-loading.css`，光点 keyframes 归属 `effects/game-keyframes.css`。只在真实 query pending 时挂载，不伪造进度、不延时退出、不等待动画或额外媒体下载；错误交还原有重试界面。叙事加载保留头像导航，列表局部加载继续使用原骨架屏。
- 加载预览：`/e2e/preview.html?screen=/loading&theme=dark`，可用 `screen=/loading/player` 或 `screen=/loading/narrative` 查看其他文案。全屏加载采用居中构图，与移动答题页从顶部向下排列的布局分离。
- 原生 progress 展示真实值，不用假的动画进度代替服务端进度。

### 开发预览与验证

- `pnpm dev` 后访问 `/e2e/preview.html?theme=dark`，可在隔离模拟数据里检查大厅、收藏、来信、护照；`screen=/profile` 等可直达页面。
- 预览入口仅供 Vite 开发服务器使用，无生产路由、不会进入生产入口依赖图；模拟 API 不访问真实用户数据。登录和实际解谜仍用端到端 API 拦截测试。
- 五张内置 ImageGen 参考用于确定登录、章节、手机护照、收藏与来信的布局。它们只是设计参考，不作为页面截图背景、真实玩家或奖品资产。成品中的星盘由 CSS 几何和图标实现，因此可缩放、可换肤、无额外大图下载。
- 参考提示词核心：`Chinese narrative puzzle game; antique celestial atlas; charcoal olive #10110f, parchment gold #d4bc7d; Chinese serif display, sans body; readable standalone screen; no nested cards; chapter tickets / traveler passport / correspondence; mobile 48px touch targets.`
- `pnpm check:styles` 包含新增模块所有权、语义色消费与单文件体积；`e2e/game-pages.spec.ts` 覆盖 320px 溢出、主题、密码显隐、场次限制、草稿切换、保存失败、奖品线索与来信确认。

## 桌面工作区（2026-08）

- `shared/layout/useDesktopLayout.ts` 是唯一桌面能力边界（1100 CSS px）。监听 matchMedia，使用 useSyncExternalStore；业务逻辑不判断设备型号。低于边界使用原有手机/平板 DOM 与交互。
- 桌面 CSS 不再复制断点数值：只匹配该 hook 启用的 `.quest-desktop`、`.game-world[data-desktop]` 和 `.letter-page[data-desktop]`。登录、大厅和侧栏不加入桌面工作区标记，保持原有布局。
- `styles/desktop/workspace.css` 统一桌面栏间距、页边距、最大宽度、滚动区和精简外壳；quest、profile、inbox、letter 分文件拥有各自布局。全部消费现有颜色/动效 token 或信纸局部主题变量，仍受架构检查约束。
- `GamePlayView` 保存唯一的答案草稿、进度、API 提交与演出队列。`QuestAnswerForm` 共享控件与校验展示；`QuestCard` 保留手机结构，`desktop/DesktopQuestCard` 只负责桌面阅读区与答题区。`QuestWorkspace` 在没有线索时不留空侧栏，有线索时显示服务端已解锁的非组合线索；不从题库推导或提前请求未解锁内容。
- 桌面题干、选项、线索分别可滚动，题目切换仍恢复焦点，但不滚动整个页面。图片保持比例并可打开原媒体查看器；自动线索、完成仪式、升级提示仍由同一演出队列处理。
- 题干单图、图集与正文内图片由 `features/question-images.css` 共享透明底与等比尺寸规则；单图及图集按钮按实际图片尺寸收拢，小图保留至少 44×44px 的透明点击区，边框和悬停阴影归图片所有，不再对图内放大裁切。桌面只覆写最大高度，视频封面、选项缩略图和媒体查看器保持各自样式边界。
- `DesktopClueVideoTrigger` 与 `desktop/clue-video.css` 独立拥有桌面视频入口的星环、描边和交互反馈，复用主题/动效变量，不覆盖移动端或通用按钮。视频、图片 URL 只交给站内媒体查看器，只有 link / letter 类型生成导航，避免把防盗链 CDN 资源误当外链打开。
- `useProfileEditor` / `usePasswordEditor` 在页面层创建，桌面并列编辑与手机 Tabs 共享草稿；切换断点不清空输入、不释放仍使用的头像预览。头像对象 URL 在替换、保存或离开页面时才释放。强制改密页继续使用原登录外壳。
- `gameApi.profile` 将仅昵称编辑转成 JSON，有头像文件时保留 multipart，由浏览器生成 boundary；浏览器回归分别验证两种请求、文件内容与保存后状态，不把所有资料修改都当成上传。
- `DesktopInbox` 仅持有选中来信 ID；查询和确认逻辑复用 `NotificationLetter`。列表/正文独立滚动，确认操作不跳到下一封未读信，正文支持键盘滚动。
- `LetterControls` 共享翻页/打字/收起操作。桌面增加直接返回和键盘提示；宽幅信纸仍使用原分页引擎、音频与翻页动效。可见正文与隐藏分页测量区消费相同字体和间距，避免三种信纸主题出现截字。手机结构不增加桌面手记。
- 常见 1100×700、1280×720、1366×768、1920×1080 视口以主要操作同屏为目标；极矮窗口或长错误反馈保留区域滚动兜底，不裁切数据或禁止页面缩放。
- `/e2e/preview.html?screen=/play/preview-journey` 和 `screen=/letter` 提供静态解锁题目/线索和信纸示例。`e2e/desktop-layout.spec.ts` 覆盖分屏关系、短屏操作、长正文/选项、来信选择、头像/输入草稿跨断点以及三种信纸分页；原移动端测试继续保留。

## 分区滚动与媒体体验（2026-09）

- `GameLayout` 统一占用 `100dvh`，顶栏和手机底栏不参与内容滚动；普通页面由 `.game-shell` 滚动，启程、来信由当前 tabpanel 滚动。低高度窗口压缩标题辅助文字，保留操作区域。
- `WorkspaceTabs` 复用 Radix 的选择与键盘模型，通过 `useDesktopLayout` 在 PC 使用纵向侧边导航，在移动端使用横向 Tabs。业务页面只传入原有内容与状态，不复制滚动或断点逻辑。
- 大厅和收藏加入桌面外壳。PC 大厅使用自适应多列场次票券，完整介绍仍可在场次详情查看；个人信息继续通过顶栏护照入口访问。
- `RewardCard` 保留状态、数量、名称和两行摘要，领取指引与有效领取线索仅在详情 Sheet 展示。PC 为侧边抽屉，手机为底部弹层，头部与正文滚动分离；已失效奖品不展示私有领取线索。
- `MediaPreviewProvider` 位于 OverlayProvider 内、业务弹窗外，持有富文本媒体状态，避免上层详情暂停展示时销毁媒体。媒体关闭后原详情重新显示。媒体优先级高于普通内容，低于确认和完成演出。
- `RichContent` 保留安全解析协议，图片使用可聚焦按钮打开图集；视频保留原生播放和声音控制，并提供展开入口，展开前暂停内联视频。
- `ZoomableImage` 单独管理 1–4 倍缩放、边界约束和指针手势。PC 滑块与复位可键盘操作，手机双指缩放；放大时单指拖动，原比例时单指切图，双指手势不触发切图。切图通过实例 key 重置视图。手势 transform 不与入场 keyframes 竞争。
- 本轮不引入动画或手势依赖，继续消费原有主题变量、弹性曲线与 reduced-motion 偏好。

## 全局动画生命周期（2026-09）

- `components/motion.css` 统一控制弹层容器与遮罩的进入/退出，`effects/motion-keyframes.css` 定义运动；装饰留在各 feature 的内部节点，禁止重复设置外壳 animation。`check:motion` 已纳入 `pnpm check`。
- `Sheet` 支持 left/right/bottom 以及 mobileSide；`useDesktopLayout` 解析出的 placement 同时决定布局与运动。奖品在非桌面使用底部抽屉，上升进入、下降退出，PC 使用右侧进入/退出。其他侧边导航保持自己的方向。
- `useMotionPresence` 根据 CSS 实际动画时长保留退场 DOM，以结束/取消事件释放，过滤子动画冒泡；有界计时仅作丢失事件兜底。重新打开取消旧退出任务。减弱动画下不等待动画事件。
- `useExitSnapshot` 只保留退场显示数据，业务关闭立即生效；数据驱动的媒体、线索、组合线索、通知、升级、完成反馈、缓存确认与头像裁剪均接入。裁剪在取消时立即撤销异步结果的提交资格。
- `AppDialog` 在退出完成前保留 Overlay 占用；退场阶段 inert 且拦截重复点击。更高优先级弹层覆盖时暂停下层模态职责，保存滚动和焦点位置，恢复后不重播完整入场。业务草稿仍由 feature 所有，路由离开时直接销毁。
- `OverlayProvider` 记录键盘/触控触发来源，兼容 WebKit 点击不自动聚焦；弹窗保存独立返回目标。嵌套媒体返回时恢复原图片入口与详情滚动，而不是跳到详情顶部。媒体关闭/被覆盖立即停止播放。
- PC 头像菜单与浮动通知列表使用同一 presence；主题与行操作菜单使用 Radix presence 和共享 motion-menu 样式。Toast 继续使用 Radix 的关闭/滑动生命周期，时长改为统一 token，网络恢复也保留退场。
- Tabs 内容以短位移进入，固定导航不参与内容动画。信纸收起保留当前正文直到退场结束，音频与打字立即停止，下次打开再重置阅读状态；翻页继续使用原有水平/垂直轴和页码状态机。
- `/e2e/preview.html?screen=/motion&theme=dark` 为开发专用动画验收场，可逐个打开八类代表弹层。`e2e/motion.spec.ts` 在正常动画模式采样退出中间帧，验证位移轴、透明度、DOM 生命周期、嵌套返回、反复开关、跨断点与减弱动画，并覆盖信纸收起。每个退出采样附带 JSON 证据。
- 现有信纸翻页、祝福与片尾的叙事节奏保留；导航离开页面时不延迟路由等待装饰动画。新增外壳动画以 transform/opacity 为主，不增加动画运行时依赖。
