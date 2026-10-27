import { uiCopy } from "@/config/ui-copy";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { gameApi } from "@/api/game.client";
import { useGame } from "@/features/game/useGame";

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
  function submit(event: FormEvent) {
    event.preventDefault();
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
    fileInput,
    mutation,
    submit,
  };
}
