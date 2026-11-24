import {
  useRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { StarFourIcon } from "@phosphor-icons/react";
import { uiCopy } from "@/config/ui-copy";
import type { GameAssignment } from "@/api/game.contracts";
import type { QuestClue, MultiQuestClue } from "@/domain/quest/types";
import { useFloatingHeaderVisibility } from "@/shared/layout/useFloatingHeaderVisibility";
import { QuestCard, type QuestCardProps } from "@/features/quest/QuestCard";
import { DesktopQuestCard } from "./desktop/DesktopQuestCard";
import { QuestWorkspace } from "./desktop/QuestWorkspace";
import { AssignmentBrief } from "./components/AssignmentBrief";
import { ExtraMessages } from "./components/ExtraMessages";
import { QuestAtmosphere } from "@/components/effects/QuestAtmosphere";
import { StarBurstOverlay } from "@/design/components/StarBurst";
import { MediaViewer } from "@/features/media/MediaViewer";
import { ClueTextDialog } from "@/features/clues/ClueTextDialog";
import { MultiQuestClueDialog } from "@/features/clues/MultiQuestClueDialog";
import { MultiClueLauncher } from "@/features/clues/MultiClueLauncher";
import { NarrativeAttentionBeacon } from "@/features/clues/NarrativeAttentionBeacon";
import { FinalDestinationPrompt } from "@/features/completion/FinalDestinationPrompt";
import { CompletionFeedbackDialog } from "@/features/completion/CompletionFeedbackDialog";
import { RankUpDialog } from "@/features/rank/RankUpDialog";
import { BgmControls } from "@/features/audio/BgmControls";
import type { useGamePresentation } from "./useGamePresentation";
import type { useQuestBgm } from "@/features/audio/useQuestBgm";

export interface GamePlaySceneProps {
  assignment: GameAssignment;
  activeIndex: number;
  isDesktop: boolean;
  background?: string;
  card: QuestCardProps | null;
  flow: ReturnType<typeof useGamePresentation>;
  bgm: ReturnType<typeof useQuestBgm>;
  brief: Omit<ComponentProps<typeof AssignmentBrief>, "assignment">;
  header?: ReactNode;
  renderHeader?: (
    trailing?: ReactNode,
    floatingState?: { floating: boolean; hidden: boolean },
  ) => ReactNode;
  retry?: ReactNode;
  notifications?: ReactNode;
  pending: boolean;
  navRef: RefObject<HTMLElement | null>;
  moveTo: (index: number) => void;
  workspaceClues: QuestClue[];
  attentionClueIds: Set<string>;
  markNarrativeOpened: (clue: QuestClue) => void;
  nextNarrativeAttention?: QuestClue;
  retainedCombination?: MultiQuestClue;
  guideSeen: boolean;
  closeAnswerGuide: (locate?: boolean) => void;
}

/** Shared scene only: business requests, identity and persistence belong to its caller. */
export function GamePlayScene({
  assignment,
  activeIndex,
  isDesktop,
  background,
  card,
  flow,
  bgm,
  brief,
  header,
  renderHeader,
  retry,
  notifications,
  pending,
  navRef,
  moveTo,
  workspaceClues,
  attentionClueIds,
  markNarrativeOpened,
  nextNarrativeAttention,
  retainedCombination,
}: GamePlaySceneProps) {
  const layoutRef = useRef<HTMLElement | null>(null);
  const QuestionCard = isDesktop ? DesktopQuestCard : QuestCard;
  const step =
    assignment.levels[activeIndex] ||
    assignment.levels[assignment.currentIndex];
  const showQuestions = Boolean(
    assignment.startedAt && assignment.status !== "cancelled",
  );
  const showStarNav = showQuestions && assignment.totalLevels > 1;
  const headerHidden = useFloatingHeaderVisibility({
    enabled: Boolean(renderHeader),
    scrollContainerRef: layoutRef,
    resetKey: `${assignment.id}:${activeIndex}:${showQuestions ? "q" : "b"}`,
  });

  const starNav = showStarNav ? (
    <nav
      ref={navRef}
      className={`quest-nav${isDesktop ? " quest-nav--inline" : ""}`}
      aria-label={uiCopy.gamePlayPage.questionNavigation}
    >
      {assignment.levels.map((level, index) => {
        const isCurrent = index === activeIndex;
        const isDone = Boolean(level.completedAt);
        const state = isCurrent ? "current" : isDone ? "done" : "todo";
        const classes = [
          "quest-star-node",
          isCurrent ? "is-active" : "",
          isDone ? "is-completed" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            type="button"
            key={level.id}
            className={classes}
            data-state={state}
            aria-current={isCurrent ? "step" : undefined}
            disabled={!level.question || pending}
            onClick={() => moveTo(index)}
          >
            <StarFourIcon
              size={isCurrent ? (isDesktop ? 16 : 18) : isDesktop ? 13 : 14}
              weight={state === "todo" ? "regular" : "fill"}
              aria-hidden="true"
            />
            <span className="sr-only">
              {String(index + 1).padStart(2, "0")}{" "}
              {isDone
                ? uiCopy.gamePlayPage.completed
                : uiCopy.gamePlayPage.questionNumber(index + 1)}
            </span>
          </button>
        );
      })}
    </nav>
  ) : null;

  const embedNavInHeader = Boolean(isDesktop && renderHeader && starNav);
  const resolvedHeader = renderHeader
    ? renderHeader(embedNavInHeader ? starNav : undefined, {
        floating: true,
        hidden: headerHidden,
      })
    : header;

  return (
    <main
      ref={layoutRef}
      className={`quest-layout${isDesktop ? " quest-desktop" : ""}`}
    >
      {background && (
        <div
          className="quest-background"
          aria-hidden="true"
          style={{ backgroundImage: `url("${background}")` }}
        />
      )}
      <QuestAtmosphere />
      {resolvedHeader}
      <ExtraMessages value={assignment} />
      {assignment.status === "assigned" && (
        <AssignmentBrief assignment={assignment} {...brief} />
      )}
      {assignment.status === "cancelled" && (
        <section className="game-empty">
          <h2>{uiCopy.gamePlayPage.revokedTitle}</h2>
          <p>{uiCopy.gamePlayPage.revokedDescription}</p>
          <Link className="game-action-link game-action-link--primary" to="/">
            {uiCopy.gamePlayPage.home}
          </Link>
        </section>
      )}
      {showQuestions && (
        <>
          {!embedNavInHeader && starNav}
          {step?.question && <ExtraMessages value={step} />}
          <QuestWorkspace
            desktop={isDesktop}
            clues={workspaceClues}
            openText={flow.openText}
            openImages={flow.openImages}
            openVideo={flow.openVideo}
            attentionClueIds={attentionClueIds}
            onClueOpen={markNarrativeOpened}
          >
            {card && <QuestionCard key={step!.id} {...card!} />}
          </QuestWorkspace>
          {!isDesktop && nextNarrativeAttention && (
            <NarrativeAttentionBeacon
              clue={nextNarrativeAttention}
              onOpen={markNarrativeOpened}
            />
          )}
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {flow.videoPlaying
          ? uiCopy.gamePlayPage.videoPlaying
          : uiCopy.gamePlayPage.videoStopped}
      </span>
      {retry}
      <MediaViewer
        className={isDesktop ? "desktop-media-viewer" : undefined}
        state={flow.media}
        onClose={flow.closeMedia}
        onImageIndexChange={flow.changeImageIndex}
        onVideoPlayingChange={flow.setVideoPlaying}
        onVideoEnded={flow.videoEnded}
      />
      <ClueTextDialog clue={flow.textClue} onClose={flow.closeText} />
      <StarBurstOverlay
        open={Boolean(flow.burst)}
        title={flow.burst?.title}
        xpDelta={flow.burst?.xpDelta ?? 0}
        actionLabel={flow.burst?.nextIndex !== null ? "下一题" : "继续"}
        secondaryLabel={
          flow.burst?.nextIndex !== null && flow.burst?.hasClues
            ? "留在当前题查看线索"
            : undefined
        }
        onAction={flow.continueBurst}
        onDismiss={flow.dismissBurst}
      />
      <CompletionFeedbackDialog
        variant={flow.completion}
        completedCount={assignment.completedLevels}
        onContinue={flow.continueCompletion}
      />
      {assignment.status === "completed" &&
        !flow.completion &&
        !flow.combination &&
        retainedCombination && (
          <MultiClueLauncher
            onOpen={() => flow.openCombination(retainedCombination)}
          />
        )}
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
      {notifications}
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
