'use strict';
/* English Speaking Coach: graba o sube un audio en inglés → Whisper lo transcribe en tu navegador → la IA corrige y recomienda. */
(() => {
  const { $, esc, win, store, toast, L } = BD;
  const FILLERS = /\b(um+|uh+|erm+|hmm+|like|you know|i mean|basically|actually|kind of|sort of|so yeah)\b/gi;

  // Métricas que no necesitan IA: velocidad, muletillas, variedad de vocabulario
  function metrics(segs, duration) {
    const text = segs.map(s => s.text).join(' ');
    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    const speaking = segs.reduce((a, s) => a + Math.max(0, s.end - s.start), 0) || duration;
    const fillers = {}; (text.match(FILLERS) || []).forEach(f => { const k = f.toLowerCase(); fillers[k] = (fillers[k] || 0) + 1; });
    let pauses = 0; for (let i = 1; i < segs.length; i++) if (segs[i].start - segs[i - 1].end > 1.5) pauses++;
    return { text, words: words.length, wpm: Math.round(words.length / Math.max(1, speaking) * 60), unique: Math.round(new Set(words).size / Math.max(1, words.length) * 100), fillers, pauses, duration };
  }
  const SCHEMA = '{"level":"A1-C2","summary":"","corrected":"full corrected version","mistakes":[{"original":"","fix":"","why":""}],"vocabulary":[{"instead_of":"","try":"","example":""}],"pronunciation":[""],"fluency":[""],"next_steps":[""]}';

  BD.tool({
    path: '/ingles', cat: 'estudio', title: 'Coach de inglés hablado', short: 'Coach de inglés', icon: BD.icon('mic'),
    colors: ['#a8e6ff', '#2f8cff'], desc: 'Grábate hablando en inglés: transcribe tu audio, corrige errores y te da recomendaciones de vocabulario, fluidez y pronunciación.',
    render(view) {
      const body = win(view, { title: L('Coach de inglés hablado', 'English speaking coach'), sub: L(
        'Grábate o sube un audio hablando en inglés. Whisper lo transcribe en tu navegador y la IA te corrige: gramática, vocabulario más natural, fluidez y posibles fallos de pronunciación. Sin API key usa la IA local.',
        'Record yourself or upload audio speaking English. Whisper transcribes it in your browser and the AI corrects you: grammar, more natural vocabulary, fluency and likely pronunciation slips. Without an API key it uses the local AI.') });
      const o = Object.assign({ model: 'base', topic: '' }, store.get('speak:opts', {}));
      let file = null, rec = null, chunks = [], t0 = 0, tick = null, url = null;
      const TOPICS = ['Describe your perfect weekend.', 'Talk about a book, movie or game you love and why.', 'Explain your job or what you study to a 10-year-old.',
        'What would you do with a year off?', 'Describe your hometown to a tourist.', 'Tell a story about a mistake you learned from.', 'Pitch your art or project in 1 minute.',
        'What is a skill you want to learn and how?', 'Describe a typical day in your life.', 'Agree or disagree: social media helps artists.'];

      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div class="card stack">
              <div class="row"><b style="flex:1">${L('Tema para hablar (opcional)', 'Speaking prompt (optional)')}</b><button class="btn ghost sm" id="eTopicR">🎲</button></div>
              <input type="text" id="eTopic" value="${esc(o.topic)}" placeholder="${L('Ej. Describe your perfect weekend.', 'E.g. Describe your perfect weekend.')}" translate="no">
              <div class="row" style="justify-content:center;margin-top:6px">
                <button class="rec-btn" id="eRec" title="${L('Grabar', 'Record')}"><span></span></button>
              </div>
              <div class="mono" id="eTime" style="text-align:center;font-size:1.4rem">0:00</div>
              <p class="muted small" style="text-align:center;margin:0">${L('Recomendado: 1-3 minutos. Habla con naturalidad, sin leer.', 'Recommended: 1-3 minutes. Speak naturally, don\'t read.')}</p>
              <div id="eDrop"></div>
              <audio id="eAudio" controls class="hidden" style="width:100%"></audio>
            </div>
            <div class="card stack">
              <label class="field"><span>${L('Precisión de la transcripción', 'Transcription accuracy')}</span><select id="eModel">
                <option value="base" ${o.model === 'base' ? 'selected' : ''}>${L('Equilibrada · ~80 MB', 'Balanced · ~80 MB')}</option>
                <option value="small" ${o.model === 'small' ? 'selected' : ''}>${L('Alta · ~250 MB (recomendada)', 'High · ~250 MB (recommended)')}</option></select></label>
              <div class="row"><button class="btn primary" id="eGo" disabled>${L('Analizar mi inglés', 'Analyze my English')}</button><span class="muted small" id="eSt"></span></div>
              <div class="bar hidden" id="eBar"><i></i></div>
              <p class="muted small" style="margin:0">${L('Ojo: la IA solo "oye" la transcripción. Si Whisper entendió otra palabra, suele ser señal de que esa palabra se pronunció distinto, y así detecta fallos de pronunciación, pero no evalúa tu acento como un profesor.',
                'Note: the AI only "hears" the transcript. If Whisper understood a different word, that usually means it was pronounced differently, which is how it spots pronunciation slips, but it doesn\'t grade your accent like a teacher would.')}</p>
            </div>
          </div>
          <div class="card stack" id="eOut" translate="no"><div class="empty"><span class="big">🎙️</span>${L('Tu análisis aparecerá aquí', 'Your analysis will show up here')}</div></div>
        </div>
        <div class="section-title"><h2>${L('Mi progreso', 'My progress')}</h2></div>
        <div class="stack" id="eHist"></div>`;

      const v = id => $('#' + id, body);
      body.addEventListener('change', () => { o.model = v('eModel').value; o.topic = v('eTopic').value; store.set('speak:opts', o); });
      v('eTopicR').onclick = () => { v('eTopic').value = TOPICS[Math.floor(Math.random() * TOPICS.length)]; o.topic = v('eTopic').value; store.set('speak:opts', o); };
      const setFile = f => {
        file = f; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f);
        v('eAudio').src = url; v('eAudio').classList.remove('hidden'); v('eGo').disabled = false;
      };
      BD.dropzone(v('eDrop'), { accept: 'audio/*,video/*', multiple: false, icon: '🎧', label: L('…o sube un audio/video', '…or upload audio/video'), hint: 'MP3, M4A, WAV, OGG, MP4…', onFiles: ([f]) => setFile(f) });

      // Grabación con el micrófono
      v('eRec').onclick = async () => {
        if (rec) { rec.stop(); return; }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          rec = new MediaRecorder(stream); chunks = [];
          rec.ondataavailable = e => chunks.push(e.data);
          rec.onstop = () => {
            stream.getTracks().forEach(t => t.stop()); clearInterval(tick);
            setFile(new File(chunks, `speaking-${BD.today()}.webm`, { type: rec.mimeType || 'audio/webm' }));
            rec = null; v('eRec').classList.remove('on');
          };
          rec.start(); t0 = Date.now(); v('eRec').classList.add('on');
          tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); v('eTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (s >= 600) rec.stop(); }, 250);
        } catch { toast(L('No pude usar el micrófono (revisa los permisos del navegador).', 'Couldn\'t access the microphone (check browser permissions).'), 'bad'); }
      };

      v('eGo').onclick = async () => {
        const btn = v('eGo'), st = v('eSt'), bar = v('eBar');
        const step = (msg, p) => { st.innerHTML = `<span class="spin"></span> ${esc(msg)}`; if (p !== undefined) $('i', bar).style.width = Math.round(p * 100) + '%'; };
        btn.disabled = true; bar.classList.remove('hidden');
        try {
          const { segs, duration } = await BD.whisper.transcribe(file, { model: o.model, lang: 'english', onStep: step });
          if (!segs.length) throw new Error(L('No se detectó voz en el audio.', 'No speech detected.'));
          const m = metrics(segs, duration);
          step(L('La IA está revisando tu inglés…', 'The AI is reviewing your English…'), 1);
          let a = null;
          try {
            a = await BD.anyAI(`Speaking prompt: ${o.topic || '(free talk)'}\nSpeech transcript (from speech recognition, ${Math.round(duration)} s, ${m.wpm} wpm, fillers: ${JSON.stringify(m.fillers)}):\n"""${m.text.slice(0, 6000)}"""\n\n` +
              `Act as a friendly, precise English speaking teacher. Correct grammar and unnatural phrasing, suggest more natural vocabulary, comment on fluency, and infer likely pronunciation issues from words that look misrecognized. ` +
              `Write "summary", "why", "pronunciation", "fluency" and "next_steps" in ${BD.lang() === 'en' ? 'English' : 'Spanish'}; keep "original", "fix", "corrected", "try" and "example" in English. Max 8 mistakes. Reply only JSON: ${SCHEMA}`,
            { json: true, system: 'You are an expert ESL speaking coach. Reply with valid JSON only.', onProgress: (p, msg) => step(msg, p) });
          } catch (err) { console.error(err); toast(L('La IA no está disponible; te muestro las métricas y la transcripción.', 'AI unavailable; showing metrics and transcript.') + ' ' + err.message, 'bad'); }
          show(m, a, segs);
          const h = store.get('speak:history', []); h.unshift({ at: Date.now(), topic: o.topic, wpm: m.wpm, words: m.words, fillers: Object.values(m.fillers).reduce((x, y) => x + y, 0), level: a?.level || '', mistakes: a?.mistakes?.length ?? null });
          store.set('speak:history', h.slice(0, 50)); paintHist();
          st.textContent = '✓';
        } catch (e) { console.error(e); st.textContent = '⚠ ' + e.message; toast(e.message, 'bad'); }
        btn.disabled = false; bar.classList.add('hidden');
      };

      function show(m, a, segs) {
        const fill = Object.entries(m.fillers).sort((x, y) => y[1] - x[1]);
        const pace = m.wpm < 100 ? L('lento: intenta enlazar más las frases', 'slow: try linking sentences more') : m.wpm > 170 ? L('rápido: haz pausas para respirar', 'fast: pause to breathe') : L('ritmo natural ✓', 'natural pace ✓');
        const list = (h, arr, f) => arr?.length ? `<h3>${h}</h3><ul style="padding-left:1.1em;margin:0">${arr.map(x => `<li style="margin-bottom:6px">${f(x)}</li>`).join('')}</ul>` : '';
        v('eOut').innerHTML = `
          <div class="grid g4">
            ${a?.level ? `<div class="card stat"><b>${esc(a.level)}</b><span>${L('nivel aprox.', 'approx. level')}</span></div>` : ''}
            <div class="card stat" data-tip="${L('Palabras por minuto. Lo natural en conversación es 120-160.', 'Words per minute. Natural conversation is 120-160.')}"><b>${m.wpm}</b><span>wpm · ${pace}</span></div>
            <div class="card stat" data-tip="${L('Muletillas: um, uh, like, you know…', 'Fillers: um, uh, like, you know…')}"><b>${fill.reduce((x, y) => x + y[1], 0)}</b><span>${L('muletillas', 'fillers')}</span></div>
            <div class="card stat" data-tip="${L('Porcentaje de palabras distintas: más alto = vocabulario más variado.', 'Share of distinct words: higher = more varied vocabulary.')}"><b>${m.unique}%</b><span>${L('variedad', 'variety')}</span></div>
          </div>
          ${a?.summary ? `<div class="note-box">${esc(a.summary)}</div>` : ''}
          ${list(L('Correcciones', 'Corrections'), a?.mistakes, x => `<s class="muted">${esc(x.original)}</s> → <b>${esc(x.fix)}</b><div class="muted small">${esc(x.why)}</div>`)}
          ${a?.corrected ? `<h3>${L('Versión corregida', 'Corrected version')}</h3><p style="margin:0">${esc(a.corrected)}</p><button class="btn ghost sm" id="eSay">🔊 ${L('Escuchar versión corregida', 'Listen to corrected version')}</button>` : ''}
          ${list(L('Vocabulario más natural', 'More natural vocabulary'), a?.vocabulary, x => `«${esc(x.instead_of)}» → <b>${esc(x.try)}</b>${x.example ? `<div class="muted small"><i>${esc(x.example)}</i></div>` : ''}`)}
          ${list(L('Pronunciación', 'Pronunciation'), a?.pronunciation, esc)}
          ${list(L('Fluidez', 'Fluency'), a?.fluency, esc)}
          ${fill.length ? `<div class="small"><b>${L('Muletillas', 'Fillers')}:</b> ${fill.map(([k, n]) => `${esc(k)} ×${n}`).join(', ')}</div>` : ''}
          ${list(L('Para la próxima', 'Next time'), a?.next_steps, esc)}
          <details><summary class="muted">${L('Transcripción', 'Transcript')}</summary><div class="out" style="margin-top:8px">${esc(segs.map(s => s.text).join(' '))}</div></details>`;
        const say = v('eSay');
        if (say) say.onclick = () => { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(a.corrected); u.lang = 'en-US'; u.rate = .95; speechSynthesis.speak(u); };
      }
      function paintHist() {
        const h = store.get('speak:history', []);
        v('eHist').innerHTML = h.length ? `<div class="scroll-x"><table class="table"><thead><tr><th>${L('Fecha', 'Date')}</th><th>${L('Tema', 'Topic')}</th><th class="num">wpm</th><th class="num">${L('muletillas', 'fillers')}</th><th class="num">${L('errores', 'mistakes')}</th><th>${L('nivel', 'level')}</th></tr></thead><tbody>${
          h.map(x => `<tr><td>${new Date(x.at).toLocaleDateString(BD.locale())}</td><td translate="no">${esc(x.topic || '—')}</td><td class="num">${x.wpm}</td><td class="num">${x.fillers}</td><td class="num">${x.mistakes ?? '—'}</td><td>${esc(x.level || '—')}</td></tr>`).join('')}</tbody></table></div>`
          : `<p class="muted small">${L('Cada análisis queda aquí para que veas cómo mejoras.', 'Each analysis is kept here so you can see how you improve.')}</p>`;
      }
      paintHist();
      return () => { if (rec) rec.stop(); clearInterval(tick); if (url) URL.revokeObjectURL(url); speechSynthesis.cancel(); };
    },
  });
})();
