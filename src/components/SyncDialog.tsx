import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CloseIcon, CloudSyncedIcon, CopyIcon } from './Icons';
import type { SyncInfo } from '../store';

export interface SyncControls {
  info: SyncInfo;
  /** Create a new space and upload local journals; returns the new code. */
  enable: () => Promise<string>;
  connect: (code: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export default function SyncDialog({
  controls,
  onClose,
}: {
  controls: SyncControls;
  onClose: () => void;
}) {
  const { info } = controls;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    if (!info.code) return;
    navigator.clipboard?.writeText(info.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Cloud sync"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span className="block-label modal-title">
            <CloudSyncedIcon width={16} height={16} />
            <span>Cloud sync</span>
          </span>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="modal-body">
          {!info.configured ? (
            <NotConfigured />
          ) : info.synced ? (
            <div className="sync-section">
              <p className="sync-status">
                <span className="dot dot-on" /> Your private journals are syncing.
              </p>
              <p className="muted-text">
                Public journals sync automatically. To see your <strong>private</strong>{' '}
                journals on another device, open the app there, choose{' '}
                <strong>Connect with a code</strong>, and enter this sync code:
              </p>
              <div className="code-box">
                <code>{info.code}</code>
                <button className="btn btn-sm" onClick={copyCode}>
                  {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="warn-text">
                Anyone with this code can read and edit your journals — keep it
                private.
              </p>
              <button
                className="btn btn-danger"
                disabled={busy}
                onClick={() => run(controls.disconnect)}
              >
                Stop syncing on this device
              </button>
            </div>
          ) : (
            <div className="sync-section">
              <p className="muted-text">
                <strong>Public</strong> journals already sync to everyone
                automatically. <strong>Private</strong> journals live under a
                personal sync code. Create your private space to get a code, or
                connect to an existing one.
              </p>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => run(controls.enable)}
              >
                {busy ? 'Working…' : 'Create my private space'}
              </button>

              <div className="divider"><span>or</span></div>

              <label htmlFor="synccode" className="field-label">
                Connect with a code
              </label>
              <div className="code-connect">
                <input
                  id="synccode"
                  className="text-input"
                  placeholder="vzm-xxxx-xxxx-xxxx-…"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                />
                <button
                  className="btn"
                  disabled={busy || !codeInput.trim()}
                  onClick={() => run(() => controls.connect(codeInput))}
                >
                  Connect
                </button>
              </div>
            </div>
          )}

          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="sync-section">
      <p className="muted-text">
        Cloud sync isn't set up for this site yet. To enable it, add a free
        Supabase project's URL and anon key as the environment variables{' '}
        <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>,
        then redeploy.
      </p>
      <p className="muted-text">
        See <code>SUPABASE.md</code> in the repository for the full step-by-step
        (it includes the SQL to create the table). Until then, your journals are
        saved locally on this device.
      </p>
    </div>
  );
}
