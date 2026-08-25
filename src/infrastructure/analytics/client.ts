import type { AnalyticsEnvelope, AnalyticsEvent } from "./events";

interface AnalyticsTransport {
  sendBeacon?: (url: string, body: string) => boolean;
  fetch: (url: string, init: RequestInit) => Promise<unknown> | unknown;
}

interface AnalyticsClientConfig {
  enabled: boolean;
  endpoint?: string;
  transport?: AnalyticsTransport;
  now?: () => Date;
  createSessionId?: () => string;
}

function browserTransport(): AnalyticsTransport {
  return {
    sendBeacon:
      typeof navigator !== "undefined" && navigator.sendBeacon
        ? navigator.sendBeacon.bind(navigator)
        : undefined,
    fetch: (url, init) => fetch(url, init),
  };
}

function fallbackSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return `questions-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function summarizeAnalyticsEvent(event: AnalyticsEvent): string {
  if (event.name === "answer_submitted") {
    const labels = {
      empty: "未填写答案",
      blocked: "提交被阻止",
      correct: "回答正确",
      incorrect: "回答错误",
    } as const;
    const penalty =
      event.penaltyEndsAt === -1
        ? "永久锁定"
        : event.penaltyEndsAt
          ? `惩罚至 ${new Date(event.penaltyEndsAt).toISOString()}`
          : "无惩罚";
    return [
      `第 ${event.step} 题${labels[event.outcome]}`,
      `用户回答=${event.answer || "（空）"}`,
      `标准答案=${event.acceptedAnswers.join(" / ") || "未配置"}`,
      `进度=${event.progress.completed}/${event.progress.total}`,
      `错误次数=${event.wrongCount}`,
      penalty,
    ].join(" | ");
  }
  if (event.name === "session_viewed")
    return `进入${event.mode === "multiple" ? "多题" : "单题"}会话 | 当前第 ${event.progress.activeStep} 题 | 进度=${event.progress.completed}/${event.progress.total}`;
  if (event.name === "quest_viewed")
    return `查看第 ${event.step} 题 | ${event.title || event.question} | 状态=${event.attemptStatus} | 进度=${event.progress.completed}/${event.progress.total}`;
  if (event.name === "media_opened")
    return `打开${event.kind === "image" ? "图片" : "视频"} | 第 ${event.step} 题 | ${event.urls.join(" , ")}`;
  if (event.name === "clue_opened")
    return `打开${event.automatic ? "自动" : "手动"}线索 | ${event.title || event.clueId} | ${event.content}`;
  if (event.name === "notification_state")
    return `${event.state === "opened" ? "打开" : "关闭"}通知 | ${event.popupTitle || event.title} | ${event.content}`;
  if (event.name === "bgm_state")
    return `背景音乐=${event.state} | 原因=${event.reason}${event.audioUrl ? ` | ${event.audioUrl}` : ""}`;
  if (event.name === "letter_state")
    return `信件=${event.state} | ${event.title || event.from} | 类型=${event.variant}`;
  return `打开最终旅程 | ${event.target} | ${event.href}`;
}

export function isAnalyticsAllowed(enabled: boolean, baseUrl: string) {
  return enabled && baseUrl === "/questions/";
}

export function createAnalyticsClient(config: AnalyticsClientConfig) {
  const transport = config.transport ?? browserTransport();
  const now = config.now ?? (() => new Date());
  const sessionId = (config.createSessionId ?? fallbackSessionId)();
  const reportedKeys = new Set<string>();

  const track = (event: AnalyticsEvent, userId?: string): boolean => {
    if (!config.enabled || !config.endpoint) return false;
    const envelope: AnalyticsEnvelope = {
      version: 2,
      sessionId,
      occurredAt: now().toISOString(),
      ...(userId ? { userId } : {}),
      summary: summarizeAnalyticsEvent(event),
      event,
    };
    const body = JSON.stringify(envelope);
    try {
      if (transport.sendBeacon?.(config.endpoint, body)) return true;
    } catch {
      // Fetch below is the non-blocking fallback.
    }
    try {
      void Promise.resolve(
        transport.fetch(config.endpoint, {
          method: "POST",
          body,
          keepalive: true,
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
        }),
      ).catch(() => undefined);
      return true;
    } catch {
      return false;
    }
  };

  return {
    track,
    trackOnce(key: string, event: AnalyticsEvent, userId?: string) {
      if (reportedKeys.has(key)) return false;
      reportedKeys.add(key);
      return track(event, userId);
    },
  };
}
