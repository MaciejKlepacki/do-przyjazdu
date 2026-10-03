// Rejestracja Service Workera. Nie polegamy na pracy strony w tle -
// synchronizacja działa też po powrocie do otwartej aplikacji (sekcja 11).
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker niedostępny - praca bez internetu nie zadziała.', err);
    });
  });
}
