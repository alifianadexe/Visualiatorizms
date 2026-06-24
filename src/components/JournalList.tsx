import { useRef } from 'react';
import type { Journal } from '../types';

interface JournalListProps {
  journals: Journal[];
  activeId: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (text: string) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function JournalList({
  journals,
  activeId,
  query,
  onQueryChange,
  onSelect,
  onCreate,
  onDelete,
  onExport,
  onImport,
}: JournalListProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImport(String(reader.result ?? ''));
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-mark">{'</>'}</span>
          <span className="brand-name">Visualiatorizms</span>
        </div>
        <button className="btn btn-primary" onClick={onCreate}>
          + New
        </button>
      </div>

      <input
        className="search"
        type="search"
        placeholder="Search journals…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <nav className="journal-list">
        {journals.length === 0 && (
          <p className="empty-hint">No journals yet. Create your first one!</p>
        )}
        {journals.map((j) => (
          <button
            key={j.id}
            className={`journal-item ${j.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(j.id)}
          >
            <span className="journal-item-main">
              <span className="journal-title">{j.title || 'Untitled'}</span>
              <span className="journal-meta">
                <span className={`lang-badge lang-${j.language}`}>{j.language}</span>
                {formatDate(j.updatedAt)}
              </span>
            </span>
            <span
              className="journal-delete"
              role="button"
              aria-label="Delete journal"
              title="Delete journal"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${j.title || 'Untitled'}"? This cannot be undone.`)) {
                  onDelete(j.id);
                }
              }}
            >
              ✕
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-ghost" onClick={onExport} title="Download all journals as JSON">
          ⬇ Export
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => fileInput.current?.click()}
          title="Import journals from a JSON file"
        >
          ⬆ Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden-input"
          onChange={handleFile}
        />
      </div>
    </aside>
  );
}
