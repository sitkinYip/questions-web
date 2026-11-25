import http from "node:http";
import { URL } from "node:url";

const HOST = process.env.MOCK_API_HOST || "127.0.0.1";
const PORT = Number(process.env.MOCK_API_PORT || 5180);
const BASE_URL = `http://${HOST}:${PORT}`;

/** 等级阶梯（与业务阶梯一致，便于体验从 Lv.7 升至 Lv.8「星穹寻光者」） */
const RANKS = [
  { id: "rk-1", order: 1, name: "启程新星", minTotalXp: 0, visualConfig: {} },
  { id: "rk-2", order: 2, name: "星尘旅者", minTotalXp: 200, visualConfig: {} },
  { id: "rk-3", order: 3, name: "逐光行者", minTotalXp: 420, visualConfig: {} },
  {
    id: "rk-4",
    order: 4,
    name: "银翼探索者",
    minTotalXp: 680,
    visualConfig: {},
  },
  {
    id: "rk-5",
    order: 5,
    name: "星图绘测师",
    minTotalXp: 950,
    visualConfig: {},
  },
  {
    id: "rk-6",
    order: 6,
    name: "守夜引路人",
    minTotalXp: 1120,
    visualConfig: {},
  },
  { id: "rk-7", order: 7, name: "观星者", minTotalXp: 1200, visualConfig: {} },
  {
    id: "rk-8",
    order: 8,
    name: "星穹寻光者",
    minTotalXp: 1500,
    visualConfig: {},
  },
  {
    id: "rk-9",
    order: 9,
    name: "极光观测官",
    minTotalXp: 1900,
    visualConfig: {},
  },
  {
    id: "rk-10",
    order: 10,
    name: "赴星典藏家",
    minTotalXp: 2400,
    visualConfig: {},
  },
];

function resolveRanks(totalXp) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (totalXp >= rank.minTotalXp) current = rank;
  }
  const idx = RANKS.findIndex((item) => item.id === current.id);
  return {
    level: current,
    nextLevel: RANKS[idx + 1] ?? null,
  };
}

function assetUrl(name) {
  return `${BASE_URL}/mock-assets/${name}`;
}

/** 生成本地内置极光玻璃风格 SVG 插图（零外链，支持透明底题图展示） */
const MOCK_SVGS = {
  "observatory.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" fill="none">
    <defs>
      <radialGradient id="sky" cx="50%" cy="22%" r="72%">
        <stop offset="0%" stop-color="#8DB4FF" stop-opacity="0.34"/>
        <stop offset="55%" stop-color="#1A294D" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="#0A1020" stop-opacity="0.98"/>
      </radialGradient>
      <linearGradient id="dome" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3E5C9A"/>
        <stop offset="100%" stop-color="#131E3A"/>
      </linearGradient>
    </defs>
    <rect x="12" y="12" width="616" height="336" rx="28" fill="url(#sky)" stroke="#8DB4FF" stroke-opacity="0.35" stroke-width="2"/>
    <circle cx="320" cy="86" r="44" fill="#8DB4FF" fill-opacity="0.14"/>
    <path d="M320 44 Q324 82 362 86 Q324 90 320 128 Q316 90 278 86 Q316 82 320 44 Z" fill="#F6FAFF"/>
    <ellipse cx="320" cy="86" rx="68" ry="18" stroke="#8DB4FF" stroke-opacity="0.65" stroke-width="2.5" transform="rotate(-14 320 86)"/>
    <circle cx="144" cy="96" r="2.5" fill="#DCE8FF"/>
    <circle cx="212" cy="64" r="2" fill="#E3C27A"/>
    <circle cx="486" cy="74" r="3" fill="#DCE8FF"/>
    <circle cx="524" cy="134" r="2" fill="#8DB4FF"/>
    <circle cx="112" cy="168" r="2" fill="#8DB4FF"/>
    <path d="M196 294 C196 208 250 158 320 158 C390 158 444 208 444 294 Z" fill="url(#dome)" stroke="#9EC0FF" stroke-opacity="0.45" stroke-width="2"/>
    <path d="M294 162 L338 118 L354 134 L314 176 Z" fill="#0B1326" stroke="#8DB4FF" stroke-opacity="0.6" stroke-width="2"/>
    <circle cx="346" cy="126" r="9" fill="#8DB4FF" fill-opacity="0.4" stroke="#EEF3FF" stroke-width="2"/>
    <rect x="164" y="286" width="312" height="36" rx="12" fill="#101A33" stroke="#8DB4FF" stroke-opacity="0.32" stroke-width="2"/>
    <path d="M36 322 Q180 288 320 310 Q460 330 604 300 L604 348 L36 348 Z" fill="#070B16" fill-opacity="0.88"/>
  </svg>`,

  "star-chart.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 380" fill="none">
    <rect width="640" height="380" rx="24" fill="#0A1224"/>
    <circle cx="320" cy="190" r="142" stroke="#8DB4FF" stroke-opacity="0.28" stroke-width="1.5"/>
    <circle cx="320" cy="190" r="98" stroke="#E3C27A" stroke-opacity="0.36" stroke-dasharray="6 8" stroke-width="1.5"/>
    <circle cx="320" cy="190" r="52" stroke="#8DB4FF" stroke-opacity="0.45" stroke-width="1.5"/>
    <line x1="140" y1="190" x2="500" y2="190" stroke="#8DB4FF" stroke-opacity="0.18"/>
    <line x1="320" y1="30" x2="320" y2="350" stroke="#8DB4FF" stroke-opacity="0.18"/>
    <polyline points="205,245 268,205 320,190 368,142 426,112" stroke="#8DB4FF" stroke-width="2.5" stroke-opacity="0.85"/>
    <circle cx="205" cy="245" r="5" fill="#9EC0FF"/>
    <circle cx="268" cy="205" r="5" fill="#9EC0FF"/>
    <circle cx="320" cy="190" r="8" fill="#E3C27A"/>
    <circle cx="368" cy="142" r="5" fill="#9EC0FF"/>
    <circle cx="426" cy="112" r="6" fill="#F5FAFF"/>
    <text x="336" y="182" fill="#E3C27A" font-size="14" font-family="sans-serif">北极星 · 坐标原点</text>
  </svg>`,

  "aurora-horizon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" fill="none">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#070B16"/>
        <stop offset="62%" stop-color="#122142"/>
        <stop offset="100%" stop-color="#0A1224"/>
      </linearGradient>
      <linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#8DB4FF" stop-opacity="0"/>
        <stop offset="38%" stop-color="#8DB4FF" stop-opacity="0.65"/>
        <stop offset="68%" stop-color="#E3C27A" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#8DB4FF" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" rx="22" fill="url(#bg)"/>
    <path d="M20 220 C140 90 280 260 410 120 C490 36 560 140 620 110 L620 210 C540 245 480 145 390 215 C260 310 140 180 20 280 Z" fill="url(#ribbon)"/>
    <path d="M0 300 Q170 250 320 286 T640 278 L640 360 L0 360 Z" fill="#060911"/>
    <circle cx="176" cy="84" r="2.5" fill="#F5FAFF"/>
    <circle cx="448" cy="70" r="3" fill="#E3C27A"/>
    <circle cx="542" cy="112" r="2" fill="#DCE8FF"/>
  </svg>`,

  "aurora-prism.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" fill="none">
    <rect width="640" height="360" rx="22" fill="#0B1326"/>
    <circle cx="320" cy="180" r="118" fill="#8DB4FF" fill-opacity="0.14"/>
    <polygon points="320,56 432,180 320,304 208,180" fill="#182A52" stroke="#9EC0FF" stroke-width="2.5"/>
    <polygon points="320,90 396,180 320,270 244,180" fill="#8DB4FF" fill-opacity="0.24" stroke="#E3C27A" stroke-opacity="0.7" stroke-width="1.5"/>
    <path d="M320 124 Q326 174 376 180 Q326 186 320 236 Q314 186 264 180 Q314 174 320 124 Z" fill="#F6FAFF"/>
  </svg>`,

  "reward-bookmark.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
    <rect width="400" height="300" rx="24" fill="#10182C"/>
    <circle cx="200" cy="148" r="96" fill="#E3C27A" fill-opacity="0.14"/>
    <path d="M150 48 H250 V248 L200 214 L150 248 Z" fill="#19284C" stroke="#E3C27A" stroke-width="3"/>
    <path d="M200 84 Q205 130 244 134 Q205 138 200 184 Q195 138 156 134 Q195 130 200 84 Z" fill="#F5E6BE"/>
    <ellipse cx="200" cy="134" rx="54" ry="15" stroke="#8DB4FF" stroke-width="2.5" transform="rotate(-14 200 134)"/>
  </svg>`,

  "reward-stamp.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
    <rect width="400" height="300" rx="24" fill="#0F172A"/>
    <rect x="114" y="64" width="172" height="172" rx="18" fill="#162341" stroke="#8DB4FF" stroke-opacity="0.65" stroke-width="3" stroke-dasharray="8 6"/>
    <circle cx="200" cy="150" r="46" stroke="#8DB4FF" stroke-width="2"/>
    <path d="M200 112 Q204 146 238 150 Q204 154 200 188 Q196 154 162 150 Q196 146 200 112 Z" fill="#DCE8FF"/>
  </svg>`,

  "reward-badge.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
    <rect width="400" height="300" rx="24" fill="#10182C"/>
    <circle cx="200" cy="150" r="98" fill="#E3C27A" fill-opacity="0.16"/>
    <circle cx="200" cy="150" r="72" fill="#172445" stroke="#E3C27A" stroke-width="3.5"/>
    <circle cx="200" cy="150" r="56" stroke="#8DB4FF" stroke-opacity="0.6" stroke-dasharray="5 6" stroke-width="1.5"/>
    <path d="M200 94 Q206 144 256 150 Q206 156 200 206 Q194 156 144 150 Q194 144 200 94 Z" fill="#F8E7B8"/>
  </svg>`,

  "avatar-default.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" fill="none">
    <defs>
      <radialGradient id="av" cx="42%" cy="32%" r="72%">
        <stop offset="0%" stop-color="#8DB4FF"/>
        <stop offset="56%" stop-color="#294885"/>
        <stop offset="100%" stop-color="#0D162B"/>
      </radialGradient>
    </defs>
    <rect width="240" height="240" fill="url(#av)"/>
    <ellipse cx="120" cy="120" rx="86" ry="26" stroke="#E3C27A" stroke-opacity="0.82" stroke-width="5" transform="rotate(-16 120 120)"/>
    <path d="M120 44 Q127 113 196 120 Q127 127 120 196 Q113 127 44 120 Q113 113 120 44 Z" fill="#F7FAFF"/>
  </svg>`,
};

/** 构造完整初始状态（可随时一键重置） */
function createInitialState() {
  const now = new Date();
  const iso = (offsetMin = 0) =>
    new Date(now.getTime() + offsetMin * 60_000).toISOString();

  const starPlayer = {
    id: "player-star",
    account: "star",
    displayName: "星野旅人",
    avatar: "avatar-default.svg",
    mustChangePassword: false,
    totalXp: 1240,
    ...resolveRanks(1240),
  };

  const newPlayer = {
    id: "player-new",
    account: "new",
    displayName: "初访旅人",
    avatar: "",
    mustChangePassword: true,
    totalXp: 0,
    ...resolveRanks(0),
  };

  // 每关正确答案映射（仅服务端保留，客户端不可见）
  const answerKeys = {
    "asg-first-l1": ["北极星", "polaris"],
    "asg-first-l2": ["b"],
    "asg-first-l3": ["赴星之约", "starward"],
    "asg-choice-l2": ["a"],
  };

  // 每关完整题面定义（未解锁前对客户端隐藏为 null）
  const questionBank = {
    "asg-first-l1": {
      id: "q-first-1",
      kind: "text",
      title: "冬夜镜筒中的北方",
      placeholder: "输入恒星名称（例如：北极星）",
      content: [
        {
          text: "观测站的穹顶在冬夜第三次打开时，哪一颗恒星始终悬在正北方的镜筒中央，为整座星图校准原点？",
          hint: "提示：三个字，古代航海与观星时用来辨认正北方向的恒星（答案：北极星）。",
          imageUrl: assetUrl("observatory.svg"),
          imageUrls: [],
          videoUrl: "",
        },
      ],
      options: [],
    },
    "asg-first-l2": {
      id: "q-first-2",
      kind: "choice",
      title: "星象仪的六重刻度",
      placeholder: "",
      content: [
        {
          text: "展开下方的悬浮选择题栏，选出观测站铭牌上刻着「永不偏移的坐标」的那一项。\n\n本关包含 6 个选项与星图插图，可体验自适应完整展开；答对后将跨过 1500 EXP 门槛触发新版「星穹加冕」升级礼赞，答完后也可再次点开只读回顾！",
          hint: "提示：选择 B（北极星 · 永不偏移的坐标）。",
          imageUrl: "",
          imageUrls: [],
          videoUrl: "",
        },
      ],
      options: [
        {
          key: "A",
          text: "启明星 · 晨曦微光",
          imageUrl: "",
          videoUrl: "",
        },
        {
          key: "B",
          text: "北极星 · 永不偏移的坐标",
          imageUrl: assetUrl("star-chart.svg"),
          videoUrl: "",
        },
        {
          key: "C",
          text: "天狼星 · 冬季最亮之星",
          imageUrl: "",
          videoUrl: "",
        },
        {
          key: "D",
          text: "织女星 · 银河彼岸",
          imageUrl: "",
          videoUrl: "",
        },
        {
          key: "E",
          text: "牛郎星 · 隔河相望",
          imageUrl: "",
          videoUrl: "",
        },
        {
          key: "F",
          text: "参宿四 · 猎户肩头",
          imageUrl: "",
          videoUrl: "",
        },
      ],
    },
    "asg-first-l3": {
      id: "q-first-3",
      kind: "text",
      title: "观测站终页 · 星海手记",
      placeholder: "输入四个字的约定（例如：赴星之约）",
      content: [
        {
          text: [
            "向下滑动阅读这则完整的观测手记，可以顺便体验答题页顶栏在下滑时自动轻盈隐藏、稍微上滑立即浮现的沉浸式阅读手感。",
            "第一夜，风雪盖住了北坡的石阶。我们在圆顶内点燃微弱的暖灯，把旧星图一页页铺开在观测台上，直到冰蓝色的极光顺着缝隙落进镜筒。",
            "第二夜，六重刻度全部归位。指针越过子午线的那一刻，整座穹顶发出低沉的共振，像是在回应很久以前写下的一封信。",
            "第三夜，手记的最后一页只留下一句落款——我们约定在星环再次合拢之时重逢，这趟旅程的名字就叫作 [[赴星之约]]。",
            "在底部悬浮输入框填入这四个字，即可完成整场首次冒险，解锁专属星海信件与一枚荣耀金纪念徽章。",
          ].join("\n\n"),
          hint: "提示：输入「赴星之约」即可通关并解锁终章信件与新奖品。",
          imageUrl: "",
          imageUrls: [
            assetUrl("aurora-horizon.svg"),
            assetUrl("aurora-prism.svg"),
          ],
          videoUrl: "",
        },
      ],
      options: [],
    },
    "asg-choice-l1": {
      id: "q-choice-1",
      kind: "choice",
      title: "已作答选择题 · 只读展开示例",
      placeholder: "",
      content: [
        {
          text: "这道题已经作答完成（已选 C）。你可以点击底部的选择题胶囊，体验已作答态下依然支持展开查看全部选项与选项配图，但单选框处于只读锁定不可改选的状态。",
          hint: "本关已完成，点击下一题可测试 10 选项超长列表滚动。",
          imageUrl: "",
          imageUrls: [],
          videoUrl: "",
        },
      ],
      options: [
        { key: "A", text: "仙女座 · 邻近星系", imageUrl: "", videoUrl: "" },
        { key: "B", text: "天鹅座 · 银河十字", imageUrl: "", videoUrl: "" },
        {
          key: "C",
          text: "天琴座 · 织女琴弦",
          imageUrl: assetUrl("star-chart.svg"),
          videoUrl: "",
        },
        { key: "D", text: "天鹰座 · 河鼓三星", imageUrl: "", videoUrl: "" },
        { key: "E", text: "双子座 · 北河双星", imageUrl: "", videoUrl: "" },
        { key: "F", text: "仙后座 · 极北王座", imageUrl: "", videoUrl: "" },
      ],
    },
    "asg-choice-l2": {
      id: "q-choice-2",
      kind: "choice",
      title: "十重星域 · 长选项滚动测试",
      placeholder: "",
      content: [
        {
          text: "本关提供 10 个选项，用于实测选择题展开面板在内容超出可用视口高度上限时，平滑启用内部滚动条且不遮挡页面顶部和底部提交按钮。",
          hint: "提示：正确答案是 A（猎户座 · 参宿四）。",
          imageUrl: "",
          imageUrls: [],
          videoUrl: "",
        },
      ],
      options: [
        {
          key: "A",
          text: "猎户座 · 参宿四（正确答案）",
          imageUrl: "",
          videoUrl: "",
        },
        { key: "B", text: "大犬座 · 天狼星", imageUrl: "", videoUrl: "" },
        { key: "C", text: "小犬座 · 南河三", imageUrl: "", videoUrl: "" },
        { key: "D", text: "御夫座 · 五车二", imageUrl: "", videoUrl: "" },
        { key: "E", text: "金牛座 · 毕宿五", imageUrl: "", videoUrl: "" },
        { key: "F", text: "双子座 · 北河三", imageUrl: "", videoUrl: "" },
        { key: "G", text: "狮子座 · 轩辕十四", imageUrl: "", videoUrl: "" },
        { key: "H", text: "室女座 · 角宿一", imageUrl: "", videoUrl: "" },
        { key: "I", text: "牧夫座 · 大角星", imageUrl: "", videoUrl: "" },
        { key: "J", text: "天蝎座 · 心宿二", imageUrl: "", videoUrl: "" },
      ],
    },
    "asg-echo-l1": {
      id: "q-echo-1",
      kind: "text",
      title: "初雪之夜的坐标",
      placeholder: "输入你的答案",
      content: [
        {
          text: "旧日观测日志中记下的第一枚星标名称是什么？",
          hint: "",
          imageUrl: assetUrl("aurora-horizon.svg"),
          imageUrls: [],
          videoUrl: "",
        },
      ],
      options: [],
    },
    "asg-echo-l2": {
      id: "q-echo-2",
      kind: "choice",
      title: "回响终章的星芒",
      placeholder: "",
      content: [
        {
          text: "当旧观测台的圆顶完全合拢时，留在星图背面的印记是哪一道光？",
          hint: "",
          imageUrl: "",
          imageUrls: [],
          videoUrl: "",
        },
      ],
      options: [
        { key: "A", text: "冰蓝极光环", imageUrl: "", videoUrl: "" },
        { key: "B", text: "绯红落日余晖", imageUrl: "", videoUrl: "" },
        { key: "C", text: "银白月晕", imageUrl: "", videoUrl: "" },
      ],
    },
  };

  // 动态解锁的线索池
  const unlockableClues = {
    "asg-first-l2": [
      {
        id: "clue-first-l2-text",
        source: "session",
        definitionId: "clue-first-l2-text",
        question: "",
        sessionLevel: "asg-first-l2",
        trigger: "level_completed",
        kind: "text",
        position: 1,
        narrative: "",
        autoPlay: false,
        unlockedAt: "",
        content: {
          title: "守夜人手记 · 残页",
          text: "六重星环已校准完成。\n\n下一题的答案藏在观测站终页的星海手记里——留意高亮标出的那四个字。",
          url: "",
          imageUrls: [],
          buttonText: "收好手记",
        },
      },
      {
        id: "clue-first-l2-image",
        source: "session",
        definitionId: "clue-first-l2-image",
        question: "",
        sessionLevel: "asg-first-l2",
        trigger: "level_completed",
        kind: "image",
        position: 2,
        narrative: "",
        autoPlay: false,
        unlockedAt: "",
        content: {
          title: "观测站校准星图",
          text: "点击放大查看已解锁的北极星校准坐标图。",
          url: "",
          imageUrls: [assetUrl("star-chart.svg")],
          buttonText: "查看星图",
        },
      },
    ],
    "asg-first-complete": [
      {
        id: "clue-first-letter",
        source: "session",
        definitionId: "clue-first-letter",
        question: "",
        sessionLevel: "asg-first-l3",
        trigger: "session_completed",
        kind: "letter",
        position: 3,
        narrative: "nar-polaris-letter",
        autoPlay: false,
        unlockedAt: "",
        content: {
          title: "致冬夜观星者",
          text: "你已点亮北极星观测站的全部三枚星标，这封专属星海信件现已为你启封。",
          url: "",
          imageUrls: [],
          buttonText: "展信阅读",
        },
      },
    ],
  };

  const assignments = {
    "asg-first": {
      id: "asg-first",
      player: "player-star",
      session: "sess-first",
      status: "assigned",
      order: 1,
      startsAt: iso(-120),
      endsAt: iso(60 * 24 * 30),
      startedAt: "",
      completedAt: "",
      previousAssignment: "",
      title: "北极星观测站",
      description:
        "首次访问将先进入冒险简报页，随后依次体验带提示与题图的填空题、6 选项自适应选择题（答对触发新版升级礼赞）、以及长文下滑隐藏顶栏与通关信件。",
      minLevel: 1,
      maxLevel: null,
      completedLevels: 0,
      totalLevels: 3,
      presentation: {
        bgmMode: "silent",
        backgroundMode: "none",
        completionStyle: "finale",
      },
      completionTarget: { kind: "narrative", id: "nar-polaris-letter" },
      currentIndex: 0,
      serverTime: iso(0),
      levels: [
        {
          id: "asg-first-l1",
          position: 1,
          xp: 150,
          autoNext: false,
          completedAt: "",
          wrongCount: 0,
          cooldownUntil: "",
          locked: false,
          presentationOverride: {},
          lastAnswer: "",
          question: null,
        },
        {
          id: "asg-first-l2",
          position: 2,
          xp: 150,
          autoNext: false,
          completedAt: "",
          wrongCount: 0,
          cooldownUntil: "",
          locked: false,
          presentationOverride: {},
          lastAnswer: "",
          question: null,
        },
        {
          id: "asg-first-l3",
          position: 3,
          xp: 200,
          autoNext: false,
          completedAt: "",
          wrongCount: 0,
          cooldownUntil: "",
          locked: false,
          presentationOverride: {},
          lastAnswer: "",
          question: null,
        },
      ],
      clues: [],
    },

    "asg-choice-lab": {
      id: "asg-choice-lab",
      player: "player-star",
      session: "sess-choice-lab",
      status: "active",
      order: 2,
      startsAt: iso(-240),
      endsAt: iso(60 * 24 * 30),
      startedAt: iso(-30),
      completedAt: "",
      previousAssignment: "",
      title: "星海长廊 · 选择题体验场",
      description:
        "第 1 题为已作答 6 选项选择题（可直接测试只读展开与配图预览），第 2 题为 10 选项超长列表（测试超出高度上限后的平滑内部滚动）。",
      minLevel: 1,
      maxLevel: null,
      completedLevels: 1,
      totalLevels: 2,
      presentation: {
        bgmMode: "silent",
        backgroundMode: "none",
        completionStyle: "normal",
      },
      completionTarget: null,
      currentIndex: 0,
      serverTime: iso(0),
      levels: [
        {
          id: "asg-choice-l1",
          position: 1,
          xp: 100,
          autoNext: false,
          completedAt: iso(-25),
          wrongCount: 0,
          cooldownUntil: "",
          locked: false,
          presentationOverride: {},
          lastAnswer: "C",
          question: questionBank["asg-choice-l1"],
        },
        {
          id: "asg-choice-l2",
          position: 2,
          xp: 120,
          autoNext: false,
          completedAt: "",
          wrongCount: 0,
          cooldownUntil: "",
          locked: false,
          presentationOverride: {},
          lastAnswer: "",
          question: questionBank["asg-choice-l2"],
        },
      ],
      clues: [],
    },

    "asg-echo": {
      id: "asg-echo",
      player: "player-star",
      session: "sess-echo",
      status: "completed",
      order: 3,
      startsAt: iso(-60 * 48),
      endsAt: iso(60 * 24 * 30),
      startedAt: iso(-60 * 24),
      completedAt: iso(-60 * 22),
      previousAssignment: "",
      title: "冬夜回响 · 旧日星图",
      description:
        "已通关的往期回响场次，可回顾历史作答、已解锁线索与星海信笺。",
      minLevel: 1,
      maxLevel: null,
      completedLevels: 2,
      totalLevels: 2,
      presentation: {
        bgmMode: "silent",
        backgroundMode: "none",
        completionStyle: "normal",
      },
      completionTarget: { kind: "narrative", id: "nar-echo-letter" },
      currentIndex: 1,
      serverTime: iso(0),
      levels: [
        {
          id: "asg-echo-l1",
          position: 1,
          xp: 100,
          autoNext: false,
          completedAt: iso(-60 * 23),
          wrongCount: 0,
          cooldownUntil: "",
          locked: false,
          presentationOverride: {},
          lastAnswer: "极光环",
          question: questionBank["asg-echo-l1"],
        },
        {
          id: "asg-echo-l2",
          position: 2,
          xp: 120,
          autoNext: false,
          completedAt: iso(-60 * 22),
          wrongCount: 0,
          cooldownUntil: "",
          locked: false,
          presentationOverride: {},
          lastAnswer: "A",
          question: questionBank["asg-echo-l2"],
        },
      ],
      clues: [
        {
          id: "clue-echo-letter",
          source: "session",
          definitionId: "clue-echo-letter",
          question: "",
          sessionLevel: "asg-echo-l2",
          trigger: "session_completed",
          kind: "letter",
          position: 1,
          narrative: "nar-echo-letter",
          autoPlay: false,
          unlockedAt: iso(-60 * 22),
          content: {
            title: "旧日星图的余光",
            text: "冬夜回响场次通关后保存下来的星海信笺。",
            url: "",
            imageUrls: [],
            buttonText: "重温信笺",
          },
        },
      ],
    },

    "asg-locked": {
      id: "asg-locked",
      player: "player-star",
      session: "sess-locked",
      status: "assigned",
      order: 4,
      startsAt: iso(-60),
      endsAt: iso(60 * 24 * 60),
      startedAt: "",
      completedAt: "",
      previousAssignment: "",
      title: "极光深渊 · 终章试炼",
      description:
        "需要达到 Lv.10 才可启程的远方观测站，用于展示等级锁定状态。",
      minLevel: 10,
      maxLevel: null,
      completedLevels: 0,
      totalLevels: 4,
      presentation: { bgmMode: "silent", backgroundMode: "none" },
      completionTarget: null,
      currentIndex: 0,
      serverTime: iso(0),
      levels: [],
      clues: [],
    },
  };

  const narratives = {
    "nar-polaris-letter": {
      id: "nar-polaris-letter",
      kind: "letter",
      title: "致冬夜观星者",
      payload: {
        from: "北极星观测站 · 守夜人",
        variant: "modern",
        description: "北极星观测站通关纪念信",
        hintText: "轻触信封，展开冬夜留下的星海手记",
        paragraphs: [
          {
            content: "亲爱的旅人：",
            align: "left",
            delayMs: 220,
          },
          {
            content:
              "当你拆开这封信时，圆顶上的六重星环已经重新归位，镜筒正中的那颗北极星也再次被点亮。",
            align: "left",
            delayMs: 360,
          },
          {
            content:
              "愿你在每一次抬头望向夜空的时候，都能在自己的星图里找到笃定而不偏航的方向。",
            align: "left",
            delayMs: 360,
          },
          {
            content: "下一次星环相逢见。",
            align: "right",
            delayMs: 420,
          },
        ],
        backgroundImages: [],
        typingSpeedMs: 42,
      },
    },
    "nar-echo-letter": {
      id: "nar-echo-letter",
      kind: "letter",
      title: "旧日星图的余光",
      payload: {
        from: "星海档案室",
        variant: "modern",
        description: "冬夜回响场次收藏信笺",
        hintText: "轻触展开往期收藏信笺",
        paragraphs: [
          {
            content:
              "那些走过的旧日星图不会熄灭，它们会一直安静地停留在你的来信与收藏里。",
            align: "left",
            delayMs: 260,
          },
          {
            content: "无论何时回来翻看，这道冰蓝极光都为你留着亮光。",
            align: "left",
            delayMs: 360,
          },
        ],
        backgroundImages: [],
        typingSpeedMs: 42,
      },
    },
  };

  const rewards = [
    {
      id: "rw-bookmark",
      player: "player-star",
      assignment: "asg-echo",
      quantity: 1,
      status: "available",
      claimDetails: "凭核销码 STAR-2026-0827 到观测站前台领取限定玻璃书签。",
      redeemedAt: "",
      created: iso(-60 * 18),
      snapshot: {
        id: "rw-tpl-bookmark",
        name: "星穹极光玻璃书签",
        image: assetUrl("reward-bookmark.svg"),
        description: "在光线下会折射冰蓝星环纹路的典藏书签。",
        claimMethod: "staff",
        publicInstructions: "向现场工作人员出示本页详情即可核销领取。",
      },
    },
    {
      id: "rw-stamp",
      player: "player-star",
      assignment: "asg-echo",
      quantity: 1,
      status: "redeemed",
      claimDetails: "",
      redeemedAt: iso(-60 * 12),
      created: iso(-60 * 22),
      snapshot: {
        id: "rw-tpl-stamp",
        name: "启程纪念星邮票",
        image: assetUrl("reward-stamp.svg"),
        description: "记录第一次踏上赴星之旅的专属纪念邮票。",
        claimMethod: "location",
        publicInstructions: "已完成领取，私密领取信息已自动隐藏。",
      },
    },
  ];

  const notifications = [
    {
      id: "ntf-observatory-welcome",
      title: "观测站开启通知",
      popupTitle: "来自北极星观测站的紧急来信",
      content:
        "今夜大气透明度极佳，[[北极星观测站]] 的圆顶已为你单独开放。\n\n本信同时绑定在观测站场次内：进入答题页后也可通过右下角悬浮铃铛打开，用来对照检验「来信双入口」的一致极光玻璃视觉。",
      buttonText: "收下来信",
      sentAt: iso(-12),
      readAt: "",
      assignmentId: "asg-first",
    },
    {
      id: "ntf-archive-log",
      title: "冬夜回响已归档",
      popupTitle: "冬夜回响已归档",
      content:
        "你此前完成的《冬夜回响 · 旧日星图》已归入「回响」档案，随时可以回去重温星海信笺与线索。",
      buttonText: "知道了",
      sentAt: iso(-60 * 20),
      readAt: iso(-60 * 19),
      assignmentId: "asg-echo",
    },
  ];

  return {
    delayMs: 550,
    players: {
      "token-star": starPlayer,
      "token-new": newPlayer,
    },
    assignments,
    questionBank,
    answerKeys,
    unlockableClues,
    narratives,
    rewards,
    notifications,
    uploadedFiles: new Map(),
    processedRequests: new Map(),
    noticeCounter: 1,
  };
}

let state = createInitialState();

function sleep(ms) {
  return ms > 0
    ? new Promise((resolve) => setTimeout(resolve, ms))
    : Promise.resolve();
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, code, message) {
  sendJson(res, status, { error: { code, message } });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** 轻量 multipart/form-data 解析器（用于本地体验裁剪头像上传） */
function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!match) return { fields: {}, files: {} };
  const boundary = `--${match[1] || match[2]}`;
  const boundaryBuf = Buffer.from(boundary);
  const fields = {};
  const files = {};

  let cursor = buffer.indexOf(boundaryBuf);
  while (cursor !== -1) {
    const partStart = cursor + boundaryBuf.length;
    if (buffer.subarray(partStart, partStart + 2).toString() === "--") break;
    const headerStart = partStart + 2; // 跳过 \r\n
    const headerEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), headerStart);
    if (headerEnd === -1) break;
    const rawHeaders = buffer.subarray(headerStart, headerEnd).toString("utf8");
    const nextBoundary = buffer.indexOf(boundaryBuf, headerEnd + 4);
    if (nextBoundary === -1) break;
    const body = buffer.subarray(headerEnd + 4, nextBoundary - 2); // 去掉结尾 \r\n

    const nameMatch = /name="([^"]+)"/i.exec(rawHeaders);
    const filenameMatch = /filename="([^"]+)"/i.exec(rawHeaders);
    const typeMatch = /content-type:\s*([^\r\n]+)/i.exec(rawHeaders);
    if (nameMatch) {
      if (filenameMatch) {
        files[nameMatch[1]] = {
          filename: filenameMatch[1],
          contentType: typeMatch ? typeMatch[1].trim() : "image/png",
          data: body,
        };
      } else {
        fields[nameMatch[1]] = body.toString("utf8");
      }
    }
    cursor = nextBoundary;
  }
  return { fields, files };
}

function getAuthedPlayer(req) {
  const token = String(req.headers.authorization || "").trim();
  if (!token || !state.players[token]) return null;
  return { token, player: state.players[token] };
}

function toSummary(assignment) {
  return {
    id: assignment.id,
    player: assignment.player,
    session: assignment.session,
    status: assignment.status,
    order: assignment.order,
    startsAt: assignment.startsAt,
    endsAt: assignment.endsAt,
    startedAt: assignment.startedAt,
    completedAt: assignment.completedAt,
    previousAssignment: assignment.previousAssignment,
    title: assignment.title,
    description: assignment.description,
    minLevel: assignment.minLevel,
    maxLevel: assignment.maxLevel,
    completedLevels: assignment.completedLevels,
    totalLevels: assignment.totalLevels,
  };
}

function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function renderControlPanelHtml() {
  const star = state.players["token-star"];
  const firstAsg = state.assignments["asg-first"];
  const unreadCount = state.notifications.filter((n) => !n.readAt).length;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>赴星之约 · 本地 Mock 沙盒控制台</title>
  <style>
    :root { color-scheme: dark; font-family: "PingFang SC", system-ui, sans-serif; }
    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 20% 0%, #15254a, #070a12 65%); color: #e2eafb; padding: 28px 20px 60px; }
    .wrap { max-width: 820px; margin: 0 auto; display: grid; gap: 18px; }
    .card { background: rgba(20, 29, 52, 0.78); border: 1px solid rgba(141, 180, 255, 0.24); border-radius: 20px; padding: 20px 24px; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4); }
    h1 { margin: 0 0 6px; font-size: 22px; color: #f4f7ff; }
    h2 { margin: 0 0 12px; font-size: 16px; color: #9ec0ff; }
    p { margin: 0; color: #9aa7c2; line-height: 1.6; font-size: 14px; }
    .row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
    button, a.btn { cursor: pointer; border: 1px solid rgba(141, 180, 255, 0.35); background: rgba(141, 180, 255, 0.14); color: #eef3ff; border-radius: 999px; padding: 9px 16px; font-size: 13px; font-weight: 600; text-decoration: none; transition: 160ms; }
    button:hover, a.btn:hover { background: rgba(141, 180, 255, 0.28); }
    button.primary, a.btn.primary { background: #8db4ff; color: #07101f; border-color: #8db4ff; }
    button.gold { background: rgba(227, 194, 122, 0.18); border-color: rgba(227, 194, 122, 0.55); color: #f3d796; }
    button.danger { background: rgba(226, 139, 139, 0.16); border-color: rgba(226, 139, 139, 0.45); color: #f7b7b7; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid rgba(141, 180, 255, 0.14); }
    th { color: #9ec0ff; font-weight: 600; }
    code { background: rgba(141, 180, 255, 0.14); padding: 2px 6px; border-radius: 6px; color: #dbe7ff; }
    .status { font-size: 13px; color: #7cd4c0; min-height: 20px; margin-top: 10px; }
    .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .pill { font-size: 12px; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,0.06); border: 1px solid rgba(141, 180, 255, 0.2); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>赴星之约 · 本地全链路 Mock 沙盒控制台</h1>
      <p>运行于本地内存，零影响真实后端与生产构建。随时可重置进度重新体验首次入场、答题与升级礼赞。</p>
      <div class="pills">
        <span class="pill">当前角色：${star.displayName}（Lv.${star.level.order} ${star.level.name} · ${star.totalXp} EXP）</span>
        <span class="pill">首次场次状态：${firstAsg.status}（${firstAsg.completedLevels}/${firstAsg.totalLevels}）</span>
        <span class="pill">未读来信：${unreadCount}</span>
        <span class="pill">模拟加载延迟：${state.delayMs}ms</span>
      </div>
      <div class="row">
        <a class="btn primary" href="http://127.0.0.1:${process.env.MOCK_WEB_PORT || 5174}/login" target="_blank" rel="noreferrer">打开赴星之约（登录页）</a>
        <a class="btn" href="http://127.0.0.1:${process.env.MOCK_WEB_PORT || 5174}/" target="_blank" rel="noreferrer">直接进启程大厅</a>
        <button class="danger" onclick="act('/__mock/reset', '已重置全部 Mock 进度（请刷新或退出重登以同时清空本地引导标记）')">重置全部进度</button>
        <button class="gold" onclick="act('/__mock/near-rankup', '已将经验调至 1450/1500，下一题答对立刻触发升级特效！')">调至升级临界经验</button>
        <button onclick="act('/__mock/push-notice', '已推送一封新未读来信，5 秒内将在答题页悬浮铃铛与来信页出现')">推送新未读来信</button>
      </div>
      <div class="row">
        <button onclick="setDelay(0)">延迟 0ms（极速）</button>
        <button onclick="setDelay(550)">延迟 550ms（默认看星环加载）</button>
        <button onclick="setDelay(1800)">延迟 1800ms（慢网细赏星环加载）</button>
      </div>
      <div id="msg" class="status"></div>
    </div>

    <div class="card">
      <h2>测试账号速查</h2>
      <table>
        <thead><tr><th>账号</th><th>密码</th><th>场景说明</th></tr></thead>
        <tbody>
          <tr><td><code>star</code>（或任意其它非 new 账号）</td><td>任意非 <code>wrong</code>（如 <code>123456</code>）</td><td>常规冒险者（Lv.7 观星者，1240/1500 EXP），登录后直达启程大厅</td></tr>
          <tr><td><code>new</code></td><td>任意非 <code>wrong</code>（如 <code>123456</code>）</td><td>体验首次登录「强制修改密码」流程</td></tr>
          <tr><td>任意账号</td><td><code>wrong</code></td><td>体验登录密码错误提示</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>场次与正确答案速查</h2>
      <table>
        <thead><tr><th>场次 / 关卡</th><th>正确答案</th><th>重点体验项</th></tr></thead>
        <tbody>
          <tr><td>北极星观测站 · 入口</td><td>点击「开始本场冒险」</td><td>首次访问冒险简报页 → 入场加载 → 首次作答引导高亮</td></tr>
          <tr><td>北极星观测站 · 第 1 题（填空）</td><td><code>北极星</code></td><td>右上角灯泡提示 Sheet、透明观测台插图、答错冷却（连错 2 次 10 秒）、答对 +150 EXP 星芒</td></tr>
          <tr><td>北极星观测站 · 第 2 题（6 选 1）</td><td><code>B</code>（北极星 · 永不偏移的坐标）</td><td>6 选项自适应完整展开、选项配图预览、答对 +150 EXP 触发「星穹加冕」升级特效、答完后可只读重展</td></tr>
          <tr><td>北极星观测站 · 第 3 题（长文）</td><td><code>赴星之约</code></td><td>下滑自动隐藏/上滑显示悬浮顶栏、多图画廊、通关解锁专属星海信件与荣耀金纪念徽章</td></tr>
          <tr><td>星海长廊 · 第 1 / 2 题</td><td>第 1 题已答 <code>C</code>；第 2 题 <code>A</code></td><td>直接体验已答选择题只读展开 + 10 选项超长列表内部滚动</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <script>
    async function act(path, okText) {
      await fetch(path, { method: 'POST' });
      document.getElementById('msg').textContent = okText;
      setTimeout(() => location.reload(), 650);
    }
    async function setDelay(ms) {
      await fetch('/__mock/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delayMs: ms }),
      });
      document.getElementById('msg').textContent = '已设置模拟加载延迟为 ' + ms + 'ms';
      setTimeout(() => location.reload(), 450);
    }
  </script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", BASE_URL);
  const { pathname } = url;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    });
    res.end();
    return;
  }

  // Mock 控制台与管理端点
  if (pathname === "/__mock" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderControlPanelHtml());
    return;
  }
  if (pathname === "/__mock/reset" && req.method === "POST") {
    const prevDelay = state.delayMs;
    state = createInitialState();
    state.delayMs = prevDelay;
    sendJson(res, 200, { ok: true });
    return;
  }
  if (pathname === "/__mock/config" && req.method === "POST") {
    const raw = await readRawBody(req);
    const body = JSON.parse(raw.toString("utf8") || "{}");
    if (
      typeof body.delayMs === "number" &&
      body.delayMs >= 0 &&
      body.delayMs <= 10000
    ) {
      state.delayMs = Math.round(body.delayMs);
    }
    sendJson(res, 200, { delayMs: state.delayMs });
    return;
  }
  if (pathname === "/__mock/near-rankup" && req.method === "POST") {
    const p = state.players["token-star"];
    p.totalXp = 1450;
    Object.assign(p, resolveRanks(p.totalXp));
    sendJson(res, 200, { player: p });
    return;
  }
  if (pathname === "/__mock/push-notice" && req.method === "POST") {
    const id = `ntf-live-${state.noticeCounter++}`;
    state.notifications.unshift({
      id,
      title: `星海实时来信 #${state.noticeCounter - 1}`,
      popupTitle: "星海实时来信",
      content:
        "这是一封通过本地 Mock 控制台实时推送的来信。你可以在答题页点击悬浮铃铛，或前往「来信」页同步收下。",
      buttonText: "收下来信",
      sentAt: new Date().toISOString(),
      readAt: "",
      assignmentId: "asg-first",
    });
    sendJson(res, 200, { ok: true, id });
    return;
  }

  // 内置 SVG 资源与上传头像文件读取
  if (pathname.startsWith("/mock-assets/")) {
    const name = pathname.slice("/mock-assets/".length);
    const svg = MOCK_SVGS[name];
    if (!svg) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    });
    res.end(svg);
    return;
  }

  const fileMatch = /^\/api\/files\/game_players\/([^/]+)\/([^/]+)$/.exec(
    pathname,
  );
  if (fileMatch && req.method === "GET") {
    const filename = decodeURIComponent(fileMatch[2]);
    const uploaded = state.uploadedFiles.get(filename);
    if (uploaded) {
      res.writeHead(200, {
        "Content-Type": uploaded.contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      });
      res.end(uploaded.data);
      return;
    }
    const svg = MOCK_SVGS[filename];
    if (svg) {
      res.writeHead(200, {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(svg);
      return;
    }
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  // 1. 登录鉴权
  if (
    pathname === "/api/collections/game_players/auth-with-password" &&
    req.method === "POST"
  ) {
    await sleep(Math.min(state.delayMs, 450));
    const raw = await readRawBody(req);
    const body = JSON.parse(raw.toString("utf8") || "{}");
    const identity = String(body.identity || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    if (!identity || !password || password === "wrong") {
      sendError(
        res,
        401,
        "INVALID_CREDENTIALS",
        "账号或密码不正确（输入非 wrong 密码即可进入）",
      );
      return;
    }
    const token = identity === "new" ? "token-new" : "token-star";
    const player = state.players[token];
    sendJson(res, 200, { token, record: { id: player.id } });
    return;
  }

  // 2. 文件访问短期 Token
  if (pathname === "/api/files/token" && req.method === "POST") {
    const authed = getAuthedPlayer(req);
    if (!authed) {
      sendError(res, 401, "UNAUTHORIZED", "请先登录");
      return;
    }
    sendJson(res, 200, { token: `file-token-${Date.now()}` });
    return;
  }

  // 以下全部为 /api/questions/v1/* 业务端点
  const authed = getAuthedPlayer(req);
  if (!authed) {
    sendError(res, 401, "UNAUTHORIZED", "登录状态已失效，请重新登录");
    return;
  }
  const { player } = authed;

  // 3. 当前玩家资料
  if (pathname === "/api/questions/v1/me" && req.method === "GET") {
    await sleep(state.delayMs);
    sendJson(res, 200, player);
    return;
  }

  // 4. 修改昵称与头像（兼容 JSON 与 multipart 裁剪头像）
  if (pathname === "/api/questions/v1/me/profile" && req.method === "PATCH") {
    await sleep(220);
    const contentType = String(req.headers["content-type"] || "");
    const raw = await readRawBody(req);
    if (contentType.includes("multipart/form-data")) {
      const { fields, files } = parseMultipart(raw, contentType);
      if (fields.displayName && fields.displayName.trim()) {
        player.displayName = fields.displayName.trim();
      }
      if (files.avatar && files.avatar.data.length > 0) {
        const ext = files.avatar.contentType.includes("webp")
          ? "webp"
          : files.avatar.contentType.includes("jpeg")
            ? "jpg"
            : "png";
        const fileName = `avatar-${Date.now()}.${ext}`;
        state.uploadedFiles.set(fileName, files.avatar);
        player.avatar = fileName;
      }
    } else {
      const body = JSON.parse(raw.toString("utf8") || "{}");
      if (typeof body.displayName === "string" && body.displayName.trim()) {
        player.displayName = body.displayName.trim();
      }
    }
    sendJson(res, 200, player);
    return;
  }

  // 5. 修改密码（支持首次登录强制改密放行）
  if (
    pathname === "/api/questions/v1/me/change-password" &&
    req.method === "POST"
  ) {
    await sleep(260);
    const raw = await readRawBody(req);
    const body = JSON.parse(raw.toString("utf8") || "{}");
    if (!body.password || body.password.length < 8) {
      sendError(res, 400, "WEAK_PASSWORD", "新密码至少需要 8 位字符");
      return;
    }
    if (body.password !== body.passwordConfirm) {
      sendError(res, 400, "PASSWORD_MISMATCH", "两次输入的新密码不一致");
      return;
    }
    player.mustChangePassword = false;
    sendJson(res, 200, { token: authed.token, player });
    return;
  }

  // 6. 场次列表
  if (pathname === "/api/questions/v1/assignments" && req.method === "GET") {
    await sleep(Math.min(state.delayMs, 350));
    const items = Object.values(state.assignments)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({ ...toSummary(item), player: player.id }));
    sendJson(res, 200, { items });
    return;
  }

  // 7. 场次详情
  const asgMatch = /^\/api\/questions\/v1\/assignments\/([^/]+)$/.exec(
    pathname,
  );
  if (asgMatch && req.method === "GET") {
    await sleep(state.delayMs);
    const id = decodeURIComponent(asgMatch[1]);
    const asg = state.assignments[id];
    if (!asg) {
      sendError(res, 404, "NOT_FOUND", "未找到该冒险场次");
      return;
    }
    sendJson(res, 200, {
      ...asg,
      player: player.id,
      serverTime: new Date().toISOString(),
    });
    return;
  }

  // 8. 首次入场（从冒险简报页进入第 1 题）
  const startMatch = /^\/api\/questions\/v1\/assignments\/([^/]+)\/start$/.exec(
    pathname,
  );
  if (startMatch && req.method === "POST") {
    await sleep(Math.min(state.delayMs, 420));
    const id = decodeURIComponent(startMatch[1]);
    const asg = state.assignments[id];
    if (!asg) {
      sendError(res, 404, "NOT_FOUND", "未找到该冒险场次");
      return;
    }
    if (player.level.order < asg.minLevel) {
      sendError(
        res,
        403,
        "LEVEL_REQUIRED",
        `需要达到 Lv.${asg.minLevel} 才可进入该场次`,
      );
      return;
    }
    if (asg.status === "assigned") {
      asg.status = "active";
      asg.startedAt = new Date().toISOString();
      asg.currentIndex = 0;
      if (asg.levels[0] && !asg.levels[0].question) {
        asg.levels[0].question = state.questionBank[asg.levels[0].id] ?? null;
      }
    }
    sendJson(res, 200, {
      ...asg,
      player: player.id,
      serverTime: new Date().toISOString(),
    });
    return;
  }

  // 9. 提交判题（含答错冷却、答对经验增长、跨门槛升级、解锁线索/终章信件与奖品）
  const ansMatch = /^\/api\/questions\/v1\/assignments\/([^/]+)\/answers$/.exec(
    pathname,
  );
  if (ansMatch && req.method === "POST") {
    await sleep(260);
    const id = decodeURIComponent(ansMatch[1]);
    const asg = state.assignments[id];
    if (!asg) {
      sendError(res, 404, "NOT_FOUND", "未找到该冒险场次");
      return;
    }
    const raw = await readRawBody(req);
    const body = JSON.parse(raw.toString("utf8") || "{}");
    const { sessionLevelId, answer, requestId } = body;

    if (requestId && state.processedRequests.has(requestId)) {
      sendJson(res, 200, state.processedRequests.get(requestId));
      return;
    }

    const levelIndex = asg.levels.findIndex(
      (item) => item.id === sessionLevelId,
    );
    const level = asg.levels[levelIndex];
    if (!level) {
      sendError(res, 404, "LEVEL_NOT_FOUND", "当前关卡不存在");
      return;
    }

    if (level.completedAt) {
      const payload = {
        result: "already_completed",
        xpDelta: 0,
        rewardIds: [],
        effects: [],
        assignment: {
          ...asg,
          player: player.id,
          serverTime: new Date().toISOString(),
        },
        player,
      };
      sendJson(res, 200, payload);
      return;
    }

    const nowMs = Date.now();
    if (level.cooldownUntil && Date.parse(level.cooldownUntil) > nowMs) {
      sendError(res, 429, "COOLDOWN", "冷静倒计时尚未结束，请稍后再试");
      return;
    }

    const expected = state.answerKeys[level.id] || [];
    const normalized = normalizeAnswer(answer);
    const matched = expected.some(
      (candidate) => normalizeAnswer(candidate) === normalized,
    );

    if (!matched) {
      level.wrongCount += 1;
      level.lastAnswer = String(answer || "");
      // 连续答错第 2 次起触发 10 秒冷却倒计时
      if (level.wrongCount >= 2) {
        level.cooldownUntil = new Date(nowMs + 10_000).toISOString();
      }
      const payload = {
        result: "incorrect",
        xpDelta: 0,
        rewardIds: [],
        effects: [],
        assignment: {
          ...asg,
          player: player.id,
          serverTime: new Date().toISOString(),
        },
        player,
      };
      if (requestId) state.processedRequests.set(requestId, payload);
      sendJson(res, 200, payload);
      return;
    }

    // 答对：记录完成、发放经验与升级、解锁下一关与对应线索
    const nowIso = new Date().toISOString();
    level.completedAt = nowIso;
    level.lastAnswer = String(answer || "").trim();
    level.cooldownUntil = "";

    const xpDelta = level.xp;
    player.totalXp += xpDelta;
    Object.assign(player, resolveRanks(player.totalXp));

    asg.completedLevels = asg.levels.filter((item) =>
      Boolean(item.completedAt),
    ).length;

    const nextLevel = asg.levels[levelIndex + 1];
    if (nextLevel) {
      if (!nextLevel.question) {
        nextLevel.question = state.questionBank[nextLevel.id] ?? null;
      }
      asg.currentIndex = levelIndex + 1;
    }

    const effects = [];
    const newClues = state.unlockableClues[level.id] || [];
    for (const clue of newClues) {
      if (!asg.clues.some((existing) => existing.id === clue.id)) {
        asg.clues.push({ ...clue, unlockedAt: nowIso });
        effects.push({
          type: "clue",
          clueId: clue.id,
          autoPlay: Boolean(clue.autoPlay),
        });
      }
    }

    const rewardIds = [];
    if (asg.completedLevels >= asg.totalLevels) {
      asg.status = "completed";
      asg.completedAt = nowIso;
      const finalClues = state.unlockableClues[`${asg.id}-complete`] || [];
      for (const clue of finalClues) {
        if (!asg.clues.some((existing) => existing.id === clue.id)) {
          asg.clues.push({ ...clue, unlockedAt: nowIso });
        }
      }
      // 通关北极星观测站后动态发放一件荣耀金新奖品
      if (
        asg.id === "asg-first" &&
        !state.rewards.some((item) => item.id === "rw-polaris-badge")
      ) {
        state.rewards.unshift({
          id: "rw-polaris-badge",
          player: player.id,
          assignment: asg.id,
          quantity: 1,
          status: "available",
          claimDetails: "凭核销码 POLARIS-2026-WIN 领取观测站荣耀金纪念徽章。",
          redeemedAt: "",
          created: nowIso,
          snapshot: {
            id: "rw-tpl-badge",
            name: "北极星观测纪念徽章",
            image: assetUrl("reward-badge.svg"),
            description: "点亮北极星观测站全部三枚星标后铸造的专属纪念徽章。",
            claimMethod: "staff",
            publicInstructions: "恭喜通关！向工作人员出示详情即可核销领取。",
          },
        });
        rewardIds.push("rw-polaris-badge");
      }
    }

    const payload = {
      result: "correct",
      xpDelta,
      rewardIds,
      effects,
      assignment: { ...asg, player: player.id, serverTime: nowIso },
      player,
    };
    if (requestId) state.processedRequests.set(requestId, payload);
    sendJson(res, 200, payload);
    return;
  }

  // 10. 叙事信件详情
  const narMatch =
    /^\/api\/questions\/v1\/assignments\/([^/]+)\/narratives\/([^/]+)$/.exec(
      pathname,
    );
  if (narMatch && req.method === "GET") {
    await sleep(state.delayMs);
    const contentId = decodeURIComponent(narMatch[2]);
    const narrative = state.narratives[contentId];
    if (!narrative) {
      sendError(res, 404, "NOT_FOUND", "未找到该星海信件");
      return;
    }
    sendJson(res, 200, narrative);
    return;
  }

  // 11. 收藏奖品列表
  if (pathname === "/api/questions/v1/rewards" && req.method === "GET") {
    await sleep(Math.min(state.delayMs, 300));
    sendJson(res, 200, {
      items: state.rewards.map((item) => ({ ...item, player: player.id })),
    });
    return;
  }

  // 12. 来信列表与标为已读
  if (pathname === "/api/questions/v1/notifications" && req.method === "GET") {
    await sleep(Math.min(state.delayMs, 300));
    sendJson(res, 200, { items: state.notifications });
    return;
  }

  const readNotifMatch =
    /^\/api\/questions\/v1\/notifications\/([^/]+)\/read$/.exec(pathname);
  if (readNotifMatch && req.method === "POST") {
    await sleep(180);
    const id = decodeURIComponent(readNotifMatch[1]);
    const note = state.notifications.find((item) => item.id === id);
    if (note && !note.readAt) note.readAt = new Date().toISOString();
    sendJson(res, 200, note ?? { ok: true });
    return;
  }

  sendError(
    res,
    404,
    "NOT_FOUND",
    `Mock 服务未实现接口：${req.method} ${pathname}`,
  );
});

server.listen(PORT, HOST, () => {
  console.log(`[mock-api] 赴星之约本地 Mock API 已启动：${BASE_URL}`);
  console.log(`[mock-api] Mock 控制台与答案速查：${BASE_URL}/__mock`);
});
