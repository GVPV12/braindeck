'use strict';
/* Privacidad: qué guarda BrainDeck, dónde, y qué servicios externos ven tu IP y cuándo. Sin cookies ni seguimiento. */
(() => {
  const { esc, win, L } = BD;

  // [servicio, cuándo se usa, qué recibe, enlace a su web o política de privacidad]
  const THIRD = () => [
    ['Netlify', L('Siempre: aloja la web', 'Always: hosts the website'), L('Tu IP y la página pedida, en sus registros de acceso', 'Your IP and the requested page, in its access logs'), 'https://www.netlify.com/privacy/'],
    ['cdnjs / jsDelivr', L('Cuando una herramienta carga una librería (PDF, OCR, QR, gráficas…)', 'When a tool loads a library (PDF, OCR, QR, charts…)'), L('Tu IP', 'Your IP'), 'https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-net'],
    ['Hugging Face', L('IA local: subtítulos, coach de inglés, quitar fondo, IA de texto', 'Local AI: subtitles, English coach, background removal, text AI'), L('Tu IP al descargar el modelo (una vez). Tus archivos no salen del navegador', 'Your IP when downloading the model (once). Your files never leave the browser'), 'https://huggingface.co/privacy'],
    ['SomaFM / Radio Browser', L('Radio para estudiar', 'Study radio'), L('Tu IP (y la emisora elegida)', 'Your IP (and the chosen station)'), 'https://somafm.com/'],
    ['Wikimedia Commons', L('Gesture drawing con fotos libres', 'Gesture drawing with free photos'), L('Tu IP', 'Your IP'), 'https://foundation.wikimedia.org/wiki/Policy:Privacy_policy'],
    ['noembed.com', L('Leer títulos de YouTube en el plan de estudios', 'Reading YouTube titles in the study plan'), L('Tu IP y los enlaces que pegas', 'Your IP and the links you paste'), 'https://noembed.com/'],
    ['flagcdn.com', L('Quiz de países (minijuegos)', 'Country quiz (minigames)'), L('Tu IP', 'Your IP'), 'https://flagpedia.net/'],
    ['Anthropic (Claude)', L('Solo si pones tu propia API key', 'Only if you add your own API key'), L('El texto o imagen que envías a la IA, con tu key', 'The text or image you send to the AI, with your key'), 'https://www.anthropic.com/legal/privacy'],
  ];

  BD.route('/privacidad', {
    title: 'Privacidad',
    render(view) {
      const body = win(view, { title: L('Privacidad', 'Privacy'), sub: L('Última actualización: 16 de noviembre de 2026', 'Last updated: 16 November 2026') });
      body.innerHTML = `
        <div class="card stack">
          <h3 style="margin:0">${L('En corto', 'In short')}</h3>
          <ul class="priv-list">
            <li>${L('<b>Sin cuentas, sin cookies, sin analítica, sin anuncios.</b> BrainDeck no tiene servidor propio que reciba tus datos.', '<b>No accounts, no cookies, no analytics, no ads.</b> BrainDeck has no server of its own that receives your data.')}</li>
            <li>${L('Tus notas, planes, tests y ajustes se guardan <b>solo en este navegador</b>.', 'Your notes, plans, tests and settings are stored <b>only in this browser</b>.')}</li>
            <li>${L('Imágenes, PDFs y audios se procesan <b>en tu dispositivo</b>; no se suben a ningún sitio.', 'Images, PDFs and audio are processed <b>on your device</b>; they are not uploaded anywhere.')}</li>
            <li>${L('Algunas herramientas usan servicios externos, que ven tu IP <b>solo cuando las usas</b> (lista abajo).', 'Some tools use external services, which see your IP <b>only when you use them</b> (list below).')}</li>
          </ul>
        </div>

        <h3>${L('Qué se guarda y dónde', 'What is stored and where')}</h3>
        <p class="muted">${L(
          'En el almacenamiento de tu navegador (<code>localStorage</code> e IndexedDB): lo que creas en las herramientas, tu idioma y estilo, tu nombre de autor/a y, si lo eliges, tu API key. Es necesario para que la app funcione, no sirve para identificarte ni seguirte, y nadie más puede leerlo. La app también guarda una copia de sus propios archivos para abrir sin conexión.',
          'In your browser\'s storage (<code>localStorage</code> and IndexedDB): what you create in the tools, your language and style, your author name and, if you choose, your API key. It is needed for the app to work, it is not used to identify or track you, and nobody else can read it. The app also keeps a copy of its own files to open offline.')}</p>
        <p class="muted">${L('Las fuentes tipográficas se sirven desde BrainDeck mismo, no desde Google.', 'Fonts are served by BrainDeck itself, not by Google.')}</p>

        <h3>${L('Servicios externos', 'External services')}</h3>
        <div class="grid g2">${THIRD().map(([n, when, what, url]) => `
          <div class="card stack" style="gap:6px">
            <b>${esc(n)}</b>
            <span class="small"><span class="muted">${L('Cuándo', 'When')}:</span> ${esc(when)}</span>
            <span class="small"><span class="muted">${L('Qué recibe', 'What it gets')}:</span> ${esc(what)}</span>
            <a class="small" href="${esc(url)}" target="_blank" rel="noopener">${L('Más información', 'More info')} ↗</a>
          </div>`).join('')}
        </div>
        <p class="muted small">${L(
          'Los enlaces a otras webs (YouTube, Ko-fi, mi portfolio…) solo se abren si haces clic, y desde ese momento aplica la política de esa web. Las descargas de Pinterest, Instagram y video las haces tú en tu computadora con yt-dlp o gallery-dl; BrainDeck solo escribe el comando.',
          'Links to other websites (YouTube, Ko-fi, my portfolio…) only open if you click them, and from then on that site\'s policy applies. Pinterest, Instagram and video downloads run on your own computer with yt-dlp or gallery-dl; BrainDeck only writes the command.')}</p>

        <h3>${L('Tus datos, tu control', 'Your data, your control')}</h3>
        <ul class="priv-list">
          <li>${L('<b>Exportar:</b> copia de todo o de lo que elijas, con cifrado opcional por contraseña.', '<b>Export:</b> a copy of everything or what you choose, optionally encrypted with a password.')}</li>
          <li>${L('<b>Borrar:</b> el botón «Borrar todo» elimina todos tus datos de este navegador. También puedes borrar los datos del sitio desde la configuración del navegador.', '<b>Delete:</b> the "Delete everything" button removes all your data from this browser. You can also clear the site data from your browser settings.')}</li>
          <li>${L('Ambas opciones están en', 'Both are in')} <a href="#/ajustes">${L('Ajustes → Importar y exportar datos', 'Settings → Import & export data')}</a>.</li>
        </ul>

        <h3>${L('Contacto', 'Contact')}</h3>
        <p class="muted">${L('¿Dudas sobre privacidad? Escríbeme desde', 'Questions about privacy? Reach me via')} <a href="#/findme">${L('Estoy en', 'Find me on')}</a>. ${L('El código es abierto y puedes revisarlo en', 'The code is open and you can review it on')} <a href="https://github.com/GVPV12/braindeck" target="_blank" rel="noopener">GitHub ↗</a>.</p>`;
    },
  });
})();
