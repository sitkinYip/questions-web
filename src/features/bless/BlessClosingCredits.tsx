import { uiCopy } from "@/config/ui-copy";
import { useEffect, useRef, useState } from "react";
import type { BlessLine } from "@/domain/bless/types";
import { playAudio } from "@/shared/media/play-audio";

interface BlessClosingCreditsProps {
  lines: readonly BlessLine[];
}

export function BlessClosingCredits({ lines }: BlessClosingCreditsProps) {
  const hasAudio = lines.some((line) => Boolean(line.audioUrl));
  const [started, setStarted] = useState(!hasAudio);
  const [index, setIndex] = useState(!hasAudio && lines.length > 0 ? 0 : -1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const line = lines[index];
    if (!line) return;
    let timer = 0;
    const advance = () => {
      if (index < lines.length - 1) setIndex(index + 1);
    };
    if (line.audioUrl) {
      const audio = new Audio(line.audioUrl);
      audioRef.current?.pause();
      audioRef.current = audio;
      audio.onended = advance;
      audio.onerror = () => {
        timer = window.setTimeout(advance, line.durationMs);
      };
      void playAudio(audio).catch(() => {
        timer = window.setTimeout(advance, line.durationMs);
      });
    } else timer = window.setTimeout(advance, line.durationMs);
    return () => {
      window.clearTimeout(timer);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [index, lines]);

  if (lines.length === 0) return null;
  return (
    <section
      className="bless-credits"
      aria-label={uiCopy.blessClosingCredits.label}
    >
      {!started && (
        <button
          className="bless-credits-start"
          type="button"
          onClick={() => {
            setStarted(true);
            setIndex(0);
          }}
        >
          <span aria-hidden="true">▶</span>
          {uiCopy.blessClosingCredits.play}
        </button>
      )}
      <div
        className="bless-credits-track"
        style={{
          transform: `translateY(calc(42% - ${Math.max(index, 0) * 4.8}rem))`,
        }}
        aria-live="polite"
      >
        {lines.map((line, lineIndex) => (
          <p
            className={lineIndex === index ? "is-active" : ""}
            key={`${lineIndex}:${line.text}`}
          >
            {line.text}
          </p>
        ))}
      </div>
    </section>
  );
}
