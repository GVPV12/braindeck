'use strict';
/* Se carga en <head>, antes de pintar: aplica el estilo e idioma guardados (evita el parpadeo del tema por defecto).
   Está en un archivo aparte (y no en línea) para que la política de seguridad (CSP) pueda bloquear cualquier script en línea. */
try {
  const s = JSON.parse(localStorage.getItem('bd:settings') || '{}');
  if (s.theme) document.documentElement.dataset.theme = s.theme;
  if (s.lang) document.documentElement.lang = s.lang;
} catch {}

// Fuentes de Google sin bloquear la pantalla: si el service worker ya controla la página, salen de su copia
// guardada al instante; en la primera visita se piden después de cargar, así una conexión lenta a Google
// nunca deja la app en blanco (mientras tanto se ve la fuente del sistema).
(() => {
  const css = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700&family=Pixelify+Sans:wght@400;600;700&family=Space+Grotesk:wght@400;500;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Silkscreen:wght@400;700&display=swap';
  const add = () => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = css; document.head.appendChild(l); };
  if (navigator.serviceWorker && navigator.serviceWorker.controller) add();
  else window.addEventListener('load', add, { once: true });
})();

// Chrome/Edge/Android avisan una sola vez de que la app se puede instalar, a veces antes de que cargue el resto:
// se guarda el aviso para que el botón "Instalar app" del inicio lo use cuando la persona quiera.
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  window.__bdInstall = e;
  window.dispatchEvent(new CustomEvent('bd:installable'));
});
window.addEventListener('appinstalled', () => { window.__bdInstall = null; });
