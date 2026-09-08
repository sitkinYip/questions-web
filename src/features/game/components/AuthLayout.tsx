import { uiCopy } from "@/config/ui-copy";
import type { ReactNode } from "react";
import { StarFourIcon } from "@phosphor-icons/react";
import { CelestialAtlas } from "@/components/effects/CelestialAtlas";
import { GameBrand } from "@/features/game/components/GameLayout";
import { GameThemePicker } from "@/features/game/components/GameThemePicker";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="game-auth">
      <header className="game-auth__header">
        <GameBrand />
        <GameThemePicker />
      </header>
      <main className="game-auth__main">
        <section className="game-auth__story">
          <CelestialAtlas />
          <div className="game-auth__story-copy">
            <p className="eyebrow">{uiCopy.authLayout.eyebrow}</p>
            <h1>
              {uiCopy.authLayout.titleFirstLine}
              <br />
              {uiCopy.authLayout.titleSecondLine}
            </h1>
            <p>{uiCopy.authLayout.description}</p>
            <span className="game-auth__ornament">
              <i />
              <StarFourIcon aria-hidden="true" />
              <i />
            </span>
          </div>
        </section>
        <section className="game-auth__entry">{children}</section>
      </main>
      <footer className="game-auth__footer">{uiCopy.authLayout.footer}</footer>
    </div>
  );
}
