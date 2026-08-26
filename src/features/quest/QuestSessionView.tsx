import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createSessionFromSelection } from "../../application/quest/create-session";
import {
  EnergyBurst,
  QuestAtmosphere,
} from "../../components/effects/QuestAtmosphere";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/FormControls";
import { normalizeAnswer } from "../../domain/quest/answer";
import {
  activateQuest,
  canActivateQuest,
  getCompletionTransition,
  getQuestAvailability,
  submitAnswer,
} from "../../domain/quest/session";
import { extractHighestRank } from "../../domain/quest/rank";
import type {
  MultiQuestClue,
  Quest,
  QuestClue,
  QuestFinalDestination,
  QuestRank,
  QuestSession,
} from "../../domain/quest/types";
import {
  trackAnalytics,
  trackAnalyticsOnce,
} from "../../infrastructure/analytics";
import { createProgressRepository } from "../../infrastructure/storage/progress.repository";
import { createRankRepository } from "../../infrastructure/storage/rank.repository";
import { CluePanel } from "../clues/CluePanel";
import { ClueTextDialog } from "../clues/ClueTextDialog";
import { MultiQuestClueDialog } from "../clues/MultiQuestClueDialog";
import { CompletionFeedbackDialog } from "../completion/CompletionFeedbackDialog";
import { FinalDestinationPrompt } from "../completion/FinalDestinationPrompt";
import { ChoiceOptions } from "../media/ChoiceOptions";
import { MediaViewer, type MediaViewerState } from "../media/MediaViewer";
import { QuestContent } from "../media/QuestContent";
import { NotificationCenter } from "../notification/NotificationCenter";
import { RankUpDialog } from "../rank/RankUpDialog";
import { BgmControls } from "../audio/BgmControls";
import { useQuestBgm } from "../audio/useQuestBgm";
import { useHorizontalSwipe } from "../../shared/gestures/useHorizontalSwipe";

interface QuestSessionViewProps {
  allQuests: readonly Quest[];
  requestedSteps: readonly number[];
  userId: string;
  missingSteps: readonly number[];
  multiQuestClue?: MultiQuestClue | null;
}

type FlowAction =
  | { type: "advance"; targetIndex: number }
  | { type: "show-multi-completion" }
  | {
      type: "finish-final";
      destination: QuestFinalDestination | null;
      revealCombination: boolean;
    };

type PendingFlow = {
  waitFor: "text" | "image" | "video";
  action: FlowAction;
};

type FinalSequence = {
  automaticClue?: QuestClue & { kind: "text" | "image" | "video" };
  action: Extract<FlowAction, { type: "finish-final" }>;
};

function formatRemaining(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function feedbackForBlocked(reason: "not-started" | "ended" | "penalized") {
  if (reason === "not-started") return "冒险尚未开始，请耐心等待。";
  if (reason === "ended") return "本次冒险已经结束。";
  return "当前仍在惩罚时间内，暂时无法再次作答。";
}

function analyticsProgress(session: QuestSession) {
  return {
    activeStep: session.quests[session.activeIndex].step,
    completed: session.quests.filter(
      (quest) => session.attempts[quest.id].status === "completed",
    ).length,
    total: session.quests.length,
    sessionStatus: session.status,
  } as const;
}

export function QuestSessionView({
  allQuests,
  requestedSteps,
  userId,
  missingSteps,
  multiQuestClue = null,
}: QuestSessionViewProps) {
  const repository = useMemo(
    () => createProgressRepository(window.localStorage),
    [],
  );
  const rankRepository = useMemo(
    () => createRankRepository(window.localStorage),
    [],
  );
  const [session, setSession] = useState<QuestSession>(() => {
    const result = createSessionFromSelection({
      allQuests,
      requestedSteps,
      userId,
      restore: repository.load,
    });
    if (!result.session) throw new Error("无法创建空的答题会话");
    return result.session;
  });
  const activeQuest = session.quests[session.activeIndex];
  const activeAttempt = session.attempts[activeQuest.id];
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      session.quests.map((quest) => [
        quest.id,
        session.attempts[quest.id].input,
      ]),
    ),
  );
  const answer = answers[activeQuest.id] ?? activeAttempt.input;
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<
    "neutral" | "success" | "danger"
  >("neutral");
  const [now, setNow] = useState(() => Date.now());
  const [mediaViewer, setMediaViewer] = useState<MediaViewerState>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [textClue, setTextClue] = useState<QuestClue | null>(null);
  const [isMultiClueOpen, setIsMultiClueOpen] = useState(false);
  const [completionFeedback, setCompletionFeedback] = useState<
    "final" | "multi" | null
  >(null);
  const [finalDestination, setFinalDestination] =
    useState<QuestFinalDestination | null>(null);
  const [rankUp, setRankUp] = useState<QuestRank | null>(null);
  const pendingFlowRef = useRef<PendingFlow | null>(null);
  const finalSequenceRef = useRef<FinalSequence | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const rankTimerRef = useRef<number | null>(null);
  const uiBusyRef = useRef(false);
  const questCardRef = useRef<HTMLElement>(null);
  const questNavRef = useRef<HTMLElement>(null);
  const activeNavItemRef = useRef<HTMLButtonElement>(null);
  const previousQuestIdRef = useRef(activeQuest.id);

  const upgradeCandidate = useMemo(
    () => extractHighestRank(session.quests),
    [session.quests],
  );
  const displayedRank = upgradeCandidate ?? activeQuest.rank;
  const isUiBusy = Boolean(
    mediaViewer || textClue || isMultiClueOpen || completionFeedback,
  );
  const bgm = useQuestBgm(
    session.quests[0]?.mainAudioUrl,
    mediaViewer?.type === "video",
    userId,
  );

  useEffect(() => {
    trackAnalyticsOnce(
      `session:${session.sessionId}`,
      {
        name: "session_viewed",
        mode: session.quests.length > 1 ? "multiple" : "single",
        steps: session.quests.map((quest) => quest.step),
        progress: analyticsProgress(session),
      },
      userId,
    );
  }, [session, userId]);

  useEffect(() => {
    trackAnalyticsOnce(
      `quest:${session.sessionId}:${activeQuest.id}`,
      {
        name: "quest_viewed",
        questId: activeQuest.id,
        step: activeQuest.step,
        title: activeQuest.title,
        question: activeQuest.prompt,
        kind: activeQuest.kind,
        mode: session.quests.length > 1 ? "multiple" : "single",
        attemptStatus: activeAttempt.status,
        progress: analyticsProgress(session),
      },
      userId,
    );
  }, [activeAttempt.status, activeQuest, session, userId]);

  useEffect(() => {
    uiBusyRef.current = isUiBusy;
  }, [isUiBusy]);

  useEffect(() => {
    if (previousQuestIdRef.current !== activeQuest.id) {
      questCardRef.current?.focus();
      previousQuestIdRef.current = activeQuest.id;
    }
  }, [activeQuest.id]);

  useEffect(() => {
    const nav = questNavRef.current;
    const item = activeNavItemRef.current;
    if (!nav || !item || typeof nav.scrollTo !== "function") return;
    const left = item.offsetLeft - (nav.clientWidth - item.offsetWidth) / 2;
    nav.scrollTo({
      left: Math.max(0, left),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [session.activeIndex]);

  useEffect(
    () => () => {
      if (autoAdvanceTimerRef.current !== null) {
        window.clearTimeout(autoAdvanceTimerRef.current);
      }
      if (rankTimerRef.current !== null)
        window.clearTimeout(rankTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!upgradeCandidate) return;
    try {
      if (rankRepository.hasShown(userId, upgradeCandidate.code)) return;
    } catch {
      // Storage may be unavailable; the feedback can still be shown this session.
    }
    let cancelled = false;
    const tryShow = () => {
      if (cancelled) return;
      if (uiBusyRef.current) {
        rankTimerRef.current = window.setTimeout(tryShow, 500);
        return;
      }
      try {
        rankRepository.markShown(userId, upgradeCandidate.code);
      } catch {
        // A failed marker only means the feedback may appear again after refresh.
      }
      setRankUp(upgradeCandidate);
      rankTimerRef.current = null;
    };
    rankTimerRef.current = window.setTimeout(tryShow, 1_500);
    return () => {
      cancelled = true;
      if (rankTimerRef.current !== null) {
        window.clearTimeout(rankTimerRef.current);
        rankTimerRef.current = null;
      }
    };
  }, [rankRepository, upgradeCandidate, userId]);

  useEffect(() => {
    if (!activeAttempt.penaltyEndsAt || activeAttempt.penaltyEndsAt === -1)
      return;
    const expiresAt = activeAttempt.penaltyEndsAt;
    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= expiresAt) window.clearInterval(timer);
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [activeAttempt.penaltyEndsAt]);

  const availability = getQuestAvailability(activeQuest, now);
  const isPermanentlyLocked = activeAttempt.penaltyEndsAt === -1;
  const isTemporarilyLocked =
    activeAttempt.penaltyEndsAt !== null && activeAttempt.penaltyEndsAt > now;
  const completedCount = session.quests.filter(
    (quest) => session.attempts[quest.id].status === "completed",
  ).length;

  const moveTo = (index: number) => {
    if (!canActivateQuest(session, index)) return;
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    pendingFlowRef.current = null;
    setSession((current) => activateQuest(current, index));
    setFeedback("");
    setFeedbackTone("neutral");
    setMediaViewer(null);
    setIsVideoPlaying(false);
    setTextClue(null);
  };

  const openImages = useCallback(
    (urls: readonly string[], index = 0) => {
      if (urls.length === 0) return;
      trackAnalytics(
        {
          name: "media_opened",
          kind: "image",
          source: "session",
          count: urls.length,
          step: activeQuest.step,
          title: activeQuest.title,
          urls,
        },
        userId,
      );
      setMediaViewer({
        type: "images",
        urls,
        index: Math.min(Math.max(index, 0), urls.length - 1),
      });
      setIsVideoPlaying(false);
    },
    [activeQuest.step, activeQuest.title, userId],
  );

  const openVideo = useCallback(
    (url: string, poster?: string) => {
      trackAnalytics(
        {
          name: "media_opened",
          kind: "video",
          source: "session",
          count: 1,
          step: activeQuest.step,
          title: activeQuest.title,
          urls: [url],
          poster,
        },
        userId,
      );
      setMediaViewer({ type: "video", url, poster });
      setIsVideoPlaying(false);
    },
    [activeQuest.step, activeQuest.title, userId],
  );

  const runFlowAction = useCallback((action: FlowAction) => {
    if (action.type === "advance") {
      const targetIndex = action.targetIndex;
      setSession((current) => activateQuest(current, targetIndex));
      setFeedback("");
      setFeedbackTone("neutral");
      return;
    }
    if (action.type === "show-multi-completion") {
      setCompletionFeedback("multi");
      return;
    }
    if (action.revealCombination) setIsMultiClueOpen(true);
    if (action.destination) setFinalDestination(action.destination);
  }, []);

  const finishPendingFlow = useCallback(() => {
    const pending = pendingFlowRef.current;
    pendingFlowRef.current = null;
    if (pending) runFlowAction(pending.action);
  }, [runFlowAction]);

  const closeMediaViewer = useCallback(() => {
    const viewerType = mediaViewer?.type;
    setMediaViewer(null);
    setIsVideoPlaying(false);
    const pending = pendingFlowRef.current;
    if (!pending) return;
    if (viewerType === "images" && pending.waitFor === "image") {
      finishPendingFlow();
    } else if (viewerType === "video" && pending.waitFor === "video") {
      if (pending.action.type === "advance") pendingFlowRef.current = null;
      else finishPendingFlow();
    }
  }, [finishPendingFlow, mediaViewer?.type]);

  const handleVideoEnded = useCallback(() => {
    setMediaViewer(null);
    setIsVideoPlaying(false);
    if (pendingFlowRef.current?.waitFor === "video") finishPendingFlow();
  }, [finishPendingFlow]);

  const closeTextClue = useCallback(() => {
    setTextClue(null);
    if (pendingFlowRef.current?.waitFor === "text") finishPendingFlow();
  }, [finishPendingFlow]);

  const changeImageIndex = useCallback((index: number) => {
    setMediaViewer((current) =>
      current?.type === "images" ? { ...current, index } : current,
    );
  }, []);

  const setAnswer = (value: string) => {
    setAnswers((current) => ({ ...current, [activeQuest.id]: value }));
  };

  const firstAutomaticClue = (quest: Quest) =>
    quest.clues.find(
      (item): item is QuestClue & { kind: "text" | "image" | "video" } =>
        item.autoPlay &&
        (item.kind === "text" ||
          item.kind === "image" ||
          item.kind === "video"),
    );

  const playAutomaticClue = (clue: QuestClue) => {
    trackAnalytics(
      {
        name: "clue_opened",
        clueId: clue.id,
        kind: clue.kind,
        step: activeQuest.step,
        title: clue.title,
        content: clue.content,
        urls: [
          ...clue.imageUrls,
          ...(clue.url ? [clue.url] : []),
          ...(clue.href ? [clue.href] : []),
        ],
        automatic: true,
      },
      userId,
    );
    if (clue.kind === "text") setTextClue(clue);
    if (clue.kind === "image") openImages(clue.imageUrls);
    if (clue.kind === "video" && clue.url) openVideo(clue.url);
  };

  const handleCompletionContinue = () => {
    const variant = completionFeedback;
    setCompletionFeedback(null);
    if (variant === "multi") {
      if (multiQuestClue) setIsMultiClueOpen(true);
      return;
    }
    const sequence = finalSequenceRef.current;
    finalSequenceRef.current = null;
    if (!sequence) return;
    if (sequence.automaticClue) {
      pendingFlowRef.current = {
        waitFor: sequence.automaticClue.kind,
        action: sequence.action,
      };
      playAutomaticClue(sequence.automaticClue);
    } else {
      runFlowAction(sequence.action);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim()) {
      trackAnalytics(
        {
          name: "answer_submitted",
          questId: activeQuest.id,
          step: activeQuest.step,
          title: activeQuest.title,
          question: activeQuest.prompt,
          kind: activeQuest.kind,
          answer,
          normalizedAnswer: normalizeAnswer(answer),
          acceptedAnswers: activeQuest.acceptedAnswers,
          options: activeQuest.options.map((option) => ({
            key: option.key,
            ...(option.text ? { text: option.text } : {}),
          })),
          outcome: "empty",
          attemptStatus: activeAttempt.status,
          wrongCount: activeAttempt.wrongCount,
          penaltyEndsAt: activeAttempt.penaltyEndsAt,
          progress: analyticsProgress(session),
        },
        userId,
      );
      setFeedback("请先输入或选择答案。");
      setFeedbackTone("neutral");
      return;
    }

    const result = submitAnswer(session, activeQuest.id, answer);
    if (result.type === "blocked") {
      trackAnalytics(
        {
          name: "answer_submitted",
          questId: activeQuest.id,
          step: activeQuest.step,
          title: activeQuest.title,
          question: activeQuest.prompt,
          kind: activeQuest.kind,
          answer,
          normalizedAnswer: normalizeAnswer(answer),
          acceptedAnswers: activeQuest.acceptedAnswers,
          options: activeQuest.options.map((option) => ({
            key: option.key,
            ...(option.text ? { text: option.text } : {}),
          })),
          outcome: "blocked",
          blockedReason: result.reason,
          attemptStatus: activeAttempt.status,
          wrongCount: activeAttempt.wrongCount,
          penaltyEndsAt: activeAttempt.penaltyEndsAt,
          progress: analyticsProgress(result.session),
        },
        userId,
      );
      setFeedback(feedbackForBlocked(result.reason));
      setFeedbackTone("danger");
      return;
    }

    repository.save(activeQuest, userId, result.attempt);
    trackAnalytics(
      {
        name: "answer_submitted",
        questId: activeQuest.id,
        step: activeQuest.step,
        title: activeQuest.title,
        question: activeQuest.prompt,
        kind: activeQuest.kind,
        answer,
        normalizedAnswer: normalizeAnswer(answer),
        acceptedAnswers: activeQuest.acceptedAnswers,
        options: activeQuest.options.map((option) => ({
          key: option.key,
          ...(option.text ? { text: option.text } : {}),
        })),
        outcome: result.type === "correct" ? "correct" : "incorrect",
        attemptStatus: result.attempt.status,
        wrongCount: result.attempt.wrongCount,
        penaltyEndsAt: result.attempt.penaltyEndsAt,
        progress: analyticsProgress(result.session),
      },
      userId,
    );
    setSession(result.session);
    if (result.type === "correct") {
      setFeedback(
        result.session.status === "completed"
          ? "全部题目已经完成。"
          : "回答正确，当前题目已完成。",
      );
      setFeedbackTone("success");
      const transition = getCompletionTransition(
        result.session,
        activeQuest.id,
      );
      const automaticClue = firstAutomaticClue(activeQuest);
      if (activeQuest.isFinal) {
        finalSequenceRef.current = {
          automaticClue,
          action: {
            type: "finish-final",
            destination: activeQuest.finalDestination ?? null,
            revealCombination:
              result.session.quests.length > 1 && Boolean(multiQuestClue),
          },
        };
        setCompletionFeedback("final");
        return;
      }

      const flowAction: FlowAction | null =
        transition.type === "auto"
          ? { type: "advance", targetIndex: transition.targetIndex }
          : transition.type === "complete" && result.session.quests.length > 1
            ? { type: "show-multi-completion" }
            : null;

      if (automaticClue) {
        if (flowAction) {
          pendingFlowRef.current = {
            waitFor: automaticClue.kind,
            action: flowAction,
          };
        }
        playAutomaticClue(automaticClue);
      } else if (flowAction?.type === "advance") {
        autoAdvanceTimerRef.current = window.setTimeout(() => {
          autoAdvanceTimerRef.current = null;
          setSession((current) =>
            activateQuest(current, flowAction.targetIndex),
          );
          setFeedback("");
          setFeedbackTone("neutral");
        }, 1_500);
      } else if (flowAction) {
        runFlowAction(flowAction);
      }
    } else if (result.attempt.penaltyEndsAt === -1) {
      setFeedback("回答错误，当前题目已永久锁定。请使用记录管理页面处理。");
      setFeedbackTone("danger");
    } else if (result.attempt.penaltyEndsAt) {
      setFeedback("回答错误，已进入惩罚时间。");
      setFeedbackTone("danger");
    } else {
      setFeedback("答案不正确，可以继续尝试。");
      setFeedbackTone("danger");
    }
  };

  const nextIndex = session.activeIndex + 1;
  const canMoveNext =
    activeAttempt.status === "completed" && nextIndex < session.quests.length;
  const swipeHandlers = useHorizontalSwipe({
    disabled: isUiBusy,
    onSwipeLeft: () => moveTo(session.activeIndex + 1),
    onSwipeRight: () => moveTo(session.activeIndex - 1),
  });
  const updateQuestSpotlight = (event: ReactPointerEvent<HTMLElement>) => {
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

  const hideQuestSpotlight = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--spotlight-opacity", "0");
  };

  return (
    <main className="quest-layout">
      {activeQuest.backgroundImageUrl && (
        <div
          className="quest-background"
          aria-hidden="true"
          style={{
            backgroundImage: `url("${activeQuest.backgroundImageUrl}")`,
          }}
        />
      )}
      <QuestAtmosphere />
      <header className="session-header">
        <div className="traveler-identity">
          {activeQuest.avatarUrl && (
            <img
              className="traveler-avatar"
              src={activeQuest.avatarUrl}
              alt={`${activeQuest.displayName || userId || "旅行者"}的头像`}
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
          <div>
            <p className="eyebrow">Quest session</p>
            <p className="traveler-name">
              {activeQuest.displayName || userId || "旅行者"}
            </p>
            <p className="traveler-rank">
              RANK {displayedRank?.code || "?"} ·{" "}
              {displayedRank?.name || "探索者"}
            </p>
          </div>
        </div>
        <div className="session-progress" aria-label="答题进度">
          <strong key={completedCount}>
            {completedCount}/{session.quests.length}
          </strong>
          <span>已完成</span>
        </div>
      </header>

      {missingSteps.length > 0 && (
        <aside className="inline-warning" role="status">
          未找到第 {missingSteps.join("、")} 题，已继续加载其余题目。
        </aside>
      )}

      {session.quests.length > 1 && (
        <nav ref={questNavRef} className="quest-nav" aria-label="题目导航">
          {session.quests.map((quest, index) => {
            const attempt = session.attempts[quest.id];
            return (
              <button
                ref={index === session.activeIndex ? activeNavItemRef : null}
                type="button"
                key={quest.id}
                className={index === session.activeIndex ? "is-active" : ""}
                disabled={!canActivateQuest(session, index)}
                onClick={() => moveTo(index)}
                aria-current={
                  index === session.activeIndex ? "step" : undefined
                }
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <small>
                  {attempt.status === "completed"
                    ? "完成"
                    : `第 ${quest.step} 题`}
                </small>
              </button>
            );
          })}
        </nav>
      )}

      <article
        key={activeQuest.id}
        ref={questCardRef}
        className="quest-card"
        data-answer-state={activeAttempt.status}
        tabIndex={-1}
        aria-label={`第 ${activeQuest.step} 题`}
        onPointerMove={updateQuestSpotlight}
        onPointerLeave={hideQuestSpotlight}
        {...swipeHandlers}
      >
        <div className="quest-meta">
          <span>第 {activeQuest.step} 题</span>
          <span>{activeQuest.kind === "choice" ? "选择题" : "填空题"}</span>
        </div>
        {activeQuest.title && <h1>{activeQuest.title}</h1>}
        <QuestContent
          items={activeQuest.content}
          fallback={activeQuest.prompt}
          onOpenImages={openImages}
          onOpenVideo={openVideo}
        />

        {availability.status !== "available" && (
          <div className="availability-notice" role="status">
            {availability.status === "not-started"
              ? `开放时间：${new Date(availability.startsAt).toLocaleString()}`
              : `已于 ${new Date(availability.endedAt).toLocaleString()} 结束`}
          </div>
        )}

        <form className="answer-form" onSubmit={handleSubmit}>
          {activeQuest.kind === "choice" ? (
            <ChoiceOptions
              questId={activeQuest.id}
              options={activeQuest.options}
              value={answer}
              disabled={
                isPermanentlyLocked ||
                isTemporarilyLocked ||
                activeAttempt.status === "completed"
              }
              onChange={setAnswer}
              onOpenImage={(url) => openImages([url])}
              onOpenVideo={openVideo}
            />
          ) : (
            <label className="text-answer">
              <span className="sr-only">答案</span>
              <Input
                variant="line"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder={activeQuest.answerPlaceholder || "输入你的答案"}
                autoComplete="off"
                disabled={activeAttempt.status === "completed"}
              />
            </label>
          )}

          {(isPermanentlyLocked || isTemporarilyLocked) && (
            <p className="penalty-state" role="timer">
              {isPermanentlyLocked
                ? "此题已永久锁定"
                : `距离再次尝试还有 ${formatRemaining((activeAttempt.penaltyEndsAt ?? now) - now)}`}
            </p>
          )}

          <div className="answer-actions">
            {activeAttempt.status !== "completed" && (
              <Button
                variant="primary"
                type="submit"
                disabled={
                  isPermanentlyLocked ||
                  isTemporarilyLocked ||
                  availability.status !== "available"
                }
              >
                提交答案
              </Button>
            )}
            {canMoveNext && (
              <Button variant="secondary" onClick={() => moveTo(nextIndex)}>
                前往下一题
              </Button>
            )}
          </div>
        </form>

        {feedback && (
          <>
            <p
              key={feedback}
              className="feedback"
              data-tone={feedbackTone}
              role="status"
              aria-live="polite"
            >
              {feedback}
            </p>
            {feedbackTone !== "neutral" && <EnergyBurst tone={feedbackTone} />}
          </>
        )}
        {activeAttempt.status === "completed" && (
          <CluePanel
            clues={activeQuest.clues}
            onOpenText={setTextClue}
            onOpenImages={openImages}
            onOpenVideo={openVideo}
            onClueOpen={(clue) =>
              trackAnalytics(
                {
                  name: "clue_opened",
                  clueId: clue.id,
                  kind: clue.kind,
                  step: activeQuest.step,
                  title: clue.title,
                  content: clue.content,
                  urls: [
                    ...clue.imageUrls,
                    ...(clue.url ? [clue.url] : []),
                    ...(clue.href ? [clue.href] : []),
                  ],
                  automatic: false,
                },
                userId,
              )
            }
          />
        )}
        <div className="quest-card-chrome" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </article>
      <span className="sr-only" aria-live="polite">
        {isVideoPlaying ? "视频正在播放" : "视频未播放"}
      </span>
      <MediaViewer
        state={mediaViewer}
        onClose={closeMediaViewer}
        onImageIndexChange={changeImageIndex}
        onVideoPlayingChange={setIsVideoPlaying}
        onVideoEnded={handleVideoEnded}
      />
      <ClueTextDialog clue={textClue} onClose={closeTextClue} />
      <CompletionFeedbackDialog
        variant={completionFeedback}
        completedCount={completedCount}
        onContinue={handleCompletionContinue}
      />
      {session.quests.length > 1 &&
        session.status === "completed" &&
        multiQuestClue &&
        !completionFeedback &&
        !isMultiClueOpen && (
          <Button
            variant="secondary"
            className="multi-clue-launcher"
            onClick={() => setIsMultiClueOpen(true)}
          >
            查看本场线索
          </Button>
        )}
      <MultiQuestClueDialog
        clue={multiQuestClue}
        open={isMultiClueOpen}
        onClose={() => setIsMultiClueOpen(false)}
      />
      <FinalDestinationPrompt
        destination={finalDestination}
        userId={userId}
        onDismiss={() => setFinalDestination(null)}
      />
      <RankUpDialog rank={rankUp} onClose={() => setRankUp(null)} />
      <NotificationCenter
        userId={userId}
        blocked={Boolean(isUiBusy || rankUp || finalDestination)}
        onOpenImages={openImages}
        onOpenVideo={openVideo}
      />
      <BgmControls
        visible={bgm.hasBgm}
        isPlaying={bgm.isPlaying}
        showAuthHint={bgm.showAuthHint}
        onToggle={bgm.toggle}
        onAuthorize={bgm.authorize}
        onDismissAuthHint={bgm.dismissAuthHint}
      />
    </main>
  );
}
