import { act, cleanup, render, screen } from "@testing-library/react";
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
