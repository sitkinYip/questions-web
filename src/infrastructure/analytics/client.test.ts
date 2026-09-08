import { describe, expect, it, vi } from "vitest";
import {
  trackAnalytics,
  trackAnalyticsOnce,
} from "@/infrastructure/analytics/index";
import {
  analyticsUserFromSearch,
  createAnalyticsClient,
  isAnalyticsAllowed,
  summarizeAnalyticsEvent,
} from "@/infrastructure/analytics/client";

const answerEvent = {
  name: "answer_submitted" as const,
  questId: "quest-11",
  step: 11,
  title: "星辰之门",
  question: "门上的文字是什么？",
  kind: "text" as const,
  answer: "用户原始答案",
  normalizedAnswer: "用户原始答案",
  acceptedAnswers: ["标准答案"],
  options: [],
  outcome: "correct" as const,
  attemptStatus: "completed" as const,
  wrongCount: 0,
  penaltyEndsAt: null,
  progress: {
    activeStep: 11,
    completed: 1,
    total: 3,
    sessionStatus: "active" as const,
  },
};

describe("Questions analytics client", () => {
  it("disables the legacy delivery adapter for reused authenticated-game visuals", () => {
    expect(trackAnalytics(answerEvent, "old-user")).toBe(false);
    expect(trackAnalyticsOnce("old-key", answerEvent, "old-user")).toBe(false);
  });
  it("allows delivery only for the explicit production base", () => {
    expect(isAnalyticsAllowed(true, "/questions/")).toBe(true);
    expect(isAnalyticsAllowed(true, "/questions-next/")).toBe(false);
    expect(isAnalyticsAllowed(true, "/")).toBe(false);
    expect(isAnalyticsAllowed(false, "/questions/")).toBe(false);
  });

  it("reads only a non-empty user query as the tracking identity", () => {
    expect(analyticsUserFromSearch("?qa=11&user=alice%20")).toBe("alice");
    expect(analyticsUserFromSearch("?qa=11")).toBeUndefined();
    expect(analyticsUserFromSearch("?qa=11&user=%20%20")).toBeUndefined();
    expect(analyticsUserFromSearch("?qa=11&user=")).toBeUndefined();
  });

  it("sends a complete operational context envelope with beacon", () => {
    const sendBeacon = vi.fn<(url: string, body: string) => boolean>(
      () => true,
    );
    const fetchMock = vi.fn();
    const client = createAnalyticsClient({
      enabled: true,
      endpoint: "https://events.example/questions",
      transport: { sendBeacon, fetch: fetchMock },
      now: () => new Date("2026-08-25T02:00:00.000Z"),
      createSessionId: () => "session-1",
    });

    expect(client.track(answerEvent, "alice")).toBe(true);
    const body = sendBeacon.mock.calls[0][1];
    expect(JSON.parse(body)).toEqual({
      version: 2,
      sessionId: "session-1",
      occurredAt: "2026-08-25T02:00:00.000Z",
      userId: "alice",
      summary:
        "第 11 题回答正确 | 用户回答=用户原始答案 | 标准答案=标准答案 | 进度=1/3 | 错误次数=0 | 无惩罚",
      event: answerEvent,
    });
    const event = JSON.parse(body).event;
    expect(event).toMatchObject({
      answer: "用户原始答案",
      acceptedAnswers: ["标准答案"],
      question: "门上的文字是什么？",
      progress: { completed: 1, total: 3 },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("builds a human-readable wrong-answer summary for remote operators", () => {
    expect(
      summarizeAnalyticsEvent({
        ...answerEvent,
        outcome: "incorrect",
        answer: "月亮",
        acceptedAnswers: ["北极星", "Polaris"],
        wrongCount: 2,
        penaltyEndsAt: -1,
      }),
    ).toBe(
      "第 11 题回答错误 | 用户回答=月亮 | 标准答案=北极星 / Polaris | 进度=1/3 | 错误次数=2 | 永久锁定",
    );
  });

  it("falls back to non-blocking keepalive fetch and deduplicates once keys", () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    const client = createAnalyticsClient({
      enabled: true,
      endpoint: "https://events.example/questions",
      transport: { sendBeacon: () => false, fetch: fetchMock },
      createSessionId: () => "session-2",
    });

    expect(client.trackOnce("quest:11", answerEvent, "alice")).toBe(true);
    expect(client.trackOnce("quest:11", answerEvent, "alice")).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
    });
  });

  it("never invokes transport when disabled or unconfigured", () => {
    const fetchMock = vi.fn();
    const transport = { sendBeacon: vi.fn(() => true), fetch: fetchMock };
    const disabled = createAnalyticsClient({
      enabled: false,
      endpoint: "https://events.example/questions",
      transport,
    });
    const missingEndpoint = createAnalyticsClient({
      enabled: true,
      transport,
    });

    expect(disabled.track(answerEvent, "alice")).toBe(false);
    expect(missingEndpoint.track(answerEvent, "alice")).toBe(false);
    expect(transport.sendBeacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never invokes transport without a non-empty user identity", () => {
    const sendBeacon = vi.fn<(url: string, body: string) => boolean>(
      () => true,
    );
    const fetchMock = vi.fn();
    const client = createAnalyticsClient({
      enabled: true,
      endpoint: "https://events.example/questions",
      transport: { sendBeacon, fetch: fetchMock },
      createSessionId: () => "session-user-gate",
    });

    expect(client.track(answerEvent)).toBe(false);
    expect(client.track(answerEvent, "   ")).toBe(false);
    expect(client.trackOnce("quest:11", answerEvent)).toBe(false);
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    expect(client.trackOnce("quest:11", answerEvent, " alice ")).toBe(true);
    const body = JSON.parse(sendBeacon.mock.calls[0][1]);
    expect(body.userId).toBe("alice");
  });
});
