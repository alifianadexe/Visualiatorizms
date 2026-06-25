import { useOutletContext } from 'react-router-dom';
import type { Journal } from './types';

export interface AppContext {
  journals: Journal[];
  loading: boolean;
  /** Insert or update an entry, persisting it; returns the saved record. */
  saveJournal: (journal: Journal) => Promise<Journal>;
  deleteJournal: (id: string) => Promise<void>;
  exportAll: () => void;
  importFile: (file: File) => Promise<void>;
}

export function useApp(): AppContext {
  return useOutletContext<AppContext>();
}
