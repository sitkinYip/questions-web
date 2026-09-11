import "@e2e/motion-lab.css";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { ClueTextDialog } from "@/features/clues/ClueTextDialog";
import { MultiQuestClueDialog } from "@/features/clues/MultiQuestClueDialog";
import { RankUpDialog } from "@/features/rank/RankUpDialog";
import { CompletionFeedbackDialog } from "@/features/completion/CompletionFeedbackDialog";
import { NotificationDialog } from "@/features/notification/NotificationDialog";
import {
  MediaViewer,
  type MediaViewerState,
} from "@/features/media/MediaViewer";
import { RichContent } from "@/features/content/RichContent";
import type {
  QuestClue,
  MultiQuestClue,
  QuestRank,
} from "@/domain/quest/types";
import type { Notification } from "@/domain/notification/types";

const image = "/e2e/assets/question-landscape.svg";
const textClue: QuestClue = {
  id: "motion-clue",
  title: "星图线索",
  kind: "text",
  content: "沿着星光，寻找下一段故事。",
  autoPlay: false,
  imageUrls: [],
};
const multi: MultiQuestClue = {
  id: "motion-multi",
  qas: "1,2",
  revision: "1",
  title: "组合线索",
  content: "两束微光交汇，地图显露新的路径。",
  description: "线索已收集",
  buttonText: "收起线索",
};
const rank: QuestRank = {
  name: "星图旅人",
  code: "3",
  isSpecial: false,
  numericValue: 3,
};
const notice = {
  id: "motion-note",
  title: "新的来信",
  popupTitle: "一封来自星空的信",
  content: "请收下这份旅途的祝福。",
  buttonText: "收下信件",
  createdAt: "2026-09-11",
  revision: "1",
} as Notification;

/** Dev-only, deterministic animation fixtures. Never imported by production. */
export function MotionLab() {
  const [active, setActive] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaViewerState>(null);
  const close = () => setActive(null);
  return (
    <main className="motion-lab">
      <p className="eyebrow">动画专项 · 本地模拟</p>
      <h1>进入、收起，再次相逢。</h1>
      <p>使用关闭按钮、Esc 或遮罩检查退场；调整窗口检查底部与侧边方向。</p>
      <nav>
        {[
          "奖品详情",
          "左侧导航",
          "文字线索",
          "组合线索",
          "等级提升",
          "完成反馈",
          "通知",
          "媒体",
        ].map((name) => (
          <Button
            key={name}
            onClick={() =>
              name === "媒体"
                ? setMedia({ type: "images", urls: [image], index: 0 })
                : setActive(name)
            }
          >
            {name}
          </Button>
        ))}
      </nav>
      <Sheet
        overlayId="motion-reward"
        open={active === "奖品详情"}
        onOpenChange={(open) => !open && close()}
        title="旅途纪念"
        mobileSide="bottom"
      >
        <p>记录这段旅程的微光。</p>
        {Array.from({ length: 12 }, (_, index) => (
          <p key={index}>领取指引 {index + 1} · 在星光下找到属于你的礼物。</p>
        ))}
        <RichContent source={`{{${image}}}`} />
      </Sheet>
      <Sheet
        overlayId="motion-left"
        side="left"
        open={active === "左侧导航"}
        onOpenChange={(open) => !open && close()}
        title="冒险导航"
      >
        <p>从左侧进入，并原路收起。</p>
      </Sheet>
      <ClueTextDialog
        clue={active === "文字线索" ? textClue : null}
        onClose={close}
      />
      <MultiQuestClueDialog
        clue={multi}
        open={active === "组合线索"}
        onClose={close}
      />
      <RankUpDialog
        rank={active === "等级提升" ? rank : null}
        onClose={close}
      />
      <CompletionFeedbackDialog
        variant={active === "完成反馈" ? "final" : null}
        completedCount={3}
        onContinue={close}
      />
      <NotificationDialog
        notification={active === "通知" ? notice : null}
        userId="motion-lab"
        queuedCount={0}
        onClose={close}
        onOpenImages={(urls) => setMedia({ type: "images", urls, index: 0 })}
        onOpenVideo={(url) => setMedia({ type: "video", url })}
      />
      <MediaViewer
        state={media}
        onClose={() => setMedia(null)}
        onImageIndexChange={() => {}}
        onVideoPlayingChange={() => {}}
      />
    </main>
  );
}
