'use strict';
/* Se carga en <head>, antes de pintar: aplica el estilo e idioma guardados (evita el parpadeo del tema por defecto).
   Está en un archivo aparte (y no en línea) para que la política de seguridad (CSP) pueda bloquear cualquier script en línea. */
try {
  const s = JSON.parse(localStorage.getItem('bd:settings') || '{}');
  if (s.theme) document.documentElement.dataset.theme = s.theme;
  if (s.lang) document.documentElement.lang = s.lang;
} catch {}
