'use strict';
/* Book → Test Studio: sube un libro (PDF/EPUB/TXT), genera un test online, repaso espaciado y enlace para compartir */
(() => {
  const { $, $$, esc, win, store, toast, uid } = BD;
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s]/g, '').trim();
  const TF = () => BD.L(['Verdadero', 'Falso'], ['True', 'False']);
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- extracción de texto ----------
  async function pdfText(file, onP) {
    await BD.loadScript(BD.LIB.pdf);
    pdfjsLib.GlobalWorkerOptions.workerSrc = BD.LIB.pdfWorker;
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const c = await (await pdf.getPage(i)).getTextContent();
      let line = '', out = [], lastY = null;
      c.items.forEach(it => {
        const y = it.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 2) { out.push(line); line = ''; }
        line += it.str; lastY = y;
      });
      out.push(line);
      pages.push(out.join('\n'));
      onP(i / pdf.numPages);
    }
    return pages.join('\n\n');
  }
  async function epubChapters(file) {
    await BD.loadScript(BD.LIB.jszip);
    const zip = await JSZip.loadAsync(file);
    const dp = new DOMParser();
    const container = dp.parseFromString(await zip.file('META-INF/container.xml').async('text'), 'application/xml');
    const opfPath = container.querySelector('rootfile').getAttribute('full-path');
    const dir = opfPath.includes('/') ? opfPath.replace(/[^/]+$/, '') : '';
    const opf = dp.parseFromString(await zip.file(opfPath).async('text'), 'application/xml');
    const manifest = {};
    opf.querySelectorAll('manifest > item').forEach(i => manifest[i.getAttribute('id')] = i.getAttribute('href'));
    const chapters = [];
    for (const ref of opf.querySelectorAll('spine > itemref')) {
      const href = manifest[ref.getAttribute('idref')]; if (!href) continue;
      const f = zip.file(decodeURIComponent(dir + href)); if (!f) continue;
      const doc = dp.parseFromString(await f.async('text'), 'text/html');
      const text = (doc.body?.innerText || doc.body?.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
      if (text.split(/\s+/).length < 80) continue;
      const h = doc.querySelector('h1,h2,h3,title');
      chapters.push({ title: (h?.textContent || `Sección ${chapters.length + 1}`).trim().slice(0, 80), text });
    }
    return chapters;
  }
  function splitChapters(text) {
    const re = /^\s*((cap[ií]tulo|chapter|parte|part|tema|unidad|lecci[oó]n|secci[oó]n)\s+([\divxlc]+|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b.*)$/gim;
    const marks = [...text.matchAll(re)];
    if (marks.length >= 2) {
      const out = [];
      if (marks[0].index > 1500) out.push({ title: 'Introducción', text: text.slice(0, marks[0].index) });
      marks.forEach((m, i) => out.push({ title: m[1].trim().slice(0, 80), text: text.slice(m.index, marks[i + 1]?.index ?? text.length) }));
      return out.filter(c => c.text.split(/\s+/).length > 60);
    }
    const words = text.split(/\s+/), out = [];
    for (let i = 0; i < words.length; i += 2500) out.push({ title: `Parte ${out.length + 1}`, text: words.slice(i, i + 2500).join(' ') });
    return out;
  }

  // ---------- generación local (sin IA) ----------
  const STOP = new Set('además ahora antes aquel aquella aunque cada cierto como contra cosas cuando desde donde durante entonces entre estaba estaban estar este esta estos estas fueron había habían hacer hacia hasta luego mientras mismo mucho muchos nada nunca otra otras otro otros pero poco porque puede pueden según siempre sido sobre también tanto tiene tienen todas todos través usted vamos where which there their about would could should these those other being after before while because through between'.split(' '));
  function localQuestions(text, n, types) {
    const sentences = text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/)
      .map(s => s.trim()).filter(s => s.length > 60 && s.length < 260 && !/[|{}<>@#]|https?:/.test(s) && /^[A-ZÁÉÍÓÚÑ¿¡"“]/.test(s));
    const freq = {};
    (text.match(/[A-Za-zÁÉÍÓÚÑáéíóúñü]{5,}/g) || []).forEach(w => { const k = w.toLowerCase(); if (!STOP.has(k)) freq[k] = (freq[k] || 0) + 1; });
    const keys = Object.entries(freq).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 250).map(x => x[0]);
    const keySet = new Set(keys);
    const termIn = s => {
      const ws = (s.match(/[A-Za-zÁÉÍÓÚÑáéíóúñü]{5,}/g) || []).filter(w => keySet.has(w.toLowerCase()));
      return ws.sort((a, b) => b.length - a.length)[0];
    };
    const distract = (term, k) => shuffle(keys.filter(w => w !== term.toLowerCase() && Math.abs(w.length - term.length) <= 4)).slice(0, k)
      .map(w => term[0] === term[0].toUpperCase() ? w[0].toUpperCase() + w.slice(1) : w);
    const step = Math.max(1, Math.floor(sentences.length / (n * 1.6)));
    const picked = [];
    for (let i = 0; i < sentences.length && picked.length < n * 2; i += step) if (termIn(sentences[i])) picked.push(sentences[i]);
    const out = [];
    shuffle(picked).slice(0, n).forEach((s, i) => {
      const term = termIn(s), type = types[i % types.length];
      const blank = s.replace(new RegExp(`\\b${term}\\b`), '_____');
      if (type === 'tf') {
        const truth = Math.random() < .5, alt = distract(term, 1)[0];
        const [T, F] = TF();
        out.push({ type: 'tf', q: `${BD.L('Verdadero o falso', 'True or false')}: «${truth || !alt ? s : s.replace(term, alt)}»`, options: [T, F], answer: truth || !alt ? T : F, explain: `${BD.L('Texto original', 'Original text')}: «${s}»` });
      } else if (type === 'fill') {
        out.push({ type: 'fill', q: `${BD.L('Completa', 'Fill in')}: ${blank}`, answer: term, explain: `«${s}»` });
      } else {
        const ds = distract(term, 3);
        if (ds.length < 3) out.push({ type: 'fill', q: `${BD.L('Completa', 'Fill in')}: ${blank}`, answer: term, explain: `«${s}»` });
        else out.push({ type: 'mc', q: `${BD.L('¿Qué palabra falta?', 'Which word is missing?')} ${blank}`, options: shuffle([term, ...ds]), answer: term, explain: `«${s}»` });
      }
    });
    return out;
  }

  async function aiQuestions(text, n, types, title) {
    const labels = { mc: 'opción múltiple (4 opciones)', tf: 'verdadero/falso', fill: 'completar huecos (respuesta de 1-3 palabras)' };
    const prompt = `Material de estudio: "${title}".\n\n<texto>\n${text.slice(0, 150000)}\n</texto>\n\nCrea ${n} preguntas de examen ${BD.L('en español', 'in English')} que evalúen comprensión real (no detalles triviales), repartidas entre: ${types.map(t => labels[t]).join(', ')}. Cubre todo el material.
Devuelve SOLO un array JSON: [{"type":"mc|tf|fill","q":"pregunta","options":["..."],"answer":"respuesta exacta (para tf: ${TF().join(' o ')}; para mc: igual a una opción)","explain":"explicación breve citando la idea del texto"}]. En "fill" usa _____ en la pregunta y omite options.`;
    const qs = await BD.ai(prompt, { max: 12000, json: true, system: 'Eres un profesor experto que diseña tests de estudio. Respondes solo JSON válido.' });
    return qs.filter(q => q && q.q && q.answer).map(q => {
      const type = q.type === 'tf' ? 'tf' : q.type === 'fill' || !Array.isArray(q.options) || q.options.length < 2 ? 'fill' : 'mc';
      return { ...q, answer: String(q.answer), type, options: type === 'tf' ? TF() : q.options };
    });
  }

  // ---------- mini markdown ----------
  function md(s) {
    return esc(s).split('\n').map(l =>
      /^### /.test(l) ? `<h3>${l.slice(4)}</h3>` : /^## /.test(l) ? `<h2>${l.slice(3)}</h2>` : /^# /.test(l) ? `<h2>${l.slice(2)}</h2>` :
      /^\s*[-*] /.test(l) ? `<li>${l.replace(/^\s*[-*] /, '')}</li>` : /^\s*\d+\. /.test(l) ? `<li>${l.replace(/^\s*\d+\. /, '')}</li>` :
      l.trim() ? `<p>${l}</p>` : '').join('').replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }

  // ---------- runner de quiz reutilizable ----------
  BD.runQuiz = function (el, questions, { title = 'Test', onAnswer, onFinish, onExit } = {}) {
    let i = 0, correct = 0; const wrong = [];
    const next = () => {
      if (i >= questions.length) return finish();
      const q = questions[i];
      el.innerHTML = `
        <div class="q-head"><span class="chip">Pregunta ${i + 1}/${questions.length}</span><span class="chip good">✓ ${correct}</span></div>
        <div class="bar" style="margin-bottom:16px"><i style="width:${i / questions.length * 100}%"></i></div>
        ${/^[a-z]{2}$/.test(q.flag || '') ? `<div class="flag"><img src="https://flagcdn.com/w320/${q.flag}.png" alt="Bandera" style="height:110px;border-radius:8px;border:var(--bw) solid var(--border)"></div>` : ''}
        <div class="q-text" translate="no">${esc(q.q)}</div>
        ${q.type === 'fill'
          ? `<div class="row" style="margin-top:14px"><input type="text" id="qIn" placeholder="Tu respuesta" style="flex:1;min-width:180px" autocomplete="off"><button class="btn primary" id="qOk">Comprobar</button></div>`
          : `<div class="q-opts" translate="no">${q.options.map((o, k) => `<button class="q-opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>`}
        <div id="qFb" style="margin-top:14px"></div>`;
      const answer = given => {
        const ok = norm(given) === norm(q.answer);
        if (ok) correct++; else wrong.push(q);
        onAnswer && onAnswer(i, ok, q);
        $$('.q-opt', el).forEach(b => { b.disabled = true; if (norm(b.textContent) === norm(q.answer)) b.classList.add('ok'); else if (b.textContent === given) b.classList.add('no'); });
        $('#qFb', el).innerHTML = `
          <div class="note-box"><b>${ok ? '¡Correcto! ✨' : `Respuesta: ${esc(q.answer)}`}</b>${q.explain ? `<div class="muted small" style="margin-top:4px">${esc(q.explain)}</div>` : ''}</div>
          <div class="row end" style="margin-top:12px"><button class="btn primary" id="qNext">${i + 1 < questions.length ? 'Siguiente →' : 'Ver resultado'}</button></div>`;
        const nb = $('#qNext', el); nb.focus(); nb.onclick = () => { i++; next(); };
      };
      if (q.type === 'fill') {
        const inp = $('#qIn', el); inp.focus();
        const go = () => { if (!inp.value.trim()) return; inp.disabled = true; $('#qOk', el).remove(); answer(inp.value); };
        $('#qOk', el).onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
      } else $('.q-opts', el).onclick = e => { const b = e.target.closest('.q-opt'); if (b && !b.disabled) answer(b.textContent); };
    };
    const finish = () => {
      const pct = Math.round(correct / questions.length * 100);
      onFinish && onFinish(correct, questions.length, wrong);
      el.innerHTML = `
        <div style="text-align:center">
          <div style="font-size:3rem">${pct >= 90 ? '🏆' : pct >= 70 ? '🌟' : pct >= 50 ? '💪' : '📚'}</div>
          <div class="result-big">${pct}%</div>
          <p class="muted">${correct} de ${questions.length} correctas · ${esc(title)}</p>
        </div>
        ${wrong.length ? `<h3>Para repasar</h3><div class="stack">${wrong.map(q => `<div class="card"><b>${esc(q.q)}</b><div class="muted small">Respuesta: ${esc(q.answer)}</div></div>`).join('')}</div>` : ''}
        <div class="row" style="margin-top:18px;justify-content:center">
          <button class="btn primary" id="qAgain">Repetir</button>
          ${wrong.length ? '<button class="btn ghost" id="qWrong">Solo los fallos</button>' : ''}
          ${onExit ? '<button class="btn ghost" id="qExit">Salir</button>' : ''}
        </div>`;
      const w = [...wrong];
      $('#qAgain', el).onclick = () => BD.runQuiz(el, shuffle(questions), { title, onAnswer, onFinish, onExit });
      $('#qWrong', el) && ($('#qWrong', el).onclick = () => BD.runQuiz(el, w, { title, onAnswer, onFinish, onExit }));
      $('#qExit', el) && ($('#qExit', el).onclick = onExit);
    };
    next();
  };

  // ---------- enlaces compartibles ----------
  const b64url = str => btoa(Array.from(new TextEncoder().encode(str), b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64url = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
  const shareLink = deck => `${location.href.split('#')[0]}#/test/share/${b64url(JSON.stringify({ t: deck.title, q: deck.questions }))}`;

  function playDeck(view, deck, back = '#/test') {
    const body = win(view, { title: deck.title, sub: `${deck.questions.length} preguntas`, back });
    BD.runQuiz(body, shuffle(deck.questions), {
      title: deck.title,
      onFinish(c, t, wrong) {
        BD.progress.addResult(deck.title, c, t, wrong);
        if (deck.id) { const all = store.get('decks', []); const d = all.find(x => x.id === deck.id); if (d) { d.best = Math.max(d.best || 0, Math.round(c / t * 100)); d.plays = (d.plays || 0) + 1; store.set('decks', all); } }
      },
      onExit: () => { location.hash = back; },
    });
  }

  BD.route('/test/deck/:id', {
    title: 'Test', render(view, { id }) {
      const deck = store.get('decks', []).find(d => d.id === id);
      if (!deck) { BD.win(view, { title: 'Test no encontrado', back: '#/test' }).innerHTML = '<p class="muted">Este test no existe en este navegador. Pide un enlace de "compartir".</p>'; return; }
      playDeck(view, deck);
    },
  });
  BD.route('/test/share/:data', {
    title: 'Test compartido', render(view, { data }) {
      let d;
      try { d = JSON.parse(unb64url(data)); } catch { win(view, { title: 'Enlace roto' }).innerHTML = '<p class="muted">El enlace del test está incompleto.</p>'; return; }
      playDeck(view, { title: d.t, questions: d.q }, '#/');
    },
  });
  BD.route('/test/repaso', {
    title: 'Repaso espaciado', render(view) {
      const due = shuffle(BD.progress.due());
      const body = win(view, { title: 'Repaso espaciado', sub: 'Preguntas que fallaste. Si aciertas, vuelven más tarde (1→3→7→14→30 días); si fallas, mañana otra vez.', back: '#/test' });
      if (!due.length) { body.innerHTML = '<div class="empty"><span class="big">🎉</span>No tienes repasos pendientes hoy.</div>'; return; }
      BD.runQuiz(body, due.map(m => m.item), {
        title: 'Repaso', onAnswer: (i, ok) => BD.progress.review(due[i].id, ok),
        onExit: () => { location.hash = '#/test'; },
      });
    },
  });

  BD.tool({
    path: '/test', cat: 'estudio', title: 'Libro → Test', short: 'Libro a test', icon: BD.icon('book'),
    colors: ['#c4a8ff', '#7448ff'], desc: 'Sube un PDF/EPUB/TXT y genera un test online para estudiar, con repaso espaciado y enlace para compartir.',
    render(view) {
      const body = win(view, { title: 'Libro → Test', sub: 'Sube un libro o apuntes. Elige capítulos y tipo de preguntas. El test se guarda y puedes compartirlo con un enlace.' });
      let chapters = [], bookTitle = '';
      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div id="sDrop"></div>
            <details><summary class="muted">…o pega el texto</summary>
              <textarea id="sPaste" placeholder="Pega aquí tus apuntes o un capítulo" style="margin-top:8px"></textarea>
              <button class="btn ghost sm" id="sUsePaste" style="margin-top:8px">Usar este texto</button>
            </details>
            <div class="muted small" id="sStatus"></div>
            <div class="card stack hidden" id="sConf">
              <label class="field"><span>Título del test</span><input type="text" id="sTitle"></label>
              <div><span class="label">Capítulos</span>
                <div class="row" style="margin:6px 0"><button class="btn ghost sm" id="sAll">Todos</button><button class="btn ghost sm" id="sNone">Ninguno</button></div>
                <div id="sChaps" class="stack" style="max-height:260px;overflow:auto"></div></div>
              <div class="grid g2">
                <label class="field"><span>Nº de preguntas <b id="sNV"></b></span><input type="range" id="sN" min="5" max="40" value="15"></label>
                <div class="field"><span>Motor</span><div id="sEngine"></div></div>
              </div>
              <div class="row">
                <label class="check"><input type="checkbox" value="mc" class="sType" checked> Opción múltiple</label>
                <label class="check"><input type="checkbox" value="tf" class="sType" checked> V/F</label>
                <label class="check"><input type="checkbox" value="fill" class="sType" checked> Completar</label>
              </div>
              <div class="row"><button class="btn primary" id="sGen">Generar test</button><button class="btn ghost" id="sGuide">Guía de estudio (IA)</button></div>
            </div>
            <div class="card md hidden" id="sGuideOut"></div>
          </div>
          <div class="stack">
            <div class="card"><h3>Mis tests</h3><div id="sDecks" class="stack"></div></div>
            <a class="card row" href="#/test/repaso" style="text-decoration:none"><span style="font-size:1.6rem">🔁</span><div><b>Repaso espaciado</b><div class="muted small">${BD.progress.due().length} preguntas pendientes hoy</div></div></a>
          </div>
        </div>`;

      let engine = BD.hasAI() ? 'ai' : 'local';
      BD.seg($('#sEngine', body), [['local', 'Local'], ['ai', '✨ IA']], engine, v => engine = v);
      const nIn = $('#sN', body); nIn.oninput = () => $('#sNV', body).textContent = nIn.value; nIn.oninput();
      const status = $('#sStatus', body);

      function loaded(title, chs) {
        bookTitle = title; chapters = chs;
        $('#sTitle', body).value = title;
        $('#sChaps', body).innerHTML = chs.map((c, i) => `<label class="check"><input type="checkbox" data-c="${i}" checked> ${esc(c.title)} <span class="muted small">(${c.text.split(/\s+/).length} palabras)</span></label>`).join('');
        $('#sConf', body).classList.remove('hidden');
        status.textContent = `✓ ${chs.length} secciones detectadas`;
      }
      BD.dropzone($('#sDrop', body), {
        accept: '.pdf,.epub,.txt,.md,text/plain,application/pdf,application/epub+zip', multiple: false, icon: '📖', label: 'Sube tu libro', hint: 'PDF con texto, EPUB, TXT o MD (los PDF escaneados no tienen texto: usa Capturas → Notas)',
        async onFiles([f]) {
          const name = BD.baseName(f.name);
          try {
            status.innerHTML = '<span class="spin"></span> Leyendo…';
            if (/\.epub$/i.test(f.name)) loaded(name, await epubChapters(f));
            else if (/\.pdf$/i.test(f.name)) {
              const t = await pdfText(f, p => status.innerHTML = `<span class="spin"></span> Leyendo PDF ${Math.round(p * 100)}%`);
              if (t.replace(/\s/g, '').length < 200) throw new Error('El PDF casi no tiene texto (¿es escaneado?).');
              loaded(name, splitChapters(t));
            } else loaded(name, splitChapters(await BD.readText(f)));
          } catch (e) { console.error(e); status.textContent = '⚠ ' + e.message; }
        },
      });
      $('#sUsePaste', body).onclick = () => { const t = $('#sPaste', body).value.trim(); if (t.length < 200) return toast('Pega un poco más de texto', 'bad'); loaded('Mis apuntes', splitChapters(t)); };
      const pending = store.get('study:pending', null);
      if (pending) { store.del('study:pending'); loaded(pending.title, splitChapters(pending.text)); }

      $('#sAll', body).onclick = () => $$('[data-c]', body).forEach(c => c.checked = true);
      $('#sNone', body).onclick = () => $$('[data-c]', body).forEach(c => c.checked = false);
      const selectedText = () => $$('[data-c]', body).filter(c => c.checked).map(c => chapters[+c.dataset.c]).map(c => `## ${c.title}\n${c.text}`).join('\n\n');

      $('#sGen', body).onclick = async e => {
        const text = selectedText(); if (!text) return toast('Elige al menos un capítulo', 'bad');
        const types = $$('.sType', body).filter(c => c.checked).map(c => c.value); if (!types.length) return toast('Elige un tipo de pregunta', 'bad');
        const n = +nIn.value, title = $('#sTitle', body).value.trim() || bookTitle, btn = e.currentTarget;
        btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Generando';
        try {
          const qs = engine === 'ai' ? await aiQuestions(text, n, types, title) : localQuestions(text, n, types);
          if (!qs.length) throw new Error('No se pudieron sacar preguntas de este texto.');
          const deck = { id: uid(), title, questions: qs, created: Date.now(), engine };
          const all = store.get('decks', []); all.unshift(deck); store.set('decks', all.slice(0, 50));
          location.hash = '#/test/deck/' + deck.id;
        } catch (err) { toast(err.message, 'bad'); }
        btn.disabled = false; btn.textContent = 'Generar test';
      };
      $('#sGuide', body).onclick = async e => {
        if (!BD.hasAI()) return toast('La guía de estudio necesita tu API key (Ajustes)', 'bad');
        const text = selectedText(); if (!text) return;
        const btn = e.currentTarget, out = $('#sGuideOut', body);
        btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Creando guía';
        try {
          const g = await BD.ai(`Convierte este material en un mini-curso en Markdown (español): índice, resumen de cada sección (3-5 viñetas), conceptos clave con definición, y un plan de estudio de 7 días.\n\n<texto>\n${text.slice(0, 150000)}\n</texto>`, { max: 6000 });
          out.innerHTML = md(g) + '<div class="row" style="margin-top:12px"><button class="btn ghost sm" id="gDl">Descargar .md</button></div>';
          out.classList.remove('hidden');
          $('#gDl', out).onclick = () => BD.download(new Blob([g], { type: 'text/markdown' }), 'guia-de-estudio.md');
        } catch (err) { toast(err.message, 'bad'); }
        btn.disabled = false; btn.textContent = 'Guía de estudio (IA)';
      };

      function paintDecks() {
        const all = store.get('decks', []);
        $('#sDecks', body).innerHTML = all.length ? all.map(d => `
          <div class="row">
            <div style="flex:1;min-width:0"><b>${esc(d.title)}</b><div class="muted small">${d.questions.length} preguntas${d.best != null ? ` · mejor ${d.best}%` : ''}</div></div>
            <a class="btn primary sm" href="#/test/deck/${d.id}">Jugar</a>
            <button class="icon-btn" data-share="${d.id}" title="Copiar enlace para compartir">🔗</button>
            <button class="icon-btn" data-del="${d.id}" title="Borrar">🗑</button>
          </div>`).join('') : '<p class="muted small">Aún no tienes tests.</p>';
      }
      $('#sDecks', body).onclick = e => {
        const s = e.target.closest('[data-share]'), d = e.target.closest('[data-del]');
        if (s) { const link = shareLink(store.get('decks', []).find(x => x.id === s.dataset.share)); BD.copy(link, link.length > 30000 ? 'Copiado (enlace muy largo, puede fallar en algunas apps)' : 'Enlace del test copiado 🔗'); }
        if (d) { store.set('decks', store.get('decks', []).filter(x => x.id !== d.dataset.del)); paintDecks(); }
      };
      paintDecks();
    },
  });
})();
