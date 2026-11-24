import { useState } from "react";
import { CaretRightIcon } from "@phosphor-icons/react";
import { uiCopy } from "@/config/ui-copy";
import { Sheet } from "@/components/ui/Sheet";
import { overlayPriority } from "@/components/ui/overlay-context";
import { useOptionalTheme } from "@/components/ui/theme-context";
import { GamePageHeading } from "@/features/game/components/GameLayout";
import { PlayerPassport } from "@/features/game/components/PlayerPassport";
import {
  ProfileAvatarCrop,
  ProfileEditor,
} from "@/features/game/components/ProfileEditor";
import { PasswordEditor } from "@/features/game/components/PasswordEditor";
import { GameThemePicker } from "@/features/game/components/GameThemePicker";
import { useProfileEditor } from "@/features/game/hooks/useProfileEditor";
import { usePasswordEditor } from "@/features/game/hooks/usePasswordEditor";
import { useAssignments, useRewards } from "@/features/game/game-queries";
import { useGame } from "@/features/game/useGame";

type PassportSheet = "profile" | "password" | "theme" | null;

export function GameProfilePage() {
  const { logout } = useGame();
  const theme = useOptionalTheme();
  const profile = useProfileEditor();
  const security = usePasswordEditor();
  const assignments = useAssignments();
  const rewards = useRewards();
  const [activeSheet, setActiveSheet] = useState<PassportSheet>(null);

  const assignmentItems = assignments.data?.items;
  const rewardItems = rewards.data?.items;
  const stats = {
    solved: assignmentItems
      ? assignmentItems.reduce((sum, item) => sum + item.completedLevels, 0)
      : null,
    sessions: assignmentItems
      ? assignmentItems.filter((item) => item.status !== "cancelled").length
      : null,
    rewards: rewardItems ? rewardItems.length : null,
  };

  const themeLabel =
    theme?.preference === "light"
      ? uiCopy.gameThemePicker.light
      : theme?.preference === "dark"
        ? uiCopy.gameThemePicker.dark
        : uiCopy.gameThemePicker.system;

  return (
    <>
      <GamePageHeading title={uiCopy.gameNavigation.profile} />

      <div className="passport-grid">
        <PlayerPassport stats={stats} />

        <section
          className="passport-settings"
          aria-label={uiCopy.gameProfilePage.settingsLabel}
        >
          <button
            type="button"
            className="passport-setting-item"
            onClick={() => setActiveSheet("profile")}
          >
            <span>修改资料</span>
            <CaretRightIcon size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="passport-setting-item"
            onClick={() => setActiveSheet("password")}
          >
            <span>修改密码</span>
            <CaretRightIcon size={16} aria-hidden="true" />
          </button>

          {theme && (
            <button
              type="button"
              className="passport-setting-item"
              onClick={() => setActiveSheet("theme")}
            >
              <span>外观</span>
              <span className="passport-setting-item__val">
                <span>{themeLabel}</span>
                <CaretRightIcon size={16} aria-hidden="true" />
              </span>
            </button>
          )}

          <button
            type="button"
            className="passport-setting-item passport-setting-item--danger"
            onClick={logout}
          >
            <span>{uiCopy.gameSidebar.logout}</span>
          </button>
        </section>
      </div>

      <Sheet
        overlayId="passport-profile"
        priority={overlayPriority.content}
        open={activeSheet === "profile"}
        onOpenChange={(open) => setActiveSheet(open ? "profile" : null)}
        title="修改资料"
        side="right"
        mobileSide="bottom"
        density="compact"
        className="passport-sheet"
      >
        <ProfileEditor editor={profile} renderCropDialog={false} />
      </Sheet>
      <ProfileAvatarCrop editor={profile} />

      <Sheet
        overlayId="passport-password"
        priority={overlayPriority.content}
        open={activeSheet === "password"}
        onOpenChange={(open) => setActiveSheet(open ? "password" : null)}
        title="修改密码"
        side="right"
        mobileSide="bottom"
        density="compact"
        className="passport-sheet"
      >
        <PasswordEditor editor={security} hideHeading />
      </Sheet>

      {theme && (
        <Sheet
          overlayId="passport-theme"
          priority={overlayPriority.content}
          open={activeSheet === "theme"}
          onOpenChange={(open) => setActiveSheet(open ? "theme" : null)}
          title="外观"
          side="right"
          mobileSide="bottom"
          density="compact"
          className="passport-sheet passport-sheet--theme"
        >
          <div className="passport-theme-sheet">
            <GameThemePicker />
          </div>
        </Sheet>
      )}
    </>
  );
}
