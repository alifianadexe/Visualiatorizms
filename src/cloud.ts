import type { Journal, Language } from './types';
import { PUBLIC_SPACE } from './types';
import { SUPABASE_KEY, SUPABASE_URL } from './supabaseConfig';

/**
 * Cloud sync via Supabase's REST API (PostgREST), called directly from the
 * browser — no SDK dependency and no backend server.
 *
 * Access model (the "sync code" approach): every row carries a `space_id`.
 * Knowing the long, random space id (the sync code) is what grants access to
 * that set of journals. Enter the same code on another device to sync. This is
 * intentionally login-free; the trade-off is that anyone who has your code can
 * read/write that space, so treat the code like a password.
 */

const URL_BASE = SUPABASE_URL.replace(/\/$/, '');
const ANON = SUPABASE_KEY;
const TABLE = 'journals';
const CODE_KEY = 'visualiatorizms.syncCode';

export function isConfigured(): boolean {
  return Boolean(URL_BASE && ANON);
}

// ---- Sync code management ----

export function getSyncCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

export function setSyncCode(code: string): void {
  localStorage.setItem(CODE_KEY, code);
}

export function clearSyncCode(): void {
  localStorage.removeItem(CODE_KEY);
}

/** A long, unguessable code so spaces can't be enumerated. */
export function generateSyncCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `vzm-${hex.slice(0, 8)}-${hex.slice(8, 16)}-${hex.slice(16, 24)}-${hex.slice(24)}`;
}

// ---- Row <-> Journal mapping (DB uses snake_case) ----

interface Row {
  id: string;
  space_id: string;
  title: string;
  note: string;
  code: string;
  language: string;
  created_at: number;
  updated_at: number;
}

function rowToJournal(r: Row): Journal {
  return {
    id: r.id,
    title: r.title ?? '',
    note: r.note ?? '',
    code: r.code ?? '',
    language: (r.language === 'jsx' ? 'jsx' : 'tsx') as Language,
    // Visibility is encoded by which space the row lives in.
    visibility: r.space_id === PUBLIC_SPACE ? 'public' : 'private',
    createdAt: Number(r.created_at) || Date.now(),
    updatedAt: Number(r.updated_at) || Date.now(),
  };
}

function journalToRow(space: string, j: Journal): Row {
  return {
    id: j.id,
    space_id: space,
    title: j.title,
    note: j.note,
    code: j.code,
    language: j.language,
    created_at: j.createdAt,
    updated_at: j.updatedAt,
  };
}

// ---- REST helpers ----

function headers(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = {
    apikey: ANON,
    'Content-Type': 'application/json',
    ...extra,
  };
  // New publishable/secret keys (sb_*) must NOT be sent as a Bearer token —
  // only in the apikey header. Legacy JWT anon keys also go in Authorization.
  if (!ANON.startsWith('sb_')) {
    h.Authorization = `Bearer ${ANON}`;
  }
  return h;
}

async function request(path: string, init: RequestInit): Promise<Response> {
  if (!isConfigured()) {
    throw new Error('Cloud sync is not configured for this site.');
  }
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Sync failed (${res.status}). ${body || 'Check your Supabase setup and sync code.'}`
    );
  }
  return res;
}

// ---- CRUD ----

/** All journals in a given space (a sync code, or the public space). */
export async function getAll(space: string): Promise<Journal[]> {
  const res = await request(
    `${TABLE}?space_id=eq.${encodeURIComponent(space)}&order=updated_at.desc`,
    { headers: headers() }
  );
  const rows = (await res.json()) as Row[];
  return rows.map(rowToJournal);
}

/** Look up a single journal by id across any space. */
export async function getById(id: string): Promise<Journal | undefined> {
  const res = await request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    headers: headers(),
  });
  const rows = (await res.json()) as Row[];
  return rows[0] ? rowToJournal(rows[0]) : undefined;
}

export async function put(space: string, journal: Journal): Promise<Journal> {
  await request(`${TABLE}?on_conflict=id`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(journalToRow(space, journal)),
  });
  return journal;
}

export async function putMany(space: string, journals: Journal[]): Promise<void> {
  if (journals.length === 0) return;
  await request(`${TABLE}?on_conflict=id`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(journals.map((j) => journalToRow(space, j))),
  });
}

/** Delete a journal by id regardless of which space it is in. */
export async function removeById(id: string): Promise<void> {
  await request(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers({ Prefer: 'return=minimal' }),
  });
}
