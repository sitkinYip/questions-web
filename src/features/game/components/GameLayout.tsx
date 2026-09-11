import { uiCopy } from "@/config/ui-copy";
import { VersionSecret } from "@/features/version/VersionSecret";
import { GameNavigation } from "@/features/game/components/GameNavigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeftIcon, StarFourIcon } from "@phosphor-icons/react";
import { GameSidebar } from "@/features/game/GameSidebar";
import { useGame } from "@/features/game/useGame";

import { gameReturnPath } from "@/features/game/game-navigation";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";

export function GameBrand() {
  return (
    <div className="game-brand">
      <VersionSecret />
      <Link
        className="game-brand__wordmark"
        to="/"
        aria-label={uiCopy.gameLayout.homeLabel}
      >
        {uiCopy.gameLayout.brand}
        <small>{uiCopy.gameLayout.tagline}</small>
      </Link>
    </div>
  );
}

export function GameLayout() {
  const isDesktop = useDesktopLayout();
  const { player } = useGame();
  const location = useLocation();
  const desktopMode =
    location.pathname === "/profile"
      ? "profile"
      : location.pathname === "/notifications"
        ? "inbox"
        : "standard";
  const contentRef = useRef<HTMLElement>(null);
  const returnTo = gameReturnPath(location.pathname, location.state);
  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true });
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  return (
    <div
      className="game-world"
      data-page={
        location.pathname === "/"
          ? "lobby"
          : location.pathname === "/notifications"
            ? "inbox"
            : "scroll"
      }
      data-desktop={isDesktop ? desktopMode : undefined}
    >
      <a href="#game-content" className="game-skip-link">
        {uiCopy.gameLayout.skipContent}
      </a>
      <header className="game-topbar">
        <GameBrand />
        <div className="game-topbar__player">
          <span>
            {player.displayName}
            <small>{player.level.name}</small>
          </span>
          <GameSidebar />
        </div>
      </header>
      <GameNavigation returnTo={returnTo} />
      <main
        id="game-content"
        ref={contentRef}
        tabIndex={-1}
        className="game-shell"
      >
        {returnTo && (
          <Link className="game-return-link" to={returnTo}>
            <ArrowLeftIcon aria-hidden="true" />
            {uiCopy.gameLayout.backToAssignment}
          </Link>
        )}
        <div key={location.pathname} className="game-page-enter">
          <Outlet />
        </div>
      </main>
      <footer className="game-footer">
        <span />
        <StarFourIcon aria-hidden="true" />
        <p>{uiCopy.gameLayout.footer}</p>
        <span />
      </footer>
    </div>
  );
}

export function GamePageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="game-page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p className="game-page-heading__description">{children}</p>}
    </header>
  );
}
