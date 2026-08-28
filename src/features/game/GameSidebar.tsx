import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ListIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { Sheet } from "../../components/ui/Sheet";
import { Button } from "../../components/ui/Button";
import { overlayPriority } from "../../components/ui/overlay-context";
import { GameThemePicker } from "./components/GameThemePicker";
import { GameSidebarIdentity } from "./components/GameSidebarIdentity";
import { gameNavigation, gameReturnPath } from "./game-navigation";
import { useGame } from "./useGame";

export function GameSidebar() {
  const { player, avatarUrl, logout } = useGame();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const returnTo = gameReturnPath(location.pathname, location.state);
  return (
    <>
      <button
        className="theme-avatar-trigger game-menu-trigger"
        type="button"
        aria-label="打开冒险者菜单"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="冒险者菜单"
        onClick={(event) => {
          // Safari touch clicks do not focus buttons; preserve the dialog return target.
          event.currentTarget.focus({ preventScroll: true });
          setOpen(true);
        }}
      >
        {avatarUrl ? (
          <img
            className="traveler-avatar"
            src={avatarUrl}
            alt={`${player.displayName}的头像`}
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <span className="traveler-avatar traveler-avatar--fallback">
            {Array.from(player.displayName.trim() || "旅")[0]}
          </span>
        )}
        <span className="game-menu-trigger__glyph" aria-hidden="true">
          <ListIcon />
        </span>
      </button>
      <Sheet
        overlayId="game-sidebar"
        priority={overlayPriority.confirmation}
        open={open}
        onOpenChange={setOpen}
        title="冒险者菜单"
        side="left"
        density="compact"
        className="game-sidebar"
        headerContent={
          <GameSidebarIdentity player={player} avatarUrl={avatarUrl} />
        }
      >
        <div className="game-sidebar__content">
          <nav className="game-sidebar__nav" aria-label="个人导航">
            {returnTo && location.pathname !== returnTo && (
              <Link to={returnTo} onClick={() => setOpen(false)}>
                <span className="game-sidebar__nav-icon">
                  <ArrowLeftIcon aria-hidden="true" />
                </span>
                <span className="game-sidebar__nav-copy">
                  返回答题<small aria-hidden="true">接着刚才的线索继续</small>
                </span>
              </Link>
            )}
            {gameNavigation.map(({ to, description, hint, Icon }) => (
              <Link
                key={to}
                to={to}
                state={{ returnTo }}
                aria-current={location.pathname === to ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="game-sidebar__nav-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="game-sidebar__nav-copy">
                  {description}
                  <small aria-hidden="true">{hint}</small>
                </span>
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <footer className="game-sidebar__footer">
            <div className="game-sidebar__settings">
              <p aria-hidden="true">旅途光线</p>
              <GameThemePicker />
            </div>
            <Button
              variant="ghost"
              className="game-sidebar__logout"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              <SignOutIcon aria-hidden="true" />
              退出登录
            </Button>
          </footer>
        </div>
      </Sheet>
    </>
  );
}
