import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { AppDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { uiCopy } from "@/config/ui-copy";
import {
  cropAvatar,
  prepareAvatar,
  type AvatarArea,
} from "@/features/game/avatar-image";
import "./avatar-crop.css";

export interface AvatarCropDialogProps {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export default function AvatarCropDialog({
  file,
  onCancel,
  onConfirm,
}: AvatarCropDialogProps) {
  const [source, setSource] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<AvatarArea | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const alive = useRef(true);
  const processing = useRef(false);
  useEffect(() => {
    let active = true;
    let url = "";
    alive.current = true;
    prepareAvatar(file)
      .then((value) => {
        if (!active) {
          URL.revokeObjectURL(value);
          return;
        }
        url = value;
        setSource(value);
      })
      .catch(() => {
        if (active) setError(uiCopy.avatarCrop.failed);
      });
    return () => {
      active = false;
      alive.current = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  async function confirm() {
    if (!area || !source || processing.current) return;
    processing.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await cropAvatar(source, area);
      if (alive.current) onConfirm(result);
    } catch {
      if (alive.current) setError(uiCopy.avatarCrop.failed);
    } finally {
      processing.current = false;
      if (alive.current) setBusy(false);
    }
  }

  return (
    <AppDialog
      overlayId="avatar-crop"
      priority={80}
      open
      onOpenChange={onCancel}
      accessibleTitle={uiCopy.avatarCrop.title}
      accessibleDescription={uiCopy.avatarCrop.hint}
      overlayClassName="avatar-crop-overlay"
      contentClassName="avatar-crop-dialog"
      closeOnOutside={false}
    >
      <h2>{uiCopy.avatarCrop.title}</h2>
      <p className="game-muted">{uiCopy.avatarCrop.hint}</p>
      <div className="avatar-crop-stage" aria-busy={!source || busy}>
        {source ? (
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropAreaChange={(_, pixels) => setArea(pixels)}
            keyboardStep={10}
            mediaProps={{ onError: () => setError(uiCopy.avatarCrop.failed) }}
          />
        ) : (
          <p role="status">{error || uiCopy.avatarCrop.loading}</p>
        )}
      </div>
      <label className="avatar-crop-zoom">
        {uiCopy.avatarCrop.zoom}
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          disabled={!source || busy}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </label>
      {error && (
        <p className="game-field-error" role="alert">
          {error}
        </p>
      )}
      <div className="avatar-crop-actions">
        <Button onClick={onCancel}>{uiCopy.avatarCrop.cancel}</Button>
        <Button variant="primary" disabled={!area || busy} onClick={confirm}>
          {busy ? uiCopy.avatarCrop.processing : uiCopy.avatarCrop.confirm}
        </Button>
      </div>
    </AppDialog>
  );
}
