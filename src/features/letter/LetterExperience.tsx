import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Letter } from "../../domain/letter/types";
import {
  trackAnalytics,
  trackAnalyticsOnce,
} from "../../infrastructure/analytics";
import {
  paginateLetterParagraphs,
  resolveLetterPageSwipe,
  type LetterPage,
  type LetterPageDirection,
  type LetterSwipeAxis,
} from "./letterPagination";

interface LetterExperienceProps {
  letter: Letter;
  returnTo: string | null;
}

const PAGE_TURN_DURATION_MS = 920;

export function LetterExperience({ letter, returnTo }: LetterExperienceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paragraphIndex, setParagraphIndex] = useState(-1);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageDirection, setPageDirection] = useState<"next" | "previous">(
    "next",
  );
  const [previousPageIndex, setPreviousPageIndex] = useState<number | null>(
    null,
  );
  const [pages, setPages] = useState<LetterPage[]>(() => [
    letter.paragraphs.map((paragraph, paragraphIndex) => ({
      paragraphIndex,
      start: 0,
      end: paragraph.content.length,
    })),
  ]);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const voicedParagraphRef = useRef(-1);
  const pageSwipeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const pageTurnTimerRef = useRef<number | null>(null);
  const pageViewportRef = useRef<HTMLDivElement | null>(null);
  const paginationMeasureRef = useRef<HTMLDivElement | null>(null);

  const stopAudio = useCallback(() => {
    bgmRef.current?.pause();
    voiceRef.current?.pause();
    bgmRef.current = null;
    voiceRef.current = null;
    voicedParagraphRef.current = -1;
    setBgmPlaying(false);
    setIsVoicePlaying(false);
  }, []);

  useEffect(
    () => () => {
      bgmRef.current?.pause();
      voiceRef.current?.pause();
      bgmRef.current = null;
      voiceRef.current = null;
      if (pageTurnTimerRef.current !== null) {
        window.clearTimeout(pageTurnTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen || letter.backgroundImages.length < 2) return;
    const timer = window.setInterval(
      () =>
        setBackgroundIndex(
          (current) => (current + 1) % letter.backgroundImages.length,
        ),
      5_000,
    );
    return () => window.clearInterval(timer);
  }, [isOpen, letter.backgroundImages.length]);

  useEffect(() => {
    if (!isOpen || isFinished || previousPageIndex !== null) return;
    if (paragraphIndex === -1) {
      const firstDelay = letter.paragraphs[0]?.delayMs ?? 0;
      const timer = window.setTimeout(() => setParagraphIndex(0), firstDelay);
      return () => window.clearTimeout(timer);
    }

    const paragraph = letter.paragraphs[paragraphIndex];
    if (!paragraph) {
      const timer = window.setTimeout(() => setIsFinished(true), 0);
      return () => window.clearTimeout(timer);
    }
    if (characterIndex < paragraph.content.length) {
      const timer = window.setTimeout(
        () => setCharacterIndex((current) => current + 1),
        letter.typingSpeedMs,
      );
      return () => window.clearTimeout(timer);
    }
    if (isVoicePlaying) return;
    if (paragraphIndex < letter.paragraphs.length - 1) {
      const delay = letter.paragraphs[paragraphIndex + 1]?.delayMs ?? 0;
      const timer = window.setTimeout(() => {
        setParagraphIndex((current) => current + 1);
        setCharacterIndex(0);
      }, delay);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setIsFinished(true), 0);
    return () => window.clearTimeout(timer);
  }, [
    characterIndex,
    isFinished,
    isOpen,
    isVoicePlaying,
    letter.paragraphs,
    letter.typingSpeedMs,
    paragraphIndex,
    previousPageIndex,
  ]);

  useEffect(() => {
    if (!isOpen || isFinished || paragraphIndex < 0) return;
    const paragraph = letter.paragraphs[paragraphIndex];
    if (!paragraph?.audioUrl || voicedParagraphRef.current === paragraphIndex)
      return;
    voicedParagraphRef.current = paragraphIndex;
    voiceRef.current?.pause();
    const voice = new Audio(paragraph.audioUrl);
    voiceRef.current = voice;
    setIsVoicePlaying(true);
    if (bgmRef.current) bgmRef.current.volume = 0.18;
    const finishVoice = () => {
      if (voiceRef.current !== voice) return;
      voiceRef.current = null;
      if (bgmRef.current) bgmRef.current.volume = 0.5;
      setIsVoicePlaying(false);
    };
    voice.onended = finishVoice;
    voice.onerror = finishVoice;
    voice.onabort = finishVoice;
    void voice.play().catch(finishVoice);
  }, [isFinished, isOpen, letter.paragraphs, paragraphIndex]);

  const visibleParagraphs = useMemo(
    () =>
      letter.paragraphs.map((paragraph, index) => ({
        ...paragraph,
        visibleContent:
          index < paragraphIndex || isFinished
            ? paragraph.content
            : index === paragraphIndex
              ? paragraph.content.slice(0, characterIndex)
              : "",
      })),
    [characterIndex, isFinished, letter.paragraphs, paragraphIndex],
  );

  useLayoutEffect(() => {
    if (!isOpen) return;
    const viewport = pageViewportRef.current;
    const measure = paginationMeasureRef.current;
    if (!viewport || !measure) return;

    const repaginate = () => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (width <= 0 || height <= 0) return;
      measure.style.width = `${width}px`;
      measure.style.height = `${height}px`;

      const nextPages = paginateLetterParagraphs(
        letter.paragraphs,
        (segments) => {
          measure.replaceChildren();
          segments.forEach((segment) => {
            const paragraph = letter.paragraphs[segment.paragraphIndex];
            const element = document.createElement("p");
            element.className = `letter-align-${paragraph.align}`;
            element.textContent = paragraph.content.slice(
              segment.start,
              segment.end,
            );
            measure.append(element);
          });
          return (
            measure.scrollWidth <= measure.clientWidth + 1 &&
            measure.scrollHeight <= measure.clientHeight + 1
          );
        },
      );
      setPages(nextPages);
      setPageIndex((current) => Math.min(current, nextPages.length - 1));
    };

    repaginate();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", repaginate);
      return () => window.removeEventListener("resize", repaginate);
    }
    const observer = new ResizeObserver(repaginate);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [isOpen, letter.paragraphs, letter.variant, pageIndex]);

  useEffect(() => {
    if (!isOpen || isFinished || paragraphIndex < 0 || pages.length < 2) return;
    const activePage = pages.findIndex((page) =>
      page.some(
        (segment) =>
          segment.paragraphIndex === paragraphIndex &&
          characterIndex >= segment.start &&
          (characterIndex < segment.end ||
            (segment.start === segment.end &&
              characterIndex === segment.end)),
      ),
    );
    if (activePage > pageIndex) {
      const timer = window.setTimeout(() => {
        if (pageTurnTimerRef.current !== null) {
          window.clearTimeout(pageTurnTimerRef.current);
        }
        setPreviousPageIndex(pageIndex);
        setPageDirection("next");
        setPageIndex(activePage);
        pageTurnTimerRef.current = window.setTimeout(() => {
          setPreviousPageIndex(null);
          pageTurnTimerRef.current = null;
        }, PAGE_TURN_DURATION_MS);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [characterIndex, isFinished, isOpen, pageIndex, pages, paragraphIndex]);

  useEffect(() => {
    if (!isFinished) return;
    trackAnalyticsOnce(`letter:${letter.id}:completed`, {
      name: "letter_state",
      letterId: letter.id,
      from: letter.from,
      title: letter.title,
      state: "completed",
      variant: letter.variant,
    });
  }, [isFinished, letter.from, letter.id, letter.title, letter.variant]);

  const openLetter = () => {
    trackAnalytics({
      name: "letter_state",
      letterId: letter.id,
      from: letter.from,
      title: letter.title,
      state: "opened",
      variant: letter.variant,
    });
    setIsOpen(true);
    if (!letter.mainAudioUrl || bgmRef.current) return;
    const bgm = new Audio(letter.mainAudioUrl);
    bgm.loop = true;
    bgm.volume = 0.5;
    bgmRef.current = bgm;
    void bgm
      .play()
      .then(() => setBgmPlaying(true))
      .catch(() => setBgmPlaying(false));
  };

  const closeLetter = () => {
    trackAnalytics({
      name: "letter_state",
      letterId: letter.id,
      from: letter.from,
      title: letter.title,
      state: "closed",
      variant: letter.variant,
    });
    stopAudio();
    setIsOpen(false);
    setParagraphIndex(-1);
    setCharacterIndex(0);
    setIsFinished(false);
    setBackgroundIndex(0);
    setPageIndex(0);
    setPageDirection("next");
    setPreviousPageIndex(null);
    if (pageTurnTimerRef.current !== null) {
      window.clearTimeout(pageTurnTimerRef.current);
      pageTurnTimerRef.current = null;
    }
    pageSwipeRef.current = null;
  };

  const toggleBgm = () => {
    const bgm = bgmRef.current;
    if (!bgm) return;
    if (bgmPlaying) {
      bgm.pause();
      setBgmPlaying(false);
    } else {
      void bgm.play().then(() => setBgmPlaying(true));
    }
  };

  const skipTyping = () => {
    setParagraphIndex(Math.max(0, letter.paragraphs.length - 1));
    setCharacterIndex(letter.paragraphs.at(-1)?.content.length ?? 0);
    setIsFinished(true);
  };

  const paperBackground =
    letter.backgroundImages[backgroundIndex] ?? letter.pageBackgroundUrl;
  const currentPage = pages[pageIndex] ?? [];
  const previousPage =
    previousPageIndex === null ? null : (pages[previousPageIndex] ?? null);
  const swipeAxis: LetterSwipeAxis =
    letter.variant === "classical" ? "horizontal" : "vertical";
  const canTurnPages =
    isFinished && pages.length > 1 && previousPageIndex === null;
  const turnPage = useCallback(
    (direction: LetterPageDirection) => {
      if (!isFinished || previousPageIndex !== null) return;
      const nextPage = pageIndex + (direction === "next" ? 1 : -1);
      if (nextPage < 0 || nextPage >= pages.length) return;
      if (pageTurnTimerRef.current !== null) {
        window.clearTimeout(pageTurnTimerRef.current);
      }
      setPreviousPageIndex(pageIndex);
      setPageDirection(direction);
      setPageIndex(nextPage);
      pageTurnTimerRef.current = window.setTimeout(() => {
        setPreviousPageIndex(null);
        pageTurnTimerRef.current = null;
      }, PAGE_TURN_DURATION_MS);
    },
    [isFinished, pageIndex, pages.length, previousPageIndex],
  );

  const beginPageSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canTurnPages || !event.isPrimary || event.pointerType === "mouse") {
      return;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pageSwipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const finishPageSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = pageSwipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) return;
    pageSwipeRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const threshold = Math.min(
      96,
      Math.max(
        48,
        (swipeAxis === "horizontal"
          ? event.currentTarget.clientWidth
          : event.currentTarget.clientHeight) * 0.12,
      ),
    );
    const direction = resolveLetterPageSwipe(
      swipeAxis,
      event.clientX - swipe.startX,
      event.clientY - swipe.startY,
      threshold,
    );
    if (direction) turnPage(direction);
  };

  const cancelPageSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pageSwipeRef.current?.pointerId === event.pointerId) {
      pageSwipeRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen || !canTurnPages) return;
    const handlePageKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") turnPage("previous");
      if (event.key === "ArrowRight") turnPage("next");
    };
    document.addEventListener("keydown", handlePageKeyDown);
    return () => document.removeEventListener("keydown", handlePageKeyDown);
  }, [canTurnPages, isOpen, turnPage]);

  const renderPaperSheet = (
    page: LetterPage,
    renderedPageIndex: number,
    state: "current" | "turning",
  ) => {
    const isCurrentSheet = state === "current";
    return (
      <div
        key={`${letter.id}:${state}:page:${renderedPageIndex}`}
        className={`letter-paper letter-paper-${state} ${
          isCurrentSheet && previousPage !== null ? "is-revealed" : ""
        }`}
        data-page-direction={pageDirection}
        data-swipe-axis={swipeAxis}
        data-swipe-enabled={isCurrentSheet && canTurnPages ? "true" : "false"}
        onPointerDown={isCurrentSheet ? beginPageSwipe : undefined}
        onPointerUp={isCurrentSheet ? finishPageSwipe : undefined}
        onPointerCancel={isCurrentSheet ? cancelPageSwipe : undefined}
        aria-hidden={isCurrentSheet ? undefined : true}
        aria-describedby={
          isCurrentSheet && pages.length > 1
            ? "letter-page-gesture-instructions"
            : undefined
        }
      >
        {paperBackground && (
          <img
            className="letter-paper-image"
            src={paperBackground}
            alt=""
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
        <div className="letter-paper-frame" aria-hidden="true" />
        <div className="letter-paper-content">
          <header>
            <p className="eyebrow">{letter.variant} letter</p>
            {letter.title && <h1>{letter.title}</h1>}
            {letter.description && <p>{letter.description}</p>}
          </header>
          <div
            ref={isCurrentSheet ? pageViewportRef : undefined}
            className="letter-paragraphs"
            aria-live={isCurrentSheet ? "polite" : undefined}
          >
            {page.map((segment) => {
              const paragraph = visibleParagraphs[segment.paragraphIndex];
              const visibleEnd = Math.min(
                segment.end,
                paragraph.visibleContent.length,
              );
              const showsCursor =
                isCurrentSheet &&
                !isFinished &&
                segment.paragraphIndex === paragraphIndex &&
                characterIndex >= segment.start &&
                characterIndex <= segment.end;
              return (
                <p
                  key={`${letter.id}:page:${renderedPageIndex}:paragraph:${segment.paragraphIndex}:${segment.start}`}
                  className={`letter-align-${paragraph.align}`}
                >
                  {paragraph.visibleContent.slice(segment.start, visibleEnd)}
                  {showsCursor && (
                    <span className="letter-cursor" aria-hidden="true" />
                  )}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main
      className={`letter-page letter-${letter.variant} ${isOpen ? "is-open" : "is-sealed"}`}
    >
      {letter.pageBackgroundUrl && (
        <img
          className="letter-atmosphere-image"
          src={letter.pageBackgroundUrl}
          alt=""
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
      <div className="letter-atmosphere" aria-hidden="true" />
      {!isOpen && returnTo && (
        <a className="letter-return" href={returnTo}>
          ← 返回冒险
        </a>
      )}

      {!isOpen ? (
        <button className="letter-envelope" type="button" onClick={openLetter}>
          <span className="letter-envelope-flap" aria-hidden="true" />
          <span className="letter-seal" aria-hidden="true">
            {letter.title?.[0] || letter.hintText[0] || "✦"}
          </span>
          <span className="letter-recipient">
            {letter.title || "一封未署名的来信"}
          </span>
          {letter.description && (
            <span className="letter-description">{letter.description}</span>
          )}
          <span className="letter-open-hint">{letter.hintText}</span>
        </button>
      ) : (
        <section
          className="letter-reader"
          aria-label={letter.title || "信件内容"}
        >
          <div
            className="letter-paper-stack"
            data-swipe-axis={swipeAxis}
            data-turning={previousPage === null ? "false" : "true"}
          >
            {renderPaperSheet(currentPage, pageIndex, "current")}
            {previousPage !== null &&
              renderPaperSheet(
                previousPage,
                previousPageIndex ?? pageIndex,
                "turning",
              )}
            {previousPage !== null && (
              <span
                className="letter-paper-curl"
                data-page-direction={pageDirection}
                data-swipe-axis={swipeAxis}
                aria-hidden="true"
              />
            )}
          </div>
          <div
            ref={paginationMeasureRef}
            className="letter-paragraphs letter-pagination-measure"
            data-flow={
              letter.variant === "classical" ? "vertical" : "horizontal"
            }
            aria-hidden="true"
          />
          <footer className="letter-controls">
            {pages.length > 1 && (
              <div
                className="letter-page-navigation"
                data-locked={canTurnPages ? "false" : "true"}
              >
                <button
                  type="button"
                  disabled={!canTurnPages || pageIndex === 0}
                  title={
                    !isFinished
                      ? "全文显示后可翻页"
                      : previousPage !== null
                        ? "翻页中"
                        : undefined
                  }
                  onClick={() => turnPage("previous")}
                >
                  上一页
                </button>
                <span
                  aria-label={`第 ${pageIndex + 1} 页，共 ${pages.length} 页`}
                >
                  {pageIndex + 1} / {pages.length}
                </span>
                <button
                  type="button"
                  disabled={!canTurnPages || pageIndex === pages.length - 1}
                  title={
                    !isFinished
                      ? "全文显示后可翻页"
                      : previousPage !== null
                        ? "翻页中"
                        : undefined
                  }
                  onClick={() => turnPage("next")}
                >
                  下一页
                </button>
              </div>
            )}
            {pages.length > 1 && (
              <span id="letter-page-gesture-instructions" className="sr-only">
                {isFinished
                  ? swipeAxis === "horizontal"
                    ? "可左右滑动翻页。"
                    : "可上下滑动翻页。"
                  : "打字完成或显示全文后可以翻页。"}
              </span>
            )}
            <div className="letter-actions">
              {!isFinished && (
                <button type="button" onClick={skipTyping}>
                  显示全文
                </button>
              )}
              <button type="button" onClick={closeLetter}>
                收起信件
              </button>
            </div>
          </footer>
        </section>
      )}

      {isOpen && letter.mainAudioUrl && (
        <button
          className={`letter-audio ${bgmPlaying ? "is-playing" : ""}`}
          type="button"
          onClick={toggleBgm}
          aria-label={bgmPlaying ? "暂停背景音乐" : "播放背景音乐"}
        >
          {bgmPlaying ? "Ⅱ" : "♪"}
        </button>
      )}
    </main>
  );
}
