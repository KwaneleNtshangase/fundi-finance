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

export const OLD_PREFIX = "fundi-";
export const NEW_PREFIX = "notho-";
export const MIGRATION_FLAG = "notho-storage-migrated";

/**
 * Source of the inline script. Kept as a string so it can run before any
 * bundle loads. Deliberately ES5, no optional chaining, no arrow functions:
 * it executes before polyfills on old Android WebViews.
 */
export const STORAGE_MIGRATION_SCRIPT = `(function(){try{
var F=${JSON.stringify(OLD_PREFIX)},N=${JSON.stringify(NEW_PREFIX)},M=${JSON.stringify(MIGRATION_FLAG)};
var ls=window.localStorage;
if(!ls||ls.getItem(M))return;
var keys=[],i,k;
for(i=0;i<ls.length;i++){k=ls.key(i);if(k&&k.indexOf(F)===0)keys.push(k);}
for(i=0;i<keys.length;i++){
var nk=N+keys[i].slice(F.length);
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
      if (k && k.startsWith(OLD_PREFIX)) keys.push(k);
    }
    let copied = 0;
    for (const oldKey of keys) {
      const newKey = NEW_PREFIX + oldKey.slice(OLD_PREFIX.length);
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
