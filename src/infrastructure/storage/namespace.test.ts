import { describe, expect, it } from "vitest";
import {
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
} from "@/infrastructure/storage/namespace";

function memoryStorage(values: Record<string, string> = {}) {
  const data = new Map(Object.entries(values));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}

describe("Starward storage namespace compatibility", () => {
  it("moves an existing preference to the new namespace without losing its value", () => {
    const storage = memoryStorage({ "questions:v1:theme": "saved-theme" });
    expect(readStorageItem(storage, "starward:v1:theme")).toBe("saved-theme");
    expect(storage.getItem("starward:v1:theme")).toBe("saved-theme");
    expect(storage.getItem("questions:v1:theme")).toBeNull();
  });

  it("prefers a newer Starward value over a stale legacy value", () => {
    const storage = memoryStorage({
      "starward:v1:bgm": "new-preference",
      "questions:v1:bgm": "old-preference",
    });
    expect(readStorageItem(storage, "starward:v1:bgm")).toBe("new-preference");
    expect(storage.getItem("starward:v1:bgm")).toBe("new-preference");
  });

  it("keeps legacy data readable if copying to the new key is blocked", () => {
    const storage = memoryStorage({ "questions:v1:bgm": "saved-preference" });
    storage.setItem = () => {
      throw new Error("Storage full");
    };
    expect(readStorageItem(storage, "starward:v1:bgm")).toBe(
      "saved-preference",
    );
    expect(storage.getItem("questions:v1:bgm")).toBe("saved-preference");
    expect(storage.getItem("starward:v1:bgm")).toBeNull();
  });

  it("writes only the new namespace and removes the previous value", () => {
    const storage = memoryStorage({ "questions:v1:bgm": "old" });
    writeStorageItem(storage, "questions:v1:bgm", "new");
    expect(storage.getItem("starward:v1:bgm")).toBe("new");
    expect(storage.getItem("questions:v1:bgm")).toBeNull();
  });

  it("retains a successfully saved value when legacy cleanup is blocked", () => {
    const storage = memoryStorage({ "questions:v1:bgm": "old" });
    storage.removeItem = () => {
      throw new Error("Cleanup blocked");
    };
    expect(() =>
      writeStorageItem(storage, "starward:v1:bgm", "new"),
    ).not.toThrow();
    expect(storage.getItem("starward:v1:bgm")).toBe("new");
  });

  it("clears both auth namespaces so legacy credentials cannot reappear", () => {
    const storage = memoryStorage({
      "questions:v2:auth": "old-login",
      "starward:v2:auth": "new-login",
    });
    removeStorageItem(storage, "starward:v2:auth");
    expect(readStorageItem(storage, "starward:v2:auth")).toBeNull();
    expect(storage.getItem("questions:v2:auth")).toBeNull();
  });

  it("still clears current auth if removing legacy auth throws", () => {
    const storage = memoryStorage({
      "questions:v2:auth": "old-login",
      "starward:v2:auth": "new-login",
    });
    const removeItem = storage.removeItem;
    storage.removeItem = (key) => {
      if (key === "questions:v2:auth")
        throw new Error("Legacy cleanup blocked");
      removeItem(key);
    };
    expect(() => removeStorageItem(storage, "starward:v2:auth")).toThrow();
    expect(storage.getItem("starward:v2:auth")).toBeNull();
  });

  it("leaves unrelated application records untouched", () => {
    const storage = memoryStorage({ "another-app:theme": "other-theme" });
    expect(readStorageItem(storage, "starward:v1:theme")).toBeNull();
    writeStorageItem(storage, "starward:v1:theme", "new-theme");
    removeStorageItem(storage, "starward:v1:theme");
    expect(storage.getItem("another-app:theme")).toBe("other-theme");
  });
});
