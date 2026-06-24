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
