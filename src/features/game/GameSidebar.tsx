import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type MouseEventHandler,
  type PointerEvent,
} from "react";
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
import { useDesktopLayout } from "../../shared/layout/useDesktopLayout";
import { GameThemePicker } from "./components/GameThemePicker";
import { GameSidebarIdentity } from "./components/GameSidebarIdentity";
import { gameNavigation, gameReturnPath } from "./game-navigation";
import { useGame } from "./useGame";

const accountPopoverCloseDelay = 100;
const accountPopoverExitDuration = 240;

function GameMenuAvatar({
  expanded,
  controls,
  showGlyph = false,
  onClick,
}: {
  expanded: boolean;
  controls?: string;
  showGlyph?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  const { player, avatarUrl } = useGame();
  return (
    <button
      className={`theme-avatar-trigger game-menu-trigger${
        showGlyph ? "" : " game-menu-trigger--desktop"
      }`}
      type="button"
      aria-label="打开冒险者菜单"
      aria-haspopup="dialog"
      aria-controls={controls}
      aria-expanded={expanded}
      title="冒险者菜单"
      onClick={onClick}
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
      {showGlyph && (
        <span className="game-menu-trigger__glyph" aria-hidden="true">
          <ListIcon />
        </span>
      )}
    </button>
  );
}

function DesktopGameMenu() {
  const { player, logout } = useGame();
  const location = useLocation();
  const returnTo = gameReturnPath(location.pathname, location.state);
  const popupId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);
  const openFrame = useRef<number | null>(null);
  const suppressFocusOpen = useRef(false);
  const [rendered, setRendered] = useState(false);
  const [open, setOpen] = useState(false);

  const cancelClose = useCallback(() => {
    if (closeTimer.current === null) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const cancelExit = useCallback(() => {
    if (exitTimer.current !== null) {
      window.clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    if (openFrame.current !== null) {
      window.cancelAnimationFrame(openFrame.current);
      openFrame.current = null;
    }
  }, []);

  const showMenu = useCallback(() => {
    cancelClose();
    cancelExit();
    if (rendered) {
      setOpen(true);
      return;
    }
    setRendered(true);
    openFrame.current = window.requestAnimationFrame(() => {
      openFrame.current = null;
      setOpen(true);
    });
  }, [cancelClose, cancelExit, rendered]);

  const hideMenu = useCallback(() => {
    cancelClose();
    cancelExit();
    setOpen(false);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    exitTimer.current = window.setTimeout(
      () => {
        exitTimer.current = null;
        setRendered(false);
      },
      reduceMotion ? 0 : accountPopoverExitDuration,
    );
  }, [cancelClose, cancelExit]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      hideMenu();
    }, accountPopoverCloseDelay);
  }, [cancelClose, hideMenu]);

  useEffect(() => {
    if (!open) return;
    const closeFromOutside = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) hideMenu();
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      suppressFocusOpen.current = true;
      hideMenu();
      triggerRef.current?.querySelector("button")?.focus();
      queueMicrotask(() => {
        suppressFocusOpen.current = false;
      });
    };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [hideMenu, open]);

  useEffect(
    () => () => {
      cancelClose();
      cancelExit();
    },
    [cancelClose, cancelExit],
  );

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") showMenu();
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") scheduleClose();
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    )
      return;
    scheduleClose();
  }

  function handleFocus() {
    if (!suppressFocusOpen.current) showMenu();
  }

  return (
    <div
      ref={rootRef}
      className="game-account-menu"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <div ref={triggerRef}>
        <GameMenuAvatar controls={popupId} expanded={open} onClick={showMenu} />
      </div>
      {rendered && (
        <section
          id={popupId}
          className="game-account-popover"
          data-state={open ? "open" : "closed"}
          role="dialog"
          aria-label="冒险者菜单"
          aria-hidden={!open}
          inert={!open}
        >
          <header className="game-account-popover__header">
            <span title={player.displayName}>{player.displayName}</span>
            <small>
              {player.level.name} · <strong>{player.totalXp} EXP</strong>
            </small>
          </header>
          <nav className="game-account-popover__nav" aria-label="个人导航">
            {returnTo && location.pathname !== returnTo && (
              <Link to={returnTo} onClick={() => setOpen(false)}>
                <span className="game-account-popover__icon">
                  <ArrowLeftIcon aria-hidden="true" />
                </span>
                <span>
                  返回答题<small aria-hidden="true">接着刚才的线索继续</small>
                </span>
                <ArrowRightIcon aria-hidden="true" />
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
                <span className="game-account-popover__icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>
                  {description}
                  <small aria-hidden="true">{hint}</small>
                </span>
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="game-account-popover__settings">
            <span>界面主题</span>
            <GameThemePicker />
          </div>
          <Button
            variant="ghost"
            className="game-account-popover__logout"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <SignOutIcon aria-hidden="true" />
            <span>退出登录</span>
          </Button>
        </section>
      )}
    </div>
  );
}

function MobileGameSidebar() {
  const { player, avatarUrl, logout } = useGame();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [sheetSide, setSheetSide] = useState<"left" | "right">("left");
  const returnTo = gameReturnPath(location.pathname, location.state);
  return (
    <>
      <GameMenuAvatar
        expanded={open}
        showGlyph
        onClick={(event) => {
          // Safari touch clicks do not focus buttons; preserve the dialog return target.
          event.currentTarget.focus({ preventScroll: true });
          const bounds = event.currentTarget.getBoundingClientRect();
          setSheetSide(
            bounds.left + bounds.width / 2 > window.innerWidth / 2
              ? "right"
              : "left",
          );
          setOpen(true);
        }}
      />
      <Sheet
        overlayId="game-sidebar"
        priority={overlayPriority.confirmation}
        open={open}
        onOpenChange={setOpen}
        title="冒险者菜单"
        side={sheetSide}
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

export function GameSidebar() {
  return useDesktopLayout() ? <DesktopGameMenu /> : <MobileGameSidebar />;
}
