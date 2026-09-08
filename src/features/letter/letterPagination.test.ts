import { describe, expect, it } from "vitest";
import type { LetterParagraph } from "@/domain/letter/types";
import {
  paginateLetterParagraphs,
  resolveLetterPageSwipe,
} from "@/features/letter/letterPagination";

const paragraphs: LetterParagraph[] = [
  { content: "ABCDEFGHI", align: "left", delayMs: 0 },
  { content: "JKLM", align: "right", delayMs: 0 },
];

describe("paginateLetterParagraphs", () => {
  it("splits long paragraphs and preserves every character in order", () => {
    const pages = paginateLetterParagraphs(
      paragraphs,
      (segments) =>
        segments.reduce(
          (length, segment) => length + segment.end - segment.start,
          0,
        ) <= 5,
    );

    expect(pages).toHaveLength(3);
    expect(
      pages.flatMap((page) =>
        page.map((segment) =>
          paragraphs[segment.paragraphIndex].content.slice(
            segment.start,
            segment.end,
          ),
        ),
      ),
    ).toEqual(["ABCDE", "FGHI", "J", "KLM"]);
  });

  it("starts a new page when the next paragraph cannot fit", () => {
    const pages = paginateLetterParagraphs(
      paragraphs,
      (segments) =>
        segments.every((segment) => segment.end - segment.start <= 9) &&
        segments.length <= 1,
    );

    expect(pages).toHaveLength(2);
    expect(pages[1][0]).toEqual({ paragraphIndex: 1, start: 0, end: 4 });
  });
});

describe("resolveLetterPageSwipe", () => {
  it("maps horizontal swipes for classical vertical writing", () => {
    expect(resolveLetterPageSwipe("horizontal", -90, 8)).toBe("next");
    expect(resolveLetterPageSwipe("horizontal", 90, 8)).toBe("previous");
  });

  it("maps vertical swipes for modern and magic horizontal writing", () => {
    expect(resolveLetterPageSwipe("vertical", 8, -90)).toBe("next");
    expect(resolveLetterPageSwipe("vertical", 8, 90)).toBe("previous");
  });

  it("ignores short and cross-axis gestures", () => {
    expect(resolveLetterPageSwipe("horizontal", 30, 2)).toBeNull();
    expect(resolveLetterPageSwipe("vertical", 80, -60)).toBeNull();
  });
});
