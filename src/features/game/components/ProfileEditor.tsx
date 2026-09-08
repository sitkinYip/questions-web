import { useEffect, useRef, useState, type ComponentType } from "react";
import type { AvatarCropDialogProps } from "./AvatarCropDialog";
import { uiCopy } from "@/config/ui-copy";
import { UploadSimpleIcon, CheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/FormControls";
import { PlayerAvatar } from "@/features/game/components/PlayerPassport";
import { GameFailure } from "@/features/game/components/GameState";

import { validateAvatar } from "@/features/game/game-profile-validation";

import type { useProfileEditor } from "@/features/game/hooks/useProfileEditor";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [CropDialog, setCropDialog] =
    useState<ComponentType<AvatarCropDialogProps> | null>(null);
  const [loadingCrop, setLoadingCrop] = useState(false);
  const selection = useRef(0);
  useEffect(
    () => () => {
      selection.current++;
    },
    [],
  );
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
                onChange={async (event) => {
                  const selected = event.target.files?.[0];
                  if (!selected) return;
                  event.target.value = "";
                  const request = ++selection.current;
                  setSelectedFile(null);
                  setUpload(null);
                  setLoadingCrop(false);
                  const error = validateAvatar(selected);
                  mutation.reset();
                  if (error) {
                    setUpload(null);
                    setValidation(error);
                    event.target.value = "";
                    return;
                  }
                  setValidation("");
                  setLoadingCrop(true);
                  try {
                    const module = await import("./AvatarCropDialog");
                    if (request !== selection.current) return;
                    setCropDialog(() => module.default);
                    setSelectedFile(selected);
                  } catch {
                    if (request === selection.current)
                      setValidation(uiCopy.avatarCrop.loadFailed);
                  } finally {
                    if (request === selection.current) setLoadingCrop(false);
                  }
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
        <Field
          label={uiCopy.profileEditor.displayName}
          hint={uiCopy.profileEditor.displayNameHint}
        >
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
          <strong>{player.account}</strong>
          <small>{uiCopy.profileEditor.usernameHint}</small>
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
      {selectedFile && CropDialog && (
        <CropDialog
          file={selectedFile}
          onCancel={() => setSelectedFile(null)}
          onConfirm={(file) => {
            setUpload({ file, url: URL.createObjectURL(file) });
            setSelectedFile(null);
          }}
        />
      )}
    </>
  );
}
