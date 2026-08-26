# 本地存储契约

`localStorage` 按 origin 隔离、不按路径隔离。新旧应用同在 `https://sitkin.top` 时可读取相同数据。迁移原则是“读旧、写新、暂不删旧”。

## 新命名空间

答题进度使用 `questions:v1:attempt:{userId}:{step}:{revision}`，值为 `{ version: 1, attempt: QuestAttempt }`。背景音乐设置使用 `questions:v1:bgm`，值为 `{ enabled: boolean, position?: { x: number, y: number } }`；位置使用 `0..1` 的视口比例保存，以便桌面与移动端尺寸变化后仍保持在屏幕边界内。多题答题区首访引导使用 `questions:v1:quest-answer-guide:{encodedUserId}`，用户确认或定位答题区后写入 `1`，同一用户后续不再展示。

## 必须兼容的旧 key

| 用途        | 格式                                   |
| ----------- | -------------------------------------- |
| 通关        | `qaIndex{step}{userId}{updated}`       |
| 惩罚        | `qa_penalty_{step}_{userId}_{updated}` |
| 升级动画    | `rankUpShown_{userId}_{rank}`          |
| 通知已读    | `notification_seen_ids`                |
| Letter 缓存 | `letter_records_cache`                 |

`progress.repository.ts` 已实现通关与惩罚记录的首次读取迁移，并用 Zod 防御损坏 JSON。`record-manager.ts` 只扫描表内旧 key 和 `questions:v1`，并使用当前关卡 step/revision 反解旧通关 key；不会列出或批量删除同源站点其他应用的数据。

`/clearCache` 支持旧 `type=qa / penalty / rankUp` 查询参数，也支持页面内按类型、step、用户和等级组合筛选。删除必须二次确认；解除惩罚会保留输入、错误次数和已完成状态。

等级升级反馈继续使用 `rankUpShown_{userId}_{rank}`。Rank 1 仅展示、不写升级记录；Rank 2 及以上或非数字特殊等级在真正显示反馈时写入 `1`，确保同一用户和等级只展示一次。

## 版本规则

- 结构变更必须增加版本号或新增迁移器；不直接改变旧 key 的解析语义。
- 存储失败不能改变内存中的答题正确性，但 UI 应提示进度可能无法恢复。
- 用户 ID、step 和 revision 的组合是兼容标识；领域内部仍以 PocketBase record id 作为 QuestId。
