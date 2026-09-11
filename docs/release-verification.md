# 发布验证与任务收尾

所有任务在最终改动完成后执行此流程。局部回归用于定位问题，不替代完整发布门禁。

## 本地执行

使用 `.node-version` 指定的 Node 和 `package.json` 指定的 pnpm。首次安装浏览器：

```bash
pnpm exec playwright install chromium webkit
pnpm verify:release
```

`verify:release` 依次执行冻结锁文件安装、`check:release`、只读后端 API 探测，不上传文件、不修改线上数据。浏览器用模拟数据。端口默认 5184，可用 `E2E_PORT` 改为其他空闲端口；固定 `CI=true`，使用 Playwright 自带 Chromium 和 WebKit，不复用已运行的开发服务器。

`check:release` 与 GitHub CI 共用同一入口 `scripts/check-release.mjs`：

1. 全仓格式、样式架构、动画架构和 lint。
2. 全量单元测试，以两个 worker 限制内存竞争。
3. 预览和正式两种构建，分别检查 HTML 入口、资源 base、引用文件存在性、版本元数据与提交 SHA；正式产物不能包含编辑器预览入口。
4. 全量 Chromium E2E，以及 WebKit 音频、祝福和动画回归。
5. 最后再次检查格式，防止生成文件遗漏。

不要以放宽断言、增加重试、屏蔽失败来完成验收。失败时保留原因与日志，修复后重新完整执行。网络或环境受阻应写明未通过哪一步，不得宣称发布验证全部通过。

## Actions 与实际发布

CI 使用同一 `check:release`。失败时上传 Playwright 报告、截图和 trace，保留七天。部署工作流仍执行目标后端只读探测，并复用 `verify-build-artifact.mjs` 检查实际带版本号的产物。

推送 `main` 会在 CI 成功后自动发布预览。正式发布仍需手动确认。验证命令本身不代表用户授权推送或部署。

已获发布授权时，检查对应提交的 CI 和部署运行结论，预览检查各入口路由及 `/questions-next/version.json`，正式检查 `/questions/version.json` 与入口路由，核对提交、环境、版本和资源可访问性。不要用旧运行的成功替代当前提交验收。

最终回复应区分：本地发布门禁结果、后端探测结果、远端 Actions 结果和线上部署结果。尚未推送时明确远端未验证。
