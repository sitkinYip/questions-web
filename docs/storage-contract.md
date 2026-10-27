# Starward 本地存储契约

`localStorage` 按 origin 隔离、不按路径隔离。新旧应用同在 `https://sitkin.top` 时可读取相同数据。Starward 使用 `starward:*` 命名空间，兼容同结构的旧 `questions:*` 数据；更早的业务 key 继续按下表兼容。

## 新命名空间

答题进度使用 `starward:v1:attempt:{userId}:{step}:{revision}`，值为 `{ version: 1, attempt: QuestAttempt }`。背景音乐设置使用 `starward:v1:bgm`，值为 `{ enabled: boolean, position?: { x: number, y: number } }`；位置使用 `0..1` 的视口比例保存，以便桌面与移动端尺寸变化后仍保持在屏幕边界内。多题答题区首访引导使用 `starward:v1:quest-answer-guide:{encodedUserId}`，用户确认或定位答题区后写入 `1`，同一用户后续不再展示。

主题偏好使用 `starward:v1:theme`，值为 `{ version: 1, preference: "system" | "light" | "dark" }`。主题是当前浏览器中的应用级设备偏好，不按 `userId` 隔离；缺失、损坏或版本不匹配时回退到 `system`。合法的 `?theme=light|dark|system` 作为链接级初始偏好优先于此存储，但不会自动写入；用户从头像菜单选择后仍更新存储。刷新仍带合法 `theme` 的 URL 时再次以 query 为初始值。存储不可用时只影响刷新后的偏好恢复，不阻塞当前页面切换。

认证缓存使用 `starward:v2:auth`，只保存 `{ token, playerId }`，不保存密码。线索窗口、通知窗口和叙事关注记录同样使用 `starward:` 前缀。

`namespace.ts` 优先读取新 key，仅在新 key 缺失时读取旧 `questions:` 别名，并尝试复制到新 key。复制成功后尽力清理旧别名；复制失败仍返回旧值，旧值不会被删除。后续写入只写新 key，并清理对应旧别名。退出登录同时清理两个认证 key，避免旧登录被再次恢复；其他同源应用的数据不参与迁移或删除。

## 必须兼容的旧 key

| 用途        | 格式                                   |
| ----------- | -------------------------------------- |
| 通关        | `qaIndex{step}{userId}{updated}`       |
| 惩罚        | `qa_penalty_{step}_{userId}_{updated}` |
| 升级动画    | `rankUpShown_{userId}_{rank}`          |
| 通知已读    | `notification_seen_ids`                |
| Letter 缓存 | `letter_records_cache`                 |

`progress.repository.ts` 已实现通关与惩罚记录的首次读取迁移，并用 Zod 防御损坏 JSON。表内历史业务 key 继续保留。`record-manager.ts` 只扫描表内旧 key，以及已知的 `starward:v1` / `questions:v1` 答题和音频记录，并使用当前关卡 step/revision 反解旧通关 key；不会列出或批量删除同源站点其他应用的数据。

`/clearCache` 支持旧 `type=qa / penalty / rankUp` 查询参数，也支持页面内按类型、step、用户和等级组合筛选。删除必须二次确认；解除惩罚会保留输入、错误次数和已完成状态。

等级升级反馈继续使用 `rankUpShown_{userId}_{rank}`。Rank 1 仅展示、不写升级记录；Rank 2 及以上或非数字特殊等级在真正显示反馈时写入 `1`，确保同一用户和等级只展示一次。

## 版本规则

- 结构变更必须增加版本号或新增迁移器；不直接改变旧 key 的解析语义。
- 存储失败不能改变内存中的答题正确性，但 UI 应提示进度可能无法恢复。
- 外观和音频等非业务偏好存储失败不得阻塞页面使用；可以保持当前内存状态并在刷新后回退默认值。
- 用户 ID、step 和 revision 的组合是兼容标识；领域内部仍以 PocketBase record id 作为 QuestId。
