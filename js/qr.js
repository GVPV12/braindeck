'use strict';
/* Generador de QR: enlace, texto, WiFi, contacto, email o WhatsApp, con tus colores, estilo de puntos y logo. PNG y SVG. */
(() => {
  const { $, esc, win, store, toast, L } = BD;
  const QRLIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  const PRESETS = [['Portfolio', 'https://grevaleart.com/'], ['Ko-fi', 'https://ko-fi.com/grevaleart'], ['VGen', 'https://vgen.co/grevaleart'], ['YouTube', 'https://www.youtube.com/@grevaleart'], ['GitHub', 'https://github.com/GVPV12']];
  const wifiEsc = s => s.replace(/([\\;,:"])/g, '\\$1');

  function payload(t, f) {
    if (t === 'url') return f.url.trim() && (/^[a-z]+:/i.test(f.url.trim()) ? f.url.trim() : 'https://' + f.url.trim());
    if (t === 'text') return f.text;
    if (t === 'email') return f.email && `mailto:${f.email}${f.subject ? '?subject=' + encodeURIComponent(f.subject) : ''}`;
    if (t === 'wifi') return f.ssid && `WIFI:T:${f.sec};S:${wifiEsc(f.ssid)};${f.sec !== 'nopass' ? `P:${wifiEsc(f.pass)};` : ''}${f.hidden ? 'H:true;' : ''};`;
    if (t === 'whatsapp') return f.phone && `https://wa.me/${f.phone.replace(/\D/g, '')}${f.msg ? '?text=' + encodeURIComponent(f.msg) : ''}`;
    if (t === 'vcard') return f.vname && ['BEGIN:VCARD', 'VERSION:3.0', `FN:${f.vname}`, f.vorg && `ORG:${f.vorg}`, f.vphone && `TEL:${f.vphone}`, f.vemail && `EMAIL:${f.vemail}`, f.vurl && `URL:${f.vurl}`, 'END:VCARD'].filter(Boolean).join('\n');
    return '';
  }
  // Matriz de módulos (UTF-8 → bytes para que acentos y emojis funcionen)
  function matrix(text, ec) {
    const q = qrcode(0, ec); q.addData(unescape(encodeURIComponent(text))); q.make();
    const n = q.getModuleCount();
    return { n, dark: (r, c) => r >= 0 && c >= 0 && r < n && c < n && q.isDark(r, c) };
  }
  const isFinder = (r, c, n) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };

  // Dibujo común para canvas y SVG: devuelve una lista de formas
  function shapes(m, o) {
    const out = [], { n } = m, s = o.style;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!m.dark(r, c) || isFinder(r, c, n)) continue;
      if (o.logo && Math.abs(r - n / 2 + .5) < n * o.logoSize / 200 + .5 && Math.abs(c - n / 2 + .5) < n * o.logoSize / 200 + .5) continue; // hueco para el logo
      out.push(s === 'dots' ? { t: 'circle', x: c + .5, y: r + .5, r: .42 } : { t: 'rect', x: c, y: r, w: 1, h: 1, rx: s === 'rounded' ? .38 : 0 });
    }
    // ojos (esquinas): marco 7×7 + centro 3×3
    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r, c]) => {
      const rx = s === 'square' ? 0 : s === 'dots' ? 3.5 : 1.8;
      out.push({ t: 'frame', x: c, y: r, rx }, { t: 'rect', x: c + 2, y: r + 2, w: 3, h: 3, rx: s === 'square' ? 0 : s === 'dots' ? 1.5 : .9, eye: true });
    });
    return out;
  }
  function svg(m, o, logoData) {
    const q = 4, N = m.n + q * 2, sh = shapes(m, o);
    const fill = o.grad ? 'url(#g)' : o.fg, eye = o.eye || o.fg;
    const body = sh.map(x => x.t === 'circle' ? `<circle cx="${x.x + q}" cy="${x.y + q}" r="${x.r}"/>`
      : x.t === 'frame' ? `<path fill-rule="evenodd" fill="${eye}" d="${rr(x.x + q, x.y + q, 7, 7, x.rx)} ${rr(x.x + q + 1, x.y + q + 1, 5, 5, Math.max(0, x.rx - 1))}"/>`
      : `<rect x="${x.x + q}" y="${x.y + q}" width="${x.w}" height="${x.h}" rx="${x.rx}"${x.eye ? ` fill="${eye}"` : ''}/>`).join('');
    const ls = o.logo && logoData ? m.n * o.logoSize / 100 : 0;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="${o.style === 'square' ? 'crispEdges' : 'geometricPrecision'}">
${o.grad ? `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.fg}"/><stop offset="1" stop-color="${o.fg2}"/></linearGradient></defs>` : ''}
${o.transparent ? '' : `<rect width="${N}" height="${N}" fill="${o.bg}"/>`}<g fill="${fill}">${body}</g>
${ls ? `<rect x="${(N - ls) / 2 - .4}" y="${(N - ls) / 2 - .4}" width="${ls + .8}" height="${ls + .8}" rx="1.2" fill="${o.transparent ? '#fff' : o.bg}"/><image href="${logoData}" x="${(N - ls) / 2}" y="${(N - ls) / 2}" width="${ls}" height="${ls}" preserveAspectRatio="xMidYMid meet"/>` : ''}
</svg>`;
  }
  const rr = (x, y, w, h, r) => r ? `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z` : `M${x} ${y}h${w}v${h}h-${w}z`;
  const toPNG = (svgText, size) => new Promise((ok, ko) => {
    const img = new Image(), url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = size; c.getContext('2d').drawImage(img, 0, 0, size, size); URL.revokeObjectURL(url); c.toBlob(ok, 'image/png'); };
    img.onerror = ko; img.src = url;
  });

  BD.tool({
    path: '/qr', cat: 'media', title: 'Generador de QR', short: 'Códigos QR', icon: BD.icon('qr'),
    colors: ['#e2d4ff', '#8a5cff'], desc: 'Códigos QR para tu portafolio, Ko-fi, WiFi o contacto, con tus colores, estilo de puntos y tu logo. PNG y SVG.',
    render(view) {
      const body = win(view, { title: L('Generador de QR', 'QR code generator'), sub: L(
        'Crea códigos QR con tu estilo para tarjetas, stickers, ferias de arte o tu tienda. Se generan en tu navegador y no caducan: apuntan directo a tu enlace, sin redirecciones de terceros.',
        'Make styled QR codes for business cards, stickers, art fairs or your shop. Generated in your browser and they never expire: they point straight to your link, no third-party redirects.') });
      const o = Object.assign({ type: 'url', f: { url: 'https://grevaleart.com/', sec: 'WPA' }, style: 'rounded', fg: '#141414', fg2: '#8a5cff', grad: false, eye: '', bg: '#ffffff', transparent: false, ec: 'M', logo: false, logoSize: 22, size: 1024 }, store.get('qr:opts', {}));
      let logoData = store.get('qr:logo', null), last = '';
      const TYPES = [['url', L('Enlace', 'Link')], ['text', L('Texto', 'Text')], ['wifi', 'WiFi'], ['vcard', L('Contacto', 'Contact')], ['email', 'Email'], ['whatsapp', 'WhatsApp']];
      body.innerHTML = `
        <div class="split">
          <div class="stack">
            <div class="card stack">
              <div id="qType"></div>
              <div id="qFields" class="stack"></div>
            </div>
            <div class="card stack">
              <div class="field"><span>${L('Estilo de puntos', 'Dot style')}</span><div id="qStyle"></div></div>
              <div class="grid g3">
                <label class="field"><span>${L('Color', 'Color')}</span><input type="color" id="qFg" value="${o.fg}"></label>
                <label class="field"><span>${L('Ojos (esquinas)', 'Eyes (corners)')}</span><input type="color" id="qEye" value="${o.eye || o.fg}"></label>
                <label class="field"><span>${L('Fondo', 'Background')}</span><input type="color" id="qBg" value="${o.bg}"></label>
              </div>
              <div class="row">
                <label class="check"><input type="checkbox" id="qGrad" ${o.grad ? 'checked' : ''}> ${L('Degradado hacia', 'Gradient to')}</label><input type="color" id="qFg2" value="${o.fg2}">
                <label class="check"><input type="checkbox" id="qTr" ${o.transparent ? 'checked' : ''}> ${L('Fondo transparente', 'Transparent background')}</label>
              </div>
              <label class="check"><input type="checkbox" id="qLogo" ${o.logo ? 'checked' : ''}> ${L('Logo en el centro', 'Logo in the center')}</label>
              <div class="stack ${o.logo ? '' : 'hidden'}" id="qLogoBox">
                <div id="qLogoDrop"></div>
                <label class="field"><span>${L('Tamaño del logo', 'Logo size')} <b id="qLogoV"></b></span><input type="range" id="qLogoSize" min="12" max="30" value="${o.logoSize}"></label>
              </div>
              <div class="field"><span>${L('Corrección de errores', 'Error correction')} <span class="muted small">${L('(más alta = aguanta logo y rayones, pero más denso)', '(higher = survives logos and scratches, but denser)')}</span></span><div id="qEc"></div></div>
            </div>
          </div>
          <div class="stack">
            <div class="card stack" style="align-items:center">
              <div class="qr-prev" id="qPrev"></div>
              <span class="muted small" id="qWarn" style="text-align:center"></span>
              <div class="row" style="justify-content:center">
                <select id="qSize"><option value="512">512 px</option><option value="1024">1024 px</option><option value="2048">2048 px (${L('imprenta', 'print')})</option></select>
                <button class="btn primary" id="qPng">PNG</button><button class="btn ghost" id="qSvg">SVG</button><button class="btn ghost" id="qCopy">${L('Copiar imagen', 'Copy image')}</button>
              </div>
            </div>
            <div class="note-box small">💡 ${L('Pruébalo siempre con tu móvil antes de imprimir. Mantén buen contraste (oscuro sobre claro) y deja el margen blanco alrededor.', 'Always test it with your phone before printing. Keep good contrast (dark on light) and leave the white margin around it.')}</div>
          </div>
        </div>`;
      const v = id => $('#' + id, body);
      v('qSize').value = String(o.size);
      const field = (k, label, type = 'text', ph = '') => `<label class="field"><span>${label}</span>${type === 'textarea' ? `<textarea data-f="${k}" rows="4" placeholder="${ph}">${esc(o.f[k] || '')}</textarea>` : `<input type="${type}" data-f="${k}" value="${esc(o.f[k] || '')}" placeholder="${ph}">`}</label>`;
      function fields() {
        const t = o.type;
        v('qFields').innerHTML =
          t === 'url' ? field('url', 'URL', 'url', 'https://…') + `<div class="row">${PRESETS.map(([n, u]) => `<button class="btn ghost sm" data-preset="${u}">${n}</button>`).join('')}<button class="btn ghost sm" data-preset="${location.href.split('#')[0]}#/findme">${L('Estoy en', 'Find me on')}</button></div>`
          : t === 'text' ? field('text', L('Texto', 'Text'), 'textarea')
          : t === 'email' ? field('email', 'Email', 'email') + field('subject', L('Asunto (opcional)', 'Subject (optional)'))
          : t === 'whatsapp' ? field('phone', L('Teléfono con código de país', 'Phone with country code'), 'tel', '+58 412…') + field('msg', L('Mensaje inicial (opcional)', 'Opening message (optional)'))
          : t === 'wifi' ? field('ssid', L('Nombre de la red', 'Network name')) + field('pass', L('Contraseña', 'Password')) +
            `<div class="row"><select data-f="sec">${[['WPA', 'WPA/WPA2/WPA3'], ['WEP', 'WEP'], ['nopass', L('Sin contraseña', 'No password')]].map(([x, l]) => `<option value="${x}" ${o.f.sec === x ? 'selected' : ''}>${l}</option>`).join('')}</select>
              <label class="check"><input type="checkbox" data-f="hidden" ${o.f.hidden ? 'checked' : ''}> ${L('Red oculta', 'Hidden network')}</label></div>
              <p class="muted small" style="margin:0">${L('La contraseña queda dentro del QR: compártelo solo con quien deba conectarse.', 'The password is stored inside the QR: only share it with people who should connect.')}</p>`
          : field('vname', L('Nombre', 'Name')) + field('vorg', L('Empresa / marca', 'Company / brand')) + field('vphone', L('Teléfono', 'Phone'), 'tel') + field('vemail', 'Email', 'email') + field('vurl', 'Web', 'url');
      }
      async function draw() {
        Object.assign(o, { fg: v('qFg').value, fg2: v('qFg2').value, eye: v('qEye').value, bg: v('qBg').value, grad: v('qGrad').checked, transparent: v('qTr').checked, logo: v('qLogo').checked, logoSize: +v('qLogoSize').value, size: +v('qSize').value });
        body.querySelectorAll('[data-f]').forEach(i => o.f[i.dataset.f] = i.type === 'checkbox' ? i.checked : i.value);
        store.set('qr:opts', o);
        v('qLogoBox').classList.toggle('hidden', !o.logo); v('qLogoV').textContent = o.logoSize + '%';
        const text = payload(o.type, o.f), warn = [];
        if (!text) { v('qPrev').innerHTML = `<div class="empty">${L('Completa los datos', 'Fill in the details')}</div>`; last = ''; v('qWarn').textContent = ''; return; }
        await BD.loadScript(QRLIB);
        const ec = o.logo && logoData && 'LM'.includes(o.ec) ? 'H' : o.ec;
        let m; try { m = matrix(text, ec); } catch { v('qPrev').innerHTML = `<div class="empty">${L('Demasiado texto para un QR', 'Too much text for a QR')}</div>`; return; }
        last = svg(m, o, logoData);
        v('qPrev').innerHTML = last;
        const fgL = lum(o.fg), bgL = o.transparent ? 1 : lum(o.bg);
        if (fgL > bgL) warn.push(L('⚠ Colores invertidos (claro sobre oscuro): algunos lectores fallan.', '⚠ Inverted colors (light on dark): some scanners fail.'));
        else if ((bgL + .05) / (fgL + .05) < 4) warn.push(L('⚠ Poco contraste: puede costar escanearlo.', '⚠ Low contrast: it may be hard to scan.'));
        if (ec !== o.ec) warn.push(L('Con logo uso corrección alta (H) automáticamente.', 'With a logo I automatically use high correction (H).'));
        warn.push(`${m.n}×${m.n} · ${text.length} ${L('caracteres', 'chars')}`);
        v('qWarn').textContent = warn.join(' · ');
      }
      BD.seg(v('qType'), TYPES, o.type, x => { o.type = x; fields(); draw(); });
      BD.seg(v('qStyle'), [['square', '■ ' + L('Cuadrados', 'Square')], ['rounded', '▢ ' + L('Redondeados', 'Rounded')], ['dots', '● ' + L('Puntos', 'Dots')]], o.style, x => { o.style = x; draw(); });
      BD.seg(v('qEc'), [['L', 'L 7%'], ['M', 'M 15%'], ['Q', 'Q 25%'], ['H', 'H 30%']], o.ec, x => { o.ec = x; draw(); });
      body.addEventListener('input', draw); body.addEventListener('change', draw);
      body.addEventListener('click', e => { const p = e.target.closest('[data-preset]'); if (p) { o.f.url = p.dataset.preset; fields(); draw(); } });
      BD.dropzone(v('qLogoDrop'), {
        accept: 'image/*', multiple: false, paste: false, icon: '🖼️', label: L('Sube tu logo', 'Upload your logo'), hint: L('PNG con fondo transparente queda mejor', 'A PNG with a transparent background works best'),
        async onFiles([f]) {
          // se reduce a 256 px para que el SVG no pese y se guarde entre visitas
          const img = await BD.loadImage(f), k = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
          c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src);
          logoData = c.toDataURL('image/png'); store.set('qr:logo', logoData); v('qLogo').checked = true; draw();
        },
      });
      const fname = () => 'qr-' + (payload(o.type, o.f) || 'code').replace(/^https?:\/\/(www\.)?/, '').replace(/[^\w-]+/g, '-').slice(0, 30);
      v('qPng').onclick = async () => { if (!last) return; BD.download(await toPNG(last, o.size), fname() + '.png'); };
      v('qSvg').onclick = () => { if (last) BD.download(new Blob([last], { type: 'image/svg+xml' }), fname() + '.svg'); };
      v('qCopy').onclick = async () => {
        if (!last) return;
        try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': toPNG(last, o.size) })]); toast(L('QR copiado: pégalo donde quieras', 'QR copied: paste it anywhere')); }
        catch { toast(L('Tu navegador no deja copiar imágenes; usa PNG.', 'Your browser can\'t copy images; use PNG.'), 'bad'); }
      };
      fields(); draw();
    },
  });
})();
