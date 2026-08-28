import { useEffect, useRef, type ReactNode } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  CompassIcon,
  StarFourIcon,
} from "@phosphor-icons/react";
import { GameSidebar } from "../GameSidebar";
import { useGame } from "../useGame";

import { gameNavigation, gameReturnPath } from "../game-navigation";
import { useDesktopLayout } from "../../../shared/layout/useDesktopLayout";

export function GameBrand() {
  return (
    <Link className="game-brand" to="/" aria-label="Questions · 回到启程">
      <CompassIcon weight="thin" aria-hidden="true" />
      <span>
        QUESTIONS<small>答案之外 · 另有天地</small>
      </span>
    </Link>
  );
}

export function GameLayout({
  children,
  desktopMode,
}: {
  children: ReactNode;
  desktopMode?: "profile" | "inbox";
}) {
  const isDesktop = useDesktopLayout();
  const { player } = useGame();
  const location = useLocation();
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
      <nav className="game-navigation" aria-label="冒险导航">
        {gameNavigation.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} state={{ returnTo }}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
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
          {children}
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
