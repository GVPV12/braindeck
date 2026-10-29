'use strict';
/* Progress Engine: lista de temas, libros o videos → plan de estudio y de evaluación con calendario a la hora exacta (.ics).
   También guarda resultados de tests y el repaso espaciado (Leitner) que usa Libro → Test. */
(() => {
  const { $, $$, esc, win, store, toast, uid, today, num, L } = BD;
  const BOX_DAYS = [0, 1, 3, 7, 14, 30];
  const addDays = (n, d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() + n); return today(x); };
  const dateOf = s => new Date(s + 'T12:00');
  const daysBetween = (a, b) => Math.round((dateOf(b) - dateOf(a)) / 864e5);
  const hhmm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
  const toMin = s => { const [h, m] = String(s || '18:00').split(':'); return (+h || 0) * 60 + (+m || 0); };
  const clock = min => { const s = Math.round(min * 60), h = Math.floor(s / 3600); return (h ? h + ':' + String(Math.floor(s / 60) % 60).padStart(2, '0') : Math.floor(s / 60)) + ':' + String(s % 60).padStart(2, '0'); };
  const fmtDay = (s, opt = { weekday: 'long', day: 'numeric', month: 'long' }) => dateOf(s).toLocaleDateString(BD.locale(), opt);
  const plans = () => store.get('plans', []);
  const savePlans = p => store.set('plans', p);

  // ================= datos de tests (Libro → Test) =================
  const load = () => Object.assign({ topics: [], results: [], mistakes: [] }, store.get('progress', {}));
  const save = p => store.set('progress', p);
  function topicId(p, name) {
    name = (name || 'General').trim().slice(0, 60);
    let t = p.topics.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (!t) { t = { id: uid(), name, mastery: 0 }; p.topics.push(t); }
    return t.id;
  }
  function streak() {
    const days = new Set(load().results.map(r => r.date));
    plans().forEach(pl => pl.sessions.forEach(s => s.done && days.add(s.doneOn || s.date)));
    let d = new Date(), n = 0;
    if (!days.has(today(d))) d.setDate(d.getDate() - 1);
    while (days.has(today(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  BD.progress = {
    load,
    summary() {
      const all = plans(), t = today();
      const todays = all.flatMap(pl => pl.sessions.filter(s => s.date === t));
      const next = all.flatMap(pl => pl.sessions.filter(s => !s.done && (s.date > t || (s.date === t))).map(s => ({ ...s, plan: pl.name })))
        .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)[0];
      return {
        streak: streak(), plans: all.length,
        todayDone: todays.filter(s => s.done).length, todayTotal: todays.length, next,
        due: load().mistakes.filter(m => m.due <= t).length,
      };
    },
    // wrong: array de preguntas falladas → entran al repaso espaciado
    addResult(topic, correct, total, wrong = []) {
      const p = load();
      const id = topicId(p, topic);
      p.results.push({ date: today(), topicId: id, correct, total });
      const t = p.topics.find(t => t.id === id);
      const pct = total ? correct / total * 100 : 0;
      t.mastery = Math.round(t.mastery ? t.mastery * .6 + pct * .4 : pct);
      wrong.forEach(q => {
        if (!p.mistakes.some(m => m.item.q === q.q)) p.mistakes.push({ id: uid(), topicId: id, item: q, box: 1, due: addDays(1) });
      });
      save(p);
    },
    due() { const p = load(); return p.mistakes.filter(m => m.due <= today()); },
    review(id, ok) {
      const p = load();
      const m = p.mistakes.find(m => m.id === id); if (!m) return;
      if (ok) { m.box++; if (m.box > 5) p.mistakes = p.mistakes.filter(x => x !== m); else m.due = addDays(BOX_DAYS[m.box]); }
      else { m.box = 1; m.due = addDays(1); }
      save(p);
    },
  };

  // ================= lectura de la lista =================
  // Cada línea: "nombre | cantidad". Cantidad = horas/minutos (temas, videos) o páginas (libros). También "Álgebra 3h" o una URL de YouTube.
  const META = /^\s*(\d+([.,:]\d+)*\s*(h|hrs?|horas?|hours?|m|min|mins|minutos?|minutes?|p|págs?|pags?|pages?|páginas?)?\.?\s*)+$/i;
  function parseDur(s, bareUnit) {
    let m;
    if ((m = s.match(/(\d+):(\d{2}):(\d{2})/))) return +m[1] * 60 + +m[2] + +m[3] / 60;
    if ((m = s.match(/(\d{1,3}):(\d{2})/))) return +m[1] + +m[2] / 60;
    const h = s.match(/(\d+(?:[.,]\d+)?)\s*(h|hrs?|horas?|hours?)\b/i), mi = s.match(/(\d+)\s*(m|min|mins|minutos?|minutes?)\b/i);
    if (h || mi) return (h ? num(h[1]) * 60 : 0) + (mi ? +mi[1] : 0);
    if ((m = s.match(/^\s*(\d+(?:[.,]\d+)?)\s*$/))) return num(m[1]) * (bareUnit === 'h' ? 60 : 1);
    return 0;
  }
  function parseLine(line) {
    const url = (line.match(/https?:\/\/\S+/) || [])[0] || '';
    let parts = line.replace(url, ' ').split(/\s*[|\t;]\s*/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 1) { const m = parts[0].match(/^(.*?\S)\s+(\d[\d.,:]*\s*(h|hrs?|horas?|hours?|min|minutos?|minutes?|págs?|pags?|pages?|páginas?)\b.*)$/i); if (m) parts = [m[1], m[2]]; }
    const name = parts.find(p => !META.test(p)) || '';
    return { name: name.replace(/^[-*•\d.)\s]+(?=\D)/, '').trim(), url, extra: parts.filter(p => p !== name).join(' ') };
  }
  function parseItems(kind, text, o) {
    return text.split('\n').map(l => l.trim()).filter(Boolean).map(parseLine).filter(x => x.name || x.url).map(({ name, url, extra }) => {
      const it = { name: name || url, url };
      if (kind === 'books') {
        const timed = /[:h]|min/i.test(extra) && parseDur(extra, 'h');
        it.pages = timed ? 0 : (parseInt(extra) || o.pages);
        it.minutes = timed || it.pages / Math.max(1, o.pph) * 60;
      } else if (kind === 'videos') {
        it.videoMin = parseDur(extra, 'm') || o.videoMin;
        it.minutes = it.videoMin * o.factor;
      } else it.minutes = parseDur(extra, 'h') || o.topicH * 60;
      it.minutes = Math.max(5, Math.round(it.minutes));
      return it;
    });
  }

  // ================= planificador =================
  const HOW = {
    topics: () => L('Explica el tema sin mirar (técnica Feynman) y haz un test de 10 preguntas en Libro → Test.', 'Explain the topic without looking (Feynman technique) and take a 10-question test in Book → Test.'),
    books: () => L('Resume cada capítulo en 5 ideas y genera un test con el libro en Libro → Test.', 'Summarize each chapter in 5 ideas and generate a test from the book in Book → Test.'),
    videos: () => L('Escribe 3 ideas clave y una aplicación práctica; responde 5 preguntas sin volver a ver el video.', 'Write 3 key ideas and one practical use; answer 5 questions without rewatching.'),
    review: () => L('Repaso espaciado: relee tus notas y responde de memoria lo que fallaste.', 'Spaced review: reread your notes and answer from memory what you got wrong.'),
    final: () => L('Evaluación final: test mixto de todo el plan + mapa mental de lo aprendido.', 'Final assessment: mixed test of the whole plan + a mind map of what you learned.'),
  };
  function buildTasks(kind, items, o) {
    const tasks = [], block = Math.max(10, Math.min(o.block, o.perDay));
    items.forEach((it, idx) => {
      const n = Math.max(1, Math.ceil(it.minutes / block - .15)), per = Math.min(it.minutes / n, o.perDay);
      for (let k = 0; k < n; k++) {
        let detail = n > 1 ? L(`Parte ${k + 1} de ${n}`, `Part ${k + 1} of ${n}`) : '';
        if (kind === 'books' && it.pages) detail = L(`Págs. ${Math.floor(it.pages * k / n) + 1}–${Math.floor(it.pages * (k + 1) / n)}`, `Pages ${Math.floor(it.pages * k / n) + 1}–${Math.floor(it.pages * (k + 1) / n)}`);
        if (kind === 'videos') detail = `▶ ${clock(it.videoMin * k / n)} – ${clock(it.videoMin * (k + 1) / n)}`;
        tasks.push({ id: uid(), type: 'study', item: idx, title: it.name, detail, dur: Math.round(per), url: it.url || '' });
      }
      let last = tasks[tasks.length - 1].id;
      if (o.evals) { const e = { id: uid(), type: 'eval', item: idx, title: it.name, detail: HOW[kind](), dur: Math.min(o.evalMin, o.perDay), dep: last, gap: 1 }; tasks.push(e); last = e.id; }
      if (o.review) tasks.push({ id: uid(), type: 'review', item: idx, title: it.name, detail: HOW.review(), dur: Math.min(20, o.perDay), dep: last, gap: 7 });
    });
    if (o.final && tasks.length) {
      const lastMain = [...tasks].reverse().find(t => t.type !== 'review');
      tasks.push({ id: uid(), type: 'final', item: -1, title: L('Evaluación final', 'Final assessment'), detail: HOW.final(), dur: Math.min(60, o.perDay), dep: lastMain.id, gap: 1 });
    }
    return tasks;
  }
  // Coloca las tareas día a día respetando días libres, minutos por día, descansos y dependencias
  // (una evaluación va al menos 1 día después de terminar el tema; un repaso, 7 días después).
  function schedule(tasks, o, fixed = {}) {
    const placed = { ...fixed }, pending = tasks.filter(t => !placed[t.id]), out = [];
    const day = dateOf(o.start);
    for (let guard = 0; pending.length && guard < 1100; guard++, day.setDate(day.getDate() + 1)) {
      if (!o.days.includes(day.getDay())) continue;
      const ds = today(day);
      const ready = x => !x.dep || (placed[x.dep] && daysBetween(placed[x.dep], ds) >= x.gap);
      let cap = o.perDay, t = toMin(o.time);
      for (;;) {
        let i = pending.findIndex(x => x.type !== 'study' && ready(x));
        if (i < 0) i = pending.findIndex(x => x.type === 'study');
        if (i < 0) break;
        const x = pending[i];
        if (x.dur > cap) break;
        out.push({ ...x, date: ds, start: t, end: t + x.dur, done: false });
        placed[x.id] = ds; pending.splice(i, 1);
        cap -= x.dur + o.pause; t += x.dur + o.pause;
      }
    }
    return out;
  }
  const sortS = a => a.sort((x, y) => x.date.localeCompare(y.date) || x.start - y.start);

  // ================= exportar =================
  function ics(pl) {
    const e = s => String(s).replace(/\\/g, '\\\\').replace(/[;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const fold = l => l.length <= 74 ? l : l.match(/.{1,73}/g).join('\r\n ');
    const dt = (d, m) => d.replace(/-/g, '') + 'T' + hhmm(m).replace(':', '') + '00';
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const TYPE = { study: '📚', eval: '📝', review: '🔁', final: '🏁' };
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BrainDeck//Plan de estudios//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + e(pl.name)];
    pl.sessions.forEach(s => lines.push('BEGIN:VEVENT', `UID:${s.id}@braindeck`, 'DTSTAMP:' + stamp, 'DTSTART:' + dt(s.date, s.start), 'DTEND:' + dt(s.date, s.end),
      'SUMMARY:' + e(`${TYPE[s.type]} ${typeName(s.type)}: ${s.title}`), 'DESCRIPTION:' + e([s.detail, s.url, pl.name].filter(Boolean).join('\n')),
      ...(s.url ? ['URL:' + s.url] : []), 'BEGIN:VALARM', 'TRIGGER:-PT10M', 'ACTION:DISPLAY', 'DESCRIPTION:' + e(s.title), 'END:VALARM', 'END:VEVENT'));
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n');
  }
  const typeName = t => ({ study: L('Estudio', 'Study'), eval: L('Evaluación', 'Assessment'), review: L('Repaso', 'Review'), final: L('Evaluación final', 'Final assessment') }[t]);
  const fileName = s => s.replace(/[^\wáéíóúñ -]/gi, '').trim().slice(0, 40) || 'plan';

  // ================= creador =================
  const DOW = () => [[1, L('L', 'M')], [2, L('M', 'T')], [3, L('X', 'W')], [4, L('J', 'T')], [5, L('V', 'F')], [6, L('S', 'S')], [0, L('D', 'S')]];
  const KINDS = () => ({
    topics: { l: L('Temas', 'Topics'), ph: L('Fundamentos de Jung | 3h\nArquetipos | 2h\nLa sombra\nIndividuación 90min', 'Jung basics | 3h\nArchetypes | 2h\nThe shadow\nIndividuation 90min'),
      help: L('Un tema por línea. Opcional: duración (3h, 90min). Si no la pones, se usa la de abajo.', 'One topic per line. Optional: duration (3h, 90min). Otherwise the default below is used.') },
    books: { l: L('Libros', 'Books'), ph: L('El hombre y sus símbolos | 420\nRecuerdos, sueños, pensamientos | 380\nArquetipos e inconsciente colectivo', 'Man and His Symbols | 420\nMemories, Dreams, Reflections | 380\nThe Archetypes and the Collective Unconscious'),
      help: L('Un libro por línea. Opcional: nº de páginas (| 320) o tiempo (| 6h).', 'One book per line. Optional: page count (| 320) or time (| 6h).') },
    videos: { l: L('Videos', 'Videos'), ph: 'https://www.youtube.com/watch?v=… | 24:10\nCarl Jung y la sombra | 18:32\nhttps://youtu.be/… | 1:02:15',
      help: L('Un video por línea: enlace y/o título + duración (mm:ss o h:mm:ss). La duración no se puede leer de YouTube sin API: escríbela o usa la de abajo.', 'One video per line: link and/or title + duration (mm:ss or h:mm:ss). Duration can\'t be read from YouTube without an API: type it or use the default below.') },
  });
  const DEFAULTS = { name: '', kind: 'topics', list: '', topicH: 2, pages: 250, pph: 25, videoMin: 20, factor: 1.5, start: '', time: '18:00', perDay: 90, block: 45, pause: 10, days: [1, 2, 3, 4, 5], evals: true, evalMin: 30, review: true, final: true };

  BD.tool({
    path: '/plan', cat: 'estudio', title: 'Crear plan de estudios', short: 'Crear plan de estudios', icon: BD.icon('calendar'),
    colors: ['#7ef0b6', '#14b86a'], desc: 'Lista de temas, libros o videos → plan de estudio y evaluación con calendario a la hora exacta para guardar en tu PC.',
    render(view) {
      const body = win(view, { title: L('Crear plan de estudios', 'Create a study plan'), sub: L(
        'Escribe todo lo que quieres aprender sobre algo (temas, libros o videos). Se crea un plan de estudio y de evaluación, con un calendario a la hora exacta que puedes descargar a tu PC o importar en Google Calendar / Outlook.',
        'List everything you want to learn about something (topics, books or videos). You get a study and assessment plan with an hour-by-hour calendar you can download to your PC or import into Google Calendar / Outlook.') });
      const o = Object.assign({}, DEFAULTS, store.get('plan:draft', {}));
      if (!o.start || o.start < today()) o.start = today();
      const K = KINDS();
      const all = plans();

      body.innerHTML = `
        ${all.length ? `<h3>${L('Mis planes', 'My plans')}</h3><div class="grid g2" style="margin-bottom:22px">${all.map(pl => {
          const d = pl.sessions.filter(s => s.done).length, end = pl.sessions.length ? sortS([...pl.sessions]).at(-1).date : '';
          return `<a class="card row" href="#/plan/${pl.id}" style="text-decoration:none;color:inherit">
            <div style="flex:1;min-width:0"><b translate="no">${esc(pl.name)}</b><div class="muted small">${K[pl.kind].l} · ${pl.items.length} · ${L('termina', 'ends')} ${end ? fmtDay(end, { day: 'numeric', month: 'short' }) : '—'}</div>
            <div class="bar" style="margin-top:8px"><i style="width:${pl.sessions.length ? d / pl.sessions.length * 100 : 0}%"></i></div></div>
            <span class="chip">${pl.sessions.length ? Math.round(d / pl.sessions.length * 100) : 0}%</span></a>`;
        }).join('')}</div><hr class="sep">` : ''}
        <h2>${L('Nuevo plan', 'New plan')}</h2>
        <div class="split">
          <div class="stack">
            <div class="card stack">
              <label class="field"><span>${L('¿Qué quieres aprender?', 'What do you want to learn?')}</span>
                <input type="text" id="gName" value="${esc(o.name)}" placeholder="${L('Ej. Psicología de Carl Jung', 'E.g. Carl Jung\'s psychology')}"></label>
              <div class="field"><span>${L('Tu lista es de…', 'Your list is made of…')}</span><div id="gKind"></div></div>
              <label class="field"><span id="gHelp"></span><textarea id="gList" rows="8" style="min-height:180px"></textarea></label>
              <div class="row">
                <button class="btn ghost sm" id="gSuggest">✨ ${L('Sugerir lista con IA', 'Suggest a list with AI')}</button>
                <button class="btn ghost sm hidden" id="gYt">${L('Leer títulos de YouTube', 'Fetch YouTube titles')}</button>
                <span class="muted small" id="gAiSt"></span>
              </div>
              <div class="grid g2" id="gPer"></div>
            </div>
          </div>
          <div class="stack">
            <div class="card stack">
              <h3>${L('Calendario', 'Calendar')}</h3>
              <div class="grid g2">
                <label class="field"><span>${L('Empieza el', 'Starts on')}</span><input type="date" id="gStart" value="${o.start}"></label>
                <label class="field"><span>${L('Hora de inicio', 'Start time')}</span><input type="time" id="gTime" value="${o.time}"></label>
                <label class="field"><span>${L('Minutos de estudio por día', 'Study minutes per day')}</span><input type="number" id="gPerDay" min="15" step="5" value="${o.perDay}"></label>
                <label class="field"><span>${L('Bloque de estudio (min)', 'Study block (min)')}</span><input type="number" id="gBlock" min="10" step="5" value="${o.block}"></label>
                <label class="field"><span>${L('Descanso entre bloques (min)', 'Break between blocks (min)')}</span><input type="number" id="gPause" min="0" step="5" value="${o.pause}"></label>
              </div>
              <div class="field"><span>${L('Días que puedes estudiar', 'Days you can study')}</span>
                <div class="row" id="gDays">${DOW().map(([d, l]) => `<button type="button" class="btn sm ${o.days.includes(d) ? 'primary' : 'ghost'}" data-d="${d}" style="min-width:42px">${l}</button>`).join('')}</div></div>
            </div>
            <div class="card stack">
              <h3>${L('Plan de evaluación', 'Assessment plan')}</h3>
              <label class="check"><input type="checkbox" id="gEvals" ${o.evals ? 'checked' : ''}> ${L('Evaluación al terminar cada elemento', 'Assessment after finishing each item')}
                <input type="number" id="gEvalMin" min="10" step="5" value="${o.evalMin}" style="width:70px;margin-left:6px"> min</label>
              <label class="check"><input type="checkbox" id="gReview" ${o.review ? 'checked' : ''}> ${L('Repaso espaciado 7 días después', 'Spaced review 7 days later')}</label>
              <label class="check"><input type="checkbox" id="gFinal" ${o.final ? 'checked' : ''}> ${L('Evaluación final de todo', 'Final assessment of everything')}</label>
            </div>
            <div class="note-box" id="gEst"></div>
            <button class="btn primary" id="gGo">${L('Crear plan y calendario', 'Create plan and calendar')} ✨</button>
          </div>
        </div>`;

      const list = $('#gList', body);
      list.value = o.list;
      function perKind() {
        const f = (id, label, v, step = 1) => `<label class="field"><span>${label}</span><input type="number" id="${id}" min="0" step="${step}" value="${v}"></label>`;
        $('#gPer', body).innerHTML = o.kind === 'books'
          ? f('gPages', L('Páginas por libro (si no lo indicas)', 'Pages per book (if not given)'), o.pages, 10) + f('gPph', L('Tu velocidad de lectura (págs/hora)', 'Your reading speed (pages/hour)'), o.pph)
          : o.kind === 'videos'
            ? f('gVid', L('Duración por video si no la indicas (min)', 'Video length if not given (min)'), o.videoMin) + f('gFactor', L('Multiplicador para pausar y tomar notas', 'Multiplier for pausing and taking notes'), o.factor, .1)
            : f('gTopicH', L('Horas por tema (si no lo indicas)', 'Hours per topic (if not given)'), o.topicH, .5);
        $('#gHelp', body).textContent = K[o.kind].help;
        list.placeholder = K[o.kind].ph;
        $('#gYt', body).classList.toggle('hidden', o.kind !== 'videos');
      }
      BD.seg($('#gKind', body), Object.entries(K).map(([k, v]) => [k, v.l]), o.kind, v => { o.kind = v; perKind(); sync(); });
      $('#gDays', body).onclick = e => {
        const b = e.target.closest('[data-d]'); if (!b) return;
        const d = +b.dataset.d;
        o.days = o.days.includes(d) ? o.days.filter(x => x !== d) : [...o.days, d];
        b.classList.toggle('primary'); b.classList.toggle('ghost'); sync();
      };

      let tasks = [], items = [];
      function sync() {
        const v = id => $('#' + id, body);
        Object.assign(o, { name: v('gName').value, list: list.value, start: v('gStart').value || today(), time: v('gTime').value || '18:00',
          perDay: Math.max(15, num(v('gPerDay').value)), block: Math.max(10, num(v('gBlock').value)), pause: Math.max(0, num(v('gPause').value)),
          evals: v('gEvals').checked, evalMin: Math.max(10, num(v('gEvalMin').value)), review: v('gReview').checked, final: v('gFinal').checked });
        if (v('gPages')) { o.pages = num(v('gPages').value) || 250; o.pph = num(v('gPph').value) || 25; }
        if (v('gVid')) { o.videoMin = num(v('gVid').value) || 20; o.factor = num(v('gFactor').value) || 1; }
        if (v('gTopicH')) o.topicH = num(v('gTopicH').value) || 2;
        store.set('plan:draft', o);
        items = parseItems(o.kind, o.list, o);
        const est = $('#gEst', body);
        if (!items.length) { est.textContent = L('Escribe al menos un elemento en la lista.', 'Add at least one item to the list.'); return; }
        if (!o.days.length) { est.textContent = L('Elige al menos un día de la semana.', 'Pick at least one weekday.'); return; }
        tasks = buildTasks(o.kind, items, o);
        const ses = schedule(tasks, o), h = ses.reduce((a, s) => a + s.end - s.start, 0) / 60;
        const end = ses.length ? sortS([...ses]).at(-1).date : o.start;
        est.innerHTML = L(`<b>${items.length}</b> elementos · <b>${h.toFixed(1)} h</b> en <b>${ses.length}</b> sesiones · terminas el <b>${fmtDay(end)}</b>`,
          `<b>${items.length}</b> items · <b>${h.toFixed(1)} h</b> in <b>${ses.length}</b> sessions · you finish on <b>${fmtDay(end)}</b>`);
      }
      body.addEventListener('input', sync);
      body.addEventListener('change', sync);
      perKind(); sync();

      // YouTube: el título sí se puede leer sin API (oEmbed vía noembed); la duración no
      $('#gYt', body).onclick = async e => {
        const btn = e.currentTarget; btn.disabled = true;
        const lines = list.value.split('\n');
        let n = 0;
        for (let i = 0; i < lines.length; i++) {
          const p = parseLine(lines[i]);
          if (!p.url || p.name) continue;
          try {
            const r = await (await fetch('https://noembed.com/embed?url=' + encodeURIComponent(p.url))).json();
            if (r.title) { lines[i] = [r.title.replace(/[|;]/g, '-'), p.url, p.extra].filter(Boolean).join(' | '); n++; }
          } catch {}
        }
        list.value = lines.join('\n'); sync(); btn.disabled = false;
        toast(n ? L(`${n} títulos encontrados`, `${n} titles found`) : L('No encontré títulos nuevos', 'No new titles found'));
      };
      $('#gSuggest', body).onclick = async e => {
        const name = $('#gName', body).value.trim();
        if (!name) return toast(L('Escribe primero qué quieres aprender', 'First write what you want to learn'), 'bad');
        if (o.kind === 'videos') return toast(L('Para videos pega tus enlaces: la IA no puede ver YouTube', 'For videos paste your links: the AI can\'t browse YouTube'), 'bad');
        const btn = e.currentTarget, st = $('#gAiSt', body); btn.disabled = true;
        const what = o.kind === 'books' ? L('libros reales y conocidos (título — autor) con su nº aproximado de páginas', 'real, well-known books (title — author) with their approximate page count')
          : L('temas en orden lógico de aprendizaje, de lo básico a lo avanzado, con las horas estimadas de cada uno', 'topics in a logical learning order, from basics to advanced, with estimated hours for each');
        try {
          st.innerHTML = '<span class="spin"></span>';
          const r = await BD.anyAI(L(`Quiero aprender: "${name}". Dame entre 6 y 12 ${what}. Responde solo JSON: {"items":[{"name":"","amount":0}]} (amount = ${o.kind === 'books' ? 'páginas' : 'horas'}).`,
            `I want to learn: "${name}". Give me 6 to 12 ${what}. Reply with JSON only: {"items":[{"name":"","amount":0}]} (amount = ${o.kind === 'books' ? 'pages' : 'hours'}).`),
          { json: true, system: L('Eres un tutor experto que diseña planes de estudio. Respondes solo JSON válido.', 'You are an expert tutor who designs study plans. You reply with valid JSON only.'),
            onProgress: (p, msg) => st.textContent = `${msg} ${Math.round(p * 100)}%` });
          const add = (r.items || r).filter(x => x && x.name).map(x => `${String(x.name).replace(/[|;]/g, '-')} | ${o.kind === 'books' ? Math.round(num(x.amount)) || '' : (num(x.amount) || o.topicH) + 'h'}`);
          list.value = (list.value.trim() ? list.value.trim() + '\n' : '') + add.join('\n'); sync();
          st.textContent = '';
        } catch (err) {
          st.textContent = '';
          toast(BD.hasAI() ? err.message : L('Sin API key se usa la IA local; tampoco está disponible aquí: ', 'Without an API key the local AI is used; it isn\'t available here either: ') + err.message, 'bad');
        }
        btn.disabled = false;
      };

      $('#gGo', body).onclick = () => {
        sync();
        if (!items.length || !o.days.length) return toast($('#gEst', body).textContent, 'bad');
        const opts = { start: o.start, time: o.time, perDay: o.perDay, block: o.block, pause: o.pause, days: o.days, evals: o.evals, evalMin: o.evalMin, review: o.review, final: o.final };
        const pl = { id: uid(), name: o.name.trim() || items[0].name, kind: o.kind, items, tasks, opts, sessions: schedule(tasks, opts), created: Date.now() };
        const ps = plans(); ps.unshift(pl); savePlans(ps);
        store.set('plan:draft', { ...o, name: '', list: '' });
        BD.log(L('Plan de estudio', 'Study plan'), pl.name, { lines: [[L('Elementos', 'Items'), String(items.length)], [L('Sesiones', 'Sessions'), String(pl.sessions.length)]] });
        location.hash = '#/plan/' + pl.id;
      };
    },
  });
  BD.route('/progreso', { title: '', render() { location.replace('#/plan'); } });

  // ================= vista del plan =================
  BD.route('/plan/:id', {
    title: 'Crear plan de estudios',
    render(view, { id }) {
      const ps = plans(), pl = ps.find(p => p.id === id);
      if (!pl) { win(view, { title: L('Plan no encontrado', 'Plan not found'), back: '#/plan' }).innerHTML = `<p class="muted">${L('Este plan no existe en este navegador.', 'This plan doesn\'t exist in this browser.')}</p>`; return; }
      const K = KINDS();
      document.title = pl.name + ' · BrainDeck';
      const body = win(view, { title: pl.name, sub: `${K[pl.kind].l} · ${pl.items.length} · ${L('desde', 'from')} ${fmtDay(pl.opts.start, { day: 'numeric', month: 'long', year: 'numeric' })}`, back: '#/plan' });
      body.setAttribute('translate', 'no');
      sortS(pl.sessions);
      let month = (pl.sessions.find(s => !s.done) || pl.sessions[0] || { date: today() }).date.slice(0, 7);
      const persist = () => savePlans(ps);
      const TYPE = { study: ['📚', ''], eval: ['📝', 'good'], review: ['🔁', ''], final: ['🏁', 'good'] };

      function draw() {
        const S = pl.sessions, done = S.filter(s => s.done).length, h = S.reduce((a, s) => a + s.end - s.start, 0) / 60;
        const end = S.length ? S.at(-1).date : pl.opts.start;
        const late = S.filter(s => !s.done && s.date < today()).length;
        // calendario del mes
        const [y, m] = month.split('-').map(Number), first = new Date(y, m - 1, 1), dim = new Date(y, m, 0).getDate();
        const lead = (first.getDay() + 6) % 7, byDay = {};
        S.forEach(s => (byDay[s.date] = byDay[s.date] || []).push(s));
        const cells = [];
        for (let i = 0; i < lead; i++) cells.push('<div class="cal-d off"></div>');
        for (let d = 1; d <= dim; d++) {
          const ds = `${month}-${String(d).padStart(2, '0')}`, ss = byDay[ds] || [];
          cells.push(`<button class="cal-d ${ds === today() ? 'today' : ''} ${ss.length ? 'has' : ''} ${ss.length && ss.every(s => s.done) ? 'all' : ''}" data-day="${ds}" ${ss.length ? '' : 'disabled'}>
            <b>${d}</b>${ss.slice(0, 3).map(s => `<i class="cal-ev ${s.type} ${s.done ? 'done' : ''}">${TYPE[s.type][0]} ${esc(s.title)}</i>`).join('')}${ss.length > 3 ? `<i class="cal-more">+${ss.length - 3}</i>` : ''}</button>`);
        }
        const monthName = first.toLocaleDateString(BD.locale(), { month: 'long', year: 'numeric' });
        const agenda = Object.entries(byDay).filter(([d]) => d.startsWith(month)).map(([d, ss]) => `
          <div class="agenda-day" id="d-${d}"><h4>${fmtDay(d)}</h4>${ss.map(s => `
            <label class="agenda-row ${s.done ? 'done' : ''}">
              <input type="checkbox" data-s="${s.id}" ${s.done ? 'checked' : ''}>
              <span class="mono small">${hhmm(s.start)}–${hhmm(s.end)}</span>
              <span class="chip ${TYPE[s.type][1]}">${TYPE[s.type][0]} ${typeName(s.type)}</span>
              <span style="flex:1;min-width:140px"><b>${esc(s.title)}</b>${s.detail ? `<span class="muted small"> · ${esc(s.detail)}</span>` : ''}
              ${s.url ? ` <a href="${esc(s.url)}" target="_blank" rel="noopener" class="small">${L('abrir', 'open')} ↗</a>` : ''}</span>
            </label>`).join('')}</div>`).join('') || `<p class="muted">${L('Sin sesiones este mes.', 'No sessions this month.')}</p>`;
        // plan de evaluación por elemento
        const evalRows = pl.items.map((it, i) => {
          const mine = S.filter(s => s.item === i), st = mine.filter(s => s.type === 'study');
          const ev = mine.find(s => s.type === 'eval'), rv = mine.find(s => s.type === 'review');
          const pct = mine.length ? Math.round(mine.filter(s => s.done).length / mine.length * 100) : 0;
          return `<div class="card stack" style="padding:14px">
            <div class="row"><b style="flex:1;min-width:0">${esc(it.name)}</b><span class="chip">${pct}%</span></div>
            <div class="muted small">${(it.minutes / 60).toFixed(1)} h · ${st.length} ${L('bloques', 'blocks')} · ${st.length ? fmtDay(st[0].date, { day: 'numeric', month: 'short' }) + ' → ' + fmtDay(st.at(-1).date, { day: 'numeric', month: 'short' }) : ''}</div>
            ${ev ? `<div class="small">📝 <b>${fmtDay(ev.date, { weekday: 'short', day: 'numeric', month: 'short' })} ${hhmm(ev.start)}</b> — ${esc(ev.detail)}</div>` : ''}
            ${rv ? `<div class="small">🔁 <b>${fmtDay(rv.date, { weekday: 'short', day: 'numeric', month: 'short' })} ${hhmm(rv.start)}</b> — ${L('repaso', 'review')}</div>` : ''}
            <div class="bar"><i style="width:${pct}%"></i></div>
          </div>`;
        }).join('');
        const fin = S.find(s => s.type === 'final');

        body.innerHTML = `
          <div class="grid g4">
            <div class="card stat"><b>${h.toFixed(1)} h</b><span>${L('de estudio', 'of study')}</span></div>
            <div class="card stat"><b>${S.length}</b><span>${L('sesiones', 'sessions')}</span></div>
            <div class="card stat"><b>${fmtDay(end, { day: 'numeric', month: 'short' })}</b><span>${L('fecha de fin', 'end date')}</span></div>
            <div class="card stat"><b>${S.length ? Math.round(done / S.length * 100) : 0}%</b><span>${L('completado', 'done')}</span><div class="bar" style="margin-top:8px"><i style="width:${S.length ? done / S.length * 100 : 0}%"></i></div></div>
          </div>
          ${late ? `<div class="note-box" style="margin-top:16px">⏰ ${L(`Tienes <b>${late}</b> sesiones atrasadas.`, `You have <b>${late}</b> overdue sessions.`)} <button class="btn primary sm" id="plResched" style="margin-left:8px">${L('Reprogramar desde hoy', 'Reschedule from today')}</button></div>` : ''}
          <div class="row" style="margin:18px 0">
            <button class="btn primary" id="plIcs">📅 ${L('Descargar calendario (.ics)', 'Download calendar (.ics)')}</button>
            <button class="btn ghost" id="plCsv">CSV</button>
            <span class="muted small">${L('Ábrelo con Outlook / Calendario de Windows o impórtalo en Google Calendar. Cada sesión trae aviso 10 min antes.', 'Open it with Outlook / Windows Calendar or import it into Google Calendar. Each session has a 10-min reminder.')}</span>
          </div>
          <div class="split">
            <div class="card">
              <div class="row" style="margin-bottom:10px"><button class="icon-btn" data-m="-1">‹</button><h3 style="margin:0;flex:1;text-align:center;text-transform:capitalize">${monthName}</h3><button class="icon-btn" data-m="1">›</button></div>
              <div class="cal">${DOW().map(([, l]) => `<div class="cal-h">${l}</div>`).join('')}${cells.join('')}</div>
            </div>
            <div class="stack">
              <h3 style="margin:0">${L('Plan de evaluación', 'Assessment plan')}</h3>
              ${evalRows}
              ${fin ? `<div class="card" style="padding:14px">🏁 <b>${typeName('final')}</b> — <b>${fmtDay(fin.date, { weekday: 'short', day: 'numeric', month: 'short' })} ${hhmm(fin.start)}</b><div class="muted small">${esc(fin.detail)}</div></div>` : ''}
              <a class="btn ghost sm" href="#/test">${L('Crear un test en Libro → Test', 'Create a test in Book → Test')} →</a>
            </div>
          </div>
          <div class="section-title"><h2>${L('Agenda', 'Agenda')}</h2><span class="muted small" style="text-transform:capitalize">${monthName}</span></div>
          <div class="card agenda">${agenda}</div>
          <div class="row" style="margin-top:18px"><span class="spacer"></span><button class="btn ghost danger" id="plDel">${L('Borrar plan', 'Delete plan')}</button></div>`;
      }

      body.onclick = e => {
        const mv = e.target.closest('[data-m]');
        if (mv) { const [y, m] = month.split('-').map(Number), d = new Date(y, m - 1 + +mv.dataset.m, 1); month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; draw(); return; }
        const day = e.target.closest('[data-day]');
        if (day) { $('#d-' + day.dataset.day, body)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        const id = e.target.id;
        if (id === 'plIcs') BD.download(new Blob([ics(pl)], { type: 'text/calendar' }), fileName(pl.name) + '.ics');
        if (id === 'plCsv') BD.download(new Blob(['﻿' + [L('fecha,inicio,fin,tipo,elemento,detalle,hecho', 'date,start,end,type,item,detail,done'),
          ...pl.sessions.map(s => [s.date, hhmm(s.start), hhmm(s.end), typeName(s.type), s.title, s.detail, s.done ? 1 : 0].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')], { type: 'text/csv' }), fileName(pl.name) + '.csv');
        if (id === 'plResched') {
          const fixed = {}; pl.sessions.filter(s => s.done).forEach(s => fixed[s.id] = s.date);
          const tasks = pl.tasks.filter(t => !fixed[t.id]);
          pl.sessions = sortS([...pl.sessions.filter(s => s.done), ...schedule(tasks, { ...pl.opts, start: today() }, fixed)]);
          persist(); toast(L('Plan reprogramado 📅 (descarga el .ics de nuevo)', 'Plan rescheduled 📅 (download the .ics again)'));
          month = today().slice(0, 7); draw();
        }
        if (id === 'plDel') {
          if (!e.target.dataset.armed) { e.target.dataset.armed = 1; e.target.textContent = L('¿Seguro? Pulsa otra vez', 'Sure? Click again'); return; }
          savePlans(ps.filter(p => p.id !== pl.id)); location.hash = '#/plan';
        }
      };
      body.onchange = e => {
        const s = pl.sessions.find(x => x.id === e.target.dataset.s); if (!s) return;
        s.done = e.target.checked; s.doneOn = s.done ? today() : undefined;
        persist();
        if (s.done && pl.sessions.every(x => x.done)) toast(L('¡Plan completado! 🎉', 'Plan completed! 🎉'));
        draw();
      };
      draw();
    },
  });
})();
