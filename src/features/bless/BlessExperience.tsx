import { useCallback, useEffect, useRef, useState } from "react";
import type { Blessing } from "../../domain/bless/types";
import { playAudio } from "../../shared/media/play-audio";
import { BlessClosingCredits } from "./BlessClosingCredits";
import { useBlessCanvas } from "./canvas-engine";

interface BlessExperienceProps {
  blessing: Blessing;
  returnTo: string | null;
}

export function BlessExperience({ blessing, returnTo }: BlessExperienceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const { formText, releaseText } = useBlessCanvas(canvasRef);

  const stopAudio = useCallback(() => {
    bgmRef.current?.pause();
    voiceRef.current?.pause();
    bgmRef.current = null;
    voiceRef.current = null;
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
    if (!started) return;
    let cancelled = false;
    const timers = new Set<number>();
    const wait = (durationMs: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, durationMs);
        timers.add(timer);
      });
    const playVoice = (audioUrl?: string) => {
      voiceRef.current?.pause();
      voiceRef.current = null;
      if (!audioUrl) return;
      const voice = new Audio(audioUrl);
      voiceRef.current = voice;
      void playAudio(voice).catch(() => undefined);
    };

    const runNarrative = async () => {
      await wait(800);
      for (let index = 0; index < blessing.phrases.length; index += 1) {
        if (cancelled) return;
        const phrase = blessing.phrases[index];
        playVoice(phrase.audioUrl);
        formText(phrase.text);
        await wait(phrase.durationMs);
        if (cancelled) return;
        if (index === blessing.phrases.length - 1) {
          setShowFinal(true);
          return;
        }
        releaseText();
        await wait(1_500);
      }
      if (!cancelled) setShowFinal(true);
    };
    void runNarrative();
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [blessing.phrases, formText, releaseText, started]);

  const startNarrative = () => {
    if (blessing.phrases.length === 0) return;
    setStarted(true);
    if (!blessing.mainAudioUrl || bgmRef.current) return;
    const bgm = new Audio(blessing.mainAudioUrl);
    bgm.loop = true;
    bgm.volume = 0.15;
    bgmRef.current = bgm;
    void playAudio(bgm)
      .then(() => setBgmPlaying(!bgm.paused))
      .catch(() => setBgmPlaying(false));
  };

  const toggleBgm = () => {
    const bgm = bgmRef.current;
    if (!bgm) return;
    if (bgmPlaying) {
      bgm.pause();
      setBgmPlaying(false);
    } else {
      void playAudio(bgm)
        .then(() => setBgmPlaying(!bgm.paused))
        .catch(() => setBgmPlaying(false));
    }
  };

  return (
    <main className="bless-page">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="bless-space-overlay" aria-hidden="true" />

      {!started && (
        <div className="bless-overlay">
          <button
            className="bless-start"
            type="button"
            onClick={startNarrative}
          >
            <span aria-hidden="true">✦</span>
            <strong>{blessing.title || "点此 进入属于你的璀璨星空"}</strong>
            <span aria-hidden="true">✦</span>
          </button>
        </div>
      )}

      {showFinal && <BlessClosingCredits lines={blessing.closingLines} />}

      {returnTo && (
        <a
          className="bless-return"
          href={returnTo}
          title="返回"
          aria-label="返回冒险"
          onClick={stopAudio}
        >
          ‹
        </a>
      )}

      {started && blessing.mainAudioUrl && (
        <button
          className={`bless-audio ${bgmPlaying ? "is-playing" : ""}`}
          type="button"
          aria-label={bgmPlaying ? "暂停背景音乐" : "播放背景音乐"}
          onClick={toggleBgm}
        >
          {bgmPlaying ? "Ⅱ" : "♪"}
        </button>
      )}
    </main>
  );
}
