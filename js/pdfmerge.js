'use strict';
/* Unir PDFs: ordena, elige páginas, gira y añade imágenes como páginas. Todo en el navegador con pdf-lib. */
(() => {
  const { $, esc, win, toast, L, fmtBytes, baseName } = BD;

  // "1-3, 5, 8-" → índices (base 0). Vacío = todas.
  function pages(range, total) {
    if (!range.trim()) return [...Array(total).keys()];
    const out = [];
    for (const part of range.split(/[,;\s]+/).filter(Boolean)) {
      const m = part.match(/^(\d*)\s*-\s*(\d*)$/);
      const [a, b] = m ? [+m[1] || 1, +m[2] || total] : [+part, +part];
      if (!a) continue;
      for (let i = Math.max(1, a); i <= Math.min(total, b); i++) out.push(i - 1);
    }
    return out;
  }
  // Imágenes que pdf-lib no incrusta directamente (WebP, GIF…) → PNG
  async function imageBytes(file) {
    if (/image\/(jpeg|png)/.test(file.type)) return { bytes: await file.arrayBuffer(), png: file.type === 'image/png' };
    const img = await BD.loadImage(file);
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0); URL.revokeObjectURL(img.src);
    return { bytes: await (await BD.canvasBlob(c, 'image/png')).arrayBuffer(), png: true };
  }

  BD.tool({
    path: '/unir-pdf', cat: 'media', title: 'Unir PDFs', short: 'Unir PDFs', icon: BD.icon('files'),
    colors: ['#ffb1b1', '#ff4d5e'], desc: 'Junta varios PDF (e imágenes) en uno: ordénalos, elige páginas y gíralas. No se sube nada.',
    render(view) {
      const body = win(view, { title: L('Unir PDFs', 'Merge PDFs'), sub: L(
        'Arrastra tus PDF o imágenes, ordénalos y elige qué páginas entran de cada uno. Todo ocurre en tu navegador: tus documentos no se suben a ningún servidor.',
        'Drop your PDFs or images, sort them and pick which pages go in from each. Everything happens in your browser: your documents are never uploaded.') });
      let items = [];
      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div id="pmDrop"></div>
            <div class="stack" id="pmList"></div>
          </div>
          <div class="card stack">
            <label class="field"><span>${L('Nombre del archivo final', 'Output file name')}</span><input type="text" id="pmName" value="${L('unido', 'merged')}"></label>
            <div class="note-box small">${L('Páginas: deja vacío para incluir todas, o escribe rangos como <b>1-3, 5, 8-</b>.', 'Pages: leave empty to include all, or type ranges like <b>1-3, 5, 8-</b>.')}</div>
            <div class="row"><button class="btn primary" id="pmGo" disabled>${L('Unir y descargar', 'Merge & download')}</button><span class="muted small" id="pmSt"></span></div>
          </div>
        </div>`;

      BD.dropzone($('#pmDrop', body), {
        accept: 'application/pdf,.pdf,image/*', icon: '📑', label: L('Arrastra PDFs o imágenes', 'Drop PDFs or images'), hint: L('Se añaden en el orden en que los sueltes', 'They are added in the order you drop them'),
        async onFiles(list) {
          await BD.loadScript(BD.LIB.pdflib);
          for (const f of list) {
            const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
            if (!isPdf && !f.type.startsWith('image/')) continue;
            try {
              const it = { file: f, isPdf, range: '', rot: 0, count: 1 };
              if (isPdf) { it.bytes = await f.arrayBuffer(); it.count = (await PDFLib.PDFDocument.load(it.bytes, { ignoreEncryption: true })).getPageCount(); }
              items.push(it);
            } catch (e) { console.error(e); toast(L('No se pudo leer ', 'Couldn\'t read ') + f.name, 'bad'); }
          }
          paint();
        },
      });

      function paint() {
        $('#pmGo', body).disabled = !items.length;
        $('#pmList', body).innerHTML = items.map((it, i) => `
          <div class="card row" style="padding:12px">
            <span style="font-size:1.4rem">${it.isPdf ? '📄' : '🖼️'}</span>
            <div style="flex:1;min-width:150px"><b translate="no" style="word-break:break-all">${esc(it.file.name)}</b>
              <div class="muted small">${it.isPdf ? `${it.count} ${L('págs.', 'pages')} · ` : ''}${fmtBytes(it.file.size)}</div></div>
            ${it.isPdf ? `<input type="text" data-range="${i}" value="${esc(it.range)}" placeholder="${L('todas', 'all')}" style="width:110px" title="${L('Páginas', 'Pages')}">` : ''}
            <button class="icon-btn" data-rot="${i}" title="${L('Girar 90°', 'Rotate 90°')}">⟳${it.rot ? `<small>${it.rot}</small>` : ''}</button>
            <button class="icon-btn" data-up="${i}" title="${L('Subir', 'Move up')}" ${i ? '' : 'disabled'}>↑</button>
            <button class="icon-btn" data-down="${i}" title="${L('Bajar', 'Move down')}" ${i < items.length - 1 ? '' : 'disabled'}>↓</button>
            <button class="icon-btn" data-x="${i}" title="${L('Quitar', 'Remove')}">✕</button>
          </div>`).join('');
      }
      const list = $('#pmList', body);
      list.oninput = e => { const i = e.target.dataset.range; if (i !== undefined) items[i].range = e.target.value; };
      list.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        const { rot, up, down, x } = b.dataset;
        if (rot !== undefined) items[rot].rot = (items[rot].rot + 90) % 360;
        if (up !== undefined) [items[up - 1], items[up]] = [items[up], items[up - 1]];
        if (down !== undefined) [items[+down + 1], items[down]] = [items[down], items[+down + 1]];
        if (x !== undefined) items.splice(+x, 1);
        paint();
      };

      $('#pmGo', body).onclick = async () => {
        const btn = $('#pmGo', body), st = $('#pmSt', body);
        btn.disabled = true;
        try {
          await BD.loadScript(BD.LIB.pdflib);
          const { PDFDocument, degrees } = PDFLib;
          const out = await PDFDocument.create();
          for (let n = 0; n < items.length; n++) {
            const it = items[n];
            st.innerHTML = `<span class="spin"></span> ${n + 1}/${items.length}`;
            if (it.isPdf) {
              const src = await PDFDocument.load(it.bytes, { ignoreEncryption: true });
              const idx = pages(it.range, src.getPageCount());
              if (!idx.length) throw new Error(L(`Rango sin páginas en ${it.file.name}`, `Range has no pages in ${it.file.name}`));
              (await out.copyPages(src, idx)).forEach(p => { if (it.rot) p.setRotation(degrees((p.getRotation().angle + it.rot) % 360)); out.addPage(p); });
            } else {
              const { bytes, png } = await imageBytes(it.file);
              const img = png ? await out.embedPng(bytes) : await out.embedJpg(bytes);
              const p = out.addPage([img.width, img.height]);
              p.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
              if (it.rot) p.setRotation(degrees(it.rot));
            }
          }
          const bytes = await out.save();
          const name = (baseName($('#pmName', body).value.trim()) || 'merged').replace(/[\\/:*?"<>|]/g, '') + '.pdf';
          BD.download(new Blob([bytes], { type: 'application/pdf' }), name);
          st.textContent = `✓ ${out.getPageCount()} ${L('páginas', 'pages')} · ${fmtBytes(bytes.length)}`;
        } catch (e) {
          console.error(e);
          const msg = /encrypt/i.test(e.message) ? L('Uno de los PDF está protegido con contraseña.', 'One of the PDFs is password-protected.') : e.message;
          st.textContent = '⚠ ' + msg; toast(msg, 'bad');
        }
        btn.disabled = false;
      };
    },
  });
})();
