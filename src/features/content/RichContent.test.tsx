import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RichContent } from "./RichContent";

afterEach(() => vi.restoreAllMocks());

describe("RichContent", () => {
  it("offers sound controls for a playing Quark video in rich content", () => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Quark/7.0");
    const { container } = render(
      <RichContent source="<<https://video.example/movie.mp4>>" />,
    );
    const video = container.querySelector("video")!;
    expect(video.muted).toBe(true);
    expect(video.autoplay).toBe(false);
    expect(video.preload).toBe("metadata");
    fireEvent.play(video);
    fireEvent.click(screen.getByRole("button", { name: "开启声音" }));
    expect(video.muted).toBe(false);
  });

  it("renders safe semantic elements without HTML injection", () => {
    const { container } = render(
      <MemoryRouter>
        <RichContent
          source={
            "[[重点]] ((信件||/letter?from=test)) ((官网||https://sitkin.top)) <script>alert(1)</script>"
          }
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("重点").tagName).toBe("MARK");
    expect(screen.getByRole("link", { name: "信件" })).toHaveAttribute(
      "href",
      "/letter?from=test",
    );
    expect(screen.getByRole("link", { name: "官网" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container).toHaveTextContent("<script>alert(1)</script>");
  });

  it("keeps the origin referrer required by protected media hosts", () => {
    render(
      <MemoryRouter>
        <RichContent source="{{https://img.example/微信图片_3_3.jpg}}" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("img", { name: "题目内容" })).toHaveAttribute(
      "referrerpolicy",
      "strict-origin-when-cross-origin",
    );
  });
});
