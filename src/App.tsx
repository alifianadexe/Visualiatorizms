import { useCallback, useEffect, useState } from 'react';
import {
  HashRouter,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import EntryPage from './pages/EntryPage';
import type { AppContext } from './appContext';
import * as db from './db';
import { serialize } from './db';
import type { Journal } from './types';

function DataProvider() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    const all = await db.getAll();
    setJournals(all);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const all = await db.getAll();
      if (alive) {
        setJournals(all);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const saveJournal = useCallback(
    async (journal: Journal) => {
      const saved = await db.put(journal);
      await refresh();
      return saved;
    },
    [refresh]
  );

  const deleteJournal = useCallback(
    async (id: string) => {
      await db.remove(id);
      await refresh();
    },
    [refresh]
  );

  const exportAll = useCallback(() => {
    const blob = new Blob([serialize(journals)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualiatorizms-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [journals]);

  const importFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const created = await db.importFrom(text);
      await refresh();
      if (created[0]) navigate(`/entry/${created[0].id}`);
    },
    [refresh, navigate]
  );

  const context: AppContext = {
    journals,
    loading,
    saveJournal,
    deleteJournal,
    exportAll,
    importFile,
  };

  return (
    <Layout onExport={exportAll} onImport={importFile}>
      <Outlet context={context} />
    </Layout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<DataProvider />}>
          <Route index element={<HomePage />} />
          <Route path="new" element={<EditorPage />} />
          <Route path="entry/:id" element={<EntryPage />} />
          <Route path="entry/:id/edit" element={<EditorPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
