import { describe, expect, it } from "vitest";
import { classifySafeUrl, parseLegacyContent, withSafeQuery } from "./parser";

describe("legacy content parser", () => {
  it("parses every supported legacy marker into structured segments", () => {
    expect(
      parseLegacyContent(
        "普通[[高亮]]\n((站内信||/letter?from=test)) {{https://img.example/a.jpg}} <<https://video.example/a.mp4||https://img.example/poster.jpg>>",
      ),
    ).toEqual([
      { type: "text", content: "普通" },
      { type: "highlight", content: "高亮" },
      { type: "break" },
      {
        type: "link",
        content: "站内信",
        href: "/letter?from=test",
        target: "internal",
      },
      { type: "text", content: " " },
      { type: "image", url: "https://img.example/a.jpg" },
      { type: "text", content: " " },
      {
        type: "video",
        url: "https://video.example/a.mp4",
        poster: "https://img.example/poster.jpg",
      },
    ]);
  });

  it("classifies root-relative and HTTP links but rejects unsafe schemes", () => {
    expect(classifySafeUrl("/letter")).toEqual({
      href: "/letter",
      target: "internal",
    });
    expect(classifySafeUrl("https://sitkin.top/path")?.target).toBe("external");
    expect(classifySafeUrl("javascript:alert(1)")).toBeNull();
    expect(classifySafeUrl("//evil.example/path")).toBeNull();
    expect(classifySafeUrl("data:text/html,unsafe")).toBeNull();
  });

  it("encodes non-ASCII media paths without changing safe filename characters", () => {
    expect(
      parseLegacyContent(
        "{{https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/api.sitkin.top/images/微信图片_20260308181134_3_3.jpg}}",
      ),
    ).toEqual([
      {
        type: "image",
        url: "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/api.sitkin.top/images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260308181134_3_3.jpg",
      },
    ]);
  });

  it("adds encoded query values only to safe URLs", () => {
    expect(withSafeQuery("/bless?from=quest", { returnTo: "/?qa=52" })).toEqual(
      {
        href: "/bless?from=quest&returnTo=%2F%3Fqa%3D52",
        target: "internal",
      },
    );
    expect(withSafeQuery("javascript:alert(1)", { returnTo: "/" })).toBeNull();
  });

  it("keeps unsafe link labels as text and drops unsafe media", () => {
    expect(
      parseLegacyContent(
        "((仍可阅读||javascript:alert(1))){{javascript:alert(1)}}<<data:text/html,bad>>",
      ),
    ).toEqual([{ type: "text", content: "仍可阅读" }]);
  });
});
