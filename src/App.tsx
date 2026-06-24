import { useEffect, useMemo, useRef, useState } from 'react';
import JournalList from './components/JournalList';
import JournalEditor from './components/JournalEditor';
import {
  createJournal,
  exportJournals,
  loadOrSeedJournals,
  parseImported,
  saveJournals,
} from './storage';
import type { Journal } from './types';

export default function App() {
  const initial = useRef<Journal[]>(loadOrSeedJournals());
  const [journals, setJournals] = useState<Journal[]>(() => initial.current);
  const [activeId, setActiveId] = useState<string | null>(
    () => initial.current[0]?.id ?? null
  );
  const [query, setQuery] = useState('');

  // Persist to localStorage whenever journals change.
  useEffect(() => {
    saveJournals(journals);
  }, [journals]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...journals].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.notes.toLowerCase().includes(q) ||
        j.code.toLowerCase().includes(q)
    );
  }, [journals, query]);

  const active = useMemo(
    () => journals.find((j) => j.id === activeId) ?? null,
    [journals, activeId]
  );

  function handleCreate() {
    const journal = createJournal();
    setJournals((prev) => [journal, ...prev]);
    setActiveId(journal.id);
    setQuery('');
  }

  function handleDelete(id: string) {
    setJournals((prev) => prev.filter((j) => j.id !== id));
    setActiveId((curr) => {
      if (curr !== id) return curr;
      const remaining = journals.filter((j) => j.id !== id);
      return remaining[0]?.id ?? null;
    });
  }

  function handlePatch(patch: Partial<Journal>) {
    if (!active) return;
    setJournals((prev) =>
      prev.map((j) =>
        j.id === active.id ? { ...j, ...patch, updatedAt: Date.now() } : j
      )
    );
  }

  function handleExport() {
    const blob = new Blob([exportJournals(journals)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualiatorizms-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(text: string) {
    try {
      const imported = parseImported(text);
      if (imported.length === 0) {
        alert('No journals found in that file.');
        return;
      }
      setJournals((prev) => [...imported, ...prev]);
      setActiveId(imported[0].id);
      setQuery('');
    } catch (err) {
      alert(`Could not import file: ${err instanceof Error ? err.message : err}`);
    }
  }

  return (
    <div className="app">
      <JournalList
        journals={filtered}
        activeId={activeId}
        query={query}
        onQueryChange={setQuery}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImport}
      />
      <main className="main">
        {active ? (
          <JournalEditor journal={active} onChange={handlePatch} />
        ) : (
          <Welcome onCreate={handleCreate} />
        )}
      </main>
    </div>
  );
}

function Welcome({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="welcome">
      <h1>Your JSX/TSX Learning Journal</h1>
      <p>
        Write notes and paste live React components — the same JSX/TSX artifacts
        you get when you ask for a visualization. Everything runs right here in
        your browser and is saved locally.
      </p>
      <button className="btn btn-primary btn-lg" onClick={onCreate}>
        + Create your first journal
      </button>
    </div>
  );
}
