'use strict';
/* BrainDeck core: router por hash, almacenamiento, UI helpers, IA opcional. */
const BD = window.BD = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-5);
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // ---------- almacenamiento ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('bd:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('bd:' + k, JSON.stringify(v)); return true; } catch { toast('No se pudo guardar (almacenamiento lleno o bloqueado)', 'bad'); return false; } },
    del(k) { try { localStorage.removeItem('bd:' + k); } catch {} },
    keys() { try { return Object.keys(localStorage).filter(k => k.startsWith('bd:')).map(k => k.slice(3)); } catch { return []; } },
  };
  const settings = () => Object.assign({ theme: 'neo', lang: 'es', apiKey: '', model: 'claude-sonnet-5-5', author: '', currency: 'USD' }, store.get('settings', {}));
  const saveSettings = patch => { store.set('settings', Object.assign(settings(), patch)); };

  // ---------- idioma ----------
  // L('texto', 'text'): el código nuevo elige el texto en línea; la interfaz antigua se traduce con el diccionario de i18n.js
  const lang = () => settings().lang === 'en' ? 'en' : 'es';
  const L = (es, en) => lang() === 'en' ? en : es;
  const locale = () => lang() === 'en' ? 'en' : 'es';

  // ---------- router ----------
  const routes = [];
  const tools = [];
  function route(path, def) {
    const keys = [];
    const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ re, keys, def, path });
  }
  // Herramienta = ruta + entrada en menús
  function tool(def) { tools.push(def); route(def.path, def); }

  let cleanup = null;
  function render() {
    const path = (location.hash.replace(/^#/, '') || '/').split('?')[0] || '/';
    if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
    let match = null; const params = {};
    for (const r of routes) {
      const m = path.match(r.re);
      if (m) { match = r; r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1])); break; }
    }
    if (!match) match = routes.find(r => r.path === '/');
    const view = $('#view');
    view.innerHTML = '';
    view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
    const def = match.def;
    document.title = def.title ? `${BD.tr(def.title)} · BrainDeck` : 'BrainDeck';
    try {
      const res = def.render(view, params);
      if (typeof res === 'function') cleanup = res;
    } catch (e) {
      console.error(e);
      view.innerHTML = `<div class="win"><div class="win-body"><h2>Ups 😵</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="#/">Volver al inicio</a></div></div>`;
    }
    const section = '/' + (path.split('/')[1] || '');
    $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === section));
    window.scrollTo(0, 0);
  }
  const go = path => { location.hash = '#' + path; };

  // ---------- UI ----------
  // Crea la "ventana" estándar de cada herramienta y devuelve su cuerpo.
  function win(view, { title, sub, back = '#/' }) {
    const el = document.createElement('section');
    el.className = 'win';
    el.innerHTML = `
      <div class="win-bar">
        <a class="icon-btn" href="${back}" title="Volver" aria-label="Volver">←</a>
        <span class="wb-deco">▶</span>
        <h1>${esc(title)}</h1>
        <button class="icon-btn" data-share title="Copiar enlace a esta herramienta" aria-label="Copiar enlace">🔗</button>
        <a class="icon-btn" href="#/" title="Cerrar" aria-label="Cerrar">✕</a>
      </div>
      ${sub ? `<p class="win-sub">${sub}</p>` : ''}
      <div class="win-body"></div>`;
    el.querySelector('[data-share]').onclick = () => copy(location.href, 'Enlace copiado ✨');
    view.appendChild(el);
    return el.querySelector('.win-body');
  }
  function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + type; t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  async function copy(text, msg = 'Copiado') {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(msg); } catch { toast('No se pudo copiar', 'bad'); }
      ta.remove();
    }
  }
  function seg(el, options, value, onChange) {
    el.classList.add('seg');
    el.innerHTML = options.map(([v, l]) => `<button type="button" data-v="${esc(v)}" class="${v === value ? 'on' : ''}">${l}</button>`).join('');
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', el).forEach(x => x.classList.toggle('on', x === b));
      onChange(b.dataset.v);
    };
  }
  // Zona de arrastre de archivos (también acepta pegar desde el portapapeles)
  function dropzone(el, { accept = '*/*', multiple = true, label = 'Arrastra archivos aquí o haz clic', hint = '', icon = '📁', paste = true, onFiles }) {
    el.classList.add('drop');
    el.innerHTML = `<span class="big">${icon}</span><b>${label}</b><div class="muted small">${hint}</div><input type="file" accept="${accept}" ${multiple ? 'multiple' : ''}>`;
    const input = $('input', el);
    el.onclick = e => { if (e.target !== input) input.click(); };
    input.onchange = () => { if (input.files.length) onFiles([...input.files]); input.value = ''; };
    el.ondragover = e => { e.preventDefault(); el.classList.add('over'); };
    el.ondragleave = () => el.classList.remove('over');
    el.ondrop = e => { e.preventDefault(); el.classList.remove('over'); const f = [...e.dataTransfer.files]; if (f.length) onFiles(f); };
    const onPaste = e => {
      if (!document.body.contains(el)) return document.removeEventListener('paste', onPaste);
      const f = [...(e.clipboardData?.files || [])]; if (f.length) onFiles(f);
    };
    if (paste) document.addEventListener('paste', onPaste);
  }

  // ---------- archivos ----------
  const fmtBytes = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const readDataURL = f => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(f); });
  const readText = f => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsText(f); });
  const readBuffer = f => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsArrayBuffer(f); });
  function loadImage(src) {
    return new Promise((ok, ko) => {
      const img = new Image();
      const url = src instanceof Blob ? URL.createObjectURL(src) : src;
      img.onload = () => ok(img);
      img.onerror = () => ko(new Error('No se pudo leer la imagen'));
      img.src = url;
    });
  }
  const canvasBlob = (canvas, type, q) => new Promise(ok => canvas.toBlob(ok, type, q));
  const baseName = n => n.replace(/\.[^.]+$/, '');

  // ---------- librerías externas bajo demanda ----------
  const loaded = {};
  function loadScript(src) {
    if (!loaded[src]) loaded[src] = new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = () => { delete loaded[src]; ko(new Error('No se pudo cargar ' + src + ' (¿sin conexión?)')); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }
  const LIB = {
    chart: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
    jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
    pdflib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
    transformers: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2', // módulo ES (import dinámico)
  };
  async function zipAndDownload(files, name) {
    await loadScript(LIB.jszip);
    const zip = new JSZip();
    files.forEach(f => zip.file(f.name, f.blob));
    download(await zip.generateAsync({ type: 'blob' }), name);
  }
  // Colores leídos del tema actual (para gráficas)
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  // ---------- IA (opcional, con tu propia API key de Anthropic) ----------
  const hasAI = () => !!settings().apiKey;
  async function ai(content, { system, max = 4000, json = false } = {}) {
    const s = settings();
    if (!s.apiKey) throw new Error('Configura tu API key en Ajustes para usar IA.');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': s.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: s.model || 'claude-sonnet-5-5', max_tokens: max, system, messages: [{ role: 'user', content }] }),
    });
    if (!res.ok) {
      let msg = res.status + '';
      try { msg += ' ' + (await res.json()).error.message; } catch {}
      throw new Error('Error de la API: ' + msg);
    }
    const data = await res.json();
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    if (!json) return text;
    const m = text.match(/[\[{][\s\S]*[\]}]/);
    return JSON.parse(m ? m[0] : text);
  }
  // Imagen → bloque para la API (reduce a ≤1600px para ahorrar tokens)
  async function imageBlock(file) {
    const img = await loadImage(file);
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: c.toDataURL('image/jpeg', .88).split(',')[1] } };
  }

  // ---------- IA local (sin API key): todo corre en tu navegador ----------
  // 1) Gemini Nano integrado en Chrome (API LanguageModel), sin descargas extra si ya está disponible.
  // 2) WebLLM: un modelo abierto (Qwen2.5 1.5B, ~1 GB) que se descarga una vez y corre con WebGPU.
  const WEBLLM = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.78/+esm';
  const WEBLLM_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
  let llm = null;
  const localAI = {
    async kind() {
      try { if (self.LanguageModel && await LanguageModel.availability({ expectedOutputs: [{ type: 'text', languages: [lang()] }] }) !== 'unavailable') return 'chrome'; } catch {}
      return navigator.gpu ? 'webllm' : null;
    },
    async chat(system, user, { json = false, onProgress = () => {} } = {}) {
      const kind = await localAI.kind();
      if (!kind) throw new Error(L('Tu navegador no puede correr IA local (necesita Chrome/Edge reciente con WebGPU).', 'Your browser can\'t run local AI (needs a recent Chrome/Edge with WebGPU).'));
      let text;
      if (kind === 'chrome') {
        if (!llm || llm.kind !== 'chrome') llm = { kind, s: await LanguageModel.create({
          initialPrompts: [{ role: 'system', content: system }],
          expectedOutputs: [{ type: 'text', languages: [lang()] }],
          monitor: m => m.addEventListener('downloadprogress', e => onProgress(e.loaded, L('Descargando Gemini Nano…', 'Downloading Gemini Nano…'))),
        }) };
        const s = await llm.s.clone();
        text = await s.prompt(user); s.destroy();
      } else {
        if (!llm || llm.kind !== 'webllm') {
          const webllm = await import(WEBLLM);
          const appConfig = { ...webllm.prebuiltAppConfig, useIndexedDBCache: location.protocol === 'file:' };
          llm = { kind, e: await webllm.CreateMLCEngine(WEBLLM_MODEL, { appConfig, initProgressCallback: r => onProgress(r.progress, L('Descargando modelo local (solo la primera vez)…', 'Downloading local model (first time only)…')) }) };
        }
        const r = await llm.e.chat.completions.create({
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          temperature: 0.2, max_tokens: 1500, ...(json ? { response_format: { type: 'json_object' } } : {}),
        });
        text = r.choices[0].message.content;
      }
      if (!json) return text;
      const m = text.match(/[\[{][\s\S]*[\]}]/);
      return JSON.parse(m ? m[0] : text);
    },
  };
  // Usa Claude si hay API key; si no, la IA local
  async function anyAI(prompt, { system = '', json = false, onProgress } = {}) {
    if (hasAI()) return ai(prompt, { system, json });
    return localAI.chat(system, prompt, { json, onProgress });
  }

  // ---------- Decision Log ----------
  function log(type, title, data) {
    const all = store.get('decisions', []);
    all.unshift({ id: uid(), type, title, data, at: Date.now() });
    store.set('decisions', all.slice(0, 300));
    toast('Guardado en tu Decision Log 📒');
  }

  // ---------- temas ----------
  const THEMES = [['neo', 'Neo pixel'], ['cosmos', 'Cosmos'], ['frost', 'Frost']];
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    $('meta[name=theme-color]').content = { cosmos: '#090614', neo: '#dcf34b', frost: '#26303a' }[t] || '#dcf34b';
    window.dispatchEvent(new CustomEvent('bd:theme'));
  }
  function setTheme(t) { saveSettings({ theme: t }); applyTheme(t); }

  // ---------- iconos (trazos estilo Lucide, ISC) ----------
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    settings: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01M16 14v4"/>',
    droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8h8M7 12h10M7 16h6"/>',
    trending: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    piggy: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1M16 11h.01"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    notebook: '<path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M16 2v20"/>',
    gamepad: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/>',
    radio: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.1 19.1 19"/><circle cx="12" cy="12" r="2"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    gallows: '<path d="M4 21h10M7 21V3h9v3"/><circle cx="16" cy="8.5" r="2.5"/><path d="M16 11v5M16 13l-2.5 2.5M16 13l2.5 2.5"/>',
    terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
    scroll: '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.7 1.7-1.7h2c3 0 5.5-2.5 5.5-5.5C22 6 17.5 2 12 2z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    files: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5M12 18v-6M9 15h6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    captions: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4M12 2v3"/>',
    bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 2l.6 1.4L7 4l-1.4.6L5 6l-.6-1.4L3 4l1.4-.6z"/>',
    swatch: '<path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2zM16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7M7 17h.01M11 8l2.3-2.3a2 2 0 0 1 2.8 0l2.8 2.8a2 2 0 0 1 0 2.8L9 20"/>',
    pose: '<circle cx="12" cy="4" r="2"/><path d="M12 6v7M12 13l-3 8M12 13l3 8M6 9l6-1 6-2"/>',
    flag: '<path d="M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    filepen: '<path d="M12 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v3"/><path d="M14 2v6h6M18.4 13.6a2 2 0 1 1 2.8 2.8L16 21.5l-3.5 1 1-3.5z"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3M20 17h1"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  };
  const icon = name => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  // ---------- categorías y orden personalizado ----------
  const CATS = () => [['estudio', L('Estudio', 'Study')], ['creativo', L('Imágenes y arte', 'Images & art')], ['media', L('Utilidades', 'Utilities')], ['dinero', L('Dinero', 'Money')]];
  // Orden guardado por la persona: { cats: [id…], tools: { id: [path…] } }. Lo que no esté guardado va a su categoría por defecto.
  function layout() {
    const saved = store.get('layout', {}) || {}, ids = CATS().map(c => c[0]);
    const cats = (saved.cats || []).filter(id => ids.includes(id));
    ids.forEach(id => cats.includes(id) || cats.push(id));
    const main = tools.filter(t => !t.hidden && t.group !== 'extra'), placed = new Set(), by = {};
    cats.forEach(id => by[id] = ((saved.tools || {})[id] || []).map(p => main.find(t => t.path === p)).filter(t => t && !placed.has(t.path) && placed.add(t.path)));
    main.filter(t => !placed.has(t.path)).forEach(t => by[by[t.cat] ? t.cat : cats[0]].push(t));
    const names = Object.fromEntries(CATS());
    return cats.map(id => ({ id, name: names[id], tools: by[id] }));
  }
  const saveLayout = lay => { store.set('layout', { cats: lay.map(c => c.id), tools: Object.fromEntries(lay.map(c => [c.id, c.tools.map(t => t.path)])) }); buildNav(); };

  // ---------- navegación ----------
  function buildNav() {
    const item = (href, nav, ic, label) => `<a class="nav-item" href="#${href}" data-nav="${nav}"><span class="ni">${ic}</span><span>${label}</span></a>`;
    const main = tools.filter(t => !t.hidden);
    $('#sideNav').innerHTML =
      item('/', '/', icon('home'), 'Inicio') +
      `<a class="nav-item" href="https://grevaleart.com/" target="_blank" rel="noopener"><span class="ni">${icon('palette')}</span><span>${L('Mi portafolio', 'My portfolio')} ↗</span></a>` +
      layout().filter(c => c.tools.length).map(c => `<div class="nav-label">${esc(c.name)}</div>` +
        c.tools.map(t => t.external
          ? `<a class="nav-item" href="${t.external}" target="_blank" rel="noopener"><span class="ni">${t.icon}</span><span>${t.short || t.title} ↗</span></a>`
          : item(t.path, t.path, t.icon, t.short || t.title)).join('')).join('') +
      `<div class="nav-label">Más</div>` +
      main.filter(t => t.group === 'extra').map(t => item(t.path, t.path, t.icon, t.short || t.title)).join('') +
      item('/ajustes', '/ajustes', icon('settings'), 'Ajustes') +
      item('/findme', '/findme', icon('link'), L('Estoy en', 'Find me on'));
    $('#bottomNav').innerHTML =
      item('/', '/', icon('home'), 'Inicio') + item('/plan', '/plan', icon('calendar'), 'Plan') +
      item('/juegos', '/juegos', icon('gamepad'), 'Juegos') + item('/ajustes', '/ajustes', icon('settings'), 'Ajustes');
  }
  // Recargar es lo más fiable: todo (menús, títulos, atributos) se vuelve a pintar en el idioma nuevo
  function setLang(l) {
    if (l === lang()) return;
    saveSettings({ lang: l });
    location.reload();
  }

  function init() {
    applyTheme(settings().theme);
    document.documentElement.lang = lang();
    window.dispatchEvent(new CustomEvent('bd:lang'));
    buildNav();
    $('#themeCycle').onclick = () => {
      const i = THEMES.findIndex(t => t[0] === settings().theme);
      const next = THEMES[(i + 1) % THEMES.length];
      setTheme(next[0]); toast(L('Estilo: ', 'Style: ') + next[1]);
    };
    window.addEventListener('hashchange', render);
    render();
  }
  document.addEventListener('DOMContentLoaded', init);

  const money = (n, cur = settings().currency) => {
    try { return new Intl.NumberFormat(locale(), { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n || 0); }
    catch { return (n || 0).toFixed(2) + ' ' + cur; }
  };
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };

  return {
    $, $$, esc, uid, today, store, settings, saveSettings, route, tool, tools, go, render, win, toast, copy, seg, dropzone,
    fmtBytes, download, readDataURL, readText, readBuffer, loadImage, canvasBlob, baseName, loadScript, LIB, zipAndDownload,
    cssVar, hasAI, ai, imageBlock, localAI, anyAI, log, THEMES, setTheme, money, num, icon,
    lang, L, locale, setLang, layout, saveLayout, buildNav, tr: s => s, // tr lo reemplaza i18n.js
  };
})();
