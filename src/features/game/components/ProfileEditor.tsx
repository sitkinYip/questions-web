import { UploadSimpleIcon, CheckIcon } from "@phosphor-icons/react";
import { Button } from "../../../components/ui/Button";
import { Field, Input } from "../../../components/ui/FormControls";
import { PlayerAvatar } from "./PlayerPassport";
import { GameFailure } from "./GameState";

import { validateAvatar } from "../game-profile-validation";

import type { useProfileEditor } from "../hooks/useProfileEditor";

export function ProfileEditor({
  editor,
}: {
  editor: ReturnType<typeof useProfileEditor>;
}) {
  const {
    player,
    avatarUrl,
    name,
    setName,
    upload,
    setUpload,
    validation,
    setValidation,
    fileInput,
    mutation,
    submit,
  } = editor;
  return (
    <form
      className="game-form profile-editor"
      onSubmit={submit}
      aria-busy={mutation.isPending}
    >
      <div className="profile-editor__avatar">
        <PlayerAvatar
          name={name || player.displayName}
          url={upload?.url || avatarUrl}
          large
        />
        <div>
          <label className="profile-editor__upload">
            <UploadSimpleIcon aria-hidden="true" />
            <span>更换头像</span>
            <input
              ref={fileInput}
              type="file"
              aria-label="上传头像"
              accept="image/jpeg,image/png,image/webp"
              disabled={mutation.isPending}
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (!selected) return;
                const error = validateAvatar(selected);
                mutation.reset();
                if (error) {
                  setUpload(null);
                  setValidation(error);
                  event.target.value = "";
                  return;
                }
                setValidation("");
                setUpload({
                  file: selected,
                  url: URL.createObjectURL(selected),
                });
              }}
            />
          </label>
          <p className="game-muted">JPG / PNG / WebP · 最大 2 MB</p>
          {upload && (
            <span className="profile-editor__filename">
              已选择：{upload.file.name}
            </span>
          )}
        </div>
      </div>
      <Field label="显示昵称" hint="你的名字，会和解开的谜题一起被记住。">
        <Input
          value={name}
          maxLength={40}
          required
          disabled={mutation.isPending}
          onChange={(event) => {
            setName(event.target.value);
            setValidation("");
            mutation.reset();
          }}
        />
      </Field>
      <div className="profile-editor__account">
        <span>登录账号</span>
        <strong>{player.account}</strong>
        <small>账号由工作人员创建，不可修改</small>
      </div>
      {validation && (
        <p className="game-field-error" role="alert">
          {validation}
        </p>
      )}
      {mutation.isError && <GameFailure error={mutation.error} />}
      {mutation.isSuccess && (
        <p className="game-form-success" role="status">
          <CheckIcon aria-hidden="true" />
          资料已保存。新的名片，新的出发。
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        className="game-cta"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "正在保存…" : "保存资料"}
      </Button>
    </form>
  );
}
