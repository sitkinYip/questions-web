# questions-web

Questions 的独立 React 重写工程。旧 `home` 项目的线上 Questions 页面在本项目验收完成前保持不变。

## 当前状态

- React 19 + TypeScript 6 + Vite 8 工程已建立。
- 已定义统一的 `QuestSession / Quest / QuestAttempt` 领域模型。
- 已实现答案标准化、时间窗口、单/多题推进和选择题惩罚的纯逻辑。
- 已实现旧通关/惩罚 localStorage key 到 `questions:v1` 的兼容迁移。
- 已建立 PocketBase Level 的 Zod schema 与 Adapter 边界。
- 已实现旧内容标记的安全 AST 解析与 React 渲染，不使用 HTML 注入。
- 已支持题目图片/图片组、选择题媒体和统一全屏图片/视频查看器。
- 已支持五类通关线索、首条 `AutoPlay` 以及安全的 Letter/链接跳转。
- 已实现多题顺序解锁、延迟 `autoNext`、恢复至首道未完成题和全部完成后的组合线索。
- 已实现最终关优先反馈、最终 AutoPlay 时序及 `FinalLevelConfig` 安全继续入口。
- 已实现 Letter 真实数据、modern/classical/magic 三种信件、逐段打字/配音/BGM 和安全返回。
- 已实现 `/clearCache` 新旧记录扫描、精确筛选、解除惩罚、单条删除与批量清理。
- 已实现会话等级展示、多题最高等级、一次性升级反馈和 `rankUpShown` 兼容记录。
- 已实现按用户过滤的实时通知、可见性轮询、兼容已读记录、顺序弹窗队列和安全富内容预览。
- 已实现关卡 BGM 自动播放授权、播放偏好记忆，以及视频期间暂停、结束后按用户意图恢复。
- 已实现面向人工远程协助的 Questions 类型化运营埋点，包含答题对照与完整进度，使用 Beacon/keepalive 非阻塞发送并强制隔离预览环境。
- 已实现 10 秒请求超时和 HTTP/网络/取消/契约错误分级，以及桌面与移动视口的 Playwright 核心流程验收。
- 已接入关卡 `mainBgImg/avatar` 视觉字段，并完成弹窗焦点圈定/回收、键盘答题、44px 触控目标和 reduced-motion 验收。
- 已实现多题导航活动 Tab 自动居中，并支持在题卡非交互区域横向滑动切换已解锁题目。
- 已将关卡 BGM 控件恢复为视口固定浮标，支持拖拽、位置记忆和 `Alt + 方向键` 调整。

## 开发

```bash
pnpm install
pnpm dev
pnpm check
pnpm test:e2e
pnpm test:e2e:all
pnpm check:all
pnpm verify:api
pnpm verify:letter
pnpm verify:notifications
```

复制 `.env.example` 为 `.env.local` 可覆盖 API 和部署 base。
本地浏览器应访问 `http://local.sitkin.top:5173`，不要使用 `127.0.0.1:5173`，以满足线上接口的域名策略。

## 部署 base

| 环境     | `VITE_PUBLIC_BASE` |
| -------- | ------------------ |
| 本地     | `/`                |
| 并行预览 | `/questions-next/` |
| 正式     | `/questions/`      |

```bash
pnpm build:preview
pnpm build:production
```

`main` 的 CI 通过后，由 `Deploy Questions Preview` 工作流发布预览环境，也可手动触发。
GitHub 的 `preview` Environment 需要配置 `HOST`、`USERNAME`、`SSH_KEY`、
`SSH_KNOWN_HOSTS` 和 `QUESTIONS_ROOT` Secrets；可选的 `SSH_PORT` 配置为
Environment Variable。工作流只会同步到 `<QUESTIONS_ROOT>/questions-next/`，
不会写入主页部署目录。

详细边界和验收标准见 [架构文档](./docs/architecture.md)。
