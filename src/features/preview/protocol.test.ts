import { describe, expect, it } from "vitest";
import { allowedPreviewOrigin, previewMessageSchema } from "./protocol";
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
    value: { title: "标题", content: "正文", popupTitle: "", buttonText: "" },
  },
};
describe("editor preview trust boundary", () => {
  it("accepts only exact configured origins in production", () => {
    expect(allowedPreviewOrigin("https://vae.sitkin.top", false)).toBe(true);
    expect(
      allowedPreviewOrigin("https://vae.sitkin.top.evil.test", false),
    ).toBe(false);
    expect(allowedPreviewOrigin("http://127.0.0.1:5174", false)).toBe(false);
    expect(allowedPreviewOrigin("http://127.0.0.1:5174", true)).toBe(true);
    expect(
      allowedPreviewOrigin(
        "https://admin.example.com",
        false,
        "https://admin.example.com",
      ),
    ).toBe(true);
  });
  it("rejects unknown protocol versions and malformed content", () => {
    expect(previewMessageSchema.safeParse(message).success).toBe(true);
    expect(
      previewMessageSchema.safeParse({ ...message, version: 2 }).success,
    ).toBe(false);
    expect(
      previewMessageSchema.safeParse({
        ...message,
        draft: { kind: "notification", value: { content: [] } },
      }).success,
    ).toBe(false);
    expect(
      previewMessageSchema.safeParse({ ...message, revision: -1 }).success,
    ).toBe(false);
  });
  it("strips unrelated fields and rejects executable media URLs", () => {
    const parsed = previewMessageSchema.parse({ ...message, token: "secret" });
    expect(parsed).not.toHaveProperty("token");
    const draft = {
      kind: "question",
      value: {
        id: "q",
        kind: "text",
        title: "",
        placeholder: "",
        content: [
          {
            text: "",
            hint: "",
            imageUrl: "javascript:alert(1)",
            imageUrls: [],
            videoUrl: "",
          },
        ],
        options: [],
      },
    };
    expect(previewMessageSchema.safeParse({ ...message, draft }).success).toBe(
      false,
    );
  });
});
