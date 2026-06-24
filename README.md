# Visualiatorizms

A simple **notes / learning journal** platform where each entry can contain a
**live, runnable JSX or TSX component** — the same kind of "artifacts" you get
when you ask for an example or a visualization. Paste your code, hit nothing,
and it just runs.

## Features

- 📝 **Journals** — keep as many learning notes as you like, each with a title,
  Markdown notes, and a code component.
- ⚛️ **Live JSX/TSX** — paste a React component and see it render instantly. The
  code is compiled in your browser with Babel (JSX **and** TypeScript supported).
- 💾 **Local-first** — everything is saved to your browser's `localStorage`. No
  account, no server, no setup.
- 🎨 **Tailwind ready** — Tailwind (Play CDN) is loaded, so utility classes in
  your pasted components work out of the box, just like artifacts.
- 🔎 **Search** across titles, notes, and code.

## Writing a component

Each journal's code should `export default` a React component:

```tsx
export default function Demo() {
  const [count, setCount] = useState(0);
  return (
    <button
      className="rounded bg-indigo-600 px-4 py-2 text-white"
      onClick={() => setCount((c) => c + 1)}
    >
      Clicked {count} times
    </button>
  );
}
```

Notes:

- Common hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`,
  `useReducer`, `useContext`, `useLayoutEffect`, `Fragment`) are available
  without importing them. You can also `import React from 'react'` explicitly.
- Only `react` and `react-dom` are importable in the sandbox.
- Both `.jsx` and `.tsx` are supported — pick the language from the dropdown.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

## Tech

React 18 · Vite · TypeScript · `@babel/standalone` (in-browser compile) ·
`marked` (Markdown notes).
