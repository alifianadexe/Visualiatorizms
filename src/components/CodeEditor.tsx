import { useCallback, type ChangeEvent, type KeyboardEvent } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * A lightweight code textarea with tab-to-indent support. Kept dependency-free
 * on purpose so the platform stays simple.
 */
export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const next = value.slice(0, start) + '  ' + value.slice(end);
        onChange(next);
        // Restore caret after the inserted spaces on the next tick.
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value),
    [onChange]
  );

  return (
    <textarea
      className="code-editor"
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Paste or write your JSX / TSX here. Use `export default` on your component."
    />
  );
}
