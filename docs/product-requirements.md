# Questions 产品需求基线

## 项目边界

Questions 是独立 React 应用。旧 `home` 仓库在新应用验收前继续承载线上 `/questions`，只作为业务行为、接口契约和测试样本来源；不复制旧 Vue 组件结构。

新项目最终负责：答题会话、题目与本场线索、等级、通知、媒体、BGM、Letter、Bless、本地记录管理和 Questions 专属埋点。

## 核心模型

- 单题和多题使用同一个 `QuestSession`。
- `qa=3` 创建包含一题的 Session；`qas=1,3,5` 创建包含三题且保持 URL 顺序的 Session。
- 每道题拥有独立的 `QuestAttempt`，Session 只协调当前题、总进度与完成状态。
- 服务端状态、答题会话、本地持久化和纯 UI 状态不得混为一个全局 Store。

## 必须保留的行为

1. 按 `qa` 或 `qas` 读取题目，`qas` 在确实包含多题时优先。
2. `user` 参与进度隔离；为空时保持旧“旅行者”显示语义。
3. 填空答案执行 NFKC、去空白/标点、不区分大小写的比较，并支持 `answerList`。
4. 选择题按选项 key 作答；选错累计错误并按配置惩罚。填空题选错不累计惩罚。
5. `startTime` 前和 `endTime` 后禁止提交；`debug=1` 是遗留调试能力，生产是否保留需单独决策。
6. 答对后保存输入与完成时间，刷新可恢复；多题进入第一道未完成题。
7. 支持临时惩罚和 `-1` 永久锁定。
8. 全部题目完成后显示本场线索；最终关特效优先于组合完成特效。
9. 支持文本、图片、视频、链接和 Letter 线索，以及 AutoPlay 行为。
10. Letter 支持 `modern`、`classical`、`magic` 三种展示类型和 `from` 查询参数。

## 路由目标

| 功能     | 预览                            | 正式                       |
| -------- | ------------------------------- | -------------------------- |
| 答题     | `/questions-next/?qa=1`         | `/questions/?qa=1`         |
| 多题     | `/questions-next/?qas=1,2`      | `/questions/?qas=1,2`      |
| Letter   | `/questions-next/letter?from=x` | `/questions/letter?from=x` |
| Bless    | `/questions-next/bless?from=x`  | `/questions/bless?from=x`  |
| 本地记录 | `/questions-next/clearCache`    | `/questions/clearCache`    |

旧 `/letter` 在切换时由 OpenResty 308 到 `/questions/letter`，保留查询参数。

## 非目标（当前阶段）

- 不切换线上 `/questions`，不复刻旧 UI，不把 Vue 逐文件翻译成 React。
- 不启用 PWA、SSR、BFF 或容器运行时。
- 不在领域模型验证前决定最终视觉与动效方案。
