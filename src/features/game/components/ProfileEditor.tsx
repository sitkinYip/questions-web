import { useExitSnapshot } from "@/shared/motion/useExitSnapshot";
import { uiCopy } from "@/config/ui-copy";
import { UploadSimpleIcon, CheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/FormControls";
import { AppToast } from "@/components/ui/Toast";
import { PlayerAvatar } from "@/features/game/components/PlayerPassport";
import { GameFailure } from "@/features/game/components/GameState";

import type { useProfileEditor } from "@/features/game/hooks/useProfileEditor";

type ProfileEditorModel = ReturnType<typeof useProfileEditor>;

/** 头像裁剪弹窗：可在 Sheet 外层独立渲染，避免父级弹层挂起时卸载裁剪状态。 */
export function ProfileAvatarCrop({ editor }: { editor: ProfileEditorModel }) {
  const { selectedFile, CropDialog, cancelCrop, confirmCrop } = editor;
  const cropSnapshot = useExitSnapshot(selectedFile);
  if (!cropSnapshot.value || !CropDialog) return null;
  return (
    <CropDialog
      file={cropSnapshot.value}
      open={cropSnapshot.open}
      onExitComplete={cropSnapshot.release}
      onCancel={cancelCrop}
      onConfirm={confirmCrop}
    />
  );
}

export function ProfileEditor({
  editor,
  renderCropDialog = true,
}: {
  editor: ProfileEditorModel;
  renderCropDialog?: boolean;
}) {
  const {
    player,
    avatarUrl,
    name,
    setName,
    upload,
    validation,
    setValidation,
    errorToast,
    dismissErrorToast,
    selectedFile,
    loadingCrop,
    selectAvatarFile,
    fileInput,
    mutation,
    submit,
  } = editor;
  return (
    <>
      <form
        className="game-form profile-editor"
        onSubmit={(event) => {
          if (selectedFile || loadingCrop) event.preventDefault();
          else submit(event);
        }}
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
              <span>{uiCopy.profileEditor.changeAvatar}</span>
              <input
                ref={fileInput}
                type="file"
                aria-label={uiCopy.profileEditor.uploadAvatar}
                accept="image/jpeg,image/png,image/webp"
                disabled={mutation.isPending}
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (!selected) return;
                  event.target.value = "";
                  void selectAvatarFile(selected);
                }}
              />
            </label>
            <p className="game-muted">{uiCopy.profileEditor.avatarHint}</p>
            {upload && (
              <span className="profile-editor__filename">
                {uiCopy.profileEditor.selectedFile(upload.file.name)}
              </span>
            )}
          </div>
        </div>
        {loadingCrop && <p role="status">{uiCopy.avatarCrop.loading}</p>}
        <Field label={uiCopy.profileEditor.displayName}>
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
          <span>{uiCopy.profileEditor.username}</span>
          <strong className="tabular-nums">{player.account}</strong>
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
            {uiCopy.profileEditor.saved}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          className="game-cta"
          disabled={mutation.isPending || loadingCrop || Boolean(selectedFile)}
        >
          {mutation.isPending
            ? uiCopy.profileEditor.saving
            : uiCopy.profileEditor.save}
        </Button>
      </form>
      {errorToast && (
        <AppToast
          key={errorToast.id}
          open
          onOpenChange={(open) => {
            if (!open) dismissErrorToast();
          }}
          title={errorToast.title}
          description={errorToast.description}
        />
      )}
      {renderCropDialog && <ProfileAvatarCrop editor={editor} />}
    </>
  );
}
