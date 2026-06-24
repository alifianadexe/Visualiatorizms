import type { Journal } from '../types';

interface JournalListProps {
  journals: Journal[];
  activeId: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
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
}: JournalListProps) {
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
    </aside>
  );
}
