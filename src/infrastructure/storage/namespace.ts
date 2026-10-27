type ReadableStorage = Pick<Storage, "getItem" | "setItem"> &
  Partial<Pick<Storage, "removeItem">>;

export function starwardStorageKey(key: string) {
  return key.replace(/^questions:/, "starward:");
}

export function legacyStorageKey(key: string) {
  return key.replace(/^starward:/, "questions:");
}

export function writeStorageItem(
  storage: Pick<Storage, "setItem"> & Partial<Pick<Storage, "removeItem">>,
  key: string,
  value: string,
) {
  const currentKey = starwardStorageKey(key);
  storage.setItem(currentKey, value);
  try {
    const oldKey = legacyStorageKey(currentKey);
    if (oldKey !== currentKey) storage.removeItem?.(oldKey);
  } catch {
    // Old-key cleanup must not invalidate a successfully saved value.
  }
}

export function readStorageItem(storage: ReadableStorage, key: string) {
  const currentKey = starwardStorageKey(key);
  const current = storage.getItem(currentKey);
  if (current !== null) return current;
  const oldKey = legacyStorageKey(currentKey);
  if (oldKey === currentKey) return null;
  const previous = storage.getItem(oldKey);
  if (previous !== null) {
    try {
      writeStorageItem(storage, currentKey, previous);
    } catch {
      // Existing data remains readable if storage is full or read-only.
    }
  }
  return previous;
}

export function removeStorageItem(
  storage: Pick<Storage, "removeItem">,
  key: string,
) {
  const currentKey = starwardStorageKey(key);
  try {
    const oldKey = legacyStorageKey(currentKey);
    if (oldKey !== currentKey) storage.removeItem(oldKey);
  } finally {
    storage.removeItem(currentKey);
  }
}
