import { describe, it, expect, beforeEach } from "vitest";
import {
  migrateStorageKeys,
  MIGRATION_FLAG,
  STORAGE_MIGRATION_SCRIPT,
} from "../storageMigration";

/** Minimal in-memory Storage, index-ordered like the real thing. */
function makeStore(seed: Record<string, string> = {}): Storage {
  let map = new Map(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => void (map = new Map()),
  } as Storage;
}

describe("storage migration: fundi-* -> notho-*", () => {
  let store: Storage;

  beforeEach(() => {
    store = makeStore({
      "fundi-onboarded": "true",
      "fundi-username": "thabo",
      "fundi-hearts": "5",
      "fundi-pending-streak-sync": '{"delta":120}',
      "fundi-daily-xp-2026-07-20": "80",
      "fundi-wc-2026-W29": '{"lessonsCompleted":3}',
      "unrelated-key": "keep me",
    });
  });

  it("copies every fundi-prefixed key to the notho- namespace", () => {
    const copied = migrateStorageKeys(store);
    expect(copied).toBe(6);
    expect(store.getItem("notho-onboarded")).toBe("true");
    expect(store.getItem("notho-username")).toBe("thabo");
    expect(store.getItem("notho-hearts")).toBe("5");
  });

  it("carries over unsynced XP deltas, which are otherwise lost", () => {
    migrateStorageKeys(store);
    expect(store.getItem("notho-pending-streak-sync")).toBe('{"delta":120}');
  });

  it("handles runtime date-suffixed keys, not just a fixed list", () => {
    migrateStorageKeys(store);
    expect(store.getItem("notho-daily-xp-2026-07-20")).toBe("80");
    expect(store.getItem("notho-wc-2026-W29")).toBe('{"lessonsCompleted":3}');
  });

  it("leaves unrelated keys untouched", () => {
    migrateStorageKeys(store);
    expect(store.getItem("unrelated-key")).toBe("keep me");
    expect(store.getItem("notho-unrelated-key")).toBeNull();
  });

  it("is non-destructive, so a rollback still finds the old keys", () => {
    migrateStorageKeys(store);
    expect(store.getItem("fundi-onboarded")).toBe("true");
  });

  it("never clobbers a value the new build already wrote", () => {
    store.setItem("notho-username", "already-set");
    migrateStorageKeys(store);
    expect(store.getItem("notho-username")).toBe("already-set");
  });

  it("only runs once", () => {
    expect(migrateStorageKeys(store)).toBe(6);
    expect(migrateStorageKeys(store)).toBe(-1);
    expect(store.getItem(MIGRATION_FLAG)).toBe("6");
  });

  it("does not resurrect keys deleted after migration", () => {
    migrateStorageKeys(store);
    store.removeItem("notho-onboarded"); // e.g. an account-switch wipe
    migrateStorageKeys(store);
    expect(store.getItem("notho-onboarded")).toBeNull();
  });

  it("survives a throwing Storage (private mode / disabled)", () => {
    const hostile = {
      get length(): number {
        throw new Error("denied");
      },
      key: () => null,
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    } as unknown as Storage;
    expect(() => migrateStorageKeys(hostile)).not.toThrow();
  });

  it("inline script is ES5-safe and self-contained", () => {
    // Runs before polyfills on old Android WebViews.
    expect(STORAGE_MIGRATION_SCRIPT).not.toMatch(/=>|\?\.|\blet\b|\bconst\b/);
    expect(STORAGE_MIGRATION_SCRIPT).toMatch(/^\(function\(\)\{try\{/);
    expect(STORAGE_MIGRATION_SCRIPT).toMatch(/catch\(e\)\{\}\}\)\(\);$/);
  });

  it("the inline script behaves identically to the tested function", () => {
    const viaScript = makeStore({
      "fundi-onboarded": "true",
      "fundi-hearts": "5",
    });
    // Execute the real inline source against a stubbed window.
    const fn = new Function("window", STORAGE_MIGRATION_SCRIPT);
    fn({ localStorage: viaScript });
    expect(viaScript.getItem("notho-onboarded")).toBe("true");
    expect(viaScript.getItem("notho-hearts")).toBe("5");
    expect(viaScript.getItem(MIGRATION_FLAG)).toBe("2");
  });
});
