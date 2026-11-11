'use strict';
/* Compresor de imágenes: calidad o peso objetivo, en lote, todo local. Al re-codificar se eliminan los metadatos (EXIF, GPS). */
(() => {
  const { $, esc, win, store, toast, loadImage, canvasBlob, baseName, fmtBytes, num, L } = BD;

  const supports = type => { const c = document.createElement('canvas'); c.width = c.height = 1; return c.toDataURL(type).startsWith('data:' + type); };
  const FORMATS = [['auto', 'Auto'], ['image/webp', 'WebP'], ['image/jpeg', 'JPG'], ['image/avif', 'AVIF'], ['image/png', 'PNG']].filter(f => f[0] === 'auto' || supports(f[0]));
  const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/avif': 'avif', 'image/png': 'png' };

  // Auto: JPG se queda en JPG (máxima compatibilidad); el resto pasa a WebP, que comprime mucho mejor que PNG y conserva la transparencia
  const outType = (file, fmt) => fmt !== 'auto' ? fmt : file.type === 'image/jpeg' ? 'image/jpeg' : supports('image/webp') ? 'image/webp' : 'image/jpeg';

  function draw(img, maxSide, type, scale = 1) {
    const iw = img.naturalWidth || 1024, ih = img.naturalHeight || 1024;
    let k = maxSide ? Math.min(1, maxSide / Math.max(iw, ih)) : 1;
    k *= scale;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(iw * k)); c.height = Math.max(1, Math.round(ih * k));
    const x = c.getContext('2d');
    if (type === 'image/jpeg') { x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); } // JPG no tiene transparencia
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  async function compress(it, o) {
    const type = outType(it.file, o.fmt);
    if (o.mode === 'quality' || type === 'image/png') {
      return { blob: await canvasBlob(draw(it.img, o.max, type), type, o.q / 100), type };
    }
    // Peso objetivo: búsqueda binaria de la calidad; si ni con calidad baja cabe, se reduce el tamaño poco a poco
    const target = o.kb * 1024;
    let best = null;
    for (let scale = 1, tries = 0; tries < 7; tries++, scale *= .85) {
      const c = draw(it.img, o.max, type, scale);
      let lo = .3, hi = .95;
      for (let i = 0; i < 7; i++) {
        const q = (lo + hi) / 2, b = await canvasBlob(c, type, q);
        if (b.size <= target) { best = b; lo = q; } else hi = q;
      }
      if (best) break;
    }
    return { blob: best || await canvasBlob(draw(it.img, o.max, type, .3), type, .3), type, missed: !best };
  }

  BD.tool({
    path: '/comprimir', cat: 'creativo', title: 'Comprimir imágenes', short: 'Comprimir imágenes', icon: BD.icon('image'),
    colors: ['#ffd6a5', '#ff9f1c'], desc: 'Reduce el peso de tus imágenes por calidad o a un peso exacto (KB), y quita los metadatos ocultos.',
    render(view) {
      const body = win(view, { title: L('Comprimir imágenes', 'Compress images'), sub: L('Todo ocurre en tu navegador. Al comprimir se eliminan los metadatos ocultos (EXIF, ubicación GPS, modelo de cámara).', 'Everything happens in your browser. Compressing removes hidden metadata (EXIF, GPS location, camera model).') });
      const o = Object.assign({ fmt: 'auto', mode: 'quality', q: 75, kb: 200, max: 0, keep: true }, store.get('compress:opts', {}));
      if (!FORMATS.some(f => f[0] === o.fmt)) o.fmt = 'auto';
      let items = [], sel = 0;

      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div id="cpDrop"></div>
            <div class="scroll-x"><table class="table" id="cpTable"></table></div>
            <div id="cpCmp"></div>
          </div>
          <div class="card stack">
            <div class="field"><span>${L('Formato', 'Format')}</span><div id="cpFmt"></div></div>
            <div class="field"><span>${L('Modo', 'Mode')}</span><div id="cpMode"></div></div>
            <label class="field" id="cpQBox"><span>${L('Calidad', 'Quality')} <b id="cpQV"></b></span><input type="range" id="cpQ" min="30" max="95" value="${o.q}"></label>
            <label class="field" id="cpKbBox"><span>${L('Peso máximo por imagen (KB)', 'Max size per image (KB)')}</span><input type="number" id="cpKb" min="5" value="${o.kb}"></label>
            <label class="field"><span>${L('Lado más largo (px, 0 = original)', 'Longest side (px, 0 = original)')}</span><input type="number" id="cpMax" min="0" step="100" value="${o.max}"></label>
            <label class="check"><input type="checkbox" id="cpKeep" ${o.keep ? 'checked' : ''}> ${L('Si pesa más que el original, conservar el original', 'If it ends up heavier, keep the original')}</label>
            <div class="row"><button class="btn primary" id="cpGo" disabled>${L('Comprimir', 'Compress')}</button><span class="muted small" id="cpSt"></span></div>
            <p class="muted small">${L('Tip: 70-80 de calidad suele verse igual y pesar 3-10 veces menos. PNG no tiene compresión con pérdida: en "Auto" se convierte a WebP, que mantiene la transparencia.', 'Tip: 70-80 quality usually looks the same and weighs 3-10× less. PNG has no lossy mode: "Auto" converts it to WebP, which keeps transparency.')}</p>
          </div>
        </div>`;

      BD.seg($('#cpFmt', body), FORMATS, o.fmt, v => { o.fmt = v; sync(); });
      BD.seg($('#cpMode', body), [['quality', L('Calidad', 'Quality')], ['target', L('Peso objetivo', 'Target size')]], o.mode, v => { o.mode = v; sync(); });

      function sync() {
        Object.assign(o, { q: num($('#cpQ', body).value), kb: Math.max(5, num($('#cpKb', body).value)), max: Math.max(0, Math.round(num($('#cpMax', body).value))), keep: $('#cpKeep', body).checked });
        store.set('compress:opts', o);
        $('#cpQV', body).textContent = o.q;
        $('#cpQBox', body).classList.toggle('hidden', o.mode !== 'quality');
        $('#cpKbBox', body).classList.toggle('hidden', o.mode !== 'target');
      }
      body.addEventListener('input', e => { if (e.target.closest('.card')) { sync(); items.forEach(i => i.out = null); paint(); } });

      BD.dropzone($('#cpDrop', body), {
        accept: 'image/*', icon: '🗜️', label: L('Arrastra imágenes (una o muchas)', 'Drop images (one or many)'), hint: L('JPG, PNG, WebP, AVIF… o pega con Ctrl+V', 'JPG, PNG, WebP, AVIF… or paste with Ctrl+V'),
        async onFiles(list) {
          for (const f of list.filter(f => f.type.startsWith('image/') && f.type !== 'image/svg+xml')) {
            try { items.push({ file: f, img: await loadImage(f), out: null }); } catch { toast(L('No se pudo abrir ', 'Could not open ') + f.name, 'bad'); }
          }
          paint();
        },
      });

      const pct = (a, b) => Math.round((1 - b / a) * 100);
      function paint() {
        $('#cpGo', body).disabled = !items.length;
        $('#cpTable', body).innerHTML = items.length ? `<thead><tr><th></th><th>${L('Archivo', 'File')}</th><th class="num">${L('Antes', 'Before')}</th><th class="num">${L('Después', 'After')}</th><th></th></tr></thead><tbody>${items.map((it, i) => `
          <tr class="${i === sel ? 'sel' : ''}" data-sel="${i}" style="cursor:pointer">
            <td><img src="${it.img.src}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px"></td>
            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.file.name)}</td>
            <td class="num small">${fmtBytes(it.file.size)}</td>
            <td class="num small">${it.out ? `<b>${fmtBytes(it.out.blob.size)}</b> <span class="${it.out.kept ? 'muted' : 'cp-ok'}">${it.out.kept ? L('(original)', '(original)') : '−' + pct(it.file.size, it.out.blob.size) + '%'}</span>${it.out.missed ? ' ⚠' : ''}` : '—'}</td>
            <td>${it.out ? `<button class="icon-btn" data-dl="${i}" title="${L('Descargar', 'Download')}">⬇</button>` : `<button class="icon-btn" data-x="${i}" title="${L('Quitar', 'Remove')}">✕</button>`}</td></tr>`).join('')}</tbody>` : '';
        compare();
      }
      // Comparador antes/después con deslizador
      function compare() {
        const box = $('#cpCmp', body), it = items[sel];
        if (box._url) { URL.revokeObjectURL(box._url); box._url = null; }
        if (!it || !it.out || it.out.kept) { box.innerHTML = ''; return; }
        box._url = URL.createObjectURL(it.out.blob);
        box.innerHTML = `<div class="cmp" style="--x:50%"><img src="${it.img.src}" alt="${L('Original', 'Original')}"><img class="cmp-top" src="${box._url}" alt="${L('Comprimida', 'Compressed')}">
          <span class="cmp-tag l">${L('Comprimida', 'Compressed')}</span><span class="cmp-tag r">Original</span></div>
          <input type="range" class="cmp-range" min="0" max="100" value="50" aria-label="${L('Comparar', 'Compare')}">`;
        $('.cmp-range', box).oninput = e => $('.cmp', box).style.setProperty('--x', e.target.value + '%');
      }
      $('#cpTable', body).onclick = e => {
        const x = e.target.closest('[data-x]'), dl = e.target.closest('[data-dl]'), row = e.target.closest('[data-sel]');
        if (x) { const [r] = items.splice(+x.dataset.x, 1); URL.revokeObjectURL(r.img.src); sel = Math.min(sel, items.length - 1); return paint(); }
        if (dl) { const it = items[+dl.dataset.dl]; return BD.download(it.out.blob, it.out.name); }
        if (row) { sel = +row.dataset.sel; paint(); }
      };

      $('#cpGo', body).onclick = async () => {
        sync();
        const btn = $('#cpGo', body), st = $('#cpSt', body);
        btn.disabled = true;
        const names = new Set();
        try {
          for (let i = 0; i < items.length; i++) {
            st.innerHTML = `<span class="spin"></span> ${i + 1}/${items.length}`;
            const it = items[i], r = await compress(it, o);
            const kept = o.keep && r.blob.size >= it.file.size;
            const ext = kept ? (it.file.name.split('.').pop() || 'img') : EXT[r.type];
            let name = `${baseName(it.file.name)}${kept ? '' : '-min'}.${ext}`, n = 2;
            while (names.has(name)) name = `${baseName(it.file.name)}-min-${n++}.${ext}`;
            names.add(name);
            it.out = { blob: kept ? it.file : r.blob, name, kept, missed: r.missed && !kept };
          }
        } catch (e) { toast(e.message, 'bad'); btn.disabled = false; st.textContent = ''; return; }
        paint();
        const before = items.reduce((a, i) => a + i.file.size, 0), after = items.reduce((a, i) => a + i.out.blob.size, 0);
        st.textContent = `✓ ${fmtBytes(before)} → ${fmtBytes(after)} (−${pct(before, after)}%)`;
        store.set('compress:saved', store.get('compress:saved', 0) + Math.max(0, before - after));
        if (items.some(i => i.out.missed)) toast(L('⚠ Alguna imagen no llegó al peso pedido: se dejó lo más ligera posible.', '⚠ Some images could not reach the target size: they were made as light as possible.'));
        const outs = items.map(i => i.out);
        if (outs.length === 1) BD.download(outs[0].blob, outs[0].name);
        else await BD.zipAndDownload(outs, 'braindeck-comprimidas.zip');
        btn.disabled = false;
      };
      sync();
      return () => { items.forEach(i => URL.revokeObjectURL(i.img.src)); const b = $('#cpCmp', body); if (b && b._url) URL.revokeObjectURL(b._url); };
    },
  });
})();
