# 架构决策

```text
features / routes
        ↓
application orchestration
        ↓
domain (pure TypeScript)
        ↑
api adapters / storage repositories
```

- `domain` 不导入 React、浏览器 API、TanStack Query 或 PocketBase 类型。
- `api` 校验外部数据并转换成领域对象。
- `infrastructure` 实现 localStorage 等可替换端口。
- `features` 组合查询、Session 命令和 UI，不重写判断规则。

## 已采用

- React + TypeScript + Vite；React Router 管理应用内路由，部署 base 由环境变量决定。
- TanStack Query 只管理服务端状态；Zod 位于外部输入边界；Vitest 覆盖领域与迁移器。
- `components/ui` 以 Radix Primitives 作为无障碍交互内核，业务组件保留各自视觉样式，不直接重复实现 Portal、焦点陷阱和 Escape 行为。
- `OverlayProvider` 统一调度全局弹层；通关、确认、内容、等级和通知按优先级排队，同一时刻只向用户呈现一个模态弹窗。
- `ThemeProvider` 只管理应用级外观偏好，不进入 domain 或 QuestSession。偏好由 storage repository 持久化，解析后的 `light / dark` 写入 `html[data-theme]`，CSS 只消费语义 Token。
- Button、表单、Sheet 和 Toast 的接口及状态归属记录在 [`docs/ui-system.md`](./ui-system.md)。

## 主题解析链路

```text
index.html 启动脚本
  ├─ 读取合法 theme query
  ├─ 回退 questions:v1:theme
  └─ system 查询 prefers-color-scheme
             ↓ 首次绘制前
       html[data-theme]
             ↓ React 接管
ThemeProvider ── 监听设备变化 / storage 事件
             ↓
语义 CSS Token ── 全局结构色 / feature 局部配色
```

- 存储的是 `system / light / dark` 偏好，DOM 上只暴露解析后的 `light / dark`，避免 CSS 同时承担偏好解析。
- 合法的 `?theme=light|dark|system` 是链接级初始偏好，优先于本地存储但不自动写入；用户菜单仍可在当前页面覆盖并保存选择，刷新带参链接时重新应用链接初始值。
- `system` 状态实时响应设备主题变化；显式选择 light 或 dark 后设备变化不覆盖用户选择。
- 启动脚本与 Provider 使用相同的版本化存储结构，确保 React 挂载前后没有主题闪烁。
- Letter 正文、Bless 星空和媒体剧场属于内容自有的沉浸式场景，明确使用固定或局部主题；其余应用外壳继续响应全局主题。

## 测试边界

- Vitest 覆盖领域逻辑、Schema、存储迁移、请求错误分类与组件行为。
- Overlay 测试覆盖并发弹窗优先级及高优先级关闭后的队列恢复。
- Theme 测试覆盖损坏存储回退、query 优先级、非法 query 回退、设备主题变化、显式覆盖、刷新持久化、无头像入口和头像菜单键盘语义。
- Playwright 使用 API 路由拦截覆盖单题恢复、多题组合、媒体预览、惩罚和错误恢复；默认运行桌面 Chrome，可通过 `test:e2e:all` 同时运行 Pixel 7 移动视口。
- Playwright 失败产物保留截图、HTML 报告和 trace，不录制视频以避免额外 FFmpeg 运行时依赖。

## 延后引入

- 不预设 Redux/Zustand/XState，垂直切片证明 React reducer 不足后再引入。
- MSW 仅在需要更复杂的组件级网络模拟时再引入。
- PWA 在主页根作用域 Service Worker 完成隔离后再评估。
