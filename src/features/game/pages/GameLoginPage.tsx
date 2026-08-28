import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRightIcon, KeyIcon } from "@phosphor-icons/react";
import { gameApi } from "../../../api/game.client";
import { Button } from "../../../components/ui/Button";
import { Field, Input } from "../../../components/ui/FormControls";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { AuthLayout } from "../components/AuthLayout";
import { GameFailure } from "../components/GameState";

export function GameLoginPage() {
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
  return (
    <AuthLayout>
      <div className="game-auth__seal">
        <KeyIcon weight="thin" aria-hidden="true" />
      </div>
      <h2>
        以你的名字，
        <br />
        开启冒险。
      </h2>
      <p className="game-muted">带上你的账号，剩下的交给好奇心。</p>
      <form
        className="game-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!mutation.isPending) mutation.mutate();
        }}
        aria-busy={mutation.isPending}
      >
        <Field label="登录账号">
          <Input
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="你的冒险者账号"
            value={account}
            disabled={mutation.isPending}
            onChange={(event) => setAccount(event.target.value)}
          />
        </Field>
        <Field label="密码">
          <PasswordInput
            autoComplete="current-password"
            required
            placeholder="输入通行密语"
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
          {mutation.isPending ? "正在打开故事…" : "进入冒险"}
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </form>
      <details className="game-auth__help">
        <summary>还没有账号，或忘记了密码？</summary>
        <p>
          账号由现场工作人员提供，暂不开放注册。忘记密码时，请联系工作人员重置。
        </p>
      </details>
    </AuthLayout>
  );
}
