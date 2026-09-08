import { uiCopy } from "@/config/ui-copy";
import { useState, useSyncExternalStore } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRightIcon, KeyIcon } from "@phosphor-icons/react";
import { authState, gameApi } from "@/api/game.client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/FormControls";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AuthLayout } from "@/features/game/components/AuthLayout";
import { GameFailure } from "@/features/game/components/GameState";

export function GameLoginPage() {
  const auth = useSyncExternalStore(authState.subscribe, authState.get);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const mutation = useMutation({
    mutationFn: () => gameApi.login(account, password),
    onSuccess: () => {
      const from = location.state?.from;
      navigate(
        typeof from === "string" && /^\/(?!\/)/.test(from) ? from : "/",
        { replace: true },
      );
    },
  });
  if (auth) return <Navigate to="/" replace />;
  return (
    <AuthLayout>
      <div className="game-auth__seal">
        <KeyIcon weight="thin" aria-hidden="true" />
      </div>
      <h2>
        {uiCopy.gameLoginPage.titleFirstLine}
        <br />
        {uiCopy.gameLoginPage.titleSecondLine}
      </h2>
      <p className="game-muted">{uiCopy.gameLoginPage.description}</p>
      <form
        className="game-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!mutation.isPending) mutation.mutate();
        }}
        aria-busy={mutation.isPending}
      >
        <Field label={uiCopy.gameLoginPage.username}>
          <Input
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder={uiCopy.gameLoginPage.usernamePlaceholder}
            value={account}
            disabled={mutation.isPending}
            onChange={(event) => setAccount(event.target.value)}
          />
        </Field>
        <Field label={uiCopy.gameLoginPage.password}>
          <PasswordInput
            autoComplete="current-password"
            required
            placeholder={uiCopy.gameLoginPage.passwordPlaceholder}
            value={password}
            disabled={mutation.isPending}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {mutation.isError && <GameFailure error={mutation.error} />}
        <Button
          type="submit"
          variant="primary"
          className="game-cta"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? uiCopy.gameLoginPage.pending
            : uiCopy.gameLoginPage.submit}
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </form>
      <details className="game-auth__help">
        <summary>{uiCopy.gameLoginPage.helpTitle}</summary>
        <p>{uiCopy.gameLoginPage.helpDescription}</p>
      </details>
    </AuthLayout>
  );
}
