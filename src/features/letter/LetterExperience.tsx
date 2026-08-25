import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Letter } from "../../domain/letter/types";
import {
  trackAnalytics,
  trackAnalyticsOnce,
} from "../../infrastructure/analytics";

interface LetterExperienceProps {
  letter: Letter;
  returnTo: string | null;
}

export function LetterExperience({ letter, returnTo }: LetterExperienceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paragraphIndex, setParagraphIndex] = useState(-1);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const voicedParagraphRef = useRef(-1);

  const stopAudio = useCallback(() => {
    bgmRef.current?.pause();
    voiceRef.current?.pause();
    bgmRef.current = null;
    voiceRef.current = null;
    voicedParagraphRef.current = -1;
    setBgmPlaying(false);
  }, []);

  useEffect(
    () => () => {
      bgmRef.current?.pause();
      voiceRef.current?.pause();
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
    if (!isOpen || isFinished) return;
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
    letter.paragraphs,
    letter.typingSpeedMs,
    paragraphIndex,
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
    if (bgmRef.current) bgmRef.current.volume = 0.18;
    const restoreBgm = () => {
      if (bgmRef.current) bgmRef.current.volume = 0.5;
    };
    voice.onended = restoreBgm;
    voice.onerror = restoreBgm;
    void voice.play().catch(restoreBgm);
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
          className="letter-paper"
          aria-label={letter.title || "信件内容"}
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
          <header>
            <p className="eyebrow">{letter.variant} letter</p>
            {letter.title && <h1>{letter.title}</h1>}
            {letter.description && <p>{letter.description}</p>}
          </header>
          <div className="letter-paragraphs" aria-live="polite">
            {visibleParagraphs.map((paragraph, index) => (
              <p
                key={`${letter.id}:paragraph:${index}`}
                className={`letter-align-${paragraph.align}`}
              >
                {paragraph.visibleContent}
                {!isFinished && index === paragraphIndex && (
                  <span className="letter-cursor" aria-hidden="true" />
                )}
              </p>
            ))}
          </div>
          <footer className="letter-controls">
            {!isFinished && (
              <button type="button" onClick={skipTyping}>
                显示全文
              </button>
            )}
            <button type="button" onClick={closeLetter}>
              收起信件
            </button>
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
