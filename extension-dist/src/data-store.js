(function attachXListStore(global) {
  const DB_NAME = "x-list-curator-db";
  const DB_VERSION = 1;
  const STORE_NAME = "app";
  const STATE_KEY = "state";
  const SCHEMA_VERSION = 1;
  let dbPromise;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!global.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const request = global.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
    });
    return dbPromise;
  }

  function transaction(mode, operation) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      let result;
      try { result = operation(store); } catch (error) { reject(error); return; }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
      tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
    }));
  }

  async function load() {
    try {
      const value = await transaction("readonly", (store) => new Promise((resolve, reject) => {
        const request = store.get(STATE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("IndexedDB read failed"));
      }));
      return value ? { ...value, schemaVersion: value.schemaVersion || SCHEMA_VERSION } : null;
    } catch (error) {
      // A browser profile may have IndexedDB disabled. The fallback keeps the
      // extension usable while retaining the same schema and save semantics.
      try {
        const result = await chrome.storage.local.get("x-list-curator-state-v1");
        return result["x-list-curator-state-v1"] || null;
      } catch (_) {
        throw error;
      }
    }
  }

  async function save(state) {
    const value = JSON.parse(JSON.stringify({ ...state, schemaVersion: SCHEMA_VERSION }));
    try {
      await transaction("readwrite", (store) => store.put(value, STATE_KEY));
    } catch (error) {
      await chrome.storage.local.set({ "x-list-curator-state-v1": value });
    }
  }

  async function clear() {
    try { await transaction("readwrite", (store) => store.delete(STATE_KEY)); } catch (_) {}
    try { await chrome.storage.local.remove("x-list-curator-state-v1"); } catch (_) {}
  }

  global.XListStore = { SCHEMA_VERSION, load, save, clear };
})(globalThis);
