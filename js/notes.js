'use strict';
/* Screenshot-to-Notes: OCR (local con Tesseract, IA local en el navegador o Claude) → texto importante → notas */
(() => {
  const { $, esc, win, store, toast, loadImage, uid, L } = BD;

  // ---------- 1. preprocesado: lo que más mejora el OCR ----------
  // Amplía capturas pequeñas, pasa a gris, invierte los modos oscuros (texto claro sobre fondo negro) y estira el contraste.
  async function prep(file) {
    const img = await loadImage(file);
    const k = Math.min(3, Math.max(1, 1800 / img.naturalWidth));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    const id = ctx.getImageData(0, 0, c.width, c.height), d = id.data;
    const hist = new Uint32Array(256); let sum = 0;
    for (let i = 0; i < d.length; i += 4) { const l = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0; d[i] = l; hist[l]++; sum += l; }
    const n = d.length / 4, invert = sum / n < 115;
    const pct = p => { let acc = 0; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * p) return v; } return 255; };
    const lo = pct(.03), hi = Math.max(lo + 1, pct(.97));
    for (let i = 0; i < d.length; i += 4) {
      let v = Math.max(0, Math.min(255, (d[i] - lo) * 255 / (hi - lo)));
      if (invert) v = 255 - v;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(id, 0, 0);
    return c;
  }

  // ---------- 2. separar el contenido de la interfaz ----------
  const REAL = /^[«"“¿¡(]*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][a-záéíóúüñA-ZÁÉÍÓÚÜÑ'’-]+[.,;:!?»”")]*$/;
  const UI_JUNK = /(https?:|www\.|\.com\b|\bvistas?\b|\bviews?\b|suscri|subscri|compartir|\bshare\b|guardar|recortar|\bclip\b|me gusta|\blike\b|responder|\breply\b|comentarios|comments|buscar|search|notificaci|\bseguir\b|follow)/i;
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

  // Devuelve párrafos con su confianza, nº de palabras reales y altura de letra
  function paragraphs(data) {
    const out = [];
    for (const b of data.blocks || []) for (const p of b.paragraphs || []) {
      const lines = [];
      for (const l of p.lines || []) {
        const ws = (l.words || []).filter(w => w.confidence >= 50 && w.text.trim());
        const real = ws.filter(w => REAL.test(w.text)).length;
        const text = ws.map(w => w.text).join(' ').trim();
        if (!text || real < 1) continue;
        const conf = avg((l.words || []).map(w => w.confidence));
        const ratio = real / Math.max(1, (l.words || []).length);
        if (conf < 60 || ratio < .6) continue;
        if (real < 6 && UI_JUNK.test(text)) continue;
        lines.push({ text, real, conf, h: l.bbox.y1 - l.bbox.y0 });
      }
      if (lines.length) out.push({ text: lines.map(l => l.text).join('\n'), real: lines.reduce((a, l) => a + l.real, 0), conf: avg(lines.map(l => l.conf)), h: avg(lines.map(l => l.h)), lines });
    }
    return out;
  }
  // Lo importante = párrafos con frases de verdad (o títulos grandes); lo demás suele ser menú, botones o contadores
  function important(paras) {
    const hs = paras.map(p => p.h).sort((a, b) => a - b), med = hs[hs.length >> 1] || 1;
    return paras.filter(p => p.real >= 8 || (p.real >= 2 && p.h >= med * 1.35 && p.conf >= 70))
      .map(p => ({ ...p, heading: p.real < 8, text: joinLines(p.text) }));
  }
  const joinLines = t => t.replace(/(\w)-\n(\w)/g, '$1$2').replace(/\n(?=[a-záéíóúñ(«"“])/g, ' ').replace(/[ \t]+/g, ' ').trim();

  // ---------- 3. notas sin IA ----------
  const STOP = new Set('de la que el en y a los se del las un por con no una su para es al lo como más pero sus le ya o este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto mí antes algunos qué unos yo otro otras otra él tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas algo nosotros mi mis tú te ti tu tus ellas nosotras vosotros os mío mía tuyo suyo solo sólo tiene puede ser son fue era así the of and to in is it that for on with as was are be this by an or from at not have has but you your can will so if its'.split(' '));
  const words = s => (s.toLowerCase().match(/[a-záéíóúüñ]{4,}/g) || []).filter(w => !STOP.has(w));

  function localNotes(paras, raw) {
    const imp = important(paras);
    const body = imp.filter(p => !p.heading).map(p => p.text);
    const text = imp.map(p => p.text).join('\n\n') || raw;
    const flat = body.join(' ') || text;
    const sentences = flat.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 25);
    const freq = {};
    words(flat).forEach(w => freq[w] = (freq[w] || 0) + 1);
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
    const score = s => { const ws = words(s); return ws.reduce((a, w) => a + (freq[w] || 0), 0) / Math.sqrt(ws.length + 1); };
    const n = Math.min(6, Math.max(2, Math.round(sentences.length / 4)));
    // Si el texto importante es corto, el resumen ES ese texto (no se recorta una cita a medias)
    const summary = flat.length < 700 ? flat
      : sentences.map((s, i) => [s, score(s), i]).sort((a, b) => b[1] - a[1]).slice(0, n).sort((a, b) => a[2] - b[2]).map(x => x[0]).join(' ');
    // Nombres propios (Carl Jung, Gabriel García Márquez…) + palabras más repetidas
    const names = [...new Set((text.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:[A-ZÁÉÍÓÚÑ]\.|[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)){1,3}/g) || []).filter(x => !STOP.has(x.split(' ')[0].toLowerCase())))];
    const caps = imp.filter(p => p.heading && /^[A-ZÁÉÍÓÚÑ .]{4,40}$/.test(p.text)).map(p => p.text.replace(/\b(\w)(\w*)/g, (_, a, b) => a + b.toLowerCase()));
    const concepts = [...new Set([...caps, ...names, ...top.filter(([w, c]) => c > 1 || top.length < 12).map(t => t[0])])].slice(0, 10);
    const heading = imp.find(p => p.heading);
    const lines = text.split('\n');
    const tasks = lines.filter(l => /^(\[ ?\]|☐|- \[|todo|pendiente|hacer|recordar|comprar|llamar|enviar|revisar|estudiar|terminar|entregar)\b/i.test(l) || /\b(tengo que|hay que|debo|no olvidar)\b/i.test(l));
    const questions = sentences.filter(s => /\?$/.test(s) || /^¿/.test(s));
    const defs = lines.map(l => l.match(/^([A-ZÁÉÍÓÚÑa-záéíóúñ][\wáéíóúñ ]{2,40}?)\s*(?::| - | – | es (?:un|una|el|la)\b| se define como)\s*(.{10,})$/)).filter(Boolean).map(m => ({ term: m[1].trim(), def: m[2].trim() }));
    // Cita = párrafo largo junto a un nombre en mayúsculas (típico de posts de frases), o texto entre comillas
    const quotes = (text.match(/[“"«]([^”"»]{15,240})[”"»]/g) || []).map(q => q.replace(/^[“"«]|[”"»]$/g, ''));
    const capIdx = imp.findIndex(p => p.heading && /^[A-ZÁÉÍÓÚÑ .]{4,40}$/.test(p.text));
    const quoted = capIdx >= 0 && imp.slice(capIdx + 1).find(p => !p.heading);
    if (quoted && !quotes.length && quoted.text.split(/\s+/).length < 120) quotes.push(`${quoted.text} — ${caps[0]}`);
    return {
      title: heading ? heading.text.slice(0, 70) : concepts.slice(0, 3).join(' · ') || L('Notas', 'Notes'),
      topic: concepts[0] || '—',
      summary: summary || text.slice(0, 400),
      important: text,
      concepts, tasks: tasks.slice(0, 15), questions: questions.slice(0, 10), definitions: defs.slice(0, 10), quotes: quotes.slice(0, 8),
      transcript: raw,
    };
  }

  // ---------- OCR ----------
  async function ocr(files, onProgress) {
    await BD.loadScript(BD.LIB.tesseract);
    const worker = await Tesseract.createWorker(['spa', 'eng'], 1, {
      logger: m => { if (m.status === 'recognizing text') onProgress(m.progress); },
    });
    const paras = [], raws = [];
    for (let i = 0; i < files.length; i++) {
      onProgress(0, i);
      const { data } = await worker.recognize(await prep(files[i]), {}, { text: true, blocks: true });
      paras.push(...paragraphs(data));
      raws.push(data.text.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 1).join('\n'));
    }
    await worker.terminate();
    return { paras, raw: raws.join('\n\n') };
  }

  const SCHEMA = '{"title":"","topic":"","summary":"","important":"","concepts":[""],"tasks":[""],"definitions":[{"term":"","def":""}],"quotes":[""],"questions":[""]}';
  const sysPrompt = () => L(
    'Conviertes texto de capturas de pantalla en notas de estudio en español. El texto viene de OCR: corrige errores obvios e ignora la interfaz (menús, botones, URLs, contadores de vistas, nombres de apps). Responde SOLO JSON válido.',
    'You turn screenshot text into study notes in English. The text comes from OCR: fix obvious errors and ignore the UI (menus, buttons, URLs, view counts, app names). Reply with valid JSON only.');

  // IA local (sin API): el OCR lee, el modelo del navegador limpia y resume
  async function localAINotes(paras, raw, onStep) {
    const imp = important(paras).map(p => p.text).join('\n\n');
    const src = (imp.length > 80 ? imp : paras.map(p => p.text).join('\n\n') || raw).slice(0, 6000);
    const n = await BD.localAI.chat(sysPrompt(), L(
      `Texto OCR:\n"""\n${src}\n"""\nExtrae el contenido importante (frases completas, citas con su autor si aparece) en "important", y crea notas. Devuelve este JSON: ${SCHEMA}. Arrays vacíos si no aplica.`,
      `OCR text:\n"""\n${src}\n"""\nExtract the important content (full sentences, quotes with their author if shown) into "important", and write notes. Return this JSON: ${SCHEMA}. Empty arrays when not applicable.`),
    { json: true, onProgress: (p, msg) => onStep(msg, p) });
    return { ...n, transcript: raw };
  }

  async function claudeNotes(files, onStep) {
    const prompt = L(
      `Transcribe el contenido útil de estas capturas (en orden) y conviértelo en notas. Devuelve JSON:\n${SCHEMA.replace('"summary":""', '"summary":"4-8 frases"')} y añade "transcript":"texto limpio completo". Arrays vacíos si no aplica.`,
      `Transcribe the useful content of these screenshots (in order) and turn it into notes. Return JSON:\n${SCHEMA.replace('"summary":""', '"summary":"4-8 sentences"')} plus "transcript":"full clean text". Empty arrays when not applicable.`);
    const chunks = [];
    for (let i = 0; i < files.length; i += 8) chunks.push(files.slice(i, i + 8));
    const parts = [];
    for (let i = 0; i < chunks.length; i++) {
      onStep(L(`Leyendo lote ${i + 1}/${chunks.length}…`, `Reading batch ${i + 1}/${chunks.length}…`));
      const imgs = await Promise.all(chunks[i].map(BD.imageBlock));
      parts.push(await BD.ai([...imgs, { type: 'text', text: prompt }], { system: sysPrompt(), max: 8000, json: true }));
    }
    if (parts.length === 1) return parts[0];
    onStep(L('Uniendo notas…', 'Merging notes…'));
    return BD.ai([{ type: 'text', text: L('Une estas notas parciales (JSON) en una sola con el mismo esquema, resumen global y sin duplicados. Solo JSON:\n', 'Merge these partial notes (JSON) into one with the same schema, a global summary and no duplicates. JSON only:\n') + JSON.stringify(parts) }], { system: sysPrompt(), max: 8000, json: true });
  }

  // ---------- salida ----------
  function toMarkdown(n) {
    const sec = (h, arr, f = x => '- ' + x) => arr && arr.length ? `\n## ${h}\n${arr.map(f).join('\n')}\n` : '';
    return `# ${n.title}\n\n**${L('Tema', 'Topic')}:** ${n.topic}\n\n## ${L('Resumen', 'Summary')}\n${n.summary}\n` +
      (n.important ? `\n## ${L('Texto importante', 'Key text')}\n${n.important}\n` : '') +
      sec(L('Conceptos clave', 'Key concepts'), n.concepts) + sec(L('Tareas', 'Tasks'), n.tasks, x => '- [ ] ' + x) +
      sec(L('Definiciones', 'Definitions'), n.definitions, d => `- **${d.term}:** ${d.def}`) + sec(L('Citas', 'Quotes'), n.quotes, q => '> ' + q) +
      sec(L('Preguntas', 'Questions'), n.questions) + `\n## ${L('Transcripción', 'Transcript')}\n${n.transcript || ''}\n`;
  }
  function renderNotes(n) {
    const list = (h, arr, f = x => esc(x)) => arr && arr.length ? `<h3>${h}</h3><ul>${arr.map(x => `<li>${f(x)}</li>`).join('')}</ul>` : '';
    return `<div class="md" translate="no">
      <h2>${esc(n.title)}</h2><span class="chip">${esc(n.topic)}</span>
      <h3>${L('Resumen', 'Summary')}</h3><p>${esc(n.summary)}</p>
      ${n.important && n.important !== n.summary ? `<h3>${L('Texto importante', 'Key text')}</h3>${n.important.split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join('')}` : ''}
      ${n.concepts?.length ? `<h3>${L('Conceptos', 'Concepts')}</h3><div class="row">${n.concepts.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>` : ''}
      ${list(L('Tareas', 'Tasks'), n.tasks, x => '☐ ' + esc(x))}
      ${list(L('Definiciones', 'Definitions'), n.definitions, d => `<b>${esc(d.term)}:</b> ${esc(d.def)}`)}
      ${n.quotes?.length ? `<h3>${L('Citas', 'Quotes')}</h3>${n.quotes.map(q => `<blockquote>${esc(q)}</blockquote>`).join('')}` : ''}
      ${list(L('Preguntas para repasar', 'Review questions'), n.questions)}
      ${n.transcript ? `<details style="margin-top:12px"><summary class="muted">${L('Transcripción completa (sin filtrar)', 'Full transcript (unfiltered)')}</summary><div class="out" style="margin-top:8px">${esc(n.transcript)}</div></details>` : ''}
    </div>`;
  }

  BD.tool({
    path: '/notas', cat: 'estudio', title: 'Screenshot → Notas', short: 'Capturas a notas', icon: BD.icon('scan'),
    colors: ['#ffe066', '#ffa400'], desc: 'Sube tus capturas del móvil: las transcribe, limpia y resume en notas con tareas, citas y preguntas.',
    render(view) {
      const body = win(view, { title: L('Screenshot → Notas', 'Screenshot → Notes'), sub: L(
        'Sube una colección de capturas. Se leen en orden, se separa el texto importante de la interfaz y se convierte en notas.',
        'Upload a set of screenshots. They are read in order, the important text is separated from the UI and turned into notes.') });
      let files = [];
      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div id="nDrop"></div>
            <div class="thumbs" id="nThumbs"></div>
            <div id="nEngine"></div>
            <p class="muted small" id="nEngineHelp"></p>
            <div class="row"><button class="btn primary" id="nGo" disabled>${L('Crear notas', 'Create notes')}</button><span class="muted small" id="nStatus"></span></div>
            <div class="bar hidden" id="nBar"><i></i></div>
          </div>
          <div class="card" id="nOut"><div class="empty"><span class="big">📝</span>${L('Tus notas aparecerán aquí', 'Your notes will show up here')}</div></div>
        </div>
        <div class="section-title"><h2>${L('Notas guardadas', 'Saved notes')}</h2></div>
        <div class="stack" id="nSaved"></div>`;

      const HELP = {
        local: L('Rápido y 100% offline. Filtra menús y botones, pero no entiende el texto: el resumen es extractivo.',
          'Fast and 100% offline. Filters menus and buttons, but doesn\'t understand the text: the summary is extractive.'),
        localai: L('Sin API key: el OCR lee y un modelo de IA que corre en tu navegador limpia y resume. Usa Gemini Nano de Chrome si lo tienes; si no, descarga una vez un modelo de ~1 GB (WebGPU).',
          'No API key: OCR reads and an AI model running in your browser cleans and summarizes. Uses Chrome\'s Gemini Nano if available; otherwise downloads a ~1 GB model once (WebGPU).'),
        ai: L('La mejor calidad: Claude lee las imágenes directamente. Necesita tu API key (Ajustes).',
          'Best quality: Claude reads the images directly. Needs your API key (Settings).'),
      };
      let engine = store.get('notes:engine', BD.hasAI() ? 'ai' : 'local');
      const setEngine = v => { engine = v; store.set('notes:engine', v); $('#nEngineHelp', body).textContent = HELP[v]; };
      BD.seg($('#nEngine', body), [['local', '🔒 ' + L('Local (OCR)', 'Local (OCR)')], ['localai', '🧠 ' + L('IA local', 'Local AI')], ['ai', '✨ Claude']], engine, v => {
        setEngine(v);
        if (v === 'ai' && !BD.hasAI()) toast(L('Agrega tu API key en Ajustes para usar Claude', 'Add your API key in Settings to use Claude'), 'bad');
        if (v === 'localai') BD.localAI.kind().then(k => { if (!k) toast(L('Este navegador no soporta IA local (prueba Chrome o Edge)', 'This browser can\'t run local AI (try Chrome or Edge)'), 'bad'); });
      });
      setEngine(engine);

      BD.dropzone($('#nDrop', body), {
        accept: 'image/*', icon: '📱', label: L('Arrastra tus capturas o pega con Ctrl+V', 'Drop your screenshots or paste with Ctrl+V'), hint: L('Se ordenan por nombre/fecha de archivo', 'Sorted by file name/date'),
        onFiles(list) {
          files.push(...list.filter(f => f.type.startsWith('image/')));
          files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }) || a.lastModified - b.lastModified);
          paint();
        },
      });
      const urls = new Map();
      const url = f => { if (!urls.has(f)) urls.set(f, URL.createObjectURL(f)); return urls.get(f); };
      function paint() {
        $('#nThumbs', body).innerHTML = files.map((f, i) => `<div class="thumb"><img src="${url(f)}" alt=""><button class="x" data-x="${i}">✕</button><span class="cap">${i + 1}. ${esc(f.name)}</span></div>`).join('');
        $('#nGo', body).disabled = !files.length;
      }
      $('#nThumbs', body).onclick = e => { const x = e.target.closest('[data-x]'); if (x) { files.splice(+x.dataset.x, 1); paint(); } };

      let current = null;
      $('#nGo', body).onclick = async () => {
        const btn = $('#nGo', body), st = $('#nStatus', body), bar = $('#nBar', body);
        const step = (msg, p) => { st.innerHTML = `<span class="spin"></span> ${esc(msg)}`; if (p !== undefined) $('i', bar).style.width = Math.round(p * 100) + '%'; };
        btn.disabled = true; bar.classList.remove('hidden');
        try {
          if (engine === 'ai') current = await claudeNotes(files, step);
          else {
            step(L('Cargando OCR (la primera vez descarga ~15 MB)…', 'Loading OCR (downloads ~15 MB the first time)…'));
            const { paras, raw } = await ocr(files, (p, i) => {
              if (i !== undefined) step(L(`Leyendo captura ${i + 1}/${files.length}…`, `Reading screenshot ${i + 1}/${files.length}…`));
              $('i', bar).style.width = Math.round(p * 100) + '%';
            });
            if (!raw.trim()) throw new Error(L('No se detectó texto en las imágenes.', 'No text was found in the images.'));
            if (engine === 'localai') {
              try { step(L('Preparando IA local…', 'Starting local AI…'), 0); current = await localAINotes(paras, raw, step); }
              catch (e) { console.error(e); toast(L('La IA local falló, uso el modo OCR: ', 'Local AI failed, using OCR mode: ') + e.message, 'bad'); current = localNotes(paras, raw); }
            } else current = localNotes(paras, raw);
          }
          current.id = uid(); current.at = Date.now();
          showNote(current, true);
          st.textContent = L('✓ Notas listas', '✓ Notes ready');
        } catch (e) {
          console.error(e); st.textContent = '⚠ ' + e.message; toast(e.message, 'bad');
        }
        btn.disabled = false; bar.classList.add('hidden');
      };

      function showNote(n, unsaved) {
        const out = $('#nOut', body);
        out.innerHTML = renderNotes(n) + `
          <div class="row" style="margin-top:16px">
            ${unsaved ? `<button class="btn primary sm" data-a="save">${L('Guardar', 'Save')}</button>` : ''}
            <button class="btn ghost sm" data-a="copy">${L('Copiar Markdown', 'Copy Markdown')}</button>
            <button class="btn ghost sm" data-a="md">${L('Descargar .md', 'Download .md')}</button>
            <a class="btn ghost sm" href="#/test" data-a="test">${L('Hacer test con esto', 'Make a test from this')}</a>
          </div>`;
        out.onclick = e => {
          const a = e.target.closest('[data-a]')?.dataset.a;
          if (a === 'save') { const all = store.get('notes', []); all.unshift(n); store.set('notes', all.slice(0, 100)); toast(L('Notas guardadas', 'Notes saved')); paintSaved(); e.target.remove(); }
          if (a === 'copy') BD.copy(toMarkdown(n));
          if (a === 'md') BD.download(new Blob([toMarkdown(n)], { type: 'text/markdown' }), (n.title || 'notas').replace(/[^\wáéíóúñ -]/gi, '').slice(0, 40) + '.md');
          if (a === 'test') store.set('study:pending', { title: n.title, text: n.important || n.transcript });
        };
      }
      function paintSaved() {
        const all = store.get('notes', []);
        $('#nSaved', body).innerHTML = all.length ? all.map(n => `
          <div class="card row"><b translate="no">${esc(n.title)}</b><span class="chip" translate="no">${esc(n.topic)}</span><span class="spacer"></span>
          <span class="muted small">${new Date(n.at).toLocaleDateString(BD.locale())}</span>
          <button class="btn ghost sm" data-open="${n.id}">${L('Abrir', 'Open')}</button><button class="icon-btn" data-del="${n.id}">🗑</button></div>`).join('')
          : `<p class="muted">${L('Aún no guardas notas.', 'No saved notes yet.')}</p>`;
      }
      $('#nSaved', body).onclick = e => {
        const o = e.target.closest('[data-open]'), d = e.target.closest('[data-del]');
        if (o) { showNote(store.get('notes', []).find(n => n.id === o.dataset.open)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        if (d) { store.set('notes', store.get('notes', []).filter(n => n.id !== d.dataset.del)); paintSaved(); }
      };
      paintSaved();
      return () => urls.forEach(u => URL.revokeObjectURL(u));
    },
  });
})();
