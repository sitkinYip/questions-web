import { createRequestId } from "../../shared/request-id";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { gameApi } from "../../api/game.client";
import type { GameAssignment, GameClue } from "../../api/game.contracts";
import type {
  MultiQuestClue,
  QuestAvailability,
  QuestClue,
  QuestFinalDestination,
} from "../../domain/quest/types";
import { Button } from "../../components/ui/Button";
import { QuestAtmosphere } from "../../components/effects/QuestAtmosphere";
import { MediaViewer } from "../media/MediaViewer";
import { ClueTextDialog } from "../clues/ClueTextDialog";
import { MultiQuestClueDialog } from "../clues/MultiQuestClueDialog";
import { FinalDestinationPrompt } from "../completion/FinalDestinationPrompt";
import { createQuestAnswerGuideRepository } from "../../infrastructure/storage/quest-guide.repository";
import { CompletionFeedbackDialog } from "../completion/CompletionFeedbackDialog";
import { RankUpDialog } from "../rank/RankUpDialog";
import { BgmControls } from "../audio/BgmControls";
import { useQuestBgm } from "../audio/useQuestBgm";
import { GameFailure, GameHeader } from "./GameContext";
import { GameNotificationCenter } from "./GameNotificationCenter";
import { useGame } from "./useGame";
import {
  useGamePresentation,
  type PresentationStep,
} from "./useGamePresentation";
import { useHorizontalSwipe } from "../../shared/gestures/useHorizontalSwipe";
import { useQuestNavigationPosition } from "../quest/useQuestNavigationPosition";
import { QuestCard, QuestAnswerGuide } from "../quest/QuestCard";

function clueView(clue: GameClue, assignmentId: string): QuestClue {
  const narrative = clue.kind === "letter" || clue.kind === "bless";
  return {
    id: clue.id,
    kind: narrative ? "letter" : (clue.kind as QuestClue["kind"]),
    title: clue.content.title || undefined,
    content: clue.content.text,
    autoPlay: clue.autoPlay,
    url: clue.content.url || undefined,
    imageUrls: clue.content.imageUrls,
    tips: clue.content.tips,
    href: narrative
      ? `/play/${assignmentId}/content/${clue.narrative}`
      : clue.content.url || undefined,
    linkTarget: narrative ? "internal" : "external",
  };
}
function combinationView(clue: GameClue): MultiQuestClue {
  return {
    id: clue.id,
    qas: "",
    revision: clue.unlockedAt,
    title: clue.content.title,
    content: clue.content.text,
    buttonText: clue.content.buttonText,
    description: clue.content.description,
  };
}
function destinationView(
  assignment: GameAssignment,
): QuestFinalDestination | null {
  const target = assignment.completionTarget;
  return target?.kind === "narrative"
    ? {
        href: `/play/${assignment.id}/content/${target.id}`,
        target: "internal",
      }
    : target?.kind === "link"
      ? { href: target.url, target: "external" }
      : null;
}
export function GamePlayPage() {
  const { id = "" } = useParams(),
    { player } = useGame();
  const query = useQuery({
    queryKey: ["game", player.id, "assignment", id],
    queryFn: ({ signal }) => gameApi.assignment(id, signal),
    refetchInterval: 5000,
  });
  if (query.isPending)
    return (
      <main className="centered-state" aria-busy="true">
        <p>正在准备本场冒险…</p>
      </main>
    );
  if (query.isError)
    return (
      <main className="game-shell">
        <GameHeader />
        <GameFailure error={query.error} retry={() => void query.refetch()} />
      </main>
    );
  return <GamePlayView key={id} assignment={query.data} />;
}

export function GamePlayView({ assignment }: { assignment: GameAssignment }) {
  const { player, setPlayer } = useGame(),
    client = useQueryClient();
  const [activeIndex, setActiveIndex] = useState(assignment.currentIndex);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<
    "neutral" | "success" | "danger"
  >("neutral");
  const answerFormRef = useRef<HTMLFormElement | null>(null);
  const guideTimer = useRef<number | null>(null);
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
    },
    [],
  );
  const flow = useGamePresentation((index) => {
    setActiveIndex(index);
    setFeedback("");
    setFeedbackTone("neutral");
  });
  const request = useRef<{ answer: string; level: string; key: string } | null>(
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
  useQuestNavigationPosition(step?.id || "", cardRef);
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
  const bgmUrl =
    override?.bgmMode === "silent"
      ? undefined
      : override?.bgmMode === "custom"
        ? override.bgmUrl
        : assignment.presentation.bgmMode === "silent"
          ? undefined
          : assignment.presentation.bgmUrl;
  // The original player pauses BGM as soon as a video viewer opens.
  const bgm = useQuestBgm(
    bgmUrl || undefined,
    flow.media?.type === "video",
    player.id,
  );
  const background =
    override?.backgroundMode === "none"
      ? undefined
      : override?.backgroundMode === "custom"
        ? override.backgroundUrl
        : override?.backgroundUrl ||
          (assignment.presentation.backgroundMode === "none"
            ? undefined
            : assignment.presentation.backgroundUrl);
  const isCombination = (clue: GameClue) =>
    assignment.totalLevels > 1 &&
    clue.trigger === "session_completed" &&
    !clue.sessionLevel &&
    clue.kind === "text";
  const combinations = assignment.clues
    .filter(isCombination)
    .map(combinationView);
  const start = useMutation({
    mutationFn: () => gameApi.start(assignment.id, startKey),
    onSuccess: (value) => {
      client.setQueryData(
        ["game", player.id, "assignment", assignment.id],
        value,
      );
      const known = new Set(assignment.clues.map((clue) => clue.id));
      flow.start(
        value.clues
          .filter((clue) => clue.autoPlay && !known.has(clue.id))
          .map((clue) => ({ type: "clue", clue: clueView(clue, value.id) })),
      );
    },
  });
  const submit = useMutation({
    mutationFn: () => {
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
        setFeedback(
          attempt?.locked
            ? "回答错误，当前题目已永久锁定。请联系工作人员处理。"
            : attempt?.cooldownUntil
              ? "回答错误，已进入惩罚时间。"
              : "答案不正确，可以继续尝试。",
        );
        setFeedbackTone("danger");
        return;
      }
      if (result.result === "already_completed") return;
      const completed = result.assignment.status === "completed";
      setFeedback(
        completed ? "全部题目已经完成。" : "回答正确，当前题目已完成。",
      );
      setFeedbackTone("success");
      const known = new Set(assignment.clues.map((clue) => clue.id));
      const unlocked = result.assignment.clues.filter(
        (clue) => !known.has(clue.id),
      );
      const automatic = unlocked.filter(
        (clue) => clue.autoPlay && !isCombination(clue),
      );
      const sequence: PresentationStep[] = automatic.map((clue) => ({
        type: "clue",
        clue: clueView(clue, assignment.id),
      }));
      const finale =
        completed && assignment.presentation.completionStyle === "finale";
      if (finale) sequence.unshift({ type: "completion", variant: "final" });
      else if (completed && assignment.totalLevels > 1)
        sequence.push({ type: "completion", variant: "multi" });
      if (completed) {
        for (const clue of unlocked.filter(isCombination))
          sequence.push({ type: "combination", clue: combinationView(clue) });
        const destination = destinationView(result.assignment);
        if (finale && destination)
          sequence.push({ type: "destination", destination });
      } else if (step.autoNext)
        sequence.push({
          type: "advance",
          index: result.assignment.currentIndex,
          delay: automatic.length ? 0 : 1500,
        });
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
      setFeedback(error.message);
      setFeedbackTone("danger");
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
  const eligible =
    player.level.order >= assignment.minLevel &&
    (assignment.maxLevel === null || player.level.order <= assignment.maxLevel);
  const availability: QuestAvailability = waiting
    ? { status: "not-started", startsAt: Date.parse(assignment.startsAt) }
    : expired
      ? { status: "ended", endedAt: Date.parse(assignment.endsAt) }
      : { status: "available" };
  const moveTo = (index: number) => {
    if (!assignment.levels[index]?.question || submit.isPending) return;
    flow.reset();
    setActiveIndex(index);
    setFeedback("");
    setFeedbackTone("neutral");
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
      setFeedback("请先输入或选择答案。");
      setFeedbackTone("neutral");
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
  return (
    <main className="quest-layout">
      {background && (
        <div
          className="quest-background"
          aria-hidden="true"
          style={{ backgroundImage: `url("${background}")` }}
        />
      )}
      <QuestAtmosphere />
      <GameHeader
        progress={{
          completed: assignment.completedLevels,
          total: assignment.totalLevels,
        }}
      />
      {assignment.status === "assigned" && (
        <section className="quest-card">
          <h2>本场冒险尚未开始</h2>
          <p>{assignment.description}</p>
          <p>
            参与等级：{assignment.minLevel}
            {assignment.maxLevel ? `～${assignment.maxLevel}` : " 及以上"}
          </p>
          {!eligible && <p>当前等级不符合参与要求。</p>}
          {waiting && (
            <p>开放时间：{new Date(assignment.startsAt).toLocaleString()}</p>
          )}
          {expired && <p>本次场次已过期，请联系工作人员。</p>}
          {start.isError && <GameFailure error={start.error} />}
          <Button
            variant="primary"
            onClick={() => start.mutate()}
            disabled={start.isPending || !eligible || waiting || expired}
          >
            {start.isPending ? "正在进入…" : "开始本场冒险"}
          </Button>
        </section>
      )}
      {assignment.status === "cancelled" && (
        <section className="game-empty">
          <h2>本次场次已撤回</h2>
          <p>如需继续，请联系工作人员重新安排。</p>
        </section>
      )}
      {assignment.startedAt && assignment.status !== "cancelled" && (
        <>
          {assignment.totalLevels > 1 && (
            <nav ref={navRef} className="quest-nav" aria-label="题目导航">
              {assignment.levels.map((level, index) => (
                <button
                  type="button"
                  key={level.id}
                  className={index === activeIndex ? "is-active" : ""}
                  aria-current={index === activeIndex ? "step" : undefined}
                  disabled={!level.question || submit.isPending}
                  onClick={() => moveTo(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>
                    {level.completedAt ? "已完成" : `第 ${index + 1} 题`}
                  </small>
                </button>
              ))}
            </nav>
          )}
          {content && (
            <QuestCard
              key={step.id}
              activeQuest={{
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
                clues: assignment.clues
                  .filter(
                    (clue) =>
                      !isCombination(clue) &&
                      (!clue.sessionLevel || clue.sessionLevel === step.id),
                  )
                  .map((clue) => clueView(clue, assignment.id)),
              }}
              activeAttempt={{
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
              }}
              activeQuestionNumber={activeIndex + 1}
              questCardRef={cardRef}
              answerFormRef={answerFormRef}
              swipeHandlers={swipe}
              updateQuestSpotlight={updateQuestSpotlight}
              hideQuestSpotlight={(event) =>
                event.currentTarget.style.setProperty(
                  "--spotlight-opacity",
                  "0",
                )
              }
              availability={availability}
              highlightAnswerForm={highlightAnswerForm}
              handleSubmit={onSubmit}
              answer={answers[step.id] ?? step.lastAnswer}
              setAnswer={(value) => {
                closeAnswerGuide();
                setAnswers((previous) => ({ ...previous, [step.id]: value }));
              }}
              isPermanentlyLocked={step.locked}
              isTemporarilyLocked={cooling}
              now={serverNow}
              pending={submit.isPending}
              canMoveNext={
                !!step.completedAt &&
                !!assignment.levels[activeIndex + 1]?.question
              }
              nextIndex={activeIndex + 1}
              moveTo={moveTo}
              feedback={feedback}
              feedbackTone={feedbackTone}
              openImages={flow.openImages}
              openVideo={flow.openVideo}
              setTextClue={flow.openText}
            />
          )}
          {!guideSeen &&
            assignment.totalLevels > 1 &&
            assignment.status === "active" && (
              <QuestAnswerGuide dismissAnswerGuide={closeAnswerGuide} />
            )}
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {flow.videoPlaying ? "视频正在播放" : "视频未播放"}
      </span>
      <MediaViewer
        state={flow.media}
        onClose={flow.closeMedia}
        onImageIndexChange={flow.changeImageIndex}
        onVideoPlayingChange={flow.setVideoPlaying}
        onVideoEnded={flow.videoEnded}
      />
      <ClueTextDialog clue={flow.textClue} onClose={flow.closeText} />
      <CompletionFeedbackDialog
        variant={flow.completion}
        completedCount={assignment.completedLevels}
        onContinue={flow.continueCompletion}
      />
      {assignment.status === "completed" &&
        !flow.completion &&
        !flow.combination &&
        combinations.map((clue) => (
          <Button
            key={clue.id}
            variant="secondary"
            className="multi-clue-launcher"
            onClick={() => flow.openCombination(clue)}
          >
            查看本场线索
          </Button>
        ))}
      <MultiQuestClueDialog
        clue={flow.combination}
        open={!!flow.combination}
        onClose={flow.closeCombination}
      />
      <FinalDestinationPrompt
        destination={flow.destination}
        onDismiss={flow.closeDestination}
      />
      <RankUpDialog rank={flow.rank} onClose={flow.closeRank} />
      <GameNotificationCenter
        blocked={flow.busy}
        onOpenImages={flow.openImages}
        onOpenVideo={flow.openVideo}
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
