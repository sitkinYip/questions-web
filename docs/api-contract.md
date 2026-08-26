# API 契约

默认根地址：`https://api.sitkin.top/api/collections`，由 `VITE_API_BASE_URL` 覆盖。

| 数据     | 请求                                                  |
| -------- | ----------------------------------------------------- |
| 关卡     | `GET /levels/records`                                 |
| Letter   | `GET /letter/records`                                 |
| 短语     | `GET /phrase/records`                                 |
| 多题线索 | `GET /multi_quest_clues/records?filter=qas="1,2,3"`   |
| 通知     | `GET /notifications/records?filter=...&sort=-created` |

PocketBase 列表响应统一为 `items/page/perPage/totalItems/totalPages`。新应用必须先用 Zod 校验响应，再经 Adapter 转为领域模型；组件不得直接依赖 PocketBase 字段。

## Level 关键字段

- 标识：`id`, `step`, `updated`
- 类型：`type`（缺省视为填空题；`MultipleChoice` 为单选题）
- 内容：`title`, `question[]`, `options[]`
- 答案：`answer`, `answerList[]`
- 时间和惩罚：`startTime`, `endTime`, `penaltyConfig[]`（毫秒；`-1` 永久锁定）
- 完成：`isFinalLevel`, `FinalLevelConfig`, `autoNext`
- 展示：`thread`, `mainAudio`, `mainBgImg`, `avatar`, `rank`, `rankName`

`mainBgImg` 与 `avatar` 经安全 URL 过滤后映射为领域模型的背景与头像地址；背景只作为装饰层，头像提供与旅行者名称对应的替代文本。

`thread[]` 已声明文本、图片、视频、链接和 Letter 五种类型，并在 Adapter 中执行 URL 安全过滤。多题组合线索按 URL 中 `qas` 的原始顺序精确匹配，并通过独立 Zod schema 校验。

`FinalLevelConfig` 支持站内 `path` 或 HTTP(S) `link`，以及字符串 `query`。Adapter 会拒绝危险协议；界面在最终反馈和 AutoPlay 完成后提供继续入口，并附加编码后的 `returnTo`。

## Letter 关键字段

- 匹配与展示：`from`, `type`（`modern / classical / magic`）
- 文本：`title`, `desc`, `hintText`, `paragraphConfigList[]`
- 段落：`content`, `align`, `delay`, `audio`
- 媒体：`bgImages[]`, `bgImg`, `mainAudio`
- 节奏：`speed`（毫秒/字符）

Letter 页面只在存在 `from` 时请求集合并执行精确匹配。所有媒体先经过 URL 安全过滤；`returnTo` 仅允许站内根相对路径，防止开放重定向。

## Bless 关键字段

- 匹配与入口：`from`, `title`
- 主叙事：`phraseList[]` 的 `text`, `audio`, `duration`
- 谢幕：`takeABowList[]`，字段与主叙事一致
- 背景音乐：`mainAudio`

Bless 页面只在存在 `from` 时请求 Phrase 集合并执行精确匹配。配音与 BGM URL 均经过安全过滤；开始按钮提供浏览器音频授权，返回或卸载页面时停止全部音频。`returnTo` 仅接受站内根相对路径。

## 错误策略

- 所有数据请求默认 10 秒超时，并合并路由取消信号。
- HTTP 非 2xx 转为 `ApiError(kind=http)`，保留状态码。
- 超时、断网、调用方取消、无效 JSON 和 Zod 契约不兼容分别归类为 `timeout / network / cancelled / contract`。
- JSON 结构不兼容视为契约错误，不静默返回空数组。
- Query 层只重试网络、超时和服务端 5xx；不重试取消、契约错误和 4xx。
- UI 为可恢复错误提供重试；权限和契约错误给出明确维护提示，不执行无意义重试。
- 底层请求函数不直接调用 Toast，避免网络层依赖 UI。

## Questions 埋点

埋点使用独立的 `VITE_ANALYTICS_URL`，与 PocketBase 数据接口隔离。只有 `VITE_ANALYTICS_ENABLED=true` 且构建 base 为 `/questions/` 时允许发送；本地 `/` 和并行预览 `/questions-next/` 始终禁用。

事件以版本化 JSON 文本通过 `sendBeacon` 发送，失败时使用 `POST + keepalive` 非阻塞降级。为支持人工跟进答题和通过定向通知远程协助，答题事件包含原始/标准化回答、标准答案、题目与选项、错误/惩罚状态及会话进度；媒体、线索、通知和跳转事件保留可定位内容与 URL。
