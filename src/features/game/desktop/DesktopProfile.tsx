import { uiCopy } from "@/config/ui-copy";
import { IdentificationCardIcon } from "@phosphor-icons/react";
import { PlayerPassport } from "@/features/game/components/PlayerPassport";
import { ProfileEditor } from "@/features/game/components/ProfileEditor";
import { PasswordEditor } from "@/features/game/components/PasswordEditor";
import type { useProfileEditor } from "@/features/game/hooks/useProfileEditor";
import type { usePasswordEditor } from "@/features/game/hooks/usePasswordEditor";

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
      <section
        className="desktop-profile__identity"
        aria-label={uiCopy.desktopProfile.label}
      >
        <div className="game-section-title">
          <IdentificationCardIcon aria-hidden="true" />
          <h2>{uiCopy.desktopProfile.title}</h2>
        </div>
        <p className="game-muted">{uiCopy.desktopProfile.description}</p>
        <ProfileEditor editor={profile} />
      </section>
      <PasswordEditor editor={security} />
    </div>
  );
}
