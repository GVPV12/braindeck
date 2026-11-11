'use strict';
/* Notas rápidas: un cuaderno de anillas estilo HyperCard. Se guarda solo mientras escribes. */
(() => {
  const { $, $$, esc, win, store, toast, uid, download, L } = BD;
  const TABS = () => [['all', L('Todas', 'All')], ['ideas', 'Ideas'], ['tareas', L('Tareas', 'To-do')], ['estudio', L('Estudio', 'Study')], ['personal', 'Personal'], ['otros', L('Otros', 'Other')]];
  // Una sola vez: si ya tenías un orden guardado, Notas rápidas pasa al primer lugar de Estudio
  if (!store.get('qnotes:first', false)) {
    const lay = store.get('layout', null);
    if (lay && lay.tools) {
      Object.keys(lay.tools).forEach(c => lay.tools[c] = lay.tools[c].filter(p => p !== '/notas-rapidas'));
      lay.tools.estudio = ['/notas-rapidas', ...(lay.tools.estudio || [])];
      store.set('layout', lay);
    }
    store.set('qnotes:first', true);
  }
  const all = () => store.get('qnotes', []);
  const saveAll = a => store.set('qnotes', a);
  // Color de cada pestaña para los iconos de la vista "Todas"
  const TILE = { ideas: '#ffd978', tareas: '#93e6c8', estudio: '#cbb8ff', personal: '#ffb8da', otros: '#acc9ff' };
  // Otras herramientas (p. ej. Capturas → notas) pueden crear una nota aquí; queda abierta al entrar
  BD.qnotes = {
    add(base = {}) {
      const n = { id: uid(), title: '', text: '', tab: 'ideas', pin: 0, created: Date.now(), updated: Date.now(), ...base };
      const a = all(); a.unshift(n); saveAll(a);
      store.set('qnotes:ui', { tab: 'all', id: n.id });
      return n.id;
    },
  };

  BD.tool({
    path: '/notas-rapidas', cat: 'estudio', first: true, title: L('Notas rápidas', 'Quick notes'), short: L('Notas rápidas', 'Quick notes'), icon: BD.icon('notebook'),
    colors: ['#fff6b8', '#f2c94c'],
    desc: L('Un cuaderno de anillas para apuntar ideas, tareas y lo que se te ocurra. Se guarda solo.', 'A spiral notebook for ideas, to-dos and anything else. Saves automatically.'),
    render(view) {
      const body = win(view, { title: L('Notas rápidas', 'Quick notes'), sub: L('Escribe y listo: todo se guarda solo en este navegador. Alt+N crea una nota nueva.', 'Just type: everything saves in this browser. Alt+N makes a new note.') });
      const ui = store.get('qnotes:ui', { tab: 'all', id: null }) || {};
      let tab = ui.tab || 'all', curId = ui.id, q = '';
      const rememberUI = () => store.set('qnotes:ui', { tab, id: curId });

      body.innerHTML = `
        <div class="hc">
          <div class="hc-rings" aria-hidden="true">${'<i></i>'.repeat(26)}</div>
          <div class="hc-page">
            <div class="hc-menu">
              <div class="hc-menu-h">${L('Notas', 'Notes')}</div>
              <input class="hc-search" type="search" placeholder="${L('Buscar…', 'Search…')}" aria-label="${L('Buscar notas', 'Search notes')}">
              <div class="hc-list" id="hcList"></div>
              <div class="hc-sep"></div>
              <button class="hc-cmd" data-c="new">${L('Nueva nota', 'New note')}<kbd>⌥N</kbd></button>
              <button class="hc-cmd" data-c="dup">${L('Duplicar', 'Duplicate')}</button>
              <button class="hc-cmd" data-c="txt">${L('Exportar .txt', 'Export .txt')}</button>
              <button class="hc-cmd" data-c="del">${L('Borrar nota', 'Delete note')}</button>
            </div>
            <div class="hc-body" id="hcBody"></div>
          </div>
          <div class="hc-tabs" id="hcTabs" role="tablist"></div>
        </div>`;

      const list = $('#hcList', body), main = $('#hcBody', body);
      const visible = () => all().filter(n => (tab === 'all' || n.tab === tab) && (!q || (n.title + ' ' + n.text).toLowerCase().includes(q)))
        .sort((a, b) => (b.pin - a.pin) || b.updated - a.updated);
      // ✕ que aparece al pasar el cursor; 1er clic pide confirmación, 2º clic borra
      const delBtn = id => `<button class="hc-x" data-del="${id}" title="${L('Borrar nota', 'Delete note')}" aria-label="${L('Borrar nota', 'Delete note')}">✕</button>`;
      const titleOf = n => n.title.trim() || n.text.trim().split('\n')[0].slice(0, 40) || L('Sin título', 'Untitled');

      function paintTabs() {
        $('#hcTabs', body).innerHTML = TABS().map(([id, n]) => `<button class="hc-tab ${id === tab ? 'on' : ''}" role="tab" aria-selected="${id === tab}" data-tab="${id}">${n}</button>`).join('');
      }
      function paintList() {
        const v = visible();
        list.innerHTML = v.length ? v.map(n => `<div class="hc-row"><button class="hc-item ${n.id === curId ? 'on' : ''}" data-id="${n.id}">${n.pin ? '★ ' : ''}${esc(titleOf(n))}</button>${delBtn(n.id)}</div>`).join('')
          : `<p class="hc-empty">${q ? L('Nada coincide.', 'No matches.') : L('Aún no hay notas aquí.', 'No notes here yet.')}</p>`;
      }
      function paintNote() {
        const n = all().find(x => x.id === curId);
        if (!n && tab === 'all') {
          // "Todas": cada nota es una app, como en BrainDeck OS
          const v = visible();
          main.innerHTML = `<h2 class="hc-h">${L('Todas las notas', 'All notes')} <small>${v.length}</small></h2>
            <div class="hc-apps">
              ${v.map(x => `<div class="hc-app-w"><button class="hc-app" data-id="${x.id}" title="${esc(titleOf(x))}">
                ${BD.appIcon('/notas-rapidas').replace(/--tile:[^"]+/, '--tile:' + (TILE[x.tab] || TILE.ideas))}
                ${x.pin ? '<i class="hc-pin">★</i>' : ''}<span>${esc(titleOf(x))}</span></button>${delBtn(x.id)}</div>`).join('')}
              <button class="hc-app" data-c="new" title="${L('Nueva nota', 'New note')}"><span class="app-ic hc-plus">+</span><span>${L('Nueva', 'New')}</span></button>
            </div>`;
          return;
        }
        if (!n) {
          main.innerHTML = `<h2 class="hc-h">${L('Nueva idea', 'New idea')}</h2>
            <p>${L('Elige una nota del menú de la izquierda o crea una nueva.', 'Pick a note from the menu on the left or create a new one.')}</p>
            <p>${L('Las pestañas de abajo ordenan tus notas por tema. Marca con ★ las importantes para que queden arriba.', 'The tabs below sort your notes by topic. Star the important ones so they stay on top.')}</p>
            <button class="hc-return" data-c="new" title="${L('Nueva nota', 'New note')}" aria-label="${L('Nueva nota', 'New note')}">⏎</button>`;
          return;
        }
        main.innerHTML = `
          <input class="hc-title" id="hcTitle" value="${esc(n.title)}" placeholder="${L('Título', 'Title')}" aria-label="${L('Título', 'Title')}">
          <textarea class="hc-text" id="hcText" placeholder="${L('Escribe aquí…', 'Write here…')}" aria-label="${L('Texto', 'Text')}">${esc(n.text)}</textarea>
          <div class="hc-foot">
            ${tab === 'all' ? `<button class="hc-mini" data-c="grid" title="${L('Ver todas', 'See all')}" aria-label="${L('Ver todas', 'See all')}">⊞</button>` : ''}
            <button class="hc-mini ${n.pin ? 'on' : ''}" data-c="pin" title="${L('Fijar arriba', 'Pin to top')}">★</button>
            <select id="hcTab" aria-label="${L('Pestaña', 'Tab')}">${TABS().slice(1).map(([id, l]) => `<option value="${id}" ${id === n.tab ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <span class="hc-meta" id="hcMeta"></span>
            <button class="hc-return" data-c="new" title="${L('Nueva nota', 'New note')}" aria-label="${L('Nueva nota', 'New note')}">⏎</button>
          </div>`;
        meta(n);
        const t = $('#hcText', main); if (!n.text && !n.title) $('#hcTitle', main).focus();
        t.style.height = '';
      }
      const meta = n => { const w = (n.text.match(/\S+/g) || []).length; $('#hcMeta', main).textContent = `${w} ${L('palabras', 'words')} · ${new Date(n.updated).toLocaleString(BD.locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`; };
      function update(patch) {
        const a = all(), n = a.find(x => x.id === curId); if (!n) return;
        Object.assign(n, patch, { updated: Date.now() }); saveAll(a); meta(n);
      }
      function create(base = {}) {
        const n = { id: uid(), title: '', text: '', tab: tab === 'all' ? 'ideas' : tab, pin: 0, created: Date.now(), updated: Date.now(), ...base };
        const a = all(); a.unshift(n); saveAll(a);
        curId = n.id; q = ''; $('.hc-search', body).value = ''; rememberUI(); paintList(); paintNote();
      }
      const commands = {
        new: () => create(),
        dup: () => { const n = all().find(x => x.id === curId); if (!n) return toast(L('Elige una nota primero', 'Pick a note first'), 'bad'); create({ title: n.title + L(' (copia)', ' (copy)'), text: n.text, tab: n.tab }); },
        txt: () => { const n = all().find(x => x.id === curId); if (!n) return toast(L('Elige una nota primero', 'Pick a note first'), 'bad'); download(new Blob([(n.title ? n.title + '\n\n' : '') + n.text], { type: 'text/plain' }), (n.title.trim() || 'nota').replace(/[\\/:*?"<>|]/g, '').slice(0, 60) + '.txt'); },
        del: e => {
          if (!all().some(x => x.id === curId)) return toast(L('Elige una nota primero', 'Pick a note first'), 'bad');
          const b = e.target.closest('[data-c]');
          if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = L('¿Seguro? Pulsa otra vez', 'Sure? Click again'); setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = L('Borrar nota', 'Delete note'); } }, 3000); return; }
          saveAll(all().filter(x => x.id !== curId)); curId = null; rememberUI(); paintList(); paintNote(); toast(L('Nota borrada', 'Note deleted'));
          delete b.dataset.armed; b.textContent = L('Borrar nota', 'Delete note');
        },
        pin: () => { const n = all().find(x => x.id === curId); update({ pin: n.pin ? 0 : 1 }); paintList(); paintNote(); },
        grid: () => { curId = null; rememberUI(); paintList(); paintNote(); },
      };

      body.addEventListener('click', e => {
        const c = e.target.closest('[data-c]'), it = e.target.closest('[data-id]'), tb = e.target.closest('[data-tab]'), x = e.target.closest('[data-del]');
        if (x) {
          if (!x.classList.contains('armed')) {
            x.classList.add('armed'); x.textContent = L('¿Borrar?', 'Delete?');
            setTimeout(() => { if (x.isConnected) { x.classList.remove('armed'); x.textContent = '✕'; } }, 2500);
            return;
          }
          saveAll(all().filter(n => n.id !== x.dataset.del));
          if (curId === x.dataset.del) curId = null;
          rememberUI(); paintList(); paintNote(); toast(L('Nota borrada', 'Note deleted'));
          return;
        }
        if (c) commands[c.dataset.c](e);
        else if (it) { curId = it.dataset.id; rememberUI(); paintList(); paintNote(); }
        else if (tb) {
          tab = tb.dataset.tab;
          if (tab === 'all') curId = null; // "Todas" abre la vista de apps
          rememberUI(); paintTabs(); paintList(); paintNote();
        }
      });
      let timer;
      body.addEventListener('input', e => {
        if (e.target.matches('.hc-search')) { q = e.target.value.trim().toLowerCase(); paintList(); if (!curId && tab === 'all') paintNote(); return; }
        if (!e.target.matches('#hcTitle, #hcText')) return;
        clearTimeout(timer);
        timer = setTimeout(() => { update({ title: $('#hcTitle', main).value, text: $('#hcText', main).value }); paintList(); }, 250);
      });
      body.addEventListener('change', e => { if (e.target.id === 'hcTab') { update({ tab: e.target.value }); paintList(); } });
      const onKey = e => { if (e.altKey && (e.key === 'n' || e.key === 'N' || e.code === 'KeyN')) { e.preventDefault(); create(); } };
      document.addEventListener('keydown', onKey);

      paintTabs(); paintList(); paintNote();
      return () => {
        clearTimeout(timer); document.removeEventListener('keydown', onKey);
        const t = $('#hcTitle', main), n = all().find(x => x.id === curId);
        if (t && n && (t.value !== n.title || $('#hcText', main).value !== n.text)) update({ title: t.value, text: $('#hcText', main).value });
      };
    },
  });
})();
