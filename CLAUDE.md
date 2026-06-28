# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

**Visualiatorizms** is a developer journal for learning. Each entry is a
**Title + Note (Markdown) + Code**, and saving it produces a dedicated page
where the JSX/TSX **runs live** in the browser — a personal, growing library of
runnable artifacts.

It is a single-page React app with **no backend server**. Code is compiled in
the browser with `@babel/standalone`; entries persist in **IndexedDB** locally
and optionally sync to **Supabase** (REST/PostgREST, called directly from the
browser). It deploys as static files (Netlify / GitHub Pages / any static host).

## Tech stack

- **React 18** + **react-router-dom v6** (HashRouter — works on any static host
  without server rewrites)
- **Vite 5** + **TypeScript 5** (strict mode, `noEmit` — Vite does the bundling)
- **`@babel/standalone`** for in-browser JSX/TSX compilation
- **`marked`** for Markdown rendering
- **Tailwind Play CDN** (loaded in `index.html`) so pasted components can use
  utility classes — Tailwind is NOT a build dependency
- Fonts (JetBrains Mono + IBM Plex Sans) loaded from Google Fonts in `index.html`

There is no test runner, no ESLint config, and no Prettier config in the repo.
"CI" is a type-check + build only.

## Commands

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # tsc --noEmit (type-check) THEN vite build → dist/
npm run preview  # serve the production build
```

`npm run build` is the gate: it type-checks the whole `src` tree and fails the
build on any TypeScript error. **Run `npm run build` to validate changes** —
there is no separate lint/test step. This is exactly what CI runs
(`.github/workflows/ci.yml`, Node 20).

## Architecture & data flow

```
main.tsx → App.tsx (HashRouter + DataProvider) → pages → components
                         │
                         └── store.ts (facade)
                               ├── db.ts     (IndexedDB, always-on local cache)
                               └── cloud.ts  (Supabase REST, optional sync)
```

### The storage facade — read this before touching persistence

`src/store.ts` is the **single entry point** for all reads/writes. Pages and
`App.tsx` import from `store`, never from `db`/`cloud` directly. The facade:

- Treats local **IndexedDB as a write-through cache** so the app works offline
  and never hides an entry because a cloud request lagged.
- On read (`getAll`), merges cloud + local **by id, with cloud as the source of
  truth** and local filling gaps; sorts newest-`updatedAt` first.
- On write (`put`/`remove`), writes local first, then best-effort to cloud.
- Wraps cloud calls in try/catch and falls back to local — cloud failures must
  never break the app.

When adding a persistence operation, add it to `store.ts` and route through both
layers; don't let UI code call `db`/`cloud` directly.

### The runner — in-browser compilation

`src/runner.ts` `compile(code, language)` turns a snippet into a React
component. Key conventions baked in:

- User code must `export default` a React component (artifact convention). If no
  default, the first exported function is used as a fallback.
- Babel presets: `react` (classic runtime) + `typescript` (TSX). Modules are
  transformed to CommonJS and run via `new Function`.
- A `require` **shim** exposes only `react` and `react-dom` — any other import
  throws a friendly error. The sandbox is deliberately tiny.
- Common hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`,
  `useReducer`, `useContext`, `useLayoutEffect`, `Fragment`) are injected into
  scope via a preamble, so bare usage works without imports.

`LivePreview.tsx` calls `compile` inside `useMemo` and renders the result behind
a class-based `RuntimeErrorBoundary` (keyed on `code` so it resets per snippet).
Compile errors and runtime errors both show a friendly `ErrorPanel` instead of a
blank screen.

### HTML entries are different

When `language === 'html'`, code is NOT compiled. `HtmlPreview.tsx` renders it
in a **sandboxed iframe** via `srcDoc` (`sandbox="allow-scripts allow-modals
allow-popups allow-forms"`) — full HTML/CSS/JS in isolation, no React scope.

### Routing & state

- `App.tsx` holds `DataProvider`, the single source of in-memory state
  (`journals`, `loading`, `sync`). It exposes actions through React Router's
  `Outlet` context; consume them with `useApp()` from `src/appContext.ts`.
- After any mutation, call the provided action (`saveJournal`/`deleteJournal`/
  etc.) which calls `store` then `refresh()` — don't mutate `journals` directly.
- The editor route (`/new`, `/entry/:id/edit`) is **remounted per route** via a
  `key` on `EditorRoute` so draft state resets cleanly on navigation.
- Routes: `/` (HomePage), `/new` (EditorPage), `/entry/:id` (EntryPage),
  `/entry/:id/edit` (EditorPage), `*` → HomePage.

## The data model

`src/types.ts` is the contract. A `Journal` has: `id`, `title`, `note`
(Markdown), `code`, `language` (`'tsx' | 'jsx' | 'html'`), `visibility`
(`'public' | 'private'`), `createdAt`, `updatedAt`.

- Use `asLanguage(value)` to coerce untrusted input to a valid `Language`
  (defaults to `tsx`). `LANGUAGES` is the canonical list for UI toggles.
- **Visibility is encoded by which Supabase space a row lives in**, not stored
  as a column: public rows live in the `PUBLIC_SPACE` (`'public'`); private rows
  live under a random sync code. `cloud.ts` derives `visibility` from
  `space_id`. Keep this mapping intact when touching cloud code.

## Cloud sync model (sync codes, login-free)

`src/cloud.ts` talks to Supabase PostgREST directly. There is no auth/login —
access is by **sync code**: a long random `space_id` (e.g.
`vzm-xxxx-xxxx-xxxx-xxxx`). Anyone with the code can read/write that space, so
it's treated like a password. Public journals share the fixed `'public'` space.

- Config lives in `src/supabaseConfig.ts`. The Supabase URL and **publishable**
  key are committed as defaults (publishable keys are browser-safe by design and
  end up in the bundle regardless). Override with `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` env vars (see `.env.example`).
- Auth header quirk: new `sb_*` publishable/secret keys go in `apikey` only,
  NOT as a `Bearer` token. Legacy JWT anon keys also go in `Authorization`.
  `headers()` in `cloud.ts` handles this — don't regress it.
- DB columns are **snake_case** (`space_id`, `created_at`, …); `rowToJournal` /
  `journalToRow` map to/from the camelCase `Journal`. The table schema (and RLS
  policy) is documented in `SUPABASE.md` — run that SQL once per project.
- Upserts use `on_conflict=id` + `Prefer: resolution=merge-duplicates`.

## Bootstrap, migration & seeding

- `db.ts` `bootstrap()` runs once on first `getAll`: if the store is empty, it
  migrates legacy `localStorage` data (`visualiatorizms.journals.v1`, old field
  name was `notes`), else seeds examples from `samples.ts` (welcome, live clock,
  bar chart) gated on `visualiatorizms.seeded.v1`.
- `store.ts` `migrate()` runs once when cloud is configured: uploads pre-cloud
  local journals to their spaces, gated on `visualiatorizms.cloudMigrated.v1`.
  The flag is left unset on failure so it retries next load.
- `localStorage` keys are namespaced `visualiatorizms.*` and accessed through
  `safeGet`/`safeSet` wrappers that swallow errors (private mode, etc.).

## File map

| Path | Role |
|------|------|
| `src/main.tsx` | React root (StrictMode) |
| `src/App.tsx` | Router + `DataProvider` (in-memory state, actions) |
| `src/appContext.ts` | `AppContext` type + `useApp()` outlet-context hook |
| `src/store.ts` | **Storage facade** — local + cloud, merge logic, sync lifecycle |
| `src/db.ts` | IndexedDB wrapper, bootstrap, legacy migration, `newJournal`/`uid` |
| `src/cloud.ts` | Supabase REST client, sync codes, row↔journal mapping |
| `src/supabaseConfig.ts` | Supabase URL/key (env-overridable defaults) |
| `src/runner.ts` | In-browser Babel compile → React component |
| `src/types.ts` | `Journal`, `Language`, `Visibility`, `asLanguage`, constants |
| `src/samples.ts` | Seed entries + per-language starter code (`DEFAULT_CODE_FOR`, `isStarterCode`) |
| `src/pages/` | `HomePage` (list/search/filter), `EditorPage` (draft editor), `EntryPage` (view) |
| `src/components/` | `Layout`, `LivePreview`, `HtmlPreview`, `PreviewPanel`, `CodeEditor`, `Markdown`, `JournalCard`, `SyncDialog`, `Icons` |
| `src/index.css` | All styling (hand-written CSS; class names referenced across components) |

## Conventions for changes

- **Validate with `npm run build`** before committing — it's the only gate and
  it must pass (strict TS, `noFallthroughCasesInSwitch`).
- TypeScript is strict; keep it that way. Coerce untrusted/imported data through
  helpers like `asLanguage` rather than casting.
- Route all persistence through `store.ts`; keep IndexedDB as a write-through
  cache and treat cloud failures as non-fatal (try/catch + local fallback).
- Styling is plain CSS in `src/index.css` with semantic class names — there is
  no CSS-in-JS or Tailwind build step (the Tailwind CDN only serves pasted user
  code). Match existing class-naming patterns.
- The dark, developer-minimal design language (JetBrains Mono headings, IBM Plex
  Sans body, slate palette, green "run" accent) was produced with the
  `ui-ux-pro-max` skill at `.claude/skills/ui-ux-pro-max`. Keep new UI
  consistent with it.
- `CodeEditor` is intentionally a dependency-free `<textarea>` with tab-indent;
  keep the editor lightweight unless asked otherwise.
- Don't commit `.env` (gitignored). The committed publishable Supabase key is
  intentional and browser-safe — don't treat it as a leaked secret.

## Deployment

- **Netlify**: `netlify.toml` sets build `npm run build`, publish `dist`, plus an
  SPA redirect. Set Supabase env vars in the Netlify dashboard to point at your
  own project.
- **Any static host / GitHub Pages**: works as-is. `vite.config.ts` uses
  `base: './'` (relative paths) and the app uses HashRouter, so no server-side
  rewrite rules are needed.
