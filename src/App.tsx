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
import * as store from './store';
import { serialize } from './store';
import type { Journal } from './types';
import type { SyncControls } from './components/SyncDialog';

function DataProvider() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sync, setSync] = useState(() => store.getSyncInfo());
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    const all = await store.getAll();
    setJournals(all);
    setSync(store.getSyncInfo());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await store.getAll();
        if (alive) setJournals(all);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const saveJournal = useCallback(
    async (journal: Journal) => {
      const saved = await store.put(journal);
      await refresh();
      return saved;
    },
    [refresh]
  );

  const deleteJournal = useCallback(
    async (id: string) => {
      await store.remove(id);
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
      const created = await store.importFrom(text);
      await refresh();
      if (created[0]) navigate(`/entry/${created[0].id}`);
    },
    [refresh, navigate]
  );

  const syncControls: SyncControls = {
    info: sync,
    enable: useCallback(async () => {
      const code = await store.enableSync();
      await refresh();
      return code;
    }, [refresh]),
    connect: useCallback(
      async (code: string) => {
        await store.connect(code);
        await refresh();
      },
      [refresh]
    ),
    disconnect: useCallback(async () => {
      store.disconnect();
      await refresh();
    }, [refresh]),
  };

  const context: AppContext = {
    journals,
    loading,
    saveJournal,
    deleteJournal,
    exportAll,
    importFile,
  };

  return (
    <Layout onExport={exportAll} onImport={importFile} sync={syncControls}>
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
