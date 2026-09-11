import { useCallback, useState } from "react";

/** Retain display data only until the dialog reports that its exit is complete. */
export function useExitSnapshot<T>(value: T | null) {
  const [snapshot, setSnapshot] = useState(value);
  if (value !== null && value !== snapshot) setSnapshot(value);
  const release = useCallback(() => setSnapshot(null), []);
  return { value: value ?? snapshot, open: value !== null, release };
}
