# Cloud sync setup (Supabase)

This app can sync your journals across devices using a free **Supabase**
project. It talks to Supabase's REST API directly from the browser — there is
no backend server to run.

Sync uses a **sync code** instead of a login: each set of journals lives under
a long, random code. Turn on sync on one device to get a code, then enter that
same code on another device to load the same journals.

> ⚠️ Trade-off: anyone who has your sync code can read and edit that journal
> set. Treat the code like a password. (If you'd rather have proper accounts,
> we can switch to Supabase email login later.)

## 1. Create a project

1. Go to <https://supabase.com> and sign up (free).
2. **New project** → pick a name, a database password, and a region. Wait ~2
   minutes for it to provision.

## 2. Create the table

Open **SQL Editor** in the Supabase dashboard, paste this, and run it:

```sql
create table if not exists public.journals (
  id          text primary key,
  space_id    text not null,
  title       text not null default '',
  note        text not null default '',
  code        text not null default '',
  language    text not null default 'tsx',
  created_at  bigint not null,
  updated_at  bigint not null
);

create index if not exists journals_space_id_idx on public.journals (space_id);

-- Row Level Security. Access is gated by knowing the (unguessable) space_id,
-- so we allow the anonymous public role to operate on the table.
alter table public.journals enable row level security;

create policy "anon can read"   on public.journals for select using (true);
create policy "anon can insert" on public.journals for insert with check (true);
create policy "anon can update" on public.journals for update using (true) with check (true);
create policy "anon can delete" on public.journals for delete using (true);
```

## 3. Get your keys

In the dashboard: **Settings → API**. Copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

(The `anon` key is safe to expose in a frontend — that's what it's for.)

## 4. Configure the app

**Local development:** create a `.env` file (see `.env.example`):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

Restart `npm run dev`.

**On Netlify:** Site configuration → Environment variables → add both
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then trigger a redeploy
(env vars are read at build time).

## 5. Use it

1. Click the **cloud icon** in the header.
2. Choose **Turn on sync** — this uploads the journals already on this device
   and shows your sync code. Copy it.
3. On another device, open the app, click the cloud icon, choose **Connect with
   a code**, and paste the code. Both devices now share the same journals.

To stop syncing on a device, open the dialog and choose **Stop syncing** (your
data stays in the cloud and on other connected devices).
