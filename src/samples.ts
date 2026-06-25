import type { Journal } from './types';

export const DEFAULT_CODE = `export default function Demo() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 font-sans">
      <h2 className="text-2xl font-semibold text-slate-800">
        Hello from your live component
      </h2>
      <p className="text-slate-500">Edit the code and re-open to see changes.</p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-600"
      >
        Clicked {count} times
      </button>
    </div>
  );
}
`;

export const SEED_JOURNALS: Partial<Journal>[] = [
  {
    title: 'Welcome to your code journal',
    language: 'tsx',
    note:
      '# Welcome 👋\n\n' +
      'This is a **journal for learning**. Every entry has three parts:\n\n' +
      '1. **Title** — what the entry is about\n' +
      '2. **Note** — your notes, written in Markdown\n' +
      '3. **Code** — a JSX/TSX component\n\n' +
      'When you save an entry it gets its own page where the code **runs live**, ' +
      'right next to your notes. Open this entry to see it in action, then hit ' +
      '**Edit** to change the code.',
    code: DEFAULT_CODE,
  },
  {
    title: 'useEffect — a live clock',
    language: 'tsx',
    note:
      '## `useEffect` with cleanup\n\n' +
      'The interval is created on mount and **cleared on unmount**, so it never ' +
      'leaks. Returning a function from `useEffect` is how you clean up.',
    code: `export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full items-center justify-center bg-slate-900 font-sans">
      <div className="rounded-2xl border border-slate-700 bg-slate-800 px-10 py-8 text-center">
        <div className="font-mono text-5xl font-bold tracking-tight text-emerald-400 tabular-nums">
          {now.toLocaleTimeString()}
        </div>
        <div className="mt-2 text-sm text-slate-400">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>
    </div>
  );
}
`,
  },
  {
    title: 'Visualizing data — a bar chart',
    language: 'tsx',
    note:
      '## A chart with no chart library\n\n' +
      'Pure JSX + a little state. Great for explaining a concept visually inside ' +
      'a note. Press **Shuffle** to regenerate the data.',
    code: `export default function BarChart() {
  const [data, setData] = useState([40, 70, 30, 90, 55, 20, 80]);
  const shuffle = () =>
    setData((d) => d.map(() => Math.round(10 + Math.random() * 90)));
  const max = Math.max(...data);

  return (
    <div className="p-6 font-sans">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Weekly activity</h3>
        <button
          onClick={shuffle}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          Shuffle
        </button>
      </div>
      <div className="flex h-56 items-end gap-3">
        {data.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-emerald-500 transition-all duration-500"
              style={{ height: \`\${(v / max) * 100}%\` }}
            />
            <span className="text-xs text-slate-500 tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
  },
];
