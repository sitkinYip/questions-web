import { useEffect, useRef, useState } from "react";
import type {
  MultiQuestClue,
  QuestClue,
  QuestFinalDestination,
  QuestRank,
} from "@/domain/quest/types";
import type { MediaViewerState } from "@/features/media/MediaViewer";

export type PresentationStep =
  | { type: "clue"; clue: QuestClue }
  | { type: "completion"; variant: "multi" | "final" }
  | { type: "combination"; clue: MultiQuestClue }
  | { type: "destination"; destination: QuestFinalDestination }
  | { type: "advance"; index: number; delay: number }
  | { type: "rank"; rank: QuestRank };

/** Display sequencing only. The server has already judged and settled answers. */
export function useGamePresentation(onAdvance: (index: number) => void) {
  const [media, setMedia] = useState<MediaViewerState>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [textClue, setTextClue] = useState<QuestClue | null>(null);
  const [completion, setCompletion] = useState<"multi" | "final" | null>(null);
  const [combination, setCombination] = useState<MultiQuestClue | null>(null);
  const [destination, setDestination] = useState<QuestFinalDestination | null>(
    null,
  );
  const [rank, setRank] = useState<QuestRank | null>(null);
  const queue = useRef<PresentationStep[]>([]);
  const timer = useRef<number | null>(null);
  const navigate = useRef(onAdvance);
  useEffect(() => {
    navigate.current = onAdvance;
  }, [onAdvance]);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  function next() {
    const step = queue.current.shift();
    if (!step) return;
    switch (step.type) {
      case "clue":
        if (step.clue.kind === "text") {
          setTextClue(step.clue);
          return;
        }
        if (step.clue.kind === "image" && step.clue.imageUrls.length) {
          setMedia({ type: "images", urls: step.clue.imageUrls, index: 0 });
          return;
        }
        if (step.clue.kind === "video" && step.clue.url) {
          setMedia({ type: "video", url: step.clue.url });
          return;
        }
        next();
        return;
      case "completion":
        setCompletion(step.variant);
        return;
      case "combination":
        setCombination(step.clue);
        return;
      case "destination":
        setDestination(step.destination);
        return;
      case "rank":
        setRank(step.rank);
        return;
      case "advance":
        if (step.delay) {
          timer.current = window.setTimeout(() => {
            timer.current = null;
            navigate.current(step.index);
            next();
          }, step.delay);
        } else {
          navigate.current(step.index);
          next();
        }
    }
  }
  function reset() {
    queue.current = [];
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setMedia(null);
    setVideoPlaying(false);
    setTextClue(null);
    setCompletion(null);
    setCombination(null);
    setDestination(null);
    setRank(null);
  }
  function start(steps: PresentationStep[]) {
    reset();
    queue.current = steps;
    next();
  }
  function closeMedia(ended = false) {
    // Closing a video early used to cancel auto-next; only its ended event advances.
    if (media?.type === "video" && !ended)
      queue.current = queue.current.filter((step) => step.type !== "advance");
    setMedia(null);
    setVideoPlaying(false);
    next();
  }
  return {
    media,
    videoPlaying,
    setVideoPlaying,
    textClue,
    completion,
    combination,
    destination,
    rank,
    busy: Boolean(
      media || textClue || completion || combination || destination || rank,
    ),
    start,
    reset,
    openImages: (urls: readonly string[], index = 0) => {
      if (urls.length) {
        setVideoPlaying(false);
        setMedia({
          type: "images",
          urls,
          index: Math.min(Math.max(0, index), urls.length - 1),
        });
      }
    },
    openVideo: (url: string, poster?: string) => {
      setVideoPlaying(false);
      setMedia({ type: "video", url, poster });
    },
    openText: setTextClue,
    openCombination: setCombination,
    changeImageIndex: (index: number) =>
      setMedia((current) =>
        current?.type === "images" ? { ...current, index } : current,
      ),
    closeMedia: () => closeMedia(),
    videoEnded: () => closeMedia(true),
    closeText: () => {
      setTextClue(null);
      next();
    },
    continueCompletion: () => {
      setCompletion(null);
      next();
    },
    closeCombination: () => {
      setCombination(null);
      next();
    },
    closeDestination: () => {
      setDestination(null);
      next();
    },
    closeRank: () => {
      setRank(null);
      next();
    },
  };
}
