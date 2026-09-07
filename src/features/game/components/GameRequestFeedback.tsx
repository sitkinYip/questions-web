import { useState } from "react";
import { ArrowsClockwiseIcon, BroadcastIcon } from "@phosphor-icons/react";
import { AppDialog } from "../../../components/ui/Dialog";
import { AppToast } from "../../../components/ui/Toast";
import { Button } from "../../../components/ui/Button";

/** Mounted only during an outage: dismiss once, re-arm after recovery. */
export function GameSyncMessage() {
  const [open, setOpen] = useState(true);
  return (
    <AppToast
      open={open}
      onOpenChange={setOpen}
      className="game-sync-message"
      title="同步暂时中断"
      description="当前页面和输入仍保留，连接恢复后会自动同步。"
    />
  );
}

export function GameRetryDialog({
  open,
  pending,
  action,
  onRetry,
  onDismiss,
}: {
  open: boolean;
  pending: boolean;
  action: "answer" | "start";
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const title = action === "answer" ? "答案还在，等待回音" : "旅程正在等待连接";
  return (
    <AppDialog
      overlayId="game-request-retry"
      priority={95}
      open={open}
      onOpenChange={(value) => {
        if (!value && !pending) onDismiss();
      }}
      accessibleTitle={title}
      accessibleDescription="连接暂时中断，可以留在当前页面重试。"
      overlayClassName="game-retry-overlay"
      contentClassName="game-retry-dialog"
      closeOnEscape={!pending}
      closeOnOutside={false}
    >
      <div className="game-retry-signal" aria-hidden="true">
        <BroadcastIcon weight="light" />
      </div>
      <p className="eyebrow">旅途信号 · 暂时中断</p>
      <h2>{title}</h2>
      <p className="game-retry-detail">
        {action === "answer"
          ? "暂时未能确认提交结果。你的输入仍在，重试会确认同一次提交，不会重复计次。"
          : "暂时未能确认开启结果。留在这里重新连接，就能继续你的冒险。"}
      </p>
      <div className="game-retry-actions" aria-busy={pending}>
        <Button onClick={onRetry} disabled={pending}>
          <ArrowsClockwiseIcon aria-hidden="true" />
          {pending ? "正在重新连接…" : "重新连接"}
        </Button>
        <Button variant="ghost" onClick={onDismiss} disabled={pending}>
          留在当前页面
        </Button>
      </div>
      <p className="sr-only" role="status">
        {pending ? "正在确认请求结果，请稍候" : "连接失败，可以重试"}
      </p>
    </AppDialog>
  );
}
