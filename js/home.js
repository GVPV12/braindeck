'use strict';
/* Inicio, Ajustes y Decision Log */
(() => {
  const { $, $$, esc, store, settings, saveSettings, win, toast, download, L } = BD;

  // Imágenes del banner de inicio: img/hero/<archivo>.webp (fotos de Unsplash)
  const HERO = [
    ['rohit-choudhari-RtGTb1yxThw-unsplash', 'Rohit Choudhari', 'Flor de cristal violeta brillando'],
    ['warren-hansen-uCMNeSNS54U-unsplash', 'Warren Hansen', 'Habitación isométrica con escritorio y plantas'],
    ['willow-xk-89JrtpI9VqI-unsplash', 'Willow XK', 'Cristal iridiscente en forma de cono'],
    ['max-zhdanov-153Z8IMw9sM-unsplash', 'Max Zhdanov', 'Arcos rosas con figuras geométricas flotando'],
    ['li-zhang-pWGhklLD6VA-unsplash', 'Li Zhang', 'Estudio blanco con cuadros colgantes'],
    ['christian-boragine--IsrTbUqJv4-unsplash', 'Christian Boragine', 'Anillo de discos de cristal iridiscente'],
    ['willow-xk-nl-1AVWC1RE-unsplash', 'Willow XK', 'Esfera de cristal iridiscente con burbujas'],
    ['yue-ma-KtEx7LYscXM-unsplash', 'Yue Ma', 'Pétalos de cristal en rosa y azul'],
    ['alissa-kennedy-2uXqQjXBXzA-unsplash', 'Alissa Kennedy', 'Margarita con pétalos arcoíris'],
  ];
  const CAT = `<svg class="hero-cat" viewBox="0 0 120 66" aria-hidden="true">
    <path d="M12 66 C12 34 20 22 30 17 L25 0 L47 12 C55 9.5 65 9.5 73 12 L95 0 L90 17 C100 22 108 34 108 66 Z" fill="#141414"/>
    <g class="eyes"><circle cx="44" cy="42" r="9.5" fill="#f3ecd2"/><circle cx="76" cy="42" r="9.5" fill="#f3ecd2"/>
    <circle cx="44" cy="43" r="6.5" fill="#141414"/><circle cx="76" cy="43" r="6.5" fill="#141414"/>
    <circle cx="46.5" cy="40" r="2" fill="#fff"/><circle cx="78.5" cy="40" r="2" fill="#fff"/></g></svg>`;

  BD.route('/', {
    title: '',
    render(view) {
      const p = BD.progress ? BD.progress.summary() : null;
      const card = t => `
        <a class="tool-card" href="${t.external || '#' + t.path}" ${t.external ? 'target="_blank" rel="noopener"' : ''} style="--c1:${t.colors[0]};--c2:${t.colors[1]}">
          <span class="go">→</span>
          <div class="orb"><span>${t.icon}</span></div>
          <h3>${esc(t.title)}</h3>
          <p>${esc(t.desc)}</p>
        </a>`;
      const main = BD.tools.filter(t => !t.hidden && t.group !== 'extra');
      const extra = BD.tools.filter(t => !t.hidden && t.group === 'extra');
      view.innerHTML = `
        <section class="hero">
          <div class="hero-banner-wrap">
            ${CAT}
            <div class="hero-banner" id="heroBanner">
              <img id="heroImg" alt="" decoding="async">
              <span class="hero-credit" id="heroCredit"></span>
            </div>
          </div>
          <h1>${L('Bienvenido a BrainDeck', 'Welcome to BrainDeck')}</h1>
          <p>${L('BrainDeck es tu mesa de trabajo para crear y aprender: calcula comisiones, protege tus imágenes, convierte capturas en notas, planifica lo que estudias y ahorra con un plan. Todo corre en tu navegador.',
            'BrainDeck is your desk for creating and learning: work out commissions, protect your images, turn screenshots into notes, plan what you study and save with a plan. Everything runs in your browser.')}</p>
          ${p ? `<div class="grid g4 hero-stats">
            <div class="card stat" data-tip="${L('Días seguidos en los que marcaste una sesión de tu plan de estudios o terminaste un test.', 'Days in a row in which you ticked a study-plan session or finished a test.')}"><b>${p.streak}🔥</b><span>${L('días de racha', 'day streak')}</span></div>
            <a class="card stat" href="#/plan" style="text-decoration:none;color:inherit" data-tip="${L('Sesiones de tus planes de estudio programadas para hoy, y cuántas ya marcaste como hechas.', 'Study-plan sessions scheduled for today, and how many you already ticked as done.')}"><b>${p.todayDone}<small class="muted">/${p.todayTotal}</small></b><span>${L('sesiones hoy', 'sessions today')}</span></a>
            <a class="card stat" href="#/plan" style="text-decoration:none;color:inherit" data-tip="${L('La siguiente sesión sin marcar de cualquiera de tus planes de estudio.', 'The next unticked session from any of your study plans.')}"><b>${p.next ? new Date(p.next.date + 'T12:00').toLocaleDateString(BD.locale(), { weekday: 'short', day: 'numeric' }) + ' · ' + String(Math.floor(p.next.start / 60)).padStart(2, '0') + ':' + String(p.next.start % 60).padStart(2, '0') : '—'}</b><span>${L('próxima sesión', 'next session')}</span></a>
            <a class="card stat" href="#/test/repaso" style="text-decoration:none;color:inherit" data-tip="${L('Preguntas que fallaste en Libro a test y que ya toca repasar (vuelven a los 1, 3, 7, 14 y 30 días).', 'Questions you missed in Book to test that are due for review (they come back after 1, 3, 7, 14 and 30 days).')}"><b>${p.due}</b><span>${L('repasos pendientes', 'reviews due')}</span></a>
          </div>` : ''}
        </section>
        <div class="section-title"><h2>${L('Herramientas', 'Tools')}</h2><span class="muted small">${main.length} apps</span><span class="spacer"></span>
          <button class="btn ghost sm" id="orgReset" hidden>${L('Restablecer orden', 'Reset order')}</button>
          <button class="btn ghost sm" id="orgToggle">↕ ${L('Ordenar', 'Arrange')}</button></div>
        <p class="muted small hidden" id="orgHelp">${L('Arrastra las tarjetas para reordenarlas o pasarlas a otra categoría (en el móvil usa ◀ ▶ y el selector). Las categorías se mueven con ↑ ↓. Se guarda solo.',
          'Drag cards to reorder them or move them to another category (on mobile use ◀ ▶ and the selector). Move categories with ↑ ↓. It saves automatically.')}</p>
        <div id="homeTools"></div>
        <div class="section-title"><h2>Más cosas</h2><span class="muted small">silly games & registro</span></div>
        <div class="tool-grid">${extra.map(card).join('')}</div>`;

      // Herramientas por categoría, en el orden que elija la persona
      let organizing = false, dragged = null;
      const box = $('#homeTools', view);
      function paintTools() {
        const lay = BD.layout();
        box.classList.toggle('organizing', organizing);
        box.innerHTML = lay.map((c, ci) => (c.tools.length || organizing) ? `
          <div class="cat-block" data-cat="${c.id}">
            <div class="cat-title"><h3>${esc(c.name)}</h3>${organizing ? `
              <button class="icon-btn" data-cmove="${ci}:-1" ${ci ? '' : 'disabled'} title="${L('Subir categoría', 'Move category up')}">↑</button>
              <button class="icon-btn" data-cmove="${ci}:1" ${ci < lay.length - 1 ? '' : 'disabled'} title="${L('Bajar categoría', 'Move category down')}">↓</button>` : ''}</div>
            <div class="tool-grid" data-drop="${c.id}">${c.tools.map((t, ti) => organizing ? `
              <div class="tool-card org" draggable="true" data-path="${t.path}" style="--c1:${t.colors[0]};--c2:${t.colors[1]}">
                <div class="orb"><span>${t.icon}</span></div><h3>${esc(t.title)}</h3>
                <div class="org-ctl">
                  <button class="icon-btn" data-tmove="${t.path}:-1" ${ti ? '' : 'disabled'}>◀</button>
                  <select data-tcat="${t.path}">${lay.map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
                  <button class="icon-btn" data-tmove="${t.path}:1" ${ti < c.tools.length - 1 ? '' : 'disabled'}>▶</button>
                </div></div>` : card(t)).join('') || `<p class="muted small">${L('Suelta aquí una herramienta', 'Drop a tool here')}</p>`}</div>
          </div>` : '').join('');
      }
      // mueve una herramienta a la categoría `to`, antes de `before` (o al final)
      function move(path, to, before) {
        const lay = BD.layout(), from = lay.find(c => c.tools.some(t => t.path === path)), t = from.tools.find(t => t.path === path);
        from.tools = from.tools.filter(x => x !== t);
        const dest = lay.find(c => c.id === to), i = before ? dest.tools.findIndex(x => x.path === before) : -1;
        dest.tools.splice(i < 0 ? dest.tools.length : i, 0, t);
        BD.saveLayout(lay); paintTools();
      }
      $('#orgToggle', view).onclick = e => {
        organizing = !organizing;
        e.currentTarget.innerHTML = organizing ? '✓ ' + L('Listo', 'Done') : '↕ ' + L('Ordenar', 'Arrange');
        $('#orgHelp', view).classList.toggle('hidden', !organizing);
        $('#orgReset', view).hidden = !organizing;
        paintTools();
      };
      $('#orgReset', view).onclick = () => { store.del('layout'); BD.buildNav(); paintTools(); toast(L('Orden por defecto', 'Default order')); };
      box.onclick = e => {
        const cm = e.target.closest('[data-cmove]'), tm = e.target.closest('[data-tmove]');
        if (cm) { const [i, d] = cm.dataset.cmove.split(':').map(Number), lay = BD.layout(); [lay[i], lay[i + d]] = [lay[i + d], lay[i]]; BD.saveLayout(lay); paintTools(); }
        if (tm) {
          const [path, d] = tm.dataset.tmove.split(':'), lay = BD.layout(), c = lay.find(c => c.tools.some(t => t.path === path));
          const i = c.tools.findIndex(t => t.path === path), j = i + +d;
          [c.tools[i], c.tools[j]] = [c.tools[j], c.tools[i]]; BD.saveLayout(lay); paintTools();
        }
      };
      box.onchange = e => { const s = e.target.closest('[data-tcat]'); if (s) move(s.dataset.tcat, s.value); };
      box.ondragstart = e => { const c = e.target.closest('.org'); if (!c) return; dragged = c.dataset.path; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragged); };
      box.ondragend = () => { dragged = null; box.querySelectorAll('.dragging,.drop-on').forEach(x => x.classList.remove('dragging', 'drop-on')); };
      box.ondragover = e => {
        const g = e.target.closest('[data-drop]'); if (!dragged || !g) return;
        e.preventDefault();
        box.querySelectorAll('.drop-on').forEach(x => x.classList.remove('drop-on'));
        (e.target.closest('.org') || g).classList.add('drop-on');
      };
      box.ondrop = e => {
        const g = e.target.closest('[data-drop]'); if (!dragged || !g) return;
        e.preventDefault();
        const over = e.target.closest('.org');
        if (over && over.dataset.path === dragged) return;
        // si sueltas sobre la mitad derecha de una tarjeta, va después de ella
        let before = over ? over.dataset.path : null;
        if (over) { const r = over.getBoundingClientRect(); if (e.clientX > r.left + r.width / 2) before = over.nextElementSibling?.dataset.path || null; }
        move(dragged, g.dataset.drop, before === dragged ? null : before);
      };
      paintTools();

      // Banner: una imagen al azar en cada visita, distinta de la anterior
      const img = $('#heroImg', view), banner = $('#heroBanner', view);
      const last = store.get('hero:last', -1);
      let i = Math.floor(Math.random() * (last >= 0 ? HERO.length - 1 : HERO.length));
      if (last >= 0 && i >= last) i++;
      store.set('hero:last', i);
      const [file, author, alt] = HERO[i];
      img.classList.add('fading');
      img.onload = () => img.classList.remove('fading');
      img.onerror = () => banner.classList.add('missing');
      img.src = `img/hero/${file}.webp`; img.alt = alt;
      $('#heroCredit', view).textContent = `${L('Foto', 'Photo')}: ${author} / Unsplash`;
    },
  });

  BD.tool({
    path: '/decisiones', title: 'Decision Log', short: 'Decision Log', icon: BD.icon('notebook'), group: 'extra',
    colors: ['#d6f25a', '#8fbf00'], desc: 'Historial de cálculos de comisión, planes de ahorro y conversiones guardadas como decisiones.',
    render(view) {
      const body = win(view, { title: 'Decision Log', sub: 'Cada cálculo que guardas queda como una decisión documentada: qué, cuándo y con qué números.' });
      const draw = () => {
        const all = store.get('decisions', []);
        const types = [...new Set(all.map(d => d.type))];
        body.innerHTML = all.length ? `
          <div class="row" style="margin-bottom:14px">
            <select id="dlType" style="max-width:220px"><option value="">Todos los tipos</option>${types.map(t => `<option>${esc(t)}</option>`).join('')}</select>
            <span class="spacer"></span>
            <button class="btn ghost sm" id="dlExport">Exportar JSON</button>
          </div>
          <div class="stack" id="dlList"></div>` :
          `<div class="empty"><span class="big">📒</span>Aún no hay decisiones. Guarda un cálculo desde la calculadora de comisión o el plan de ahorro.</div>`;
        if (!all.length) return;
        const list = $('#dlList', body);
        const paint = () => {
          const f = $('#dlType', body).value;
          list.innerHTML = all.filter(d => !f || d.type === f).map(d => `
            <div class="card">
              <div class="row"><span class="chip">${esc(d.type)}</span><b>${esc(d.title)}</b><span class="spacer"></span>
                <span class="muted small">${new Date(d.at).toLocaleString(BD.locale())}</span>
                <button class="icon-btn" data-del="${d.id}" title="Borrar">🗑</button></div>
              ${d.data && d.data.note ? `<p class="muted small" style="margin:8px 0 0">${esc(d.data.note)}</p>` : ''}
              ${d.data && d.data.lines ? `<div class="lines" style="margin-top:10px">${d.data.lines.map(([a, b]) => `<div class="line"><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div>` : ''}
            </div>`).join('');
        };
        $('#dlType', body).onchange = paint;
        $('#dlExport', body).onclick = () => download(new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' }), 'braindeck-decisiones.json');
        list.onclick = e => {
          const id = e.target.closest('[data-del]')?.dataset.del; if (!id) return;
          store.set('decisions', store.get('decisions', []).filter(d => d.id !== id)); draw();
        };
        paint();
      };
      draw();
    },
  });

  BD.route('/ajustes', {
    title: 'Ajustes',
    render(view) {
      const body = win(view, { title: L('Ajustes', 'Settings'), sub: L('Idioma, estilo visual, tu firma de autor y la IA opcional. Todo se guarda solo y se recuerda la próxima vez.', 'Language, visual style, your author signature and optional AI. Everything is saved automatically and remembered next time.') });
      const s = settings();
      body.innerHTML = `
        <h3>${L('Idioma', 'Language')}</h3>
        <div id="sLang"></div>
        <hr class="sep">
        <h3>${L('Estilo', 'Style')}</h3>
        <p class="muted small">${L('El estilo que elijas se guarda en este navegador y se abre así la próxima vez.', 'The style you pick is saved in this browser and opens that way next time.')}</p>
        <div class="theme-pick" id="themes">
          ${[['neo', L('Neo pixel (predeterminado)', 'Neo pixel (default)'), L('Neobrutalista, bordes gruesos, píxel', 'Neobrutalist, thick borders, pixel')], ['cosmos', 'Cosmos', L('Glass oscuro, orbes y brillo neón', 'Dark glass, orbs and neon glow')], ['frost', 'Frost', L('Foto desenfocada, minimal, tipografía bold', 'Blurred photo, minimal, bold type')]].map(([id, n, d]) => `
            <button class="theme-opt ${s.theme === id ? 'on' : ''}" data-t="${id}">
              <div class="prev ${id}"></div><span class="t">${n}</span><span class="muted small" style="padding:0 6px">${d}</span>
            </button>`).join('')}
        </div>
        <hr class="sep">
        <div class="grid g2">
          <label class="field"><span>${L('Tu nombre de autor/a (marca de agua y metadatos)', 'Your author name (watermark and metadata)')}</span><input type="text" id="sAuthor" value="${esc(s.author)}" placeholder="${L('Ej.', 'E.g.')} GVPV"></label>
          <label class="field"><span>${L('Moneda por defecto', 'Default currency')}</span>
            <select id="sCur">${['USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'VES', 'GBP', 'BRL'].map(c => `<option ${c === s.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        </div>
        <hr class="sep">
        <h3>${L('IA local (gratis, sin API key)', 'Local AI (free, no API key)')}</h3>
        <p class="muted small">${L(
          'Corre dentro de tu navegador: nada sale de tu PC. Usa Gemini Nano si tu Chrome lo trae; si no, descarga una sola vez un modelo abierto de ~1 GB (Qwen 2.5) que funciona con WebGPU (Chrome/Edge recientes). Es más lenta y menos lista que Claude, pero limpia y resume bien textos cortos.',
          'Runs inside your browser: nothing leaves your PC. Uses Gemini Nano if your Chrome ships it; otherwise downloads an open ~1 GB model (Qwen 2.5) once, running on WebGPU (recent Chrome/Edge). Slower and less smart than Claude, but it cleans and summarizes short texts well.')}</p>
        <div class="row"><button class="btn ghost" id="sLocal">${L('Comprobar / preparar IA local', 'Check / set up local AI')}</button><span class="muted small" id="sLocalSt"></span></div>
        <hr class="sep">
        <h3>${L('Claude (opcional, con API key)', 'Claude (optional, with API key)')}</h3>
        <p class="muted small">${L(
          'Con una API key de Anthropic, las notas, resúmenes y tests salen mucho mejor. La key se guarda solo en este navegador y se envía únicamente a api.anthropic.com. No la uses en un ordenador compartido.',
          'With an Anthropic API key, notes, summaries and tests come out much better. The key is stored only in this browser and sent only to api.anthropic.com. Don\'t use it on a shared computer.')}</p>
        <div class="grid g2">
          <label class="field"><span>API key</span><input type="password" id="sKey" value="${esc(s.apiKey)}" placeholder="sk-ant-…" autocomplete="off"></label>
          <label class="field"><span>${L('Modelo', 'Model')}</span>
            <select id="sModel">${[['claude-sonnet-5-5', L('Sonnet 5.5 (recomendado)', 'Sonnet 5.5 (recommended)')], ['claude-haiku-5-5', L('Haiku 5.5 (rápido y barato)', 'Haiku 5.5 (fast and cheap)')], ['claude-opus-5-5', L('Opus 5.5 (máxima calidad)', 'Opus 5.5 (top quality)')]].map(([v, l]) => `<option value="${v}" ${v === s.model ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <div class="row" style="margin-top:14px"><button class="btn primary" id="sSave">${L('Guardar ajustes', 'Save settings')}</button><button class="btn ghost" id="sTest">${L('Probar IA', 'Test AI')}</button></div>
        <hr class="sep">
        <h3>${L('Importar y exportar datos', 'Import & export data')}</h3>
        <p class="muted small">${L('Todo se guarda solo en este navegador. Exporta una copia de seguridad o para pasarla a otro dispositivo o navegador, e impórtala allí. La API key nunca se exporta.',
          'Everything is stored only in this browser. Export a backup, or to move it to another device or browser, and import it there. The API key is never exported.')}</p>
        <div class="card stack">
          <div class="row"><b style="flex:1">${L('¿Qué quieres exportar?', 'What do you want to export?')}</b>
            <button class="btn ghost sm" data-gall="1">${L('Todo', 'All')}</button><button class="btn ghost sm" data-gall="0">${L('Nada', 'None')}</button></div>
          <div class="data-groups" id="sGroups"></div>
          <div class="row">
            <button class="btn primary" id="sExport">⬇ ${L('Exportar copia', 'Export backup')}</button>
            <label class="btn ghost">⬆ ${L('Importar copia', 'Import backup')}<input type="file" id="sImport" accept=".json,application/json" hidden></label>
            <span class="spacer"></span>
            <button class="btn ghost danger" id="sReset">${L('Borrar todo', 'Delete everything')}</button>
          </div>
        </div>
        <div class="card stack hidden" id="sImpBox" style="margin-top:14px">
          <b id="sImpTitle"></b>
          <div class="data-groups" id="sImpGroups"></div>
          <div class="field"><span>${L('¿Cómo importar?', 'How to import?')}</span><div id="sImpMode"></div>
            <span class="muted small" id="sImpHelp"></span></div>
          <div class="row"><button class="btn primary" id="sImpGo">${L('Importar seleccionados', 'Import selected')}</button><button class="btn ghost" id="sImpCancel">${L('Cancelar', 'Cancel')}</button></div>
        </div>
        <hr class="sep">
        <div class="row"><a class="btn ghost" href="https://grevaleart.com/" target="_blank" rel="noopener">${L('Mi portafolio', 'My portfolio')} ↗</a><a class="btn ghost" href="#/findme">${L('Estoy en', 'Find me on')} →</a></div>`;

      BD.seg($('#sLang', body), [['es', '🇪🇸 Español'], ['en', '🇬🇧 English']], BD.lang(), v => BD.setLang(v));
      $('#themes', body).onclick = e => {
        const b = e.target.closest('[data-t]'); if (!b) return;
        BD.setTheme(b.dataset.t);
        $$('.theme-opt', body).forEach(x => x.classList.toggle('on', x === b));
      };
      const collect = () => ({
        author: $('#sAuthor', body).value.trim(), currency: $('#sCur', body).value,
        apiKey: $('#sKey', body).value.trim(), model: $('#sModel', body).value,
      });
      // Los campos se guardan solos al cambiar (el botón queda como confirmación)
      body.addEventListener('change', e => { if (e.target.closest('.grid')) saveSettings(collect()); });
      $('#sSave', body).onclick = () => { saveSettings(collect()); toast(L('Ajustes guardados ✨', 'Settings saved ✨')); };
      $('#sTest', body).onclick = async e => {
        saveSettings(collect());
        const b = e.currentTarget; b.disabled = true; b.innerHTML = `<span class="spin"></span> ${L('Probando', 'Testing')}`;
        try { const r = await BD.ai(L('Responde solo: "¡Hola desde BrainDeck!"', 'Reply only: "Hello from BrainDeck!"'), { max: 30 }); toast(r.trim()); }
        catch (err) { toast(err.message, 'bad'); }
        b.disabled = false; b.textContent = L('Probar IA', 'Test AI');
      };
      $('#sLocal', body).onclick = async e => {
        const b = e.currentTarget, st = $('#sLocalSt', body);
        const kind = await BD.localAI.kind();
        if (!kind) { st.textContent = L('✕ No disponible en este navegador. Prueba Chrome o Edge actualizados.', '✕ Not available in this browser. Try an up-to-date Chrome or Edge.'); return; }
        b.disabled = true;
        try {
          st.textContent = kind === 'chrome' ? 'Gemini Nano…' : 'WebLLM (Qwen 2.5)…';
          const r = await BD.localAI.chat(L('Respondes en una frase corta.', 'You reply in one short sentence.'), L('Saluda a quien usa BrainDeck.', 'Greet the BrainDeck user.'),
            { onProgress: (p, msg) => st.textContent = `${msg} ${Math.round(p * 100)}%` });
          st.textContent = '✓ ' + (kind === 'chrome' ? 'Gemini Nano' : 'Qwen 2.5') + ': ' + r.trim().slice(0, 120);
        } catch (err) { st.textContent = '✕ ' + err.message; }
        b.disabled = false;
      };
      // ---------- importar / exportar por grupos ----------
      // Cada grupo agrupa claves de almacenamiento (exactas o por prefijo "x:")
      const GROUPS = [
        ['notes', L('Notas de capturas', 'Screenshot notes'), ['notes', 'notes:']],
        ['plans', L('Planes de estudio', 'Study plans'), ['plans', 'plan:']],
        ['tests', L('Tests y repasos', 'Tests & reviews'), ['decks', 'progress', 'study:']],
        ['retos', L('Retos de 30 días', '30-day challenges'), ['challenges', 'reto:']],
        ['english', L('Coach de inglés', 'English coach'), ['speak:']],
        ['creative', L('Ideas, frases, paletas y gesture', 'Ideas, sentences, palettes & gesture'), ['ideas:', 'unblock:', 'pal:', 'gest:']],
        ['money', L('Ahorro y comisiones', 'Savings & commissions'), ['savings:', 'commission:']],
        ['decisions', 'Decision Log', ['decisions']],
        ['games', L('Minijuegos (récords y dibujos)', 'Mini games (records & drawings)'), ['games:']],
        ['prefs', L('Preferencias de herramientas y orden del menú', 'Tool preferences & menu order'), ['wm:', 'conv:', 'vdl:', 'subs:', 'bg:', 'pdft:', 'qr:', 'layout', 'hero:', 'timer']],
        ['settings', L('Ajustes (idioma, estilo, autor; sin API key)', 'Settings (language, style, author; no API key)'), ['settings']],
      ];
      const groupOf = k => (GROUPS.find(([, , ks]) => ks.some(p => p.endsWith(':') ? k.startsWith(p) : k === p)) || ['other'])[0];
      // "12 elementos" para listas; si no, nº de claves
      const sizeOf = obj => Object.values(obj).reduce((a, v) => a + (Array.isArray(v) ? v.length : Array.isArray(v?.results) ? v.results.length + (v.mistakes || []).length : 0), 0);
      const pick = (src, gid) => Object.fromEntries(Object.entries(src).filter(([k]) => groupOf(k) === gid));
      const localData = () => { const d = {}; BD.store.keys().forEach(k => d[k] = store.get(k)); if (d.settings) { d.settings = { ...d.settings }; delete d.settings.apiKey; } return d; };
      const groupList = (el, data, checked) => {
        const present = [...GROUPS, ['other', L('Otros', 'Other'), []]].map(([id, label]) => [id, label, pick(data, id)]).filter(([, , d]) => Object.keys(d).length);
        el.innerHTML = present.length ? present.map(([id, label, d]) => { const n = sizeOf(d); return `
          <label class="check data-group"><input type="checkbox" data-g="${id}" ${checked ? 'checked' : ''}> <span>${esc(label)}</span>
          <span class="muted small">${n ? n + ' ' + L('elementos', 'items') : Object.keys(d).length + ' ' + L('ajustes', 'settings')}</span></label>`; }).join('')
          : `<p class="muted small">${L('Aún no hay datos guardados.', 'No saved data yet.')}</p>`;
      };
      const chosen = el => $$('[data-g]', el).filter(c => c.checked).map(c => c.dataset.g);
      groupList($('#sGroups', body), localData(), true);
      body.addEventListener('click', e => { const g = e.target.closest('[data-gall]'); if (g) $$('#sGroups [data-g]', body).forEach(c => c.checked = g.dataset.gall === '1'); });

      $('#sExport', body).onclick = () => {
        const ids = chosen($('#sGroups', body)); if (!ids.length) return toast(L('Elige al menos un grupo', 'Pick at least one group'), 'bad');
        const all = localData(), data = Object.fromEntries(Object.entries(all).filter(([k]) => ids.includes(groupOf(k))));
        const file = { app: 'BrainDeck', version: 1, exported: new Date().toISOString(), groups: ids, data };
        download(new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' }), `braindeck-${ids.length === $$('#sGroups [data-g]', body).length ? L('copia', 'backup') : ids.join('-')}-${BD.today()}.json`);
        toast(L(`Exportado: ${Object.keys(data).length} bloques de datos`, `Exported: ${Object.keys(data).length} data blocks`));
      };

      // Combinar: listas con id se unen sin duplicar (lo importado actualiza lo que ya existe); lo demás solo se añade si no lo tienes
      const merge = (cur, inc) => {
        if (Array.isArray(cur) && Array.isArray(inc)) {
          if (inc.every(x => x && typeof x === 'object' && 'id' in x)) { const m = new Map(cur.map(x => [x.id, x])); inc.forEach(x => m.set(x.id, x)); return [...m.values()]; }
          return [...new Set([...cur, ...inc].map(x => JSON.stringify(x)))].map(x => JSON.parse(x));
        }
        if (cur && inc && typeof cur === 'object' && typeof inc === 'object') return { ...inc, ...cur, ...(Array.isArray(cur.topics) ? { topics: merge(cur.topics, inc.topics || []), results: merge(cur.results || [], inc.results || []), mistakes: merge(cur.mistakes || [], inc.mistakes || []) } : {}) };
        return cur ?? inc;
      };
      let incoming = null, mode = 'merge';
      const HELP = { merge: L('Combinar: añade lo importado a lo que ya tienes, sin duplicar.', 'Merge: adds the imported data to what you have, without duplicates.'),
        replace: L('Reemplazar: los grupos elegidos se sustituyen por los del archivo.', 'Replace: the chosen groups are overwritten by the file\'s data.') };
      BD.seg($('#sImpMode', body), [['merge', L('Combinar', 'Merge')], ['replace', L('Reemplazar', 'Replace')]], mode, v => { mode = v; $('#sImpHelp', body).textContent = HELP[v]; });
      $('#sImpHelp', body).textContent = HELP[mode];
      $('#sImport', body).onchange = async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        try {
          const raw = JSON.parse(await BD.readText(f));
          // formato nuevo { app, data } o el antiguo (claves sueltas)
          incoming = raw && raw.app === 'BrainDeck' && raw.data ? raw.data : raw;
          if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw 0;
          if (incoming.settings) delete incoming.settings.apiKey;
          $('#sImpTitle', body).textContent = `${f.name}${raw.exported ? ' · ' + new Date(raw.exported).toLocaleString(BD.locale()) : ''}`;
          groupList($('#sImpGroups', body), incoming, true);
          $('#sImpBox', body).classList.remove('hidden');
          $('#sImpBox', body).scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch { toast(L('Archivo no válido: debe ser una copia de BrainDeck (.json)', 'Invalid file: it must be a BrainDeck backup (.json)'), 'bad'); }
      };
      $('#sImpCancel', body).onclick = () => { incoming = null; $('#sImpBox', body).classList.add('hidden'); };
      $('#sImpGo', body).onclick = () => {
        const ids = chosen($('#sImpGroups', body)); if (!incoming || !ids.length) return toast(L('Elige al menos un grupo', 'Pick at least one group'), 'bad');
        const key = settings().apiKey;
        if (mode === 'replace') BD.store.keys().filter(k => ids.includes(groupOf(k)) && k !== 'settings').forEach(k => store.del(k));
        Object.entries(incoming).filter(([k]) => ids.includes(groupOf(k))).forEach(([k, v]) => {
          if (k === 'settings') return saveSettings({ ...v, apiKey: key });
          store.set(k, mode === 'merge' ? merge(store.get(k, undefined), v) : v);
        });
        toast(L('Datos importados ✨', 'Data imported ✨')); setTimeout(() => location.reload(), 700);
      };
      $('#sReset', body).onclick = () => {
        const b = $('#sReset', body);
        if (b.dataset.armed) { BD.store.keys().forEach(k => store.del(k)); toast('Datos borrados'); setTimeout(() => location.reload(), 600); return; }
        b.dataset.armed = 1; b.textContent = '¿Seguro? Pulsa otra vez';
        setTimeout(() => { if (document.body.contains(b)) { delete b.dataset.armed; b.textContent = 'Borrar todo'; } }, 3500);
      };
    },
  });
})();
