export type Language = 'tsx' | 'jsx' | 'html';

/** Coerce arbitrary input into a known language, defaulting to tsx. */
export function asLanguage(value: unknown): Language {
  return value === 'jsx' ? 'jsx' : value === 'html' ? 'html' : 'tsx';
}

export type Visibility = 'public' | 'private';

/** Shared space id that everyone can read from and write to. */
export const PUBLIC_SPACE = 'public';

export interface Journal {
  id: string;
  /** Short title for the entry. */
  title: string;
  /** Free-form learning note, written in Markdown. */
  note: string;
  /** The JSX/TSX source code rendered on the entry's page. */
  code: string;
  language: Language;
  /**
   * public  → stored in the shared space, visible to everyone.
   * private → stored under your sync code, visible only with that code.
   */
  visibility: Visibility;
  createdAt: number;
  updatedAt: number;
}

export const LANGUAGES: Language[] = ['tsx', 'jsx', 'html'];
