export type Language = 'tsx' | 'jsx';

export interface Journal {
  id: string;
  title: string;
  /** Free-form learning notes, written in Markdown. */
  notes: string;
  /** The JSX/TSX source code for this journal entry. */
  code: string;
  language: Language;
  createdAt: number;
  updatedAt: number;
}
