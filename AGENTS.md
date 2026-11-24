# 任务完成标准

本仓库每项任务完成后都必须验证发布流程，包括 UI、动画、重构、配置和文档任务。

- 涉及界面、样式、主题、动效或响应式布局改动时，先激活项目 skill `starward-aurora-glass-ui`（`.agents/skills/starward-aurora-glass-ui/SKILL.md`）并阅读 [极光玻璃 v2 设计规范](docs/design-system-aurora-glass-v2.md)，改完后须对真实路由进行移动/桌面与深/浅主题实拍核验。
- 先阅读 [发布验证流程](docs/release-verification.md)，使用 `questions-web-release-verification` skill（若已安装）。
- 所有改动落定后运行 `pnpm verify:release`；不能用普通 `pnpm build`、部分测试或上次成功结果代替。
- 修复失败后重新跑完整门禁。不得删除断言、跳过测试或放宽标准来获得通过结果。
- 汇报实际命令、通过数量、失败或受阻环节，区分本地验证、远端 CI、实际部署。未执行的环节必须明确说明。
- 发布验证不等于上线授权；提交、推送和实际部署按用户授权执行。若已授权发布，跟踪对应提交的 Actions 直到结束，并核对线上版本及路由。
