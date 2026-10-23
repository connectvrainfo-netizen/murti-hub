import { scheduleTask } from './scheduler';

/**
 * Register Service Worker during browser idle time
 * Eliminates main-thread contention during Critical Rendering Path (CRP).
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    scheduleTask(() => {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.debug('[ServiceWorker] Active with scope:', registration.scope);
          registration.update().catch(() => {});

          // Listen for background updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.debug('[ServiceWorker] New content is available; please refresh.');
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('[ServiceWorker] Registration failed:', error);
        });
    }, 'background', 500);
  });
}

export default registerServiceWorker;
