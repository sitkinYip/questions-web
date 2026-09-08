import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackAnalytics } from "@/infrastructure/analytics";
import { createBgmPreferencesRepository } from "@/infrastructure/storage/audio.repository";
import { playAudio } from "@/shared/media/play-audio";

const AUTH_HINT_DURATION_MS = 5_000;
const DEFAULT_VOLUME = 0.3;

export function useQuestBgm(
  audioUrl: string | undefined,
  suspended: boolean,
  userId = "",
) {
  const repository = useMemo(
    () => createBgmPreferencesRepository(window.localStorage),
    [],
  );
  const initialEnabled = useMemo(() => repository.load().enabled, [repository]);
  const desiredPlayingRef = useRef(initialEnabled);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const previousSuspendedRef = useRef(suspended);
  const suspendedRef = useRef(suspended);
  const playReasonRef = useRef<"automatic" | "user" | "media">("automatic");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAuthHint, setShowAuthHint] = useState(false);

  const clearHintTimer = useCallback(() => {
    if (hintTimerRef.current === null) return;
    window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = null;
  }, []);

  const hideAuthHint = useCallback(() => {
    clearHintTimer();
    setShowAuthHint(false);
  }, [clearHintTimer]);

  const requestPlay = useCallback(
    (reason: "automatic" | "user" | "media") => {
      const audio = audioRef.current;
      if (!audio || suspendedRef.current) return;
      playReasonRef.current = reason;
      void playAudio(audio).catch(() => {
        if (
          audioRef.current !== audio ||
          suspendedRef.current ||
          !desiredPlayingRef.current
        )
          return;
        trackAnalytics(
          {
            name: "bgm_state",
            state: "authorization_blocked",
            reason,
            audioUrl,
          },
          userId,
        );
        setShowAuthHint(true);
        clearHintTimer();
        hintTimerRef.current = window.setTimeout(() => {
          setShowAuthHint(false);
          hintTimerRef.current = null;
        }, AUTH_HINT_DURATION_MS);
      });
    },
    [audioUrl, clearHintTimer, userId],
  );

  useEffect(() => {
    suspendedRef.current = suspended;
  }, [suspended]);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = DEFAULT_VOLUME;
    audio.preload = "auto";
    const handlePlay = () => {
      setIsPlaying(true);
      trackAnalytics(
        {
          name: "bgm_state",
          state: "playing",
          reason: playReasonRef.current,
          audioUrl,
        },
        userId,
      );
      hideAuthHint();
    };
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audioRef.current = audio;
    if (desiredPlayingRef.current && !suspendedRef.current)
      requestPlay("automatic");

    return () => {
      audio.pause();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      if (audioRef.current === audio) audioRef.current = null;
      clearHintTimer();
    };
  }, [audioUrl, clearHintTimer, hideAuthHint, requestPlay, userId]);

  useEffect(() => {
    if (previousSuspendedRef.current === suspended) return;
    previousSuspendedRef.current = suspended;
    if (suspended) {
      if (audioRef.current && !audioRef.current.paused) {
        trackAnalytics(
          {
            name: "bgm_state",
            state: "paused",
            reason: "media",
            audioUrl,
          },
          userId,
        );
      }
      audioRef.current?.pause();
    } else if (desiredPlayingRef.current) requestPlay("media");
  }, [audioUrl, requestPlay, suspended, userId]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      desiredPlayingRef.current = false;
      try {
        repository.save({ enabled: false });
      } catch {
        // Playback control still works if persistence is unavailable.
      }
      hideAuthHint();
      trackAnalytics(
        {
          name: "bgm_state",
          state: "paused",
          reason: "user",
          audioUrl,
        },
        userId,
      );
      audioRef.current?.pause();
      return;
    }
    desiredPlayingRef.current = true;
    try {
      repository.save({ enabled: true });
    } catch {
      // Playback control still works if persistence is unavailable.
    }
    requestPlay("user");
  }, [audioUrl, hideAuthHint, isPlaying, repository, requestPlay, userId]);

  return {
    hasBgm: Boolean(audioUrl),
    isPlaying,
    showAuthHint: showAuthHint && !suspended,
    toggle,
    authorize: () => requestPlay("user"),
    dismissAuthHint: hideAuthHint,
  };
}
