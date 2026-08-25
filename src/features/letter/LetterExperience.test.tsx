import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
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
});
