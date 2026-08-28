import type { ReactNode } from "react";
import { StarFourIcon } from "@phosphor-icons/react";
import { CelestialAtlas } from "../../../components/effects/CelestialAtlas";
import { GameBrand } from "./GameLayout";
import { GameThemePicker } from "./GameThemePicker";

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
            <p className="eyebrow">一场属于你的解谜之旅</p>
            <h1>
              答案之外，
              <br />
              另有天地。
            </h1>
            <p>循着线索，走进属于你的故事。</p>
            <span className="game-auth__ornament">
              <i />
              <StarFourIcon aria-hidden="true" />
              <i />
            </span>
          </div>
        </section>
        <section className="game-auth__entry">{children}</section>
      </main>
      <footer className="game-auth__footer">每一个问题，都是一扇门。</footer>
    </div>
  );
}
