export type Language = 'tsx' | 'jsx';

export interface Journal {
  id: string;
  /** Short title for the entry. */
  title: string;
  /** Free-form learning note, written in Markdown. */
  note: string;
  /** The JSX/TSX source code rendered on the entry's page. */
  code: string;
  language: Language;
  createdAt: number;
  updatedAt: number;
}

export const LANGUAGES: Language[] = ['tsx', 'jsx'];
