import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { QuestClue } from "../../../domain/quest/types";
import { DesktopClueShelf } from "./DesktopClueShelf";

const mediaUrl = "https://protected.example/scene.mp4";
const clue: QuestClue = {
  id: "scene",
  kind: "video",
  title: "场景回溯",
  content: "点击查看剧情重现",
  autoPlay: false,
  imageUrls: [],
  url: mediaUrl,
  // The API view currently supplies href for media as well as link clues.
  href: mediaUrl,
  linkTarget: "external",
};

function renderShelf(value: QuestClue) {
  const actions = {
    openText: vi.fn(),
    openImages: vi.fn(),
    openVideo: vi.fn(),
  };
  render(
    <MemoryRouter>
      <DesktopClueShelf clues={[value]} {...actions} />
    </MemoryRouter>,
  );
  return actions;
}

describe("DesktopClueShelf", () => {
  it("plays video in-page without exposing its CDN URL as a link", () => {
    const { openVideo } = renderShelf(clue);
    const trigger = screen.getByRole("button", { name: "播放线索影像" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(openVideo).toHaveBeenCalledExactlyOnceWith(mediaUrl);
  });

  it("keeps image URLs in the media viewer too", () => {
    const { openImages } = renderShelf({
      ...clue,
      kind: "image",
      imageUrls: ["https://protected.example/scene.jpg"],
    });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "放大线索图片 1" }));
    expect(openImages).toHaveBeenCalledWith(
      ["https://protected.example/scene.jpg"],
      0,
    );
  });

  it.each([
    ["link", "external", "https://story.example/chapter"],
    ["link", "internal", "/story/chapter"],
    ["letter", "internal", "/play/journey/content/letter"],
  ] as const)(
    "preserves %s clues with %s navigation",
    (kind, linkTarget, href) => {
      renderShelf({ ...clue, kind, linkTarget, href });
      const link = screen.getByRole("link", { name: "打开这份线索" });
      expect(link).toHaveAttribute("href", href);
      if (linkTarget === "external")
        expect(link).toHaveAttribute("target", "_blank");
      else expect(link).not.toHaveAttribute("target");
      expect(
        screen.queryByRole("button", { name: "播放线索影像" }),
      ).not.toBeInTheDocument();
    },
  );

  it("does not expose a broken action for video without a playable URL", () => {
    renderShelf({ ...clue, url: undefined });
    expect(
      screen.queryByRole("button", { name: "播放线索影像" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
