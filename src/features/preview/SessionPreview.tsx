import { useState } from "react";
import type { ValidatedPreviewMessage } from "./protocol";
import { SessionPreviewPlayer } from "./SessionPreviewPlayer";
import type { SessionBookmark } from "./session-simulation";
export type SessionPreviewValue = Extract<
  ValidatedPreviewMessage["draft"],
  { kind: "session" }
>["value"];
/** Bookmark survives incoming edits; the disposable player below does not. */
export function SessionPreview({
  value,
  revision,
  reset,
  theme,
}: {
  value: SessionPreviewValue;
  revision: number;
  reset: number;
  theme: string;
}) {
  const [bookmark, setBookmark] = useState<SessionBookmark>({
    stage: "brief",
    levelId: value.assignment.levels[0]?.id || "",
  });
  const [selection, setSelection] = useState(0);
  const levelId = value.assignment.levels.some((l) => l.id === bookmark.levelId)
    ? bookmark.levelId
    : value.assignment.levels[0]?.id || "";
  const select = (next: SessionBookmark) => {
    setBookmark(next);
    setSelection((n) => n + 1);
  };
  return (
    <>
      <div className="session-preview-toolbar" aria-label="场次模拟控制">
        <label>
          预览阶段
          <select
            aria-label="预览阶段"
            value={bookmark.stage}
            onChange={(e) =>
              select({
                stage: e.target.value as SessionBookmark["stage"],
                levelId,
              })
            }
          >
            <option value="brief">入场介绍</option>
            <option value="play">关卡答题</option>
            <option value="completed">已通关</option>
          </select>
        </label>
        <label>
          当前关卡
          <select
            aria-label="当前关卡"
            value={levelId}
            disabled={!value.assignment.levels.length}
            onChange={(e) => select({ stage: "play", levelId: e.target.value })}
          >
            {value.assignment.levels.map((l, i) => (
              <option key={l.id} value={l.id}>
                第 {i + 1} 关 · {l.question?.title || "未选题"}
              </option>
            ))}
          </select>
        </label>
        <span>模拟玩家 · 修改配置后保留位置并重置播放</span>
      </div>
      {!!value.issues.length && (
        <div className="editor-preview-status" role="status">
          {value.issues.map((issue, i) => (
            <p key={i}>{issue}</p>
          ))}
        </div>
      )}
      {!value.assignment.levels.length ? (
        <p className="editor-preview-status" role="status">
          添加关卡并选择题目后，即可预览场次流程。
        </p>
      ) : (
        <SessionPreviewPlayer
          key={`${revision}:${reset}:${theme}:${selection}`}
          value={value}
          initial={{ ...bookmark, levelId }}
          onBookmark={setBookmark}
        />
      )}
    </>
  );
}
