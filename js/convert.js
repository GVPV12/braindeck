'use strict';
/* Conversor y redimensionador de imágenes en lote (alta calidad, todo local) */
(() => {
  const { $, esc, win, store, toast, loadImage, canvasBlob, baseName, fmtBytes, num } = BD;

  const supports = type => { const c = document.createElement('canvas'); c.width = c.height = 1; return c.toDataURL(type).startsWith('data:' + type); };
  const FORMATS = [['image/png', 'PNG', 'png'], ['image/jpeg', 'JPG', 'jpg'], ['image/webp', 'WebP', 'webp'], ['image/avif', 'AVIF', 'avif']].filter(f => supports(f[0]));

  // Reescalado de calidad: createImageBitmap con resizeQuality 'high' si existe; si no, reducción por pasos de 50%.
  async function resize(img, w, h) {
    if (w === img.naturalWidth && h === img.naturalHeight) return img;
    try {
      return await createImageBitmap(img, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
    } catch {
      let src = img, sw = img.naturalWidth, sh = img.naturalHeight;
      while (sw / 2 >= w && sh / 2 >= h) {
        const c = document.createElement('canvas'); c.width = Math.round(sw / 2); c.height = Math.round(sh / 2);
        const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, c.width, c.height);
        src = c; sw = c.width; sh = c.height;
      }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, w, h);
      return c;
    }
  }
  function targetSize(iw, ih, o) {
    if (o.mode === 'pct') { const k = o.pct / 100; return [Math.max(1, Math.round(iw * k)), Math.max(1, Math.round(ih * k))]; }
    if (o.mode === 'fit') {
      const k = Math.min(o.w ? o.w / iw : Infinity, o.h ? o.h / ih : Infinity, o.enlarge ? Infinity : 1);
      return isFinite(k) ? [Math.max(1, Math.round(iw * k)), Math.max(1, Math.round(ih * k))] : [iw, ih];
    }
    if (o.mode === 'exact') return [Math.max(1, o.w || iw), Math.max(1, o.h || ih)];
    return [iw, ih];
  }

  BD.tool({
    path: '/convertir', cat: 'creativo', title: 'Convertir y redimensionar', short: 'Convertir imágenes', icon: BD.icon('image'),
    colors: ['#6ff0e0', '#0fb5a5'], desc: 'Cambia formato (PNG, JPG, WebP, AVIF) y tamaño de una o cientos de imágenes sin pérdida visible.',
    render(view) {
      const body = win(view, { title: 'Convertir y redimensionar', sub: 'Todo ocurre en tu navegador: tus imágenes no se suben a ningún servidor.' });
      const o = Object.assign({ fmt: 'image/webp', q: 90, mode: 'none', pct: 50, w: 1920, h: 1920, enlarge: false, fit: 'contain', bg: '#ffffff', suffix: '' }, store.get('conv:opts', {}));
      if (!FORMATS.some(f => f[0] === o.fmt)) o.fmt = 'image/png';
      let items = [];

      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div id="cvDrop"></div>
            <div class="scroll-x"><table class="table" id="cvTable"></table></div>
          </div>
          <div class="card stack">
            <div class="field"><span>Formato de salida</span><div id="cvFmt"></div></div>
            <label class="field" id="cvQBox"><span>Calidad <b id="cvQV"></b> <span class="muted small">(90+ = sin pérdida visible)</span></span><input type="range" id="cvQ" min="50" max="100" value="${o.q}"></label>
            <div class="field"><span>Tamaño</span><div id="cvMode"></div></div>
            <label class="field" id="cvPctBox"><span>Escala <b id="cvPctV"></b></span><input type="range" id="cvPct" min="5" max="200" step="5" value="${o.pct}"></label>
            <div class="grid g2" id="cvWHBox">
              <label class="field"><span>Ancho (px)</span><input type="number" id="cvW" min="1" value="${o.w || ''}" placeholder="auto"></label>
              <label class="field"><span>Alto (px)</span><input type="number" id="cvH" min="1" value="${o.h || ''}" placeholder="auto"></label>
            </div>
            <label class="check" id="cvEnlBox"><input type="checkbox" id="cvEnl" ${o.enlarge ? 'checked' : ''}> Permitir agrandar (puede perder nitidez)</label>
            <label class="field" id="cvBgBox"><span>Fondo para transparencias (JPG)</span><input type="color" id="cvBg" value="${o.bg}"></label>
            <label class="field"><span>Sufijo del nombre (opcional)</span><input type="text" id="cvSuf" value="${esc(o.suffix)}" placeholder="_web"></label>
            <div class="row"><button class="btn primary" id="cvGo" disabled>Convertir</button><span class="muted small" id="cvSt"></span></div>
            <p class="muted small">Tip: para web usa WebP 85-90; para arte con bordes nítidos o transparencia, PNG. JPG y WebP/AVIF a calidad &lt; 100 comprimen con pérdida (normalmente invisible ≥ 90).</p>
          </div>
        </div>`;

      BD.seg($('#cvFmt', body), FORMATS.map(f => [f[0], f[1]]), o.fmt, v => { o.fmt = v; sync(); });
      BD.seg($('#cvMode', body), [['none', 'Original'], ['pct', '%'], ['fit', 'Máx. ancho/alto'], ['exact', 'Exacto']], o.mode, v => { o.mode = v; sync(); });

      function sync() {
        Object.assign(o, { q: num($('#cvQ', body).value), pct: num($('#cvPct', body).value), w: Math.round(num($('#cvW', body).value)), h: Math.round(num($('#cvH', body).value)),
          enlarge: $('#cvEnl', body).checked, bg: $('#cvBg', body).value, suffix: $('#cvSuf', body).value.trim() });
        store.set('conv:opts', o);
        $('#cvQV', body).textContent = o.q; $('#cvPctV', body).textContent = o.pct + '%';
        $('#cvQBox', body).classList.toggle('hidden', o.fmt === 'image/png');
        $('#cvBgBox', body).classList.toggle('hidden', o.fmt !== 'image/jpeg');
        $('#cvPctBox', body).classList.toggle('hidden', o.mode !== 'pct');
        $('#cvWHBox', body).classList.toggle('hidden', o.mode !== 'fit' && o.mode !== 'exact');
        $('#cvEnlBox', body).classList.toggle('hidden', o.mode !== 'fit');
        paint();
      }
      body.addEventListener('input', e => { if (e.target.closest('.card')) sync(); });

      BD.dropzone($('#cvDrop', body), {
        accept: 'image/*', icon: '🪄', label: 'Arrastra imágenes (una o muchas)', hint: 'PNG, JPG, WebP, GIF, BMP, AVIF, SVG… o pega con Ctrl+V',
        async onFiles(list) {
          for (const f of list.filter(f => f.type.startsWith('image/'))) {
            try { const img = await loadImage(f); items.push({ file: f, img, out: null }); } catch { toast('No se pudo abrir ' + f.name, 'bad'); }
          }
          paint();
        },
      });
      const ext = () => FORMATS.find(f => f[0] === o.fmt)[2];
      function paint() {
        $('#cvGo', body).disabled = !items.length;
        $('#cvTable', body).innerHTML = items.length ? `<thead><tr><th></th><th>Archivo</th><th>Original</th><th>Nuevo</th><th class="num">Peso</th><th></th></tr></thead><tbody>${items.map((it, i) => {
          const [w, h] = targetSize(it.img.naturalWidth || 1, it.img.naturalHeight || 1, o);
          return `<tr><td><img src="${it.img.src}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px"></td>
            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.file.name)}</td>
            <td class="muted small">${it.img.naturalWidth}×${it.img.naturalHeight}</td><td class="small">${w}×${h}.${ext()}</td>
            <td class="num small">${fmtBytes(it.file.size)}${it.out ? ` → <b>${fmtBytes(it.out.blob.size)}</b>` : ''}</td>
            <td>${it.out ? `<button class="icon-btn" data-dl="${i}" title="Descargar">⬇</button>` : `<button class="icon-btn" data-x="${i}" title="Quitar">✕</button>`}</td></tr>`;
        }).join('')}</tbody>` : '';
      }
      $('#cvTable', body).onclick = e => {
        const x = e.target.closest('[data-x]'), dl = e.target.closest('[data-dl]');
        if (x) { const [r] = items.splice(+x.dataset.x, 1); URL.revokeObjectURL(r.img.src); paint(); }
        if (dl) { const it = items[+dl.dataset.dl]; BD.download(it.out.blob, it.out.name); }
      };

      $('#cvGo', body).onclick = async () => {
        sync();
        const btn = $('#cvGo', body), st = $('#cvSt', body);
        btn.disabled = true;
        const names = new Set();
        for (let i = 0; i < items.length; i++) {
          st.innerHTML = `<span class="spin"></span> ${i + 1}/${items.length}`;
          const it = items[i];
          // SVG sin tamaño intrínseco: usamos 1024 de base
          const iw = it.img.naturalWidth || 1024, ih = it.img.naturalHeight || 1024;
          const [w, h] = targetSize(iw, ih, o);
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          if (o.fmt === 'image/jpeg') { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, w, h); }
          if (o.mode === 'exact') {
            // "contain" centrado para no deformar
            const k = Math.min(w / iw, h / ih), dw = Math.round(iw * k), dh = Math.round(ih * k);
            ctx.drawImage(await resize(it.img, dw, dh), Math.round((w - dw) / 2), Math.round((h - dh) / 2));
          } else ctx.drawImage(await resize(it.img, w, h), 0, 0);
          const blob = await canvasBlob(c, o.fmt, o.q / 100);
          let name = `${baseName(it.file.name)}${o.suffix}.${ext()}`, n = 2;
          while (names.has(name)) name = `${baseName(it.file.name)}${o.suffix}-${n++}.${ext()}`;
          names.add(name);
          it.out = { blob, name };
        }
        paint();
        const outs = items.map(i => i.out);
        const before = items.reduce((a, i) => a + i.file.size, 0), after = outs.reduce((a, x) => a + x.blob.size, 0);
        st.textContent = `✓ ${fmtBytes(before)} → ${fmtBytes(after)}`;
        if (outs.length === 1) BD.download(outs[0].blob, outs[0].name);
        else await BD.zipAndDownload(outs, 'braindeck-imagenes.zip');
        btn.disabled = false;
      };
      sync();
      return () => items.forEach(i => URL.revokeObjectURL(i.img.src));
    },
  });
})();
