import { useEffect, useRef, useState } from 'react';
import LivePreview from './LivePreview';
import { MaximizeIcon, MinimizeIcon, PlayIcon } from './Icons';
import type { Language } from '../types';

interface PreviewPanelProps {
  code: string;
  language: Language;
  /** Optional label shown in the fullscreen bar. */
  title?: string;
}

/**
 * Renders the live result inside a surface with a maximize toggle. When
 * maximized the preview fills the whole viewport (an Escape-dismissible
 * overlay), so a visualization can be viewed full-size.
 */
export default function PreviewPanel({ code, language, title }: PreviewPanelProps) {
  const [maximized, setMaximized] = useState(false);
  const exitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!maximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaximized(false);
    };
    window.addEventListener('keydown', onKey);
    // Lock background scroll while the overlay is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus to the exit control for keyboard users.
    exitRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [maximized]);

  if (maximized) {
    return (
      <>
        {/* Keeps the page layout from collapsing while maximized. */}
        <div className="result-surface result-placeholder" aria-hidden="true">
          <span>Previewing in fullscreen…</span>
        </div>
        <div
          className="preview-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label="Maximized preview"
        >
          <div className="preview-fs-bar">
            <span className="block-label preview-fs-title">
              <PlayIcon width={16} height={16} />
              <span>{title ?? 'Result'}</span>
            </span>
            <button
              ref={exitRef}
              type="button"
              className="btn"
              onClick={() => setMaximized(false)}
            >
              <MinimizeIcon width={18} height={18} />
              <span>Exit fullscreen</span>
              <kbd className="kbd">Esc</kbd>
            </button>
          </div>
          <div className="preview-fs-body">
            <div className="preview-fs-canvas">
              <LivePreview code={code} language={language} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="preview-panel">
      <button
        type="button"
        className="maximize-btn"
        title="Maximize preview"
        aria-label="Maximize preview"
        onClick={() => setMaximized(true)}
      >
        <MaximizeIcon width={16} height={16} />
      </button>
      <div className="result-surface">
        <LivePreview code={code} language={language} />
      </div>
    </div>
  );
}
