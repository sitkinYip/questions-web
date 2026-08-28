import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { gameApi } from "../../../api/game.client";
import { useGame } from "../useGame";

export function useProfileEditor() {
  const { player, avatarUrl, setPlayer } = useGame();
  const [name, setName] = useState(player.displayName);
  const [upload, setUpload] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [validation, setValidation] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
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
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setValidation("给自己起个名字，再出发吧。");
      return;
    }
    if (mutation.isPending) return;
    const form = new FormData();
    form.set("displayName", name.trim());
    if (upload) form.set("avatar", upload.file);
    setValidation("");
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
    fileInput,
    mutation,
    submit,
  };
}
