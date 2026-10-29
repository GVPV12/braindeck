'use strict';
/* Descargar videos de forma segura: arma el comando exacto de yt-dlp (software libre, sin anuncios ni instaladores raros)
   con la calidad y formato elegidos. Una página web no puede bajar videos de YouTube & co. por sí sola (CORS y firmas). */
(() => {
  const { $, $$, esc, win, store, toast, L } = BD;

  const PLATFORMS = [
    [/youtu\.?be/, 'YouTube'], [/vimeo\.com/, 'Vimeo'], [/bilibili\.(com|tv)|b23\.tv/, 'Bilibili'], [/dailymotion\.com|dai\.ly/, 'Dailymotion'],
    [/ok\.ru/, 'OK.ru'], [/tiktok\.com/, 'TikTok'], [/instagram\.com/, 'Instagram'], [/(twitter|x)\.com/, 'X / Twitter'], [/twitch\.tv/, 'Twitch'],
    [/facebook\.com|fb\.watch/, 'Facebook'], [/soundcloud\.com/, 'SoundCloud'], [/reddit\.com/, 'Reddit'], [/nicovideo\.jp/, 'Niconico'], [/rumble\.com/, 'Rumble'],
  ];
  const DIRECT = /\.(mp4|webm|mov|m4v|mkv|mp3|m4a|ogg|wav|opus)(\?|#|$)/i;
  const urlsOf = text => [...new Set((text.match(/https?:\/\/[^\s'"<>]+/g) || []))];
  const platform = u => (PLATFORMS.find(([re]) => re.test(u)) || [, DIRECT.test(u) ? L('Archivo directo', 'Direct file') : L('Otra web', 'Other site')])[1];

  // Comando de yt-dlp. URLs entre comillas simples: literales tanto en PowerShell como en bash/zsh.
  function command(urls, o, os) {
    const q = u => `'${u.replace(/'/g, '')}'`;
    const dir = os === 'win' ? '"$HOME\\Downloads\\BrainDeck"' : '"$HOME/Downloads/BrainDeck"';
    const a = ['yt-dlp'];
    if (o.mode === 'subs') a.push('--skip-download', '--write-subs', '--write-auto-subs', `--sub-langs "${o.subLangs}"`, '--convert-subs srt');
    else if (o.mode === 'audio') a.push('-x', `--audio-format ${o.audio}`, '--audio-quality 0');
    else {
      const res = o.quality === 'best' ? '' : `res:${o.quality},`;
      const sort = { mp4: `${res}vcodec:h264,acodec:m4a`, webm: `${res}vcodec:vp9,acodec:opus`, mkv: res.replace(/,$/, '') }[o.container];
      if (sort) a.push(`-S "${sort}"`);
      a.push(`--merge-output-format ${o.container}`);
      if (o.subs) a.push('--write-subs', '--write-auto-subs', `--sub-langs "${o.subLangs}"`, '--embed-subs');
    }
    a.push(o.playlist ? '--yes-playlist' : '--no-playlist', `-P ${dir}`, '-o "%(title).150B [%(id)s].%(ext)s"', ...urls.map(q));
    return a.join(' ');
  }
  const INSTALL = {
    win: () => [L('# Una sola vez (PowerShell): instala yt-dlp y ffmpeg desde winget, el instalador oficial de Windows', '# Once (PowerShell): install yt-dlp and ffmpeg from winget, Windows\' official installer'),
      'winget install --id yt-dlp.yt-dlp -e', 'winget install --id Gyan.FFmpeg -e', L('# Cierra y vuelve a abrir la terminal. Para actualizar: yt-dlp -U', '# Close and reopen the terminal. To update: yt-dlp -U')].join('\n'),
    mac: () => [L('# Una sola vez (Terminal, con Homebrew)', '# Once (Terminal, with Homebrew)'), 'brew install yt-dlp ffmpeg', L('# Para actualizar: brew upgrade yt-dlp', '# To update: brew upgrade yt-dlp')].join('\n'),
    linux: () => [L('# Una sola vez', '# Once'), 'sudo apt install ffmpeg pipx', 'pipx install yt-dlp', L('# Para actualizar: pipx upgrade yt-dlp', '# To update: pipx upgrade yt-dlp')].join('\n'),
  };
  const guessOS = () => /Mac/i.test(navigator.platform) ? 'mac' : /Linux/i.test(navigator.platform) ? 'linux' : 'win';

  // Para que Subtítulos reutilice lo mismo
  BD.ytdlp = { urlsOf, platform, command, INSTALL, guessOS, DIRECT };

  BD.tool({
    path: '/descargar-video', cat: 'media', title: 'Descargar videos', short: 'Descargar videos', icon: BD.icon('download'),
    colors: ['#a5b4ff', '#4d5bff'], desc: 'YouTube, Vimeo, Bilibili, TikTok y 1800+ webs: elige calidad y formato y descarga de forma segura con yt-dlp.',
    render(view) {
      const body = win(view, { title: L('Descargar videos', 'Download videos'), sub: L(
        'Pega uno o varios enlaces, elige calidad y formato, y copia el comando. Usa yt-dlp: software libre y de código abierto, sin anuncios ni botones falsos, que funciona con YouTube y más de 1800 webs.',
        'Paste one or more links, pick quality and format, and copy the command. It uses yt-dlp: free, open-source software with no ads or fake buttons that works with YouTube and 1800+ sites.') });
      const o = Object.assign({ mode: 'video', quality: '1080', container: 'mp4', audio: 'mp3', subs: false, subLangs: 'es.*,en.*', playlist: false, os: guessOS(), text: '' }, store.get('vdl:opts', {}));

      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <label class="field"><span>${L('Enlaces (uno por línea)', 'Links (one per line)')}</span>
              <textarea id="vUrls" rows="4" placeholder="https://www.youtube.com/watch?v=…&#10;https://www.bilibili.com/video/…">${esc(o.text)}</textarea></label>
            <div class="row" id="vDetected"></div>
            <div class="card stack">
              <div class="field"><span>${L('¿Qué quieres bajar?', 'What do you want to get?')}</span><div id="vMode"></div></div>
              <div class="stack" id="vVideoOpts">
                <div class="field"><span>${L('Calidad máxima', 'Max quality')}</span><div id="vQuality"></div></div>
                <div class="field"><span>${L('Formato', 'Format')}</span><div id="vCont"></div></div>
                <label class="check"><input type="checkbox" id="vSubs" ${o.subs ? 'checked' : ''}> ${L('Incluir subtítulos dentro del video', 'Embed subtitles in the video')}</label>
              </div>
              <div class="field hidden" id="vAudioOpts"><span>${L('Formato de audio', 'Audio format')}</span><div id="vAudio"></div></div>
              <label class="field" id="vLangsBox"><span>${L('Idiomas de subtítulos', 'Subtitle languages')} <span class="muted small">(es.*, en.*, pt.*, ja…)</span></span><input type="text" id="vLangs" value="${esc(o.subLangs)}"></label>
              <label class="check"><input type="checkbox" id="vList" ${o.playlist ? 'checked' : ''}> ${L('Si es una lista de reproducción, bajarla entera', 'If it\'s a playlist, download all of it')}</label>
            </div>
          </div>
          <div class="stack">
            <div class="card stack">
              <div class="row"><h3 style="margin:0;flex:1">${L('Tu comando', 'Your command')}</h3><div id="vOS"></div></div>
              <div class="out mono small" id="vCmd" style="white-space:pre-wrap;word-break:break-all"></div>
              <div class="row"><button class="btn primary" id="vCopy">${L('Copiar comando', 'Copy command')}</button><button class="btn ghost sm" id="vFormats">${L('Ver calidades disponibles', 'List available qualities')}</button></div>
              <p class="muted small" style="margin:0">${L('Pégalo en la terminal (PowerShell en Windows). Los archivos quedan en Descargas → BrainDeck.', 'Paste it into the terminal (PowerShell on Windows). Files go to Downloads → BrainDeck.')}</p>
              <div class="hidden" id="vDirectBox"><hr class="sep"><b>${L('Enlace directo a un archivo', 'Direct file link')}</b>
                <p class="muted small">${L('Este enlace apunta a un archivo de video/audio: puedes intentar bajarlo aquí mismo.', 'This link points to a video/audio file: you can try downloading it right here.')}</p>
                <button class="btn ghost sm" id="vDirect">${L('Descargar aquí', 'Download here')}</button> <span class="muted small" id="vDirectSt"></span></div>
            </div>
            <details class="card"><summary><b>${L('Primera vez: instalar yt-dlp (2 minutos)', 'First time: install yt-dlp (2 minutes)')}</b></summary>
              <div class="out mono small" id="vInstall" style="white-space:pre-wrap;margin-top:10px"></div>
              <button class="btn ghost sm" id="vInstCopy" style="margin-top:8px">${L('Copiar', 'Copy')}</button>
            </details>
            <div class="note-box small">
              <b>🛡 ${L('¿Por qué así y no con un botón de "descargar"?', 'Why this way and not a "download" button?')}</b><br>
              ${L('Las webs "YouTube to MP4" viven de anuncios con botones falsos, pop-ups y descargas de .exe disfrazadas: es la forma más común de colarte malware. yt-dlp es de código abierto, lo instalas desde winget/Homebrew (fuentes oficiales) y descarga directamente de la plataforma, sin intermediarios.',
                '"YouTube to MP4" sites live off ads with fake buttons, pop-ups and disguised .exe downloads: the most common way to get malware. yt-dlp is open source, you install it from winget/Homebrew (official sources) and it downloads straight from the platform, no middlemen.')}
              <ul style="margin:8px 0 0;padding-left:1.1em">
                <li>${L('El archivo final debe ser .mp4, .webm, .mkv, .mp3 o .m4a. Si algo te da un .exe, .bat o .scr, bórralo.', 'The final file must be .mp4, .webm, .mkv, .mp3 or .m4a. If anything gives you an .exe, .bat or .scr, delete it.')}</li>
                <li>${L('Nunca instales "códecs" o extensiones que te pida una web de descargas.', 'Never install "codecs" or extensions a download site asks for.')}</li>
                <li>${L('Descarga solo lo que tienes derecho a guardar: tus propios videos, contenido con licencia libre (Creative Commons) o donde la plataforma y la ley de tu país lo permitan.', 'Only download what you have the right to keep: your own videos, freely licensed (Creative Commons) content, or where the platform and your local law allow it.')}</li>
              </ul>
            </div>
          </div>
        </div>`;

      const segs = () => {
        BD.seg($('#vMode', body), [['video', '🎬 ' + L('Video', 'Video')], ['audio', '🎵 ' + L('Solo audio', 'Audio only')], ['subs', '💬 ' + L('Solo subtítulos', 'Subtitles only')]], o.mode, v => { o.mode = v; sync(); });
        BD.seg($('#vQuality', body), [['best', L('Máxima', 'Best')], ['2160', '4K'], ['1440', '1440p'], ['1080', '1080p'], ['720', '720p'], ['480', '480p'], ['360', '360p']], o.quality, v => { o.quality = v; sync(); });
        BD.seg($('#vCont', body), [['mp4', 'MP4'], ['webm', 'WebM'], ['mkv', 'MKV']], o.container, v => { o.container = v; sync(); });
        BD.seg($('#vAudio', body), [['mp3', 'MP3'], ['m4a', 'M4A'], ['opus', 'Opus'], ['wav', 'WAV']], o.audio, v => { o.audio = v; sync(); });
        BD.seg($('#vOS', body), [['win', 'Windows'], ['mac', 'macOS'], ['linux', 'Linux']], o.os, v => { o.os = v; sync(); });
      };
      let urls = [];
      function sync() {
        Object.assign(o, { text: $('#vUrls', body).value, subs: $('#vSubs', body).checked, subLangs: $('#vLangs', body).value.trim() || 'es.*,en.*', playlist: $('#vList', body).checked });
        store.set('vdl:opts', o);
        urls = urlsOf(o.text);
        $('#vVideoOpts', body).classList.toggle('hidden', o.mode !== 'video');
        $('#vAudioOpts', body).classList.toggle('hidden', o.mode !== 'audio');
        $('#vLangsBox', body).classList.toggle('hidden', !(o.mode === 'subs' || (o.mode === 'video' && o.subs)));
        $('#vDetected', body).innerHTML = urls.map(u => `<span class="chip">${esc(platform(u))}</span>`).join('');
        $('#vCmd', body).textContent = urls.length ? command(urls, o, o.os) : L('Pega un enlace para ver el comando…', 'Paste a link to see the command…');
        $('#vInstall', body).textContent = INSTALL[o.os]();
        $('#vDirectBox', body).classList.toggle('hidden', !urls.some(u => DIRECT.test(u)));
      }
      body.addEventListener('input', sync);
      segs(); sync();

      $('#vCopy', body).onclick = () => urls.length ? BD.copy($('#vCmd', body).textContent, L('Comando copiado: pégalo en la terminal', 'Command copied: paste it in the terminal')) : toast(L('Pega primero un enlace', 'Paste a link first'), 'bad');
      $('#vFormats', body).onclick = () => urls.length ? BD.copy(`yt-dlp -F '${urls[0].replace(/'/g, '')}'`, L('Comando copiado: lista todas las calidades del video', 'Command copied: lists every quality of the video')) : toast(L('Pega primero un enlace', 'Paste a link first'), 'bad');
      $('#vInstCopy', body).onclick = () => BD.copy(INSTALL[o.os]().split('\n').filter(l => !l.startsWith('#')).join('\n'));
      $('#vDirect', body).onclick = async () => {
        const st = $('#vDirectSt', body);
        for (const u of urls.filter(u => DIRECT.test(u))) {
          try {
            const res = await fetch(u); if (!res.ok) throw new Error(res.status);
            const total = +res.headers.get('content-length') || 0, reader = res.body.getReader(), parts = []; let got = 0;
            for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; st.textContent = total ? Math.round(got / total * 100) + '%' : BD.fmtBytes(got); }
            BD.download(new Blob(parts, { type: res.headers.get('content-type') || '' }), decodeURIComponent(new URL(u).pathname.split('/').pop()) || 'video');
            st.textContent = '✓';
          } catch {
            // El servidor no permite descargas desde otra web (CORS): se abre para guardarlo con clic derecho
            st.textContent = L('El servidor no lo permite desde aquí: se abrió en otra pestaña (clic derecho → Guardar como).', 'The server blocks it from here: opened in a new tab (right click → Save as).');
            window.open(u, '_blank', 'noopener');
          }
        }
      };
    },
  });
})();
