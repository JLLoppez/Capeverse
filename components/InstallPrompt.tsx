'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const alreadyDismissed = window.localStorage.getItem('capeverse_install_dismissed');
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
      if (!alreadyDismissed) setDismissed(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!promptEvent || dismissed) return null;

  return (
    <div className="install-banner">
      <div className="install-banner-icon">
        <img src="/brand/logo-icon.svg" alt="" width={28} height={28} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: '0.85rem' }}>Install Capeverse</strong>
        <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.6)' }}>Add it to your home screen for quick access.</span>
      </div>
      <button
        className="btn btn-primary btn-sm"
        onClick={async () => {
          promptEvent.prompt();
          await promptEvent.userChoice;
          setDismissed(true);
        }}
      >
        <Download size={14} />Install
      </button>
      <button
        aria-label="Dismiss"
        onClick={() => {
          window.localStorage.setItem('capeverse_install_dismissed', '1');
          setDismissed(true);
        }}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
