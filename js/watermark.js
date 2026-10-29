'use strict';
/* BWM web: marcas de agua en lote + metadatos de autor y señal "no-AI" (XMP / EXIF / PNG iTXt) */
(() => {
  const { $, $$, esc, win, store, settings, toast, loadImage, canvasBlob, baseName, num } = BD;
  const enc = new TextEncoder();

  // ---------- metadatos ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = bytes => { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const concat = parts => { const len = parts.reduce((a, p) => a + p.length, 0); const out = new Uint8Array(len); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; }); return out; };
  const u32 = n => new Uint8Array([n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255]);
  const xmlEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function buildXMP(m) {
    const alt = v => `<rdf:Alt><rdf:li xml:lang="x-default">${xmlEsc(v)}</rdf:li></rdf:Alt>`;
    return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/">
   <dc:creator><rdf:Seq><rdf:li>${xmlEsc(m.author)}</rdf:li></rdf:Seq></dc:creator>
   <dc:rights>${alt(m.copyright)}</dc:rights>
   ${m.title ? `<dc:title>${alt(m.title)}</dc:title>` : ''}
   <photoshop:Credit>${xmlEsc(m.author)}</photoshop:Credit>
   <xmpRights:Marked>True</xmpRights:Marked>
   ${m.web ? `<xmpRights:WebStatement>${xmlEsc(m.web)}</xmpRights:WebStatement>` : ''}
   <xmpRights:UsageTerms>${alt(m.terms)}</xmpRights:UsageTerms>
   ${m.noAI ? `<plus:DataMining>http://ns.useplus.org/ldf/vocab/DMI-PROHIBITED</plus:DataMining>
   <plus:OtherConstraints>${alt('No AI/ML training, no text-and-data mining (EU DSM Directive art. 4 opt-out). ' + m.terms)}</plus:OtherConstraints>` : ''}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  }

  function pngInject(bytes, m) {
    const chunk = (type, data) => { const td = concat([enc.encode(type), data]); return concat([u32(data.length), td, u32(crc32(td))]); };
    // iTXt: keyword\0 compFlag compMethod lang\0 transKeyword\0 text(utf8)
    const itxt = (key, text) => chunk('iTXt', concat([enc.encode(key), new Uint8Array([0, 0, 0, 0, 0]), enc.encode(text)]));
    const extra = [
      itxt('Author', m.author), itxt('Copyright', m.copyright), itxt('Disclaimer', m.terms),
      m.web && itxt('Source', m.web),
      itxt('XML:com.adobe.xmp', buildXMP(m)),
    ].filter(Boolean);
    const ihdrEnd = 8 + 8 + 13 + 4; // firma + (len+type) + IHDR data + crc
    return concat([bytes.slice(0, ihdrEnd), ...extra, bytes.slice(ihdrEnd)]);
  }

  function exifSegment(m) {
    const tags = [[0x010E, m.terms], [0x013B, m.author], [0x8298, m.copyright]].map(([t, s]) => [t, concat([enc.encode(s), new Uint8Array([0])])]);
    const ifdSize = 2 + tags.length * 12 + 4;
    let dataOff = 8 + ifdSize;
    const tiff = new Uint8Array(dataOff + tags.reduce((a, [, v]) => a + v.length + (v.length & 1), 0));
    const dv = new DataView(tiff.buffer);
    tiff.set([0x49, 0x49, 0x2A, 0x00]); dv.setUint32(4, 8, true); dv.setUint16(8, tags.length, true);
    tags.forEach(([tag, val], i) => {
      const p = 10 + i * 12;
      dv.setUint16(p, tag, true); dv.setUint16(p + 2, 2, true); dv.setUint32(p + 4, val.length, true);
      if (val.length <= 4) tiff.set(val, p + 8);
      else { dv.setUint32(p + 8, dataOff, true); tiff.set(val, dataOff); dataOff += val.length + (val.length & 1); }
    });
    return concat([enc.encode('Exif'), new Uint8Array([0, 0]), tiff]);
  }
  function jpegInject(bytes, m) {
    const seg = (marker, payload) => { const len = payload.length + 2; return concat([new Uint8Array([0xFF, marker, len >> 8, len & 255]), payload]); };
    const add = [
      seg(0xE1, exifSegment(m)),
      seg(0xE1, concat([enc.encode('http://ns.adobe.com/xap/1.0/'), new Uint8Array([0]), enc.encode(buildXMP(m))])),
      seg(0xFE, enc.encode(`${m.copyright}. ${m.terms}`)),
    ];
    let at = 2; // tras SOI; si hay APP0 (JFIF) lo respetamos
    if (bytes[2] === 0xFF && bytes[3] === 0xE0) at = 4 + (bytes[4] << 8 | bytes[5]);
    return concat([bytes.slice(0, at), ...add, bytes.slice(at)]);
  }

  function readMeta(bytes) {
    const s = new TextDecoder('latin1').decode(bytes);
    const a = s.indexOf('<x:xmpmeta'), b = s.indexOf('</x:xmpmeta>');
    if (a < 0 || b < 0) return null;
    const xmp = new TextDecoder().decode(bytes.slice(a, b + 12));
    const get = re => (xmp.match(re) || [])[1];
    return {
      Autor: get(/<dc:creator>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/),
      Copyright: get(/<dc:rights>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/),
      'Términos de uso': get(/<xmpRights:UsageTerms>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/),
      Web: get(/<xmpRights:WebStatement>([\s\S]*?)</),
      'Minería de datos / IA': get(/<plus:DataMining>([\s\S]*?)</),
    };
  }

  // ---------- dibujo de la marca ----------
  const FONTS = { outfit: "600 {s}px 'Outfit', sans-serif", inter: "800 {s}px 'Inter', sans-serif", serif: "italic 600 {s}px Georgia, serif", mono: "600 {s}px 'JetBrains Mono', monospace", pixel: "700 {s}px 'Pixelify Sans', sans-serif" };
  function drawMark(ctx, w, h, o, seed = Math.random()) {
    const base = Math.min(w, h), fs = Math.max(8, base * o.size / 100), m = base * 0.035;
    ctx.save();
    ctx.font = FONTS[o.font].replace('{s}', fs.toFixed(1));
    ctx.globalAlpha = o.opacity / 100;
    ctx.fillStyle = o.color;
    if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = fs * .18; ctx.shadowOffsetY = fs * .05; }
    const tw = ctx.measureText(o.text).width;
    if (o.pos === 'tile') {
      ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const sx = tw + fs * 2.5, sy = fs * 3.2, R = Math.hypot(w, h) / 2;
      for (let y = -R, row = 0; y <= R; y += sy, row++)
        for (let x = -R + (row % 2) * sx / 2; x <= R; x += sx) ctx.fillText(o.text, x, y);
      ctx.restore(); return;
    }
    let x, y;
    const dx = o.dx / 100 * w, dy = o.dy / 100 * h;
    ctx.textBaseline = 'middle';
    switch (o.pos) {
      case 'tl': ctx.textAlign = 'left'; x = m; y = m + fs / 2; break;
      case 'tr': ctx.textAlign = 'right'; x = w - m; y = m + fs / 2; break;
      case 'bl': ctx.textAlign = 'left'; x = m; y = h - m - fs / 2; break;
      case 'br': ctx.textAlign = 'right'; x = w - m; y = h - m - fs / 2; break;
      case 'random': {
        ctx.textAlign = 'center';
        const r1 = seed, r2 = (seed * 9301 + 0.4927) % 1;
        x = m + tw / 2 + r1 * Math.max(0, w - 2 * m - tw); y = m + fs / 2 + r2 * Math.max(0, h - 2 * m - fs); break;
      }
      default: ctx.textAlign = 'center'; x = w / 2 + dx; y = h / 2 + dy;
    }
    ctx.fillText(o.text, x, y);
    ctx.restore();
  }

  BD.tool({
    path: '/marca-agua', cat: 'creativo', title: 'Marca de agua + firma de autor', short: 'Marca de agua', icon: BD.icon('droplet'),
    colors: ['#7cc8ff', '#2f6bff'], desc: 'BWM en la web: marcas de agua en lote, guardables, y metadatos de autor con aviso "no entrenar IA".',
    render(view) {
      const body = win(view, { title: 'Marca de agua (BWM)', sub: 'Agrega tu marca a muchas imágenes a la vez y deja tu firma y tus condiciones de uso dentro del archivo.' });
      const s = settings();
      const o = Object.assign({ text: s.author ? '© ' + s.author : '© Tu nombre', size: 6, opacity: 55, color: '#ffffff', font: 'outfit', pos: 'br', dx: 0, dy: 0, shadow: true, fmt: 'jpeg', q: 92,
        author: s.author, copyright: '', web: '', terms: 'Todos los derechos reservados. Prohibido su uso para entrenar IA.', noAI: true, meta: true }, store.get('wm:opts', {}));
      let files = [], previewIdx = 0, seed = Math.random();
      const saved = () => store.get('wm:saved', []);

      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div id="wDrop"></div>
            <div class="thumbs" id="wThumbs"></div>
            <canvas class="preview" id="wCanvas" width="10" height="10" style="display:none"></canvas>
            <div class="note-box">
              <b>¿Funciona lo de "que la IA no lo copie"?</b> Parcialmente. Los metadatos (autor, copyright, <code>DMI-PROHIBITED</code>) son una
              <b>señal legal</b> válida —en la UE cuenta como reserva de derechos de minería de datos— y algunos rastreadores la respetan,
              pero muchas plataformas (Instagram, X, Discord…) <b>borran los metadatos al subir</b> y un scraper puede ignorarlos.
              La marca de agua visible es la parte que más protege. Para defensa técnica real contra el entrenamiento existen
              Glaze/Nightshade (Univ. de Chicago), que alteran los píxeles; esta app no los reemplaza.
            </div>
          </div>
          <div class="stack">
            <div class="card stack">
              <h3>Marca</h3>
              <label class="field"><span>Texto</span><input type="text" id="wText" value="${esc(o.text)}"></label>
              <div class="row" id="wSaved"></div>
              <div class="row"><button class="btn ghost sm" id="wSave">Guardar marca</button><button class="btn ghost sm" id="wEdit">Actualizar seleccionada</button></div>
              <div class="grid g2">
                <label class="field"><span>Tamaño <b id="wSizeV"></b></span><input type="range" id="wSize" min="1" max="25" step=".5" value="${o.size}"></label>
                <label class="field"><span>Opacidad <b id="wOpV"></b></span><input type="range" id="wOp" min="5" max="100" value="${o.opacity}"></label>
                <label class="field"><span>Color</span><input type="color" id="wColor" value="${o.color}"></label>
                <label class="field"><span>Fuente</span><select id="wFont">${[['outfit', 'Redondeada'], ['inter', 'Bold'], ['serif', 'Serif itálica'], ['mono', 'Mono'], ['pixel', 'Pixel']].map(([v, l]) => `<option value="${v}" ${v === o.font ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
              </div>
              <label class="check"><input type="checkbox" id="wShadow" ${o.shadow ? 'checked' : ''}> Sombra para que se lea en fondos claros</label>
              <span class="label">Posición</span>
              <div id="wPos"></div>
              <div class="grid g2" id="wNudge">
                <label class="field"><span>Mover ← → <b id="wDxV"></b></span><input type="range" id="wDx" min="-40" max="40" value="${o.dx}"></label>
                <label class="field"><span>Mover ↑ ↓ <b id="wDyV"></b></span><input type="range" id="wDy" min="-40" max="40" value="${o.dy}"></label>
              </div>
            </div>
            <div class="card stack">
              <label class="check"><input type="checkbox" id="wMeta" ${o.meta ? 'checked' : ''}> <b>Incrustar metadatos de autor</b></label>
              <div class="grid g2">
                <label class="field"><span>Autor/a</span><input type="text" id="wAuthor" value="${esc(o.author)}"></label>
                <label class="field"><span>Web / contacto</span><input type="url" id="wWeb" value="${esc(o.web)}" placeholder="https://…"></label>
              </div>
              <label class="field"><span>Copyright</span><input type="text" id="wCopy" value="${esc(o.copyright)}" placeholder="© ${new Date().getFullYear()} ${esc(o.author || 'Tu nombre')}"></label>
              <label class="field"><span>Condiciones de uso</span><input type="text" id="wTerms" value="${esc(o.terms)}"></label>
              <label class="check"><input type="checkbox" id="wNoAI" ${o.noAI ? 'checked' : ''}> Marcar como "prohibido para minería de datos / entrenamiento de IA"</label>
            </div>
            <div class="card stack">
              <div class="grid g2">
                <label class="field"><span>Formato de salida</span><select id="wFmt"><option value="jpeg" ${o.fmt === 'jpeg' ? 'selected' : ''}>JPG</option><option value="png" ${o.fmt === 'png' ? 'selected' : ''}>PNG (sin pérdida)</option></select></label>
                <label class="field" id="wQBox"><span>Calidad JPG <b id="wQV"></b></span><input type="range" id="wQ" min="60" max="100" value="${o.q}"></label>
              </div>
              <div class="row"><button class="btn primary" id="wGo" disabled>Procesar imágenes</button><span class="muted small" id="wStatus"></span></div>
            </div>
            <div class="card stack">
              <h3>Verificar metadatos de un archivo</h3>
              <div id="wCheck"></div>
              <div id="wCheckOut"></div>
            </div>
          </div>
        </div>`;

      BD.seg($('#wPos', body), [['tl', '↖'], ['tr', '↗'], ['center', '◎ Centro'], ['bl', '↙'], ['br', '↘'], ['random', '🎲 Aleatoria'], ['tile', '▦ Mosaico']], o.pos, v => { o.pos = v; seed = Math.random(); sync(); });

      const paintSaved = () => {
        const list = saved();
        $('#wSaved', body).innerHTML = list.length ? list.map((t, i) => `<span class="chip" style="cursor:pointer" data-i="${i}">${esc(t)} <b data-rm="${i}" title="Eliminar">✕</b></span>`).join('') : '<span class="muted small">Sin marcas guardadas</span>';
      };
      let selected = -1;
      $('#wSaved', body).onclick = e => {
        const rm = e.target.closest('[data-rm]');
        if (rm) { const l = saved(); l.splice(+rm.dataset.rm, 1); store.set('wm:saved', l); selected = -1; paintSaved(); return; }
        const c = e.target.closest('[data-i]'); if (!c) return;
        selected = +c.dataset.i; $('#wText', body).value = saved()[selected]; sync();
      };
      $('#wSave', body).onclick = () => { const t = $('#wText', body).value.trim(); if (!t) return; const l = saved(); if (!l.includes(t)) { l.push(t); store.set('wm:saved', l); } paintSaved(); toast('Marca guardada'); };
      $('#wEdit', body).onclick = () => { if (selected < 0) return toast('Primero toca una marca guardada'); const l = saved(); l[selected] = $('#wText', body).value.trim(); store.set('wm:saved', l); paintSaved(); toast('Marca actualizada'); };
      paintSaved();

      function sync() {
        Object.assign(o, {
          text: $('#wText', body).value, size: num($('#wSize', body).value), opacity: num($('#wOp', body).value), color: $('#wColor', body).value,
          font: $('#wFont', body).value, shadow: $('#wShadow', body).checked, dx: num($('#wDx', body).value), dy: num($('#wDy', body).value),
          meta: $('#wMeta', body).checked, author: $('#wAuthor', body).value.trim(), web: $('#wWeb', body).value.trim(),
          copyright: $('#wCopy', body).value.trim(), terms: $('#wTerms', body).value.trim(), noAI: $('#wNoAI', body).checked,
          fmt: $('#wFmt', body).value, q: num($('#wQ', body).value),
        });
        store.set('wm:opts', o);
        $('#wSizeV', body).textContent = o.size + '%'; $('#wOpV', body).textContent = o.opacity + '%';
        $('#wDxV', body).textContent = o.dx; $('#wDyV', body).textContent = o.dy; $('#wQV', body).textContent = o.q;
        $('#wNudge', body).classList.toggle('hidden', o.pos !== 'center');
        $('#wQBox', body).classList.toggle('hidden', o.fmt !== 'jpeg');
        preview();
      }
      body.addEventListener('input', e => { if (!e.target.closest('#wCheck')) sync(); });

      async function preview() {
        const cv = $('#wCanvas', body);
        if (!files.length) { cv.style.display = 'none'; return; }
        const img = files[previewIdx].img;
        const k = Math.min(1, 1100 / img.naturalWidth);
        cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
        const ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        drawMark(ctx, cv.width, cv.height, o, seed);
        cv.style.display = 'block';
      }

      BD.dropzone($('#wDrop', body), {
        accept: 'image/*', icon: '🖼️', label: 'Arrastra tus imágenes (o pega con Ctrl+V)', hint: 'JPG, PNG, WebP, GIF, BMP… todo se procesa en tu navegador',
        async onFiles(list) {
          for (const f of list.filter(f => f.type.startsWith('image/'))) {
            try { files.push({ file: f, img: await loadImage(f) }); } catch { toast('No se pudo abrir ' + f.name, 'bad'); }
          }
          paintThumbs(); preview();
        },
      });
      function paintThumbs() {
        $('#wThumbs', body).innerHTML = files.map((f, i) => `<div class="thumb" data-i="${i}" style="${i === previewIdx ? 'outline:2px solid var(--accent)' : ''}"><img src="${f.img.src}" alt=""><button class="x" data-x="${i}">✕</button><span class="cap">${esc(f.file.name)}</span></div>`).join('');
        $('#wGo', body).disabled = !files.length;
        $('#wGo', body).textContent = files.length ? `Procesar ${files.length} imagen${files.length > 1 ? 'es' : ''}` : 'Procesar imágenes';
      }
      $('#wThumbs', body).onclick = e => {
        const x = e.target.closest('[data-x]');
        if (x) { const [r] = files.splice(+x.dataset.x, 1); URL.revokeObjectURL(r.img.src); previewIdx = 0; paintThumbs(); preview(); return; }
        const t = e.target.closest('[data-i]'); if (t) { previewIdx = +t.dataset.i; paintThumbs(); preview(); }
      };

      $('#wGo', body).onclick = async () => {
        sync();
        const btn = $('#wGo', body), status = $('#wStatus', body);
        btn.disabled = true;
        const meta = { author: o.author || 'Desconocido', copyright: o.copyright || `© ${new Date().getFullYear()} ${o.author || ''}`.trim(), web: o.web, terms: o.terms || 'All rights reserved', noAI: o.noAI };
        const out = [];
        for (let i = 0; i < files.length; i++) {
          status.innerHTML = `<span class="spin"></span> ${i + 1}/${files.length}`;
          const { file, img } = files[i];
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          const ctx = c.getContext('2d');
          if (o.fmt === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
          ctx.drawImage(img, 0, 0);
          drawMark(ctx, c.width, c.height, o, Math.random());
          const blob = await canvasBlob(c, 'image/' + o.fmt, o.q / 100);
          let bytes = new Uint8Array(await blob.arrayBuffer());
          if (o.meta) bytes = o.fmt === 'png' ? pngInject(bytes, meta) : jpegInject(bytes, meta);
          out.push({ name: `${baseName(file.name)}_wm.${o.fmt === 'jpeg' ? 'jpg' : 'png'}`, blob: new Blob([bytes], { type: 'image/' + o.fmt }) });
        }
        if (out.length === 1) BD.download(out[0].blob, out[0].name);
        else await BD.zipAndDownload(out, 'braindeck-marcas.zip');
        status.textContent = `✓ ${out.length} listas`;
        btn.disabled = false;
      };

      BD.dropzone($('#wCheck', body), {
        accept: 'image/jpeg,image/png', multiple: false, paste: false, icon: '🔍', label: 'Sube una imagen para ver su firma', hint: 'Lee el bloque XMP',
        async onFiles([f]) {
          const m = readMeta(new Uint8Array(await f.arrayBuffer()));
          $('#wCheckOut', body).innerHTML = m
            ? `<div class="lines">${Object.entries(m).filter(([, v]) => v).map(([k, v]) => `<div class="line"><span>${k}</span><span style="text-align:right">${esc(v.replace('http://ns.useplus.org/ldf/vocab/', ''))}</span></div>`).join('')}</div>`
            : '<p class="muted">No se encontraron metadatos XMP en este archivo (puede que una plataforma los haya borrado).</p>';
        },
      });
      sync();
      return () => files.forEach(f => URL.revokeObjectURL(f.img.src));
    },
  });
})();
