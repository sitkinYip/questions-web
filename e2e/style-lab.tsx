import "./style-lab.css";
import { StrictMode, useEffect, useState, type PointerEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CompassIcon,
  DesktopIcon,
  DeviceMobileIcon,
  EnvelopeSimpleIcon,
  GiftIcon,
  LockSimpleIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

type StyleKey = "harmony" | "theater" | "crystal";
type SceneKey = "lobby" | "quest" | "login";
type ThemeKey = "light" | "dark";
type ViewportKey = "desktop" | "mobile";

const STYLES: ReadonlyArray<{ key: StyleKey; label: string }> = [
  { key: "harmony", label: "1 星穹光感" },
  { key: "theater", label: "2 深空剧场" },
  { key: "crystal", label: "3 晨雾冰晶" },
];

const SCENES: ReadonlyArray<{ key: SceneKey; label: string }> = [
  { key: "lobby", label: "大厅" },
  { key: "quest", label: "答题" },
  { key: "login", label: "登录" },
];

interface DemoSession {
  id: string;
  title: string;
  done: number;
  total: number;
  active?: boolean;
  meta?: string;
  locked?: boolean;
}

const CURRENT_SESSIONS: ReadonlyArray<DemoSession> = [
  { id: "s1", title: "北极星观测站", done: 2, total: 5, active: true },
  { id: "s2", title: "潮汐灯塔的回声", done: 0, total: 3 },
  {
    id: "s3",
    title: "冬至天文台",
    done: 0,
    total: 4,
    meta: "需要 Lv.5",
    locked: true,
  },
];

const HISTORY_SESSIONS: ReadonlyArray<DemoSession> = [
  { id: "h1", title: "初秋邮局", done: 4, total: 4, meta: "11-02" },
  { id: "h2", title: "旧城钟楼", done: 3, total: 3, meta: "10-18" },
];

const OPTIONS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "A", label: "子午仪校准钟" },
  { key: "B", label: "六分仪折射镜" },
  { key: "C", label: "赤道仪星盘" },
];

const CORRECT_OPTION = "B";

// 鸿蒙沉浸光感：追踪指针/手指位置更新元素上的点光源坐标
function updateLightPosition(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--px", `${Math.round(event.clientX - rect.left)}px`);
  el.style.setProperty("--py", `${Math.round(event.clientY - rect.top)}px`);
  el.dataset.tracking = "true";
}

function clearLightTracking(event: PointerEvent<HTMLElement>) {
  delete event.currentTarget.dataset.tracking;
}

const lightTrackProps = {
  onPointerMove: updateLightPosition,
  onPointerDown: updateLightPosition,
  onPointerLeave: clearLightTracking,
  onPointerCancel: clearLightTracking,
};

function getInitialTheme(): ThemeKey {
  const query = new URLSearchParams(window.location.search).get("theme");
  if (query === "light" || query === "dark") return query;
  return "dark";
}

function getInitialStyle(): StyleKey {
  const query = new URLSearchParams(window.location.search).get("style");
  if (query === "harmony" || query === "theater" || query === "crystal") {
    return query;
  }
  return "harmony";
}

function StyleLabApp() {
  const [styleKey, setStyleKey] = useState<StyleKey>(getInitialStyle);
  const [scene, setScene] = useState<SceneKey>("lobby");
  const [theme, setTheme] = useState<ThemeKey>(getInitialTheme);
  const [viewport, setViewport] = useState<ViewportKey>("desktop");
  const [lobbyTab, setLobbyTab] = useState<"current" | "history">("current");
  const [dockTab, setDockTab] = useState<"lobby" | "rewards" | "mail" | "me">(
    "lobby",
  );
  const [selectedOption, setSelectedOption] = useState<string>("B");
  const [answerResult, setAnswerResult] = useState<"idle" | "ok" | "err">(
    "idle",
  );
  const [account, setAccount] = useState("sitkin");
  const [password, setPassword] = useState("••••••••");

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const sessions = lobbyTab === "current" ? CURRENT_SESSIONS : HISTORY_SESSIONS;

  return (
    <>
      <header className="lab-bar" aria-label="风格实验室控制栏">
        <div className="lab-bar__group" role="group" aria-label="星穹光感方案">
          <span className="lab-bar__label">光感</span>
          {STYLES.map((item) => (
            <button
              key={item.key}
              type="button"
              className="lab-chip"
              aria-pressed={styleKey === item.key}
              onClick={() => setStyleKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="lab-bar__group" role="group" aria-label="预览场景">
          <span className="lab-bar__label">页面</span>
          {SCENES.map((item) => (
            <button
              key={item.key}
              type="button"
              className="lab-chip"
              aria-pressed={scene === item.key}
              onClick={() => {
                setScene(item.key);
                setAnswerResult("idle");
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="lab-bar__group">
          <button
            type="button"
            className="lab-chip"
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <MoonIcon size={15} aria-hidden="true" />
            深色
          </button>
          <button
            type="button"
            className="lab-chip"
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <SunIcon size={15} aria-hidden="true" />
            浅色
          </button>
          <button
            type="button"
            className="lab-chip"
            aria-pressed={viewport === "desktop"}
            onClick={() => setViewport("desktop")}
          >
            <DesktopIcon size={15} aria-hidden="true" />
            桌面
          </button>
          <button
            type="button"
            className="lab-chip"
            aria-pressed={viewport === "mobile"}
            onClick={() => setViewport("mobile")}
          >
            <DeviceMobileIcon size={15} aria-hidden="true" />
            手机
          </button>
        </div>
      </header>

      <div
        className="lab-stage"
        data-style={styleKey}
        data-theme={theme}
        data-scene={scene}
      >
        <div className="lab-viewport-wrap" data-viewport={viewport}>
          <div className="sw-frame">
            <div className="sw-cosmos" aria-hidden="true">
              <div className="sw-cosmos__nebula" />
              <div className="sw-cosmos__stars" />
              <div className="sw-cosmos__arc" />
            </div>

            {scene !== "login" && (
              <header className="sw-header">
                <a
                  href="#lobby"
                  className="sw-brand"
                  onClick={(event) => {
                    event.preventDefault();
                    setScene("lobby");
                  }}
                >
                  <span className="sw-brand__mark-wrap">
                    <img
                      className="sw-brand__mark"
                      src="/branding/starward-mark-192.png"
                      alt="赴星之约"
                      width={30}
                      height={30}
                    />
                  </span>
                  <span className="sw-brand__name">赴星之约</span>
                </a>

                <nav className="sw-nav" aria-label="主导航">
                  <button
                    type="button"
                    className="sw-nav-item"
                    aria-current={scene === "lobby" ? "page" : undefined}
                    onClick={() => setScene("lobby")}
                  >
                    <CompassIcon
                      size={16}
                      weight={scene === "lobby" ? "fill" : "regular"}
                      aria-hidden="true"
                    />
                    启程
                  </button>
                  <button type="button" className="sw-nav-item">
                    <GiftIcon size={16} aria-hidden="true" />
                    收藏
                  </button>
                  <button type="button" className="sw-nav-item">
                    <EnvelopeSimpleIcon size={16} aria-hidden="true" />
                    来信
                  </button>
                </nav>

                <div className="sw-avatar-pill">
                  <span className="sw-avatar" aria-hidden="true">
                    星
                  </span>
                  <span>Lv.4</span>
                </div>
              </header>
            )}

            {scene === "lobby" && (
              <main className="sw-main">
                <div className="sw-lobby">
                  <section aria-label="场次列表">
                    <div className="sw-lobby__head">
                      <h1 className="sw-page-title">启程</h1>
                      <div className="sw-tabs" role="tablist" aria-label="场次">
                        <button
                          type="button"
                          role="tab"
                          className="sw-tab"
                          aria-selected={lobbyTab === "current"}
                          onClick={() => setLobbyTab("current")}
                        >
                          进行中 <span>{CURRENT_SESSIONS.length}</span>
                        </button>
                        <button
                          type="button"
                          role="tab"
                          className="sw-tab"
                          aria-selected={lobbyTab === "history"}
                          onClick={() => setLobbyTab("history")}
                        >
                          已完成 <span>{HISTORY_SESSIONS.length}</span>
                        </button>
                      </div>
                    </div>

                    <div className="sw-list">
                      {sessions.map((item) => {
                        const pct = Math.round((item.done / item.total) * 100);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className="sw-glass sw-light-reactive sw-card-btn"
                            data-active={item.active ? "true" : undefined}
                            data-locked={item.locked ? "true" : undefined}
                            disabled={item.locked}
                            onClick={() => setScene("quest")}
                            {...lightTrackProps}
                          >
                            <div>
                              <div className="sw-card__title-row">
                                {item.active && (
                                  <span
                                    className="sw-live-beacon"
                                    aria-hidden="true"
                                  />
                                )}
                                <h2 className="sw-card__title">{item.title}</h2>
                              </div>
                              <div className="sw-card__meta">
                                {!item.locked && (
                                  <>
                                    <span
                                      className="sw-meter"
                                      aria-hidden="true"
                                    >
                                      <span
                                        className="sw-meter__fill"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </span>
                                    <span>
                                      {item.done}/{item.total}
                                    </span>
                                  </>
                                )}
                                {item.meta && <span>{item.meta}</span>}
                              </div>
                            </div>
                            <span className="sw-card__arrow" aria-hidden="true">
                              {item.locked ? (
                                <LockSimpleIcon size={17} />
                              ) : (
                                <ArrowRightIcon size={17} />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <aside
                    className="sw-glass sw-light-reactive sw-passport"
                    aria-label="旅行者状态"
                    {...lightTrackProps}
                  >
                    <div className="sw-passport__top">
                      <div className="sw-passport__avatar-ring">
                        <span
                          className="sw-passport__avatar"
                          aria-hidden="true"
                        >
                          星
                        </span>
                      </div>
                      <div>
                        <p className="sw-passport__name">林屿</p>
                        <p className="sw-passport__rank">Lv.4 · 观星见习</p>
                      </div>
                    </div>
                    <div className="sw-passport__xp">
                      <div className="sw-passport__xp-row">
                        <span>EXP</span>
                        <span>340 / 500</span>
                      </div>
                      <div
                        className="sw-passport__bar"
                        role="progressbar"
                        aria-valuenow={340}
                        aria-valuemin={0}
                        aria-valuemax={500}
                        aria-label="经验值"
                      >
                        <span style={{ width: "68%" }} />
                      </div>
                    </div>
                  </aside>
                </div>
              </main>
            )}

            {scene === "quest" && (
              <main className="sw-quest-shell">
                <div className="sw-quest-top">
                  <button
                    type="button"
                    className="sw-btn sw-btn--ghost"
                    onClick={() => setScene("lobby")}
                  >
                    <ArrowLeftIcon size={15} aria-hidden="true" />
                    北极星观测站
                  </button>
                  <div className="sw-step-track" aria-label="第 2 题，共 5 题">
                    <span className="sw-step-nodes" aria-hidden="true">
                      <span className="sw-step-node" data-state="done" />
                      <span className="sw-step-node" data-state="current" />
                      <span className="sw-step-node" />
                      <span className="sw-step-node" />
                      <span className="sw-step-node" />
                    </span>
                    <span>02 / 05</span>
                  </div>
                </div>

                <div className="sw-quest-grid">
                  <article
                    className="sw-glass sw-light-reactive sw-panel"
                    {...lightTrackProps}
                  >
                    <h1 className="sw-question-title">玻璃穹顶下的刻度</h1>
                    <p className="sw-question-body">
                      1928 年秋，观测站记录本第 14 页提到：午夜零点整，
                      镜筒对准北极星正下方 12° 时，铜盘边缘的刻线会与窗口的
                      潮汐标记完全重合。当年用于校准这项误差的仪器是哪一件？
                    </p>
                    <div className="sw-clue-box">
                      观测日志残留：该仪器常随航海士出海，靠双镜反射读出天体高度角。
                    </div>
                  </article>

                  <section
                    className="sw-glass sw-light-reactive sw-panel"
                    aria-label="作答区"
                    {...lightTrackProps}
                  >
                    <div
                      className="sw-options"
                      role="radiogroup"
                      aria-label="选择答案"
                    >
                      {OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          role="radio"
                          className="sw-option"
                          aria-checked={selectedOption === opt.key}
                          onClick={() => {
                            setSelectedOption(opt.key);
                            setAnswerResult("idle");
                          }}
                        >
                          <span className="sw-option__key">{opt.key}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    {answerResult !== "idle" && (
                      <div
                        className="sw-feedback"
                        data-tone={answerResult}
                        role="status"
                      >
                        {answerResult === "ok" ? (
                          <>
                            <CheckCircleIcon size={18} weight="fill" />
                            回答正确
                          </>
                        ) : (
                          <>
                            <WarningCircleIcon size={18} weight="fill" />
                            答案不正确
                          </>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      className="sw-btn sw-btn--full"
                      onClick={() =>
                        setAnswerResult(
                          selectedOption === CORRECT_OPTION ? "ok" : "err",
                        )
                      }
                    >
                      提交答案
                    </button>
                  </section>
                </div>
              </main>
            )}

            {scene === "login" && (
              <main className="sw-login-wrap">
                <section
                  className="sw-glass sw-light-reactive sw-login-card"
                  aria-label="登录"
                  {...lightTrackProps}
                >
                  <div className="sw-login-head">
                    <span className="sw-login-logo">
                      <img
                        src="/branding/starward-mark-192.png"
                        alt="赴星之约"
                        width={42}
                        height={42}
                      />
                    </span>
                    <h1>赴星之约</h1>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      setScene("lobby");
                    }}
                  >
                    <div className="sw-field">
                      <label htmlFor="lab-account">账号</label>
                      <input
                        id="lab-account"
                        className="sw-input"
                        autoComplete="username"
                        value={account}
                        onChange={(event) => setAccount(event.target.value)}
                      />
                    </div>
                    <div className="sw-field">
                      <label htmlFor="lab-password">密码</label>
                      <input
                        id="lab-password"
                        type="password"
                        className="sw-input"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </div>
                    <button type="submit" className="sw-btn sw-btn--full">
                      进入
                      <ArrowRightIcon size={16} aria-hidden="true" />
                    </button>
                  </form>
                </section>
              </main>
            )}

            {scene === "lobby" && (
              <nav
                className="sw-mobile-dock sw-light-reactive"
                aria-label="移动导航"
                {...lightTrackProps}
              >
                <button
                  type="button"
                  className="sw-dock-item"
                  aria-current={dockTab === "lobby" ? "page" : undefined}
                  onClick={() => setDockTab("lobby")}
                >
                  <CompassIcon
                    size={22}
                    weight={dockTab === "lobby" ? "fill" : "regular"}
                    aria-hidden="true"
                  />
                  启程
                </button>
                <button
                  type="button"
                  className="sw-dock-item"
                  aria-current={dockTab === "rewards" ? "page" : undefined}
                  onClick={() => setDockTab("rewards")}
                >
                  <GiftIcon
                    size={22}
                    weight={dockTab === "rewards" ? "fill" : "regular"}
                    aria-hidden="true"
                  />
                  收藏
                </button>
                <button
                  type="button"
                  className="sw-dock-item"
                  aria-current={dockTab === "mail" ? "page" : undefined}
                  onClick={() => setDockTab("mail")}
                >
                  <EnvelopeSimpleIcon
                    size={22}
                    weight={dockTab === "mail" ? "fill" : "regular"}
                    aria-hidden="true"
                  />
                  来信
                </button>
                <button
                  type="button"
                  className="sw-dock-item"
                  aria-current={dockTab === "me" ? "page" : undefined}
                  onClick={() => setDockTab("me")}
                >
                  <UserIcon
                    size={22}
                    weight={dockTab === "me" ? "fill" : "regular"}
                    aria-hidden="true"
                  />
                  我的
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <StyleLabApp />
    </StrictMode>,
  );
}
