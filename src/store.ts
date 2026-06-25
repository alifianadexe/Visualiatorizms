import * as local from './db';
import * as cloud from './cloud';
import type { Journal } from './types';

/**
 * Unified storage facade. When a Supabase project is configured AND a sync
 * code is active, reads/writes go to the cloud (synced across devices).
 * Otherwise everything stays in local IndexedDB, exactly as before.
 */

export { newJournal, uid, serialize } from './db';

export interface SyncInfo {
  /** Whether the deployment has Supabase env vars set. */
  configured: boolean;
  /** Whether this device is currently connected to a cloud space. */
  synced: boolean;
  /** The active sync code, when synced. */
  code: string | null;
}

export function getSyncInfo(): SyncInfo {
  const configured = cloud.isConfigured();
  const code = cloud.getSyncCode();
  return { configured, synced: Boolean(configured && code), code };
}

function activeCode(): string | null {
  return cloud.isConfigured() ? cloud.getSyncCode() : null;
}

// ---- CRUD (routed) ----

export async function getAll(): Promise<Journal[]> {
  const code = activeCode();
  return code ? cloud.getAll(code) : local.getAll();
}

export async function getOne(id: string): Promise<Journal | undefined> {
  const code = activeCode();
  return code ? cloud.getOne(code, id) : local.getOne(id);
}

export async function put(journal: Journal): Promise<Journal> {
  const code = activeCode();
  return code ? cloud.put(code, journal) : local.put(journal);
}

export async function remove(id: string): Promise<void> {
  const code = activeCode();
  return code ? cloud.remove(code, id) : local.remove(id);
}

export async function importFrom(raw: string): Promise<Journal[]> {
  const code = activeCode();
  if (!code) return local.importFrom(raw);
  // Parse with the local helper (reuses validation), then push to the cloud.
  const created = parseJournals(raw);
  await cloud.putMany(code, created);
  return created;
}

// ---- Sync lifecycle ----

/** Turn on sync: create a fresh code and upload the current local journals. */
export async function enableSync(): Promise<string> {
  if (!cloud.isConfigured()) {
    throw new Error('Cloud sync is not configured for this site.');
  }
  const existing = await local.getAll();
  const code = cloud.generateSyncCode();
  await cloud.putMany(code, existing);
  cloud.setSyncCode(code);
  return code;
}

/** Connect to an existing space by entering its code. */
export async function connect(code: string): Promise<void> {
  if (!cloud.isConfigured()) {
    throw new Error('Cloud sync is not configured for this site.');
  }
  const trimmed = code.trim();
  if (!trimmed) throw new Error('Enter a sync code.');
  // Validate the code by attempting a read (throws on bad config/code).
  await cloud.getAll(trimmed);
  cloud.setSyncCode(trimmed);
}

/** Stop syncing on this device (local data is untouched). */
export function disconnect(): void {
  cloud.clearSyncCode();
}

// Local-only helper reused for cloud import parsing.
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
    })
  );
}
