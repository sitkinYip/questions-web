import { uiCopy } from "@/config/ui-copy";
import { Tabs } from "radix-ui";
import { GamePageHeading } from "@/features/game/components/GameLayout";
import { PlayerPassport } from "@/features/game/components/PlayerPassport";
import { ProfileEditor } from "@/features/game/components/ProfileEditor";
import { PasswordEditor } from "@/features/game/components/PasswordEditor";
import { useProfileEditor } from "@/features/game/hooks/useProfileEditor";
import { usePasswordEditor } from "@/features/game/hooks/usePasswordEditor";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";
import { DesktopProfile } from "@/features/game/desktop/DesktopProfile";

export function GameProfilePage() {
  const isDesktop = useDesktopLayout();
  const profile = useProfileEditor();
  const security = usePasswordEditor();
  return (
    <>
      <GamePageHeading
        eyebrow={uiCopy.gameProfilePage.eyebrow}
        title={uiCopy.gameProfilePage.title}
      >
        {uiCopy.gameProfilePage.description}
      </GamePageHeading>
      {isDesktop ? (
        <DesktopProfile profile={profile} security={security} />
      ) : (
        <div className="game-profile-grid">
          <PlayerPassport compact />
          <Tabs.Root
            defaultValue="identity"
            className="game-tabs game-profile-tabs"
          >
            <Tabs.List
              className="game-tabs__list"
              aria-label={uiCopy.gameProfilePage.settingsLabel}
            >
              <Tabs.Trigger value="identity">
                {uiCopy.gameProfilePage.identity}
              </Tabs.Trigger>
              <Tabs.Trigger value="security">
                {uiCopy.gameProfilePage.security}
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content
              value="identity"
              className="game-tabs__content"
              forceMount
            >
              <ProfileEditor editor={profile} />
            </Tabs.Content>
            <Tabs.Content value="security" className="game-tabs__content">
              <PasswordEditor editor={security} />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      )}
    </>
  );
}
