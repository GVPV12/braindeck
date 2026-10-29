'use strict';
/* Generador de paletas: desde un color, una foto o una palabra. Exporta a Procreate, Photoshop/Illustrator (.ase), GIMP/Krita (.gpl), Blender y CSS. */
(() => {
  const { $, esc, win, store, toast, L } = BD;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- conversiones ----------
  const hexToRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    const h = d ? (mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 : 0;
    return [(h + 360) % 360, s * 100, l * 100];
  }
  const rgbToHsv = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b); const [h] = rgbToHsl(r * 255, g * 255, b * 255); return [h / 360, mx ? d / mx : 0, mx]; };
  const luma = h => { const [r, g, b] = hexToRgb(h); return (r * 299 + g * 587 + b * 114) / 1000; };

  // ---------- esquemas ----------
  const SCHEMES = () => [['analogo', L('Análogo', 'Analogous')], ['complementario', L('Complementario', 'Complementary')], ['triadico', L('Triádico', 'Triadic')],
    ['dividido', L('Complementario dividido', 'Split complementary')], ['mono', L('Monocromático', 'Monochrome')], ['libre', L('Sorpresa', 'Surprise')]];
  function fromHue(h, scheme, n = 5, mood = {}) {
    const S = mood.s ?? rnd(45, 80), Lm = mood.l ?? rnd(40, 62);
    const offs = { analogo: [-30, -15, 0, 15, 30], complementario: [0, 0, 180, 180, 15], triadico: [0, 120, 240, 0, 120], dividido: [0, 150, 210, 0, 30], mono: [0, 0, 0, 0, 0], libre: Array.from({ length: n }, () => rnd(0, 360)) }[scheme] || [0, 30, 180, 200, 60];
    const lights = scheme === 'mono' ? [20, 35, 50, 68, 85] : [Lm - 18, Lm, Lm + 12, Lm - 6, Lm + 28];
    return Array.from({ length: n }, (_, i) => hslToHex(h + offs[i % offs.length] + rnd(-6, 6), clamp(S + rnd(-12, 12) - (i === 4 ? 25 : 0), 5, 100), clamp(lights[i % lights.length] + rnd(-4, 4), 6, 95)));
  }
  // Palabras → tono/saturación/luz (lo que no se reconoce usa la palabra como semilla)
  const MOODS = [
    [/oto[ñn]o|autumn|fall|calabaza|pumpkin/, { h: [15, 45], s: 65, l: 45 }], [/mar|oc[eé]ano|ocean|sea|playa|beach/, { h: [180, 215], s: 60, l: 50 }],
    [/bosque|forest|selva|jungle|musgo|moss|goblin/, { h: [80, 140], s: 45, l: 35 }], [/ne[oó]n|cyber|rave|arcade/, { h: [280, 330, 180], s: 95, l: 55 }],
    [/pastel|kawaii|algod[oó]n|cotton|candy|dulce/, { h: [300, 360, 180], s: 70, l: 82 }], [/atardecer|sunset|amanecer|sunrise/, { h: [330, 360, 40], s: 80, l: 60 }],
    [/noche|night|luna|moon|dark|goth|g[oó]tic/, { h: [230, 280], s: 45, l: 22 }], [/invierno|winter|hielo|ice|nieve|snow/, { h: [190, 220], s: 35, l: 80 }],
    [/primavera|spring|flor|flower|blossom|cottage/, { h: [90, 130, 330], s: 55, l: 72 }], [/desierto|desert|arena|sand/, { h: [25, 45], s: 40, l: 65 }],
    [/caf[eé]|coffee|chocolate|madera|wood/, { h: [20, 35], s: 40, l: 35 }], [/fuego|fire|lava|volc/, { h: [0, 45], s: 90, l: 50 }],
    [/vapor|y2k|retro|90s|80s/, { h: [290, 180, 330], s: 75, l: 65 }], [/vintage|antiguo|old|sepia/, { h: [25, 50, 180], s: 30, l: 55 }],
    [/tokio|tokyo|jap[oó]n|sakura/, { h: [340, 200, 0], s: 65, l: 60 }], [/lavanda|lavender|lila/, { h: [255, 280], s: 50, l: 72 }],
  ];
  function fromWords(text) {
    const t = text.toLowerCase(), found = MOODS.filter(([re]) => re.test(t)).map(m => m[1]);
    if (!found.length) { let x = 0; for (const c of t) x = (x * 31 + c.charCodeAt(0)) % 360; return fromHue(x, 'libre', 5); }
    const hues = found.flatMap(m => m.h), s = found.reduce((a, m) => a + m.s, 0) / found.length, l = found.reduce((a, m) => a + m.l, 0) / found.length;
    return Array.from({ length: 5 }, (_, i) => hslToHex(hues[i % hues.length] + rnd(-10, 10), clamp(s + rnd(-15, 15), 5, 100), clamp(l + [-14, 0, 10, -6, 18][i] + rnd(-4, 4), 8, 94)));
  }

  // ---------- exportar ----------
  function ase(cols, name) {
    const blocks = cols.map((h, i) => {
      const nm = `${name} ${i + 1}`, nameLen = nm.length + 1, len = 2 + nameLen * 2 + 4 + 12 + 2;
      const buf = new ArrayBuffer(6 + len), dv = new DataView(buf); let p = 0;
      dv.setUint16(p, 1); p += 2; dv.setUint32(p, len); p += 4; dv.setUint16(p, nameLen); p += 2;
      for (const ch of nm) { dv.setUint16(p, ch.charCodeAt(0)); p += 2; } dv.setUint16(p, 0); p += 2;
      [...'RGB '].forEach(c => dv.setUint8(p++, c.charCodeAt(0)));
      hexToRgb(h).forEach(v => { dv.setFloat32(p, v / 255); p += 4; }); dv.setUint16(p, 2);
      return new Uint8Array(buf);
    });
    const head = new DataView(new ArrayBuffer(12));
    [...'ASEF'].forEach((c, i) => head.setUint8(i, c.charCodeAt(0))); head.setUint16(4, 1); head.setUint16(6, 0); head.setUint32(8, cols.length);
    return new Blob([head.buffer, ...blocks], { type: 'application/octet-stream' });
  }
  async function procreate(cols, name) {
    await BD.loadScript(BD.LIB.jszip);
    const zip = new JSZip();
    zip.file('Swatches.json', JSON.stringify([{ name, swatches: cols.map(h => { const [hh, s, v] = rgbToHsv(...hexToRgb(h)); return { hue: hh, saturation: s, brightness: v, alpha: 1, colorSpace: 0 }; }) }]));
    return zip.generateAsync({ type: 'blob' });
  }
  const gpl = (cols, name) => `GIMP Palette\nName: ${name}\nColumns: ${cols.length}\n#\n` + cols.map(h => `${hexToRgb(h).map(v => String(v).padStart(3)).join(' ')}\t${h}`).join('\n') + '\n';
  const blender = (cols, name) => `# Blender → Scripting → pega esto y pulsa ▶\nimport bpy\npal = bpy.data.palettes.new(${JSON.stringify(name)})\nfor c in ${JSON.stringify(cols.map(h => hexToRgb(h).map(v => +(v / 255).toFixed(4))))}:\n    pal.colors.new().color = c\n`;
  const css = cols => ':root {\n' + cols.map((h, i) => `  --color-${i + 1}: ${h};`).join('\n') + '\n}';
  async function png(cols) {
    const c = document.createElement('canvas'), w = 240; c.width = w * cols.length; c.height = 320;
    const x = c.getContext('2d');
    cols.forEach((h, i) => { x.fillStyle = h; x.fillRect(i * w, 0, w, 260); x.fillStyle = '#fff'; x.fillRect(i * w, 260, w, 60); x.fillStyle = '#141414'; x.font = '600 26px monospace'; x.textAlign = 'center'; x.fillText(h.toUpperCase(), i * w + w / 2, 300); });
    return BD.canvasBlob(c, 'image/png');
  }

  BD.tool({
    path: '/paletas', cat: 'creativo', title: 'Generador de paletas', short: 'Paletas', icon: BD.icon('swatch'),
    colors: ['#ffc6e0', '#ff6fb5'], desc: 'Paletas desde un color, una foto o una palabra ("otoño en Tokio"). Exporta para Procreate, Photoshop, Krita y Blender.',
    render(view) {
      const body = win(view, { title: L('Generador de paletas', 'Palette generator'), sub: L(
        'Crea una paleta desde un color, una foto o una palabra. Bloquea los colores que te gusten 🔒 y pulsa la barra espaciadora para regenerar el resto. Exporta directo a tus programas.',
        'Make a palette from a color, a photo or a word. Lock the colors you like 🔒 and press the space bar to regenerate the rest. Export straight to your apps.') });
      let st = Object.assign({ cols: fromHue(rnd(0, 360), 'analogo'), locked: [], scheme: 'analogo', base: '#ff6fb5', word: '', name: L('Mi paleta', 'My palette') }, store.get('pal:state', {}));
      body.innerHTML = `
        <div class="pal-strip" id="pStrip" translate="no"></div>
        <div class="row" style="margin:14px 0;justify-content:center">
          <button class="btn primary" id="pGen">🎲 ${L('Generar', 'Generate')} <span class="muted small">(${L('espacio', 'space')})</span></button>
          <label class="btn ghost">${L('Color base', 'Base color')} <input type="color" id="pBase" value="${st.base}" style="width:34px;height:24px;padding:0;border:0;background:none"></label>
          <span class="muted small" id="pContrast"></span>
        </div>
        <div class="split">
          <div class="stack">
            <div class="card stack">
              <div class="field"><span>${L('Armonía', 'Harmony')}</span><div id="pScheme"></div></div>
              <label class="field"><span>${L('Desde una palabra o frase', 'From a word or phrase')}</span>
                <div class="row"><input type="text" id="pWord" value="${esc(st.word)}" placeholder="${L('otoño en Tokio, bosque neón, café pastel…', 'autumn in Tokyo, neon forest, pastel coffee…')}" style="flex:1;min-width:160px">
                <button class="btn ghost sm" id="pWordGo">${L('Crear', 'Create')}</button><button class="btn ghost sm" id="pWordAI">✨ IA</button></div></label>
              <div class="field"><span>${L('Desde una foto', 'From a photo')}</span><div id="pDrop"></div></div>
            </div>
          </div>
          <div class="stack">
            <div class="card stack">
              <label class="field"><span>${L('Nombre', 'Name')}</span><input type="text" id="pName" value="${esc(st.name)}"></label>
              <span class="label">${L('Exportar', 'Export')}</span>
              <div class="row">
                <button class="btn ghost sm" data-x="procreate">Procreate (.swatches)</button>
                <button class="btn ghost sm" data-x="ase">Photoshop / Illustrator (.ase)</button>
                <button class="btn ghost sm" data-x="gpl">GIMP / Krita / Inkscape (.gpl)</button>
                <button class="btn ghost sm" data-x="blender">Blender (script)</button>
                <button class="btn ghost sm" data-x="png">PNG</button>
                <button class="btn ghost sm" data-x="css">CSS</button>
                <button class="btn ghost sm" data-x="hex">HEX</button>
              </div>
              <button class="btn primary sm" id="pSave">★ ${L('Guardar paleta', 'Save palette')}</button>
            </div>
            <div class="card"><h3>${L('Mis paletas', 'My palettes')}</h3><div class="stack" id="pSaved"></div></div>
          </div>
        </div>`;

      const save = () => store.set('pal:state', st);
      function paint() {
        save();
        $('#pStrip', body).innerHTML = st.cols.map((h, i) => `
          <div class="pal-sw" style="background:${h};color:${luma(h) > 150 ? '#141414' : '#fff'}">
            <button class="pal-lock" data-lock="${i}" title="${L('Bloquear', 'Lock')}">${st.locked.includes(i) ? '🔒' : '🔓'}</button>
            <label class="pal-hex">${h.toUpperCase()}<input type="color" data-edit="${i}" value="${h}"></label>
            <span class="small" style="opacity:.8">${esc(BD.creative ? BD.creative.colorName(...hexToRgb(h)) : '')}</span>
          </div>`).join('');
        // contraste entre el más claro y el más oscuro (WCAG aprox.)
        const ls = st.cols.map(h => hexToRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; })).map(([r, g, b]) => .2126 * r + .7152 * g + .0722 * b);
        const ratio = (Math.max(...ls) + .05) / (Math.min(...ls) + .05);
        $('#pContrast', body).textContent = L(`Contraste máx.: ${ratio.toFixed(1)}:1 ${ratio >= 4.5 ? '✓ legible' : '· poco contraste para texto'}`, `Max contrast: ${ratio.toFixed(1)}:1 ${ratio >= 4.5 ? '✓ readable' : '· low contrast for text'}`);
      }
      const apply = cols => { st.cols = st.cols.map((h, i) => st.locked.includes(i) ? h : cols[i] || h); paint(); };
      const gen = () => apply(fromHue(rgbToHsl(...hexToRgb(st.base))[0] + (st.scheme === 'libre' ? 0 : rnd(-20, 20)), st.scheme));
      BD.seg($('#pScheme', body), SCHEMES(), st.scheme, v => { st.scheme = v; gen(); });
      $('#pGen', body).onclick = () => { st.base = hslToHex(rnd(0, 360), 60, 55); $('#pBase', body).value = st.base; gen(); };
      $('#pBase', body).oninput = e => { st.base = e.target.value; gen(); };
      $('#pStrip', body).onclick = e => { const l = e.target.closest('[data-lock]'); if (l) { const i = +l.dataset.lock; st.locked = st.locked.includes(i) ? st.locked.filter(x => x !== i) : [...st.locked, i]; paint(); } };
      $('#pStrip', body).oninput = e => { const i = e.target.dataset.edit; if (i !== undefined) { st.cols[i] = e.target.value; if (!st.locked.includes(+i)) st.locked.push(+i); paint(); } };
      $('#pWordGo', body).onclick = () => { st.word = $('#pWord', body).value.trim(); if (st.word) { apply(fromWords(st.word)); st.name = st.word; $('#pName', body).value = st.word; save(); } };
      $('#pWord', body).onkeydown = e => { if (e.key === 'Enter') $('#pWordGo', body).click(); };
      $('#pWordAI', body).onclick = async e => {
        const w = $('#pWord', body).value.trim(); if (!w) return toast(L('Escribe una palabra o frase', 'Type a word or phrase'), 'bad');
        const btn = e.currentTarget; btn.disabled = true;
        try {
          const r = await BD.anyAI(`Create a 5-color palette that evokes: "${w}". Balanced lights and darks, usable for illustration. Reply only JSON: {"colors":["#rrggbb","#rrggbb","#rrggbb","#rrggbb","#rrggbb"]}`,
            { json: true, system: 'You are a color designer. Reply with valid JSON only.' });
          const cols = (r.colors || r).filter(c => /^#[0-9a-f]{6}$/i.test(c));
          if (cols.length < 3) throw new Error(L('La IA no devolvió colores válidos', 'The AI returned no valid colors'));
          apply(cols); st.name = w; $('#pName', body).value = w; save();
        } catch (err) { toast(err.message, 'bad'); }
        btn.disabled = false;
      };
      BD.dropzone($('#pDrop', body), {
        accept: 'image/*', multiple: false, icon: '🖼️', label: L('Suelta una foto o pega con Ctrl+V', 'Drop a photo or paste with Ctrl+V'), hint: L('Se extraen sus colores dominantes', 'Its dominant colors are extracted'),
        async onFiles([f]) { st.locked = []; apply((await BD.creative.palette(f, 5)).map(c => c.hex)); },
      });
      const onKey = e => { if (e.code === 'Space' && !e.target.closest('input,textarea,select,button')) { e.preventDefault(); gen(); } };
      document.addEventListener('keydown', onKey);

      body.addEventListener('click', async e => {
        const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return;
        st.name = $('#pName', body).value.trim() || 'BrainDeck'; save();
        const n = st.name.replace(/[\\/:*?"<>|]/g, ''), c = st.cols;
        if (x === 'procreate') BD.download(await procreate(c, n), n + '.swatches');
        if (x === 'ase') BD.download(ase(c, n), n + '.ase');
        if (x === 'gpl') BD.download(new Blob([gpl(c, n)], { type: 'text/plain' }), n + '.gpl');
        if (x === 'blender') BD.copy(blender(c, n), L('Script copiado: pégalo en Blender → Scripting', 'Script copied: paste it in Blender → Scripting'));
        if (x === 'png') BD.download(await png(c), n + '.png');
        if (x === 'css') BD.copy(css(c));
        if (x === 'hex') BD.copy(c.join(', '));
      });
      const paintSaved = () => {
        $('#pSaved', body).innerHTML = store.get('pal:saved', []).map((p, i) => `
          <div class="row" translate="no"><div class="pal-mini" data-load="${i}" title="${L('Cargar', 'Load')}">${p.cols.map(h => `<i style="background:${h}"></i>`).join('')}</div>
          <span class="small" style="flex:1">${esc(p.name)}</span><button class="icon-btn" data-del="${i}">✕</button></div>`).join('') || `<p class="muted small">${L('Aún no guardas paletas.', 'No saved palettes yet.')}</p>`;
      };
      $('#pSave', body).onclick = () => { const all = store.get('pal:saved', []); all.unshift({ name: $('#pName', body).value.trim() || 'BrainDeck', cols: [...st.cols] }); store.set('pal:saved', all.slice(0, 60)); paintSaved(); toast(L('Paleta guardada ★', 'Palette saved ★')); };
      $('#pSaved', body).onclick = e => {
        const ld = e.target.closest('[data-load]'), d = e.target.closest('[data-del]'), all = store.get('pal:saved', []);
        if (ld) { const p = all[+ld.dataset.load]; st.cols = [...p.cols]; st.locked = []; st.name = p.name; $('#pName', body).value = p.name; paint(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        if (d) { all.splice(+d.dataset.del, 1); store.set('pal:saved', all); paintSaved(); }
      };
      paint(); paintSaved();
      return () => document.removeEventListener('keydown', onKey);
    },
  });
})();
