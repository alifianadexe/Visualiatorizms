import { Component, useMemo, type ComponentType, type ReactNode } from 'react';
import { compile } from '../runner';
import type { Language } from '../types';

interface LivePreviewProps {
  code: string;
  language: Language;
}

export default function LivePreview({ code, language }: LivePreviewProps) {
  // Recompile whenever the code or language changes.
  const { Component: Rendered, error } = useMemo(
    () => compile(code, language),
    [code, language]
  );

  if (error) {
    return <ErrorPanel title="Compile error" message={error} />;
  }

  if (!Rendered) {
    return <ErrorPanel title="Nothing to render" message="No component was produced." />;
  }

  return (
    <RuntimeErrorBoundary key={code}>
      <Rendered />
    </RuntimeErrorBoundary>
  );
}

function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="preview-error">
      <strong>{title}</strong>
      <pre>{message}</pre>
    </div>
  );
}

interface BoundaryState {
  error: Error | null;
}

class RuntimeErrorBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorPanel
          title="Runtime error"
          message={this.state.error.message}
        />
      );
    }
    return this.props.children;
  }
}

export type { ComponentType };
