import type { Journal, Language } from './types';

const STORAGE_KEY = 'visualiatorizms.journals.v1';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function loadJournals(): Journal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Journal[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveJournals(journals: Journal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journals));
}

const SEEDED_KEY = 'visualiatorizms.seeded.v1';

/**
 * On the very first visit (no journals and never seeded before) return a few
 * example journals so the platform isn't an empty void. Runs once.
 */
export function loadOrSeedJournals(): Journal[] {
  const existing = loadJournals();
  if (existing.length > 0) return existing;
  if (localStorage.getItem(SEEDED_KEY)) return existing;

  const seeded = SEED_JOURNALS.map((s) => createJournal(s));
  localStorage.setItem(SEEDED_KEY, '1');
  saveJournals(seeded);
  return loadJournals();
}

/** Serialize all journals for download/backup. */
export function exportJournals(journals: Journal[]): string {
  return JSON.stringify({ version: 1, journals }, null, 2);
}

/**
 * Parse a previously exported file. Accepts either the wrapped
 * `{ version, journals }` shape or a bare array. Throws on invalid input.
 */
export function parseImported(raw: string): Journal[] {
  const data = JSON.parse(raw);
  const list: unknown = Array.isArray(data) ? data : data?.journals;
  if (!Array.isArray(list)) {
    throw new Error('File does not contain a journals array.');
  }
  return list.map((item) =>
    createJournal({
      title: item?.title,
      notes: item?.notes,
      code: item?.code,
      language: item?.language === 'jsx' ? 'jsx' : 'tsx',
    })
  );
}

export function createJournal(partial?: Partial<Journal>): Journal {
  const now = Date.now();
  return {
    id: uid(),
    title: partial?.title ?? 'Untitled journal',
    notes: partial?.notes ?? '',
    code: partial?.code ?? DEFAULT_CODE,
    language: partial?.language ?? 'tsx',
    createdAt: now,
    updatedAt: now,
  };
}

export const DEFAULT_CODE = `export default function Demo() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 font-sans text-center">
      <h2 className="text-xl font-semibold text-indigo-700">
        Hello from your live component!
      </h2>
      <p className="mt-2 text-slate-600">
        Edit the code on the left and watch it update here.
      </p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        Clicked {count} times
      </button>
    </div>
  );
}
`;

export const LANGUAGES: Language[] = ['tsx', 'jsx'];

const SEED_JOURNALS: Partial<Journal>[] = [
  {
    title: 'Welcome — counter demo',
    language: 'tsx',
    notes:
      '# Welcome to Visualiatorizms 👋\n\n' +
      'Each journal has **Notes** (this tab) and a **Code & Run** tab with a live ' +
      'JSX/TSX component.\n\n' +
      '- Edit the code and the preview updates instantly.\n' +
      '- Hooks like `useState` work without importing them.\n' +
      '- Tailwind classes work out of the box.\n\n' +
      'Try bumping the counter in the Code & Run tab →',
    code: DEFAULT_CODE,
  },
  {
    title: 'useEffect + interval clock',
    language: 'tsx',
    notes:
      '## Live clock\n\n' +
      'A tiny example of `useEffect` with cleanup. Notice the interval is cleared ' +
      'when the component unmounts so it never leaks.',
    code: `export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full items-center justify-center bg-slate-900 font-sans">
      <div className="rounded-2xl bg-slate-800 px-10 py-8 text-center shadow-xl">
        <div className="text-5xl font-bold tracking-tight text-emerald-400 tabular-nums">
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
    title: 'Bar chart visualization',
    language: 'tsx',
    notes:
      '## Animated bar chart\n\n' +
      'Pure JSX visualization — no chart library. Great for explaining data in a ' +
      'learning note. Click **Shuffle** to regenerate the values.',
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
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
        >
          Shuffle
        </button>
      </div>
      <div className="flex h-56 items-end gap-3">
        {data.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-400 transition-all duration-500"
              style={{ height: \`\${(v / max) * 100}%\` }}
            />
            <span className="text-xs text-slate-500">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
  },
];
