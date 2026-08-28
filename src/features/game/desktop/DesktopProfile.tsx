import { IdentificationCardIcon } from "@phosphor-icons/react";
import { PlayerPassport } from "../components/PlayerPassport";
import { ProfileEditor } from "../components/ProfileEditor";
import { PasswordEditor } from "../components/PasswordEditor";
import type { useProfileEditor } from "../hooks/useProfileEditor";
import type { usePasswordEditor } from "../hooks/usePasswordEditor";

export function DesktopProfile({
  profile,
  security,
}: {
  profile: ReturnType<typeof useProfileEditor>;
  security: ReturnType<typeof usePasswordEditor>;
}) {
  return (
    <div className="desktop-profile">
      <PlayerPassport />
      <section className="desktop-profile__identity" aria-label="我的名片">
        <div className="game-section-title">
          <IdentificationCardIcon aria-hidden="true" />
          <h2>让旅途记住你。</h2>
        </div>
        <p className="game-muted">更新名片，带着新的模样出发。</p>
        <ProfileEditor editor={profile} />
      </section>
      <PasswordEditor editor={security} />
    </div>
  );
}
