import { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownProps {
  source: string;
  className?: string;
}

/** Renders a Markdown string as sanitized-enough HTML for trusted local notes. */
export default function Markdown({ source, className }: MarkdownProps) {
  const html = useMemo(() => {
    if (!source.trim()) {
      return '<p class="muted">Nothing here yet.</p>';
    }
    return marked.parse(source, { async: false }) as string;
  }, [source]);

  return (
    <div
      className={`markdown ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
