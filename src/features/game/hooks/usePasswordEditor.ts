import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { gameApi } from "@/api/game.client";
import { useGame } from "@/features/game/useGame";

export function usePasswordEditor() {
  const { setPlayer, logout } = useGame();
  const [old, setOld] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [validation, setValidation] = useState("");
  const mutation = useMutation({
    mutationFn: () => gameApi.changePassword(old, password, confirmation),
    onSuccess: (player) => {
      setPlayer(player);
      setOld("");
      setPassword("");
      setConfirmation("");
    },
  });
  return {
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
  };
}
