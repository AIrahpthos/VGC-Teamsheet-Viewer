"use client";

import { useEffect, useState } from 'react';

export function OfflineStatus() {
  const [message, setMessage] = useState('Saving viewer for offline use…');
  useEffect(() => {
    let mounted = true;
    const report = (value: string) => { if (mounted) setMessage(value); };
    if (!('serviceWorker' in navigator)) {
      void Promise.resolve().then(() => report('Offline installation is unavailable in this browser.'));
      return () => { mounted = false; };
    }
    const watch = (worker: ServiceWorker) => {
      const check = () => {
        if (worker.state === 'activated') report('Ready offline · PDF import and saved teams work without internet.');
        else if (worker.state === 'installed') report(navigator.serviceWorker.controller
          ? 'Update saved · close and reopen the viewer to use it.'
          : 'Finishing offline setup…');
        else if (worker.state === 'redundant') report('Offline setup failed. Reopen online to retry.');
      };
      worker.addEventListener('statechange', check);
      check();
    };
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(registration => {
      if (!mounted) return;
      if (registration.active) report('Ready offline · PDF import and saved teams work without internet.');
      if (registration.installing) watch(registration.installing);
      if (registration.waiting) report('Update saved · close and reopen the viewer to use it.');
      registration.addEventListener('updatefound', () => {
        if (registration.installing) watch(registration.installing);
      });
    }).catch(() => report('Offline setup unavailable. Open the viewer online to retry.'));
    return () => { mounted = false; };
  }, []);
  return <p className="muted" role="status">{message}</p>;
}
