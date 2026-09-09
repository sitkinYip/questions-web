/** 前端界面文案：按组件/功能分组。动态内容使用函数参数，后台返回的内容优先。
 * 修改文案后运行 pnpm check。完整范围和维护说明见 docs/ui-copy.md。
 */

const common = {
  multiClue: "多题本场线索",
  unexpectedEyebrow: "Unexpected failure",
  unexpectedTitle: "发生了未预期的错误",
  cancelledTitle: "请求已取消",
  accountChanged: "账号已切换",
  incompatibleVersion: "服务端数据版本不匹配，请联系管理员",
  openHint: "点击开启信件",
  questionNumber: (step: string | number | null | undefined) => `第 ${step} 题`,
  cancelled: (resource: string | number | null | undefined) =>
    `已取消加载${resource}`,
  closeTitle: (title: string | number | null | undefined) => `关闭${title}`,
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
  avatarFallback: "旅",
  avatarAlt: (displayName: string | number | null | undefined) =>
    `${displayName}的头像`,
  title: "界面主题",
  pause: "暂停背景音乐",
  play: "播放背景音乐",
  dragInstructions: "可拖拽移动；键盘用户可按 Alt 加方向键调整位置。",
  back: "返回",
  backToQuest: "返回冒险",
  emptyTitle: "星空沉寂",
  retry: "重新尝试",
  completed: "已完成",
  progress: "答题进度",
  traveler: "旅行者",
  text: "古老密卷",
  video: "时空回溯",
  letterWaiting: "一封来信等待开启",
  blessingWaiting: "一份祝福正在回响",
  multiClueLauncherTitle: "查看本场线索",
  multiQuestClueDialogTitle: "隐藏的本场线索",
  eyebrow: "IMPORTANT SIGNAL",
  finalTitle: "所有迷雾已经消散",
  combinedTitle: "组合谜题全部破解",
  continueJourney: "继续旅程",
  label: "题目内容",
  gameContextEyebrow: "Quest session",
  penalty: "回答错误，已进入惩罚时间。",
  incorrect: "答案不正确，可以继续尝试。",
  allCompleted: "全部题目已经完成。",
  correct: "回答正确，当前题目已完成。",
  emptyAnswer: "请先输入或选择答案。",
  home: "回到首页",
  questionNavigation: "题目导航",
  videoPlaying: "视频正在播放",
  videoStopped: "视频未播放",
  menu: "冒险者菜单",
  experience: (totalXp: string | number | null | undefined) => `${totalXp} EXP`,
  navigation: "个人导航",
  gameSidebarBackToQuest: "返回答题",
  backHint: "接着刚才的线索继续",
  logout: "退出登录",
  brand: "QUESTIONS",
  tagline: "答案之外 · 另有天地",
  gameSidebarIdentityLabel: "冒险者名片",
  gameSidebarIdentityTitle: "冒险者护照",
  read: "已收下",
  saving: "正在保存…",
  username: "登录账号",
  untitled: "未署名的线索",
  open: "打开这份线索 ",
  desktopClueVideoTriggerPlay: "播放线索影像",
  desktopProfileLabel: "我的名片",
  choice: "选择题",
  desktopQuestCardText: "填空题",
  startsAt: (value1: string | number | null | undefined) =>
    `开放时间：${value1}`,
  endedAt: (value1: string | number | null | undefined) =>
    `已于 ${value1} 结束`,
  notificationsDescription: "旅途来信",
  details: "查看详情",
  disabled: "全文显示后可翻页",
  turning: "翻页中",
  unsupported: "当前浏览器无法播放此视频。",
  versionSecretTitle: "星图档案",
};

export const uiCopy = {
  document: {
    title: "向着星辰的冒险",
    description: "答案之外，另有天地。循着线索，走进属于你的解谜故事。",
  },
  // src/api/client.ts
  client: {
    notifications: "实时通知",
    notificationApi: "通知接口",
    multiClue: common.multiClue,
    levels: "关卡数据",
    levelApi: "关卡接口",
    letters: "信件数据",
    letterApi: "信件接口",
    blessing: "专属星空",
    blessingApi: "专属星空接口",
  },
  // src/api/errors.ts
  errors: {
    unexpectedEyebrow: common.unexpectedEyebrow,
    unexpectedTitle: common.unexpectedTitle,
    retryHint: "请稍后重新尝试。",
    timeoutEyebrow: "Request timed out",
    timeoutTitle: "连接等待超时",
    timeoutDetail: "PocketBase 在限定时间内没有响应，请检查网络后重试。",
    networkEyebrow: "Network unavailable",
    networkTitle: "网络连接中断",
    networkDetail: "浏览器无法连接到数据服务，请检查网络或域名访问策略。",
    contractEyebrow: "Data contract changed",
    contractTitle: "数据格式发生变化",
    contractDetail: (message: string | number | null | undefined) =>
      `${message}。请联系维护者检查 PocketBase 字段配置。`,
    serviceEyebrow: (status: number | undefined) =>
      `Service response ${status ?? "error"}`,
    serviceDetail: (message: string, status: number | undefined) =>
      `${message}${status ? `（HTTP ${status}）` : ""}`,
    deniedTitle: "数据服务拒绝访问",
    unavailableTitle: "数据服务暂时不可用",
    deniedDetail: "当前域名或访问规则没有获得 PocketBase 授权。",
    cancelledEyebrow: "Request cancelled",
    cancelledTitle: common.cancelledTitle,
    cancelledDetail: "页面导航取消了本次读取。",
  },
  // src/api/game.client.ts
  gameClient: {
    accountChanged: common.accountChanged,
    cancelled: common.cancelledTitle,
    incompatibleVersion: common.incompatibleVersion,
    invalidCredentials: "账号或密码不正确",
    requestFailed: "请求失败，请检查输入或联系游戏管理员",
    timeout: "连接等待超时，请稍后重试",
    connectionLost: "连接中断，提交可能已生效；请重试原操作确认结果",
  },
  // src/api/letter.adapter.ts
  letterAdapter: {
    classicalHint: "亲启",
    openHint: common.openHint,
  },
  // src/api/level.adapter.ts
  levelAdapter: {
    questionNumber: common.questionNumber,
  },
  // src/api/request.ts
  request: {
    cancelled: common.cancelled,
    loadFailed: (resource: string | number | null | undefined) =>
      `无法加载${resource}`,
    invalidJson: (resource: string | number | null | undefined) =>
      `${resource}返回了无效 JSON`,
    timeout: (resource: string | number | null | undefined) =>
      `加载${resource}超时`,
    connectionFailed: (resource: string | number | null | undefined) =>
      `无法连接${resource}`,
    failed: (resource: string | number | null | undefined) =>
      `加载${resource}失败`,
    incompatibleData: (resource: string | number | null | undefined) =>
      `${resource}返回了不兼容的数据`,
  },
  // src/components/effects/CelestialAtlas.tsx
  celestialAtlas: {
    north: "N",
    south: "S",
  },
  // src/components/ui/PasswordInput.tsx
  passwordInput: {
    hidePassword: "隐藏密码",
    showPassword: "显示密码",
  },
  // src/components/ui/Sheet.tsx
  sheet: {
    eyebrow: "旅途随行",
    closeTitle: common.closeTitle,
  },
  // src/components/ui/ThemeMenu.tsx
  themeMenu: {
    system: common.system,
    systemDescription: "随设备外观自动切换",
    light: common.light,
    lightDescription: "暖象牙纸与古金",
    dark: common.dark,
    darkDescription: "暗夜与香槟金",
    avatarFallback: common.avatarFallback,
    switchLabel: (value1: string | number | null | undefined) =>
      `切换主题，当前为${value1}`,
    switchTitle: "切换主题",
    avatarAlt: common.avatarAlt,
    title: common.title,
    currentTheme: (theme: string) => `当前显示为${theme}`,
  },
  // src/components/ui/Toast.tsx
  toast: {
    closeTitle: common.closeTitle,
  },
  // src/components/ui/ToastProvider.tsx
  toastProvider: {
    label: "冒险通知",
    shortcutLabel: "冒险通知（Alt+T）",
  },
  // src/features/audio/BgmControls.tsx
  bgmControls: {
    title: "背景音乐提示",
    description: "浏览器需要一次手动确认，之后会记住你的选择。",
    enable: "开启背景音乐",
    enableDescription: "开启背景音乐，也可以稍后使用悬浮音乐按钮",
    pause: common.pause,
    play: common.play,
    playing: "当前正在播放",
    paused: "当前已暂停",
    dragInstructions: common.dragInstructions,
  },
  // src/features/bless/BlessClosingCredits.tsx
  blessClosingCredits: {
    label: "星空谢幕",
    play: "开始播放",
  },
  // src/features/bless/BlessExperience.tsx
  blessExperience: {
    enter: "点此 进入属于你的璀璨星空",
    back: common.back,
    backToQuest: common.backToQuest,
    pause: common.pause,
    play: common.play,
  },
  // src/features/bless/BlessPage.tsx
  blessPage: {
    emptyTitle: common.emptyTitle,
    missingToken: "缺少星空凭证 from 参数。",
    loading: "正在汇聚星光…",
    notFound: "这片星域尚未被点亮，请检查星空凭证 from 是否正确。",
    retry: common.retry,
  },
  // src/features/cache/ClearCachePage.tsx
  clearCachePage: {
    progressRecords: "新版答题记录",
    legacyCompletedRecords: "旧版通关记录",
    legacyPenaltyRecords: "旧版惩罚记录",
    rankRecords: "等级动画记录",
    notificationRecords: "通知已读记录",
    letterCache: "Letter 数据缓存",
    audioPreference: "背景音乐偏好",
    unknownRank: "未知",
    damagedRecord: "记录内容损坏，可安全删除",
    unanswered: "未作答",
    incorrect: "回答错误",
    penalized: "惩罚中",
    completed: common.completed,
    attemptSummary: (
      value1: string | number | null | undefined,
      wrongCount: string | number | null | undefined,
    ) => `${value1} · 错误 ${wrongCount} 次`,
    rank: (value1: string | number | null | undefined) => `等级 ${value1}`,
    currentFormat: "当前格式",
    legacyFormat: "兼容旧格式",
    deleted: (length: string | number | null | undefined) =>
      `已删除 ${length} 条本地记录。`,
    released: (cleared: string | number | null | undefined) =>
      `已解除 ${cleared} 条惩罚记录。`,
    operationFailed: "浏览器拒绝了本次本地记录操作，请检查存储权限后重试。",
    eyebrow: "Local memory ledger",
    title: "本地记录管理",
    description:
      "仅管理 Questions 已知命名空间；同域名下其他应用的数据不会出现在这里。",
    back: common.back,
    metadataFailed:
      "无法读取最新题目元数据；新版记录仍可管理，部分旧记录可能无法识别 step。",
    overview: "记录概览",
    allRecords: "全部记录",
    currentRecords: "新版格式",
    legacyRecords: "旧版兼容",
    damagedRecords: "损坏记录",
    filterLabel: "筛选本地记录",
    recordType: "记录类型",
    allQuestionsRecords: "全部 Questions 记录",
    progress: common.progress,
    penalty: "惩罚记录",
    rankAnimation: "等级动画",
    otherRecords: "通知、音频与 Letter 缓存",
    step: "题目 step",
    allSteps: "全部",
    userId: "用户 ID",
    allUsers: "全部用户",
    level: "等级",
    allLevels: "全部等级",
    resultsEyebrow: "Matched records",
    matchCount: (length: string | number | null | undefined) =>
      `${length} 条匹配记录`,
    releaseAll: "解除全部惩罚",
    deleteFiltered: "删除筛选记录",
    listLabel: "本地记录列表",
    damaged: "损坏",
    stepLabel: "Step",
    user: "用户",
    traveler: common.traveler,
    release: "解除惩罚",
    delete: "删除记录",
    emptyTitle: "当前范围没有记录",
    emptyDescription: "调整筛选条件，或返回答题页面继续冒险。",
    deleteDialogTitle: "确认删除本地记录",
    releaseDialogTitle: "确认解除惩罚",
    confirmEyebrow: "Confirm local change",
    deleteHeading: "确认删除本地记录？",
    releaseHeading: "确认解除惩罚？",
    affectedCount: (length: string | number | null | undefined) =>
      `将影响 ${length} 条明确列出的 Questions 记录。`,
    irreversible: "删除后无法从浏览器恢复。",
    cancel: "取消",
    confirmDelete: "确认删除",
    confirmRelease: "确认解除",
  },
  // src/features/clues/CluePanel.tsx
  cluePanel: {
    text: common.text,
    image: "神谕影像",
    video: common.video,
    link: "位面传送",
    letter: "星海情笺",
    bless: "星辉祝福",
    eyebrow: "Unlocked archive",
    title: "通关线索",
    unlockedCount: (length: string | number | null | undefined) =>
      `已解锁 ${length} 件线索`,
    unlockedSuffix: "件已解锁",
    preview: "点击查看已解锁内容",
    letterWaiting: common.letterWaiting,
    blessingWaiting: common.blessingWaiting,
    verified: "Archive verified",
    narrativeUnlocked: "叙事内容已解锁",
  },
  // src/features/clues/ClueTextDialog.tsx
  clueTextDialog: {
    text: common.text,
    close: "关闭线索",
    eyebrow: "Decoded fragment",
  },
  // src/features/clues/MultiClueLauncher.tsx
  multiClueLauncher: {
    title: common.multiClueLauncherTitle,
    eyebrow: "UNLOCKED ARCHIVE",
    dragInstructions:
      "已解锁组合线索。可拖拽移动并自动贴边；键盘用户可按 Alt 加方向键调整位置。",
  },
  // src/features/clues/MultiQuestClueDialog.tsx
  multiQuestClueDialog: {
    title: common.multiQuestClueDialogTitle,
    eyebrow: "Combined revelation",
    description: "该本场线索会保留在当前会话中。",
    acknowledge: "我知道了",
  },
  // src/features/clues/NarrativeAttentionBeacon.tsx
  narrativeAttentionBeacon: {
    letterWaiting: common.letterWaiting,
    blessingWaiting: common.blessingWaiting,
    importantContent: "重要内容",
    eyebrow: common.eyebrow,
    unlocked: "重要内容已解锁",
  },
  // src/features/completion/CompletionFeedbackDialog.tsx
  completionFeedbackDialog: {
    finalTitle: common.finalTitle,
    combinedTitle: common.combinedTitle,
    finalEyebrow: "Final covenant",
    combinedEyebrow: "Quest set complete",
    finalDescription: "最终契约已经达成。接下来将依次揭示通关线索与旅程出口。",
    combinedDescription: (completedCount: string | number | null | undefined) =>
      `你已完成本次组合中的 ${completedCount} 道谜题。`,
    revealFinal: "揭示最终线索",
    viewCombined: "查看组合结果",
  },
  // src/features/completion/FinalDestinationPrompt.tsx
  finalDestinationPrompt: {
    label: "最终旅程出口",
    eyebrow: "Passage unlocked",
    title: "最终旅程入口已经开启",
    later: "稍后前往",
    continueJourney: common.continueJourney,
  },
  // src/features/content/RichContent.tsx
  richContent: {
    label: common.label,
  },
  // src/features/errors/ApiErrorState.tsx
  apiErrorState: {
    retry: common.retry,
  },
  // src/features/game/GameContext.tsx
  gameContext: {
    loginAgain: "重新登录",
    eyebrow: common.gameContextEyebrow,
    rank: (
      order: string | number | null | undefined,
      name: string | number | null | undefined,
    ) => `RANK ${order} · ${name}`,
    progressLabel: common.progress,
    completed: common.completed,
  },
  // src/features/game/GameNarrativePage.tsx
  gameNarrativePage: {
    openHint: common.openHint,
  },
  // src/features/game/GameNotificationCenter.tsx
  gameNotificationCenter: {
    saveFailed: "通知已读状态保存失败，请重试。",
  },
  // src/features/game/GamePlayPage.tsx
  gamePlayPage: {
    locked: "回答错误，当前题目已永久锁定。请联系游戏管理员处理。",
    penalty: common.penalty,
    incorrect: common.incorrect,
    allCompleted: common.allCompleted,
    correct: common.correct,
    emptyAnswer: common.emptyAnswer,
    revokedTitle: "本次场次已撤回",
    revokedDescription: "如需继续，请联系游戏管理员重新安排。",
    home: common.home,
    questionNavigation: common.questionNavigation,
    completed: common.completed,
    questionNumber: common.questionNumber,
    videoPlaying: common.videoPlaying,
    videoStopped: common.videoStopped,
  },
  // src/features/game/GameSidebar.tsx
  gameSidebar: {
    openMenu: "打开冒险者菜单",
    menu: common.menu,
    avatarAlt: common.avatarAlt,
    avatarFallback: common.avatarFallback,
    experience: common.experience,
    navigation: common.navigation,
    backToQuest: common.gameSidebarBackToQuest,
    backHint: common.backHint,
    theme: common.title,
    logout: common.logout,
    lightTitle: "旅途光线",
  },
  // src/features/game/components/AssignmentBrief.tsx
  assignmentBrief: {
    eyebrow: "一段新的旅程",
    description: "循着线索，去发现故事另一面的答案。",
    puzzles: "谜题",
    puzzleCount: (totalLevels: string | number | null | undefined) =>
      `${totalLevels} 道等待解开`,
    level: "参与等级",
    startsAt: "开放时间",
    availableNow: "现在就能出发",
    endsAt: "旅程截止",
    revokedHint: "，请联系游戏管理员。",
    levelHint: "，请确认场次的参与等级。",
    waitingHint: "，旅程开放后就能出发。",
    entering: "正在进入…",
    start: "开始本场冒险",
    home: common.home,
    saveHint: "解谜进度会自动保存，随时可以回来继续。",
  },
  // src/features/game/components/AssignmentCard.tsx
  assignmentCard: {
    eyebrow: "CHAPTER",
    description: (totalLevels: string | number | null | undefined) =>
      `${totalLevels} 道谜题，藏着尚未揭开的故事。`,
    puzzleCount: (totalLevels: string | number | null | undefined) =>
      `${totalLevels} 道谜题`,
    startsAt: "开放",
    endsAt: "截止",
    completedCount: (
      completedLevels: string | number | null | undefined,
      totalLevels: string | number | null | undefined,
    ) => `已解开 ${completedLevels} / ${totalLevels}`,
    progressLabel: (title: string | number | null | undefined) =>
      `${title}探索进度`,
  },
  // src/features/game/components/AuthLayout.tsx
  authLayout: {
    eyebrow: "一场属于你的解谜之旅",
    titleFirstLine: "答案之外，",
    titleSecondLine: "另有天地。",
    description: "循着线索，走进属于你的故事。",
    footer: "每一个问题，都是一扇门。",
  },
  // src/features/game/components/GameLayout.tsx
  gameLayout: {
    homeLabel: "Questions · 回到启程",
    brand: common.brand,
    tagline: common.tagline,
    skipContent: "跳到主要内容",
    backToAssignment: "返回正在探索的场次",
    footer: "不必急着找到答案，奇遇就在路上。",
  },
  // src/features/game/components/GameLoadingScreen.tsx
  gameLoadingScreen: {
    playerTitle: "拾起你的冒险足迹",
    playerLabel: "正在读取冒险者资料…",
    playerHint: "每一段走过的路，都有星光记得。",
    assignmentTitle: "下一段冒险，正在苏醒",
    assignmentLabel: "正在准备本场冒险…",
    assignmentHint: "循着微光，走进故事的另一面。",
    narrativeTitle: "故事，正为你展开",
    narrativeLabel: "正在准备这份专属内容…",
    narrativeHint: "有些话，正等着被你读到。",
    brand: common.brand,
    eyebrow: "星图正在显现",
    tagline: common.tagline,
  },
  // src/features/game/components/GameNavigation.tsx
  gameNavigationControl: {
    label: "冒险导航",
  },
  // src/features/game/components/GameRequestFeedback.tsx
  gameRequestFeedback: {
    syncTitle: "同步暂时中断",
    syncDescription: "当前页面和输入仍保留，连接恢复后会自动同步。",
    answerTitle: "答案还在，等待回音",
    startTitle: "旅程正在等待连接",
    accessibleDescription: "连接暂时中断，可以留在当前页面重试。",
    eyebrow: "旅途信号 · 暂时中断",
    answerDescription:
      "暂时未能确认提交结果。你的输入仍在，重试会确认同一次提交，不会重复计次。",
    startDescription:
      "暂时未能确认开启结果。留在这里重新连接，就能继续你的冒险。",
    reconnecting: "正在重新连接…",
    reconnect: "重新连接",
    stay: "留在当前页面",
    pendingStatus: "正在确认请求结果，请稍候",
    failedStatus: "连接失败，可以重试",
  },
  // src/features/game/components/GameSidebarIdentity.tsx
  gameSidebarIdentity: {
    label: common.gameSidebarIdentityLabel,
    title: common.gameSidebarIdentityTitle,
    rank: (
      name: string | number | null | undefined,
      order: string | number | null | undefined,
    ) => `${name} · Lv.${order}`,
  },
  // src/features/game/components/GameState.tsx
  gameState: {
    error: "暂时无法加载，请稍后重试",
    retry: common.retry,
    home: common.home,
    loading: "正在展开你的旅程…",
  },
  // src/features/game/components/GameThemePicker.tsx
  gameThemePicker: {
    system: common.system,
    light: common.light,
    dark: common.dark,
    title: common.title,
  },
  // src/features/game/components/NotificationLetter.tsx
  notificationLetter: {
    read: common.read,
    newLetter: "一封新来信",
    pending: "正在收下…",
    accept: "收下这封信",
    saved: "来信已收好",
  },
  // src/features/game/components/PasswordEditor.tsx
  passwordEditor: {
    forcedTitle: "首次登录，请先修改密码",
    title: "给你的故事，上把锁。",
    description: "设置只有你知道的通行密语。使用 10—71 个字符。",
    mismatch: "两次新密码不一致，请再核对一下。",
    currentPassword: "当前密码",
    newPassword: "新密码",
    confirmPassword: "确认新密码",
    saved: "密码已更新。你的冒险记录，安心留在这里。",
    saving: common.saving,
    save: "保存新密码",
    logout: common.logout,
  },
  // src/features/game/components/PlayerPassport.tsx
  playerPassport: {
    avatarAlt: common.avatarAlt,
    avatarFallback: common.avatarFallback,
    experience: common.experience,
    rankCode: (order: number) => `RANK ${String(order).padStart(2, "0")}`,
    remainingExperience: (remaining: string | number | null | undefined) =>
      `距下一级 ${remaining} EXP`,
    maxLevel: "已满级",
    progressLabel: "等级经验进度",
    nextLevel: (
      remaining: string | number | null | undefined,
      name: string | number | null | undefined,
    ) => `再收集 ${remaining} 经验，成为「${name}」`,
    maxLevelDescription: "已抵达当前最高等级，故事仍在继续。",
    label: common.gameSidebarIdentityLabel,
    title: common.gameSidebarIdentityTitle,
    rank: (order: string | number | null | undefined) => ` · Lv.${order}`,
    edit: "装扮我的名片 ",
  },
  // src/features/game/components/ProfileEditor.tsx
  profileEditor: {
    changeAvatar: "更换头像",
    uploadAvatar: "上传头像",
    avatarHint: "JPG / PNG / WebP · 原图最大 50 MB，裁剪后自动压缩",
    selectedFile: (name: string | number | null | undefined) =>
      `已选择：${name}`,
    displayName: "显示昵称",
    displayNameHint: "你的名字，会和解开的谜题一起被记住。",
    username: common.username,
    usernameHint: "账号由游戏管理员创建，不可修改",
    saved: "资料已保存。新的名片，新的出发。",
    saving: common.saving,
    save: "保存资料",
  },
  avatarCrop: {
    title: "裁剪头像",
    hint: "拖动照片或双指缩放，选择正方形范围。确认后保存资料即可上传。",
    zoom: "缩放",
    cancel: "取消",
    confirm: "使用此头像",
    loading: "正在准备照片…",
    processing: "正在压缩…",
    failed: "图片处理失败，请重新选择 JPG、PNG 或 WebP 图片。",
    loadFailed: "裁剪工具加载失败，请重新选择图片重试。",
  },
  // src/features/game/desktop/DesktopClueShelf.tsx
  desktopClueShelf: {
    title: "线索手记",
    eyebrow: "沿着线索，继续探索",
    heading: "线索手记 ",
    unlockedLabel: "已解锁线索",
    untitled: common.untitled,
    contentLabel: "线索正文",
    importantEyebrow: common.eyebrow,
    letterWaiting: common.letterWaiting,
    blessingWaiting: common.blessingWaiting,
    zoomImage: (value1: string | number | null | undefined) =>
      `放大线索图片 ${value1}`,
    imageAlt: (value1: string | number | null | undefined) =>
      `线索图片 ${value1}`,
    open: common.open,
    description: "仅展示已解锁的内容",
    zoomText: "放大阅读",
  },
  // src/features/game/desktop/DesktopClueVideoTrigger.tsx
  desktopClueVideoTrigger: {
    play: common.desktopClueVideoTriggerPlay,
    video: common.video,
    title: "重现这一幕",
  },
  // src/features/game/desktop/DesktopInbox.tsx
  desktopInbox: {
    label: "来信列表",
    title: "沿途的消息",
    letterCount: (length: string | number | null | undefined) =>
      `${length} 封来信`,
    read: common.read,
    unread: "未读",
  },
  // src/features/game/desktop/DesktopProfile.tsx
  desktopProfile: {
    label: common.desktopProfileLabel,
    title: "让旅途记住你。",
    description: "更新名片，带着新的模样出发。",
  },
  // src/features/game/desktop/DesktopQuestCard.tsx
  desktopQuestCard: {
    questionNumber: common.questionNumber,
    contentLabel: common.label,
    choice: common.choice,
    text: common.desktopQuestCardText,
    startsAt: common.startsAt,
    endedAt: common.endedAt,
  },
  // src/features/game/game-navigation.ts
  gameNavigation: {
    dashboard: "启程",
    dashboardDescription: "我的场次",
    dashboardHint: "继续未完的冒险",
    rewards: "收藏",
    rewardsDescription: "奇遇收藏",
    rewardsHint: "收好线索与战利品",
    notifications: "来信",
    notificationsDescription: common.notificationsDescription,
    notificationsHint: "查收远方的消息",
    profile: "护照",
    profileDescription: common.gameSidebarIdentityTitle,
    profileHint: "装扮你的冒险名片",
  },
  // src/features/game/game-presentation.ts
  gamePresentation: {
    completed: "故事已解开",
    replay: "重温旅程",
    revoked: "旅程已撤回",
    details: common.details,
    expired: "已过开放时间",
    waiting: "静候启程",
    levelBlocked: "等级暂不符合",
    active: "探索进行中",
    continueJourney: "继续探索",
    available: "可以出发",
    start: "开启旅程",
    unknownTime: "时间待确认",
    minimumLevel: (minLevel: string | number | null | undefined) =>
      `等级 ${minLevel} 及以上`,
    levelRange: (
      minLevel: string | number | null | undefined,
      maxLevel: string | number | null | undefined,
    ) => `等级 ${minLevel}—${maxLevel}`,
  },
  // src/features/game/game-profile-validation.ts
  gameProfileValidation: {
    invalidImageType: "请选择 JPG、PNG 或 WebP 图片。",
    imageTooLarge: "原图超过 50 MB，请选择小一点的图片。",
  },
  // src/features/game/hooks/useProfileEditor.ts
  useProfileEditor: {
    emptyName: "给自己起个名字，再出发吧。",
  },
  // src/features/game/pages/GameDashboard.tsx
  gameDashboard: {
    eyebrow: "你的冒险，从这里续写",
    title: "下一段故事，等你落笔。",
    description: "有些答案，要亲自出发才能找到。",
    tabsLabel: "场次分类",
    upcoming: "待赴之约 ",
    history: "旅途回响 ",
    upcomingEmptyTitle: "下一场奇遇，正在酝酿。",
    historyEmptyTitle: "故事的第一页，还空着。",
    upcomingEmptyDescription:
      "还没有待玩场次。找游戏管理员领取你的旅程，新的邀请会自动出现在这里。",
    historyEmptyDescription: "完成一场冒险，就会在这里留下你的足迹。",
    syncHint: "场次与进度会自动同步，放心去探索。",
  },
  // src/features/game/pages/GameLoginPage.tsx
  gameLoginPage: {
    titleFirstLine: "以你的名字，",
    titleSecondLine: "开启冒险。",
    description: "带上你的账号，剩下的交给好奇心。",
    username: common.username,
    usernamePlaceholder: "你的冒险者账号",
    password: "密码",
    passwordPlaceholder: "输入通行密语",
    pending: "正在打开故事…",
    submit: "进入冒险",
    helpTitle: "还没有账号，或忘记了密码？",
    helpDescription:
      "账号由游戏管理员提供，暂不开放注册。忘记密码时，请联系游戏管理员重置。",
  },
  // src/features/game/pages/GameNotificationsPage.tsx
  mailbox: {
    journey: "旅途来信",
    stars: "星海信笺",
    accept: "收下",
    markRead: "标为已读",
    unread: "未读",
    actions: "来信操作",
    close: "关闭信件",
    media: "打开查看来信内容",
    starsLoading: "正在收集旅途中的信笺…",
    starsEmpty: "还没有抵达的星海信笺",
    starsDescription: "在场次中获得的信件与祝福，会珍藏在这里。",
    finale: "旅途终章",
  },
  gameNotificationsPage: {
    eyebrow: common.notificationsDescription,
    title: "旅途中，有人来信。",
    description: "下一条线索，也许就在这里。",
    unreadCount: (unread: string | number | null | undefined) =>
      `你有 ${unread} 封新来信。`,
    loading: "正在整理旅途来信…",
    emptyTitle: "此刻，信箱里只有星光。",
    emptyDescription: "暂时没有消息。新的来信会自动送到，不必守在这里等。",
  },
  // src/features/game/pages/GameProfilePage.tsx
  gameProfilePage: {
    eyebrow: "每一个名字，都有自己的故事",
    title: common.gameSidebarIdentityTitle,
    description: "让旅途记住你的模样。",
    settingsLabel: "护照设置",
    identity: common.desktopProfileLabel,
    security: "账号安全",
  },
  // src/features/game/pages/GameRewardsPage.tsx
  gameRewardsPage: {
    available: "礼物待领取",
    redeemed: "已领取 · 已核销",
    voided: "已失效",
    instructions: "领取指引",
    claimDetails: "你的领取线索",
    claimedAt: "领取于",
    eyebrow: "冒险的收获",
    title: "把奇遇，收入囊中。",
    description: "那些解开的谜，留下了这些礼物。",
    loading: "正在打开你的收藏…",
    emptyTitle: "留个位置，给下一份惊喜。",
    explore: "去探索新的故事",
    emptyDescription: "还没有获得奖品。完成场次后，再来看看你的收获。",
  },
  // src/features/letter/LetterControls.tsx
  letterControls: {
    continuing: "故事仍在继续",
    title: "阅读手记",
    readingHint: "慢慢读，有些答案藏在字里行间。",
    typingHint: "字句正在浮现，也可以直接展开全文。",
    pageSummary: (pageNumber: number, pageCount: number) =>
      `第 ${pageNumber} 页 · 共 ${pageCount} 页`,
    disabled: common.disabled,
    turning: common.turning,
    previous: "上一页",
    pageLabel: (
      value1: string | number | null | undefined,
      pageCount: string | number | null | undefined,
    ) => `第 ${value1} 页，共 ${pageCount} 页`,
    next: "下一页",
    horizontalHint: "可左右滑动翻页。",
    verticalHint: "可上下滑动翻页。",
    paginationHint: "打字完成或显示全文后可以翻页。",
    showAll: "显示全文",
    close: "收起信件",
    back: common.backToQuest,
    keyboardHint: "全文显示后，可用 ← → 翻页",
  },
  // src/features/letter/LetterExperience.tsx
  letterExperience: {
    label: (variant: string | number | null | undefined) => `${variant} letter`,
    back: "← 返回冒险",
    untitled: "一封未署名的来信",
    contentLabel: "信件内容",
    pause: common.pause,
    play: common.play,
  },
  // src/features/letter/LetterPage.tsx
  letterPage: {
    missingToken: "缺少来信凭证 from 参数。",
    eyebrow: "Letter archive",
    loadingTitle: "正在准备信件",
    loadingDescription: "信纸、图像与声音正在抵达……",
    notFound: "请检查来信凭证 from 是否正确。",
    notFoundEyebrow: "Letter not found",
    notFoundTitle: "信件已遗失",
  },
  // src/features/media/ChoiceOptions.tsx
  choiceOptions: {
    legend: "请选择答案",
    option: (key: string | number | null | undefined) => `选项 ${key}`,
    playVideo: (key: string | number | null | undefined) =>
      `播放选项 ${key} 视频`,
    viewImage: (key: string | number | null | undefined) =>
      `查看选项 ${key} 图片`,
    play: "播放影像",
  },
  // src/features/media/MediaViewer.tsx
  mediaViewer: {
    imageTitle: "图片预览",
    videoTitle: "视频播放器",
    close: "关闭媒体预览",
    imageAlt: (value1: string | number | null | undefined) =>
      `预览图片 ${value1}`,
    previous: "上一张",
    next: "下一张",
    swipeHint: "可左右滑动切换图片。",
  },
  // src/features/media/NativeVideo.tsx
  nativeVideo: {
    unsupported: common.unsupported,
    muted: "视频已静音",
    unmuted: "声音已开启",
    unmute: "开启声音",
    mute: "静音",
  },
  // src/features/media/QuestContent.tsx
  questContent: {
    playVideo: (value1: string | number | null | undefined) =>
      `播放题目视频 ${value1}`,
    videoPoster: "视频封面",
    videoPlaceholder: "影像记录",
    viewImage: (value1: string | number | null | undefined) =>
      `查看题目图片 ${value1}`,
    imageAlt: (value1: string | number | null | undefined) =>
      `题目图片 ${value1}`,
    hint: "查看提示",
  },
  // src/features/notification/NotificationCenter.tsx
  notificationCenter: {
    unknownTime: "未知时序",
    listLabel: "通知列表",
    eyebrow: "Signal archive",
    title: "远方来的讯息",
    count: (length: string | number | null | undefined) => `${length} 条通知`,
    untitled: "未命名通知",
    close: "关闭通知列表",
    open: "打开通知列表",
    dragInstructions: common.dragInstructions,
  },
  // src/features/notification/NotificationDialog.tsx
  notificationDialog: {
    title: "魔法通知",
    eyebrow: "Incoming transmission",
    heading: "✨ 魔法通知 ✨",
    viewImage: "查看通知图片",
    contentLabel: "通知内容",
    playVideo: "播放通知视频",
    videoPoster: "通知视频封面",
    play: "点击播放视频",
    pendingCount: (value1: string | number | null | undefined) =>
      `还有 ${value1} 条讯息`,
    acknowledge: "✨ 知晓了",
  },
  // src/features/quest/AnswerFeedback.tsx
  answerFeedback: {
    neutral: "尚未提交",
    success: "验证通过",
    danger: "验证未通过",
  },
  // src/features/quest/QuestAnswerForm.tsx
  questAnswerForm: {
    answer: "答案",
    placeholder: "输入你的答案",
    locked: "此题已永久锁定",
    penaltyRemaining: (value1: string | number | null | undefined) =>
      `距离再次尝试还有 ${value1}`,
    submit: "提交答案",
    next: "前往下一题",
  },
  // src/features/quest/QuestCard.tsx
  questCard: {
    questionNumber: common.questionNumber,
    choice: common.choice,
    text: common.desktopQuestCardText,
    startsAt: common.startsAt,
    endedAt: common.endedAt,
    guideLabel: "答题引导",
    guideTitle: "答案在题目下方",
    guideDescription:
      "向下阅读题目，在卡片底部填写或选择答案；完成后解锁下一题。",
    dismissGuide: "知道了",
    locateAnswer: "定位答题区",
  },
  // src/features/quest/QuestEntryPage.tsx
  questEntryPage: {
    eyebrow: "Questions",
    loadingTitle: "正在读取冒险记录",
    loadingDescription: "通过 local.sitkin.top 连接 PocketBase…",
    notFoundEyebrow: "Quest not found",
    notFoundTitle: "没有找到对应题目",
    invalidSelection: (value1: string | number | null | undefined) =>
      `请检查 qa 或 qas 参数：${value1}`,
  },
  // src/features/quest/QuestSessionView.tsx
  questSessionView: {
    notStarted: "冒险尚未开始，请耐心等待。",
    ended: "本次冒险已经结束。",
    blocked: "当前仍在惩罚时间内，暂时无法再次作答。",
    emptyAnswer: common.emptyAnswer,
    allCompleted: common.allCompleted,
    correct: common.correct,
    locked: "回答错误，当前题目已永久锁定。请使用记录管理页面处理。",
    penalty: common.penalty,
    incorrect: common.incorrect,
    traveler: common.traveler,
    eyebrow: common.gameContextEyebrow,
    rank: "RANK ",
    explorer: "探索者",
    progressLabel: common.progress,
    completed: common.completed,
    missingSteps: (value1: string | number | null | undefined) =>
      `未找到第 ${value1} 题，已继续加载其余题目。`,
    questionNavigation: common.questionNavigation,
    questionNumber: common.questionNumber,
    videoPlaying: common.videoPlaying,
    videoStopped: common.videoStopped,
  },
  // src/features/rank/RankUpDialog.tsx
  rankUpDialog: {
    rankLabel: "RANK",
    title: "等级突破",
    description: "新的冒险等级已经生效",
    rank: (code: string | number | null | undefined) => `RANK ${code}`,
    status: "能力权限已同步",
    continueAdventure: "继续冒险",
  },
  // src/features/version/VersionSecret.tsx
  versionSecret: {
    preview: "预览航线",
    production: "正式航线",
    local: "本地星图",
    label: "Questions · 星图",
    title: common.versionSecretTitle,
    description: "当前页面的版本与构建信息",
    close: "关闭星图档案",
    eyebrow: "QUESTIONS · HIDDEN ARCHIVE",
    caption: "你找到了，故事背后的坐标。",
    version: (version: string | number | null | undefined) => `v${version}`,
    commit: "提交坐标",
    builtAt: "构建时刻",
    footer: "这是当前页面载入的版本",
  },
};
