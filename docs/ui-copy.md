# 前端文案管理

统一入口：[src/config/ui-copy.ts](../src/config/ui-copy.ts)。

本次整理覆盖 75 个前端源码文件及 HTML 元信息，包含移动端与桌面端答题页，以及登录、场次、护照、收藏、通知、信件、祝福和本地记录管理等配套页面。

配置中共收录 **520 个文案值或动态模板**：459 个静态字符串、61 个动态文案函数。相同原文通过文件顶部的 `common` 复用，各功能分组保留自己的语义键名。这个数量按配置定义计算，包含默认文案、无障碍标签和英文装饰文字，不等同于某一屏同时可见的文案数量。

## 在哪里改

| 界面或用途                         | 配置分组                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 浏览器标题、页面描述               | `document`                                                                                                                                                                           |
| 答案输入、提交、下一题、惩罚倒计时 | `questAnswerForm`                                                                                                                                                                    |
| 题号、题型、开放时间、答题引导     | `questCard`、`desktopQuestCard`                                                                                                                                                      |
| 正确、错误、锁定、通关反馈         | `gamePlayPage`、`questSessionView`、`answerFeedback`                                                                                                                                 |
| 组合通关、最终旅程、升级           | `completionFeedbackDialog`、`finalDestinationPrompt`、`rankUpDialog`                                                                                                                 |
| 线索及其弹窗                       | `cluePanel`、`clueTextDialog`、`multiClueLauncher`、`multiQuestClueDialog`、`narrativeAttentionBeacon`                                                                               |
| 桌面线索手记、线索视频             | `desktopClueShelf`、`desktopClueVideoTrigger`                                                                                                                                        |
| 题目图片、选项、音视频             | `questContent`、`choiceOptions`、`mediaViewer`、`nativeVideo`、`bgmControls`                                                                                                         |
| 登录、密码、昵称、头像             | `gameLoginPage`、`authLayout`、`passwordEditor`、`passwordInput`、`profileEditor`、`gameProfileValidation`、`useProfileEditor`                                                       |
| 场次列表、参与条件、入口说明       | `gameDashboard`、`gamePresentation`、`assignmentCard`、`assignmentBrief`                                                                                                             |
| 导航、侧栏、主题、护照             | `gameLayout`、`gameNavigation`、`gameNavigationControl`、`gameSidebar`、`gameSidebarIdentity`、`playerPassport`、`themeMenu`、`gameThemePicker`、`gameProfilePage`、`desktopProfile` |
| 加载、重试和接口默认报错           | `gameLoadingScreen`、`gameState`、`gameRequestFeedback`、`gameContext`、`questEntryPage`、`apiErrorState`、`errors`、`gameClient`、`request`、`client`                               |
| 通知及来信列表                     | `notificationCenter`、`notificationDialog`、`notificationLetter`、`gameNotificationCenter`、`gameNotificationsPage`、`desktopInbox`、`toast`、`toastProvider`                        |
| 收藏和奖品领取                     | `gameRewardsPage`                                                                                                                                                                    |
| 信件、祝福                         | `letterControls`、`letterExperience`、`letterPage`、`letterAdapter`、`gameNarrativePage`、`blessExperience`、`blessPage`、`blessClosingCredits`                                      |
| 本地记录、版本信息、其他通用界面   | `clearCachePage`、`versionSecret`、`sheet`、`richContent`、`levelAdapter`、`celestialAtlas`                                                                                          |

每个分组上方标明对应源码路径，完整原文均在配置文件中，可直接搜索原句定位。

## 修改方式

例如，修改答题按钮只需编辑：

```ts
questAnswerForm: {
  // ...其他配置
  submit: "提交答案",
  next: "前往下一题",
}
```

组件通过 `uiCopy.questAnswerForm.submit` 读取配置。若配置值是 `common.xxx`，修改文件顶部对应共享值，会同步影响使用该文案的所有页面；若某处需要单独措辞，可将该分组的属性改为独立字符串。

带题号、日期、数量、昵称的文案使用函数，保留参数及其插入位置即可。例如 `common.questionNumber(step)` 返回 `第 ${step} 题`。日期、倒计时等业务格式化仍在原有代码中完成，然后传入文案函数。

`document.title` 和 `document.description` 经 Vite 注入 HTML，开发与生产构建使用同一份配置；修改后需重新构建并发布才会影响线上页面。HTML 特殊字符会转义。

## 内容边界

题目标题、题干、选项正文、标准答案、线索正文、通知内容、玩家与等级名称、信件、祝福、奖品描述等由接口返回；它们继续由后台管理。前端在这些字段缺失时使用的原有默认值已迁入配置，后台优先级保持不变。服务端返回的错误消息仍优先展示，接口客户端自带的错误兜底已收录。

测试与演示数据、开发者诊断异常、控制台日志、埋点日志、接口协议枚举、路由、CSS 类名、快捷键和纯排版符号不属于界面文案，仍留在原处。新增界面文案应继续放入这个配置文件。

修改后运行 `pnpm check`，涉及交互或布局时再运行对应 Playwright 用例。

## 导入路径

项目使用 `@/` 指向 `src/`。例如文案配置统一这样导入：

```ts
import { uiCopy } from "@/config/ui-copy";
```

组件、类型、动态导入、测试 mock 和样式 `@import` 同样使用别名。同级模块也使用完整的 `@/` 路径。

`@scripts/` 指向 `scripts/`，`@e2e/` 指向 `e2e/`。TypeScript 映射在根 `tsconfig.json`，Vite/Vitest 运行时映射在 `vite.config.ts`；E2E 文件由 `e2e/tsconfig.json` 管理并继承这些别名，编辑器、Playwright 和 `pnpm typecheck` 使用同一套映射。独立 Node 校验脚本通过 `--import ./scripts/register-aliases.mjs` 加载相同映射，现有 `pnpm verify:*` 命令已配置好。

Vite 配置文件自身的两条启动导入保留相对路径，因为此时别名尚未初始化。配置里的文件系统路径、HTML 资源地址、路由和文档链接不属于模块导入。
