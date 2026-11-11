'use strict';
/* Inicio: dashboard de ventanas (avatar, nivel, stats tipo RPG, datos, actividad, bolsa de items y data de cada herramienta)
   + todas las herramientas como apps de un dispositivo. */
(() => {
  const { esc, store, toast, L } = BD;
  const K = '#1d1b2b', W = '#ffffff';

  // ---------- items que se desbloquean con el uso ----------
  const ITEMS = [
    { id: 'pencil', name: L('Lápiz', 'Pencil'), req: L('Usa tu primera herramienta', 'Use your first tool'), ok: c => c.total >= 1,
      p: { k: K, p: '#ff8fb1', s: '#c3cad8', y: '#ffd400', o: '#f2a900', t: '#f4c27a' },
      r: ['....kkkk....', '....kppk....', '....kssk....', '....kyok....', '....kyok....', '....kyok....', '....kyok....', '....kyok....', '....kttk....', '.....kk.....', '............', '............'] },
    { id: 'coffee', name: L('Café', 'Coffee'), req: L('Usa herramientas 10 veces', 'Use tools 10 times'), ok: c => c.total >= 10,
      p: { k: K, w: W, s: '#b8c0d0', b: '#8a5a3c', r: '#ff8fb1' },
      r: ['...s..s.....', '..s..s......', '............', '.kkkkkkkkk..', '.kbbbbbbbkkk', '.kwwwwwwwk.k', '.kwwrrwwwk.k', '.kwwwwwwwkkk', '..kwwwwwk...', '...kkkkk....', 'kkkkkkkkkkk.', '............'] },
    { id: 'book', name: L('Libro', 'Book'), req: L('Estudia 3 días', 'Study on 3 days'), ok: c => c.studyDays >= 3,
      p: { k: K, w: W, b: '#2ec27e', y: '#ffe066' },
      r: ['............', '..kkkkkkkk..', '.kbbbbbbbbk.', '.kbyyyyyybk.', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '.kbbyyyybbk.', '.kbbbbbbbbk.', '.kbbbbbbbbk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.', '............'] },
    { id: 'headphones', name: L('Auriculares', 'Headphones'), req: L('Escucha la radio', 'Listen to the radio'), ok: c => c.radioPlays >= 1,
      p: { k: K, p: '#8b6cff', c: '#ff71ce' },
      r: ['............', '...kkkkkk...', '..kppppppk..', '.kpk....kpk.', '.kk......kk.', 'kk........kk', 'kkkk....kkkk', 'kcck....kcck', 'kcck....kcck', 'kcck....kcck', 'kkkk....kkkk', '............'] },
    { id: 'cassette', name: L('Casete', 'Cassette'), req: L('60 minutos de radio', '60 minutes of radio'), ok: c => c.radioMin >= 60,
      p: { k: K, w: W, c: '#ff71ce' },
      r: ['............', '............', 'kkkkkkkkkkkk', 'kcccccccccck', 'kcwwwwwwwwck', 'kcwkkwwkkwck', 'kcwkkwwkkwck', 'kcwwwwwwwwck', 'kcccccccccck', 'kcckkkkkkcck', 'kkkkkkkkkkkk', '............'] },
    { id: 'sticky', name: 'Post-it', req: L('Escribe 5 notas rápidas', 'Write 5 quick notes'), ok: c => c.qnotes >= 5,
      p: { k: K, y: '#ffb8da', o: '#ff8fc4' },
      r: ['............', 'kkkkkkkkkk..', 'kyyyyyyyyk..', 'kykkkkkyyk..', 'kyyyyyyyyk..', 'kykkkkkkyk..', 'kyyyyyyyyk..', 'kykkkyyyyk..', 'kyyyyyykkk..', 'kyyyyyykok..', 'kkkkkkkkk...', '............'] },
    { id: 'potion', name: L('Poción', 'Potion'), req: L('Termina un test', 'Finish a test'), ok: c => c.tests >= 1,
      p: { k: K, w: W, p: '#9b5cff', t: '#f4c27a' },
      r: ['....kkkk....', '....kttk....', '....kwwk....', '....kwwk....', '...kwwwwk...', '..kppppppk..', '.kppwpppppk.', '.kpwppppppk.', '.kppppppppk.', '..kppppppk..', '...kkkkkk...', '............'] },
    { id: 'brush', name: L('Pincel', 'Brush'), req: L('Usa herramientas de arte 5 veces', 'Use art tools 5 times'), ok: c => (c.cat.creativo || 0) >= 5,
      p: { k: K, p: '#ff4d5e', s: '#c3cad8', t: '#2f8cff' },
      r: ['.....kk.....', '....kppk....', '....kppk....', '....kppk....', '....kssk....', '....kssk....', '....kttk....', '....kttk....', '....kttk....', '....kttk....', '.....kk.....', '............'] },
    { id: 'coin', name: L('Moneda', 'Coin'), req: L('Usa herramientas de dinero 3 veces', 'Use money tools 3 times'), ok: c => (c.cat.dinero || 0) >= 3,
      p: { k: K, w: W, y: '#ffd400', o: '#f2a900' },
      r: ['............', '...kkkkkk...', '..kyyyyyyk..', '.kywoooooyk.', '.kwoyyyyoyk.', '.kyoyyyyoyk.', '.kyoyyyyoyk.', '.kyoyyyyoyk.', '.kyooooooyk.', '..kyyyyyyk..', '...kkkkkk...', '............'] },
    { id: 'plant', name: L('Planta', 'Plant'), req: L('Racha de 3 días', '3-day streak'), ok: c => c.streak >= 3,
      p: { k: K, g: '#2ec27e', t: '#e07a4f' },
      r: ['............', '...kk..kk...', '..kggk.kggk.', '..kgggkgggk.', '...kgggggk..', '....kkgkk...', '.....kgk....', '..kkkkkkkk..', '..kttttttk..', '...kttttk...', '...kttttk...', '....kkkk....'] },
    { id: 'flame', name: L('Llama', 'Flame'), req: L('Racha de 7 días', '7-day streak'), ok: c => c.streak >= 7,
      p: { k: K, w: W, o: '#ff7b00', y: '#ffd400' },
      r: ['.....k......', '....kok.....', '....kook....', '...koyok....', '..kooyyok...', '..koyyyyok..', '.koyywyyok..', '.koyywwyyok.', '.koyywwyyok.', '..koyyyyok..', '...kooook...', '....kkkk....'] },
    { id: 'yarn', name: L('Ovillo', 'Yarn'), req: L('Abre BrainDeck 7 días distintos', 'Open BrainDeck on 7 different days'), ok: c => c.daysActive >= 7,
      p: { k: K, w: W, p: '#ff8fc4' },
      r: ['............', '...kkkkkk...', '..kppwpppk..', '.kpwpppwppk.', '.kwppwppwpk.', '.kppwppwppk.', '.kpwppwpppk.', '..kppppwpk..', '...kkkkkk.k.', '..........k.', '.........k..', '............'] },
    { id: 'gem', name: L('Gema', 'Gem'), req: L('Prueba 10 herramientas distintas', 'Try 10 different tools'), ok: c => c.distinct >= 10,
      p: { k: K, w: W, b: '#3ee6ff', d: '#1fa5c4' },
      r: ['............', '...kkkkkk...', '..kbwbbbbk..', '.kbwbbbbbbk.', 'kkkkkkkkkkkk', '.kdbbbbbbdk.', '..kdbbbbdk..', '...kdbbdk...', '....kddk....', '.....kk.....', '............', '............'] },
    { id: 'trophy', name: L('Trofeo', 'Trophy'), req: L('Completa un reto de 30 días', 'Complete a 30-day challenge'), ok: c => c.retoDone >= 1,
      p: { k: K, w: W, y: '#ffd400', t: '#a0663a' },
      r: ['.kkkkkkkkkk.', 'kkyyyyyyyykk', 'kykwyyyyykyk', 'kykyyyyyykyk', '.kkyyyyyykk.', '...kyyyyk...', '....kyyk....', '....kyyk....', '...kkkkkk...', '..kttttttk..', '..kkkkkkkk..', '............'] },
    { id: 'star', name: L('Estrella', 'Star'), req: L('Llega al nivel 5', 'Reach level 5'), ok: c => c.level >= 5,
      p: { k: K, y: '#ffe066' },
      r: ['.....kk.....', '.....kk.....', '....kyyk....', '....kyyk....', 'kkkkyyyykkkk', '.kyyyyyyyyk.', '..kyyyyyyk..', '...kyyyyk...', '..kyykkyyk..', '..kyk..kyk..', '.kyk....kyk.', '.kk......kk.'] },
    { id: 'crown', name: L('Corona', 'Crown'), req: L('Llega al nivel 10', 'Reach level 10'), ok: c => c.level >= 10,
      p: { k: K, y: '#ffd400', r: '#ff4d5e' },
      r: ['............', 'k....kk....k', 'kk..kyyk..kk', 'kyk.kyyk.kyk', 'kyykyyyykyyk', 'kyyyyryyyyyk', 'kyyyrrryyyyk', 'kyyyyryyyyyk', 'kkkkkkkkkkkk', 'kyyyyyyyyyyk', 'kkkkkkkkkkkk', '............'] },
  ];
  const HEART = ['.kk.kk.', 'kppkppk', 'kpppppk', '.kpppk.', '..kpk..', '...k...'];
  const heart = on => BD.pixel(HEART, { k: 'var(--heart-line)', p: on ? '#ff5f9e' : 'var(--heart-empty)' }, 'px heart');

  // ---------- números del dashboard ----------
  function numbers() {
    const s = BD.stats(), pr = BD.progress ? BD.progress.load() : { results: [], mistakes: [] };
    const sum = BD.progress ? BD.progress.summary() : { streak: 0, todayDone: 0, todayTotal: 0, next: null, due: 0 };
    const plans = store.get('plans', []), sessions = plans.flatMap(p => p.sessions || []);
    const done = sessions.filter(x => x.done);
    const study = new Set([...Object.keys(s.sdays), ...pr.results.map(r => r.date), ...done.map(x => x.doneOn || x.date)]);
    const chal = store.get('challenges', []);
    const cat = {};
    Object.entries(s.uses).forEach(([p, n]) => { const t = BD.tools.find(x => x.path === p); const c = t ? (t.cat || 'extra') : 'extra'; cat[c] = (cat[c] || 0) + n; });
    const total = Object.values(s.uses).reduce((a, b) => a + b, 0);
    const c = {
      s, sum, total, cat, distinct: Object.keys(s.uses).length,
      studyDays: study.size, daysActive: Object.keys(s.days).length, streak: sum.streak,
      tests: pr.results.length, plansDone: done.length, qnotes: store.get('qnotes', []).length,
      radioPlays: s.radio.plays || 0, radioMin: s.radio.min || 0,
      retoDays: chal.reduce((a, ch) => a + (ch.done || []).length, 0), retoDone: chal.filter(ch => ch.prompts && ch.done && ch.done.length >= ch.prompts.length).length,
      decisions: store.get('decisions', []).length,
    };
    c.xp = Math.round(total * 2 + c.studyDays * 10 + c.plansDone * 5 + c.tests * 8 + c.retoDays * 5 + c.qnotes * 2 + c.radioMin / 2 + c.decisions * 2);
    // nivel n necesita 60·n XP más que el anterior
    let level = 1, need = 60, rest = c.xp;
    while (rest >= need) { rest -= need; level++; need = 60 * level; }
    Object.assign(c, { level, lvXp: rest, lvNeed: need });
    return c;
  }

  // Data que guarda cada herramienta (además de cuántas veces la abriste)
  const n = (x, one, many) => `${x} ${x === 1 ? one : many}`;
  const arr = k => (store.get(k, []) || []).length;
  const DATA = {
    '/notas': () => n(arr('notes'), L('nota', 'note'), L('notas', 'notes')),
    '/plan': () => { const p = store.get('plans', []), s = p.flatMap(x => x.sessions || []); return `${n(p.length, L('plan', 'plan'), L('planes', 'plans'))} · ${s.filter(x => x.done).length}/${s.length} ${L('sesiones', 'sessions')}`; },
    '/test': () => { const pr = BD.progress.load(); return `${n(arr('decks'), 'test', 'tests')} · ${pr.results.length} ${L('hechos', 'done')} · ${pr.mistakes.length} ${L('en repaso', 'in review')}`; },
    '/reto': () => { const c = store.get('challenges', []); return `${n(c.length, L('reto', 'challenge'), L('retos', 'challenges'))} · ${c.reduce((a, x) => a + (x.done || []).length, 0)} ${L('días hechos', 'days done')}`; },
    '/ingles': () => n(arr('speak:history'), L('grabación', 'recording'), L('grabaciones', 'recordings')),
    '/notas-rapidas': () => n(arr('qnotes'), L('nota', 'note'), L('notas', 'notes')),
    '/radio': () => { const r = BD.stats().radio; return `${n(r.plays || 0, L('reproducción', 'play'), L('reproducciones', 'plays'))} · ${r.min || 0} min`; },
    '/ideas': () => n(arr('ideas:saved'), L('idea guardada', 'saved idea'), L('ideas guardadas', 'saved ideas')),
    '/art-unblock': () => n(arr('unblock:saved'), L('frase guardada', 'saved prompt'), L('frases guardadas', 'saved prompts')),
    '/paletas': () => n(arr('pal:saved'), L('paleta', 'palette'), L('paletas', 'palettes')),
    '/marca-agua': () => n(arr('wm:saved'), L('marca guardada', 'saved watermark'), L('marcas guardadas', 'saved watermarks')),
    '/ahorro': () => n(arr('savings:plans'), L('plan de ahorro', 'savings plan'), L('planes de ahorro', 'savings plans')),
    '/comision': () => store.get('commission:last', null) ? L('Último cálculo guardado', 'Last calculation saved') : L('Sin cálculos aún', 'No calculations yet'),
    '/decisiones': () => n(arr('decisions'), L('decisión', 'decision'), L('decisiones', 'decisions')),
    '/comprimir': () => { const s = store.get('compress:saved', 0); return s ? L(`${BD.fmtBytes(s)} ahorrados`, `${BD.fmtBytes(s)} saved`) : L('Sin compresiones aún', 'No compressions yet'); },
    '/atajos': () => n(arr('shortcuts:fav'), L('atajo favorito', 'favorite shortcut'), L('atajos favoritos', 'favorite shortcuts')),
    '/juegos': () => `${L('Quiz', 'Quiz')} ${store.get('games:quizBest', 0)}/10 · ${L('Países', 'Countries')} ${store.get('games:countriesBest', 0)}/10 · ${arr('games:endings')} ${L('finales', 'endings')}`,
  };
  const ago = ms => {
    if (!ms) return L('nunca', 'never');
    const d = Math.floor((Date.now() - ms) / 864e5);
    return d <= 0 ? L('hoy', 'today') : d === 1 ? L('ayer', 'yesterday') : L(`hace ${d} días`, `${d} days ago`);
  };

  // ---------- avatar y ocupaciones ----------
  const avatarId = () => { const id = (store.get('profile', {}) || {}).avatar; return BD.AVATARS[id] ? id : 'cat'; };
  const avatarSvg = () => BD.AVATARS[avatarId()].svg;
  // Ocupación según la herramienta que más usas (nombres que sirven para cualquier persona)
  const JOBS = {
    '/notas': () => L('Archivista', 'Archivist'), '/plan': () => L('Estratega', 'Strategist'), '/test': () => L('Estudiante', 'Scholar'),
    '/reto': () => L('Atleta de retos', 'Challenge athlete'), '/ingles': () => L('Políglota', 'Polyglot'), '/notas-rapidas': () => L('Escriba', 'Scribe'),
    '/radio': () => 'DJ', '/foco': () => L('Mente zen', 'Zen mind'), '/ideas': () => L('Artista', 'Artist'), '/art-unblock': () => L('Surrealista', 'Surrealist'),
    '/paletas': () => L('Colorista', 'Colorist'), '/gesture': () => L('Dibujante', 'Sketch artist'), '/marca-agua': () => L('Centinela', 'Sentinel'),
    '/quitar-fondo': () => L('Ilusionista', 'Illusionist'), '/convertir': () => L('Alquimista', 'Alchemist'), '/descargar-video': () => L('Videasta', 'Videographer'),
    '/subtitulos': () => L('Intérprete', 'Interpreter'), '/editar-pdf': () => L('Copista', 'Copyist'), '/unir-pdf': () => L('Coleccionista de páginas', 'Page collector'),
    '/qr': () => 'Hacker', '/comision': () => L('Comerciante', 'Merchant'), '/ahorro': () => L('Economista', 'Economist'),
    '/decisiones': () => L('Analista', 'Analyst'), '/juegos': () => 'Gamer',
    '/comprimir': () => L('Minimalista', 'Minimalist'), '/atajos': () => L('Ninja del teclado', 'Keyboard ninja'),
  };

  // ---------- piezas ----------
  const dw = (cls, title, body, extra = '') => `
    <section class="dw ${cls}" ${extra}>
      <div class="dw-bar"><span>${title}</span><i class="dw-dots" aria-hidden="true"><b></b><b></b></i></div>
      <div class="dw-body">${body}</div>
    </section>`;
  const blocks = (v, step) => { const f = Math.min(10, Math.ceil(v / step)); return `<span class="seg10">${Array.from({ length: 10 }, (_, i) => `<i class="${i < f ? 'on' : ''}"></i>`).join('')}</span>`; };
  const fmtNext = nx => nx ? new Date(nx.date + 'T12:00').toLocaleDateString(BD.locale(), { weekday: 'short', day: 'numeric' }) + ' · ' + String(Math.floor(nx.start / 60)).padStart(2, '0') + ':' + String(nx.start % 60).padStart(2, '0') : '—';

  function heatmap(s) {
    // columnas = semanas (lunes arriba); termina en la semana actual
    const weeks = 18, end = new Date(), start = new Date(end);
    start.setDate(end.getDate() - (end.getDay() + 6) % 7 - (weeks - 1) * 7);
    let out = '';
    for (let d = new Date(start), i = 0; i < weeks * 7; i++, d.setDate(d.getDate() + 1)) {
      const k = BD.today(d), v = (s.days[k] || 0) + (s.sdays[k] ? 2 : 0);
      const l = d > end ? -1 : !v ? 0 : v < 3 ? 1 : v < 6 ? 2 : v < 10 ? 3 : 4;
      out += l < 0 ? '<i style="visibility:hidden"></i>' : `<i data-l="${l}" title="${k}: ${s.days[k] || 0}"></i>`;
    }
    return `<div class="heat dash-heat">${out}</div>`;
  }

  function appGrid(main, extra) {
    const app = t => `
      <a class="dev-app" href="${t.external || '#' + t.path}" ${t.external ? `target="_blank" rel="noopener" data-track="${t.path}"` : ''} ${t.radio ? 'data-radio' : ''} title="${esc(t.title)}">
        ${BD.hasAppIcon(t.path) ? BD.appIcon(t.path) : `<span class="app-ic" style="--tile:${t.colors[0]}">${t.icon}</span>`}
        <span class="dev-label">${esc(t.short || t.title)}</span></a>`;
    return main.map(app).join('') + extra.map(app).join('');
  }

  BD.route('/', {
    title: '',
    render(view) {
      const c = numbers(), s = c.s, set = BD.settings();
      // items nuevos → se guardan para siempre (aunque luego pierdas la racha)
      const got = new Set(s.items || []), fresh = ITEMS.filter(it => !got.has(it.id) && it.ok(c));
      if (fresh.length) { fresh.forEach(it => got.add(it.id)); s.items = [...got]; store.set('stats', s); setTimeout(() => toast(L('¡Nuevo item: ', 'New item: ') + fresh.map(i => i.name).join(', ') + '! 🎁'), 500); }

      const lay = BD.layout(), main = lay.flatMap(x => x.tools), extra = BD.tools.filter(t => !t.hidden && t.group === 'extra');
      const top = Object.entries(s.uses).map(([p, v]) => [BD.tools.find(t => t.path === p), v]).filter(([t]) => t).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const maxTop = top.length ? top[0][1] : 1;
      const jobs = top.slice(0, 3);
      const hearts = Array.from({ length: 10 }, (_, i) => heart(i < Math.min(10, c.streak))).join('');
      const name = (set.author || '').trim();

      view.innerHTML = `
        <section class="dash">
          <div class="dash-head">
            <span class="dash-lv">LV.${c.level}</span>
            <span class="dash-title">BRAINDECK.EXE</span>
            <span class="spacer"></span>
            <span class="dash-date" id="dashClock"></span>
          </div>
          <div class="dash-cat-wrap">${BD.CAT || ''}</div>
          <div class="dash-grid">
            ${dw('dw-me', 'ME.EXE', `
              <div class="me">
                <button class="me-av" id="meAv" title="${L('Cambiar avatar', 'Change avatar')}" aria-label="${L('Cambiar avatar', 'Change avatar')}">${avatarSvg()}</button>
                <div class="me-info">
                  <div class="bubble-say">${L('¡Hola', 'Hi')}${name ? ', ' + esc(name) : ''}! ${c.total ? L('¿Qué creamos hoy?', 'What are we making today?') : L('Bienvenido a BrainDeck', 'Welcome to BrainDeck')}</div>
                  <div class="me-lv"><b>LV ${c.level}</b><span class="muted small">${c.lvXp}/${c.lvNeed} XP</span></div>
                  <div class="xp"><i style="width:${Math.round(c.lvXp / c.lvNeed * 100)}%"></i></div>
                  <div class="me-hearts" title="${L('Racha', 'Streak')}: ${c.streak}">${hearts}</div>
                </div>
              </div>
              <div class="av-pick hidden" id="avPick">${Object.entries(BD.AVATARS).map(([id, a]) => `
                <button class="${id === avatarId() ? 'on' : ''}" data-av="${id}" title="${esc(a.name)}" aria-label="${esc(a.name)}">${a.svg}</button>`).join('')}</div>
              <div class="jobs">
                <div class="jobs-h">${L('Ocupaciones', 'Occupations')}</div>
                ${jobs.length ? `<div class="jobs-list">${jobs.map(([t, v], i) => `
                  <a class="job ${i ? '' : 'main'}" href="${t.external || '#' + t.path}" ${t.radio ? 'data-radio' : ''} ${t.external ? `target="_blank" rel="noopener" data-track="${t.path}"` : ''} title="${esc(t.short || t.title)} · ${v} ${L('usos', 'uses')}">
                    ${BD.appIcon(t.path) || ''}<b>${esc(JOBS[t.path] ? JOBS[t.path]() : t.short || t.title)}</b><small>Lv${Math.floor(Math.sqrt(v)) + 1}</small></a>`).join('')}</div>`
                  : `<p class="muted small" style="margin:0">${L('Aún ninguna: usa herramientas y aquí aparecerá en qué te estás convirtiendo.', 'None yet: use tools and you\'ll see here what you\'re becoming.')}</p>`}
              </div>`)}
            ${dw('dw-stats', 'STATS', `
              <div class="rpg">
                ${[['FOC', L('Estudio', 'Study'), (c.cat.estudio || 0) + c.studyDays * 2, 5],
                  ['ART', L('Arte', 'Art'), c.cat.creativo || 0, 4],
                  ['UTL', L('Utilidades', 'Utilities'), c.cat.media || 0, 4],
                  ['ORO', L('Dinero', 'Money'), c.cat.dinero || 0, 3],
                  ['ZEN', L('Minutos de radio', 'Radio minutes'), c.radioMin, 30],
                  ['CON', L('Días activos', 'Active days'), c.daysActive, 3]].map(([k, tip, v, st]) => `
                  <div class="rpg-row" data-tip="${tip}: ${v}"><b>${k}</b>${blocks(v, st)}<span>${v}</span></div>`).join('')}
              </div>
              <p class="dash-tip">${BD.icon('download')}<span>${L('Tu progreso, nivel e items se guardan en este navegador. Puedes exportarlos e importarlos en',
                'Your progress, level and items are stored in this browser. You can export and import them in')} <a href="#/ajustes">${L('Ajustes', 'Settings')} →</a></span></p>`)}
            ${dw('dw-data', 'DATA', `
              <div class="tiles">
                <div class="tile"><b>${c.streak}</b><span>${L('días de racha', 'day streak')}</span></div>
                <div class="tile"><b>${c.studyDays}</b><span>${L('días de estudio', 'study days')}</span></div>
                <a class="tile" href="#/plan"><b>${c.sum.todayDone}<small>/${c.sum.todayTotal}</small></b><span>${L('sesiones hoy', 'sessions today')}</span></a>
                <a class="tile" href="#/test/repaso"><b>${c.sum.due}</b><span>${L('repasos pendientes', 'reviews due')}</span></a>
                <a class="tile wide" href="#/plan"><b>${fmtNext(c.sum.next)}</b><span>${L('próxima sesión', 'next session')}</span></a>
                <div class="tile wide"><b>${c.total}</b><span>${L('usos en total', 'total uses')} · ${c.distinct} ${L('apps distintas', 'different apps')}</span></div>
              </div>`)}
            ${dw('dw-bag', `ITEM BAG <small>${got.size}/${ITEMS.length}</small>`, `
              <div class="bag">${ITEMS.map(it => got.has(it.id)
                ? `<div class="bag-slot on ${fresh.includes(it) ? 'new' : ''}" data-tip="${esc(it.name)} — ${esc(it.req)}">${BD.pixel(it.r, it.p)}</div>`
                : `<div class="bag-slot" data-tip="??? — ${esc(it.req)}">${BD.pixel(it.r, Object.fromEntries(Object.keys(it.p).map(k => [k, 'var(--lock)'])))}<em>?</em></div>`).join('')}</div>`)}
            ${dw('dw-act', L('ACTIVIDAD', 'ACTIVITY'), `${heatmap(s)}
              <p class="muted small dash-note">${L('Cada cuadro es un día. Más color = más uso (estudiar cuenta doble).', 'Each square is a day. More color = more use (studying counts double).')}</p>`)}
            ${dw('dw-top', 'TOP APPS', top.length ? `<div class="top-apps">${top.map(([t, v]) => `
              <a class="top-row" href="${t.external || '#' + t.path}" ${t.radio ? 'data-radio' : ''} ${t.external ? `target="_blank" rel="noopener" data-track="${t.path}"` : ''}>${BD.appIcon(t.path, 'sm') || ''}<span class="t">${esc(t.short || t.title)}</span>
                <span class="top-bar"><i style="width:${Math.max(6, Math.round(v / maxTop * 100))}%"></i></span><b>${v}</b></a>`).join('')}</div>`
              : `<p class="muted small">${L('Abre cualquier herramienta y aparecerá aquí.', 'Open any tool and it will show up here.')}</p>`)}
            ${dw('dw-apps', L('DATA · HERRAMIENTAS', 'DATA · TOOLS'), `
              <div class="tool-data">${[...main, ...extra].map(t => `
                <a class="td-row" href="${t.external || '#' + t.path}" ${t.radio ? 'data-radio' : ''} ${t.external ? `target="_blank" rel="noopener" data-track="${t.path}"` : ''}>
                  ${BD.appIcon(t.path, 'sm') || ''}
                  <span class="t"><b>${esc(t.short || t.title)}</b><small>${DATA[t.path] ? esc(DATA[t.path]()) + ' · ' : ''}${L('abierta', 'opened')} ${ago(s.last[t.path])}</small></span>
                  <span class="td-n">${s.uses[t.path] || 0}<small>${L('usos', 'uses')}</small></span></a>`).join('')}</div>`)}
          </div>
        </section>

        <section class="device" aria-label="${L('Herramientas', 'Tools')}">
          <div class="dev-screen">
            <div class="dev-status"><span id="devTime"></span><b>BrainDeck OS</b><span class="dev-power"><span id="battPct">100%</span><span class="dev-batt" id="batt"><i style="width:100%"></i></span></span></div>
            <div class="dev-grid">${appGrid(main, extra)}</div>
            <div class="dev-dock">
              <a class="dev-app" href="#/herramientas">${BD.appIcon('/herramientas')}<span class="dev-label">${L('Todas', 'All')}</span></a>
              <a class="dev-app" href="#/ajustes">${BD.appIcon('/ajustes')}<span class="dev-label">${L('Ajustes', 'Settings')}</span></a>
            </div>
          </div>
        </section>`;

      const clock = () => {
        const d = new Date(), el = document.getElementById('dashClock'), t = document.getElementById('devTime');
        if (el) el.textContent = d.toLocaleDateString(BD.locale(), { weekday: 'long', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString(BD.locale(), { hour: '2-digit', minute: '2-digit' });
        if (t) t.textContent = d.toLocaleTimeString(BD.locale(), { hour: '2-digit', minute: '2-digit' });
      };
      // clic en el avatar → elegir otro
      const pick = view.querySelector('#avPick'), av = view.querySelector('#meAv');
      av.onclick = () => pick.classList.toggle('hidden');
      pick.onclick = e => {
        const b = e.target.closest('[data-av]'); if (!b) return;
        store.set('profile', { ...(store.get('profile', {}) || {}), avatar: b.dataset.av });
        av.innerHTML = avatarSvg();
        pick.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        pick.classList.add('hidden');
      };

      clock(); const id = setInterval(clock, 20000);

      // Batería real del dispositivo (Chrome/Edge). Un PC de escritorio informa 100 % enchufado;
      // si el navegador no da el dato (Firefox, Safari) también se muestra 100 %.
      let bat = null;
      const showBatt = () => {
        const pct = bat ? Math.round(bat.level * 100) : 100, charging = !bat || bat.charging;
        const t = document.getElementById('battPct'), b = document.getElementById('batt'); if (!t || !b) return;
        t.textContent = (charging && bat && pct < 100 ? '⚡' : '') + pct + '%';
        b.firstElementChild.style.width = pct + '%';
        b.classList.toggle('low', pct <= 20 && !charging);
        b.title = bat ? (charging ? L('Cargando', 'Charging') : L('Con batería', 'On battery')) : L('Sin datos de batería', 'No battery data');
      };
      showBatt();
      if (navigator.getBattery) navigator.getBattery().then(b => {
        bat = b; showBatt();
        ['levelchange', 'chargingchange'].forEach(ev => b.addEventListener(ev, showBatt));
      }).catch(() => {});
      return () => {
        clearInterval(id);
        if (bat) ['levelchange', 'chargingchange'].forEach(ev => bat.removeEventListener(ev, showBatt));
      };
    },
  });
})();
