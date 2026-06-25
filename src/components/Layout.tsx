import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DownloadIcon, PlusIcon, UploadIcon } from './Icons';

interface LayoutProps {
  children: ReactNode;
  onExport?: () => void;
  onImport?: (file: File) => void;
}

export default function Layout({ children, onExport, onImport }: LayoutProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Visualiatorizms home">
          <span className="brand-mark">{'</>'}</span>
          <span className="brand-name">Visualiatorizms</span>
        </Link>

        <div className="topbar-actions">
          <button
            type="button"
            className="icon-btn"
            title="Import journals from JSON"
            onClick={() => fileInput.current?.click()}
          >
            <UploadIcon />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Export all journals to JSON"
            onClick={onExport}
          >
            <DownloadIcon />
          </button>
          <Link to="/new" className="btn btn-primary">
            <PlusIcon width={18} height={18} />
            <span>New entry</span>
          </Link>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onImport) onImport(file);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
