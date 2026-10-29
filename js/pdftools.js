'use strict';
/* Editar PDF: reordenar, girar, quitar, dividir, numerar páginas, firmar y comprimir. pdf.js para ver, pdf-lib para escribir. Nada se sube. */
(() => {
  const { $, $$, esc, win, store, toast, L, fmtBytes } = BD;

  function ranges(text, total) {
    return text.split(/[,;]+/).map(p => p.trim()).filter(Boolean).map(p => {
      const m = p.match(/^(\d*)\s*-\s*(\d*)$/), [a, b] = m ? [+m[1] || 1, +m[2] || total] : [+p, +p], out = [];
      for (let i = Math.max(1, a); i <= Math.min(total, b); i++) out.push(i - 1);
      return out;
    }).filter(r => r.length);
  }
  async function pdfjs() { await BD.loadScript(BD.LIB.pdf); pdfjsLib.GlobalWorkerOptions.workerSrc = BD.LIB.pdfWorker; return pdfjsLib; }

  BD.tool({
    path: '/editar-pdf', cat: 'media', title: 'Editar PDF', short: 'Editar PDF', icon: BD.icon('filepen'),
    colors: ['#ffd0d0', '#e63946'], desc: 'Divide, gira, quita o reordena páginas, numéralas, firma y comprime tus PDF sin subirlos a ningún sitio.',
    render(view) {
      const body = win(view, { title: L('Editar PDF', 'Edit PDF'), sub: L(
        'Abre un PDF y verás sus páginas: arrástralas para reordenar, gíralas o quítalas. Luego guarda, divide en varios archivos, añade números de página o tu firma, o comprímelo. Todo en tu navegador.',
        'Open a PDF to see its pages: drag to reorder, rotate or remove them. Then save, split into several files, add page numbers or your signature, or compress it. All in your browser.') });
      let bytes = null, name = 'documento', pages = [], sigURL = null, sigMode = 'draw';
      const o = Object.assign({ numbers: false, numPos: 'bc', numFmt: 'n', sign: false, sigPage: 'last', sigPos: 'br', sigW: 25, dpi: 110, q: 70, split: 'each', ranges: '' }, store.get('pdft:opts', {}));

      body.innerHTML = `
        <div id="tDrop"></div>
        <div class="hidden" id="tMain">
          <div class="row" style="margin:12px 0"><b translate="no" id="tName" style="flex:1"></b>
            <button class="btn ghost sm" id="tAll">${L('Seleccionar todas', 'Select all')}</button><button class="btn ghost sm" id="tNone">${L('Ninguna', 'None')}</button>
            <button class="btn ghost sm" id="tRotSel">⟳ ${L('Girar seleccionadas', 'Rotate selected')}</button><button class="btn ghost sm danger" id="tDelSel">✕ ${L('Quitar seleccionadas', 'Remove selected')}</button>
            <button class="btn ghost sm" id="tNew">${L('Abrir otro', 'Open another')}</button></div>
          <div class="pdf-grid" id="tGrid"></div>
          <div class="grid g3" style="margin-top:18px">
            <div class="card stack">
              <h3 style="margin:0">💾 ${L('Guardar PDF editado', 'Save edited PDF')}</h3>
              <label class="check"><input type="checkbox" id="tNum" ${o.numbers ? 'checked' : ''}> ${L('Números de página', 'Page numbers')}</label>
              <div class="row" id="tNumOpts"><select id="tNumPos"><option value="bc">${L('Abajo centro', 'Bottom center')}</option><option value="br">${L('Abajo derecha', 'Bottom right')}</option><option value="tr">${L('Arriba derecha', 'Top right')}</option></select>
                <select id="tNumFmt"><option value="n">1</option><option value="nN">1 / 10</option><option value="p">${L('Página 1', 'Page 1')}</option></select></div>
              <label class="check"><input type="checkbox" id="tSign" ${o.sign ? 'checked' : ''}> ${L('Añadir mi firma', 'Add my signature')}</label>
              <div class="stack hidden" id="tSigBox">
                <div id="tSigMode"></div>
                <canvas id="tSigPad" class="sig-pad" width="600" height="200"></canvas>
                <input type="text" id="tSigText" class="hidden" placeholder="${L('Escribe tu nombre', 'Type your name')}">
                <div class="row"><button class="btn ghost sm" id="tSigClear">${L('Borrar firma', 'Clear')}</button>
                  <select id="tSigPage"><option value="last">${L('Última página', 'Last page')}</option><option value="first">${L('Primera página', 'First page')}</option><option value="all">${L('Todas', 'All pages')}</option></select>
                  <select id="tSigPos"><option value="br">${L('Abajo derecha', 'Bottom right')}</option><option value="bl">${L('Abajo izquierda', 'Bottom left')}</option><option value="bc">${L('Abajo centro', 'Bottom center')}</option></select></div>
                <label class="field"><span>${L('Tamaño de la firma', 'Signature size')} <b id="tSigWV"></b></span><input type="range" id="tSigW" min="10" max="50" value="${o.sigW}"></label>
              </div>
              <button class="btn primary" id="tSave">${L('Guardar PDF', 'Save PDF')}</button>
            </div>
            <div class="card stack">
              <h3 style="margin:0">✂️ ${L('Dividir', 'Split')}</h3>
              <div id="tSplit"></div>
              <input type="text" id="tRanges" value="${esc(o.ranges)}" placeholder="1-3, 4-6, 7-">
              <p class="muted small" style="margin:0">${L('Cada rango se convierte en un PDF. Se descarga un ZIP.', 'Each range becomes a PDF. You get a ZIP.')}</p>
              <button class="btn primary" id="tSplitGo">${L('Dividir', 'Split')}</button>
            </div>
            <div class="card stack">
              <h3 style="margin:0">🗜️ ${L('Comprimir', 'Compress')}</h3>
              <label class="field"><span>${L('Resolución', 'Resolution')} <b id="tDpiV"></b></span><input type="range" id="tDpi" min="60" max="200" step="10" value="${o.dpi}"></label>
              <label class="field"><span>${L('Calidad', 'Quality')} <b id="tQV"></b></span><input type="range" id="tQ" min="30" max="95" step="5" value="${o.q}"></label>
              <p class="muted small" style="margin:0">${L('Convierte cada página en imagen: reduce mucho los PDF escaneados o con fotos, pero el texto deja de poder seleccionarse. 110 ppp / 70% es buen equilibrio.',
                'Turns each page into an image: shrinks scanned or photo-heavy PDFs a lot, but text is no longer selectable. 110 dpi / 70% is a good balance.')}</p>
              <button class="btn primary" id="tComp">${L('Comprimir', 'Compress')}</button>
            </div>
          </div>
          <span class="muted small" id="tSt"></span>
        </div>`;
      const v = id => $('#' + id, body);
      const st = msg => v('tSt').innerHTML = msg;
      const sync = () => {
        Object.assign(o, { numbers: v('tNum').checked, numPos: v('tNumPos').value, numFmt: v('tNumFmt').value, sign: v('tSign').checked, sigPage: v('tSigPage').value, sigPos: v('tSigPos').value,
          sigW: +v('tSigW').value, dpi: +v('tDpi').value, q: +v('tQ').value, ranges: v('tRanges').value });
        store.set('pdft:opts', o);
        v('tNumOpts').classList.toggle('hidden', !o.numbers); v('tSigBox').classList.toggle('hidden', !o.sign);
        v('tSigWV').textContent = o.sigW + '%'; v('tDpiV').textContent = o.dpi + ' ppp'; v('tQV').textContent = o.q + '%';
        v('tRanges').classList.toggle('hidden', o.split !== 'ranges');
      };
      v('tNumPos').value = o.numPos; v('tNumFmt').value = o.numFmt; v('tSigPage').value = o.sigPage; v('tSigPos').value = o.sigPos;
      body.addEventListener('input', sync); body.addEventListener('change', sync);
      BD.seg(v('tSplit'), [['each', L('Cada página', 'Every page')], ['sel', L('Solo seleccionadas', 'Selected only')], ['ranges', L('Por rangos', 'By ranges')]], o.split, x => { o.split = x; sync(); });

      // ---------- abrir y miniaturas ----------
      BD.dropzone(v('tDrop'), {
        accept: 'application/pdf,.pdf', multiple: false, icon: '📄', label: L('Suelta un PDF', 'Drop a PDF'), hint: L('Se procesa en tu navegador', 'Processed in your browser'),
        async onFiles([f]) {
          try {
            bytes = new Uint8Array(await f.arrayBuffer()); name = BD.baseName(f.name);
            const lib = await pdfjs(), doc = await lib.getDocument({ data: bytes.slice() }).promise;
            pages = Array.from({ length: doc.numPages }, (_, i) => ({ src: i, rot: 0, sel: false, thumb: '' }));
            v('tDrop').classList.add('hidden'); v('tMain').classList.remove('hidden');
            v('tName').textContent = `${f.name} · ${doc.numPages} ${L('págs.', 'pages')} · ${fmtBytes(f.size)}`;
            paint();
            for (let i = 0; i < doc.numPages; i++) {
              const pg = await doc.getPage(i + 1), vp = pg.getViewport({ scale: 1 }), k = 160 / vp.width, vv = pg.getViewport({ scale: k });
              const c = document.createElement('canvas'); c.width = vv.width; c.height = vv.height;
              await pg.render({ canvasContext: c.getContext('2d'), viewport: vv }).promise;
              pages.filter(p => p.src === i).forEach(p => p.thumb = c.toDataURL('image/jpeg', .7));
              const img = body.querySelector(`[data-src="${i}"] img`); if (img) img.src = pages.find(p => p.src === i).thumb;
            }
          } catch (e) { console.error(e); toast(/password|encrypt/i.test(e.message) ? L('El PDF tiene contraseña.', 'The PDF is password-protected.') : e.message, 'bad'); }
        },
      });
      v('tNew').onclick = () => { bytes = null; pages = []; v('tMain').classList.add('hidden'); v('tDrop').classList.remove('hidden'); };
      function paint() {
        v('tGrid').innerHTML = pages.map((p, i) => `
          <div class="pdf-page ${p.sel ? 'sel' : ''}" draggable="true" data-i="${i}" data-src="${p.src}">
            <div class="pdf-thumb"><img src="${p.thumb}" alt="" style="transform:rotate(${p.rot}deg)"></div>
            <div class="row" style="justify-content:space-between"><label class="check"><input type="checkbox" data-sel="${i}" ${p.sel ? 'checked' : ''}> ${i + 1}</label>
              <span><button class="icon-btn" data-rot="${i}" title="${L('Girar', 'Rotate')}">⟳</button><button class="icon-btn" data-del="${i}" title="${L('Quitar', 'Remove')}">✕</button></span></div>
          </div>`).join('');
      }
      const grid = v('tGrid');
      grid.onclick = e => {
        const r = e.target.closest('[data-rot]'), d = e.target.closest('[data-del]');
        if (r) { pages[+r.dataset.rot].rot = (pages[+r.dataset.rot].rot + 90) % 360; paint(); }
        if (d) { pages.splice(+d.dataset.del, 1); paint(); }
      };
      grid.onchange = e => { const s = e.target.dataset.sel; if (s !== undefined) { pages[+s].sel = e.target.checked; e.target.closest('.pdf-page').classList.toggle('sel', e.target.checked); } };
      let drag = null;
      grid.ondragstart = e => { drag = +e.target.closest('.pdf-page')?.dataset.i; e.dataTransfer.effectAllowed = 'move'; };
      grid.ondragover = e => { if (drag !== null) e.preventDefault(); };
      grid.ondrop = e => {
        e.preventDefault(); const t = e.target.closest('.pdf-page'); if (!t || drag === null) return;
        const to = +t.dataset.i, [p] = pages.splice(drag, 1); pages.splice(to, 0, p); drag = null; paint();
      };
      v('tAll').onclick = () => { pages.forEach(p => p.sel = true); paint(); };
      v('tNone').onclick = () => { pages.forEach(p => p.sel = false); paint(); };
      v('tRotSel').onclick = () => { pages.forEach(p => { if (p.sel) p.rot = (p.rot + 90) % 360; }); paint(); };
      v('tDelSel').onclick = () => { pages = pages.filter(p => !p.sel); paint(); };

      // ---------- firma ----------
      const pad = v('tSigPad'), px = pad.getContext('2d');
      let drawing = false, signed = false;
      const pos = e => { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * pad.width / r.width, (e.clientY - r.top) * pad.height / r.height]; };
      pad.onpointerdown = e => { drawing = true; signed = true; pad.setPointerCapture(e.pointerId); px.beginPath(); px.moveTo(...pos(e)); };
      pad.onpointermove = e => { if (!drawing) return; px.lineWidth = 3.5; px.lineCap = px.lineJoin = 'round'; px.strokeStyle = '#111'; px.lineTo(...pos(e)); px.stroke(); };
      pad.onpointerup = pad.onpointercancel = () => drawing = false;
      v('tSigClear').onclick = () => { px.clearRect(0, 0, pad.width, pad.height); signed = false; v('tSigText').value = ''; };
      BD.seg(v('tSigMode'), [['draw', '✍️ ' + L('Dibujar', 'Draw')], ['type', '⌨️ ' + L('Escribir', 'Type')]], sigMode, x => { sigMode = x; pad.classList.toggle('hidden', x === 'type'); v('tSigText').classList.toggle('hidden', x === 'draw'); });
      function signaturePNG() {
        if (sigMode === 'type') {
          const t = v('tSigText').value.trim(); if (!t) return null;
          const c = document.createElement('canvas'); c.width = 900; c.height = 220; const x = c.getContext('2d');
          x.fillStyle = '#111'; x.font = "italic 600 110px 'Brush Script MT', 'Segoe Script', cursive"; x.textBaseline = 'middle'; x.fillText(t, 20, 115);
          return c.toDataURL('image/png');
        }
        return signed ? pad.toDataURL('image/png') : null;
      }

      // ---------- escribir ----------
      async function build(idxs, extras = true) {
        await BD.loadScript(BD.LIB.pdflib);
        const { PDFDocument, degrees, StandardFonts, rgb } = PDFLib;
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true }), out = await PDFDocument.create();
        const sel = idxs.map(i => pages[i]);
        const copied = await out.copyPages(src, sel.map(p => p.src));
        copied.forEach((pg, k) => { if (sel[k].rot) pg.setRotation(degrees((pg.getRotation().angle + sel[k].rot) % 360)); out.addPage(pg); });
        if (!extras) return out;
        const all = out.getPages(), N = all.length;
        // tamaño "visual" de la página teniendo en cuenta la rotación
        const box = pg => { const { width, height } = pg.getSize(), r = pg.getRotation().angle % 180 !== 0; return r ? { w: height, h: width } : { w: width, h: height }; };
        const place = (pg, x, y, w, h) => {
          const a = pg.getRotation().angle % 360, { width, height } = pg.getSize();
          // convierte coordenadas visuales → coordenadas de la página sin rotar
          if (a === 90) return { x: y, y: height - x - w, rotate: degrees(90), w, h };
          if (a === 180) return { x: width - x - w, y: height - y - h, rotate: degrees(180), w, h };
          if (a === 270) return { x: width - y, y: x + w, rotate: degrees(270), w, h };
          return { x, y, rotate: degrees(0), w, h };
        };
        if (o.numbers) {
          const font = await out.embedFont(StandardFonts.Helvetica);
          all.forEach((pg, i) => {
            const t = o.numFmt === 'nN' ? `${i + 1} / ${N}` : o.numFmt === 'p' ? `${L('Página', 'Page')} ${i + 1}` : String(i + 1);
            const { w, h } = box(pg), size = Math.max(8, Math.min(12, w / 50)), tw = font.widthOfTextAtSize(t, size), m = 24;
            const X = o.numPos === 'bc' ? (w - tw) / 2 : w - m - tw, Y = o.numPos === 'tr' ? h - m - size : m;
            const p = place(pg, X, Y, tw, size);
            pg.drawText(t, { x: p.x, y: p.y, size, font, color: rgb(.25, .25, .25), rotate: p.rotate });
          });
        }
        if (o.sign) {
          const data = signaturePNG();
          if (!data) throw new Error(L('Dibuja o escribe tu firma primero.', 'Draw or type your signature first.'));
          const img = await out.embedPng(data);
          const targets = o.sigPage === 'all' ? all : [o.sigPage === 'first' ? all[0] : all[N - 1]];
          targets.forEach(pg => {
            const { w, h } = box(pg), sw = w * o.sigW / 100, sh = sw * img.height / img.width, m = w * .06;
            const X = o.sigPos === 'bl' ? m : o.sigPos === 'bc' ? (w - sw) / 2 : w - m - sw;
            const p = place(pg, X, m, sw, sh);
            pg.drawImage(img, { x: p.x, y: p.y, width: sw, height: sh, rotate: p.rotate });
          });
        }
        return out;
      }
      const run = async (btn, fn) => {
        if (!bytes) return; btn.disabled = true;
        try { await fn(); } catch (e) { console.error(e); st('⚠ ' + esc(e.message)); toast(e.message, 'bad'); }
        btn.disabled = false;
      };
      v('tSave').onclick = e => run(e.currentTarget, async () => {
        sync(); if (!pages.length) throw new Error(L('No quedan páginas.', 'No pages left.'));
        st(`<span class="spin"></span> ${L('Guardando…', 'Saving…')}`);
        const b = await (await build(pages.map((_, i) => i))).save();
        BD.download(new Blob([b], { type: 'application/pdf' }), `${name}_editado.pdf`); st(`✓ ${fmtBytes(b.length)}`);
      });
      v('tSplitGo').onclick = e => run(e.currentTarget, async () => {
        sync();
        const groups = o.split === 'each' ? pages.map((_, i) => [i]) : o.split === 'sel' ? pages.map((p, i) => p.sel ? [i] : null).filter(Boolean) : ranges(o.ranges, pages.length);
        if (!groups.length) throw new Error(o.split === 'sel' ? L('Selecciona páginas primero.', 'Select pages first.') : L('Escribe rangos válidos.', 'Type valid ranges.'));
        const files = [];
        for (let g = 0; g < groups.length; g++) {
          st(`<span class="spin"></span> ${g + 1}/${groups.length}`);
          const idx = groups[g], b = await (await build(idx, false)).save();
          files.push({ name: `${name}_${idx.length === 1 ? 'p' + (idx[0] + 1) : `p${idx[0] + 1}-${idx.at(-1) + 1}`}.pdf`, blob: new Blob([b], { type: 'application/pdf' }) });
        }
        if (files.length === 1) BD.download(files[0].blob, files[0].name); else await BD.zipAndDownload(files, `${name}_dividido.zip`);
        st(`✓ ${files.length} ${L('archivos', 'files')}`);
      });
      v('tComp').onclick = e => run(e.currentTarget, async () => {
        sync();
        const lib = await pdfjs(); await BD.loadScript(BD.LIB.pdflib);
        const doc = await lib.getDocument({ data: bytes.slice() }).promise, out = await PDFLib.PDFDocument.create();
        for (let i = 0; i < pages.length; i++) {
          st(`<span class="spin"></span> ${L('Página', 'Page')} ${i + 1}/${pages.length}`);
          const p = pages[i], pg = await doc.getPage(p.src + 1), vp = pg.getViewport({ scale: o.dpi / 72, rotation: (pg.rotate + p.rot) % 360 });
          const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
          const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
          await pg.render({ canvasContext: x, viewport: vp }).promise;
          const jpg = await out.embedJpg(await (await BD.canvasBlob(c, 'image/jpeg', o.q / 100)).arrayBuffer());
          const w = vp.width * 72 / o.dpi, h = vp.height * 72 / o.dpi, np = out.addPage([w, h]);
          np.drawImage(jpg, { x: 0, y: 0, width: w, height: h });
        }
        const b = await out.save({ useObjectStreams: true });
        BD.download(new Blob([b], { type: 'application/pdf' }), `${name}_comprimido.pdf`);
        st(`✓ ${fmtBytes(bytes.length)} → <b>${fmtBytes(b.length)}</b>${b.length >= bytes.length ? ' · ' + L('no se redujo: prueba menos resolución o calidad', 'not smaller: try lower resolution or quality') : ''}`);
      });
      sync();
    },
  });
})();
