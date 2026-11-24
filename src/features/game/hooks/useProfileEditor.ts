import { uiCopy } from "@/config/ui-copy";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { gameApi } from "@/api/game.client";
import { useGame } from "@/features/game/useGame";
import { validateAvatar } from "@/features/game/game-profile-validation";
import type { AvatarCropDialogProps } from "@/features/game/components/AvatarCropDialog";

export function useProfileEditor() {
  const { player, avatarUrl, setPlayer } = useGame();
  const [name, setName] = useState(player.displayName);
  const [upload, setUpload] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [validation, setValidation] = useState("");
  const [errorToast, setErrorToast] = useState<{
    id: number;
    title: string;
    description: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [CropDialog, setCropDialog] =
    useState<ComponentType<AvatarCropDialogProps> | null>(null);
  const [loadingCrop, setLoadingCrop] = useState(false);
  const selection = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  function notifyError(title: string, description: string) {
    setErrorToast((previous) => ({
      id: (previous?.id ?? 0) + 1,
      title,
      description,
    }));
  }
  function reportAvatarError(message: string) {
    setValidation(message);
    notifyError(uiCopy.profileEditor.avatarFailed, message);
  }
  function dismissErrorToast() {
    setErrorToast(null);
  }
  useEffect(() => {
    return () => {
      if (upload) URL.revokeObjectURL(upload.url);
    };
  }, [upload]);
  useEffect(
    () => () => {
      selection.current++;
    },
    [],
  );
  const mutation = useMutation({
    mutationFn: (form: FormData) => gameApi.profile(form),
    onSuccess: (value) => {
      setPlayer(value);
      setName(value.displayName);
      setUpload(null);
      if (fileInput.current) fileInput.current.value = "";
    },
    onError: (error) => {
      notifyError(uiCopy.profileEditor.saveFailed, error.message);
    },
  });
  async function selectAvatarFile(selected: File) {
    const request = ++selection.current;
    setSelectedFile(null);
    setUpload(null);
    setLoadingCrop(false);
    const error = validateAvatar(selected);
    mutation.reset();
    if (error) {
      setUpload(null);
      reportAvatarError(error);
      return;
    }
    setValidation("");
    dismissErrorToast();
    setLoadingCrop(true);
    try {
      const module =
        await import("@/features/game/components/AvatarCropDialog");
      if (request !== selection.current) return;
      setCropDialog(() => module.default);
      setSelectedFile(selected);
    } catch {
      if (request === selection.current)
        reportAvatarError(uiCopy.avatarCrop.loadFailed);
    } finally {
      if (request === selection.current) setLoadingCrop(false);
    }
  }
  function cancelCrop() {
    setSelectedFile(null);
  }
  function confirmCrop(file: File) {
    setUpload({ file, url: URL.createObjectURL(file) });
    setSelectedFile(null);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (selectedFile || loadingCrop) return;
    if (!name.trim()) {
      setValidation(uiCopy.useProfileEditor.emptyName);
      return;
    }
    if (mutation.isPending) return;
    const form = new FormData();
    form.set("displayName", name.trim());
    if (upload) form.set("avatar", upload.file);
    setValidation("");
    dismissErrorToast();
    mutation.mutate(form);
  }
  return {
    player,
    avatarUrl,
    name,
    setName,
    upload,
    setUpload,
    validation,
    setValidation,
    errorToast,
    reportAvatarError,
    dismissErrorToast,
    selectedFile,
    CropDialog,
    loadingCrop,
    selectAvatarFile,
    cancelCrop,
    confirmCrop,
    fileInput,
    mutation,
    submit,
  };
}
