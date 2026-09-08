import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuestClue } from "@/domain/quest/types";
import { DesktopClueShelf } from "@/features/game/desktop/DesktopClueShelf";

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

function renderShelf(value: QuestClue | readonly QuestClue[]) {
  const actions = {
    openText: vi.fn(),
    openImages: vi.fn(),
    openVideo: vi.fn(),
  };
  const view = render(
    <MemoryRouter>
      <DesktopClueShelf
        clues={Array.isArray(value) ? value : [value]}
        {...actions}
      />
    </MemoryRouter>,
  );
  return { ...actions, ...view };
}

describe("DesktopClueShelf", () => {
  afterEach(() => vi.restoreAllMocks());

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

  it("scrolls a newly auto-selected clue into the horizontal index viewport", () => {
    const scrollTo = vi.fn();
    const firstClues = Array.from({ length: 3 }, (_, index) => ({
      ...clue,
      id: `clue-${index + 1}`,
      title: `线索 ${index + 1}`,
    }));
    const { rerender } = renderShelf(firstClues);
    const index = screen.getByRole("navigation", { name: "已解锁线索" });
    Object.defineProperties(index, {
      clientWidth: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 520 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    const fourth = { ...clue, id: "clue-4", title: "自动展示的第四条线索" };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains("desktop-clues__index"))
          return {
            left: 100,
            right: 400,
            width: 300,
          } as DOMRect;
        if (this.textContent?.includes(fourth.title))
          return {
            left: 410,
            right: 520,
            width: 110,
          } as DOMRect;
        return { left: 110, right: 210, width: 100 } as DOMRect;
      },
    );

    rerender(
      <MemoryRouter>
        <DesktopClueShelf
          clues={[...firstClues, fourth]}
          openText={vi.fn()}
          openImages={vi.fn()}
          openVideo={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(scrollTo).toHaveBeenCalledWith({ left: 215, behavior: "smooth" });
  });

  it("brings unread letter and blessing jumps into view together when they fit", () => {
    const scrollTo = vi.fn();
    const clues: QuestClue[] = [
      { ...clue, id: "first", title: "普通线索" },
      {
        ...clue,
        id: "letter",
        kind: "letter",
        title: "一封来信",
        href: "/letter",
      },
      {
        ...clue,
        id: "bless",
        kind: "bless",
        title: "旅途祝福",
        href: "/bless",
      },
      { ...clue, id: "selected", title: "末尾普通线索" },
    ];
    const actions = {
      openText: vi.fn(),
      openImages: vi.fn(),
      openVideo: vi.fn(),
    };
    const { rerender } = render(
      <MemoryRouter>
        <DesktopClueShelf clues={clues} {...actions} />
      </MemoryRouter>,
    );
    const index = screen.getByRole("navigation", { name: "已解锁线索" });
    Object.defineProperties(index, {
      clientWidth: { configurable: true, value: 400 },
      scrollWidth: { configurable: true, value: 1000 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains("desktop-clues__index"))
          return { left: 100, right: 500, width: 400 } as DOMRect;
        if (this.textContent?.includes("一封来信"))
          return { left: 520, right: 620, width: 100 } as DOMRect;
        if (this.textContent?.includes("旅途祝福"))
          return { left: 650, right: 750, width: 100 } as DOMRect;
        if (this.textContent?.includes("末尾普通线索"))
          return { left: 780, right: 880, width: 100 } as DOMRect;
        return { left: 110, right: 210, width: 100 } as DOMRect;
      },
    );

    rerender(
      <MemoryRouter>
        <DesktopClueShelf
          clues={clues}
          {...actions}
          attentionClueIds={new Set(["letter", "bless"])}
        />
      </MemoryRouter>,
    );

    expect(scrollTo).toHaveBeenCalledWith({ left: 335, behavior: "smooth" });

    fireEvent.click(screen.getByRole("button", { name: /末尾普通线索/ }));
    expect(scrollTo).toHaveBeenLastCalledWith({
      left: 530,
      behavior: "smooth",
    });
  });

  it("prioritizes an unread blessing when letter and blessing cannot fit together", () => {
    const scrollTo = vi.fn();
    const clues: QuestClue[] = [
      {
        ...clue,
        id: "letter",
        kind: "letter",
        title: "遥远来信",
        href: "/letter",
      },
      {
        ...clue,
        id: "bless",
        kind: "bless",
        title: "优先祝福",
        href: "/bless",
      },
      { ...clue, id: "selected", title: "末尾普通线索" },
    ];
    const actions = {
      openText: vi.fn(),
      openImages: vi.fn(),
      openVideo: vi.fn(),
    };
    const { rerender } = render(
      <MemoryRouter>
        <DesktopClueShelf clues={clues} {...actions} />
      </MemoryRouter>,
    );
    const index = screen.getByRole("navigation", { name: "已解锁线索" });
    Object.defineProperties(index, {
      clientWidth: { configurable: true, value: 400 },
      scrollWidth: { configurable: true, value: 1400 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains("desktop-clues__index"))
          return { left: 100, right: 500, width: 400 } as DOMRect;
        if (this.textContent?.includes("遥远来信"))
          return { left: 410, right: 520, width: 110 } as DOMRect;
        if (this.textContent?.includes("优先祝福"))
          return { left: 900, right: 1010, width: 110 } as DOMRect;
        return { left: 1050, right: 1160, width: 110 } as DOMRect;
      },
    );

    rerender(
      <MemoryRouter>
        <DesktopClueShelf
          clues={clues}
          {...actions}
          attentionClueIds={new Set(["letter", "bless"])}
        />
      </MemoryRouter>,
    );

    expect(scrollTo).toHaveBeenCalledWith({ left: 655, behavior: "smooth" });
  });
});
