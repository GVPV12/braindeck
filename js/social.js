'use strict';
/* Pinterest e Instagram: arma el comando para bajar fotos, carruseles y videos con programas libres que corren en tu PC.
   - gallery-dl para imágenes y carruseles (pines, tableros, posts).
   - yt-dlp para videos y reels (el mismo de "Descargar videos").
   Una web no puede bajarlos sola: las plataformas lo bloquean (CORS y sesión). */
(() => {
  const { $, esc, win, store, toast, L } = BD;
  const PIN = /pinterest\.[a-z.]+|pin\.it/i, IG = /instagram\.com/i;
  const isVideo = u => /\/(reel|reels|tv)\//i.test(u) || /\/video\//i.test(u);
  const kind = u => PIN.test(u) ? 'Pinterest' : IG.test(u) ? 'Instagram' : null;

  function commands(urls, o, os) {
    const q = u => `'${u.replace(/'/g, '')}'`;
    const base = os === 'win' ? '$HOME\\Downloads\\BrainDeck' : '$HOME/Downloads/BrainDeck';
    const sep = os === 'win' ? '\\' : '/';
    const ck = o.cookies ? ` --cookies-from-browser ${o.browser}` : '';
    const out = [];
    const want = u => o.what === 'auto' ? (isVideo(u) ? 'video' : 'images') : o.what;
    const imgs = urls.filter(u => want(u) === 'images'), vids = urls.filter(u => want(u) === 'video');
    if (imgs.length) out.push(L('# Fotos y carruseles (gallery-dl)', '# Photos and carousels (gallery-dl)'),
      `gallery-dl${ck} -D "${base}${sep}${'%PLAT%'}" ${imgs.map(q).join(' ')}`.replace('%PLAT%', imgs.every(u => PIN.test(u)) ? 'Pinterest' : imgs.every(u => IG.test(u)) ? 'Instagram' : 'Social'));
    if (vids.length) out.push(L('# Videos y reels (yt-dlp)', '# Videos and reels (yt-dlp)'),
      `yt-dlp${ck} -S "vcodec:h264,acodec:m4a" --merge-output-format mp4 -P "${base}" -o "%(uploader|Social).80B - %(title).100B [%(id)s].%(ext)s" ${vids.map(q).join(' ')}`);
    return out.join('\n');
  }
  const INSTALL = {
    win: () => [L('# Una sola vez (PowerShell): instaladores oficiales de Windows', '# Once (PowerShell): official Windows installers'),
      'winget install --id mikf.gallery-dl -e', 'winget install --id yt-dlp.yt-dlp -e', 'winget install --id Gyan.FFmpeg -e',
      L('# Cierra y vuelve a abrir la terminal. Para actualizar: winget upgrade mikf.gallery-dl · yt-dlp -U', '# Close and reopen the terminal. To update: winget upgrade mikf.gallery-dl · yt-dlp -U')].join('\n'),
    mac: () => [L('# Una sola vez (Terminal, con Homebrew)', '# Once (Terminal, with Homebrew)'), 'brew install gallery-dl yt-dlp ffmpeg'].join('\n'),
    linux: () => [L('# Una sola vez', '# Once'), 'sudo apt install ffmpeg pipx', 'pipx install gallery-dl', 'pipx install yt-dlp'].join('\n'),
  };

  BD.tool({
    path: '/pinterest-instagram', cat: 'media', title: L('Pinterest e Instagram', 'Pinterest & Instagram'), short: L('Pinterest e Instagram', 'Pinterest & Instagram'), icon: BD.icon('download'),
    colors: ['#ffb3c7', '#e60023'],
    desc: L('Baja fotos, carruseles, tableros, videos y reels de Pinterest e Instagram con gallery-dl y yt-dlp (libres, sin anuncios).', 'Download photos, carousels, boards, videos and reels from Pinterest and Instagram with gallery-dl and yt-dlp (free, no ads).'),
    render(view) {
      const body = win(view, { title: L('Pinterest e Instagram', 'Pinterest & Instagram'), sub: L(
        'Pega enlaces de pines, tableros, posts o reels. Te damos el comando exacto para bajarlos con dos programas libres que corren en tu computadora: gallery-dl (fotos y carruseles) y yt-dlp (videos).',
        'Paste links to pins, boards, posts or reels. You get the exact command to download them with two free programs that run on your computer: gallery-dl (photos and carousels) and yt-dlp (videos).') });
      const o = Object.assign({ text: '', what: 'auto', cookies: false, browser: 'firefox', os: BD.ytdlp ? BD.ytdlp.guessOS() : 'win' }, store.get('social:opts', {}));

      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <label class="field"><span>${L('Enlaces (uno por línea)', 'Links (one per line)')}</span>
              <textarea id="sUrls" rows="4" placeholder="https://www.pinterest.com/pin/…&#10;https://pin.it/…&#10;https://www.instagram.com/p/…&#10;https://www.instagram.com/reel/…">${esc(o.text)}</textarea></label>
            <div class="row" id="sDetected"></div>
            <div class="card stack">
              <div class="field"><span>${L('¿Qué quieres bajar?', 'What do you want to get?')}</span><div id="sWhat"></div></div>
              <p class="muted small" style="margin:0">${L('En «Automático», los enlaces de reels y videos van con yt-dlp y el resto (pines, posts, carruseles, tableros) con gallery-dl.', 'In "Automatic", reel and video links go to yt-dlp and the rest (pins, posts, carousels, boards) to gallery-dl.')}</p>
              <label class="check"><input type="checkbox" id="sCookies" ${o.cookies ? 'checked' : ''}> ${L('Usar mi sesión del navegador (Instagram casi siempre la pide; también para tableros privados)', 'Use my browser session (Instagram almost always needs it; also for private boards)')}</label>
              <div class="field ${o.cookies ? '' : 'hidden'}" id="sBrowserBox"><span>${L('Navegador donde tienes la sesión abierta', 'Browser where you\'re logged in')}</span><div id="sBrowser"></div>
                <p class="muted small" style="margin:6px 0 0">${L('Firefox es el que mejor funciona. Chrome y Edge a veces bloquean la lectura de sus cookies mientras están abiertos.', 'Firefox works best. Chrome and Edge sometimes block reading their cookies while open.')}</p></div>
            </div>
          </div>
          <div class="stack">
            <div class="card stack">
              <div class="row"><h3 style="margin:0;flex:1">${L('Tu comando', 'Your command')}</h3><div id="sOS"></div></div>
              <div class="out mono small" id="sCmd" style="white-space:pre-wrap;word-break:break-all"></div>
              <div class="row"><button class="btn primary" id="sCopy">${L('Copiar comando', 'Copy command')}</button>
                <a class="btn ghost sm" href="#/subtitulos">💬 ${L('Transcribir un video bajado', 'Transcribe a downloaded video')}</a></div>
              <p class="muted small" style="margin:0">${L('Pégalo en la terminal (PowerShell en Windows). Los archivos quedan en Descargas → BrainDeck.', 'Paste it into the terminal (PowerShell on Windows). Files go to Downloads → BrainDeck.')}</p>
            </div>
            <details class="card"><summary><b>${L('Primera vez: instalar gallery-dl y yt-dlp (2 minutos)', 'First time: install gallery-dl and yt-dlp (2 minutes)')}</b></summary>
              <div class="out mono small" id="sInstall" style="white-space:pre-wrap;margin-top:10px"></div>
              <button class="btn ghost sm" id="sInstCopy" style="margin-top:8px">${L('Copiar', 'Copy')}</button>
            </details>
            <div class="note-box small">
              <b>⚖️ ${L('Úsalo de forma legal', 'Use it legally')}</b>
              <ul style="margin:8px 0 0;padding-left:1.1em">
                <li>${L('Baja tu propio contenido, contenido con permiso del autor o con licencia libre. Las fotos y videos de otras personas tienen derechos de autor: guardarlos para referencia personal no te da permiso para volver a publicarlos.', 'Download your own content, content you have the author\'s permission for, or freely licensed content. Other people\'s photos and videos are copyrighted: saving them for personal reference doesn\'t let you repost them.')}</li>
                <li>${L('Las condiciones de Instagram y Pinterest no permiten la recolección automatizada: no lo uses para bajar perfiles enteros de otros ni en masa.', 'Instagram\'s and Pinterest\'s terms don\'t allow automated collection: don\'t use it to grab other people\'s whole profiles or in bulk.')}</li>
                <li>${L('«Usar mi sesión» lee las cookies del navegador elegido en tu PC; nunca salen de ella. No compartas archivos de cookies con nadie.', '"Use my session" reads the chosen browser\'s cookies on your PC; they never leave it. Never share cookie files with anyone.')}</li>
              </ul>
            </div>
          </div>
        </div>`;

      let urls = [];
      function sync() {
        Object.assign(o, { text: $('#sUrls', body).value, cookies: $('#sCookies', body).checked });
        store.set('social:opts', o);
        const all = (BD.ytdlp ? BD.ytdlp.urlsOf(o.text) : o.text.match(/https?:\/\/\S+/g) || []);
        urls = all.filter(kind);
        const other = all.length - urls.length;
        $('#sDetected', body).innerHTML = urls.map(u => `<span class="chip">${kind(u)} · ${isVideo(u) ? L('video', 'video') : L('fotos', 'photos')}</span>`).join('') +
          (other ? `<span class="chip bad">${other} ${L('enlace(s) que no son de Pinterest/Instagram: usa Descargar videos', 'link(s) not from Pinterest/Instagram: use Download videos')}</span>` : '');
        $('#sBrowserBox', body).classList.toggle('hidden', !o.cookies);
        $('#sCmd', body).textContent = urls.length ? commands(urls, o, o.os) : L('Pega un enlace de Pinterest o Instagram para ver el comando…', 'Paste a Pinterest or Instagram link to see the command…');
        $('#sInstall', body).textContent = INSTALL[o.os]();
      }
      BD.seg($('#sWhat', body), [['auto', '✨ ' + L('Automático', 'Automatic')], ['images', '🖼 ' + L('Fotos', 'Photos')], ['video', '🎬 ' + L('Video', 'Video')]], o.what, v => { o.what = v; sync(); });
      BD.seg($('#sBrowser', body), [['firefox', 'Firefox'], ['chrome', 'Chrome'], ['edge', 'Edge'], ['safari', 'Safari']], o.browser, v => { o.browser = v; sync(); });
      BD.seg($('#sOS', body), [['win', 'Windows'], ['mac', 'macOS'], ['linux', 'Linux']], o.os, v => { o.os = v; sync(); });
      body.addEventListener('input', sync);
      body.addEventListener('change', sync);
      sync();

      $('#sCopy', body).onclick = () => urls.length ? BD.copy($('#sCmd', body).textContent.split('\n').filter(l => !l.startsWith('#')).join('\n'), L('Comando copiado: pégalo en la terminal', 'Command copied: paste it in the terminal'))
        : toast(L('Pega primero un enlace de Pinterest o Instagram', 'Paste a Pinterest or Instagram link first'), 'bad');
      $('#sInstCopy', body).onclick = () => BD.copy(INSTALL[o.os]().split('\n').filter(l => !l.startsWith('#')).join('\n'));
    },
  });
})();
