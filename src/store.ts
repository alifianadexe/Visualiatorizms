import * as local from './db';
import * as cloud from './cloud';
import { PUBLIC_SPACE, type Journal, type Visibility } from './types';

/**
 * Unified storage facade with public/private spaces.
 *
 * - PUBLIC journals live in a shared cloud space everyone can read and add to.
 * - PRIVATE journals live under your sync code; another device sees them only
 *   after connecting with that same code.
 *
 * The local IndexedDB store is kept as a write-through cache so the app keeps
 * working offline and never hides an entry just because a cloud request lagged.
 */

export { newJournal, uid } from './db';

const MIGRATED_KEY = 'visualiatorizms.cloudMigrated.v1';

export interface SyncInfo {
  configured: boolean;
  /** Whether a private sync code is active on this device. */
  synced: boolean;
  code: string | null;
}

export function getSyncInfo(): SyncInfo {
  const configured = cloud.isConfigured();
  const code = cloud.getSyncCode();
  return { configured, synced: Boolean(configured && code), code };
}

function normalize(j: Journal): Journal {
  return { ...j, visibility: j.visibility === 'public' ? 'public' : 'private' };
}

/** The space a journal should be written to, creating a private code if needed. */
function spaceFor(visibility: Visibility): string {
  if (visibility === 'public') return PUBLIC_SPACE;
  return ensurePrivateCode();
}

function ensurePrivateCode(): string {
  let code = cloud.getSyncCode();
  if (!code) {
    code = cloud.generateSyncCode();
    cloud.setSyncCode(code);
  }
  return code;
}

// ---- Reads (merge cloud + local cache) ----

export async function getAll(): Promise<Journal[]> {
  await ensureMigrated();

  const localList = (await local.getAll()).map(normalize);

  let cloudList: Journal[] = [];
  if (cloud.isConfigured()) {
    try {
      const code = cloud.getSyncCode();
      const [pub, priv] = await Promise.all([
        cloud.getAll(PUBLIC_SPACE),
        code ? cloud.getAll(code) : Promise.resolve([]),
      ]);
      cloudList = [...pub, ...priv];
    } catch {
      // Offline / not set up yet — fall back to the local cache only.
      cloudList = [];
    }
  }

  // Merge by id; cloud is the source of truth, local fills any gaps.
  const byId = new Map<string, Journal>();
  for (const j of localList) byId.set(j.id, j);
  for (const j of cloudList) byId.set(j.id, normalize(j));

  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getOne(id: string): Promise<Journal | undefined> {
  if (cloud.isConfigured()) {
    try {
      const found = await cloud.getById(id);
      if (found) return normalize(found);
    } catch {
      /* fall through to local */
    }
  }
  const localOne = await local.getOne(id);
  return localOne ? normalize(localOne) : undefined;
}

// ---- Writes (local cache + cloud) ----

export async function put(journal: Journal): Promise<Journal> {
  const j = normalize(journal);
  await local.put(j); // cache immediately
  if (cloud.isConfigured()) {
    await cloud.put(spaceFor(j.visibility), j);
  }
  return j;
}

export async function remove(id: string): Promise<void> {
  await local.remove(id);
  if (cloud.isConfigured()) {
    try {
      await cloud.removeById(id);
    } catch {
      /* best effort; local removal already done */
    }
  }
}

export async function importFrom(raw: string): Promise<Journal[]> {
  const created = parseJournals(raw);
  for (const j of created) await put(j);
  return created;
}

// ---- Sync lifecycle ----

/** Connect to a private space by entering its code. */
export async function connect(code: string): Promise<void> {
  if (!cloud.isConfigured()) {
    throw new Error('Cloud sync is not configured for this site.');
  }
  const trimmed = code.trim();
  if (!trimmed) throw new Error('Enter a sync code.');
  if (trimmed === PUBLIC_SPACE) throw new Error('That code is reserved.');
  await cloud.getAll(trimmed); // validates config + code
  cloud.setSyncCode(trimmed);
}

/** Create a private space (if none) and upload local private journals to it. */
export async function enablePrivate(): Promise<string> {
  if (!cloud.isConfigured()) {
    throw new Error('Cloud sync is not configured for this site.');
  }
  const code = ensurePrivateCode();
  const locals = (await local.getAll()).map(normalize);
  const privates = locals.filter((j) => j.visibility === 'private');
  await cloud.putMany(code, privates);
  return code;
}

/** Stop syncing the private space on this device (local cache untouched). */
export function disconnect(): void {
  cloud.clearSyncCode();
}

// ---- One-time migration of pre-cloud local journals ----

let migrating: Promise<void> | null = null;

function ensureMigrated(): Promise<void> {
  if (!migrating) migrating = migrate();
  return migrating;
}

async function migrate(): Promise<void> {
  if (!cloud.isConfigured()) return;
  if (safeGet(MIGRATED_KEY)) return;
  try {
    const locals = (await local.getAll()).map(normalize);
    if (locals.length > 0) {
      const code = ensurePrivateCode();
      const publics = locals.filter((j) => j.visibility === 'public');
      const privates = locals.filter((j) => j.visibility === 'private');
      await cloud.putMany(PUBLIC_SPACE, publics);
      await cloud.putMany(code, privates);
    }
    safeSet(MIGRATED_KEY, '1');
  } catch {
    // Leave the flag unset so migration retries on the next load.
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

// ---- Export / import helpers ----

export function serialize(journals: Journal[]): string {
  return JSON.stringify({ version: 2, journals }, null, 2);
}

function parseJournals(raw: string): Journal[] {
  const data = JSON.parse(raw);
  const list: unknown = Array.isArray(data) ? data : data?.journals;
  if (!Array.isArray(list)) {
    throw new Error('File does not contain a journals array.');
  }
  return list.map((item) =>
    local.newJournal({
      title: item?.title,
      note: item?.note ?? item?.notes ?? '',
      code: item?.code,
      language: item?.language === 'jsx' ? 'jsx' : 'tsx',
      visibility: item?.visibility === 'public' ? 'public' : 'private',
    })
  );
}
