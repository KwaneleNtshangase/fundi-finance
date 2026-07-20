/**
 * One-time localStorage key migration: `fundi-*` -> `notho-*`.
 *
 * The rebrand renamed 39 storage keys. Without this, every existing user looks
 * like a brand new one on first load after deploy: not onboarded, no streak, no
 * hearts, no saved goal, and — worst — any XP sitting in the unsynced delta
 * queue (`fundi-pending-streak-sync`) is orphaned and permanently lost.
 *
 * Several keys are date-suffixed at runtime (`fundi-daily-xp-2026-07-21`,
 * `fundi-wc-...`, `fundi-concept-reviewed-...`), so this walks the whole
 * keyspace by prefix rather than using a fixed list.
 *
 * Runs as a blocking inline script in <head>, before hydration, because hooks
 * read this state during their first render.
 *
 * Non-destructive on purpose. The old keys are left in place so that rolling
 * back to a pre-rebrand build does not strand users. Delete them in a later
 * release, once this one has been stable for a while.
 */

/**
 * Both separators are in use: most keys are `fundi-thing`, but at least one
 * (`fundi.cosmoCollapsed`) uses a dot. Matching only the hyphen silently
 * skipped it, so the prefix is matched on the stem and the separator is
 * preserved.
 */
export const OLD_STEM = "fundi";
export const NEW_STEM = "notho";
export const SEPARATORS = ["-", "."] as const;
export const MIGRATION_FLAG = "notho-storage-migrated";

/** `fundi-hearts` -> `notho-hearts`, `fundi.x` -> `notho.x`, else null. */
export function renameKey(key: string): string | null {
  for (const sep of SEPARATORS) {
    const p = OLD_STEM + sep;
    if (key.startsWith(p)) return NEW_STEM + sep + key.slice(p.length);
  }
  return null;
}

/**
 * Source of the inline script. Kept as a string so it can run before any
 * bundle loads. Deliberately ES5, no optional chaining, no arrow functions:
 * it executes before polyfills on old Android WebViews.
 */
export const STORAGE_MIGRATION_SCRIPT = `(function(){try{
var O=${JSON.stringify(OLD_STEM)},N=${JSON.stringify(NEW_STEM)},S=${JSON.stringify(SEPARATORS)},M=${JSON.stringify(MIGRATION_FLAG)};
var ls=window.localStorage;
if(!ls||ls.getItem(M))return;
function rn(k){for(var j=0;j<S.length;j++){var p=O+S[j];if(k.indexOf(p)===0)return N+S[j]+k.slice(p.length);}return null;}
var keys=[],i,k;
for(i=0;i<ls.length;i++){k=ls.key(i);if(k&&rn(k))keys.push(k);}
for(i=0;i<keys.length;i++){
var nk=rn(keys[i]);
if(ls.getItem(nk)===null){var v=ls.getItem(keys[i]);if(v!==null)ls.setItem(nk,v);}
}
ls.setItem(M,String(keys.length));
}catch(e){}})();`;

/**
 * Testable equivalent of the inline script. Returns how many keys were copied,
 * or -1 if the migration had already run.
 */
export function migrateStorageKeys(store: Storage): number {
  try {
    if (store.getItem(MIGRATION_FLAG) !== null) return -1;
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && renameKey(k)) keys.push(k);
    }
    let copied = 0;
    for (const oldKey of keys) {
      const newKey = renameKey(oldKey)!;
      // Never clobber a value the new build already wrote.
      if (store.getItem(newKey) === null) {
        const v = store.getItem(oldKey);
        if (v !== null) {
          store.setItem(newKey, v);
          copied++;
        }
      }
    }
    store.setItem(MIGRATION_FLAG, String(keys.length));
    return copied;
  } catch {
    return 0;
  }
}
