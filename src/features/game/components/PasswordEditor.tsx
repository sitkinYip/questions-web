import { uiCopy } from "@/config/ui-copy";
import { KeyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormControls";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { GameFailure } from "@/features/game/components/GameState";

import type { usePasswordEditor } from "@/features/game/hooks/usePasswordEditor";

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
        <h2>
          {forced
            ? uiCopy.passwordEditor.forcedTitle
            : uiCopy.passwordEditor.title}
        </h2>
      </div>
      <p className="game-muted">{uiCopy.passwordEditor.description}</p>
      <form
        className="game-form"
        aria-busy={mutation.isPending}
        onSubmit={(event) => {
          event.preventDefault();
          if (password !== confirmation) {
            setValidation(uiCopy.passwordEditor.mismatch);
            return;
          }
          setValidation("");
          if (!mutation.isPending) mutation.mutate();
        }}
      >
        <Field label={uiCopy.passwordEditor.currentPassword}>
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
        <Field label={uiCopy.passwordEditor.newPassword}>
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
        <Field label={uiCopy.passwordEditor.confirmPassword}>
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
            {uiCopy.passwordEditor.saved}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          className="game-cta"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? uiCopy.passwordEditor.saving
            : uiCopy.passwordEditor.save}
        </Button>
        {forced && (
          <Button variant="ghost" onClick={logout}>
            {uiCopy.passwordEditor.logout}
          </Button>
        )}
      </form>
    </section>
  );
}
