import * as Babel from '@babel/standalone';
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import type { ComponentType } from 'react';
import type { Language } from './types';

export interface CompileResult {
  Component: ComponentType<unknown> | null;
  error: string | null;
}

/**
 * Modules we make available to user code via `import ... from '...'`.
 * Everything else throws a friendly error.
 */
function requireShim(name: string): unknown {
  switch (name) {
    case 'react':
      return React;
    case 'react-dom':
    case 'react-dom/client':
      return ReactDOMClient;
    default:
      throw new Error(
        `Cannot import "${name}". Only "react" and "react-dom" are available in this sandbox.`
      );
  }
}

/**
 * Compile a JSX/TSX snippet into a runnable React component.
 *
 * The snippet should `export default` its component (the same convention
 * artifacts use). Bare React hooks like `useState` work without importing
 * them — they are injected into scope for convenience.
 */
export function compile(code: string, language: Language): CompileResult {
  try {
    const transformed = Babel.transform(code, {
      filename: language === 'tsx' ? 'journal.tsx' : 'journal.jsx',
      presets: [
        ['react', { runtime: 'classic' }],
        ['typescript', { allExtensions: true, isTSX: true, allowDeclareFields: true }],
      ],
      plugins: ['transform-modules-commonjs'],
    });

    const compiled = transformed.code;
    if (!compiled) {
      return { Component: null, error: 'Compilation produced no output.' };
    }

    // Inject React + common hooks into scope so bare usage works even without
    // explicit imports, then run the CommonJS module.
    const moduleObj: { exports: Record<string, unknown> } = { exports: {} };
    const hookNames = [
      'useState',
      'useEffect',
      'useRef',
      'useMemo',
      'useCallback',
      'useReducer',
      'useContext',
      'useLayoutEffect',
      'Fragment',
    ];
    const preamble = `const { ${hookNames.join(', ')} } = React;\n`;

    // eslint-disable-next-line no-new-func
    const factory = new Function(
      'require',
      'module',
      'exports',
      'React',
      preamble + compiled
    );
    factory(requireShim, moduleObj, moduleObj.exports, React);

    const exported = moduleObj.exports;
    const candidate =
      (exported.default as ComponentType<unknown> | undefined) ??
      pickFirstComponent(exported);

    if (typeof candidate !== 'function') {
      return {
        Component: null,
        error:
          'No component found. Make sure your code uses `export default` on a React component, e.g. `export default function App() { ... }`.',
      };
    }

    return { Component: candidate, error: null };
  } catch (err) {
    return { Component: null, error: formatError(err) };
  }
}

function pickFirstComponent(
  exported: Record<string, unknown>
): ComponentType<unknown> | undefined {
  for (const value of Object.values(exported)) {
    if (typeof value === 'function') {
      return value as ComponentType<unknown>;
    }
  }
  return undefined;
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
