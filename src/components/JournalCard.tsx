import { Link } from 'react-router-dom';
import type { Journal } from '../types';

function excerpt(md: string, max = 140): string {
  const plain = md
    .replace(/[#>*_`~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? plain.slice(0, max) + '…' : plain;
}

function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const day = 86_400_000;
  if (diff < day) return 'today';
  if (diff < 2 * day) return 'yesterday';
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function JournalCard({ journal }: { journal: Journal }) {
  return (
    <Link to={`/entry/${journal.id}`} className="card">
      <div className="card-top">
        <span className={`badge badge-${journal.language}`}>{journal.language}</span>
        <span className="card-date">{relativeDate(journal.updatedAt)}</span>
      </div>
      <h3 className="card-title">{journal.title || 'Untitled entry'}</h3>
      <p className="card-excerpt">
        {excerpt(journal.note) || 'No notes yet — open to run the code.'}
      </p>
    </Link>
  );
}
