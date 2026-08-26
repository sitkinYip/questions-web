# 验收清单

## 垂直切片

- [x] `qa` 解析一题，`qas` 创建保持顺序的多题 Session。
- [x] API 非 2xx、超时和 schema 错误有不同错误状态。
- [x] 填空题与选择题都可完成，备选答案和旧标准化规则一致。
- [x] 选择题错误次数、临时惩罚、永久惩罚一致。
- [x] Repository 可从旧 key 或新 key 恢复进度。
- [x] 多题进入第一道未完成题，全部完成时产生 Session completed。
- [x] 多题活动 Tab 自动保持可见，已解锁题目支持横向滑动切换。
- [x] 开始/结束时间边界有测试。

## 回归与质量

- [x] 领域逻辑单测和旧存储迁移单测。
- [x] API schema fixture 与首批组件状态测试。
- [x] 高亮、链接、图片、视频与换行标记解析测试。
- [x] 危险 URL 协议和 HTML 注入防御测试。
- [x] 题目图片、图片组和视频查看器组件测试。
- [x] 选择题媒体查看与答案选择行为隔离测试。
- [x] 图片键盘导航、Escape 关闭和视频播放状态测试。
- [x] Playwright 端到端测试。
- [x] 桌面与移动端键盘、焦点、触控和 reduced-motion 验证。
- [x] BGM 控件固定于视口、支持拖拽/键盘移动并在刷新后恢复位置。
- [x] `/bless` 在独立应用内完成 Phrase 加载、叙事/BGM/谢幕播放，并可安全返回原答题参数。
- [x] 全局模态弹窗统一使用 Radix 交互内核，并通过 Overlay Provider 处理并发优先级。
- [x] Button、Input、Select、Sheet 与 Toast 具备统一接口、交互状态和组件级测试。
- [x] 答题页具备环境光、题目转场、正误反馈和通关仪式动效，并完整支持 reduced-motion 降级。
- [x] 默认主题跟随 `prefers-color-scheme`，设备主题变化可实时更新且不覆盖显式用户选择。
- [x] `theme=light|dark|system` 可覆盖链接初始主题，非法值安全回退且不禁用头像菜单切换。
- [x] 头像主题菜单支持 system/light/dark、刷新持久化及无头像首字回退入口。
- [x] 全局结构 CSS 使用语义主题 Token；Quest、记录页、布局和通用控件禁止新增颜色字面量。
- [x] 浅色 Quest、主题菜单与原暗金深色界面完成实际浏览器截图验收。
- [x] `pnpm check` 通过且锁文件无漂移。

## 预览与切换

- [x] `base=/questions-next/` 的构建资源路径正常。
- [ ] OpenResty 对 `/questions-next/**` 的 history fallback 正常。
- [ ] 主页 Service Worker 不拦截 `/questions-next/` 与 `/questions/` 的导航及静态资源请求。
- [x] 预览环境禁用生产埋点。
- [ ] OpenResty 配置已备份，旧站可一键回滚。
- [ ] `/letter` 重定向保留 query。
- [ ] `/bless` 重定向保留 query，旧根路径不再承载新 Questions 的最终跳转。
- [ ] 切换后 `/questions/**` 刷新不返回主页 index.html。
