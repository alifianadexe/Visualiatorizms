import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PreviewPanel from '../components/PreviewPanel';
import Markdown from '../components/Markdown';
import {
  ArrowLeftIcon,
  EditIcon,
  GlobeIcon,
  LockIcon,
  PlayIcon,
  TrashIcon,
} from '../components/Icons';
import { useApp } from '../appContext';
import { getOne } from '../store';
import type { Journal } from '../types';

export default function EntryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { journals, loading, deleteJournal } = useApp();
  const [journal, setJournal] = useState<Journal | null | undefined>(undefined);

  // Prefer the in-memory list; fall back to a direct DB read (e.g. deep link).
  useEffect(() => {
    const fromList = journals.find((j) => j.id === id);
    if (fromList) {
      setJournal(fromList);
      return;
    }
    if (loading) return;
    let alive = true;
    getOne(id ?? '').then((j) => {
      if (alive) setJournal(j ?? null);
    });
    return () => {
      alive = false;
    };
  }, [id, journals, loading]);

  if (journal === undefined) {
    return <div className="page entry">Loading…</div>;
  }

  if (journal === null) {
    return (
      <div className="page entry">
        <div className="empty">
          <p className="empty-title">Entry not found</p>
          <Link to="/" className="btn">Back to journal</Link>
        </div>
      </div>
    );
  }

  async function handleDelete() {
    if (!journal) return;
    if (confirm(`Delete "${journal.title || 'Untitled entry'}"? This cannot be undone.`)) {
      await deleteJournal(journal.id);
      navigate('/');
    }
  }

  return (
    <article className="page entry">
      <div className="entry-nav">
        <Link to="/" className="link-back">
          <ArrowLeftIcon width={18} height={18} />
          <span>All entries</span>
        </Link>
        <div className="entry-actions">
          <Link to={`/entry/${journal.id}/edit`} className="btn">
            <EditIcon width={18} height={18} />
            <span>Edit</span>
          </Link>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            <TrashIcon width={18} height={18} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <header className="entry-head">
        <span className="card-badges">
          <span className={`badge badge-${journal.language}`}>{journal.language}</span>
          <span className={`vis-badge vis-${journal.visibility}`}>
            {journal.visibility === 'public' ? (
              <GlobeIcon width={12} height={12} />
            ) : (
              <LockIcon width={12} height={12} />
            )}
            {journal.visibility}
          </span>
        </span>
        <h1 className="entry-title">{journal.title || 'Untitled entry'}</h1>
        <p className="entry-meta">
          Updated{' '}
          {new Date(journal.updatedAt).toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </header>

      <section className="result-block">
        <div className="block-label">
          <PlayIcon width={16} height={16} />
          <span>Result</span>
        </div>
        <PreviewPanel
          code={journal.code}
          language={journal.language}
          title="Result"
        />
      </section>

      {journal.note.trim() && (
        <section className="note-block">
          <div className="block-label">Note</div>
          <Markdown source={journal.note} className="entry-note" />
        </section>
      )}

      <details className="source-block">
        <summary>View source</summary>
        <pre className="source-code">
          <code>{journal.code}</code>
        </pre>
      </details>
    </article>
  );
}
