'use strict';
/* Quitar fondo: un modelo de segmentación corre en tu navegador (Transformers.js). Las imágenes no se suben. */
(() => {
  const { $, esc, win, store, toast, L } = BD;
  // RMBG-1.4 (BRIA): el más preciso para cualquier objeto, licencia de uso no comercial. MODNet: retratos, licencia Apache 2.0.
  const MODELS = {
    general: { id: 'briaai/RMBG-1.4', proc: { do_normalize: true, do_pad: false, do_rescale: true, do_resize: true, image_mean: [.5, .5, .5], feature_extractor_type: 'ImageFeatureExtractor', image_std: [1, 1, 1], resample: 2, rescale_factor: 1 / 255, size: { width: 1024, height: 1024 } } },
    portrait: { id: 'Xenova/modnet' },
  };
  const cache = {};
  async function load(kind, onP) {
    if (cache[kind]) return cache[kind];
    const T = await import(BD.LIB.transformers);
    T.env.allowLocalModels = false;
    T.env.useBrowserCache = typeof caches !== 'undefined' && location.protocol !== 'file:';
    const m = MODELS[kind], progress_callback = d => { if (d.status === 'progress' && d.total) onP(d.loaded / d.total); };
    const model = await T.AutoModel.from_pretrained(m.id, { ...(kind === 'general' ? { config: { model_type: 'custom' } } : {}), device: navigator.gpu ? 'webgpu' : 'wasm', dtype: 'fp32', progress_callback });
    const processor = await T.AutoProcessor.from_pretrained(m.id, m.proc ? { config: m.proc } : {});
    return cache[kind] = { T, model, processor };
  }
  // Máscara del sujeto (0-255 por píxel) al tamaño original
  async function segment(file, kind, onP) {
    const { T, model, processor } = await load(kind, onP);
    const url = URL.createObjectURL(file);
    try {
      const image = await T.RawImage.fromURL(url);
      const { output } = await model({ input: (await processor(image)).pixel_values });
      const mask = await T.RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);
      return { mask: mask.data, w: image.width, h: image.height };
    } finally { URL.revokeObjectURL(url); }
  }
  // Aplica la máscara como transparencia. Bordes "suaves" con limpieza ajustable; "duros" con umbral (mejor para stickers).
  async function applyMask(file, { mask, w, h }, o) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'), img = await BD.loadImage(file);
    x.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(img.src);
    const d = x.getImageData(0, 0, w, h);
    for (let i = 0; i < mask.length; i++) d.data[i * 4 + 3] = o.edge === 'hard' ? (mask[i] > 127 ? 255 : 0) : Math.min(255, Math.max(0, (mask[i] - o.cut) * 255 / (255 - o.cut)));
    x.putImageData(d, 0, 0);
    return c;
  }
  // Fondo de color / contorno blanco tipo sticker
  function finish(cut, o) {
    if (o.bg === 'none' && !o.sticker) return cut;
    const pad = o.sticker ? Math.round(Math.max(cut.width, cut.height) * .03) : 0;
    const c = document.createElement('canvas'); c.width = cut.width + pad * 2; c.height = cut.height + pad * 2;
    const x = c.getContext('2d');
    if (o.bg !== 'none') { x.fillStyle = o.color; x.fillRect(0, 0, c.width, c.height); }
    if (o.sticker) {
      // contorno: la silueta en blanco desplazada en círculo
      const s = document.createElement('canvas'); s.width = cut.width; s.height = cut.height;
      const sx = s.getContext('2d'); sx.drawImage(cut, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, s.width, s.height);
      for (let a = 0; a < 360; a += 15) x.drawImage(s, pad + Math.cos(a * Math.PI / 180) * pad, pad + Math.sin(a * Math.PI / 180) * pad);
    }
    x.drawImage(cut, pad, pad);
    return c;
  }

  BD.tool({
    path: '/quitar-fondo', cat: 'creativo', title: 'Quitar fondo', short: 'Quitar fondo', icon: BD.icon('scissors'),
    colors: ['#d4ffea', '#00c38a'], desc: 'Quita el fondo de tus fotos o dibujos con IA en tu navegador. PNG transparente, fondo de color o sticker.',
    render(view) {
      const body = win(view, { title: L('Quitar fondo', 'Remove background'), sub: L(
        'Un modelo de IA recorta el sujeto dentro de tu navegador: tus imágenes no se suben a ningún servidor. La primera vez descarga el modelo (~45 MB para retratos, ~170 MB el general).',
        'An AI model cuts out the subject inside your browser: your images are never uploaded. The first time it downloads the model (~45 MB for portraits, ~170 MB for general).') });
      const o = Object.assign({ kind: 'general', edge: 'soft', cut: 20, bg: 'none', color: '#ffffff', sticker: false }, store.get('bg:opts', {}));
      let items = [];
      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div id="bDrop"></div>
            <div class="bg-grid" id="bList"></div>
          </div>
          <div class="card stack">
            <div class="field"><span>${L('Modelo', 'Model')}</span><div id="bKind"></div>
              <span class="muted small" id="bKindHelp"></span></div>
            <div class="field"><span>${L('Bordes', 'Edges')}</span><div id="bEdge"></div></div>
            <label class="field" id="bCutBox"><span>${L('Limpieza de bordes', 'Edge cleanup')} <b id="bCutV"></b></span><input type="range" id="bCut" min="0" max="120" value="${o.cut}"></label>
            <div class="field"><span>${L('Fondo', 'Background')}</span><div id="bBg"></div></div>
            <input type="color" id="bColor" value="${o.color}" class="${o.bg === 'color' ? '' : 'hidden'}">
            <label class="check"><input type="checkbox" id="bSticker" ${o.sticker ? 'checked' : ''}> ${L('Contorno blanco tipo sticker', 'White sticker outline')}</label>
            <div class="row"><button class="btn primary" id="bGo" disabled>${L('Quitar fondo', 'Remove background')}</button><button class="btn ghost" id="bZip" disabled>${L('Descargar todo', 'Download all')}</button></div>
            <span class="muted small" id="bSt"></span>
            <div class="bar hidden" id="bBar"><i></i></div>
          </div>
        </div>`;
      const v = id => $('#' + id, body);
      const help = { general: L('RMBG-1.4: el más preciso para objetos, productos, dibujos y personas. Licencia solo para uso NO comercial.', 'RMBG-1.4: most accurate for objects, products, drawings and people. NON-commercial use license only.'),
        portrait: L('MODNet: para retratos y personas. Más ligero y con licencia libre (también comercial).', 'MODNet: for portraits and people. Lighter, with a free license (commercial too).') };
      const save = () => { Object.assign(o, { cut: +v('bCut').value, color: v('bColor').value, sticker: v('bSticker').checked }); store.set('bg:opts', o); v('bCutV').textContent = o.cut; v('bKindHelp').textContent = help[o.kind]; v('bCutBox').classList.toggle('hidden', o.edge === 'hard'); v('bColor').classList.toggle('hidden', o.bg !== 'color'); };
      BD.seg(v('bKind'), [['general', L('General', 'General')], ['portrait', L('Retratos', 'Portraits')]], o.kind, x => { o.kind = x; save(); });
      BD.seg(v('bEdge'), [['soft', L('Suaves', 'Soft')], ['hard', L('Duros (stickers)', 'Hard (stickers)')]], o.edge, x => { o.edge = x; save(); refinish(); });
      BD.seg(v('bBg'), [['none', L('Transparente', 'Transparent')], ['color', L('Color', 'Color')]], o.bg, x => { o.bg = x; save(); refinish(); });
      body.addEventListener('input', () => { save(); });
      body.addEventListener('change', () => { save(); refinish(); });
      save();

      BD.dropzone(v('bDrop'), {
        accept: 'image/*', icon: '✂️', label: L('Suelta tus imágenes o pega con Ctrl+V', 'Drop your images or paste with Ctrl+V'), hint: 'JPG, PNG, WebP…',
        onFiles(list) { items.push(...list.filter(f => f.type.startsWith('image/')).map(f => ({ file: f, src: URL.createObjectURL(f), cut: null, out: null }))); paint(); },
      });
      function paint() {
        v('bGo').disabled = !items.length; v('bZip').disabled = !items.some(i => i.out);
        v('bList').innerHTML = items.map((it, i) => `
          <div class="bg-item">
            <div class="checker"><img src="${it.out ? it.out.toDataURL('image/png') : it.src}" alt=""></div>
            <div class="row"><span class="small" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" translate="no">${esc(it.file.name)}</span>
            ${it.out ? `<button class="icon-btn" data-dl="${i}" title="${L('Descargar', 'Download')}">⬇</button>` : ''}<button class="icon-btn" data-x="${i}">✕</button></div>
          </div>`).join('');
      }
      // Cambiar fondo/sticker/bordes no necesita volver a pasar el modelo
      const masks = new Map();
      async function refinish() {
        for (const it of items) if (masks.has(it)) it.out = finish(await applyMask(it.file, masks.get(it), o), o);
        paint();
      }
      v('bList').onclick = e => {
        const dl = e.target.closest('[data-dl]'), x = e.target.closest('[data-x]');
        if (dl) { const it = items[+dl.dataset.dl]; it.out.toBlob(b => BD.download(b, BD.baseName(it.file.name) + (o.bg === 'none' ? '_sin-fondo.png' : '_fondo.png'))); }
        if (x) { const [r] = items.splice(+x.dataset.x, 1); URL.revokeObjectURL(r.src); masks.delete(r); paint(); }
      };
      v('bGo').onclick = async () => {
        const btn = v('bGo'), st = v('bSt'), bar = v('bBar'); btn.disabled = true; bar.classList.remove('hidden');
        try {
          for (let i = 0; i < items.length; i++) {
            const it = items[i]; if (it.out && it.kind === o.kind) continue;
            st.innerHTML = `<span class="spin"></span> ${L('Recortando', 'Cutting out')} ${i + 1}/${items.length}…`;
            // la máscara se guarda para cambiar bordes/fondo sin volver a pasar la IA
            const m = await segment(it.file, o.kind, p => { st.innerHTML = `<span class="spin"></span> ${L('Descargando modelo…', 'Downloading model…')} ${Math.round(p * 100)}%`; $('i', bar).style.width = Math.round(p * 100) + '%'; });
            masks.set(it, m);
            it.kind = o.kind; it.out = finish(await applyMask(it.file, m, o), o);
            $('i', bar).style.width = Math.round((i + 1) / items.length * 100) + '%'; paint();
          }
          st.textContent = L('✓ Listo', '✓ Done');
        } catch (e) { console.error(e); st.textContent = '⚠ ' + e.message; toast(e.message, 'bad'); }
        btn.disabled = false; bar.classList.add('hidden'); paint();
      };
      v('bZip').onclick = async () => {
        const files = await Promise.all(items.filter(i => i.out).map(it => new Promise(ok => it.out.toBlob(b => ok({ name: BD.baseName(it.file.name) + '.png', blob: b })))));
        if (files.length === 1) BD.download(files[0].blob, files[0].name); else await BD.zipAndDownload(files, 'sin-fondo.zip');
      };
      return () => items.forEach(i => URL.revokeObjectURL(i.src));
    },
  });
})();
