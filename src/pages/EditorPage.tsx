import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import PreviewPanel from '../components/PreviewPanel';
import { ArrowLeftIcon, PlayIcon, SaveIcon } from '../components/Icons';
import { useApp } from '../appContext';
import { getOne, newJournal } from '../store';
import { DEFAULT_CODE } from '../samples';
import { LANGUAGES, type Journal, type Language } from '../types';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { journals, loading, saveJournal } = useApp();
  const isEdit = Boolean(id);

  const [draft, setDraft] = useState<Journal | null>(null);
  const [saving, setSaving] = useState(false);

  // Load the entry being edited, or start a fresh draft for a new one.
  useEffect(() => {
    if (!isEdit) {
      setDraft(newJournal({ code: DEFAULT_CODE }));
      return;
    }
    const fromList = journals.find((j) => j.id === id);
    if (fromList) {
      setDraft(fromList);
      return;
    }
    if (loading) return;
    getOne(id ?? '').then((j) => setDraft(j ?? null));
  }, [id, isEdit, journals, loading]);

  if (draft === null && isEdit) {
    return (
      <div className="page editor">
        <div className="empty">
          <p className="empty-title">Entry not found</p>
          <Link to="/" className="btn">Back to journal</Link>
        </div>
      </div>
    );
  }

  if (!draft) {
    return <div className="page editor">Loading…</div>;
  }

  const patch = (p: Partial<Journal>) =>
    setDraft((d) => (d ? { ...d, ...p } : d));

  async function handleSave() {
    if (!draft || saving) return;
    setSaving(true);
    const toSave: Journal = {
      ...draft,
      title: draft.title.trim() || 'Untitled entry',
      updatedAt: Date.now(),
    };
    const saved = await saveJournal(toSave);
    navigate(`/entry/${saved.id}`);
  }

  return (
    <div className="page editor">
      <div className="editor-bar">
        <Link to={isEdit ? `/entry/${draft.id}` : '/'} className="link-back">
          <ArrowLeftIcon width={18} height={18} />
          <span>{isEdit ? 'Back to entry' : 'All entries'}</span>
        </Link>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          <SaveIcon width={18} height={18} />
          <span>{saving ? 'Saving…' : 'Save entry'}</span>
        </button>
      </div>

      <div className="editor-grid">
        <form className="editor-form" onSubmit={(e) => e.preventDefault()}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              className="text-input"
              placeholder="What is this entry about?"
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="note">Note</label>
            <p className="field-hint">Markdown supported.</p>
            <textarea
              id="note"
              className="note-input"
              placeholder="What did you learn? Add context for this component…"
              value={draft.note}
              onChange={(e) => patch({ note: e.target.value })}
            />
          </div>

          <div className="field">
            <div className="field-row">
              <label htmlFor="code">Code</label>
              <div className="lang-toggle" role="group" aria-label="Language">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`lang-pill ${draft.language === l ? 'active' : ''}`}
                    onClick={() => patch({ language: l as Language })}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="code-wrap">
              <CodeEditor
                value={draft.code}
                onChange={(code) => patch({ code })}
              />
            </div>
          </div>
        </form>

        <div className="editor-preview">
          <div className="block-label">
            <PlayIcon width={16} height={16} />
            <span>Live preview</span>
          </div>
          <PreviewPanel
            code={draft.code}
            language={draft.language}
            title="Live preview"
          />
        </div>
      </div>
    </div>
  );
}
