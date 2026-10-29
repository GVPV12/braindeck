'use strict';
/* Gesture drawing: sesiones cronometradas con referencias de pose (tus fotos o fotos libres de Wikimedia Commons). */
(() => {
  const { $, esc, win, store, toast, L } = BD;
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Búsquedas en Wikimedia Commons (licencias libres, con crédito). Se evitan términos que traen desnudos.
  const TOPICS = () => [
    ['dance', L('Danza', 'Dance'), 'ballet dancer performance'], ['sport', L('Deporte', 'Sports'), 'athlete action sport'], ['martial', L('Artes marciales', 'Martial arts'), 'martial arts kick'],
    ['people', L('Gente en la calle', 'People on the street'), 'street photography people walking'], ['hands', L('Manos', 'Hands'), 'hands gesture close-up'],
    ['faces', L('Rostros', 'Faces'), 'portrait face expression'], ['animals', L('Animales', 'Animals'), 'animal wildlife motion'], ['cats', L('Gatos', 'Cats'), 'cat stretching'],
    ['birds', L('Aves', 'Birds'), 'bird in flight'], ['horses', L('Caballos', 'Horses'), 'horse galloping'],
  ];
  async function commons(query, n = 40) {
    const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
      action: 'query', generator: 'search', gsrsearch: `filetype:bitmap ${query}`, gsrnamespace: '6', gsrlimit: String(n), gsroffset: String(Math.floor(Math.random() * 4) * n),
      prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1400', format: 'json', origin: '*',
    });
    const pages = Object.values((await (await fetch(u)).json()).query?.pages || {});
    return pages.map(p => p.imageinfo?.[0]).filter(i => i && i.thumburl && !/nud|naked|erotic/i.test(JSON.stringify(i.extmetadata?.Categories || '')))
      .map(i => ({ src: i.thumburl, credit: `${(i.extmetadata?.Artist?.value || '').replace(/<[^>]+>/g, '').trim() || 'Wikimedia Commons'} · ${i.extmetadata?.LicenseShortName?.value || ''}`, page: i.descriptionurl }));
  }
  // Clase progresiva típica: calentamiento rápido → poses largas
  const PRESETS = () => [
    ['30', '30 s', [[30, 99]]], ['60', '1 min', [[60, 99]]], ['120', '2 min', [[120, 99]]], ['300', '5 min', [[300, 99]]],
    ['class', L('Clase (30 min)', 'Class (30 min)'), [[30, 10], [60, 5], [120, 3], [300, 2], [600, 1]]],
  ];

  BD.tool({
    path: '/gesture', cat: 'creativo', title: 'Gesture drawing', short: 'Gesture drawing', icon: BD.icon('pose'),
    colors: ['#c8f7c5', '#3ccf6e'], desc: 'Temporizador de dibujo de poses: 30 s, 1 min, 5 min o clase completa, con tus fotos o referencias libres.',
    render(view) {
      const body = win(view, { title: 'Gesture drawing', sub: L(
        'Practica poses con tiempo límite: captura el movimiento, no los detalles. Usa tus propias referencias o fotos con licencia libre de Wikimedia Commons.',
        'Practice timed poses: capture the movement, not the details. Use your own references or freely licensed photos from Wikimedia Commons.') });
      const o = Object.assign({ preset: '60', count: 10, topic: 'dance', flip: false, gray: false, grid: false, sound: true }, store.get('gest:opts', {}));
      let own = [], session = null;

      body.innerHTML = `
        <div class="stack" id="gSetup">
          <div class="split">
            <div class="card stack">
              <h3 style="margin:0">1. ${L('Referencias', 'References')}</h3>
              <div id="gDrop"></div>
              <span class="muted small" id="gOwn"></span>
              <div class="field"><span>${L('…o fotos libres de Wikimedia Commons', '…or free photos from Wikimedia Commons')}</span>
                <select id="gTopic">${TOPICS().map(([v, l]) => `<option value="${v}" ${v === o.topic ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
              <p class="muted small" style="margin:0">${L('Más referencias gratuitas: line-of-action.com, quickposes.com, posemaniacs.com.', 'More free references: line-of-action.com, quickposes.com, posemaniacs.com.')}</p>
            </div>
            <div class="card stack">
              <h3 style="margin:0">2. ${L('Tiempo', 'Timing')}</h3>
              <div id="gPreset"></div>
              <label class="field" id="gCountBox"><span>${L('Número de poses', 'Number of poses')}</span><input type="number" id="gCount" min="1" max="99" value="${o.count}"></label>
              <label class="check"><input type="checkbox" id="gSound" ${o.sound ? 'checked' : ''}> ${L('Sonido al cambiar de pose', 'Sound when the pose changes')}</label>
              <button class="btn primary" id="gStart">▶ ${L('Empezar', 'Start')}</button>
              <span class="muted small" id="gSt"></span>
            </div>
          </div>
        </div>
        <div class="gest hidden" id="gRun">
          <div class="gest-stage" id="gStage"><img id="gImg" alt=""><div class="gest-grid"></div></div>
          <div class="row gest-bar">
            <span class="mono result-big" id="gClock" style="margin:0;font-size:2rem">0:00</span>
            <span class="chip" id="gNum"></span><span class="spacer"></span>
            <button class="icon-btn" id="gPrev" title="${L('Anterior', 'Previous')}">⏮</button>
            <button class="icon-btn" id="gPause" title="${L('Pausa', 'Pause')}">⏸</button>
            <button class="icon-btn" id="gNext" title="${L('Siguiente', 'Next')}">⏭</button>
            <button class="icon-btn" data-t="flip" title="${L('Espejo', 'Mirror')}">⇋</button>
            <button class="icon-btn" data-t="gray" title="${L('Escala de grises', 'Grayscale')}">◐</button>
            <button class="icon-btn" data-t="grid" title="${L('Cuadrícula', 'Grid')}">#</button>
            <button class="btn ghost sm" id="gStop">${L('Terminar', 'End')}</button>
          </div>
          <div class="muted small" id="gCredit" translate="no"></div>
        </div>`;

      const sync = () => { Object.assign(o, { topic: $('#gTopic', body).value, count: Math.max(1, +$('#gCount', body).value || 10), sound: $('#gSound', body).checked }); store.set('gest:opts', o); };
      body.addEventListener('change', sync);
      BD.seg($('#gPreset', body), PRESETS().map(p => [p[0], p[1]]), o.preset, v => { o.preset = v; $('#gCountBox', body).classList.toggle('hidden', v === 'class'); sync(); });
      $('#gCountBox', body).classList.toggle('hidden', o.preset === 'class');
      BD.dropzone($('#gDrop', body), {
        accept: 'image/*', icon: '🧍', label: L('Suelta tus fotos de referencia', 'Drop your reference photos'), hint: L('Puedes soltar una carpeta entera de imágenes', 'You can drop a whole folder of images'),
        onFiles(list) { own.push(...list.filter(f => f.type.startsWith('image/')).map(f => ({ src: URL.createObjectURL(f), credit: f.name }))); $('#gOwn', body).textContent = L(`${own.length} fotos tuyas (se usan en vez de Wikimedia)`, `${own.length} of your photos (used instead of Wikimedia)`); },
      });

      const beep = () => { if (!o.sound) return; try { const c = new AudioContext(), os = c.createOscillator(), g = c.createGain(); os.frequency.value = 880; g.gain.value = .15; os.connect(g); g.connect(c.destination); os.start(); os.stop(c.currentTime + .15); os.onended = () => c.close(); } catch {} };
      const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

      function show() {
        const s = session, step = s.plan[s.i], ref = s.refs[s.i % s.refs.length];
        $('#gImg', body).src = ref.src;
        $('#gCredit', body).innerHTML = ref.page ? `<a href="${esc(ref.page)}" target="_blank" rel="noopener">${esc(ref.credit)}</a>` : esc(ref.credit);
        $('#gNum', body).textContent = `${s.i + 1}/${s.plan.length} · ${step >= 60 ? step / 60 + ' min' : step + ' s'}`;
        s.left = step;
        $('#gClock', body).textContent = fmt(s.left);
        const next = s.refs[(s.i + 1) % s.refs.length]; if (next) new Image().src = next.src; // precarga
      }
      function tick() {
        const s = session; if (!s || s.paused) return;
        s.left -= 1; $('#gClock', body).textContent = fmt(Math.max(0, s.left));
        $('#gClock', body).classList.toggle('warn', s.left <= 5);
        if (s.left <= 0) { beep(); if (s.i + 1 >= s.plan.length) return stop(true); s.i++; show(); }
      }
      function stop(done) {
        clearInterval(session?.timer);
        if (done && session) { const min = Math.round(session.plan.slice(0, session.i + 1).reduce((a, b) => a + b, 0) / 60); toast(L(`¡Sesión terminada! ${session.i + 1} poses · ${min} min ✏️`, `Session done! ${session.i + 1} poses · ${min} min ✏️`)); }
        session = null;
        $('#gRun', body).classList.add('hidden'); $('#gSetup', body).classList.remove('hidden');
      }
      $('#gStart', body).onclick = async () => {
        sync();
        const plan = PRESETS().find(p => p[0] === o.preset)[2].flatMap(([sec, n]) => Array(o.preset === 'class' ? n : o.count).fill(sec));
        let refs = shuffle(own);
        if (!refs.length) {
          $('#gSt', body).innerHTML = `<span class="spin"></span> ${L('Buscando referencias…', 'Finding references…')}`;
          try { refs = shuffle(await commons(TOPICS().find(t => t[0] === o.topic)[2])); }
          catch { refs = []; }
          $('#gSt', body).textContent = '';
          if (!refs.length) return toast(L('No pude traer fotos (¿sin conexión?). Sube las tuyas.', 'Couldn\'t fetch photos (offline?). Upload your own.'), 'bad');
        }
        session = { plan, refs, i: 0, left: 0, paused: false, timer: setInterval(tick, 1000) };
        $('#gSetup', body).classList.add('hidden'); $('#gRun', body).classList.remove('hidden');
        $('#gPause', body).textContent = '⏸';
        show();
      };
      $('#gPause', body).onclick = e => { if (!session) return; session.paused = !session.paused; e.currentTarget.textContent = session.paused ? '▶' : '⏸'; };
      $('#gNext', body).onclick = () => { if (session && session.i + 1 < session.plan.length) { session.i++; show(); } };
      $('#gPrev', body).onclick = () => { if (session && session.i > 0) { session.i--; show(); } };
      $('#gStop', body).onclick = () => stop(false);
      body.addEventListener('click', e => {
        const t = e.target.closest('[data-t]')?.dataset.t; if (!t) return;
        o[t] = !o[t]; store.set('gest:opts', o); applyView();
      });
      const applyView = () => { const st = $('#gStage', body); st.classList.toggle('flip', o.flip); st.classList.toggle('gray', o.gray); st.classList.toggle('grid', o.grid); };
      applyView();
      const onKey = e => { if (!session || e.target.closest('input,textarea')) return; if (e.code === 'Space') { e.preventDefault(); $('#gPause', body).click(); } if (e.key === 'ArrowRight') $('#gNext', body).click(); if (e.key === 'ArrowLeft') $('#gPrev', body).click(); };
      document.addEventListener('keydown', onKey);
      return () => { clearInterval(session?.timer); document.removeEventListener('keydown', onKey); own.forEach(r => URL.revokeObjectURL(r.src)); };
    },
  });
})();
