import { useEffect, useRef, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { OverlayProvider } from "@/components/ui/OverlayProvider";
import { ThemeContext } from "@/components/ui/theme-context";
import { EDITOR_PREVIEW_VERSION } from "@/api/game.contracts";
import { QuestCard, type QuestCardProps } from "@/features/quest/QuestCard";
import { DesktopQuestCard } from "@/features/game/desktop/DesktopQuestCard";
import { QuestWorkspace } from "@/features/game/desktop/QuestWorkspace";
import { NotificationLetterView } from "@/features/game/components/NotificationLetter";
import { NotificationDialog } from "@/features/notification/NotificationDialog";
import {
  MediaViewer,
  type MediaViewerState,
} from "@/features/media/MediaViewer";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";
import {
  previewMessageSchema,
  allowedPreviewOrigin,
  type ValidatedPreviewMessage,
} from "./protocol";
import { NarrativePreview } from "./NarrativePreview";
import "./preview.css";

export function EditorPreview() {
  const [message, setMessage] = useState<ValidatedPreviewMessage | null>(null);
  const [connection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const origin = params.get("parentOrigin") || "";
    const channel = params.get("channel") || "";
    return {
      origin,
      channel,
      allowed:
        window.parent !== window &&
        !!channel &&
        allowedPreviewOrigin(
          origin,
          import.meta.env.DEV,
          import.meta.env.VITE_PREVIEW_ADMIN_ORIGINS,
        ),
    };
  });
  const [error, setError] = useState(
    connection.allowed ? "" : "请从管理后台打开实时预览。",
  );
  useEffect(() => {
    const { origin, channel, allowed } = connection;
    if (!allowed) return;
    let revision = -1;
    const ready = () =>
      window.parent.postMessage(
        {
          type: "sitkin:preview:ready",
          version: EDITOR_PREVIEW_VERSION,
          channel,
          kinds: ["question", "notification", "narrative"],
        },
        origin,
      );
    const timer = window.setInterval(ready, 1000);
    function receive(event: MessageEvent) {
      if (
        event.origin !== origin ||
        event.source !== window.parent ||
        event.data?.channel !== channel
      )
        return;
      const parsed = previewMessageSchema.safeParse(event.data);
      if (!parsed.success) {
        setError(
          "配置暂时无法预览，请检查媒体地址与内容格式。有效修改后会自动恢复。",
        );
        return;
      }
      if (parsed.data.revision <= revision) return;
      revision = parsed.data.revision;
      window.clearInterval(timer);
      setError("");
      setMessage(parsed.data);
    }
    window.addEventListener("message", receive);
    ready();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("message", receive);
    };
  }, [connection]);
  const theme = message?.theme ?? "light";
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  // Capture also covers portalled dialogs. Draft links must not navigate to live pages.
  return (
    <MemoryRouter>
      <ThemeContext.Provider
        value={{
          preference: theme,
          resolvedTheme: theme,
          setPreference: () => {},
        }}
      >
        <OverlayProvider>
          <div
            className="editor-preview"
            onClickCapture={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest("a")
              ) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          >
            {error && (
              <p className="editor-preview-status" role="alert">
                {error}
              </p>
            )}
            {!message && !error && (
              <p className="editor-preview-status" role="status">
                等待编辑内容…
              </p>
            )}
            {message && !error && (
              <PreviewContent
                key={`${message.draft.kind}:${message.reset}:${message.state}:${message.draft.kind === "narrative" ? message.revision : ""}`}
                message={message}
              />
            )}
          </div>
        </OverlayProvider>
      </ThemeContext.Provider>
    </MemoryRouter>
  );
}

function PreviewContent({ message }: { message: ValidatedPreviewMessage }) {
  const desktop = useDesktopLayout();
  const cardRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [read, setRead] = useState(message.state === "read");
  const [popup, setPopup] = useState(message.state === "popup");
  const [media, setMedia] = useState<MediaViewerState>(null);
  const openImages = (urls: readonly string[], index = 0) => {
    if (urls.length) setMedia({ type: "images", urls, index });
  };
  const openVideo = (url: string, poster?: string) =>
    setMedia({ type: "video", url, poster });
  const noOp = () => {};
  const [sentAt] = useState(() => new Date().toISOString());
  let content;
  if (message.draft.kind === "question") {
    const q = message.draft.value;
    const status =
      message.state === "completed"
        ? "completed"
        : message.state === "incorrect"
          ? "incorrect"
          : "unanswered";
    const props: QuestCardProps = {
      activeQuest: {
        ...q,
        prompt: q.content[0]?.text || "",
        answerPlaceholder: q.placeholder,
        clues: [],
      },
      activeAttempt: { status, penaltyEndsAt: null },
      activeQuestionNumber: 1,
      questCardRef: cardRef,
      answerFormRef: formRef,
      swipeHandlers: {
        onPointerDown: noOp,
        onPointerUp: noOp,
        onPointerCancel: noOp,
      },
      updateQuestSpotlight: noOp,
      hideQuestSpotlight: noOp,
      availability: { status: "available" },
      highlightAnswerForm: false,
      handleSubmit: (event) => {
        event.preventDefault();
        setFeedback("预览不执行判题，请在后台切换模拟展示状态。");
      },
      answer,
      setAnswer,
      isPermanentlyLocked: false,
      isTemporarilyLocked: false,
      now: 0,
      canMoveNext: false,
      nextIndex: 0,
      moveTo: noOp,
      feedback:
        feedback ||
        (status === "incorrect"
          ? "答案不正确，请再试一次。"
          : status === "completed"
            ? "回答正确。"
            : ""),
      feedbackTone: feedback
        ? "neutral"
        : status === "incorrect"
          ? "danger"
          : status === "completed"
            ? "success"
            : "neutral",
      feedbackAutoDismiss: false,
      openImages,
      openVideo,
      setTextClue: noOp,
    };
    const Card = desktop ? DesktopQuestCard : QuestCard;
    content = (
      <main className={`quest-layout ${desktop ? "quest-desktop" : ""}`}>
        <QuestWorkspace
          desktop={desktop}
          clues={[]}
          openText={noOp}
          openImages={openImages}
          openVideo={openVideo}
        >
          <Card {...props} />
        </QuestWorkspace>
      </main>
    );
  } else if (message.draft.kind === "narrative") {
    content = <NarrativePreview narrative={message.draft.value} />;
  } else {
    const value = message.draft.value;
    const note = {
      ...value,
      id: "editor-notification",
      sentAt,
      readAt: read ? sentAt : "",
      assignmentId: "",
    };
    content = (
      <main className="editor-preview-letter">
        <NotificationLetterView
          note={note}
          desktop={desktop}
          onRead={() => setRead(true)}
        />
        <NotificationDialog
          notification={
            popup && !media
              ? { ...value, id: note.id, createdAt: sentAt, revision: sentAt }
              : null
          }
          userId=""
          queuedCount={1}
          onClose={() => {
            setPopup(false);
            setRead(true);
          }}
          onOpenImages={openImages}
          onOpenVideo={openVideo}
        />
      </main>
    );
  }
  return (
    <>
      {content}
      <MediaViewer
        state={media}
        onClose={() => setMedia(null)}
        onImageIndexChange={(index) =>
          setMedia((current) =>
            current?.type === "images" ? { ...current, index } : current,
          )
        }
        onVideoPlayingChange={noOp}
      />
    </>
  );
}
