import { uiCopy } from "@/config/ui-copy";
import { VersionSecret } from "@/features/version/VersionSecret";
import { GameNavigation } from "@/features/game/components/GameNavigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  CaretRightIcon,
  MoonIcon,
  SunIcon,
} from "@phosphor-icons/react";
import { useGame } from "@/features/game/useGame";
import { experienceProgress } from "@/features/game/game-presentation";
import { gameReturnPath } from "@/features/game/game-navigation";
import { useDesktopLayout } from "@/shared/layout/useDesktopLayout";
import { useOptionalTheme } from "@/components/ui/theme-context";
import { StarRing } from "@/design/components/StarRing";
import { PlayerAvatar } from "@/features/game/components/PlayerPassport";

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
      </Link>
    </div>
  );
}

export function GameLayout() {
  const isDesktop = useDesktopLayout();
  const { player, avatarUrl } = useGame();
  const theme = useOptionalTheme();
  const location = useLocation();
  const isLobby = location.pathname === "/";
  const isProfile = location.pathname === "/profile";
  const desktopMode = isProfile
    ? "profile"
    : location.pathname === "/notifications"
      ? "inbox"
      : "standard";
  const contentRef = useRef<HTMLElement>(null);
  const returnTo = gameReturnPath(location.pathname, location.state);
  const { percent } = experienceProgress(player);
  const isDark = theme?.resolvedTheme === "dark";

  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true });
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div
      className="game-world"
      data-page={
        isLobby
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

      {isDesktop ? (
        <header className="game-topbar">
          <GameBrand />
          <GameNavigation returnTo={returnTo} desktopInline />
          <div className="game-topbar__actions">
            {theme && (
              <button
                type="button"
                className="game-topbar__theme-btn"
                aria-label={isDark ? "切换浅色模式" : "切换深色模式"}
                onClick={() => theme.setPreference(isDark ? "light" : "dark")}
              >
                {isDark ? (
                  <SunIcon size={18} aria-hidden="true" />
                ) : (
                  <MoonIcon size={18} aria-hidden="true" />
                )}
              </button>
            )}
            <Link
              to="/profile"
              state={{ returnTo }}
              className="game-topbar__passport"
              aria-current={isProfile ? "page" : undefined}
              aria-label="打开护照"
            >
              <StarRing
                progress={percent / 100}
                size={34}
                strokeWidth={2.5}
                glow
              >
                <PlayerAvatar name={player.displayName} url={avatarUrl} />
              </StarRing>
              <span className="game-topbar__passport-meta">
                <span className="game-topbar__passport-name">
                  {player.displayName}
                </span>
                <span className="game-topbar__passport-level tabular-nums">
                  Lv.{player.level.order}
                  {player.level.name ? ` · ${player.level.name}` : ""}
                </span>
              </span>
            </Link>
          </div>
        </header>
      ) : (
        isLobby && (
          <header className="game-topbar game-topbar--mobile-lobby">
            <Link
              to="/profile"
              state={{ returnTo }}
              className="game-player-pill"
              aria-label="打开护照"
            >
              <StarRing
                progress={percent / 100}
                size={42}
                strokeWidth={2.8}
                glow
              >
                <PlayerAvatar name={player.displayName} url={avatarUrl} />
              </StarRing>
              <span className="game-player-pill__meta">
                <span className="game-player-pill__name">
                  {player.displayName}
                </span>
                <span className="game-player-pill__sub">
                  <span className="game-player-pill__level tabular-nums">
                    Lv.{player.level.order}
                  </span>
                  {player.level.name && (
                    <>
                      <span
                        className="game-player-pill__dot"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                      <span className="game-player-pill__title">
                        {player.level.name}
                      </span>
                    </>
                  )}
                </span>
              </span>
              <CaretRightIcon
                size={13}
                weight="bold"
                className="game-player-pill__caret"
                aria-hidden="true"
              />
            </Link>
            <div className="game-topbar__brand-badge">
              <VersionSecret />
            </div>
          </header>
        )
      )}

      {!isDesktop && <GameNavigation returnTo={returnTo} />}

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
    </div>
  );
}

export function GamePageHeading({
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="game-page-heading">
      <h1>{title}</h1>
      {children}
    </header>
  );
}
