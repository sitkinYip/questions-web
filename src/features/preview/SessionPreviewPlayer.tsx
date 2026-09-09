import { StarLettersView } from "@/features/mailbox/StarLettersView";
import { selectStarLetters } from "@/features/mailbox/star-letters";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { GameClue } from "@/api/game.contracts";
import { GamePlayScene } from "@/features/game/GamePlayScene";
import { GameHeaderView } from "@/features/game/components/GameHeaderView";
import { useGamePresentation } from "@/features/game/useGamePresentation";
import {
  answerPresentationSteps,
  startPresentationSteps,
  resolveLevelPresentation,
} from "@/features/game/session-presentation";
import {
  selectClueViews,
  selectCombinationClues,
  combinationView,
  clueView,
} from "@/features/game/clue-presentation";
import { useQuestBgm } from "@/features/audio/useQuestBgm";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";
import { useHorizontalSwipe } from "@/shared/gestures/useHorizontalSwipe";
import { useQuestNavigationPosition } from "@/features/quest/useQuestNavigationPosition";
import type { QuestCardProps } from "@/features/quest/QuestCard";
import { NarrativePreview } from "./NarrativePreview";
import type { SessionPreviewValue } from "./SessionPreview";
import {
  initialSessionSimulation,
  newlyVisibleEffects,
  sessionSnapshot,
  type SessionBookmark,
} from "./session-simulation";
const noop = () => {};
export function SessionPreviewPlayer({
  value,
  initial,
  onBookmark,
}: {
  value: SessionPreviewValue;
  initial: SessionBookmark;
  onBookmark: (value: SessionBookmark) => void;
}) {
  const definition = value.assignment;
  const [seed] = useState(() => initialSessionSimulation(definition, initial));
  const [activeIndex, setActiveIndex] = useState(seed.index);
  const [stage, setStage] = useState(initial.stage);
  const [completed, setCompleted] = useState(seed.completed);
  const [manual, setManual] = useState(new Set<string>());
  const [wrong, setWrong] = useState<Record<string, number>>({});
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [tone, setTone] = useState<"neutral" | "danger" | "success">("neutral");
  const [opened, setOpened] = useState(new Set<string>());
  const [narrative, setNarrative] = useState<
    SessionPreviewValue["narratives"][number] | null
  >(null);
  const [link, setLink] = useState("");
  const [mailbox, setMailbox] = useState(false);
  const assignment = sessionSnapshot(
    definition,
    stage,
    completed,
    manual,
    wrong,
  );
  const cardRef = useRef<HTMLElement>(null),
    formRef = useRef<HTMLFormElement>(null),
    navRef = useRef<HTMLElement>(null);
  const desktop = useDesktopLayout();
  const step = assignment.levels[activeIndex] || assignment.levels[0];
  const flow = useGamePresentation((index) => {
    setActiveIndex(index);
    setAnswer("");
    setFeedback("");
    setTone("neutral");
    onBookmark({ stage, levelId: definition.levels[index]?.id || "" });
  });
  const presentation = resolveLevelPresentation(
    assignment,
    step?.presentationOverride,
  );
  const bgm = useQuestBgm(
    presentation.bgmUrl || undefined,
    flow.media?.type === "video" || !!narrative,
  );
  useQuestNavigationPosition(step?.id || "", cardRef, !desktop);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  function locate(index: number, nextStage = stage) {
    setActiveIndex(index);
    setAnswer("");
    setFeedback("");
    setTone("neutral");
    onBookmark({
      stage: nextStage,
      levelId: definition.levels[index]?.id || "",
    });
  }
  function moveTo(index: number) {
    if (!assignment.levels[index]?.question) return;
    flow.reset();
    locate(index);
  }
  function start() {
    const next = sessionSnapshot(definition, "play", new Set(), manual);
    setStage("play");
    setCompleted(new Set());
    locate(0, "play");
    flow.start(
      startPresentationSteps(assignment, {
        ...next,
        transitionEffects: newlyVisibleEffects(assignment, next),
      }),
    );
  }
  function correct() {
    if (!step?.question || step.completedAt || stage === "brief" || flow.busy)
      return;
    const done = new Set(completed).add(step.id);
    const nextStage =
      done.size === definition.levels.length ? "completed" : "play";
    const next = sessionSnapshot(definition, nextStage, done, manual, wrong);
    setCompleted(done);
    setStage(nextStage);
    setTone("success");
    setFeedback(nextStage === "completed" ? "全部关卡已完成。" : "回答正确。");
    onBookmark({ stage: nextStage, levelId: step.id });
    flow.start(
      answerPresentationSteps(
        assignment,
        next,
        step.id,
        newlyVisibleEffects(assignment, next),
      ),
    );
  }
  function incorrect() {
    if (!step?.question || step.completedAt || stage === "brief" || flow.busy)
      return;
    setWrong({ ...wrong, [step.id]: (wrong[step.id] || 0) + 1 });
    setTone("danger");
    setFeedback("答案不正确，请再试一次。");
  }
  function unlock(clue: GameClue) {
    const nextManual = new Set(manual).add(clue.id);
    setManual(nextManual);
    flow.start(
      clue.autoPlay
        ? [{ type: "clue", clue: clueView(clue, assignment.id) }]
        : [],
    );
  }
  function openLink(event: MouseEvent) {
    const anchor =
      event.target instanceof Element ? event.target.closest("a") : null;
    if (!anchor) return;
    event.preventDefault();
    event.stopPropagation();
    const url = new URL(anchor.href, location.origin);
    const match =
      url.origin === location.origin
        ? url.pathname.match(/\/play\/editor-session\/content\/([^/]+)$/)
        : null;
    flow.reset();
    if (match) {
      const n = value.narratives.find(
        (n) => n.id === decodeURIComponent(match[1]),
      );
      if (n) {
        setOpened(
          (prev) =>
            new Set([
              ...prev,
              ...assignment.clues
                .filter((c) => c.narrative === n.id)
                .map((c) => c.id),
            ]),
        );
        setNarrative(n);
        setLink("");
      } else setLink("剧情引用不存在，请返回后台补全配置。");
    } else
      setLink(
        `预览不跳转，目标地址：${anchor.getAttribute("href") || "未配置"}`,
      );
  }
  const workspaceClues = selectClueViews(assignment.clues, {
    assignmentId: assignment.id,
    totalLevels: assignment.totalLevels,
    levelOrder: assignment.levels.map((l) => l.id),
  });
  const activeClues = selectClueViews(assignment.clues, {
    assignmentId: assignment.id,
    totalLevels: assignment.totalLevels,
    sessionLevel: step?.id,
    levelOrder: assignment.levels.map((l) => l.id),
  });
  const attention = new Set(
    workspaceClues
      .filter(
        (c) => (c.kind === "letter" || c.kind === "bless") && !opened.has(c.id),
      )
      .map((c) => c.id),
  );
  const swipe = useHorizontalSwipe({
    disabled: flow.busy,
    onSwipeLeft: () => moveTo(activeIndex + 1),
    onSwipeRight: () => moveTo(activeIndex - 1),
  });
  const q = step?.question;
  const card: QuestCardProps | null = q
    ? {
        activeQuest: {
          id: step.id,
          kind: q.kind,
          title: presentation.hideTitle ? undefined : q.title,
          prompt: q.content[0]?.text || "",
          content: q.content,
          options: q.options,
          answerPlaceholder: q.placeholder,
          clues: activeClues,
        },
        activeAttempt: {
          status: step.completedAt
            ? "completed"
            : step.wrongCount
              ? "incorrect"
              : "unanswered",
          penaltyEndsAt: null,
        },
        activeQuestionNumber: activeIndex + 1,
        questCardRef: cardRef,
        answerFormRef: formRef,
        swipeHandlers: swipe,
        updateQuestSpotlight: noop,
        hideQuestSpotlight: noop,
        availability: { status: "available" },
        highlightAnswerForm: false,
        handleSubmit: (e) => {
          e.preventDefault();
          setTone("neutral");
          setFeedback("请使用上方「模拟答对／答错」检查结果，预览不执行判题。");
        },
        answer,
        setAnswer,
        isPermanentlyLocked: false,
        isTemporarilyLocked: false,
        now: Date.parse(assignment.serverTime),
        pending: false,
        canMoveNext:
          !!step.completedAt && !!assignment.levels[activeIndex + 1]?.question,
        nextIndex: activeIndex + 1,
        moveTo,
        feedback,
        feedbackTone: tone,
        openImages: flow.openImages,
        openVideo: flow.openVideo,
        setTextClue: flow.openText,
        attentionClueIds: attention,
        onClueOpen: (c) => setOpened((prev) => new Set(prev).add(c.id)),
      }
    : null;
  function replayCompletion() {
    const before = sessionSnapshot(
      definition,
      "play",
      new Set(definition.levels.slice(0, -1).map((l) => l.id)),
      manual,
    );
    flow.start(
      answerPresentationSteps(
        before,
        assignment,
        definition.levels.at(-1)!.id,
        newlyVisibleEffects(before, assignment),
      ),
    );
  }
  return (
    <section onClickCapture={openLink}>
      <div className="session-preview-toolbar" aria-label="场次预览操作">
        <button
          type="button"
          aria-pressed={mailbox}
          onClick={() => {
            setNarrative(null);
            setMailbox((current) => !current);
          }}
        >
          {mailbox ? "返回场次" : "预览星海信笺"}
        </button>
        {narrative ? (
          <button type="button" onClick={() => setNarrative(null)}>
            返回场次预览
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={
                stage === "brief" || !!step?.completedAt || !q || flow.busy
              }
              onClick={correct}
            >
              模拟答对
            </button>
            <button
              type="button"
              disabled={
                stage === "brief" || !!step?.completedAt || !q || flow.busy
              }
              onClick={incorrect}
            >
              模拟答错
            </button>
            <select
              aria-label="手动解锁线索"
              value=""
              disabled={stage === "brief" || flow.busy}
              onChange={(e) => {
                const clue = definition.clues.find(
                  (c) => c.id === e.target.value,
                );
                if (clue) unlock(clue);
              }}
            >
              <option value="">手动解锁线索</option>
              {definition.clues
                .filter((c) => c.trigger === "manual" && !manual.has(c.id))
                .map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.content.title || "未命名线索"}
                  </option>
                ))}
            </select>
            {assignment.status === "completed" && (
              <button
                type="button"
                disabled={flow.busy}
                onClick={replayCompletion}
              >
                重播通关演出
              </button>
            )}
            {assignment.status === "completed" &&
              assignment.completionTarget && (
                <a
                  href={
                    assignment.completionTarget.kind === "narrative"
                      ? `/play/editor-session/content/${assignment.completionTarget.id}`
                      : assignment.completionTarget.url
                  }
                >
                  预览完成后入口
                </a>
              )}
          </>
        )}
      </div>
      {link && (
        <p className="editor-preview-status" role="status">
          {link}
        </p>
      )}
      {narrative ? (
        <NarrativePreview narrative={narrative} />
      ) : mailbox ? (
        <div className="editor-preview-letter">
          <h2>星海信笺</h2>
          <StarLettersView
            letters={selectStarLetters([assignment])}
            onOpen={(letter) => {
              const id = decodeURIComponent(letter.href.split("/").at(-1)!);
              const entry = value.narratives.find((item) => item.id === id);
              if (entry) {
                flow.reset();
                setNarrative(entry);
              } else setLink("剧情引用不存在，请返回后台补全配置。");
            }}
          />
          {!selectStarLetters([assignment]).length && (
            <p>在场次中获得的信件与祝福，会珍藏在这里。</p>
          )}
        </div>
      ) : (
        <GamePlayScene
          assignment={assignment}
          activeIndex={activeIndex}
          isDesktop={desktop}
          background={presentation.background}
          card={card}
          flow={flow}
          bgm={bgm}
          brief={{
            rank: definition.minLevel,
            now: Date.parse(assignment.serverTime),
            pending: false,
            error: null,
            onStart: start,
          }}
          header={
            <GameHeaderView
              player={{
                displayName: "预览玩家",
                level: {
                  id: "preview-rank",
                  order: definition.minLevel,
                  name: "模拟等级",
                  minTotalXp: 0,
                  visualConfig: {},
                },
              }}
              progress={{
                completed: assignment.completedLevels,
                total: assignment.totalLevels,
              }}
            />
          }
          pending={false}
          navRef={navRef}
          moveTo={moveTo}
          workspaceClues={workspaceClues}
          attentionClueIds={attention}
          markNarrativeOpened={(c) =>
            setOpened((prev) => new Set(prev).add(c.id))
          }
          nextNarrativeAttention={workspaceClues.find(
            (c) =>
              attention.has(c.id) && !activeClues.some((a) => a.id === c.id),
          )}
          retainedCombination={selectCombinationClues(
            assignment.clues,
            assignment.totalLevels,
          )
            .map(combinationView)
            .at(-1)}
          guideSeen={true}
          closeAnswerGuide={noop}
        />
      )}
    </section>
  );
}
