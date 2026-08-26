import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Letter, LetterVariant } from "../../domain/letter/types";
import { LetterExperience } from "./LetterExperience";

function makeLetter(variant: LetterVariant): Letter {
  return {
    id: `letter-${variant}`,
    from: variant,
    variant,
    title: `${variant} 来信`,
    description: "跨越时间抵达",
    hintText: "点击开启",
    paragraphs: [
      { content: "第一段内容", align: "left", delayMs: 0 },
      { content: "第二段内容", align: "center", delayMs: 0 },
    ],
    backgroundImages: ["/paper.jpg"],
    typingSpeedMs: 40,
    revision: "r1",
  };
}

describe("LetterExperience", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(["modern", "classical", "magic"] as const)(
    "opens and renders the %s presentation",
    (variant) => {
      const { container } = render(
        <MemoryRouter>
          <LetterExperience letter={makeLetter(variant)} returnTo={null} />
        </MemoryRouter>,
      );

      expect(container.querySelector(`.letter-${variant}`)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /点击开启/ }));
      expect(
        screen.getByRole("region", { name: `${variant} 来信` }),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".letter-pagination-measure"),
      ).toHaveAttribute(
        "data-flow",
        variant === "classical" ? "vertical" : "horizontal",
      );
      expect(
        container.querySelector(".letter-controls")?.parentElement,
      ).toHaveClass("letter-reader");
      expect(
        container.querySelector(".letter-paper .letter-controls"),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "显示全文" }));
      expect(screen.getByText("第一段内容")).toBeInTheDocument();
      expect(screen.getByText("第二段内容")).toBeInTheDocument();
    },
  );

  it("shows the return action only while the envelope is closed", () => {
    render(
      <MemoryRouter>
        <LetterExperience letter={makeLetter("modern")} returnTo="/?qa=11" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "← 返回冒险" })).toHaveAttribute(
      "href",
      "/?qa=11",
    );
    fireEvent.click(screen.getByRole("button", { name: /点击开启/ }));
    expect(
      screen.queryByRole("link", { name: "← 返回冒险" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "收起信件" }));
    expect(
      screen.getByRole("link", { name: "← 返回冒险" }),
    ).toBeInTheDocument();
  });

  it("locks manual page turns while typing and unlocks them after showing all", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 300,
      height: 120,
      top: 0,
      right: 300,
      bottom: 120,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(120);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains("letter-pagination-measure") &&
          (this.textContent?.length ?? 0) > 6
          ? 240
          : 100;
      },
    );
    const letter = makeLetter("modern");
    letter.paragraphs = [
      { content: "一二三四五六七八九十十一十二", align: "left", delayMs: 0 },
    ];
    letter.typingSpeedMs = 10_000;
    const { container } = render(
      <MemoryRouter>
        <LetterExperience letter={letter} returnTo={null} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /点击开启/ }));
    const nextButton = await screen.findByRole("button", { name: "下一页" });
    const firstPage = container.querySelector<HTMLElement>(
      ".letter-paper-current",
    );
    expect(nextButton).toBeDisabled();
    expect(firstPage).toHaveAttribute("data-swipe-enabled", "false");

    fireEvent.click(screen.getByRole("button", { name: "显示全文" }));
    expect(nextButton).toBeEnabled();
    expect(firstPage).toHaveAttribute("data-swipe-enabled", "true");
    fireEvent.pointerDown(firstPage!, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 150,
      clientY: 100,
    });
    fireEvent.pointerUp(firstPage!, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 150,
      clientY: 20,
    });

    expect(screen.getByLabelText(/第 2 页/)).toBeInTheDocument();
    expect(
      container.querySelector(".letter-paper-turning"),
    ).toBeInTheDocument();
    expect(container.querySelector(".letter-paper-curl")).toBeInTheDocument();
    expect(container.querySelectorAll(".letter-paper")).toHaveLength(2);
  });

  it("measures pagination without animation transforms changing page boundaries", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 282,
      height: 100,
      top: 0,
      right: 282,
      bottom: 100,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains("letter-pagination-measure")
          ? Number.parseFloat(this.style.width) || 0
          : 300;
      },
    );
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains("letter-pagination-measure")
          ? Number.parseFloat(this.style.height) || 0
          : 120;
      },
    );
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        const length = this.textContent?.length ?? 0;
        if (length <= 4) return 90;
        if (length <= 8) return 110;
        return 130;
      },
    );
    const letter = makeLetter("magic");
    letter.paragraphs = [
      { content: "一二三四五六七八九十十一十二", align: "left", delayMs: 0 },
    ];
    letter.typingSpeedMs = 10_000;

    render(
      <MemoryRouter>
        <LetterExperience letter={letter} returnTo={null} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /点击开启/ }));

    expect(await screen.findByLabelText("第 1 页，共 2 页")).toBeInTheDocument();
  });

  it("pauses typing until an automatic page turn finishes", async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(120);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains("letter-pagination-measure") &&
          (this.textContent?.length ?? 0) > 6
          ? 240
          : 100;
      },
    );
    const letter = makeLetter("magic");
    letter.paragraphs = [
      { content: "一二三四五六七八九十十一十二", align: "left", delayMs: 0 },
    ];
    letter.typingSpeedMs = 10;
    const { container } = render(
      <MemoryRouter>
        <LetterExperience letter={letter} returnTo={null} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /点击开启/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    for (let index = 0; index < 6; index += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(container.querySelector(".letter-paper-turning")).toHaveTextContent(
      "一二三四五六",
    );
    expect(
      container.querySelector(".letter-paper-current .letter-paragraphs"),
    ).toHaveTextContent("");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(
      container.querySelector(".letter-paper-current .letter-paragraphs"),
    ).toHaveTextContent("");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(
      container.querySelector(".letter-paper-current .letter-paragraphs"),
    ).toHaveTextContent("七");
  });
});
