import {
  answerPresentationSteps,
  startPresentationSteps,
  resolveLevelPresentation,
} from "./session-presentation";
import { GamePlayScene } from "./GamePlayScene";
import { uiCopy } from "@/config/ui-copy";
import { GameRetryDialog } from "@/features/game/components/GameRequestFeedback";
import { createRequestId } from "@/shared/request-id";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  gameApi,
  isFatalGameError,
  isRetryableGameError,
} from "@/api/game.client";
import type { GameAssignment } from "@/api/game.contracts";
import type { QuestAvailability, QuestClue } from "@/domain/quest/types";
import { createQuestAnswerGuideRepository } from "@/infrastructure/storage/quest-guide.repository";
import { createNarrativeAttentionRepository } from "@/infrastructure/storage/narrative-attention.repository";
import { useQuestBgm } from "@/features/audio/useQuestBgm";
import { GameFailure, GameHeader } from "@/features/game/GameContext";
import { GameNotificationCenter } from "@/features/game/GameNotificationCenter";
import { useGame } from "@/features/game/useGame";
import { useGamePresentation } from "@/features/game/useGamePresentation";
import { useHorizontalSwipe } from "@/shared/gestures/useHorizontalSwipe";
import { useQuestNavigationPosition } from "@/features/quest/useQuestNavigationPosition";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";
import { GameLoadingScreen } from "@/features/game/components/GameLoadingScreen";
import {
  combinationView,
  selectClueViews,
  selectCombinationClues,
} from "@/features/game/clue-presentation";

export function GamePlayPage() {
  const { id = "" } = useParams(),
    { player } = useGame();
  const query = useQuery({
    queryKey: ["game", player.id, "assignment", id],
    queryFn: ({ signal }) => gameApi.assignment(id, signal),
    refetchInterval: 5000,
  });
  if (query.isPending) return <GameLoadingScreen scene="journey" />;
  if (query.isError && (!query.data || isFatalGameError(query.error)))
    return (
      <main className="game-shell">
        <GameHeader />
        <GameFailure error={query.error} retry={() => void query.refetch()} />
      </main>
    );
  return <GamePlayView key={id} assignment={query.data!} />;
}

export function GamePlayView({ assignment }: { assignment: GameAssignment }) {
  const isDesktop = useDesktopLayout();
  const { player, setPlayer } = useGame(),
    client = useQueryClient();
  const [activeIndex, setActiveIndex] = useState(assignment.currentIndex);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<
    "neutral" | "success" | "danger"
  >("neutral");
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackAutoDismiss, setFeedbackAutoDismiss] = useState(false);
  const answerFormRef = useRef<HTMLFormElement | null>(null);
  const guideTimer = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);
  const narrativeAttentionRepository = useMemo(
    () => createNarrativeAttentionRepository(window.localStorage),
    [],
  );
  const [openedNarrativeIds, setOpenedNarrativeIds] = useState(() =>
    narrativeAttentionRepository.load(player.id, assignment.id),
  );
  const [guideSeen, setGuideSeen] = useState(() => {
    try {
      return createQuestAnswerGuideRepository(window.localStorage).hasSeen(
        player.id,
      );
    } catch {
      return false;
    }
  });
  const [highlightAnswerForm, setHighlightAnswerForm] = useState(false);
  function clearFeedback() {
    if (feedbackTimer.current !== null) {
      window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    }
    setFeedback("");
    setFeedbackTone("neutral");
    setFeedbackAutoDismiss(false);
  }
  function showFeedback(
    message: string,
    tone: "neutral" | "success" | "danger",
    dismissAfterMs?: number,
  ) {
    if (feedbackTimer.current !== null)
      window.clearTimeout(feedbackTimer.current);
    setFeedback(message);
    setFeedbackTone(tone);
    setFeedbackKey((current) => current + 1);
    setFeedbackAutoDismiss(Boolean(dismissAfterMs));
    feedbackTimer.current = dismissAfterMs
      ? window.setTimeout(() => {
          feedbackTimer.current = null;
          setFeedback("");
          setFeedbackTone("neutral");
          setFeedbackAutoDismiss(false);
        }, dismissAfterMs)
      : null;
  }
  function markNarrativeOpened(clue: QuestClue) {
    if (clue.kind !== "letter" && clue.kind !== "bless") return;
    narrativeAttentionRepository.markOpened(player.id, assignment.id, clue.id);
    setOpenedNarrativeIds((current) => new Set(current).add(clue.id));
  }
  function closeAnswerGuide(locate = false) {
    setGuideSeen(true);
    try {
      createQuestAnswerGuideRepository(window.localStorage).markSeen(player.id);
    } catch {
      /* UI preference only. */
    }
    if (!locate) return;
    answerFormRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
    setHighlightAnswerForm(true);
    if (guideTimer.current !== null) window.clearTimeout(guideTimer.current);
    guideTimer.current = window.setTimeout(
      () => setHighlightAnswerForm(false),
      2400,
    );
  }
  useEffect(
    () => () => {
      if (guideTimer.current !== null) window.clearTimeout(guideTimer.current);
      if (feedbackTimer.current !== null)
        window.clearTimeout(feedbackTimer.current);
    },
    [],
  );
  const flow = useGamePresentation((index) => {
    setActiveIndex(index);
    clearFeedback();
  });
  const request = useRef<{ answer: string; level: string; key: string } | null>(
    null,
  );
  const [retryAction, setRetryAction] = useState<"answer" | "start" | null>(
    null,
  );
  const [startKey] = useState(createRequestId);
  const [now, setNow] = useState(Date.now);
  const [offset, setOffset] = useState(
    () => Date.parse(assignment.serverTime) - Date.now(),
  );
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const receivedAt = Date.now();
      setOffset(Date.parse(assignment.serverTime) - receivedAt);
      setNow(receivedAt);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [assignment.serverTime]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const step =
    assignment.levels[activeIndex] ||
    assignment.levels[assignment.currentIndex];
  const cardRef = useRef<HTMLElement | null>(null),
    navRef = useRef<HTMLElement | null>(null);
  useQuestNavigationPosition(step?.id || "", cardRef, !isDesktop);
  useEffect(() => {
    const nav = navRef.current,
      active = nav?.querySelector<HTMLButtonElement>(".is-active");
    if (!nav || !active || typeof nav.scrollTo !== "function") return;
    nav.scrollTo({
      left: Math.max(
        0,
        active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2,
      ),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [activeIndex]);
  const content = step?.question,
    override = step?.presentationOverride;
  const { bgmUrl, background } = resolveLevelPresentation(assignment, override);
  const bgm = useQuestBgm(
    bgmUrl || undefined,
    flow.media?.type === "video",
    player.id,
  );
  const combinations = selectCombinationClues(
    assignment.clues,
    assignment.totalLevels,
  ).map(combinationView);
  const retainedCombination = combinations.at(-1);
  const start = useMutation({
    mutationFn: () => gameApi.start(assignment.id, startKey),
    onError: (error) => {
      setRetryAction(isRetryableGameError(error) ? "start" : null);
    },
    onSuccess: (value) => {
      setRetryAction(null);
      client.setQueryData(
        ["game", player.id, "assignment", assignment.id],
        value,
      );
      flow.start(startPresentationSteps(assignment, value));
    },
  });
  const submit = useMutation({
    mutationFn: (original?: { answer: string; level: string; key: string }) => {
      if (original)
        return gameApi.answer(
          assignment.id,
          original.level,
          original.answer,
          original.key,
        );
      const answer = answers[step.id] ?? step.lastAnswer;
      if (
        !request.current ||
        request.current.level !== step.id ||
        request.current.answer !== answer
      )
        request.current = { level: step.id, answer, key: createRequestId() };
      return gameApi.answer(
        assignment.id,
        step.id,
        answer,
        request.current.key,
      );
    },
    onSuccess: (result) => {
      setRetryAction(null);
      request.current = null;
      client.setQueryData(
        ["game", player.id, "assignment", assignment.id],
        result.assignment,
      );
      setPlayer(result.player);
      if (result.result === "incorrect") {
        const attempt = result.assignment.levels.find(
          (level) => level.id === step.id,
        );
        showFeedback(
          attempt?.locked
            ? uiCopy.gamePlayPage.locked
            : attempt?.cooldownUntil
              ? uiCopy.gamePlayPage.penalty
              : uiCopy.gamePlayPage.incorrect,
          "danger",
          3000,
        );
        return;
      }
      if (result.result === "already_completed") return;
      const settled = result.assignment;
      const completed = settled.status === "completed";
      showFeedback(
        completed
          ? uiCopy.gamePlayPage.allCompleted
          : uiCopy.gamePlayPage.correct,
        "success",
      );
      const sequence = answerPresentationSteps(
        assignment,
        settled,
        step.id,
        result.effects,
      );
      if (result.player.level.order > player.level.order)
        sequence.push({
          type: "rank",
          rank: {
            code: String(result.player.level.order),
            name: result.player.level.name,
            isSpecial: false,
            numericValue: result.player.level.order,
          },
        });
      flow.start(sequence);
      void client.invalidateQueries({
        queryKey: ["game", player.id, "rewards"],
      });
    },
    onError: (error) => {
      if (isRetryableGameError(error)) setRetryAction("answer");
      else {
        setRetryAction(null);
        showFeedback(error.message, "danger");
      }
      void client.invalidateQueries({
        queryKey: ["game", player.id, "assignment", assignment.id],
      });
    },
  });
  const serverNow = now + offset;
  const expired = Boolean(
    assignment.endsAt && Date.parse(assignment.endsAt) <= serverNow,
  );
  const waiting = Boolean(
    assignment.startsAt && Date.parse(assignment.startsAt) > serverNow,
  );
  const cooling = Boolean(
    step?.cooldownUntil && Date.parse(step.cooldownUntil) > serverNow,
  );
  const availability: QuestAvailability = waiting
    ? { status: "not-started", startsAt: Date.parse(assignment.startsAt) }
    : expired
      ? { status: "ended", endedAt: Date.parse(assignment.endsAt) }
      : { status: "available" };
  const moveTo = (index: number) => {
    if (!assignment.levels[index]?.question || submit.isPending) return;
    flow.reset();
    setActiveIndex(index);
    clearFeedback();
    submit.reset();
  };
  const swipe = useHorizontalSwipe({
    disabled: submit.isPending || flow.busy,
    onSwipeLeft: () => moveTo(activeIndex + 1),
    onSwipeRight: () => moveTo(activeIndex - 1),
  });
  const updateQuestSpotlight = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--spotlight-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--spotlight-y",
      `${event.clientY - bounds.top}px`,
    );
    event.currentTarget.style.setProperty("--spotlight-opacity", "1");
  };
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!(answers[step.id] ?? step.lastAnswer).trim()) {
      showFeedback(uiCopy.gamePlayPage.emptyAnswer, "danger", 3000);
      return;
    }
    if (
      submit.isPending ||
      step.completedAt ||
      step.locked ||
      cooling ||
      expired ||
      waiting ||
      assignment.status !== "active"
    )
      return;
    submit.mutate();
  }
  const workspaceClues = selectClueViews(assignment.clues, {
    assignmentId: assignment.id,
    totalLevels: assignment.totalLevels,
    levelOrder: assignment.levels.map((level) => level.id),
  });
  const attentionClueIds = new Set(
    workspaceClues
      .filter(
        (clue) =>
          (clue.kind === "letter" || clue.kind === "bless") &&
          !openedNarrativeIds.has(clue.id),
      )
      .map((clue) => clue.id),
  );
  const activeClues = step
    ? selectClueViews(assignment.clues, {
        assignmentId: assignment.id,
        totalLevels: assignment.totalLevels,
        sessionLevel: step.id,
        levelOrder: assignment.levels.map((level) => level.id),
      })
    : [];
  const activeClueIds = new Set(activeClues.map((clue) => clue.id));
  const nextNarrativeAttention = workspaceClues.find(
    (clue) => attentionClueIds.has(clue.id) && !activeClueIds.has(clue.id),
  );
  return (
    <GamePlayScene
      assignment={assignment}
      activeIndex={activeIndex}
      isDesktop={isDesktop}
      background={background}
      card={
        content
          ? {
              activeQuest: {
                id: step.id,
                kind: content.kind,
                title:
                  (override?.hideTitle ?? assignment.presentation.hideTitle)
                    ? undefined
                    : content.title,
                prompt: content.content[0]?.text || "",
                content: content.content,
                options: content.options,
                answerPlaceholder: content.placeholder,
                clues: activeClues,
              },
              activeAttempt: {
                status: step.completedAt
                  ? "completed"
                  : step.locked || step.cooldownUntil
                    ? "penalized"
                    : step.wrongCount
                      ? "incorrect"
                      : "unanswered",
                penaltyEndsAt: step.locked
                  ? -1
                  : step.cooldownUntil
                    ? Date.parse(step.cooldownUntil)
                    : null,
              },
              activeQuestionNumber: activeIndex + 1,
              questCardRef: cardRef,
              answerFormRef: answerFormRef,
              swipeHandlers: swipe,
              updateQuestSpotlight: updateQuestSpotlight,
              hideQuestSpotlight: (event) =>
                event.currentTarget.style.setProperty(
                  "--spotlight-opacity",
                  "0",
                ),
              availability: availability,
              highlightAnswerForm: highlightAnswerForm,
              handleSubmit: onSubmit,
              answer: answers[step.id] ?? step.lastAnswer,
              setAnswer: (value) => {
                closeAnswerGuide();
                if (feedback && feedbackTone !== "success") clearFeedback();
                setAnswers((previous) => ({ ...previous, [step.id]: value }));
              },
              isPermanentlyLocked: step.locked,
              isTemporarilyLocked: cooling,
              now: serverNow,
              pending: submit.isPending,
              canMoveNext:
                !!step.completedAt &&
                !!assignment.levels[activeIndex + 1]?.question,
              nextIndex: activeIndex + 1,
              moveTo: moveTo,
              feedback: feedback,
              feedbackTone: feedbackTone,
              feedbackKey: feedbackKey,
              feedbackAutoDismiss: feedbackAutoDismiss,
              attentionClueIds: attentionClueIds,
              openImages: flow.openImages,
              openVideo: flow.openVideo,
              setTextClue: flow.openText,
              onClueOpen: markNarrativeOpened,
            }
          : null
      }
      flow={flow}
      bgm={bgm}
      navRef={navRef}
      moveTo={moveTo}
      pending={submit.isPending}
      workspaceClues={workspaceClues}
      attentionClueIds={attentionClueIds}
      markNarrativeOpened={markNarrativeOpened}
      nextNarrativeAttention={nextNarrativeAttention}
      retainedCombination={retainedCombination}
      guideSeen={guideSeen}
      closeAnswerGuide={closeAnswerGuide}
      header={
        <GameHeader
          progress={{
            completed: assignment.completedLevels,
            total: assignment.totalLevels,
          }}
        />
      }
      brief={{
        rank: player.level.order,
        now: serverNow,
        pending: start.isPending,
        error: isRetryableGameError(start.error) ? null : start.error,
        onStart: () => start.mutate(),
      }}
      retry={
        <GameRetryDialog
          open={retryAction !== null}
          action={retryAction ?? "answer"}
          pending={submit.isPending || start.isPending}
          onDismiss={() => setRetryAction(null)}
          onRetry={() => {
            if (retryAction === "start") start.mutate();
            else submit.mutate(request.current ?? undefined);
          }}
        />
      }
      notifications={
        <GameNotificationCenter
          blocked={flow.busy}
          onOpenImages={flow.openImages}
          onOpenVideo={flow.openVideo}
        />
      }
    />
  );
}
