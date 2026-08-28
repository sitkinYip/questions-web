import { Tabs } from "radix-ui";
import { GameLayout, GamePageHeading } from "../components/GameLayout";
import { PlayerPassport } from "../components/PlayerPassport";
import { ProfileEditor } from "../components/ProfileEditor";
import { PasswordEditor } from "../components/PasswordEditor";
import { useProfileEditor } from "../hooks/useProfileEditor";
import { usePasswordEditor } from "../hooks/usePasswordEditor";
import { useDesktopLayout } from "../../../shared/layout/useDesktopLayout";
import { DesktopProfile } from "../desktop/DesktopProfile";

export function GameProfilePage() {
  const isDesktop = useDesktopLayout();
  const profile = useProfileEditor();
  const security = usePasswordEditor();
  return (
    <GameLayout desktopMode="profile">
      <GamePageHeading eyebrow="每一个名字，都有自己的故事" title="冒险者护照">
        让旅途记住你的模样。
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
            <Tabs.List className="game-tabs__list" aria-label="护照设置">
              <Tabs.Trigger value="identity">我的名片</Tabs.Trigger>
              <Tabs.Trigger value="security">账号安全</Tabs.Trigger>
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
    </GameLayout>
  );
}
