import type { ComponentProps, ReactNode, RefObject } from "react";
import { Link } from "react-router-dom";
import { uiCopy } from "@/config/ui-copy";
import type { GameAssignment } from "@/api/game.contracts";
import type { QuestClue, MultiQuestClue } from "@/domain/quest/types";
import {
  QuestCard,
  QuestAnswerGuide,
  type QuestCardProps,
} from "@/features/quest/QuestCard";
import { DesktopQuestCard } from "./desktop/DesktopQuestCard";
import { QuestWorkspace } from "./desktop/QuestWorkspace";
import { AssignmentBrief } from "./components/AssignmentBrief";
import { ExtraMessages } from "./components/ExtraMessages";
import { QuestAtmosphere } from "@/components/effects/QuestAtmosphere";
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
  guideSeen,
  closeAnswerGuide,
}: GamePlaySceneProps) {
  const QuestionCard = isDesktop ? DesktopQuestCard : QuestCard;
  const step =
    assignment.levels[activeIndex] ||
    assignment.levels[assignment.currentIndex];
  return (
    <main className={`quest-layout${isDesktop ? " quest-desktop" : ""}`}>
      {background && (
        <div
          className="quest-background"
          aria-hidden="true"
          style={{ backgroundImage: `url("${background}")` }}
        />
      )}
      <QuestAtmosphere />
      {header}
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
      {assignment.startedAt && assignment.status !== "cancelled" && (
        <>
          {assignment.totalLevels > 1 && (
            <nav
              ref={navRef}
              className="quest-nav"
              aria-label={uiCopy.gamePlayPage.questionNavigation}
            >
              {assignment.levels.map((level, index) => (
                <button
                  type="button"
                  key={level.id}
                  className={index === activeIndex ? "is-active" : ""}
                  aria-current={index === activeIndex ? "step" : undefined}
                  disabled={!level.question || pending}
                  onClick={() => moveTo(index)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>
                    {level.completedAt
                      ? uiCopy.gamePlayPage.completed
                      : uiCopy.gamePlayPage.questionNumber(index + 1)}
                  </small>
                </button>
              ))}
            </nav>
          )}
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
          {!isDesktop &&
            !guideSeen &&
            assignment.totalLevels > 1 &&
            assignment.status === "active" && (
              <QuestAnswerGuide dismissAnswerGuide={closeAnswerGuide} />
            )}
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
