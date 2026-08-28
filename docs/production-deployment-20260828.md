# 2026-08-28 正式部署记录

## 已上线

- 玩家：https://sitkin.top/questions/
- 业务管理后台：https://vae.sitkin.top/
- PocketBase：https://api.sitkin.top/；超级管理员入口为 /_/，仍使用用户自己设置的凭据。
- 新容器 questions-game-v1，镜像 questions-pocketbase:0.40.1-v1.1-amd64，镜像配置摘要 sha256:21176660b8d4792ee2715efffab644b417bb16abfc512a3911b27ae7de49c891。
- 数据目录 /opt/1panel/apps/questions-game-v1/pb_data；仅映射 127.0.0.1:8090:8090，现有 OpenResty 代理仍指向 8090。服务器 18090 已不再监听；Mac 的 19090 隧道和本次 SSH 维护连接也已关闭。
- 旧 pocketbase 已停止，Docker 与旧 Compose 的自动重启均关闭，旧目录和容器保留。未动主页、Halo、AList、MySQL 等服务。
- 玩家静态目录：/opt/1panel/apps/openresty/openresty/www/sites/questions-web/questions。
- 管理静态目录：/opt/1panel/apps/openresty/openresty/www/sites/vae.sitkin.top/index。部署为干净构建目录，未复制旧站点的 .git、日志等文件。

## 内容与账号

已迁移并发布 27 道题、4 份叙事、31 个场次，没有重复导入。创建业务管理员 sitkin_admin，以及体验账号 sitkin_preview；体验账号初始经验为 0，已定向下发全部 31 个场次，首次登录必须修改密码。密码只放在本机权限 600 的私密交接文件，不进入仓库、网站或此文档。

两名旧 migration_check 验收玩家和 content_import 临时管理员仍为停用。超级管理员未重置。真实奖品没有虚构配置；题目暂按每小关 50 XP、等级阈值 0/100/250/500/1000。正式接待前需复核奖品、领取信息、等级及时间窗。

## 安全与配置

游戏玩家、游戏管理员注册均关闭；另外确认 PocketBase 默认 users 集合为空后，关闭了该集合的公开注册。此项是生产数据配置，恢复旧快照或创建全新实例时须重新检查；可使用 backend/deploy/1panel/lock-unused-auth.pb.js 的独立维护命令，不要放入在线 hooks 目录。

已启用原有限速规则并加入游戏玩家登录 30 次/分钟、管理登录 20 次/分钟、改密 5 次/分钟。PocketBase 只信任 nginx 覆写的 X-Real-IP，后端只监听主机回环地址；不信任客户端任意 X-Forwarded-For。

API 上传上限调整为 3m，业务接口仍限 2500000 字节，头像限 2MB。保留原域名 Origin 限制。两端 index.html 使用 no-cache，避免后续发布继续读旧入口文件。nginx -t 通过；证书 OCSP 和无关站点同名警告属于既有配置，本次未扩大范围修改。

## 实际验证

公网 HTTPS 的 19 项检查通过：健康 200、未登录业务接口 401、业务管理员及玩家认证、27/4/31 内容计数、角色隔离、首次改密要求、三个认证集合拒绝公开注册、题目原始集合保护、72 字符密码返回 400、体验账号 31 条任务、两个正式来源的跨域预检。

两端首页和引用静态资源逐字节匹配发布包，玩家 login/profile/play 路由及管理 login/players/sessions 直达回退正常。浏览器实际打开两端正式登录页，页面渲染且未捕获控制台错误。本次尚未完成登录后生产页面的浏览器交互验收；既有本地真实后端及 72 项浏览器回归见验收说明，不能把它们当作此次生产浏览器测试。

最初本机企业网络拦截了正式域名，用户放行后已重新检查通过；不是生产服务器故障。验收报告在私密发布目录 production-verification-20260828.json。

## 备份与回退

服务器私密备份目录：/opt/1panel/backups/questions-cutover-20260828-01。

包含切换前新旧库离线备份、两端原静态目录、相关 nginx/Compose 配置、切换前就绪库、最终 production-final-data.tar.gz；SHA256SUMS 均已校验。最终库及正式配置另下载至本机 Downloads/questions-production-backup-20260828，哈希已核对。最终库在隔离容器中实际恢复，完整性、管理员登录、注册关闭及 27/4/31 内容通过；临时恢复容器及副本已清理。最终库 SHA256 为 6aefef7f9107529387265b2ddf8588ce71b69a961617fc02cb5d9773fdda010a。外部 OSS/AList 素材不包含在 PocketBase 数据备份中。

同目录保存 cutover.sh 和 rollback.sh。旧前端目录另以 -pre-v1.1-20260828 后缀保留。回退脚本必须显式传 --confirm-no-real-user-writes；有真实答题或核销后，必须先停写、保存新库并制定数据回退方案，不能直接退回旧库丢弃新业务。

源代码仍为未提交状态，没有提交、推送或修改 GitHub Secrets。后续自动发布仍需提交代码并配置仓库部署环境，不能认为服务器手工发布已经同步到 GitHub。

## 管理后台导航修复（2026-08-28 10:50）

管理端静态资源已更新至 index-D1lUy5Co.js，默认首页固定为用户管理，旧路径及旧登录回跳参数已处理。真实已登录浏览器验证首页、旧路由和退出后的账号登录页通过，原账号通过正式接口重新登录成功。此次未变更玩家端或后端。详细记录在相邻管理仓库 docs/admin-navigation-fix-20260828.md；原 v1.1 管理静态包仅作为历史发布记录保留。

## 本地开发与临时环境清理（2026-08-28）

两端日常开发恢复默认直连 https://api.sitkin.top，仅需 Node 24 与 pnpm 10.28.2。实际启动验证通过，无须本地 PocketBase、Docker 或 SSH 隧道。浏览器使用 localhost 或原 local.sitkin.top；API 允许这两种来源，127.0.0.1 来源仍被现有规则拒绝。页面写操作会影响线上真实数据，须使用专门的测试账号。

已停止 5188/5189 演示前端及随机 52134 测试后端，临时容器和其数据库目录由停止脚本自动删除。已删除本次 3 个 questions-pocketbase 本地镜像及 backend/deploy/runtime 下载缓存；未动其他项目、Docker 安装、正式发布归档和数据备份。后端源码、迁移、可选测试和打包脚本保留。

管理端保留 push main 自动部署；玩家端保留 push main 经 CI 发布预览、手动发布正式版。部署默认使用线上 API，不再要求 QUESTIONS_BACKEND_V1_READY；QUESTIONS_POCKETBASE_URL 为可选覆盖。后端 Docker CI 与管理端静态发布分开，只有后端文件变更才自动运行，且不更新线上容器。管理端协议检查新增 --admin-only，单独克隆仓库可运行。

本地 173 项玩家单元测试、8 项管理端单元测试、24 项 Chromium 浏览器回归、两端构建、协议检查、工作流 YAML 语法和无凭据的线上 API 探测通过。浏览器回归使用夹具，不读写线上业务数据；测试结束后其临时开发服务已退出。此轮没有修改页面 UI、重新部署、commit、push 或修改 GitHub Secrets；线上玩家端和管理端的 JS/CSS 文件名与这次本地正式构建一致。Actions 本身尚未在 GitHub 执行此轮修改。
