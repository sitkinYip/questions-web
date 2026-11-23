import type { ReactNode } from "react";
import { StarfieldBackdrop } from "@/components/effects/StarfieldBackdrop";
import { GameBrand } from "@/features/game/components/GameLayout";
import { GameThemePicker } from "@/features/game/components/GameThemePicker";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="game-auth">
      <StarfieldBackdrop variant="auth" />
      <header className="game-auth__header">
        <GameBrand />
        <GameThemePicker />
      </header>
      <main className="game-auth__main">
        <section className="game-auth__entry">{children}</section>
      </main>
    </div>
  );
}
