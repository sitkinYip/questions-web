import { VersionSecret } from "../../version/VersionSecret";
import { GameNavigation } from "./GameNavigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeftIcon, StarFourIcon } from "@phosphor-icons/react";
import { GameSidebar } from "../GameSidebar";
import { useGame } from "../useGame";

import { gameReturnPath } from "../game-navigation";
import { useDesktopLayout } from "../../../shared/layout/useDesktopLayout";

export function GameBrand() {
  return (
    <div className="game-brand">
      <VersionSecret />
      <Link
        className="game-brand__wordmark"
        to="/"
        aria-label="Questions · 回到启程"
      >
        QUESTIONS<small>答案之外 · 另有天地</small>
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
        : undefined;
  const contentRef = useRef<HTMLElement>(null);
  const returnTo = gameReturnPath(location.pathname, location.state);
  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  return (
    <div
      className="game-world"
      data-desktop={isDesktop ? desktopMode : undefined}
    >
      <a href="#game-content" className="game-skip-link">
        跳到主要内容
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
            返回正在探索的场次
          </Link>
        )}
        <div key={location.pathname} className="game-page-enter">
          <Outlet />
        </div>
      </main>
      <footer className="game-footer">
        <span />
        <StarFourIcon aria-hidden="true" />
        <p>不必急着找到答案，奇遇就在路上。</p>
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
