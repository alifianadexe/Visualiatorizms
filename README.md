# Visualiatorizms

A **developer journal** for learning. Each entry is a **Title + Note + Code**,
and saving it produces a dedicated page where the JSX/TSX **runs live** — your
own growing library of runnable artifacts.

## The flow

1. Click **New entry**.
2. Fill in a **Title**, a **Note** (Markdown), and your **Code** (JSX or TSX).
   A live preview updates as you type.
3. **Save** → you land on the entry's page, where the component runs for real,
   right beside your note. Edit or delete it anytime.

Entries are listed on the home page and are fully searchable across title,
note, and code.

## Features

- ⚛️ **Live JSX/TSX** — compiled in the browser with `@babel/standalone`
  (JSX **and** TypeScript), rendered behind an error boundary so a bad snippet
  shows a friendly message instead of a blank screen.
- 📝 **Markdown notes** rendered with `marked`.
- 💾 **Durable storage** — entries are saved in **IndexedDB** (see below), so
  they persist long-term on your device. Data from the previous localStorage
  version is migrated automatically on first load.
- 📦 **Export / Import** all entries as a JSON file (toolbar icons) for backup.
- 🎨 **Tailwind ready** — Tailwind Play CDN is loaded, so utility classes in
  your pasted components work out of the box, just like artifacts.
- 🌱 **Seeded examples** on first run (welcome, live clock, bar chart).

## Storage

By default, journals are stored in **IndexedDB** (`src/db.ts`) — durable,
offline, and local to one browser. A small facade in
[`src/store.ts`](src/store.ts) routes reads/writes either to that local store
or to the cloud, depending on whether sync is on.

### Cross-device sync (optional)

To sync journals across devices, connect a free **Supabase** project. The app
calls Supabase's REST API directly from the browser (`src/cloud.ts`) — no
backend server. Sync is **login-free**: each journal set lives under a long,
random **sync code**; turn on sync on one device to get a code, then enter that
same code on another device to share the data.

Click the **cloud icon** in the header to manage it. Full setup (create the
project, run one SQL snippet, set two env vars) is in
**[SUPABASE.md](SUPABASE.md)**. Without configuration the app simply stays
local.

> Trade-off: anyone who has your sync code can read/edit that journal set, so
> keep it private. (Email-login accounts can be added later if you want stricter
> privacy.)

## Writing a component

Each entry's code should `export default` a React component:

```tsx
export default function Demo() {
  const [count, setCount] = useState(0);
  return (
    <button
      className="rounded bg-emerald-500 px-4 py-2 text-white"
      onClick={() => setCount((c) => c + 1)}
    >
      Clicked {count} times
    </button>
  );
}
```

- Common hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`,
  `useReducer`, `useContext`, `useLayoutEffect`, `Fragment`) are available
  without importing them. You can also `import React from 'react'` explicitly.
- Only `react` and `react-dom` are importable in the sandbox.

## Design

The UI was designed with the **`ui-ux-pro-max`** skill, installed in this repo
at [`.claude/skills/ui-ux-pro-max`](.claude/skills/ui-ux-pro-max). It produced
the dark, developer-minimal direction: JetBrains Mono headings, IBM Plex Sans
body, a slate palette with a green "run" accent, high contrast, and generous
whitespace.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

## Deployment (Netlify)

`netlify.toml` is included: build command `npm run build`, publish dir `dist`,
plus an SPA redirect. Import the repo in Netlify and deploy `main`. Routing uses
a hash router, so it also works on any static host (including GitHub Pages)
without server-side rewrite rules.

## Tech

React 18 · React Router · Vite · TypeScript · `@babel/standalone` · `marked`
· IndexedDB.
