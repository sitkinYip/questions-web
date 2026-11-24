import { uiCopy } from "@/config/ui-copy";
import type { ReactNode } from "react";
import { StarRingEmblem } from "@/components/brand/StarRingEmblem";
import { GameBrand } from "@/features/game/components/GameLayout";
import { GameThemePicker } from "@/features/game/components/GameThemePicker";
import { useImmersiveLight } from "@/design/useImmersiveLight";

export function AuthLayout({ children }: { children: ReactNode }) {
  const light = useImmersiveLight(true);
  return (
    <div className="game-auth">
      <header className="game-auth__header">
        <GameBrand />
        <GameThemePicker />
      </header>
      <main className="game-auth__main">
        <section className="game-auth__story">
          <div className="game-auth__brand-hero">
            <div className="game-auth__mark" aria-hidden="true">
              <StarRingEmblem className="star-ring-loader--hero" />
            </div>
            <h1>{uiCopy.gameLayout.brand}</h1>
          </div>
        </section>
        <section className="game-auth__entry" {...light}>
          <div className="game-auth__entry-inner">{children}</div>
        </section>
      </main>
    </div>
  );
}
