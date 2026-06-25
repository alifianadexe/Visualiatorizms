import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import JournalCard from '../components/JournalCard';
import { PlusIcon, SearchIcon } from '../components/Icons';
import { useApp } from '../appContext';

type Filter = 'all' | 'public' | 'private';

export default function HomePage() {
  const { journals, loading } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return journals.filter((j) => {
      if (filter !== 'all' && j.visibility !== filter) return false;
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.note.toLowerCase().includes(q) ||
        j.code.toLowerCase().includes(q)
      );
    });
  }, [journals, query, filter]);

  return (
    <div className="page home">
      <section className="hero">
        <h1 className="hero-title">Your code journal</h1>
        <p className="hero-sub">
          Write a note, paste a JSX/TSX component, and get a page where it runs
          live — your own library of learning artifacts.
        </p>
      </section>

      <div className="home-toolbar">
        <div className="search-field">
          <SearchIcon className="search-icon" width={18} height={18} />
          <input
            type="search"
            className="search-input"
            placeholder="Search notes, titles, and code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-toggle" role="group" aria-label="Filter by visibility">
          {(['all', 'public', 'private'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card card-skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasJournals={journals.length > 0} />
      ) : (
        <div className="grid">
          {filtered.map((j) => (
            <JournalCard key={j.id} journal={j} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasJournals }: { hasJournals: boolean }) {
  if (hasJournals) {
    return (
      <div className="empty">
        <p>No entries match your search.</p>
      </div>
    );
  }
  return (
    <div className="empty">
      <p className="empty-title">No entries yet</p>
      <p className="empty-sub">Create your first journal entry to get started.</p>
      <Link to="/new" className="btn btn-primary">
        <PlusIcon width={18} height={18} />
        <span>New entry</span>
      </Link>
    </div>
  );
}
