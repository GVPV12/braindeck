'use strict';
/* Tracker de progreso: un panel estilo web retro (ventanitas, pestañas, terminal) que sigue tu plan de estudios.
   No guarda datos propios: lee los planes de "Crear plan de estudios", los tests y repasos de "Libro → Test"
   y las notas de la pestaña Estudio de "Notas rápidas". Marcar una sesión aquí la marca también en el plan. */
(() => {
  const { esc, store, toast, today, L } = BD;
  const dateOf = s => new Date(s + 'T12:00');
  const addDays = (s, n) => { const d = dateOf(s); d.setDate(d.getDate() + n); return today(d); };
  const daysBetween = (a, b) => Math.round((dateOf(b) - dateOf(a)) / 864e5);
  const fmt = (s, o = { day: 'numeric', month: 'short' }) => dateOf(s).toLocaleDateString(BD.locale(), o);
  const hours = m => (m / 60).toFixed(m >= 600 ? 0 : 1).replace(/\.0$/, '') + ' h';
  const mins = s => s.end - s.start;
  const plans = () => store.get('plans', []) || [];
  // tipo de sesión → [nombre, color]
  const TYPES = () => ({ study: [L('Estudio', 'Study'), 'y'], eval: [L('Evaluación', 'Assessment'), 't'], review: [L('Repaso', 'Review'), 'g'], final: [L('Final', 'Final'), 'p'] });
  const TAB_C = ['p', 'y', 'g', 't', 'l'];

  // ---------- piezas de dibujo ----------
  const CUBE = '<svg class="tk-cube" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 15 4.5v7L8 15 1 11.5v-7z" fill="#fff"/><path d="M8 8 15 4.5v7L8 15z" fill="#cfcfcf"/><path d="M1 4.5 8 8l7-3.5M8 8v7M8 1 15 4.5v7L8 15 1 11.5v-7z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  const spark = (c, style) => `<svg class="tk-spark" style="${style}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1c1 7 4 10 11 11-7 1-10 4-11 11-1-7-4-10-11-11 7-1 10-4 11-11z" fill="var(--${c})" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  const win = (cls, title, body, bar = 'y') => `
    <section class="tk-w ${cls}" style="--bar:var(--${bar})">
      <div class="tk-bar"><i class="tk-dots" aria-hidden="true"><b></b><b></b><b></b></i><span>${title}</span></div>
      <div class="tk-body">${body}</div>
    </section>`;
  // panel gris al estilo de las webs de los 2000 ("THE LATEST NEWS::")
  const panel = (cls, title, body) => `
    <section class="tk-r ${cls}"><div class="tk-rh"><span>${title}::</span></div><div class="tk-rb">${body}</div></section>`;
  const meter = pct => `<span class="tk-meter" role="img" aria-label="${pct}%">${Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.round(pct / 10) ? 'on' : ''}"></i>`).join('')}</span>`;

  // Ritmo real: minutos hechos en los últimos 14 días (o desde que empezó el plan) → fecha estimada de fin
  function pace(pl, S) {
    const t = today(), done = S.filter(s => s.done), totMin = S.reduce((a, s) => a + mins(s), 0), doneMin = done.reduce((a, s) => a + mins(s), 0);
    const left = totMin - doneMin, planEnd = S.length ? S.at(-1).date : pl.opts.start;
    if (!left) { // plan terminado: ritmo promedio de todo el plan
      const end = done.map(s => s.doneOn || s.date).sort().at(-1) || t;
      return { totMin, doneMin, planEnd, eta: end, rate: doneMin / Math.max(1, daysBetween(pl.opts.start, end) + 1) };
    }
    const span = Math.max(1, Math.min(14, daysBetween(pl.opts.start, t) + 1));
    const since = addDays(t, 1 - span);
    const recent = done.filter(s => (s.doneOn || s.date) >= since).reduce((a, s) => a + mins(s), 0);
    const rate = t < pl.opts.start ? 0 : recent / span;
    return { totMin, doneMin, planEnd, rate, eta: rate ? addDays(t, Math.ceil(left / rate)) : null };
  }

  function heat(ps, pr) {
    const per = {};
    ps.forEach(p => p.sessions.forEach(s => { if (s.done) { const d = s.doneOn || s.date; per[d] = (per[d] || 0) + 1; } }));
    pr.results.forEach(r => per[r.date] = (per[r.date] || 0) + 1);
    const weeks = 15, end = new Date(), start = new Date(end);
    start.setDate(end.getDate() - (end.getDay() + 6) % 7 - (weeks - 1) * 7);
    let out = '';
    for (let d = new Date(start), i = 0; i < weeks * 7; i++, d.setDate(d.getDate() + 1)) {
      const k = today(d), v = per[k] || 0;
      out += d > end ? '<i class="off"></i>' : `<i data-l="${!v ? 0 : v < 2 ? 1 : v < 4 ? 2 : 3}" title="${k}: ${v}"></i>`;
    }
    return `<div class="tk-heat">${out}</div>`;
  }

  BD.tool({
    path: '/tracker', cat: 'estudio', title: L('Tracker de progreso', 'Progress tracker'), short: L('Tracker de progreso', 'Progress tracker'), icon: BD.icon('calendar'),
    colors: ['#d9f27a', '#8fd18a'],
    desc: L('Sigue tu plan de estudios: sesiones de la semana, horas, ritmo, fecha estimada de fin, tests y repasos.', 'Track your study plan: this week\'s sessions, hours, pace, estimated finish date, tests and reviews.'),
    render(view) {
      // Barra como la de todas las herramientas: volver, enlace para copiar y cerrar
      view.innerHTML = `
        <div class="tk-top">
          <a class="icon-btn" href="#/" title="${L('Volver', 'Back')}" aria-label="${L('Volver', 'Back')}">←</a>
          <h1>${L('Tracker de progreso', 'Progress tracker')}</h1>
          <button class="btn ghost sm tk-calm-btn" id="tkCalm" aria-pressed="false" title="${L('Muestra solo lo esencial: menos cosas en pantalla, sin animaciones', 'Shows only the essentials: fewer things on screen, no animations')}">🌙 <span>${L('Modo calma', 'Calm mode')}</span></button>
          <button class="icon-btn" id="tkShare" title="${L('Copiar enlace a esta herramienta', 'Copy link to this tool')}" aria-label="${L('Copiar enlace', 'Copy link')}">🔗</button>
          <a class="icon-btn" href="#/" title="${L('Cerrar', 'Close')}" aria-label="${L('Cerrar', 'Close')}">✕</a>
        </div>
        <section class="tk" translate="no"></section>`;
      const root = view.querySelector('.tk');
      // el enlace siempre apunta al tracker (sin ?plan=…, que es de este navegador)
      view.querySelector('#tkShare').onclick = () => BD.copy(location.href.split('#')[0] + '#/tracker', L('Enlace copiado ✨', 'Link copied ✨'));
      // #/tracker?plan=ID (desde la vista del plan) abre ese plan
      const fromUrl = new URLSearchParams(location.hash.split('?')[1] || '').get('plan');
      if (fromUrl) store.set('tracker:plan', fromUrl);
      let pid = store.get('tracker:plan', null), week = 0, skip = 0;
      // Energía de hoy (se olvida al día siguiente): decide qué tarea se sugiere en "ahora.exe"
      const en = store.get('tracker:energy', null);
      let energy = en && en.date === today() ? en.v : 'mid';
      // Cronómetro que cuenta hacia arriba (no es pomodoro: sin alarmas ni descansos obligados). Sobrevive a cambiar de página.
      let run = store.get('tracker:run', null);
      const setRun = r => { run = r; if (r) store.set('tracker:run', r); else store.del('tracker:run'); };
      const tick = () => {
        const el = root.querySelector('#tkElapsed'); if (!el || !run) return;
        const sec = Math.floor((Date.now() - run.t0) / 1000), s = editSessionPeek(run.id);
        el.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
        if (s) root.querySelector('#tkTBar').style.width = Math.min(100, sec / 60 / mins(s) * 100) + '%';
      };
      const iv = setInterval(tick, 1000);
      const editSessionPeek = id => plans().flatMap(p => p.sessions).find(s => s.id === id);
      // Modo calma: oculta lo secundario y las animaciones (se recuerda)
      const calmBtn = view.querySelector('#tkCalm');
      const setCalm = on => { root.classList.toggle('calm', on); calmBtn.setAttribute('aria-pressed', String(on)); calmBtn.classList.toggle('primary', on); };
      setCalm(!!store.get('tracker:calm', false));
      calmBtn.onclick = () => { const on = !root.classList.contains('calm'); store.set('tracker:calm', on); setCalm(on); };

      function draw() {
        const ps = plans(), t = today(), K = TYPES();
        const pl = ps.find(p => p.id === pid) || ps[0];
        const pr = BD.progress.load(), due = BD.progress.due().length;
        const name = (BD.settings().author || '').trim();
        const notes = (store.get('qnotes', []) || []).filter(n => n.tab === 'estudio').sort((a, b) => b.updated - a.updated);
        const decks = store.get('decks', []) || [];

        // ----- pestañas de planes -----
        const tabs = `<nav class="tk-tabs" aria-label="${L('Planes', 'Plans')}">
          <a class="tk-tab" href="#/" style="--c:var(--gr)">home</a>
          ${ps.map((p, i) => `<button class="tk-tab ${p === pl ? 'on' : ''}" data-plan="${p.id}" style="--c:var(--${TAB_C[i % TAB_C.length]})" aria-pressed="${p === pl}">${esc(p.name)}</button>`).join('')}
          <a class="tk-tab" href="#/plan" style="--c:#fff" title="${L('Nuevo plan', 'New plan')}">+ ${L('nuevo', 'new')}</a>
        </nav>`;

        if (!pl) {
          root.innerHTML = `${tabs}
            <div class="tk-grid">
              ${win('tk-hero tk-full', 'hola.txt', `
                ${spark('p', 'top:-14px;right:-12px;width:30px')}${spark('g', 'bottom:-12px;left:-10px;width:22px')}
                <h2 class="tk-h">¡${L('Hola', 'Hello')}${name ? ', ' + esc(name) : ''}!<span class="tk-caret"></span></h2>
                <p>${L('Aquí verás cómo avanzas en tu plan de estudios: sesiones de la semana, horas, ritmo y cuándo vas a terminar. Primero crea un plan con tus temas, libros o videos.',
                  'Here you\'ll see how your study plan is going: this week\'s sessions, hours, pace and when you\'ll finish. First create a plan with your topics, books or videos.')}</p>
                <a class="tk-btn" href="#/plan" style="--c:var(--y)">${L('Crear plan de estudios', 'Create a study plan')} ▸▸</a>`, 'p')}
              ${scores()}
              ${notesPanel()}
            </div>`;
          return;
        }

        const S = [...pl.sessions].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
        const done = S.filter(s => s.done), pct = S.length ? Math.round(done.length / S.length * 100) : 0;
        const late = S.filter(s => !s.done && s.date < t), next = S.find(s => !s.done && s.date >= t);
        const p = pace(pl, S), onTrack = p.eta && p.eta <= p.planEnd;

        // ----- hero -----
        const msg = pct === 100 ? L('¡Terminaste el plan! 🎉 Todo el contenido está estudiado y evaluado.', 'You finished the plan! 🎉 Everything has been studied and assessed.')
          : L(`Llevas <b>${done.length} de ${S.length}</b> sesiones de <b>${esc(pl.name)}</b> (${hours(p.doneMin)} de ${hours(p.totMin)}).`, `You've done <b>${done.length} of ${S.length}</b> sessions of <b>${esc(pl.name)}</b> (${hours(p.doneMin)} of ${hours(p.totMin)}).`) + ' ' +
            (p.eta ? (onTrack ? L(`A tu ritmo actual terminas el <b>${fmt(p.eta, { weekday: 'long', day: 'numeric', month: 'long' })}</b>: vas a tiempo ✨`, `At your current pace you'll finish on <b>${fmt(p.eta, { weekday: 'long', day: 'numeric', month: 'long' })}</b>: right on track ✨`)
              // sin culpa: la fecha es una estimación, no una fecha límite
              : L(`A tu ritmo terminarías hacia el <b>${fmt(p.eta, { day: 'numeric', month: 'long' })}</b>. Es solo una estimación: lo importante es seguir avanzando, a tu manera.`, `At your pace you'd finish around <b>${fmt(p.eta, { day: 'numeric', month: 'long' })}</b>. It's only an estimate: what matters is to keep going, your way.`))
              : L(`El plan termina el <b>${fmt(p.planEnd, { day: 'numeric', month: 'long' })}</b>. Marca sesiones como hechas y aquí verás tu ritmo.`, `The plan ends on <b>${fmt(p.planEnd, { day: 'numeric', month: 'long' })}</b>. Mark sessions as done to see your pace here.`));
        const hero = win('tk-hero', `${esc(pl.name.slice(0, 40))}.txt`, `
          ${spark('p', 'top:-15px;right:-13px;width:32px')}${spark('g', 'bottom:-13px;left:-11px;width:24px')}
          <h2 class="tk-h">¡${L('Hola', 'Hello')}${name ? ', ' + esc(name) : ''}!<span class="tk-caret"></span></h2>
          <p class="tk-msg">${msg}</p>
          ${late.length ? `<p class="tk-late">🌱 ${L(`${late.length} ${late.length === 1 ? 'sesión espera' : 'sesiones esperan'} su turno. No pasa nada: el plan se adapta a ti, no al revés.`, `${late.length} ${late.length === 1 ? 'session is' : 'sessions are'} waiting. That's fine: the plan adapts to you, not the other way round.`)}
            ${pl.tasks && pl.tasks.length ? `<button class="tk-linkbtn" data-resched>${L('Reacomodar lo pendiente desde hoy', 'Spread what\'s pending from today')} →</button>` : ''}</p>` : ''}
          <div class="tk-row">
            <a class="tk-btn" href="#/plan/${pl.id}" style="--c:var(--t)">${L('Ver calendario', 'See calendar')} ▸▸</a>
            <a class="tk-btn" href="#/test" style="--c:var(--l)">${L('Hacer un test', 'Take a test')} ▸▸</a>
            ${due ? `<a class="tk-btn" href="#/test/repaso" style="--c:var(--p)">${due} ${L('repasos hoy', 'reviews today')} ▸▸</a>` : ''}
          </div>`, 'p');

        // ----- ahora.exe: UNA sola tarea según tu energía (pensado para TDAH: sin horarios rígidos ni pomodoro) -----
        // Solo tareas que ya se pueden hacer (una evaluación espera a que termines de estudiar su tema)
        const ready = s => !s.dep || (S.find(x => x.id === s.dep) || { done: true }).done;
        // los repasos espaciados no se adelantan: su gracia es esperar unos días
        const pend = S.filter(s => !s.done && s.date <= addDays(t, 7) && ready(s) && (s.type !== 'review' || s.date <= t));
        const lastDone = [...done].sort((a, b) => (a.doneOn || a.date).localeCompare(b.doneOn || b.date) || a.start - b.start).at(-1);
        let cands = [...pend];
        const same = s => lastDone && s.item === lastDone.item ? 0 : 1;
        // poca energía: lo más corto (en tramos de 15 min, para que 44 vs 45 min no cuente); a igual duración, mismo tema y lo más antiguo
        if (energy === 'low') cands.sort((a, b) => Math.round(mins(a) / 15) - Math.round(mins(b) / 15) || same(a) - same(b) || a.date.localeCompare(b.date));
        else if (energy === 'mid') cands.sort((a, b) => same(a) - same(b) || a.date.localeCompare(b.date)); // seguir con lo mismo
        // si hay un cronómetro en marcha, esa tarea se queda fija hasta que termines o la sueltes
        const running = run && pend.find(s => s.id === run.id);
        const pick = running || (cands.length ? cands[skip % cands.length] : null);
        const lv = BD.level ? BD.level() : null;
        const ENERGY = [['low', '🪫', L('Poca', 'Low')], ['mid', '🔋', L('Normal', 'Normal')], ['high', '⚡', L('Mucha', 'High')]];
        const TIP = {
          low: L('Con poca energía va lo más corto. Basta con empezar: abre el material y dale 10 minutos. Si te enganchas, genial; si no, igual avanzaste. Si estás inquieto, muévete 2 minutos antes.', 'With low energy, the shortest thing first. Just start: open the material and give it 10 minutes. If you get into it, great; if not, you still made progress. If you feel restless, move around for 2 minutes first.'),
          mid: L('Sigues con lo mismo de la última vez: menos cambios de tema, menos esfuerzo para arrancar.', 'You continue with the same thing as last time: fewer topic switches, less effort to get going.'),
          high: L('Con mucha energía va lo siguiente del plan. Si te enganchas, sigue con otra: adelantar también cuenta.', 'With high energy, the next thing in the plan. If you\'re in the zone, keep going: getting ahead counts too.'),
        };
        const when = s => s.date < t ? L(`esperando desde el ${fmt(s.date)}`, `waiting since ${fmt(s.date)}`) : s.date > t ? L(`adelantar (era para el ${fmt(s.date, { weekday: 'short', day: 'numeric' })})`, `get ahead (planned for ${fmt(s.date, { weekday: 'short', day: 'numeric' })})`) : L('para hoy', 'for today');
        const focus = win('tk-focus', L('ahora.exe · una sola cosa', 'now.exe · just one thing'), `
          <div class="tk-energy ${pick ? '' : 'hidden'}" role="group" aria-label="${L('¿Cuánta energía tienes ahora?', 'How much energy do you have right now?')}">
            <span>${L('¿Energía ahora?', 'Energy right now?')}</span>
            ${ENERGY.map(([v, i, l]) => `<button type="button" data-energy="${v}" class="${v === energy ? 'on' : ''}" aria-pressed="${v === energy}">${i} ${l}</button>`).join('')}
          </div>
          ${pick ? `
            <div class="tk-now" style="--c:var(--${K[pick.type][1]})">
              <small>${K[pick.type][0]} · ≈${mins(pick)} min · ${when(pick)}</small>
              <b>${esc(pick.title)}</b>
              ${pick.detail ? `<span>${esc(pick.detail)}</span>` : ''}
              ${pick.url ? `<a href="${esc(pick.url)}" target="_blank" rel="noopener">${L('abrir el material', 'open the material')} ↗</a>` : ''}
            </div>
            <label class="tk-goal"><span>${L('Mi meta concreta (opcional)', 'My concrete goal (optional)')}</span>
              <input type="text" data-goal="${pick.id}" value="${esc(pick.goal || '')}" maxlength="120" placeholder="${L('ej. leer 5 páginas o hacer 3 ejercicios', 'e.g. read 5 pages or do 3 exercises')}"></label>
            ${running ? `
              <div class="tk-timer" role="timer">
                <b id="tkElapsed">0:00</b><span class="tk-mini"><i id="tkTBar"></i></span>
                <button type="button" class="tk-arrow" data-stop title="${L('Soltar el cronómetro', 'Drop the timer')}" aria-label="${L('Soltar el cronómetro', 'Drop the timer')}">■</button>
                <small>${L(`de ≈${mins(pick)} min · sin alarmas: para cuando quieras`, `of ≈${mins(pick)} min · no alarms: stop whenever you want`)}</small>
              </div>` : `<p class="tk-tip">${TIP[energy]}</p>`}
            <div class="tk-row">
              ${running ? '' : `<button type="button" class="tk-btn" data-start="${pick.id}" style="--c:var(--y)">▶ ${L('Empezar', 'Start')}</button>`}
              <button type="button" class="tk-btn" data-done="${pick.id}" style="--c:var(--g)">✓ ${L('Lo hice', 'Done')}</button>
              ${!running && cands.length > 1 ? `<button type="button" class="tk-btn" data-other style="--c:#fff">↻ ${L('Otra cosa', 'Something else')}</button>` : ''}
              <button type="button" class="tk-btn" data-later="${pick.id}" style="--c:#fff">→ ${L('Hoy no', 'Not today')}</button>
            </div>`
          : `<p class="tk-tip">${pct === 100 ? L('¡Plan terminado! 🎉', 'Plan finished! 🎉') : L('Nada pendiente para estos días. Descansar también es parte del plan 🌿', 'Nothing pending for these days. Resting is part of the plan too 🌿')}</p>`}
          ${lv ? `<a class="tk-xp" href="#/" title="${L('Tu nivel en Inicio', 'Your level on Home')}"><b>LV ${lv.level}</b><span class="tk-mini"><i style="width:${Math.round(lv.xp / lv.need * 100)}%"></i></span><small>${lv.xp}/${lv.need} XP · ${L('cada sesión hecha +5', 'each session done +5')}</small></a>` : ''}`, 'g');

        // ----- stats (sin racha: perderla desanima; cuenta los días que sí estudiaste) -----
        const since30 = addDays(t, -29);
        const days30 = new Set([...ps.flatMap(x => x.sessions).filter(s => s.done).map(s => s.doneOn || s.date), ...pr.results.map(r => r.date)].filter(d => d >= since30 && d <= t)).size;
        const stats = win('tk-stats', 'stats.exe', `<div class="tk-tiles">
          <div class="tk-tile" style="--c:var(--y)"><b>${pct}%</b><span>${L('completado', 'done')}</span></div>
          <div class="tk-tile" style="--c:var(--p)"><b>${days30}</b><span>${L('días con estudio (30 d)', 'study days (30 d)')}</span></div>
          <div class="tk-tile" style="--c:var(--g)"><b>${hours(p.doneMin)}</b><span>${L('estudiadas', 'studied')}</span></div>
          <div class="tk-tile" style="--c:var(--t)"><b>${p.rate ? Math.round(p.rate) : 0}<small>min</small></b><span>${L('al día (ritmo)', 'per day (pace)')}</span></div>
          <div class="tk-tile wide" style="--c:#fff"><b>${next ? fmt(next.date, { weekday: 'long', day: 'numeric' }) : '—'}</b><span>${L('próxima sesión', 'next session')}${next ? ': ' + esc(next.title) : ''}</span></div>
        </div>`, 'p');

        // ----- "storage": horas hechas por tipo -----
        const segs = Object.entries(K).map(([k, [n, c]]) => {
          const m = done.filter(s => s.type === k).reduce((a, s) => a + mins(s), 0);
          return { k, n, c, m, all: S.filter(s => s.type === k).reduce((a, s) => a + mins(s), 0) };
        }).filter(x => x.all);
        const storage = win('tk-store', 'storage', `
          <div class="tk-store-h"><b>${esc(pl.name)}</b><span>${hours(p.doneMin)} ${L('de', 'of')} ${hours(p.totMin)}</span></div>
          <div class="tk-store-bar" role="img" aria-label="${pct}%">${segs.map(x => x.m ? `<i style="width:${x.m / p.totMin * 100}%;background:var(--${x.c})" title="${x.n}: ${hours(x.m)}"></i>` : '').join('')}</div>
          <div class="tk-legend">${segs.map(x => `<span><i style="background:var(--${x.c})"></i>${x.n} <small>${hours(x.m)}/${hours(x.all)}</small></span>`).join('')}</div>`, 'y');

        // ----- terminal -----
        const last = [...done].sort((a, b) => (a.doneOn || a.date).localeCompare(b.doneOn || b.date) || a.start - b.start).slice(-4);
        const term = win('tk-term', 'terminal', `<div class="tk-tty">
          <div>$ cd ~/${esc(pl.name.toLowerCase().replace(/\s+/g, '-').slice(0, 24))}</div>
          ${last.length ? last.map(s => `<div><span class="ok">✔</span> ${K[s.type][0].toLowerCase()} · ${esc(s.title)}${s.detail && s.type === 'study' ? ` <span class="dim">(${esc(s.detail)})</span>` : ''}</div>`).join('')
            : `<div class="dim">${L('# aún no hay sesiones hechas', '# no sessions done yet')}</div>`}
          <div>${pct === 100 ? `<span class="ok">✔</span> ${L('¡plan completado! :)', 'plan complete! :)')}` : next ? `&gt; ${L('próxima', 'next')}: ${fmt(next.date, { weekday: 'short', day: 'numeric' })} · ${esc(next.title)}` : `&gt; ${L('sin sesiones pendientes', 'no pending sessions')}`}</div>
          <div>$ <span class="tk-block"></span></div>
        </div>`, 't');

        // ----- semana -----
        const mon = addDays(t, -((dateOf(t).getDay() + 6) % 7) + week * 7);
        const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
        const wkDone = S.filter(s => days.includes(s.date)), wkPct = wkDone.length ? Math.round(wkDone.filter(s => s.done).length / wkDone.length * 100) : 0;
        const weekW = win('tk-week', `${L('semana', 'week')} ${fmt(days[0])} – ${fmt(days[6])}`, `
          <div class="tk-week-h">
            <button class="tk-arrow" data-wk="-1" aria-label="${L('Semana anterior', 'Previous week')}">◀</button>
            <span class="tk-wk-t">${wkDone.length ? L(`${wkDone.filter(s => s.done).length}/${wkDone.length} sesiones esta semana`, `${wkDone.filter(s => s.done).length}/${wkDone.length} sessions this week`) : L('Sin sesiones esta semana', 'No sessions this week')}</span>
            ${wkDone.length ? meter(wkPct) : ''}
            ${week ? `<button class="tk-arrow sm" data-wk="0">${L('hoy', 'today')}</button>` : ''}
            <button class="tk-arrow" data-wk="1" aria-label="${L('Semana siguiente', 'Next week')}">▶</button>
          </div>
          <div class="tk-days">${days.map(d => {
            const ss = S.filter(s => s.date === d);
            return `<div class="tk-day ${d === t ? 'today' : ''} ${ss.length ? '' : 'tk-empty'} ${ss.length && ss.every(s => s.done) ? 'all' : ''}">
              <div class="tk-day-h"><b>${fmt(d, { weekday: 'short' })}</b><span>${dateOf(d).getDate()}</span>${ss.length && ss.every(s => s.done) ? '<em>✔</em>' : ''}</div>
              <div class="tk-day-l">${ss.length ? ss.map(s => `<label class="tk-ses ${s.done ? 'done' : ''} ${!s.done && d < t ? 'late' : ''}" style="--c:var(--${K[s.type][1]})">
                <input type="checkbox" data-s="${s.id}" ${s.done ? 'checked' : ''} aria-label="${esc(K[s.type][0] + ': ' + s.title)}">
                <span><small>${K[s.type][0]} · ≈${mins(s)} min${!s.done && d < t ? ' · ' + L('pendiente', 'pending') : ''}</small><b>${esc(s.title)}</b></span></label>`).join('') : `<p class="tk-free">${L('libre', 'free')}</p>`}</div>
            </div>`;
          }).join('')}</div>`, 'l');

        // ----- elementos del plan -----
        const items = panel('tk-items', L('ELEMENTOS DEL PLAN', 'PLAN ENTRIES'), pl.items.map((it, i) => {
          const mine = S.filter(s => s.item === i), ip = mine.length ? Math.round(mine.filter(s => s.done).length / mine.length * 100) : 0;
          const ev = mine.find(s => s.type === 'eval');
          // avance en la unidad de cada elemento: páginas (libros), minuto del video (videos) u horas (temas)
          const studies = mine.filter(s => s.type === 'study'), f = studies.length ? studies.filter(s => s.done).length / studies.length : 0;
          const clock = m => { const s = Math.round(m * 60), h = Math.floor(s / 3600); return (h ? h + ':' + String(Math.floor(s / 60) % 60).padStart(2, '0') : Math.floor(s / 60)) + ':' + String(s % 60).padStart(2, '0'); };
          const unit = pl.kind === 'books' && it.pages ? `📖 ${Math.round(it.pages * f)} ${L('de', 'of')} ${it.pages} ${L('págs.', 'pages')}`
            : pl.kind === 'videos' && it.videoMin ? `▶ ${clock(it.videoMin * f)} ${L('de', 'of')} ${clock(it.videoMin)}`
            : `⏱ ${hours(it.minutes * f)} ${L('de', 'of')} ${hours(it.minutes)}`;
          const st = !ev ? '' : ev.done ? `<span class="tk-tag ok">📝 ${L('evaluado', 'assessed')}</span>` : `<span class="tk-tag">📝 ${fmt(ev.date, { weekday: 'short', day: 'numeric' })}</span>`;
          return `<div class="tk-entry"><span class="tk-ec">${CUBE}</span><div class="tk-et">
            <b>${it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.name)} ↗</a>` : esc(it.name)}</b>
            <small>${unit} · ${mine.filter(s => s.done).length}/${mine.length} ${L('sesiones', 'sessions')} ${st}</small></div>
            ${meter(ip)}<span class="tk-pct">${ip}%</span></div>`;
        }).join('') + `<div class="tk-entry more"><a href="#/plan/${pl.id}">${L('Ver plan completo', 'See full plan')} ▸▸</a></div>`);

        root.innerHTML = `${tabs}
          <div class="tk-float" aria-hidden="true"><div class="tk-bar" style="--bar:var(--y)"><span>constant evolution</span></div>
            <div class="tk-float-b"><span class="tk-mini"><i style="width:${pct}%"></i></span><b>${pct}%</b></div></div>
          <div class="tk-grid">
            ${hero}${focus}${stats}${storage}${term}${weekW}${items}
            <div class="tk-col">${scores()}${notesPanel(pl)}</div>
            ${win('tk-act', L('actividad · 15 semanas', 'activity · 15 weeks'), `${heat(ps, pr)}<p class="tk-note">${L('Cada cuadro es un día: sesiones del plan y tests hechos.', 'Each square is a day: plan sessions and tests done.')}</p>`, 'g')}
            <footer class="tk-foot">
              <span>© ${new Date().getFullYear()} BrainDeck · ${L('hecho con cariño y café', 'made with love and coffee')} ☕</span>
              <span class="tk-row">
                <a class="tk-btn sm" href="#/plan" style="--c:var(--g)">${L('planes', 'plans')} ▸▸</a>
                <a class="tk-btn sm" href="#/test" style="--c:var(--l)">tests ▸▸</a>
                <a class="tk-btn sm" href="#/notas-rapidas" style="--c:var(--y)">${L('notas', 'notes')} ▸▸</a>
              </span>
            </footer>
          </div>`;

        function scores() {
          const tops = [...pr.topics].sort((a, b) => b.mastery - a.mastery).slice(0, 5);
          return win('tk-scores', L('dominio · tests', 'mastery · tests'), tops.length ? `
            <div class="tk-mast">${tops.map(x => `<div><span>${esc(x.name)}</span><span class="tk-mb"><i style="width:${x.mastery}%"></i></span><b>${x.mastery}%</b></div>`).join('')}</div>
            <p class="tk-note">${decks.length} ${L('tests guardados', 'saved tests')} · ${pr.results.length} ${L('hechos', 'taken')} · <a href="#/test/repaso">${due} ${L('repasos pendientes', 'reviews due')}</a></p>`
            : `<p class="tk-note">${L('Cuando hagas tests en Libro → Test, aquí verás cuánto dominas cada tema.', 'Once you take tests in Book → Test, you\'ll see how well you know each topic here.')}</p>
               <a class="tk-btn sm" href="#/test" style="--c:var(--l)">${L('Crear un test', 'Create a test')} ▸▸</a>`, 'l');
        }
        function notesPanel(plan) {
          return panel('tk-notes', L('NOTAS DE ESTUDIO', 'STUDY NOTES'), (notes.length ? notes.slice(0, 4).map(n => `
            <button class="tk-entry tk-nlink" data-note="${n.id}"><span class="tk-ec">${CUBE}</span><span class="tk-et"><b>${esc(n.title.trim() || n.text.trim().split('\n')[0].slice(0, 40) || L('Sin título', 'Untitled'))}</b>
              <small>${new Date(n.updated).toLocaleDateString(BD.locale(), { day: 'numeric', month: 'short' })}</small></span></button>`).join('')
            : `<p class="tk-note" style="padding:8px 10px;margin:0">${L('Las notas de la pestaña «Estudio» de Notas rápidas aparecen aquí.', 'Notes in the "Study" tab of Quick notes show up here.')}</p>`) +
            `<div class="tk-entry more"><button class="tk-linkbtn" data-newnote="${plan ? esc(plan.name) : ''}">+ ${L('nueva nota de estudio', 'new study note')}</button></div>`);
        }
      }

      // Frases de ánimo variadas al marcar algo como hecho (pequeña recompensa inmediata)
      const CHEERS = () => L(['¡Hecho! Un paso más 🌟', '¡Bien! Tu yo del futuro te lo agradece ✨', '¡Listo! Eso cuenta, y mucho 💪', '¡Bravo! Un bloque menos 🎉', '¡Genial! Sigue o descansa: tú decides 🌿'],
        ['Done! One more step 🌟', 'Nice! Future you says thanks ✨', 'Done! That counts, a lot 💪', 'Bravo! One block less 🎉', 'Great! Keep going or rest: your call 🌿']);
      const cheer = () => { const c = CHEERS(); toast(c[Math.floor(Math.random() * c.length)] + ' · +5 XP'); };
      // Cambia una sesión de cualquier plan y guarda (lo ven también el plan y el Inicio)
      function editSession(id, fn) {
        const ps = plans(), pl = ps.find(p => p.sessions.some(s => s.id === id)); if (!pl) return;
        const s = pl.sessions.find(x => x.id === id);
        fn(s, pl); store.set('plans', ps);
        return { s, pl };
      }
      function setDone(id, on) {
        const r = editSession(id, s => { s.done = on; s.doneOn = on ? today() : undefined; }); if (!r) return;
        if (on && run && run.id === id) setRun(null);
        if (on && r.pl.sessions.every(x => x.done)) toast(L('¡Plan completado! 🎉', 'Plan completed! 🎉'));
        else if (on) cheer();
        skip = 0; draw();
      }

      root.addEventListener('click', e => {
        const tb = e.target.closest('[data-plan]'), wk = e.target.closest('[data-wk]'), nt = e.target.closest('[data-note]'), nn = e.target.closest('[data-newnote]');
        const eg = e.target.closest('[data-energy]'), dn = e.target.closest('[data-done]'), lt = e.target.closest('[data-later]');
        if (eg) { energy = eg.dataset.energy; store.set('tracker:energy', { date: today(), v: energy }); skip = 0; draw(); }
        else if (dn) setDone(dn.dataset.done, true);
        else if (e.target.closest('[data-start]')) { setRun({ id: e.target.closest('[data-start]').dataset.start, t0: Date.now() }); draw(); tick(); }
        else if (e.target.closest('[data-stop]')) { setRun(null); draw(); }
        else if (e.target.closest('[data-other]')) { skip++; draw(); }
        else if (lt) {
          // "Hoy no": la pasa al día siguiente, sin culpa y sin reorganizar todo el plan
          editSession(lt.dataset.later, s => { s.date = addDays(s.date > today() ? s.date : today(), 1); });
          if (run && run.id === lt.dataset.later) setRun(null);
          toast(L('Movida a mañana. Sin culpa 🌙', 'Moved to tomorrow. No guilt 🌙')); skip = 0; draw();
        }
        else if (e.target.closest('[data-resched]')) {
          const ps = plans(), pl = ps.find(p => p.id === pid) || ps[0];
          if (pl) { BD.progress.reschedule(pl); store.set('plans', ps); toast(L('Listo: lo pendiente quedó repartido desde hoy 📅', 'Done: what was pending is spread from today 📅')); week = 0; draw(); }
        }
        else if (tb) { pid = tb.dataset.plan; store.set('tracker:plan', pid); week = 0; skip = 0; draw(); }
        else if (wk) { week = +wk.dataset.wk ? week + +wk.dataset.wk : 0; draw(); }
        else if (nt) { store.set('qnotes:ui', { tab: 'estudio', id: nt.dataset.note }); location.hash = '#/notas-rapidas'; }
        else if (nn) { BD.qnotes.add({ tab: 'estudio', title: nn.dataset.newnote }); location.hash = '#/notas-rapidas'; }
      });
      root.addEventListener('change', e => {
        const id = e.target.dataset.s; if (id) setDone(id, e.target.checked);
        // la meta concreta se guarda en la sesión (sin redibujar, para no perder el foco)
        const g = e.target.dataset.goal; if (g) editSession(g, s => { s.goal = e.target.value.trim(); });
      });
      draw(); tick();
      return () => clearInterval(iv);
    },
  });
})();
