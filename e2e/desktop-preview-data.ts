import type { GameAssignment, GameClue } from "@/api/game.contracts";
import type { Letter } from "@/domain/letter/types";
import { makeAssignment } from "@/test/game-fixtures";

export const desktopVideoClue: GameClue = {
  id: "preview-scene",
  source: "session",
  definitionId: "preview-scene",
  question: "",
  sessionLevel: "preview-step-0",
  trigger: "level_completed",
  kind: "video",
  position: 0,
  narrative: "",
  autoPlay: false,
  unlockedAt: "2026-08-28T08:10:00Z",
  content: {
    title: "场景回溯",
    text: "旧观测台的灯再次亮起。重温这一幕，寻找被忽略的细节。",
    url: "https://assets.example/scene.mp4",
    imageUrls: [],
    buttonText: "",
  },
};

/** Static, unlocked content for local visual review only. Never imported by production. */
export const desktopAssignment: GameAssignment = {
  ...makeAssignment({ completedLevels: 1, totalLevels: 3 }),
  presentation: { bgmMode: "silent", backgroundMode: "none" },
  completionTarget: null,
  currentIndex: 1,
  serverTime: new Date().toISOString(),
  levels: ["微光初现", "星图上的北方", "最后一枚星印"].map((title, index) => ({
    id: `preview-step-${index}`,
    position: index + 1,
    xp: 50,
    autoNext: false,
    completedAt: index === 0 ? "2026-08-28T08:10:00Z" : "",
    wrongCount: 0,
    cooldownUntil: "",
    locked: false,
    presentationOverride: {},
    lastAnswer: "",
    question:
      index === 2
        ? null
        : {
            id: `preview-question-${index}`,
            kind: "choice",
            title,
            placeholder: "",
            content: [
              {
                text: "旧观测台的指针停在夜空中央。守夜人留下的手记里，哪一颗星能带你找到北方？\n\n对照右侧已收集的线索，选出你的答案。",
                hint: "",
                imageUrl: "",
                imageUrls: [],
                videoUrl: "",
              },
            ],
            options: ["启明星", "北极星", "天狼星", "织女星"].map(
              (text, i) => ({
                key: "ABCD"[i],
                text,
                imageUrl: "",
                videoUrl: "",
              }),
            ),
          },
  })),
  clues: [
    desktopVideoClue,
    {
      id: "preview-map",
      source: "session",
      definitionId: "preview-map",
      question: "",
      sessionLevel: "preview-step-0",
      trigger: "level_completed",
      kind: "image",
      position: 1,
      narrative: "",
      autoPlay: false,
      unlockedAt: "2026-08-28T08:10:00Z",
      content: {
        title: "旧观测台的罗盘",
        text: "罗盘上的刻痕指向同一个方向。",
        url: "",
        imageUrls: ["/compass.svg"],
        buttonText: "",
      },
    },
    {
      id: "preview-journal",
      source: "session",
      definitionId: "preview-journal",
      question: "",
      sessionLevel: "preview-step-0",
      trigger: "level_completed",
      kind: "text",
      position: 2,
      narrative: "",
      autoPlay: false,
      unlockedAt: "2026-08-28T08:10:00Z",
      content: {
        title: "守夜人的手记",
        text: "夜空中的星辰随时间转动，只有它，几乎始终停在原处。\n\n沿着北斗勺口两颗星的连线，向外延伸约五倍距离，就能找到那束不曾离开的微光。\n\n“迷路的时候，抬头看。北方一直在那里。”",
        url: "",
        imageUrls: [],
        buttonText: "",
      },
    },
  ],
};

export const desktopNarrativeAssignment: GameAssignment = {
  ...desktopAssignment,
  id: "preview-narrative",
  clues: [
    ...desktopAssignment.clues,
    {
      id: "preview-letter-clue",
      source: "session",
      definitionId: "preview-letter-clue",
      question: "",
      sessionLevel: "preview-step-0",
      trigger: "level_completed",
      kind: "letter",
      position: 3,
      narrative: "preview-letter",
      autoPlay: false,
      unlockedAt: "2026-08-28T08:10:00Z",
      content: {
        title: "写给仍在寻找的你",
        text: "守夜人留下了一封只属于你的来信。",
        url: "",
        imageUrls: [],
        buttonText: "开启来信",
      },
    },
  ],
};

export const desktopLetter: Letter = {
  id: "preview-letter",
  from: "守夜人",
  variant: "modern",
  title: "写给仍在寻找的你",
  description: "来自旧观测台的一封信",
  hintText: "轻触信封，展开故事",
  backgroundImages: [],
  typingSpeedMs: 35,
  revision: "preview",
  paragraphs: [
    "亲爱的旅人：",
    "当你读到这封信时，想必已经穿过了那片没有路标的森林。谢谢你没有在第一个岔路口转身，也谢谢你，愿意为一束微弱的星光停留。",
    "观测台的钟很久没有走动了，但这里的星空从不迟到。你在石阶上找到的刻痕，并不是日期——那是我们约定的方向。",
    "请把收集到的线索放在一起。沿着北斗的勺口，看向五倍距离之外：有一颗星，始终在原处等你。",
    "不必着急。真正重要的答案，往往要慢慢靠近。愿你带着好奇心，走进故事的下一页。",
    "守夜人 · 于星光最亮的夜晚",
  ].map((content, i) => ({
    content,
    align: i === 5 ? "right" : "left",
    delayMs: 0,
  })),
};
