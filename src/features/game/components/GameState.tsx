import { uiCopy } from "@/config/ui-copy";
import type { ReactNode } from "react";
import {
  CompassIcon,
  HouseLineIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function GameFailure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <section className="game-notice" role="alert">
      <WarningCircleIcon aria-hidden="true" />
      <div className="game-notice__body">
        <p>{error instanceof Error ? error.message : uiCopy.gameState.error}</p>
        <div className="game-notice__actions">
          {retry && (
            <Button size="small" onClick={retry}>
              {uiCopy.gameState.retry}
            </Button>
          )}
          <Link className="game-action-link game-action-link--primary" to="/">
            <HouseLineIcon aria-hidden="true" />
            {uiCopy.gameState.home}
          </Link>
        </div>
      </div>
    </section>
  );
}
export function GameEmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="game-empty">
      <CompassIcon weight="thin" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </section>
  );
}
export function GameLoading({
  label = uiCopy.gameState.loading,
}: {
  label?: string;
}) {
  return (
    <section className="game-loading" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {[0, 1].map((item) => (
        <div className="game-loading__card" key={item} aria-hidden="true">
          <i />
          <span />
          <span />
        </div>
      ))}
    </section>
  );
}
