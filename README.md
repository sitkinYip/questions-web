# questions-web

Questions 的独立 React 游戏工程，正式玩家入口为 https://sitkin.top/questions/。

## 当前状态

2026-08-28 已完成新后端和两端正式替换，原容器停用、服务器验证端口关闭，公网认证、权限、内容和发布资源验收通过。管理后台为 https://vae.sitkin.top/；详见 [正式部署记录](./docs/production-deployment-20260828.md)。

- 管理员建账号，玩家首次改密、昵称和头像维护；注册不开放。
- 题目与场次分离，支持单题/多题、等级门槛、时间窗、指定玩家或全部有效玩家下发。
- 进度、判题、经验、奖品和核销由 PocketBase 服务端维护；重新下发产生独立任务，正常再给奖励。
- 复用现有主题、媒体、BGM、滑动导航、完成演出和 Letter/Bless；叙事内容需登录并解锁后读取。
- 旧客户端运营埋点已停用；退出/切换账号清理业务缓存。
- 新路由为 `/login`、`/`、`/profile`、`/rewards`、`/notifications`、`/play/:id`、`/play/:id/content/:contentId`。
- 原 `?qa=` / `?qas=`、独立 `/letter` / `/bless`、`/clearCache` 不再作为业务入口；旧模块仍保留供组件复用与测试，不承担新业务的权威状态。

设计与执行记录见 [后端设计](./docs/backend-rebuild-design.md)、[实施计划](./docs/backend-rebuild-plan.md)、[验收说明](./docs/backend-rebuild-verification.md)。后端代码和部署文档在相邻仓库 `sitkin-pb-backend-management/backend/`。

## 开发

只需 **Node.js 24、pnpm 10.28.2**，不需要 Docker、PocketBase 二进制、SSH 隧道或另一个仓库。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

默认直接连接 **https://api.sitkin.top**，不需要创建 `.env.local`。如果要改接口地址，再复制 `.env.example` 为 `.env.local`，设置 `VITE_POCKETBASE_URL` 为接口根地址（不含 `/api`）。不要在前端环境变量中放密码或管理令牌。

本地浏览器使用 `http://localhost:5173`，或沿用 `http://local.sitkin.top:5173`。旧媒体的 OSS 防盗链规则需要原开发域名；新电脑如需查看这些素材，在 hosts 中添加 `127.0.0.1 local.sitkin.top`。直接用 `127.0.0.1` 浏览会被线上来源规则拦截。

**本地页面操作的也是线上真实数据**：答题会记录进度、发放经验，后台下发/核销同样会生效。请使用专用测试账号，勿用真实玩家账号跑自动化测试。

### 检查与构建

以下单元测试和浏览器测试使用测试夹具，不依赖 Docker 或本地数据库；浏览器测试需先安装 Playwright 浏览器。

```bash
pnpm check
pnpm test:e2e
pnpm test:e2e:all
pnpm check:all
```

只有修改后端判题/结算/迁移逻辑时才需要另做隔离后端验收，见后台仓库 `backend/README.md`。这不是前端开发的前置步骤。

`verify:api` 等旧只读校验脚本仅供历史内容排查，不验证新游戏 API，不属于新版本验收流程。

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

GitHub Actions 默认使用线上 API，不再要求迁移期间的 `QUESTIONS_BACKEND_V1_READY` 变量。仅当目标接口不同于线上时，才在对应 Environment 设置可选变量 `QUESTIONS_POCKETBASE_URL`（HTTPS 根地址）。部署前会无凭据、只读探测新 API；普通本地构建不做网络探测。

push 到 `main` 并通过 CI 后，由 `Deploy Questions Preview` 工作流发布预览环境，也可手动触发。PR 检查不会触发发布。
GitHub 的 `preview` Environment 需要配置 `HOST`、`USERNAME`、`SSH_KEY`、
`SSH_KNOWN_HOSTS` 和 `QUESTIONS_ROOT` Secrets；可选的 `SSH_PORT` 配置为
Environment Variable。工作流只会同步到 `<QUESTIONS_ROOT>/questions-next/`，
不会写入主页部署目录。

正式环境通过 `Deploy Questions Production` 工作流手动发布。运行时必须勾选确认项；
工作流固定构建 `main` 最新提交并同步到 `<QUESTIONS_ROOT>/questions/`，只验证服务器文件，
不会修改 OpenResty。现有 `/questions/` 路由已上线，发布到该目录即可更新正式玩家端。

两种工作流只发布当前 Git 提交的静态构建，不上传 PocketBase 数据库或替换后端容器。此次迁移曾通过本地打包、SSH 上线；后续以前端仓库的 Actions 为常规发布入口。未提交、未 push 的本地修改不会出现在 Actions 中。

详细边界和验收标准见 [架构文档](./docs/architecture.md)。

答题页 UI 保留规则、逐状态基准与真实旧题验收入口见 [UI 保留审查](docs/question-ui-preservation.md)。

### 发布版本暗门

在登录页或主页左上角连续点指南针图标 5 次（每次间隔不超过 1.5 秒），打开「星图档案」。品牌文字仍然返回首页。档案显示当前已载入页面的版本、环境、实际 Git 提交号和本地时区的构建时间；查看旧页面时会如实显示旧版本。

预览与正式发布工作流分别使用 GitHub Actions 的 `run_number` 和 `run_attempt` 生成 `1.<发布序号>.<重跑次数>`。新运行递增发布序号，同一运行重试递增末位；两条航线独立编号，以环境加版本号区分。失败发布可能留下编号空档，不会为自增版本而提交代码或触发循环构建。

发布产物根目录的 `version.json` 与页面使用相同元数据，Actions 的部署摘要也会列出这些信息。未经过发布工作流的本地构建明确显示 `0.0.0-local`，不会冒充已发布版本。
