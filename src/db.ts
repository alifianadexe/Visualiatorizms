import type { Journal, Language } from './types';
import { SEED_JOURNALS } from './samples';

/**
 * Long-term storage for journals, backed by IndexedDB.
 *
 * IndexedDB is chosen over localStorage because it is durable, has a much
 * larger quota (code snippets add up), stores structured records, and is the
 * right primitive for "save it for the long term" on a static, backend-less
 * deployment (Netlify). The whole module is a small promise-based wrapper so
 * the rest of the app can treat it like a simple async repository.
 */

const DB_NAME = 'visualiatorizms';
const DB_VERSION = 1;
const STORE = 'journals';

// Keys used by the previous localStorage-based version, migrated on first open.
const LEGACY_KEY = 'visualiatorizms.journals.v1';
const SEEDED_KEY = 'visualiatorizms.seeded.v1';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(
  db: IDBDatabase,
  mode: IDBTransactionMode
): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function newJournal(partial?: Partial<Journal>): Journal {
  const now = Date.now();
  return {
    id: partial?.id ?? uid(),
    title: partial?.title ?? '',
    note: partial?.note ?? '',
    code: partial?.code ?? '',
    language: (partial?.language as Language) ?? 'tsx',
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
  };
}

/** Return all journals, newest-updated first. */
export async function getAll(): Promise<Journal[]> {
  await ensureBootstrapped();
  const db = await openDB();
  const all = await reqToPromise(tx(db, 'readonly').getAll() as IDBRequest<Journal[]>);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getOne(id: string): Promise<Journal | undefined> {
  const db = await openDB();
  return reqToPromise(tx(db, 'readonly').get(id) as IDBRequest<Journal | undefined>);
}

/** Insert or update a journal. */
export async function put(journal: Journal): Promise<Journal> {
  const db = await openDB();
  await reqToPromise(tx(db, 'readwrite').put(journal));
  return journal;
}

export async function remove(id: string): Promise<void> {
  const db = await openDB();
  await reqToPromise(tx(db, 'readwrite').delete(id));
}

// ---- One-time bootstrap: migrate legacy data, then seed examples ----

let bootstrapped: Promise<void> | null = null;

function ensureBootstrapped(): Promise<void> {
  if (!bootstrapped) bootstrapped = bootstrap();
  return bootstrapped;
}

async function bootstrap(): Promise<void> {
  const db = await openDB();
  const count = await reqToPromise(tx(db, 'readonly').count());
  if (count > 0) return;

  const migrated = migrateLegacy();
  if (migrated.length > 0) {
    await Promise.all(migrated.map((j) => reqToPromise(tx(db, 'readwrite').put(j))));
    return;
  }

  // Only seed examples on a genuinely first-ever run.
  if (safeGet(SEEDED_KEY)) return;
  const seeds = SEED_JOURNALS.map((s) => newJournal(s));
  await Promise.all(seeds.map((j) => reqToPromise(tx(db, 'readwrite').put(j))));
  safeSet(SEEDED_KEY, '1');
}

/** Pull entries written by the old localStorage version, if any. */
function migrateLegacy(): Journal[] {
  const raw = safeGet(LEGACY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) =>
      newJournal({
        id: item?.id,
        title: item?.title,
        // old field name was "notes"
        note: item?.note ?? item?.notes ?? '',
        code: item?.code,
        language: item?.language === 'jsx' ? 'jsx' : 'tsx',
        createdAt: item?.createdAt,
        updatedAt: item?.updatedAt,
      })
    );
  } catch {
    return [];
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

// ---- Export / import for manual backups ----

export function serialize(journals: Journal[]): string {
  return JSON.stringify({ version: 1, journals }, null, 2);
}

export async function importFrom(raw: string): Promise<Journal[]> {
  const data = JSON.parse(raw);
  const list: unknown = Array.isArray(data) ? data : data?.journals;
  if (!Array.isArray(list)) {
    throw new Error('File does not contain a journals array.');
  }
  const created = list.map((item) =>
    newJournal({
      title: item?.title,
      note: item?.note ?? item?.notes ?? '',
      code: item?.code,
      language: item?.language === 'jsx' ? 'jsx' : 'tsx',
    })
  );
  const db = await openDB();
  await Promise.all(created.map((j) => reqToPromise(tx(db, 'readwrite').put(j))));
  return created;
}
