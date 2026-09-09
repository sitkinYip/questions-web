import { sessionFixture } from "../../../e2e/session-preview-fixture";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { EditorPreview } from "./EditorPreview";

const originalParent = window.parent;
const parentWindow = { postMessage: vi.fn() };
const message = {
  type: "sitkin:preview:update",
  version: 1,
  channel: "test",
  revision: 1,
  reset: 0,
  theme: "light",
  state: "unread",
  draft: {
    kind: "notification",
    value: {
      title: "安全预览",
      content: "正文",
      popupTitle: "",
      buttonText: "确认",
    },
  },
};
afterEach(() => {
  cleanup();
  Object.defineProperty(window, "parent", {
    configurable: true,
    value: originalParent,
  });
  history.replaceState(null, "", "/");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
function setup() {
  Object.defineProperty(window, "parent", {
    configurable: true,
    value: parentWindow,
  });
  history.replaceState(
    null,
    "",
    "/preview/?parentOrigin=https%3A%2F%2Fvae.sitkin.top&channel=test",
  );
  render(<EditorPreview />);
}
function send(
  data: unknown,
  origin = "https://vae.sitkin.top",
  source: unknown = parentWindow,
) {
  act(() =>
    window.dispatchEvent(
      new MessageEvent("message", { data, origin, source: source as Window }),
    ),
  );
}
it("rejects other origins, windows, channels and stale revisions", () => {
  setup();
  send(message, "https://evil.example");
  send(message, undefined, window);
  send({ ...message, channel: "other" });
  expect(screen.queryByRole("heading", { name: "安全预览" })).toBeNull();
  send(message);
  expect(screen.getByRole("heading", { name: "安全预览" })).toBeInTheDocument();
  send({
    ...message,
    revision: 0,
    draft: {
      ...message.draft,
      value: { ...message.draft.value, title: "过期消息" },
    },
  });
  expect(screen.queryByRole("heading", { name: "过期消息" })).toBeNull();
});
it("recovers from malformed drafts and keeps notification reads in memory", () => {
  const storage = vi.spyOn(Storage.prototype, "setItem");
  const fetch = vi.spyOn(window, "fetch");
  setup();
  send({ ...message, draft: null });
  expect(screen.getByRole("alert")).toHaveTextContent("配置暂时无法预览");
  send(message);
  act(() => screen.getByRole("button", { name: "确认" }).click());
  expect(document.querySelector(".notification-letter")).toHaveAttribute(
    "data-read",
    "true",
  );
  send({
    ...message,
    revision: 2,
    draft: {
      ...message.draft,
      value: { ...message.draft.value, title: "更新通知" },
    },
  });
  expect(screen.getByRole("heading", { name: "更新通知" })).toBeInTheDocument();
  expect(document.querySelector(".notification-letter")).toHaveAttribute(
    "data-read",
    "true",
  );
  expect(fetch).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
});

const canvas = vi.hoisted(() => ({ formText: vi.fn(), releaseText: vi.fn() }));
vi.mock("@/features/bless/canvas-engine", () => ({
  useBlessCanvas: () => canvas,
}));
function narrativeMessage(kind: "letter" | "bless", variant = "modern") {
  return {
    ...message,
    draft: {
      kind: "narrative",
      value: {
        id: "editor-narrative",
        kind,
        title: "剧情标题",
        payload:
          kind === "letter"
            ? {
                variant,
                hintText: "开启剧情",
                typingSpeedMs: 20,
                mainAudioUrl: "https://assets.example/music.mp3",
                paragraphs: [
                  {
                    content: "旧文字正在逐字显示，需要在编辑后停止。",
                    delayMs: 0,
                    align: "left",
                  },
                ],
              }
            : {
                phrases: [{ text: "旧祝福", durationMs: 3000 }],
                closingLines: [{ text: "旧谢幕", durationMs: 1000 }],
                mainAudioUrl: "https://assets.example/music.mp3",
              },
      },
    },
  };
}
function mockNarrativeRuntime() {
  vi.useFakeTimers();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const pause = vi.fn();
  vi.stubGlobal(
    "Audio",
    class {
      paused = false;
      play = vi.fn(() => Promise.resolve());
      pause = pause;
    },
  );
  return pause;
}
it.each(["modern", "classical", "magic"])(
  "resets the %s letter and stops audio/typing on every new revision",
  async (variant) => {
    const pause = mockNarrativeRuntime();
    setup();
    const first = narrativeMessage("letter", variant);
    send(first);
    expect(document.querySelector(".letter-page")).toHaveClass("is-sealed");
    await act(async () =>
      screen.getByRole("button", { name: /开启剧情/ }).click(),
    );
    act(() => vi.advanceTimersByTime(100));
    expect(document.querySelector(".letter-page")).toHaveClass("is-open");
    const next = {
      ...first,
      revision: 2,
      draft: {
        ...first.draft,
        value: {
          ...first.draft.value,
          title: "更新剧情",
          payload: {
            ...first.draft.value.payload,
            paragraphs: [{ content: "新文字", delayMs: 0, align: "center" }],
          },
        },
      },
    };
    send(next);
    expect(document.querySelector(".letter-page")).toHaveClass("is-sealed");
    expect(pause).toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(5000));
    expect(document.querySelector(".letter-page")).toHaveClass("is-sealed");
    await act(async () =>
      screen.getByRole("button", { name: /开启剧情/ }).click(),
    );
    act(() => screen.getByRole("button", { name: "显示全文" }).click());
    expect(screen.getByText("新文字")).toBeInTheDocument();
    expect(screen.queryByText(/旧文字/)).toBeNull();
  },
);
it("returns blessings to the start and cancels the previous audio and sequence", async () => {
  const pause = mockNarrativeRuntime();
  setup();
  const first = narrativeMessage("bless");
  send(first);
  await act(async () =>
    screen.getByRole("button", { name: "剧情标题" }).click(),
  );
  expect(document.querySelector(".bless-start")).toBeNull();
  send({
    ...first,
    revision: 2,
    draft: { ...first.draft, value: { ...first.draft.value, title: "新祝福" } },
  });
  expect(pause).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "新祝福" })).toBeInTheDocument();
  await act(async () => vi.advanceTimersByTime(10000));
  expect(screen.getByRole("button", { name: "新祝福" })).toBeInTheDocument();
  expect(screen.queryByText("旧谢幕")).toBeNull();
});

it("session edits stop audio and pending presentations while retaining the selected level", async () => {
  vi.useFakeTimers();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const pause = vi.fn();
  vi.stubGlobal(
    "Audio",
    class extends EventTarget {
      paused = false;
      play = vi.fn(() => Promise.resolve());
      pause = pause;
    },
  );
  const storage = vi.spyOn(Storage.prototype, "setItem");
  const fetch = vi.spyOn(window, "fetch");
  setup();
  const value = sessionFixture();
  value.assignment.presentation.bgmUrl = "https://assets.example/music.mp3";
  send({ ...message, draft: { kind: "session", value } });
  fireEvent.change(screen.getByRole("combobox", { name: "当前关卡" }), {
    target: { value: "l1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "模拟答对" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("过关线索");
  const previousPauses = pause.mock.calls.length;
  send({ ...message, revision: 2, draft: { kind: "session", value } });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(pause.mock.calls.length).toBeGreaterThan(previousPauses);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(screen.getByRole("combobox", { name: "当前关卡" })).toHaveValue("l1");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(storage).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
