'use strict';
/* Subtítulos: Whisper corre en tu navegador (Transformers.js) y genera SRT/VTT con tiempos.
   Para enlaces (YouTube, Vimeo, Bilibili, Dailymotion, OK.ru…) se bajan los subtítulos existentes o el audio con yt-dlp. */
(() => {
  const { $, esc, win, store, toast, L } = BD;

  const MODELS = { tiny: 'onnx-community/whisper-tiny', base: 'onnx-community/whisper-base', small: 'onnx-community/whisper-small' };
  const LANGS = [['auto', 'Auto'], ['spanish', 'Español'], ['english', 'English'], ['portuguese', 'Português'], ['french', 'Français'], ['german', 'Deutsch'],
    ['italian', 'Italiano'], ['japanese', '日本語'], ['korean', '한국어'], ['chinese', '中文'], ['russian', 'Русский']];
  let asr = null, asrModel = '';

  async function getASR(model, onP) {
    if (asr && asrModel === model) return asr;
    const { pipeline, env } = await import(BD.LIB.transformers);
    env.allowLocalModels = false;
    env.useBrowserCache = typeof caches !== 'undefined' && location.protocol !== 'file:';
    const gpu = !!navigator.gpu;
    asr = await pipeline('automatic-speech-recognition', MODELS[model], {
      device: gpu ? 'webgpu' : 'wasm',
      dtype: gpu ? { encoder_model: 'fp32', decoder_model_merged: 'q4' } : 'q8',
      progress_callback: d => { if (d.status === 'progress' && d.total) onP(d.loaded / d.total, L('Descargando modelo Whisper…', 'Downloading Whisper model…')); },
    });
    asrModel = model;
    return asr;
  }
  // Audio a 16 kHz mono (lo que espera Whisper). El navegador decodifica también el audio de MP4/WebM/MOV.
  async function decode(blob) {
    const ctx = new AudioContext({ sampleRate: 16000 });
    try {
      const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
      let data = buf.getChannelData(0);
      if (buf.numberOfChannels > 1) { const r = buf.getChannelData(1), m = new Float32Array(data.length); for (let i = 0; i < m.length; i++) m[i] = (data[i] + r[i]) / 2; data = m; }
      return { data, duration: buf.duration };
    } finally { ctx.close(); }
  }

  // Transcribe un archivo de audio/video completo → [{start, end, text}] (lo usa también el coach de inglés)
  async function transcribe(blob, { model = 'base', lang, task = 'transcribe', onStep = () => {} } = {}) {
    onStep(L('Leyendo el audio…', 'Reading audio…'), 0);
    const { data, duration } = await decode(blob);
    const asrFn = await getASR(model, (p, msg) => onStep(msg, p));
    const SR = 16000, PIECE = 120 * SR, segs = [];
    for (let off = 0; off < data.length; off += PIECE) {
      onStep(L(`Transcribiendo ${Math.round(off / SR / 60)} de ${Math.ceil(duration / 60)} min…`, `Transcribing ${Math.round(off / SR / 60)} of ${Math.ceil(duration / 60)} min…`), off / data.length);
      const out = await asrFn(data.subarray(off, off + PIECE), { language: lang, task, chunk_length_s: 30, stride_length_s: 5, return_timestamps: true });
      const t0 = off / SR, len = Math.min(PIECE, data.length - off) / SR;
      (out.chunks || [{ timestamp: [0, len], text: out.text }]).forEach(c => {
        const text = c.text.trim(); if (!text || /^\[.*\]$|^\(.*\)$/.test(text)) return; // descarta [Música], (aplausos)…
        segs.push({ start: t0 + (c.timestamp[0] ?? 0), end: t0 + (c.timestamp[1] ?? len), text });
      });
    }
    return { segs, duration };
  }
  BD.whisper = { transcribe };

  // ---------- formatos ----------
  const ts = (s, sep) => { const ms = Math.max(0, Math.round(s * 1000)), p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 36e5))}:${p(Math.floor(ms / 6e4) % 60)}:${p(Math.floor(ms / 1000) % 60)}${sep}${p(ms % 1000, 3)}`; };
  const wrap = t => t.length <= 42 ? t : (i => i > 0 ? t.slice(0, i) + '\n' + t.slice(i + 1) : t)(t.lastIndexOf(' ', Math.ceil(t.length / 2) + 6));
  const toSRT = segs => segs.map((s, i) => `${i + 1}\n${ts(s.start, ',')} --> ${ts(s.end, ',')}\n${s.text}\n`).join('\n');
  const toVTT = segs => 'WEBVTT\n\n' + segs.map(s => `${ts(s.start, '.')} --> ${ts(s.end, '.')}\n${s.text}\n`).join('\n');
  const secs = t => { const [h, m, s] = t.replace(',', '.').split(':'); return +h * 3600 + +m * 60 + +s; };
  const parseSRT = srt => srt.replace(/\r/g, '').split(/\n{2,}/).map(b => {
    const m = b.match(/(\d+:\d+:\d+[,.]\d+)\s*-->\s*(\d+:\d+:\d+[,.]\d+)\n([\s\S]*)/);
    return m && { start: secs(m[1]), end: secs(m[2]), text: m[3].trim() };
  }).filter(Boolean);

  BD.tool({
    path: '/subtitulos', cat: 'media', title: 'Generar subtítulos', short: 'Subtítulos', icon: BD.icon('captions'),
    colors: ['#ffd6a5', '#ff9f1c'], desc: 'Subtítulos SRT/VTT de cualquier video o audio con Whisper en tu navegador. Para YouTube, Bilibili, Vimeo, OK.ru… te da el comando para traerlos.',
    render(view) {
      const body = win(view, { title: L('Generar subtítulos', 'Generate subtitles'), sub: L(
        'Sube un video o audio y Whisper (IA de reconocimiento de voz) lo transcribe dentro de tu navegador, gratis y sin API key. Para un enlace de YouTube, Vimeo, Bilibili, Dailymotion, OK.ru u otra plataforma, primero baja sus subtítulos o su audio con el comando de abajo.',
        'Upload a video or audio file and Whisper (speech recognition AI) transcribes it inside your browser, free and with no API key. For a YouTube, Vimeo, Bilibili, Dailymotion, OK.ru or other link, first get its subtitles or audio with the command below.') });
      const o = Object.assign({ lang: 'auto', task: 'transcribe', model: 'base', to: BD.lang() === 'en' ? 'English' : 'Español', link: '' }, store.get('subs:opts', {}));
      let file = null, mediaURL = null, segs = [];

      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div class="card stack">
              <h3 style="margin:0">1. ${L('¿Tienes un enlace?', 'Got a link?')}</h3>
              <input type="url" id="sbLink" value="${esc(o.link)}" placeholder="https://www.youtube.com/watch?v=… · bilibili · vimeo · ok.ru…">
              <div class="row" id="sbPlat"></div>
              <div class="stack hidden" id="sbCmds">
                <span class="small"><b>${L('A) Bajar los subtítulos que ya tiene', 'A) Get the subtitles it already has')}</b> ${L('(oficiales o automáticos, al instante)', '(official or auto-generated, instant)')}</span>
                <div class="out mono small" id="sbCmdSubs" style="white-space:pre-wrap;word-break:break-all"></div>
                <button class="btn ghost sm" data-copy="sbCmdSubs">${L('Copiar', 'Copy')}</button>
                <span class="small"><b>${L('B) Si no tiene subtítulos: bajar solo el audio', 'B) No subtitles? Get just the audio')}</b> ${L('y soltarlo aquí al lado', 'and drop it here')}</span>
                <div class="out mono small" id="sbCmdAudio" style="white-space:pre-wrap;word-break:break-all"></div>
                <button class="btn ghost sm" data-copy="sbCmdAudio">${L('Copiar', 'Copy')}</button>
                <p class="muted small" style="margin:0">${L('Necesitas yt-dlp instalado: mira cómo en', 'You need yt-dlp installed: see how in')} <a href="#/descargar-video">${L('Descargar videos', 'Download videos')}</a>.</p>
              </div>
              <button class="btn ghost sm hidden" id="sbFetch">${L('Es un archivo directo: transcribir desde el enlace', 'It\'s a direct file: transcribe from the link')}</button>
            </div>
            <div class="card stack">
              <h3 style="margin:0">2. ${L('Video o audio', 'Video or audio')}</h3>
              <div id="sbDrop"></div>
              <video id="sbVideo" class="hidden" controls style="width:100%;border-radius:12px;max-height:320px;background:#000"></video>
              <div class="grid g2">
                <label class="field"><span>${L('Idioma del audio', 'Audio language')}</span><select id="sbLang">${LANGS.map(([v, l]) => `<option value="${v}" ${v === o.lang ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
                <label class="field"><span>${L('Calidad del modelo', 'Model quality')}</span><select id="sbModel">
                  <option value="tiny" ${o.model === 'tiny' ? 'selected' : ''}>${L('Rápido · ~40 MB', 'Fast · ~40 MB')}</option>
                  <option value="base" ${o.model === 'base' ? 'selected' : ''}>${L('Equilibrado · ~80 MB', 'Balanced · ~80 MB')}</option>
                  <option value="small" ${o.model === 'small' ? 'selected' : ''}>${L('Preciso · ~250 MB', 'Accurate · ~250 MB')}</option></select></label>
              </div>
              <div class="field"><span>${L('Salida', 'Output')}</span><div id="sbTask"></div></div>
              <div class="row"><button class="btn primary" id="sbGo" disabled>${L('Generar subtítulos', 'Generate subtitles')}</button><span class="muted small" id="sbSt"></span></div>
              <div class="bar hidden" id="sbBar"><i></i></div>
              <p class="muted small" style="margin:0">${L('El modelo se descarga la primera vez. Con WebGPU (Chrome/Edge) va varias veces más rápido; un video de 10 min tarda ~1-3 min.', 'The model downloads the first time. With WebGPU (Chrome/Edge) it runs several times faster; a 10-min video takes ~1-3 min.')}</p>
            </div>
          </div>
          <div class="card stack">
            <h3 style="margin:0">3. ${L('Subtítulos', 'Subtitles')}</h3>
            <p class="muted small" style="margin:0">${L('Puedes corregir el texto aquí antes de descargar. También puedes pegar un .srt que ya tengas.', 'You can fix the text here before downloading. You can also paste an existing .srt.')}</p>
            <textarea id="sbOut" translate="no" class="mono small" rows="18" style="min-height:380px" placeholder="1&#10;00:00:00,000 --> 00:00:03,200&#10;…"></textarea>
            <div class="row">
              <button class="btn primary sm" data-dl="srt">.srt</button><button class="btn ghost sm" data-dl="vtt">.vtt</button><button class="btn ghost sm" data-dl="txt">.txt</button>
              <span class="spacer"></span>
              <input type="text" id="sbTo" value="${esc(o.to)}" style="width:120px" title="${L('Idioma destino', 'Target language')}">
              <button class="btn ghost sm" id="sbTr">✨ ${L('Traducir', 'Translate')}</button>
            </div>
            <span class="muted small" id="sbTrSt"></span>
          </div>
        </div>`;

      BD.seg($('#sbTask', body), [['transcribe', L('Mismo idioma', 'Same language')], ['translate', L('Traducir al inglés', 'Translate to English')]], o.task, v => { o.task = v; save(); });
      const save = () => { Object.assign(o, { lang: $('#sbLang', body).value, model: $('#sbModel', body).value, to: $('#sbTo', body).value.trim() || o.to, link: $('#sbLink', body).value.trim() }); store.set('subs:opts', o); };
      body.addEventListener('change', save);

      // ---- enlace ----
      const linkSync = () => {
        save();
        const u = BD.ytdlp.urlsOf(o.link)[0], direct = u && BD.ytdlp.DIRECT.test(u);
        $('#sbPlat', body).innerHTML = u ? `<span class="chip">${esc(BD.ytdlp.platform(u))}</span>` : '';
        $('#sbCmds', body).classList.toggle('hidden', !u || direct);
        $('#sbFetch', body).classList.toggle('hidden', !direct);
        if (!u || direct) return;
        const os = BD.ytdlp.guessOS(), langs = o.lang === 'auto' ? 'es.*,en.*' : { spanish: 'es.*', english: 'en.*', portuguese: 'pt.*', french: 'fr.*', german: 'de.*', italian: 'it.*', japanese: 'ja.*', korean: 'ko.*', chinese: 'zh.*', russian: 'ru.*' }[o.lang];
        $('#sbCmdSubs', body).textContent = BD.ytdlp.command([u], { mode: 'subs', subLangs: langs }, os);
        $('#sbCmdAudio', body).textContent = BD.ytdlp.command([u], { mode: 'audio', audio: 'mp3' }, os);
      };
      $('#sbLink', body).oninput = linkSync; linkSync();
      body.addEventListener('click', e => { const c = e.target.closest('[data-copy]'); if (c) BD.copy($('#' + c.dataset.copy, body).textContent, L('Comando copiado', 'Command copied')); });
      $('#sbFetch', body).onclick = async () => {
        try {
          const r = await fetch(BD.ytdlp.urlsOf(o.link)[0]); if (!r.ok) throw 0;
          setFile(new File([await r.blob()], decodeURIComponent(new URL(o.link).pathname.split('/').pop()) || 'media'));
        } catch { toast(L('Ese servidor no deja leer el archivo desde otra web. Descárgalo y suéltalo aquí.', 'That server doesn\'t allow reading the file from another site. Download it and drop it here.'), 'bad'); }
      };

      // ---- archivo ----
      function setFile(f) {
        file = f;
        if (mediaURL) URL.revokeObjectURL(mediaURL);
        mediaURL = URL.createObjectURL(f);
        const v = $('#sbVideo', body);
        v.src = mediaURL; v.classList.remove('hidden');
        $('#sbGo', body).disabled = false;
        $('#sbSt', body).textContent = f.name;
      }
      BD.dropzone($('#sbDrop', body), {
        accept: 'video/*,audio/*,.mkv,.srt', multiple: false, icon: '🎞️', label: L('Suelta un video o audio', 'Drop a video or audio file'), hint: 'MP4, WebM, MOV, MKV, MP3, M4A, WAV… · .srt',
        async onFiles([f]) {
          if (/\.srt$/i.test(f.name)) { $('#sbOut', body).value = await BD.readText(f); return previewTrack(); }
          setFile(f);
        },
      });

      // Pista de subtítulos en el reproductor para revisar
      function previewTrack() {
        const v = $('#sbVideo', body), vtt = toVTT(parseSRT($('#sbOut', body).value));
        v.querySelectorAll('track').forEach(t => { URL.revokeObjectURL(t.src); t.remove(); });
        const t = document.createElement('track');
        t.kind = 'subtitles'; t.default = true; t.label = 'BrainDeck'; t.src = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
        v.appendChild(t);
      }
      $('#sbOut', body).onchange = previewTrack;

      $('#sbGo', body).onclick = async () => {
        save();
        const btn = $('#sbGo', body), st = $('#sbSt', body), bar = $('#sbBar', body);
        const step = (msg, p) => { st.innerHTML = `<span class="spin"></span> ${esc(msg)}`; if (p !== undefined) $('i', bar).style.width = Math.round(p * 100) + '%'; };
        btn.disabled = true; bar.classList.remove('hidden');
        try {
          // Por trozos de 2 min para mostrar el avance (Whisper ya trabaja internamente en ventanas de 30 s)
          segs = (await transcribe(file, { model: o.model, lang: o.lang === 'auto' ? undefined : o.lang, task: o.task, onStep: step })).segs
            .map(s => ({ ...s, text: wrap(s.text) }));
          if (!segs.length) throw new Error(L('No se detectó voz en el audio.', 'No speech detected in the audio.'));
          $('#sbOut', body).value = toSRT(segs);
          previewTrack();
          step(''); st.textContent = L(`✓ ${segs.length} subtítulos`, `✓ ${segs.length} subtitles`);
        } catch (e) {
          console.error(e);
          const msg = /decode/i.test(e.message || e.name) ? L('No pude leer el audio de este archivo. Prueba convertirlo a MP3/MP4 o bajar solo el audio con yt-dlp.', 'Couldn\'t read this file\'s audio. Try converting it to MP3/MP4 or getting just the audio with yt-dlp.') : e.message;
          st.textContent = '⚠ ' + msg; toast(msg, 'bad');
        }
        btn.disabled = false; bar.classList.add('hidden');
      };

      // ---- descargar / traducir ----
      const name = () => (file ? BD.baseName(file.name) : 'subtitulos');
      body.addEventListener('click', e => {
        const k = e.target.closest('[data-dl]')?.dataset.dl; if (!k) return;
        const s = parseSRT($('#sbOut', body).value);
        if (!s.length) return toast(L('Aún no hay subtítulos', 'No subtitles yet'), 'bad');
        const txt = { srt: toSRT(s), vtt: toVTT(s), txt: s.map(x => x.text.replace(/\n/g, ' ')).join('\n') }[k];
        BD.download(new Blob([txt], { type: k === 'vtt' ? 'text/vtt' : 'text/plain' }), `${name()}.${k}`);
      });
      $('#sbTr', body).onclick = async e => {
        save();
        const s = parseSRT($('#sbOut', body).value);
        if (!s.length) return toast(L('Aún no hay subtítulos', 'No subtitles yet'), 'bad');
        const btn = e.currentTarget, st = $('#sbTrSt', body); btn.disabled = true;
        try {
          // por lotes, manteniendo el número de líneas para no descuadrar los tiempos
          for (let i = 0; i < s.length; i += 30) {
            st.textContent = L(`Traduciendo ${i + 1}–${Math.min(s.length, i + 30)} de ${s.length}…`, `Translating ${i + 1}–${Math.min(s.length, i + 30)} of ${s.length}…`);
            const batch = s.slice(i, i + 30).map(x => x.text.replace(/\n/g, ' '));
            const r = await BD.anyAI(`Translate each subtitle line to ${o.to}. Keep the same number of items and order, natural and short. Reply only JSON: {"lines":["..."]}\n${JSON.stringify(batch)}`,
              { json: true, system: 'You are a professional subtitle translator. Reply with valid JSON only.', onProgress: (p, msg) => st.textContent = `${msg} ${Math.round(p * 100)}%` });
            const lines = r.lines || r;
            if (!Array.isArray(lines) || lines.length !== batch.length) throw new Error(L('La IA devolvió un número distinto de líneas; prueba otra vez.', 'The AI returned a different number of lines; try again.'));
            lines.forEach((t, j) => s[i + j].text = wrap(String(t).trim()));
          }
          $('#sbOut', body).value = toSRT(s); previewTrack();
          st.textContent = '✓ ' + o.to;
        } catch (err) { st.textContent = '⚠ ' + err.message; }
        btn.disabled = false;
      };
      return () => { if (mediaURL) URL.revokeObjectURL(mediaURL); };
    },
  });
})();
