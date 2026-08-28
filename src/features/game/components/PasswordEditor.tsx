import { KeyIcon } from "@phosphor-icons/react";
import { Button } from "../../../components/ui/Button";
import { Field } from "../../../components/ui/FormControls";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { GameFailure } from "./GameState";

import type { usePasswordEditor } from "../hooks/usePasswordEditor";

export function PasswordEditor({
  editor,
  forced = false,
}: {
  editor: ReturnType<typeof usePasswordEditor>;
  forced?: boolean;
}) {
  const {
    logout,
    old,
    setOld,
    password,
    setPassword,
    confirmation,
    setConfirmation,
    validation,
    setValidation,
    mutation,
  } = editor;
  return (
    <section className="game-password-section">
      <div className="game-section-title">
        <KeyIcon aria-hidden="true" />
        <h2>{forced ? "首次登录，请先修改密码" : "给你的故事，上把锁。"}</h2>
      </div>
      <p className="game-muted">
        设置只有你知道的通行密语。使用 10—71 个字符。
      </p>
      <form
        className="game-form"
        aria-busy={mutation.isPending}
        onSubmit={(event) => {
          event.preventDefault();
          if (password !== confirmation) {
            setValidation("两次新密码不一致，请再核对一下。");
            return;
          }
          setValidation("");
          if (!mutation.isPending) mutation.mutate();
        }}
      >
        <Field label="当前密码">
          <PasswordInput
            autoComplete="current-password"
            required
            value={old}
            disabled={mutation.isPending}
            onChange={(event) => {
              setOld(event.target.value);
              mutation.reset();
            }}
          />
        </Field>
        <Field label="新密码">
          <PasswordInput
            autoComplete="new-password"
            minLength={10}
            maxLength={71}
            required
            value={password}
            disabled={mutation.isPending}
            onChange={(event) => {
              setPassword(event.target.value);
              setValidation("");
              mutation.reset();
            }}
          />
        </Field>
        <Field label="确认新密码">
          <PasswordInput
            autoComplete="new-password"
            minLength={10}
            maxLength={71}
            required
            value={confirmation}
            aria-invalid={!!validation}
            aria-describedby={validation ? "password-validation" : undefined}
            disabled={mutation.isPending}
            onChange={(event) => {
              setConfirmation(event.target.value);
              setValidation("");
              mutation.reset();
            }}
          />
        </Field>
        {validation && (
          <p className="game-field-error" id="password-validation" role="alert">
            {validation}
          </p>
        )}
        {mutation.isError && <GameFailure error={mutation.error} />}
        {mutation.isSuccess && !forced && (
          <p className="game-form-success" role="status">
            密码已更新。你的冒险记录，安心留在这里。
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          className="game-cta"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "正在保存…" : "保存新密码"}
        </Button>
        {forced && (
          <Button variant="ghost" onClick={logout}>
            退出登录
          </Button>
        )}
      </form>
    </section>
  );
}
