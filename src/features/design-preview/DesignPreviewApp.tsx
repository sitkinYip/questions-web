import { useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BinocularsIcon,
  CaretRightIcon,
  CellSignalFullIcon,
  CompassIcon,
  DesktopIcon,
  DeviceMobileIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  LightbulbFilamentIcon,
  LockSimpleIcon,
  MoonIcon,
  ScrollIcon,
  StarFourIcon,
  SunIcon,
  WifiHighIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { ThemeMode } from "@/design/tokens";
import { GlassSurface } from "@/design/components/GlassSurface";
import { StarRing } from "@/design/components/StarRing";
import {
  FloatingTabBar,
  type TabKey,
} from "@/design/components/FloatingTabBar";
import { StarfieldBackdrop } from "@/design/components/StarfieldBackdrop";
import { StarBurstOverlay } from "@/design/components/StarBurst";
import { useCountUp } from "@/design/useCountUp";

type SceneKey =
  "login" | "lobby" | "quest" | "rewards" | "mailbox" | "passport";
type ViewportMode = "mobile" | "desktop";

interface SessionItem {
  id: string;
  title: string;
  done: number;
  total: number;
  active?: boolean;
  lockedLevel?: number;
}

const UPCOMING_SESSIONS: ReadonlyArray<SessionItem> = [
  { id: "polaris", title: "北极星观测站", done: 2, total: 5, active: true },
  { id: "tide", title: "潮汐灯塔", done: 0, total: 3 },
  { id: "solstice", title: "冬至天文台", done: 0, total: 4, lockedLevel: 9 },
];

const HISTORY_SESSIONS: ReadonlyArray<SessionItem> = [
  { id: "equinox", title: "秋分气象塔", done: 4, total: 4 },
  { id: "harbor", title: "旧港雾钟", done: 3, total: 3 },
];

interface RewardItem {
  id: string;
  name: string;
  qty: number;
  rare: boolean;
  claimed: boolean;
  detail: string;
  icon: "compass" | "letter" | "telescope" | "scroll";
}

const REWARDS: ReadonlyArray<RewardItem> = [
  {
    id: "r1",
    name: "星辉罗盘",
    qty: 1,
    rare: true,
    claimed: false,
    detail: "完成「北极星观测站」全章后解锁的实体纪念罗盘。",
    icon: "compass",
  },
  {
    id: "r2",
    name: "封蜡来信",
    qty: 1,
    rare: false,
    claimed: false,
    detail: "冬夜观测站寄出的火漆信封，内含一段专属手写回信。",
    icon: "letter",
  },
  {
    id: "r3",
    name: "旅者望远镜",
    qty: 1,
    rare: false,
    claimed: false,
    detail: "便携折射镜模型，可向管理员凭核销码领取。",
    icon: "telescope",
  },
  {
    id: "r4",
    name: "星图残卷",
    qty: 2,
    rare: true,
    claimed: true,
    detail: "已领取 · 秋分场次限定烫金星图。",
    icon: "scroll",
  },
];

interface MailItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
  body: string;
}

const INITIAL_MAILS: ReadonlyArray<MailItem> = [
  {
    id: "m1",
    title: "冬夜观测站已开放",
    time: "18:20",
    read: false,
    body: "「北极星观测站」已开放至周日 23:59，当前进度 2/5。",
  },
  {
    id: "m2",
    title: "星辉罗盘等待领取",
    time: "昨天",
    read: false,
    body: "你有一份待领取收藏，请在「收藏」页查看领取方式。",
  },
  {
    id: "m3",
    title: "秋分气象塔已归档",
    time: "11-18",
    read: true,
    body: "本场 4 道题已全部解开，共获得 120 EXP。",
  },
];

const SCENE_TABS: ReadonlyArray<{ key: SceneKey; label: string }> = [
  { key: "login", label: "登录" },
  { key: "lobby", label: "启程" },
  { key: "quest", label: "答题" },
  { key: "rewards", label: "收藏" },
  { key: "mailbox", label: "来信" },
  { key: "passport", label: "护照" },
];

function RewardIcon({ type }: { type: RewardItem["icon"] }) {
  switch (type) {
    case "compass":
      return <CompassIcon size={36} weight="duotone" />;
    case "letter":
      return <EnvelopeSimpleIcon size={36} weight="duotone" />;
    case "telescope":
      return <BinocularsIcon size={36} weight="duotone" />;
    case "scroll":
      return <ScrollIcon size={36} weight="duotone" />;
  }
}

/** 答题页内置天文台星夜矢量插画（零外链失效风险） */
function ObservatoryIllustration() {
  return (
    <svg
      viewBox="0 0 360 156"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-label="夜间观测站穹顶"
    >
      <defs>
        <linearGradient id="obs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#091326" />
          <stop offset="100%" stopColor="#16294B" />
        </linearGradient>
        <linearGradient id="obs-dome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#355182" />
          <stop offset="100%" stopColor="#13213D" />
        </linearGradient>
      </defs>
      <rect width="360" height="156" fill="url(#obs-sky)" />
      <circle cx="52" cy="34" r="1.4" fill="#DCE9FF" opacity="0.8" />
      <circle cx="96" cy="24" r="1" fill="#8DB4FF" opacity="0.7" />
      <circle cx="288" cy="38" r="1.5" fill="#DCE9FF" opacity="0.85" />
      <circle cx="316" cy="64" r="1.1" fill="#8DB4FF" opacity="0.6" />
      <circle cx="242" cy="22" r="2.2" fill="#FFFFFF" opacity="0.95" />
      <path
        d="M0 132 Q90 112 180 128 T360 124 L360 156 L0 156 Z"
        fill="#0B152A"
      />
      <path
        d="M126 112 C126 68 150 44 182 44 C214 44 238 68 238 112 Z"
        fill="url(#obs-dome)"
        stroke="rgba(180,210,255,0.28)"
        strokeWidth="1"
      />
      <rect
        x="120"
        y="108"
        width="124"
        height="48"
        rx="4"
        fill="#111F3A"
        stroke="rgba(180,210,255,0.18)"
        strokeWidth="1"
      />
      <path
        d="M160 54 L144 82 L156 88 L172 60 Z"
        fill="#0A1326"
        stroke="#8DB4FF"
        strokeOpacity="0.45"
      />
      <circle cx="151" cy="70" r="9" fill="#0B1529" stroke="#8DB4FF" />
      <circle cx="151" cy="70" r="4" fill="#8DB4FF" opacity="0.45" />
    </svg>
  );
}

export function DesignPreviewApp() {
  const [scene, setScene] = useState<SceneKey>("lobby");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [viewport, setViewport] = useState<ViewportMode>("mobile");
  const [reducedMotion, setReducedMotion] = useState(false);

  // 登录页状态
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // 大厅与收藏分段
  const [lobbyTab, setLobbyTab] = useState<"upcoming" | "history">("upcoming");
  const [rewardTab, setRewardTab] = useState<"unclaimed" | "claimed">(
    "unclaimed",
  );

  // 答题页状态
  const [questionIndex, setQuestionIndex] = useState(2); // 0-based，默认第 3 题
  const [answer, setAnswer] = useState("");
  const [wrongShake, setWrongShake] = useState(false);
  const [wrongHint, setWrongHint] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [showClue, setShowClue] = useState(false);

  // 收藏与来信详情（同时支持 Router 列表页 + Modal 来信弹窗两种入口）
  const [activeReward, setActiveReward] = useState<RewardItem | null>(null);
  const [mails, setMails] = useState<ReadonlyArray<MailItem>>(INITIAL_MAILS);
  const [activeMail, setActiveMail] = useState<MailItem | null>(null);
  const [modalMail, setModalMail] = useState<MailItem | null>(null);
  const [selectedMailId, setSelectedMailId] = useState<string>(
    INITIAL_MAILS[0].id,
  );
  const [clueRevealed, setClueRevealed] = useState(false);

  const isDesktop = viewport === "desktop";
  const unreadCount = mails.filter((m) => !m.read).length;
  const selectedMail =
    mails.find((m) => m.id === selectedMailId) ?? mails[0] ?? null;
  const passportExp = useCountUp(1240, {
    durationMs: 920,
    active: scene === "passport",
    reducedMotion,
  });

  function triggerCorrect() {
    setWrongHint(false);
    setShowBurst(true);
  }

  function triggerWrong() {
    setWrongHint(true);
    setWrongShake(false);
    requestAnimationFrame(() => setWrongShake(true));
  }

  function handleAnswerSubmit(e: FormEvent) {
    e.preventDefault();
    if (!answer.trim()) {
      triggerWrong();
      return;
    }
    triggerCorrect();
  }

  function handleNextQuestion() {
    setShowBurst(false);
    setAnswer("");
    setQuestionIndex((prev) => (prev + 1) % 5);
  }

  function openMail(item: MailItem) {
    setSelectedMailId(item.id);
    if (!isDesktop) {
      setActiveMail(item);
    }
    if (!item.read) {
      setMails((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, read: true } : m)),
      );
    }
  }

  const showPrimaryNav =
    scene === "lobby" ||
    scene === "rewards" ||
    scene === "mailbox" ||
    scene === "passport";
  const showTabBar = showPrimaryNav && !isDesktop;

  return (
    <div className="pv-stage" data-theme={theme}>
      {/* 外层预览控制条（不属于 App UI） */}
      <header className="pv-toolbar" aria-label="本地预览控制条">
        <div className="pv-group">
          {SCENE_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="pv-chip"
              data-active={scene === item.key}
              onClick={() => {
                setScene(item.key);
                setShowBurst(false);
                setShowClue(false);
                setActiveReward(null);
                setActiveMail(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="pv-group">
          <button
            type="button"
            className="pv-chip"
            data-active={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <MoonIcon size={14} weight="fill" />
            夜间
          </button>
          <button
            type="button"
            className="pv-chip"
            data-active={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <SunIcon size={14} weight="fill" />
            日间
          </button>
          <button
            type="button"
            className="pv-chip"
            data-active={viewport === "mobile"}
            onClick={() => setViewport("mobile")}
          >
            <DeviceMobileIcon size={14} />
            手机
          </button>
          <button
            type="button"
            className="pv-chip"
            data-active={viewport === "desktop"}
            onClick={() => setViewport("desktop")}
          >
            <DesktopIcon size={14} />
            桌面
          </button>
          <button
            type="button"
            className="pv-chip"
            data-active={reducedMotion}
            onClick={() => setReducedMotion((v) => !v)}
          >
            减少动画
          </button>
        </div>
      </header>

      {/* 极光玻璃 v2 预览画布 */}
      <div className="pv-frame" data-viewport={viewport}>
        <div
          className="sw-root pv-app"
          data-theme={theme}
          data-reduced-motion={reducedMotion ? "true" : undefined}
        >
          <StarfieldBackdrop />

          {viewport === "mobile" && (
            <div className="pv-statusbar" aria-hidden="true">
              <span className="sw-tabular">09:41</span>
              <span className="pv-statusbar__icons">
                <CellSignalFullIcon size={14} weight="fill" />
                <WifiHighIcon size={14} weight="bold" />
              </span>
            </div>
          )}

          {/* PC 桌面顶栏胶囊导航（替代手机底栏） */}
          {isDesktop && showPrimaryNav && (
            <GlassSurface
              className="pv-desktop-nav"
              elevation="floating"
              radius="pill"
              blur="strong"
            >
              <nav className="pv-desktop-nav__inner" aria-label="桌面主导航">
                <button
                  type="button"
                  className="pv-desktop-brand"
                  onClick={() => setScene("lobby")}
                >
                  <img src="/branding/starward-mark-96.png" alt="" />
                  <span>赴星之约</span>
                </button>

                <div className="pv-desktop-links">
                  {(
                    [
                      { key: "lobby", label: "启程" },
                      { key: "rewards", label: "收藏" },
                      { key: "mailbox", label: "来信" },
                    ] as const
                  ).map((nav) => (
                    <button
                      key={nav.key}
                      type="button"
                      className="pv-desktop-link"
                      aria-current={scene === nav.key ? "page" : undefined}
                      onClick={() => setScene(nav.key)}
                    >
                      <span>{nav.label}</span>
                      {nav.key === "mailbox" && unreadCount > 0 && (
                        <span className="pv-mail-dot" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pv-desktop-actions">
                  <button
                    type="button"
                    className="pv-icon-btn"
                    aria-label={
                      theme === "dark" ? "切换日间模式" : "切换夜间模式"
                    }
                    onClick={() =>
                      setTheme((t) => (t === "dark" ? "light" : "dark"))
                    }
                  >
                    {theme === "dark" ? (
                      <SunIcon size={18} />
                    ) : (
                      <MoonIcon size={18} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="pv-desktop-passport-btn"
                    aria-current={scene === "passport" ? "page" : undefined}
                    onClick={() => setScene("passport")}
                  >
                    <StarRing
                      progress={1240 / 1500}
                      size={32}
                      strokeWidth={2.5}
                      glow
                    >
                      <span
                        className="pv-avatar"
                        style={{ width: 24, height: 24, fontSize: 12 }}
                      >
                        林
                      </span>
                    </StarRing>
                    <span className="sw-tabular">Lv.7</span>
                  </button>
                </div>
              </nav>
            </GlassSurface>
          )}

          {/* ==================== 1. 登录 ==================== */}
          {scene === "login" && (
            <main className="pv-login">
              <div className="pv-login__brand">
                <img
                  src="/branding/starward-mark-192.png"
                  alt="赴星之约"
                  className="pv-login__mark"
                />
                <h1 className="pv-login__name">赴星之约</h1>
              </div>

              <GlassSurface
                className="pv-login__card"
                elevation="card"
                radius="lg"
                interactive
              >
                <form
                  className="pv-login__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setScene("lobby");
                  }}
                >
                  <div className="pv-field">
                    <input
                      className="pv-input"
                      type="text"
                      placeholder="账号"
                      aria-label="账号"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="pv-field">
                    <input
                      className="pv-input pv-input--icon"
                      type={showPwd ? "text" : "password"}
                      placeholder="密码"
                      aria-label="密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="pv-field__toggle"
                      aria-label={showPwd ? "隐藏密码" : "显示密码"}
                      onClick={() => setShowPwd((v) => !v)}
                    >
                      {showPwd ? (
                        <EyeIcon size={18} />
                      ) : (
                        <EyeSlashIcon size={18} />
                      )}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="sw-btn-primary pv-login__submit"
                  >
                    进入
                  </button>
                </form>
              </GlassSurface>
            </main>
          )}

          {/* ==================== 2. 启程大厅 ==================== */}
          {scene === "lobby" && (
            <main className="pv-scroll">
              {!isDesktop && (
                <div className="pv-header-bar">
                  <button
                    type="button"
                    className="pv-player-pill"
                    onClick={() => setScene("passport")}
                    aria-label="打开护照"
                  >
                    <StarRing
                      progress={1240 / 1500}
                      size={44}
                      strokeWidth={2.8}
                      glow
                    >
                      <span className="pv-avatar">林</span>
                    </StarRing>
                    <span className="pv-level sw-tabular">Lv.7</span>
                  </button>
                </div>
              )}

              <div className="pv-page-head">
                <h1 className="pv-title">启程</h1>
                <div
                  className="sw-segment"
                  role="tablist"
                  aria-label="场次分类"
                  style={
                    {
                      "--seg-index": lobbyTab === "upcoming" ? 0 : 1,
                    } as CSSProperties
                  }
                >
                  <span className="sw-segment__thumb" aria-hidden="true" />
                  <button
                    type="button"
                    role="tab"
                    className="sw-segment__btn"
                    aria-selected={lobbyTab === "upcoming"}
                    data-active={lobbyTab === "upcoming"}
                    onClick={() => setLobbyTab("upcoming")}
                  >
                    待赴
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className="sw-segment__btn"
                    aria-selected={lobbyTab === "history"}
                    data-active={lobbyTab === "history"}
                    onClick={() => setLobbyTab("history")}
                  >
                    回响
                  </button>
                </div>
              </div>

              {isDesktop && lobbyTab === "upcoming" ? (
                <div className="pv-lobby-grid" key="desktop-upcoming">
                  {/* PC 左侧主焦点大卡 */}
                  <button
                    type="button"
                    className="pv-session-btn pv-lobby-hero sw-stagger"
                    style={{ "--stagger-i": 0 } as CSSProperties}
                    onClick={() => setScene("quest")}
                  >
                    <GlassSurface
                      elevation="card"
                      tone="active"
                      radius="lg"
                      interactive
                      className="sw-light-sweep"
                    >
                      <div className="pv-hero-card">
                        <div className="pv-hero-card__top">
                          <h2 className="pv-hero-card__title">
                            {UPCOMING_SESSIONS[0].title}
                          </h2>
                          <StarRing
                            progress={
                              UPCOMING_SESSIONS[0].done /
                              UPCOMING_SESSIONS[0].total
                            }
                            size={74}
                            strokeWidth={4}
                            glow
                            ariaLabel={`${UPCOMING_SESSIONS[0].title} 进度 ${UPCOMING_SESSIONS[0].done}/${UPCOMING_SESSIONS[0].total}`}
                          >
                            <span
                              className="pv-ring-fraction sw-tabular"
                              style={{ fontSize: 16 }}
                            >
                              {UPCOMING_SESSIONS[0].done}
                              <span>/{UPCOMING_SESSIONS[0].total}</span>
                            </span>
                          </StarRing>
                        </div>

                        <div className="pv-hero-card__foot">
                          <div
                            className="pv-stars-progress"
                            style={{ margin: 0 }}
                          >
                            {[0, 1, 2, 3, 4].map((idx) => (
                              <span
                                key={idx}
                                className="pv-star-node"
                                data-state={
                                  idx < 2
                                    ? "done"
                                    : idx === 2
                                      ? "current"
                                      : "todo"
                                }
                              >
                                <StarFourIcon
                                  size={idx === 2 ? 16 : 13}
                                  weight={idx > 2 ? "regular" : "fill"}
                                />
                              </span>
                            ))}
                          </div>
                          <span className="pv-hero-card__cta">
                            继续
                            <ArrowRightIcon size={16} weight="bold" />
                          </span>
                        </div>
                      </div>
                    </GlassSurface>
                  </button>

                  {/* PC 右侧次级场次列 */}
                  <div className="pv-lobby-side">
                    {UPCOMING_SESSIONS.slice(1).map((item, idx) => {
                      const locked = Boolean(item.lockedLevel);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="pv-session-btn sw-stagger"
                          style={{ "--stagger-i": idx + 1 } as CSSProperties}
                          disabled={locked}
                          onClick={() => setScene("quest")}
                        >
                          <GlassSurface
                            elevation="card"
                            tone={locked ? "locked" : "default"}
                            radius="lg"
                            interactive={!locked}
                          >
                            <div className="pv-session-row">
                              <h2 className="pv-session-row__title">
                                {item.title}
                              </h2>
                              <div className="pv-session-row__right">
                                {locked ? (
                                  <span className="pv-locked-meta sw-tabular">
                                    <LockSimpleIcon size={17} />
                                    Lv.{item.lockedLevel}
                                  </span>
                                ) : (
                                  <>
                                    <StarRing
                                      progress={item.done / item.total}
                                      size={52}
                                      strokeWidth={3.5}
                                      ariaLabel={`${item.title} 进度 ${item.done}/${item.total}`}
                                    >
                                      <span className="pv-ring-fraction sw-tabular">
                                        {item.done}
                                        <span>/{item.total}</span>
                                      </span>
                                    </StarRing>
                                    <span
                                      className="pv-icon-pill"
                                      aria-hidden="true"
                                    >
                                      <ArrowRightIcon size={16} weight="bold" />
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </GlassSurface>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="pv-list" key={lobbyTab}>
                  {(lobbyTab === "upcoming"
                    ? UPCOMING_SESSIONS
                    : HISTORY_SESSIONS
                  ).map((item, idx) => {
                    const locked = Boolean(item.lockedLevel);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="pv-session-btn sw-stagger"
                        style={{ "--stagger-i": idx } as CSSProperties}
                        disabled={locked}
                        onClick={() => setScene("quest")}
                      >
                        <GlassSurface
                          elevation="card"
                          tone={
                            locked
                              ? "locked"
                              : item.active
                                ? "active"
                                : "default"
                          }
                          radius="lg"
                          interactive={!locked}
                          className={item.active ? "sw-light-sweep" : undefined}
                        >
                          <div className="pv-session-row">
                            <h2 className="pv-session-row__title">
                              {item.title}
                            </h2>
                            <div className="pv-session-row__right">
                              {locked ? (
                                <span className="pv-locked-meta sw-tabular">
                                  <LockSimpleIcon size={17} />
                                  Lv.{item.lockedLevel}
                                </span>
                              ) : (
                                <>
                                  <StarRing
                                    progress={item.done / item.total}
                                    size={54}
                                    strokeWidth={3.5}
                                    glow={Boolean(item.active)}
                                    ariaLabel={`${item.title} 进度 ${item.done}/${item.total}`}
                                  >
                                    <span className="pv-ring-fraction sw-tabular">
                                      {item.done}
                                      <span>/{item.total}</span>
                                    </span>
                                  </StarRing>
                                  <span
                                    className="pv-icon-pill"
                                    aria-hidden="true"
                                  >
                                    <ArrowRightIcon size={16} weight="bold" />
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </GlassSurface>
                      </button>
                    );
                  })}
                </div>
              )}
            </main>
          )}

          {/* ==================== 3. 答题页 ==================== */}
          {scene === "quest" && (
            <>
              <GlassSurface
                className="pv-quest-top"
                elevation="floating"
                radius={isDesktop ? "pill" : "lg"}
                blur="soft"
              >
                <div className="pv-quest-top__inner">
                  <button
                    type="button"
                    className="pv-icon-btn"
                    aria-label="返回启程"
                    onClick={() => setScene("lobby")}
                  >
                    <ArrowLeftIcon size={20} />
                  </button>
                  <h1 className="pv-quest-top__title">北极星观测站</h1>
                  {isDesktop ? (
                    <div
                      className="pv-stars-progress"
                      style={{ margin: 0, gap: 8 }}
                      aria-label={`第 ${questionIndex + 1} 题，共 5 题`}
                    >
                      {[0, 1, 2, 3, 4].map((idx) => {
                        const state =
                          idx < questionIndex
                            ? "done"
                            : idx === questionIndex
                              ? "current"
                              : "todo";
                        return (
                          <span
                            key={idx}
                            className="pv-star-node"
                            data-state={state}
                          >
                            <StarFourIcon
                              size={state === "current" ? 16 : 13}
                              weight={state === "todo" ? "regular" : "fill"}
                            />
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span style={{ width: 36 }} aria-hidden="true" />
                  )}
                </div>
              </GlassSurface>

              <main className="pv-scroll">
                {!isDesktop && (
                  <div
                    className="pv-stars-progress"
                    aria-label={`第 ${questionIndex + 1} 题，共 5 题`}
                  >
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const state =
                        idx < questionIndex
                          ? "done"
                          : idx === questionIndex
                            ? "current"
                            : "todo";
                      return (
                        <span
                          key={idx}
                          className="pv-star-node"
                          data-state={state}
                        >
                          <StarFourIcon
                            size={state === "current" ? 18 : 14}
                            weight={state === "todo" ? "regular" : "fill"}
                          />
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="pv-quest-layout">
                  <div>
                    <GlassSurface
                      elevation="card"
                      tone="default"
                      radius="lg"
                      interactive
                      className={wrongShake ? "sw-shake" : ""}
                    >
                      <div className="pv-quest-card">
                        <div className="pv-quest-card__head">
                          <span className="pv-quest-card__num sw-tabular">
                            第 {questionIndex + 1} 题
                          </span>
                          {!isDesktop && (
                            <button
                              type="button"
                              className="pv-clue-btn"
                              aria-label="查看线索"
                              onClick={() => setShowClue(true)}
                            >
                              <LightbulbFilamentIcon
                                size={19}
                                weight="regular"
                              />
                            </button>
                          )}
                        </div>

                        <p className="pv-quest-card__body">
                          观测站的穹顶在冬夜第几次打开时，北极星恰好落在镜筒正中？
                        </p>

                        <div className="pv-quest-figure">
                          <ObservatoryIllustration />
                        </div>

                        {wrongHint && (
                          <p className="pv-quest-feedback" role="alert">
                            答案不正确
                          </p>
                        )}
                      </div>
                    </GlassSurface>

                    {isDesktop && (
                      <form
                        className="pv-quest-inline-input"
                        onSubmit={handleAnswerSubmit}
                      >
                        <input
                          className="pv-input"
                          type="text"
                          placeholder="输入答案"
                          aria-label="输入答案"
                          value={answer}
                          onChange={(e) => {
                            setAnswer(e.target.value);
                            if (wrongHint) setWrongHint(false);
                          }}
                        />
                        <button
                          type="submit"
                          className="pv-send-btn"
                          aria-label="提交答案"
                        >
                          <ArrowRightIcon size={22} weight="bold" />
                        </button>
                      </form>
                    )}

                    <div className="pv-quest-demo-actions">
                      <button
                        type="button"
                        className="pv-ghost-btn"
                        onClick={triggerCorrect}
                      >
                        预览答对演出
                      </button>
                      <button
                        type="button"
                        className="pv-ghost-btn"
                        onClick={triggerWrong}
                      >
                        预览答错震动
                      </button>
                      <button
                        type="button"
                        className="pv-ghost-btn"
                        onClick={() => setModalMail(mails[0] ?? null)}
                      >
                        预览来信弹窗
                      </button>
                    </div>
                  </div>

                  {/* PC 右侧常驻线索面板 */}
                  {isDesktop && (
                    <GlassSurface
                      elevation="card"
                      tone={clueRevealed ? "active" : "default"}
                      radius="lg"
                      interactive
                    >
                      <div className="pv-clue-panel">
                        <div className="pv-clue-panel__head">
                          <span>线索</span>
                          <LightbulbFilamentIcon size={18} weight="fill" />
                        </div>
                        {clueRevealed ? (
                          <p className="pv-clue-panel__text">
                            抬头看穹顶开启的刻痕，每逢整点偏转 15 度。
                          </p>
                        ) : (
                          <button
                            type="button"
                            className="pv-ghost-btn"
                            onClick={() => setClueRevealed(true)}
                          >
                            展开线索
                          </button>
                        )}
                      </div>
                    </GlassSurface>
                  )}
                </div>
              </main>

              {!isDesktop && (
                <form
                  className="pv-quest-inputbar"
                  onSubmit={handleAnswerSubmit}
                >
                  <input
                    className="pv-input"
                    type="text"
                    placeholder="输入答案"
                    aria-label="输入答案"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      if (wrongHint) setWrongHint(false);
                    }}
                  />
                  <button
                    type="submit"
                    className="pv-send-btn"
                    aria-label="提交答案"
                  >
                    <ArrowRightIcon size={22} weight="bold" />
                  </button>
                </form>
              )}
            </>
          )}

          {/* ==================== 4. 收藏（奖品） ==================== */}
          {scene === "rewards" && (
            <main className="pv-scroll">
              <div className="pv-page-head">
                <h1 className="pv-title">收藏</h1>
                <div
                  className="sw-segment"
                  role="tablist"
                  aria-label="收藏状态"
                  style={
                    {
                      "--seg-index": rewardTab === "unclaimed" ? 0 : 1,
                    } as CSSProperties
                  }
                >
                  <span className="sw-segment__thumb" aria-hidden="true" />
                  <button
                    type="button"
                    role="tab"
                    className="sw-segment__btn"
                    aria-selected={rewardTab === "unclaimed"}
                    data-active={rewardTab === "unclaimed"}
                    onClick={() => setRewardTab("unclaimed")}
                  >
                    待领
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className="sw-segment__btn"
                    aria-selected={rewardTab === "claimed"}
                    data-active={rewardTab === "claimed"}
                    onClick={() => setRewardTab("claimed")}
                  >
                    已领
                  </button>
                </div>
              </div>

              <div className="pv-reward-grid" key={rewardTab}>
                {REWARDS.filter((r) =>
                  rewardTab === "unclaimed" ? !r.claimed : r.claimed,
                ).map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    className="pv-session-btn sw-stagger"
                    style={{ "--stagger-i": idx } as CSSProperties}
                    onClick={() => setActiveReward(item)}
                  >
                    <GlassSurface
                      elevation="card"
                      tone={item.rare ? "reward" : "default"}
                      radius="lg"
                      interactive
                      className={item.rare ? "sw-light-sweep" : undefined}
                    >
                      <div className="pv-reward-card">
                        <div
                          className="pv-reward-art"
                          data-rare={item.rare ? "true" : undefined}
                        >
                          <RewardIcon type={item.icon} />
                        </div>
                        <div className="pv-reward-foot">
                          <h2 className="pv-reward-name">{item.name}</h2>
                          <span className="pv-reward-qty sw-tabular">
                            ×{item.qty}
                          </span>
                        </div>
                      </div>
                    </GlassSurface>
                  </button>
                ))}
              </div>
            </main>
          )}

          {/* ==================== 5. 来信 ==================== */}
          {scene === "mailbox" && (
            <main className="pv-scroll">
              <div className="pv-page-head">
                <h1 className="pv-title">来信</h1>
              </div>

              <div className="pv-mail-split">
                <div className="pv-list">
                  {mails.map((item) => {
                    const isSelected =
                      isDesktop && selectedMail?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="pv-session-btn"
                        onClick={() => openMail(item)}
                      >
                        <GlassSurface
                          elevation="card"
                          tone={isSelected || !item.read ? "active" : "default"}
                          radius="lg"
                          interactive
                        >
                          <div className="pv-mail-row">
                            <div className="pv-mail-row__left">
                              <span
                                className="pv-mail-dot"
                                data-read={item.read ? "true" : undefined}
                                aria-hidden="true"
                              />
                              <h2 className="pv-mail-title">{item.title}</h2>
                            </div>
                            <span className="pv-mail-time sw-tabular">
                              {item.time}
                            </span>
                          </div>
                        </GlassSurface>
                      </button>
                    );
                  })}
                </div>

                {isDesktop && selectedMail && (
                  <GlassSurface elevation="card" radius="lg">
                    <article className="pv-mail-reader">
                      <div className="pv-mail-reader__head">
                        <h2 className="pv-mail-reader__title">
                          {selectedMail.title}
                        </h2>
                        <span className="pv-mail-time sw-tabular">
                          {selectedMail.time}
                        </span>
                      </div>
                      <p className="pv-sheet__text">{selectedMail.body}</p>
                    </article>
                  </GlassSurface>
                )}
              </div>
            </main>
          )}

          {/* ==================== 6. 护照 ==================== */}
          {scene === "passport" && (
            <main className="pv-scroll">
              <div className="pv-page-head">
                <h1 className="pv-title">护照</h1>
              </div>

              <div className="pv-passport-grid">
                <div>
                  <GlassSurface elevation="card" radius="lg">
                    <div className="pv-passport-card">
                      <div className="pv-passport-hero">
                        <StarRing
                          progress={1240 / 1500}
                          size={86}
                          strokeWidth={4}
                          glow
                        >
                          <span className="pv-avatar pv-avatar--lg">林</span>
                        </StarRing>
                        <h2 className="pv-passport-name">林间旅人</h2>
                        <p className="pv-passport-exp sw-tabular">
                          Lv.7 ·{" "}
                          <span
                            className={
                              passportExp.landed ? "sw-count-land" : undefined
                            }
                          >
                            {passportExp.value.toLocaleString("en-US")}
                          </span>{" "}
                          / 1,500 EXP
                        </p>
                      </div>

                      <div className="pv-stats-row" style={{ marginBottom: 0 }}>
                        <div>
                          <span className="pv-stat-val sw-tabular">23</span>
                          <span className="pv-stat-lbl">已解开</span>
                        </div>
                        <div>
                          <span className="pv-stat-val sw-tabular">6</span>
                          <span className="pv-stat-lbl">场次</span>
                        </div>
                        <div>
                          <span className="pv-stat-val sw-tabular">4</span>
                          <span className="pv-stat-lbl">收藏</span>
                        </div>
                      </div>
                    </div>
                  </GlassSurface>
                </div>

                <GlassSurface
                  elevation="card"
                  radius="lg"
                  style={isDesktop ? undefined : { marginTop: 14 }}
                >
                  <div className="pv-setting-list">
                    <button type="button" className="pv-setting-item">
                      <span>修改昵称</span>
                      <CaretRightIcon size={16} />
                    </button>
                    <button type="button" className="pv-setting-item">
                      <span>修改密码</span>
                      <CaretRightIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="pv-setting-item"
                      onClick={() =>
                        setTheme((t) => (t === "dark" ? "light" : "dark"))
                      }
                    >
                      <span>外观</span>
                      <span className="pv-setting-item__val">
                        {theme === "dark" ? "夜间" : "日间"}
                        <CaretRightIcon size={16} />
                      </span>
                    </button>
                    <button
                      type="button"
                      className="pv-setting-item pv-setting-item--danger"
                      onClick={() => setScene("login")}
                    >
                      <span>退出登录</span>
                    </button>
                  </div>
                </GlassSurface>
              </div>
            </main>
          )}

          {/* 悬浮底栏 */}
          {showTabBar && (
            <div className="pv-bottom-dock">
              <FloatingTabBar
                active={scene as TabKey}
                unreadCount={unreadCount}
                onSelect={(tab) => setScene(tab)}
              />
            </div>
          )}

          {viewport === "mobile" && (
            <div className="pv-home-indicator" aria-hidden="true" />
          )}

          {/* 答对星芒演出 */}
          <StarBurstOverlay
            open={showBurst}
            title="回答正确"
            xpDelta={20}
            actionLabel="下一题"
            reducedMotion={reducedMotion}
            onAction={handleNextQuestion}
          />

          {/* 答题页 Modal 来信弹窗入口预览 */}
          {modalMail && (
            <div
              className="pv-sheet-backdrop"
              style={{ alignItems: "center", justifyContent: "center" }}
              onClick={() => setModalMail(null)}
            >
              <GlassSurface
                className="pv-sheet"
                style={{ maxWidth: 440, height: "auto" }}
                elevation="floating"
                radius="lg"
                blur="strong"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pv-sheet__body">
                  <div className="pv-sheet__head">
                    <h2 className="pv-sheet__title">{modalMail.title}</h2>
                    <button
                      type="button"
                      className="pv-icon-btn"
                      aria-label="关闭"
                      onClick={() => setModalMail(null)}
                    >
                      <XIcon size={18} />
                    </button>
                  </div>
                  <p className="pv-sheet__text">{modalMail.body}</p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    <button
                      type="button"
                      className="pv-ghost-btn"
                      style={{ flex: "none", padding: "0 14px" }}
                      onClick={() => {
                        setModalMail(null);
                        setScene("mailbox");
                      }}
                    >
                      进入来信页
                    </button>
                    <button
                      type="button"
                      className="sw-btn-primary"
                      style={{ height: 38, padding: "0 20px", fontSize: 14 }}
                      onClick={() => {
                        openMail(modalMail);
                        setModalMail(null);
                      }}
                    >
                      收下
                    </button>
                  </div>
                </div>
              </GlassSurface>
            </div>
          )}

          {/* 线索 / 收藏 / 来信 L2 玻璃弹层（Motion Prompt #051 Bottom sheet） */}
          {(showClue || activeReward || activeMail) && (
            <div
              className="pv-sheet-backdrop"
              onClick={() => {
                setShowClue(false);
                setActiveReward(null);
                setActiveMail(null);
              }}
            >
              <GlassSurface
                className="pv-sheet sw-sheet-panel"
                elevation="floating"
                radius="lg"
                blur="strong"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pv-sheet__body">
                  {!isDesktop && (
                    <div className="sw-sheet-handle" aria-hidden="true" />
                  )}
                  <div className="pv-sheet__head">
                    <h2 className="pv-sheet__title">
                      {showClue
                        ? "线索"
                        : activeReward
                          ? activeReward.name
                          : activeMail?.title}
                    </h2>
                    <button
                      type="button"
                      className="pv-icon-btn"
                      aria-label="关闭"
                      onClick={() => {
                        setShowClue(false);
                        setActiveReward(null);
                        setActiveMail(null);
                      }}
                    >
                      <XIcon size={18} />
                    </button>
                  </div>
                  <p className="pv-sheet__text">
                    {showClue
                      ? "抬头看穹顶开启的刻痕，每逢整点偏转 15 度。"
                      : activeReward
                        ? activeReward.detail
                        : activeMail?.body}
                  </p>
                </div>
              </GlassSurface>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
