import { useState } from 'react';
import { marked } from 'marked';
import CodeEditor from './CodeEditor';
import LivePreview from './LivePreview';
import { LANGUAGES } from '../storage';
import type { Journal, Language } from '../types';

interface JournalEditorProps {
  journal: Journal;
  onChange: (patch: Partial<Journal>) => void;
}

type Tab = 'run' | 'notes';

export default function JournalEditor({ journal, onChange }: JournalEditorProps) {
  const [tab, setTab] = useState<Tab>('run');

  return (
    <section className="editor">
      <header className="editor-header">
        <input
          className="title-input"
          value={journal.title}
          placeholder="Journal title"
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <div className="editor-controls">
          <select
            className="lang-select"
            value={journal.language}
            onChange={(e) => onChange({ language: e.target.value as Language })}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab ${tab === 'run' ? 'active' : ''}`}
          onClick={() => setTab('run')}
        >
          Code &amp; Run
        </button>
        <button
          className={`tab ${tab === 'notes' ? 'active' : ''}`}
          onClick={() => setTab('notes')}
        >
          Notes
        </button>
      </div>

      {tab === 'run' ? (
        <div className="split">
          <div className="pane">
            <div className="pane-label">{journal.language.toUpperCase()} source</div>
            <CodeEditor
              value={journal.code}
              onChange={(code) => onChange({ code })}
            />
          </div>
          <div className="pane">
            <div className="pane-label">Live preview</div>
            <div className="preview-surface">
              <LivePreview code={journal.code} language={journal.language} />
            </div>
          </div>
        </div>
      ) : (
        <div className="split">
          <div className="pane">
            <div className="pane-label">Notes (Markdown)</div>
            <textarea
              className="notes-editor"
              value={journal.notes}
              placeholder="Write what you learned… Markdown is supported."
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </div>
          <div className="pane">
            <div className="pane-label">Rendered</div>
            <div
              className="notes-rendered"
              dangerouslySetInnerHTML={{
                __html: journal.notes.trim()
                  ? (marked.parse(journal.notes) as string)
                  : '<p class="empty-hint">Your rendered notes will appear here.</p>',
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
