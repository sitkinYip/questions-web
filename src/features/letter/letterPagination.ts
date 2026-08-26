import type { LetterParagraph } from "../../domain/letter/types";

export interface LetterPageSegment {
  paragraphIndex: number;
  start: number;
  end: number;
}

export type LetterPage = readonly LetterPageSegment[];
export type LetterPageDirection = "next" | "previous";
export type LetterSwipeAxis = "horizontal" | "vertical";

export function resolveLetterPageSwipe(
  axis: LetterSwipeAxis,
  deltaX: number,
  deltaY: number,
  threshold = 48,
): LetterPageDirection | null {
  const primaryDelta = axis === "horizontal" ? deltaX : deltaY;
  const crossDelta = axis === "horizontal" ? deltaY : deltaX;
  if (
    Math.abs(primaryDelta) < threshold ||
    Math.abs(primaryDelta) <= Math.abs(crossDelta) * 1.15
  ) {
    return null;
  }
  return primaryDelta < 0 ? "next" : "previous";
}

export function paginateLetterParagraphs(
  paragraphs: readonly LetterParagraph[],
  fits: (segments: LetterPage) => boolean,
): LetterPage[] {
  const pages: LetterPageSegment[][] = [[]];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    if (paragraph.content.length === 0) {
      const emptySegment = { paragraphIndex, start: 0, end: 0 };
      const currentPage = pages.at(-1)!;
      if (currentPage.length > 0 && !fits([...currentPage, emptySegment])) {
        pages.push([emptySegment]);
      } else {
        currentPage.push(emptySegment);
      }
      return;
    }

    let start = 0;
    while (start < paragraph.content.length) {
      const currentPage = pages.at(-1)!;
      const remaining = {
        paragraphIndex,
        start,
        end: paragraph.content.length,
      };
      if (fits([...currentPage, remaining])) {
        currentPage.push(remaining);
        break;
      }

      let low = start + 1;
      let high = paragraph.content.length;
      let bestEnd = start;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const candidate = { paragraphIndex, start, end: middle };
        if (fits([...currentPage, candidate])) {
          bestEnd = middle;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      if (bestEnd === start && currentPage.length > 0) {
        pages.push([]);
        continue;
      }

      const safeEnd = bestEnd === start ? start + 1 : bestEnd;
      currentPage.push({ paragraphIndex, start, end: safeEnd });
      start = safeEnd;
      if (start < paragraph.content.length) pages.push([]);
    }
  });

  return pages.filter((page, index) => page.length > 0 || index === 0);
}
